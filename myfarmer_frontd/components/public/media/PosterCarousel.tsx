"use client";

import { useRef, useState } from "react";

import type { PublicMedia } from "@/lib/media";
import { PosterModal } from "./PosterModal";

export function PosterCarousel({ posters }: { posters: PublicMedia[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activePoster, setActivePoster] = useState<PublicMedia | null>(null);

  if (!posters.length) return null;

  function scroll(direction: -1 | 1) {
    const element = scrollRef.current;
    if (!element) return;
    element.scrollBy({
      left: direction * element.clientWidth,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }

  return (
    <section aria-labelledby="poster-media-title">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 id="poster-media-title" className="text-[20px] font-semibold text-[#0f1f17]">Poster Informasi</h2>
          <p className="mt-1 text-sm text-[#6b8f78]">Klik poster untuk melihat ukuran penuh.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => scroll(-1)} aria-label="Poster sebelumnya" className="inline-flex size-10 items-center justify-center rounded-full border border-green-100 bg-white text-xl text-[#15803d] hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500">‹</button>
          <button type="button" onClick={() => scroll(1)} aria-label="Poster berikutnya" className="inline-flex size-10 items-center justify-center rounded-full border border-green-100 bg-white text-xl text-[#15803d] hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500">›</button>
        </div>
      </div>

      <div ref={scrollRef} className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:thin] [scrollbar-color:#86b990_transparent]">
        {posters.map((poster) => (
          <button
            key={poster.id}
            type="button"
            onClick={() => setActivePoster(poster)}
            className="group min-w-full snap-start overflow-hidden rounded-[22px] border border-green-100 bg-white text-left sm:min-w-[calc(50%-0.5rem)] lg:min-w-[calc(33.333%-0.667rem)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
          >
            <span className="block aspect-[4/5] overflow-hidden bg-green-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={poster.file_url} alt={poster.alt_text} loading="lazy" className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transition-none" />
            </span>
            <span className="block truncate px-4 py-3 text-sm font-semibold text-[#0f1f17]">{poster.judul}</span>
          </button>
        ))}
      </div>

      <PosterModal poster={activePoster} onClose={() => setActivePoster(null)} />
    </section>
  );
}
