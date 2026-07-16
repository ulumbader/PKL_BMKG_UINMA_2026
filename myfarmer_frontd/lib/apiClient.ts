import { getAuthToken } from "./auth";

export type ApiSuccess<T> = {
  status: "success";
  message: string;
  data: T;
};

export type PaginatedData<T> = {
  current_page?: number;
  data?: T[];
  last_page?: number;
  per_page?: number;
  total?: number;
};

type ApiFailure = {
  status: "error";
  message: string;
  errors?: unknown;
  data?: unknown;
};

type ApiPayload<T> = ApiSuccess<T> | ApiFailure;
type JsonBody = Record<string, unknown> | unknown[] | string | number | boolean | null;
type ApiBody = BodyInit | JsonBody;
type ApiRequestInit = Omit<RequestInit, "body" | "method"> & { body?: ApiBody };

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export class ApiError extends Error {
  statusCode: number;
  errors?: unknown;

  constructor(message: string, statusCode: number, errors?: unknown) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

function buildUrl(path: string) {
  if (!API_BASE_URL) throw new Error("NEXT_PUBLIC_API_BASE_URL belum diatur.");

  const baseUrl = API_BASE_URL.replace(/\/+$/, "");
  const endpoint = path.replace(/^\/?api(?=\/)/, "").replace(/^\/+/, "");

  return `${baseUrl}/${endpoint}`;
}

function prepareBody(body: ApiBody | undefined, headers: Headers) {
  if (body === undefined) return undefined;

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const isBlob = typeof Blob !== "undefined" && body instanceof Blob;
  const isUrlSearchParams = body instanceof URLSearchParams;

  if (isFormData || isBlob || isUrlSearchParams || typeof body === "string") {
    return body as BodyInit;
  }

  headers.set("Content-Type", "application/json");
  return JSON.stringify(body);
}

async function apiRequest<T>(
  method: string,
  path: string,
  init: ApiRequestInit = {},
): Promise<ApiSuccess<T>> {
  const headers = new Headers(init.headers);
  const token = getAuthToken();

  headers.set("Accept", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(buildUrl(path), {
    ...init,
    method,
    headers,
    body: prepareBody(init.body, headers),
  });
  const payload = (await response.json().catch(() => null)) as ApiPayload<T> | null;
  const message = payload?.message || "Request ke backend gagal.";

  if (!payload || !response.ok || payload.status === "error") {
    throw new ApiError(message, response.status, payload?.status === "error" ? payload.errors : undefined);
  }

  if (payload.status !== "success") {
    throw new ApiError("Response backend tidak valid.", response.status);
  }

  return payload;
}

export function apiGet<T>(path: string, init?: Omit<ApiRequestInit, "body">) {
  return apiRequest<T>("GET", path, init);
}

function pathWithPage(path: string, page: number) {
  const [pathname, query = ""] = path.split("?", 2);
  const params = new URLSearchParams(query);
  params.set("page", String(page));
  return `${pathname}?${params.toString()}`;
}

/**
 * Mengambil seluruh halaman dari endpoint paginator Laravel.
 * Dipakai untuk dropdown yang harus menampilkan semua pilihan, bukan hanya
 * halaman pertama dari endpoint list.
 */
export async function apiGetAllPages<T>(
  path: string,
  init?: Omit<ApiRequestInit, "body">,
) {
  const firstResponse = await apiGet<PaginatedData<T>>(pathWithPage(path, 1), init);
  const items = [...(firstResponse.data.data ?? [])];
  const lastPage = Math.max(1, firstResponse.data.last_page ?? 1);

  for (let page = 2; page <= lastPage; page += 1) {
    const response = await apiGet<PaginatedData<T>>(pathWithPage(path, page), init);
    items.push(...(response.data.data ?? []));
  }

  return items;
}

export function apiPost<T>(path: string, body?: ApiBody, init?: Omit<ApiRequestInit, "body">) {
  return apiRequest<T>("POST", path, { ...init, body });
}

export function apiPut<T>(path: string, body?: ApiBody, init?: Omit<ApiRequestInit, "body">) {
  return apiRequest<T>("PUT", path, { ...init, body });
}

export function apiDelete<T>(path: string, init?: Omit<ApiRequestInit, "body">) {
  return apiRequest<T>("DELETE", path, init);
}
