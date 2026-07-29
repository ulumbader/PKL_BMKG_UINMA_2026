"use client";

import { useState } from "react";

import type { PublicMedia } from "@/lib/media";

export function PdfViewerSection({ documents }: { documents: PublicMedia[] }) {
  const [activeId, setActiveId] = useState(documents[0]?.id ?? 0);
  const active = documents.find((document) => document.id === activeId) ?? documents[0];

  if (!active) return null;

  return (
    <section aria-labelledby="pdf-media-title">
      <div className="mb-4">
        <h2 id="pdf-media-title" className="text-[20px] font-semibold text-[#0f1f17]">Dokumen PDF</h2>
        <p className="mt-1 text-sm text-[#6b8f78]">Baca panduan langsung tanpa meninggalkan halaman.</p>
      </div>

      {documents.length > 1 ? (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Pilih dokumen PDF">
          {documents.map((document) => (
            <button
              key={document.id}
              type="button"
              role="tab"
              aria-selected={document.id === active.id}
              onClick={() => setActiveId(document.id)}
              className={[
                "shrink-0 rounded-full border px-4 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500",
                document.id === active.id ? "border-[#16a34a] bg-[#16a34a] text-white" : "border-green-100 bg-white text-[#0f1f17] hover:bg-green-50",
              ].join(" ")}
            >
              {document.judul}
            </button>
          ))}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-[22px] border border-green-100 bg-white">
        <div className="flex flex-col gap-3 border-b border-green-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <h3 className="font-semibold text-[#0f1f17]">{active.judul}</h3>
          <div className="flex flex-wrap gap-2">
            {active.url_sumber ? (
              <a href={active.url_sumber} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center justify-center rounded-xl border border-green-200 bg-white px-4 text-sm font-semibold text-[#15803d] hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500">Kunjungi Sumber</a>
            ) : null}
            <a href={active.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center justify-center rounded-xl bg-[#16a34a] px-4 text-sm font-semibold text-white hover:bg-[#15803d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500">Buka PDF</a>
          </div>
        </div>
        <iframe
          key={active.id}
          src={active.file_url}
          title={`PDF ${active.judul}`}
          loading="lazy"
          className="h-[68svh] min-h-[420px] w-full bg-[#f7f8f5] sm:min-h-[560px]"
        >
          Browser tidak mendukung viewer PDF. Gunakan tautan Buka PDF.
        </iframe>
      </div>
    </section>
  );
}
