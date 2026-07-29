"use client";

import type { PublicMedia } from "@/lib/media";
import { MediaModal, ModalCloseButton } from "./MediaModal";

export function PosterModal({ poster, onClose }: { poster: PublicMedia | null; onClose: () => void }) {
  if (!poster) return null;

  return (
    <MediaModal open title={`Poster: ${poster.judul}`} onClose={onClose}>
      <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-green-100 bg-white px-5 py-4">
        <h3 className="min-w-0 truncate text-lg font-semibold">{poster.judul}</h3>
        <ModalCloseButton onClick={onClose} />
      </div>
      <div className="p-4 sm:p-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={poster.file_url} alt={poster.alt_text} className="mx-auto max-h-[68svh] w-auto max-w-full rounded-xl object-contain" />
        {poster.url_sumber ? (
          <div className="mt-5 flex justify-end">
            <a href={poster.url_sumber} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center justify-center rounded-xl bg-[#16a34a] px-5 text-sm font-semibold text-white hover:bg-[#15803d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2">
              Kunjungi Sumber
            </a>
          </div>
        ) : null}
      </div>
    </MediaModal>
  );
}
