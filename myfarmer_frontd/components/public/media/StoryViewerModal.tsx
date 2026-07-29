"use client";

import { useEffect } from "react";

import type { PublicMedia } from "@/lib/media";
import { MediaModal, ModalCloseButton } from "./MediaModal";

export function StoryViewerModal({
  stories,
  index,
  onIndexChange,
  onClose,
}: {
  stories: PublicMedia[];
  index: number | null;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const story = index === null ? null : stories[index];
  const hasPrevious = index !== null && index > 0;
  const hasNext = index !== null && index < stories.length - 1;

  useEffect(() => {
    if (!story || story.jenis_media !== "image" || index === null) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setTimeout(() => {
      if (hasNext) onIndexChange(index + 1);
      else onClose();
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [hasNext, index, onClose, onIndexChange, story]);

  if (!story || index === null) return null;

  return (
    <MediaModal open title={`Sorotan: ${story.judul}`} onClose={onClose} dark>
      <div className="relative flex min-h-[min(78svh,720px)] items-center justify-center bg-black">
        <div className="absolute left-4 right-4 top-4 z-20 flex items-center justify-between gap-3">
          <div className="min-w-0 rounded-full bg-black/60 px-4 py-2">
            <p className="truncate text-sm font-semibold text-white">{story.judul}</p>
            <p className="text-xs text-white/70">{index + 1} dari {stories.length}</p>
          </div>
          <ModalCloseButton onClick={onClose} />
        </div>

        {story.jenis_media === "video" ? (
          <video
            key={story.file_url}
            src={story.file_url}
            controls
            autoPlay
            playsInline
            preload="metadata"
            onEnded={() => (hasNext ? onIndexChange(index + 1) : onClose())}
            className="max-h-[78svh] w-full object-contain"
            aria-label={story.alt_text}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={story.file_url} alt={story.alt_text} className="max-h-[78svh] w-full object-contain" />
        )}

        <button
          type="button"
          onClick={() => onIndexChange(index - 1)}
          disabled={!hasPrevious}
          aria-label="Sorotan sebelumnya"
          className="absolute left-3 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-2xl text-white disabled:invisible focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={() => onIndexChange(index + 1)}
          disabled={!hasNext}
          aria-label="Sorotan berikutnya"
          className="absolute right-3 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-2xl text-white disabled:invisible focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          ›
        </button>
      </div>
    </MediaModal>
  );
}
