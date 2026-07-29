"use client";

import { PosterCarousel } from "./PosterCarousel";
import { PdfViewerSection } from "./PdfViewerSection";
import { StoryHighlights } from "./StoryHighlights";
import { useLandingMedia } from "./useLandingMedia";

export function LandingMediaSection() {
  const { data, loading, error, retry } = useLandingMedia();
  const hasMedia = data.sorotan.length + data.poster.length + data.pdf.length > 0;

  if (loading) {
    return (
      <section aria-label="Memuat media" className="mb-10 space-y-4">
        <div className="h-6 w-36 animate-pulse rounded bg-green-100 motion-reduce:animate-none" />
        <div className="h-36 animate-pulse rounded-[22px] bg-white motion-reduce:animate-none" />
      </section>
    );
  }

  if (error) {
    return (
      <section className="mb-10 rounded-[22px] border border-green-100 bg-white p-5" role="status">
        <p className="text-sm text-[#6b8f78]">{error}</p>
        <button type="button" onClick={retry} className="mt-3 rounded-xl bg-[#16a34a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#15803d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500">Coba lagi</button>
      </section>
    );
  }

  if (!hasMedia) return null;

  return (
    <div className="mb-10 space-y-10">
      <StoryHighlights stories={data.sorotan} />
      <PosterCarousel posters={data.poster} />
      <PdfViewerSection documents={data.pdf} />
    </div>
  );
}
