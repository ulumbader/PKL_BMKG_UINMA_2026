"use client";

import { useRef, useState } from "react";

import type { PublicMedia } from "@/lib/media";
import { StoryViewerModal } from "./StoryViewerModal";

export function StoryHighlights({ stories }: { stories: PublicMedia[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (!stories.length) return null;

  function scroll(direction: -1 | 1) {
    scrollRef.current?.scrollBy({
      left: direction * Math.max(240, scrollRef.current.clientWidth * 0.75),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }

  return (
    <section aria-labelledby="sorotan-media-title">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 id="sorotan-media-title" className="text-[20px] font-semibold text-[#0f1f17]">Sorotan</h2>
          <p className="mt-1 text-sm text-[#6b8f78]">Cerita terbaru seputar pertanian dan cuaca.</p>
        </div>
        <div className="hidden gap-2 sm:flex">
          <button type="button" onClick={() => scroll(-1)} aria-label="Geser sorotan ke kiri" className="inline-flex size-10 items-center justify-center rounded-full border border-green-100 bg-white text-xl text-[#15803d] hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500">‹</button>
          <button type="button" onClick={() => scroll(1)} aria-label="Geser sorotan ke kanan" className="inline-flex size-10 items-center justify-center rounded-full border border-green-100 bg-white text-xl text-[#15803d] hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500">›</button>
        </div>
      </div>

      <div ref={scrollRef} className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:thin] [scrollbar-color:#86b990_transparent]">
        {stories.map((story, index) => (
          <button
            key={story.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            className="group w-[92px] shrink-0 snap-start text-center focus-visible:outline-none"
            aria-label={`Buka sorotan ${story.judul}`}
          >
            <span className="mx-auto block size-[78px] rounded-full bg-[#16a34a] p-[3px] group-focus-visible:ring-2 group-focus-visible:ring-green-600 group-focus-visible:ring-offset-2">
              <span className="block size-full overflow-hidden rounded-full border-2 border-white bg-green-50">
                {story.thumbnail_url || story.jenis_media === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={story.thumbnail_url ?? story.file_url} alt="" loading="lazy" className="size-full object-cover" />
                ) : (
                  <video src={story.file_url} preload="metadata" muted playsInline className="size-full object-cover" aria-hidden="true" />
                )}
              </span>
            </span>
            <span className="mt-2 block line-clamp-2 text-xs font-medium leading-4 text-[#0f1f17]">{story.judul}</span>
          </button>
        ))}
      </div>

      <StoryViewerModal stories={stories} index={activeIndex} onIndexChange={setActiveIndex} onClose={() => setActiveIndex(null)} />
    </section>
  );
}
