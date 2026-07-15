import { getAuthToken } from "./auth";

export type ApiSuccess<T> = {
  status: "success";
  message: string;
  data: T;
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

export function apiPost<T>(path: string, body?: ApiBody, init?: Omit<ApiRequestInit, "body">) {
  return apiRequest<T>("POST", path, { ...init, body });
}

export function apiPut<T>(path: string, body?: ApiBody, init?: Omit<ApiRequestInit, "body">) {
  return apiRequest<T>("PUT", path, { ...init, body });
}

export function apiDelete<T>(path: string, init?: Omit<ApiRequestInit, "body">) {
  return apiRequest<T>("DELETE", path, init);
}
