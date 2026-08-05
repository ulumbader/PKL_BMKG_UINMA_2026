"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import type { PublicMedia } from "@/lib/media";
import { MediaModal, ModalCloseButton } from "./MediaModal";

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(onChange: () => void) {
  const mediaQuery = window.matchMedia(reducedMotionQuery);
  mediaQuery.addEventListener("change", onChange);
  return () => mediaQuery.removeEventListener("change", onChange);
}

function prefersReducedMotion() {
  return window.matchMedia(reducedMotionQuery).matches;
}

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
  const [isMuted, setIsMuted] = useState(true);
  const story = index === null ? null : stories[index];
  const hasPrevious = index !== null && index > 0;
  const hasNext = index !== null && index < stories.length - 1;

  useEffect(() => {
    if (!story || index === null) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft" && hasPrevious) {
        event.preventDefault();
        onIndexChange(index - 1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        if (hasNext) onIndexChange(index + 1);
        else onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [hasNext, hasPrevious, index, onClose, onIndexChange, story]);

  if (!story || index === null) return null;

  const goNext = () => (hasNext ? onIndexChange(index + 1) : onClose());

  return (
    <MediaModal open title={`Sorotan: ${story.judul}`} onClose={onClose} dark layout="story">
      <StorySlide
        key={`${story.id}-${index}`}
        story={story}
        index={index}
        total={stories.length}
        hasPrevious={hasPrevious}
        onPrevious={() => onIndexChange(index - 1)}
        onNext={goNext}
        onClose={onClose}
        isMuted={isMuted}
        onMutedChange={setIsMuted}
      />
    </MediaModal>
  );
}

function StorySlide({
  story,
  index,
  total,
  hasPrevious,
  onPrevious,
  onNext,
  onClose,
  isMuted,
  onMutedChange,
}: {
  story: PublicMedia;
  index: number;
  total: number;
  hasPrevious: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onClose: () => void;
  isMuted: boolean;
  onMutedChange: (isMuted: boolean) => void;
}) {
  const slideRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const completedRef = useRef(false);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [motionOverride, setMotionOverride] = useState(false);
  const reducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    prefersReducedMotion,
    () => true,
  );
  const paused = story.jenis_media === "image"
    ? isPaused || (reducedMotion && !motionOverride)
    : isPaused;

  useEffect(() => {
    const activeElement = document.activeElement;
    if (!slideRef.current?.contains(activeElement)) {
      slideRef.current?.querySelector<HTMLElement>("button:not([disabled])")?.focus();
    }
  }, [story.id]);

  useEffect(() => {
    if (
      story.jenis_media !== "image"
      || paused
    ) return;

    const timer = window.setInterval(() => {
      setProgress((current) => Math.min(current + 1, 100));
    }, 50);
    return () => window.clearInterval(timer);
  }, [paused, story.jenis_media]);

  useEffect(() => {
    if (story.jenis_media !== "image" || progress < 100 || completedRef.current) return;
    completedRef.current = true;
    onNext();
  }, [onNext, progress, story.jenis_media]);

  function togglePlayback() {
    if (story.jenis_media === "image") {
      if (reducedMotion && !motionOverride) {
        setMotionOverride(true);
        setIsPaused(false);
        return;
      }
      setIsPaused((current) => !current);
      return;
    }

    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play().catch(() => setIsPaused(true));
    else video.pause();
  }

  return (
    <div ref={slideRef} className="relative h-full w-full overflow-hidden bg-black">
      {story.jenis_media === "video" ? (
        <video
          ref={videoRef}
          src={story.file_url}
          autoPlay
          playsInline
          muted={isMuted}
          preload="metadata"
          onPlay={() => setIsPaused(false)}
          onPause={() => setIsPaused(true)}
          onTimeUpdate={(event) => {
            const video = event.currentTarget;
            setProgress(video.duration ? (video.currentTime / video.duration) * 100 : 0);
          }}
          onEnded={onNext}
          className="h-full w-full object-contain"
          aria-label={story.alt_text}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={story.file_url} alt={story.alt_text} className="h-full w-full object-contain" />
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-36 bg-gradient-to-b from-black/75 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-28 bg-gradient-to-t from-black/35 to-transparent" />

      <div className="absolute inset-x-0 top-0 z-30 px-3 pt-2.5 sm:px-4 sm:pt-3">
        <div className="flex gap-1" aria-hidden="true">
          {Array.from({ length: total }, (_, segmentIndex) => (
            <span key={segmentIndex} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/35">
              <span
                className="block h-full rounded-full bg-white transition-[width] duration-75 ease-linear motion-reduce:transition-none"
                style={{ width: `${segmentIndex < index ? 100 : segmentIndex === index ? progress : 0}%` }}
              />
            </span>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2.5">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-white bg-[#16a34a] text-[11px] font-bold text-white">
            MF
          </span>
          <div className="min-w-0 flex-1" aria-live="polite">
            <p className="truncate text-sm font-semibold text-white">{story.judul}</p>
            <p className="text-[11px] text-white/75">Sorotan · {index + 1}/{total}</p>
          </div>
          <button
            type="button"
            onClick={togglePlayback}
            aria-label={paused ? "Putar sorotan" : "Jeda sorotan"}
            className="inline-flex size-10 items-center justify-center rounded-full text-base text-white hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <span aria-hidden="true">{paused ? "\u25b6" : "\u275a\u275a"}</span>
          </button>
          {story.jenis_media === "video" ? (
            <button
              type="button"
              onClick={() => onMutedChange(!isMuted)}
              aria-label={isMuted ? "Aktifkan suara" : "Bisukan suara"}
              className="inline-flex size-10 items-center justify-center rounded-full text-base text-white hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 5 7 9H4v6h3l4 4V5Z" />
                {isMuted ? <path d="m15 9 5 6m0-6-5 6" /> : <path d="M15.5 8.5a5 5 0 0 1 0 7" />}
              </svg>
            </button>
          ) : null}
          <ModalCloseButton onClick={onClose} />
        </div>
      </div>

      <button
        type="button"
        onClick={onPrevious}
        disabled={!hasPrevious}
        aria-label="Sorotan sebelumnya"
        className="absolute bottom-0 left-0 top-20 z-10 w-1/3 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white"
      />
      <button
        type="button"
        onClick={togglePlayback}
        aria-label={paused ? "Putar sorotan" : "Jeda sorotan"}
        className="absolute bottom-0 left-1/3 right-1/3 top-20 z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white"
      />
      <button
        type="button"
        onClick={onNext}
        aria-label="Sorotan berikutnya"
        className="absolute bottom-0 right-0 top-20 z-10 w-1/3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white"
      />
    </div>
  );
}
