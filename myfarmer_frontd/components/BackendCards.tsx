"use client";
import React, { useEffect, useState } from 'react';
import { apiGet, ApiError } from '@/lib/apiClient';

type Resource<T> = {
  data: T | null;
  error: string | null;
  loading: boolean;
  message: string;
};

type RecommendationData = {
  status_rekomendasi: string;
  label_rekomendasi: string;
  tanggal_evaluasi: string;
  rule?: { nama?: string };
};

type SummaryData = {
  ringkasan?: string;
  ringkasan_text?: string;
  published_at: string;
};

type RainData = {
  periode: { tahun: number; bulan: number; dasarian_ke: number; };
  curah_hujan: { total_mm: string; jumlah_hari_hujan: number; };
  status_musim: string;
  stasiun: { nama: string; kode_wmo: string; };
};

export type ContentItem = {
  judul: string;
  isi: string;
  tipe: "pengumuman" | "tips" | string;
};

export type BackendInfoCard = {
  id: string;
  title: string;
  render: () => React.ReactNode;
};

export const BACKEND_CARD_SURFACE_CLASS =
  "bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 overflow-hidden";

export function BackendCardContent({
  card,
  dim = false,
}: {
  card: BackendInfoCard;
  dim?: boolean;
}) {
  return (
    <>
      <div className="absolute top-0 right-0 py-1.5 px-4 bg-[#1c1c1e] text-white text-[11px] font-semibold uppercase tracking-wide rounded-bl-[16px] z-10 shadow-sm">
        {card.title}
      </div>
      {dim && (
        <div className="absolute inset-0 bg-white/40 z-20 pointer-events-none transition-opacity duration-500" />
      )}
      {card.render()}
    </>
  );
}

export function usePublicData<T>(path: string): Resource<T> {
  const [resource, setResource] = useState<Resource<T>>({
    data: null, error: null, loading: true, message: "",
  });

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await apiGet<T | null>(path);
        if (active) {
          setResource({ data: response.data, error: null, loading: false, message: response.message });
        }
      } catch (error) {
        if (active) {
          setResource({ data: null, error: error instanceof ApiError ? error.message : "Data belum bisa dimuat.", loading: false, message: "" });
        }
      }
    }
    load();
    return () => { active = false; };
  }, [path]);

  return resource;
}

function formatDateTime(value: string) {
  const date = new Date(value.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function statusClass(status: string) {
  if (status === "optimal_tanam") return "text-green-600 bg-green-50 border-green-200";
  if (status === "tunggu") return "text-yellow-600 bg-yellow-50 border-yellow-200";
  if (status === "tidak_disarankan") return "text-red-600 bg-red-50 border-red-200";
  return "text-gray-600 bg-gray-50 border-gray-200";
}

export function useBackendCards() {
  const recommendation = usePublicData<RecommendationData>("/publik/rekomendasi-terkini");
  const summary = usePublicData<SummaryData>("/publik/ringkasan-terkini");
  const rain = usePublicData<RainData>("/publik/cuaca-terkini");
  const content = usePublicData<ContentItem[]>("/publik/konten");

  const baseCards: BackendInfoCard[] = [
    {
      id: 'recommendation',
      title: 'Rekomendasi Tanam',
      render: () => {
        if (recommendation.loading) return <div className="p-6 h-full flex items-center justify-center font-medium">Memuat rekomendasi...</div>;
        if (recommendation.error || !recommendation.data) return <div className="p-6 text-red-500 font-medium">{recommendation.error || recommendation.message}</div>;
        return (
          <div className="p-6 h-full flex flex-col justify-center">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-[14px] text-[#a9a9b0] mb-1">Status</div>
                <div className="text-xl font-semibold capitalize">{recommendation.data.status_rekomendasi.replace('_', ' ')}</div>
              </div>
              <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${statusClass(recommendation.data.status_rekomendasi)}`}>
                {recommendation.data.label_rekomendasi}
              </span>
            </div>
            <div className="mt-auto grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs text-[#a9a9b0]">Evaluasi</div>
                <div className="font-medium">{formatDateTime(recommendation.data.tanggal_evaluasi)}</div>
              </div>
              <div>
                <div className="text-xs text-[#a9a9b0]">Rule</div>
                <div className="font-medium">{recommendation.data.rule?.nama || '-'}</div>
              </div>
            </div>
          </div>
        );
      }
    },
    {
      id: 'summary',
      title: 'Ringkasan Iklim (AI)',
      render: () => {
        if (summary.loading) return <div className="p-6 h-full flex items-center justify-center font-medium">Memuat ringkasan...</div>;
        if (summary.error || !summary.data) return <div className="p-6 text-red-500 font-medium">{summary.error || summary.message}</div>;
        return (
          <div className="p-6 h-full flex flex-col pt-10">
            <div className="text-[15px] text-[#1c1c1e] line-clamp-4 leading-relaxed font-medium flex-1">
              {summary.data.ringkasan || summary.data.ringkasan_text}
            </div>
            <div className="text-xs text-[#a9a9b0] mt-auto font-medium">
              Update: {formatDateTime(summary.data.published_at)}
            </div>
          </div>
        );
      }
    },
    {
      id: 'rain',
      title: 'Info Curah Hujan',
      render: () => {
        if (rain.loading) return <div className="p-6 h-full flex items-center justify-center font-medium">Memuat data hujan...</div>;
        if (rain.error || !rain.data) return <div className="p-6 text-red-500 font-medium">{rain.error || rain.message}</div>;
        return (
          <div className="p-6 h-full flex flex-col justify-center gap-4">
            <div className="text-[14px] text-[#a9a9b0] font-medium">
              Dasarian {rain.data.periode.dasarian_ke}, {rain.data.periode.bulan}/{rain.data.periode.tahun}
            </div>
            <div className="flex justify-between items-center bg-[#f9f9fa] p-4 rounded-2xl">
              <div>
                <div className="text-[32px] font-semibold leading-none">{rain.data.curah_hujan.total_mm}<span className="text-sm text-[#a9a9b0] ml-1">mm</span></div>
                <div className="text-xs font-medium mt-1 text-gray-500">Total Hujan</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-semibold leading-none">{rain.data.curah_hujan.jumlah_hari_hujan} <span className="text-sm font-medium text-gray-500">hari</span></div>
                <div className="text-xs font-medium mt-1 text-gray-500">Hari Hujan</div>
              </div>
            </div>
            <div className="text-sm font-semibold text-[#1c1c1e] bg-blue-50 text-blue-600 border border-blue-100 px-3 py-1.5 rounded-xl self-start">
              Status: {rain.data.status_musim}
            </div>
          </div>
        );
      }
    }
  ];

  const contentCards: BackendInfoCard[] = [];
  if (content.loading) {
    contentCards.push({
      id: 'content-loading',
      title: 'Pengumuman & Tips',
      render: () => <div className="p-6 h-full flex items-center justify-center font-medium">Memuat info...</div>
    });
  } else if (content.error || !content.data || content.data.length === 0) {
    contentCards.push({
      id: 'content-empty',
      title: 'Pengumuman & Tips',
      render: () => <div className="p-6 text-gray-500 font-medium">{content.error || "Belum ada pengumuman/tips."}</div>
    });
  } else {
    content.data.forEach((item, i) => {
      const isTips = item.tipe === 'tips';
      contentCards.push({
        id: `content-${i}`,
        title: isTips ? 'Tips Bertani' : 'Pengumuman',
        render: () => (
          <div className="p-6 h-full flex flex-col pt-9">
            <div className={`text-[11px] font-bold uppercase tracking-wider mb-2 ${isTips ? 'text-green-600' : 'text-orange-500'}`}>
              {item.tipe}
            </div>
            <h3 className="text-[17px] font-bold mb-2 line-clamp-1">{item.judul}</h3>
            <p className="text-[14px] text-gray-600 line-clamp-3 leading-relaxed flex-1 font-medium">{item.isi}</p>
          </div>
        )
      });
    });
  }

  return { infoCards: baseCards, contentCards };
}

export const BackendCards = ({ cards }: { cards: BackendInfoCard[] }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  // Auto slide
  useEffect(() => {
    if (cards.length < 2) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % cards.length);
    }, 5000); // 5 seconds interval
    return () => clearInterval(timer);
  }, [cards.length]);

  return (
    <div className="w-full flex flex-col items-center">
      <div className="relative w-full h-[220px]">
        <div className="absolute inset-0">
          {cards.map((card, index) => {
            // Calculate offset relative to active index
            const total = cards.length;
            let offset = (index - activeIndex) % total;
            if (offset < 0) offset += total;

            // 0 is front, 1 is behind, 2 is further behind, 3 is transitioning out
            let zIndex = total - offset;
            let scale = 1 - (offset * 0.05);
            let translateY = offset * -20; // Move up to stack behind
            let opacity = offset > 2 ? 0 : 1 - (offset * 0.15);
            let filter = `blur(${offset * 1.5}px)`;

            if (total > 1 && offset === total - 1) {
              // It's the one fading out to the front (sliding down and fading)
              scale = 1.05;
              translateY = 30;
              opacity = 0;
              zIndex = total + 1;
              filter = 'blur(0px)';
            }

            // Bring to front interaction
            const isFront = offset === 0;

            return (
              <div
                key={card.id}
                className={`absolute w-full h-full ${BACKEND_CARD_SURFACE_CLASS} transition-all duration-[800ms] ease-[cubic-bezier(0.25,1,0.5,1)] origin-bottom cursor-pointer`}
                style={{
                  zIndex,
                  transform: `translateY(${translateY}px) scale(${scale})`,
                  opacity,
                  visibility: opacity === 0 ? 'hidden' : 'visible',
                  filter
                }}
                onClick={() => setActiveIndex(index)}
              >
                <BackendCardContent card={card} dim={!isFront} />
              </div>
            );
          })}
        </div>
      </div>
      {/* Navigation dots */}
      <div className="flex justify-center gap-2 mt-6">
        {cards.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setActiveIndex(idx)}
            className={`h-2 rounded-full transition-all duration-500 ${activeIndex === idx ? 'bg-[#1c1c1e] w-6' : 'bg-[#e0e0e0] w-2 hover:bg-gray-400'}`}
          />
        ))}
      </div>
    </div>
  );
};
