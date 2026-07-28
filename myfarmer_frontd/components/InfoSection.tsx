"use client";
import React, { useEffect, useState } from "react";
import {
  BACKEND_CARD_SURFACE_CLASS,
  BackendCardContent,
  type BackendInfoCard,
} from "./BackendCards";

function frameClass(index: number, activeIndex: number, total: number) {
  const offset = (index - activeIndex + total) % total;

  if (offset === 0) {
    return "left-0 w-full opacity-100 z-20 sm:left-[38%] sm:w-[62%]";
  }

  if (offset === total - 1) {
    return "-left-full w-full opacity-0 z-10 sm:left-0 sm:w-[38%] sm:opacity-100";
  }

  if (offset === 1) {
    return "left-full w-full opacity-0 z-0 sm:w-[62%]";
  }

  return "left-full w-full opacity-0 z-0 sm:w-[62%]";
}

export function InfoSection({ cards }: { cards: BackendInfoCard[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const safeActiveIndex = cards.length === 0 ? 0 : activeIndex % cards.length;
  const selectedCard = cards.length > 0 ? cards[selectedIndex % cards.length] : null;

  const handleOpenModal = (index: number) => {
    setSelectedIndex(index);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  useEffect(() => {
    if (cards.length < 2 || isModalOpen) return;

    const timer = setInterval(() => {
      setActiveIndex((current) => (current + 1) % cards.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [cards.length, isModalOpen]);

  const goTo = (nextIndex: number) => {
    if (!cards.length) return;
    setActiveIndex((nextIndex + cards.length) % cards.length);
  };

  return (
    <section className="mb-6">
      <div className="text-[20px] font-semibold mb-3">Info</div>

      <div className="-mx-4 px-4 -my-8 py-8 overflow-hidden">
        <div className="relative h-[220px]">
          {cards.map((card, index) => (
            <button
              type="button"
              key={card.id}
              onClick={() => handleOpenModal(index)}
              className={[
                "absolute top-0 h-full text-left transition-[left,width,opacity] duration-1000 ease-in-out",
                BACKEND_CARD_SURFACE_CLASS,
                frameClass(index, safeActiveIndex, cards.length),
              ].join(" ")}
            >
              <BackendCardContent card={card} />
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-center gap-2">
        <button
          type="button"
          aria-label="Info sebelumnya"
          onClick={() => goTo(activeIndex - 1)}
          className="h-6 w-6 text-[18px] font-bold text-[#16a34a]"
        >
          &lt;
        </button>
        {cards.map((card, index) => (
          <button
            type="button"
            key={card.id}
            aria-label={`Buka info ${index + 1}`}
            onClick={() => goTo(index)}
            className={`h-2 rounded-full transition-all duration-300 ${safeActiveIndex === index ? "w-6 bg-[#16a34a] shadow-[0_2px_6px_rgba(22,163,74,0.35)]" : "w-2 bg-green-100"}`}
          />
        ))}
        <button
          type="button"
          aria-label="Info berikutnya"
          onClick={() => goTo(activeIndex + 1)}
          className="h-6 w-6 text-[18px] font-bold text-[#16a34a]"
        >
          &gt;
        </button>
      </div>

      <div
        className={[
          "fixed inset-0 z-[80] flex items-center justify-center bg-black/30 px-4 transition-opacity duration-300",
          isModalOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        ].join(" ")}
        onClick={handleCloseModal}
      >
        <div
          role="dialog"
          aria-modal="true"
          className={[
            "relative h-[280px] w-full max-w-2xl transition-all duration-300",
            BACKEND_CARD_SURFACE_CLASS,
            isModalOpen ? "translate-y-0 scale-100 opacity-100" : "translate-y-3 scale-95 opacity-0",
          ].join(" ")}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            aria-label="Tutup info"
            onClick={handleCloseModal}
            className="absolute left-3 top-3 z-30 h-9 w-9 rounded-full bg-green-50 text-[14px] font-bold text-green-800 hover:bg-green-100"
          >
            X
          </button>
          {selectedCard ? <BackendCardContent card={selectedCard} /> : null}
        </div>
      </div>
    </section>
  );
}
