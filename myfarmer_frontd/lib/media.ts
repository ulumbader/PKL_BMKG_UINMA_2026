import { apiGet } from "@/lib/apiClient";

export type MediaType = "sorotan" | "poster" | "pdf";
export type MediaKind = "image" | "video" | "pdf";

export type PublicMedia = {
  id: number;
  judul: string;
  tipe: MediaType;
  jenis_media: MediaKind;
  file_url: string;
  thumbnail_url: string | null;
  url_sumber: string | null;
  alt_text: string;
};

export type PublicMediaGroups = {
  sorotan: PublicMedia[];
  poster: PublicMedia[];
  pdf: PublicMedia[];
};

export async function getPublicMedia(signal?: AbortSignal) {
  const response = await apiGet<PublicMediaGroups>("/publik/media", { signal });
  return response.data;
}
