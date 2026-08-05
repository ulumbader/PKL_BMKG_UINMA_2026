"use client";
import React, { useState, useEffect } from 'react';
import {
  MenuIcon,
} from './Icons';
import { WeatherIcon } from './WeatherIcon';
import { BmkgWeatherData, WeatherSlot } from '@/lib/bmkgClient';
import { BackendCards, useBackendCards } from './BackendCards';
import { InfoSection } from './InfoSection';
import { PublicFooter } from './PublicFooter';
import { RainfallRecommendationChart } from './RainfallRecommendationChart';
import { LandingMediaSection } from './public/media/LandingMediaSection';


type Unit = 'C' | 'F';

type WindDirection = {
  abbreviation: string | null;
  degrees: number | null;
  label: string;
};

const windDirections: Record<string, WindDirection> = {
  N: { abbreviation: 'U', degrees: 0, label: 'Utara' },
  NE: { abbreviation: 'TL', degrees: 45, label: 'Timur Laut' },
  E: { abbreviation: 'T', degrees: 90, label: 'Timur' },
  SE: { abbreviation: 'TG', degrees: 135, label: 'Tenggara' },
  S: { abbreviation: 'S', degrees: 180, label: 'Selatan' },
  SW: { abbreviation: 'BD', degrees: 225, label: 'Barat Daya' },
  W: { abbreviation: 'B', degrees: 270, label: 'Barat' },
  NW: { abbreviation: 'BL', degrees: 315, label: 'Barat Laut' },
};

const windDirectionAliases: Record<string, keyof typeof windDirections> = {
  NNE: 'NE',
  ENE: 'E',
  ESE: 'SE',
  SSE: 'S',
  SSW: 'SW',
  WSW: 'W',
  WNW: 'NW',
  NNW: 'N',
};

function getWindDirection(value?: string): WindDirection {
  const normalized = value?.trim().toUpperCase().replace(/\s+/g, '') ?? '';
  const directionCode = windDirectionAliases[normalized] ?? normalized;

  if (windDirections[directionCode]) return windDirections[directionCode];
  if (['CALM', 'C'].includes(normalized)) {
    return { abbreviation: null, degrees: null, label: 'Tenang' };
  }
  if (['VARIABLE', 'VAR', 'VRB'].includes(normalized)) {
    return { abbreviation: null, degrees: null, label: 'Berubah-ubah' };
  }

  return { abbreviation: null, degrees: null, label: 'Tidak tersedia' };
}

function WindCompass({ direction }: { direction: WindDirection }) {
  return (
    <div
      role="img"
      aria-label={`Kompas arah angin ${direction.label}`}
      className="relative size-[62px] shrink-0 rounded-full border border-[#e5e5e9] bg-[#fafafa]"
    >
      <span className="absolute left-1/2 top-0.5 -translate-x-1/2 text-[8px] font-semibold text-[#77777f]">U</span>
      <span className="absolute right-[5px] top-[7px] text-[7px] font-semibold text-[#9999a1]">TL</span>
      <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[8px] font-semibold text-[#77777f]">T</span>
      <span className="absolute bottom-[7px] right-[4px] text-[7px] font-semibold text-[#9999a1]">TG</span>
      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[8px] font-semibold text-[#77777f]">S</span>
      <span className="absolute bottom-[7px] left-[4px] text-[7px] font-semibold text-[#9999a1]">BD</span>
      <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[8px] font-semibold text-[#77777f]">B</span>
      <span className="absolute left-[5px] top-[7px] text-[7px] font-semibold text-[#9999a1]">BL</span>

      <div className="absolute inset-[11px] rounded-full border border-[#dadae0] bg-white">
        {direction.degrees !== null ? (
          <svg
            aria-hidden="true"
            viewBox="0 0 36 36"
            className="size-full transition-transform duration-500 ease-out"
            style={{ transform: `rotate(${direction.degrees}deg)` }}
          >
            <path d="M18 3 23 17 18 14 13 17Z" fill="#4a4ff7" />
            <path d="M18 14V31" stroke="#a9a9b0" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-[15px] font-semibold text-[#a9a9b0]">–</span>
        )}
        <span className="absolute left-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#1c1c1e]" />
      </div>
    </div>
  );
}

export const MainContent = ({
  onOpenSidebar,
  weatherData,
  loading,
  error,
  unit,
  setUnit
}: {
  onOpenSidebar: () => void;
  weatherData: BmkgWeatherData | null;
  loading: boolean;
  error?: string | null;
  unit: Unit;
  setUnit: (u: Unit) => void;
}) => {

  const { infoCards, contentCards } = useBackendCards();

  // Convert temp based on unit
  const temp = (c: number) => unit === 'C' ? Math.round(c) : Math.round((c * 9 / 5) + 32);

  // Group forecast by day
  const getDailyForecasts = (slots: WeatherSlot[] | undefined) => {
    if (!slots || slots.length === 0) return [];

    const grouped = new Map<string, { max: number; min: number; condition: string; waktu: string }>();

    slots.forEach(slot => {
      const date = new Date(slot.waktu_prakiraan.replace(" ", "T"));
      if (isNaN(date.getTime())) return;

      const dayStr = new Intl.DateTimeFormat('id-ID', { weekday: 'short' }).format(date);
      const tempVal = parseFloat(slot.suhu_celsius);

      if (!grouped.has(dayStr)) {
        grouped.set(dayStr, { max: tempVal, min: tempVal, condition: slot.kondisi_cuaca, waktu: slot.waktu_prakiraan });
      } else {
        const data = grouped.get(dayStr)!;
        if (tempVal > data.max) data.max = tempVal;
        if (tempVal < data.min) data.min = tempVal;
      }
    });

    return Array.from(grouped.entries()).map(([day, data]) => ({
      day,
      max: data.max,
      min: data.min,
      condition: data.condition,
      waktu: data.waktu,
    })).slice(0, 7);
  };



  const dailyForecasts = getDailyForecasts(weatherData?.prakiraan);
  const currentSlot = weatherData?.prakiraan[0];
  const windDirection = getWindDirection(currentSlot?.arah_angin);

  let day = '--';
  let timeStr = '--:--';
  if (currentSlot) {
    const date = new Date(currentSlot.waktu_prakiraan.replace(" ", "T"));
    if (!isNaN(date.getTime())) {
      day = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(date);
      timeStr = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
    }
  }
  const condition = currentSlot?.kondisi_cuaca || '--';
  const locationText = weatherData ? weatherData.wilayah : 'Memuat lokasi...';
  const locationShort = weatherData ? weatherData.kecamatan : 'Memuat...';

  // Real-time clock for navbar
  const [currentTime, setCurrentTime] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const navDateText = (() => {
    const d = currentTime;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()} - ${hh}:${mi} WIB`;
  })();

  const h = currentTime.getHours();
  const greeting = h < 12 ? 'Selamat Pagi...' : h < 17 ? 'Selamat Siang...' : 'Selamat Malam...';

  return (
    <main className="flex-1 py-10 px-6 lg:px-11 min-w-0 bg-[#f0f4f1] text-[#0f1f17] overflow-y-auto h-screen">

      {/* Top Nav */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4 lg:gap-5">
          <button onClick={onOpenSidebar} className="lg:hidden p-2 -ml-2 text-gray-600 hover:text-black">
            <MenuIcon className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0 text-[#1c1c1e]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            {/* Mobile: kecamatan only */}
            <span className="md:hidden text-[13px] font-medium text-[#1c1c1e]">{locationShort}</span>
            {/* Desktop: full location + date */}
            <div className="hidden md:flex flex-col leading-tight">
              <span className="text-[14px] font-medium text-[#1c1c1e]">{locationText}</span>
              <span className="text-[12px] text-[#9a9aa2]">{navDateText}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[14px] font-medium text-[#1c1c1e] hidden lg:inline whitespace-nowrap">{greeting}</span>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setUnit('C')}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-semibold transition-colors cursor-pointer ${unit === 'C' ? 'bg-[#16a34a] text-white' : 'text-[#0f1f17] bg-white hover:bg-green-50'}`}
            >
              °C
            </button>
            <button
              onClick={() => setUnit('F')}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-semibold transition-colors cursor-pointer ${unit === 'F' ? 'bg-[#16a34a] text-white' : 'text-[#0f1f17] bg-white hover:bg-green-50'}`}
            >
              °F
            </button>
            <div className="w-11 h-11 rounded-xl overflow-hidden ml-1.5 bg-gray-200">
              <svg viewBox="0 0 44 44" width="100%" height="100%">
                <defs>
                  <linearGradient id="avatarGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#6b9c7c" />
                    <stop offset="100%" stopColor="#1a3c2e" />
                  </linearGradient>
                </defs>
                <rect width="44" height="44" fill="url(#avatarGrad)" />
                <circle cx="22" cy="17" r="8" fill="#d8b48f" />
                <path d="M6 44c0-10 7-16 16-16s16 6 16 16" fill="#d8b48f" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Main Weather (Visible only on narrow screens) */}
      <div className="lg:hidden flex flex-col items-center justify-center mb-10 text-center bg-white p-8 rounded-[32px] shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-green-100">
        <div className="text-[72px] font-semibold leading-none tracking-tight flex items-start justify-center">
          {loading ? '...' : (
            <>
              {temp(parseFloat(currentSlot?.suhu_celsius || '0'))}
              <span className="text-[36px] font-medium ml-1 mt-2 text-[#1c1c1e]">°{unit}</span>
            </>
          )}
        </div>
        <div className="flex items-center justify-center gap-3 mt-4 text-[#1c1c1e] text-[18px] font-semibold capitalize">
          {currentSlot && (
            <WeatherIcon
              condition={currentSlot.kondisi_cuaca}
              dateTime={currentSlot.waktu_prakiraan}
              size={36}
              className="mr-1"
            />
          )}
          {condition}
        </div>
        <div className="mt-3 text-[15px] text-[#1c1c1e] font-medium">
          {day}, <span className="text-[#9a9aa2] font-normal">{timeStr}</span>
        </div>
        <div className="mt-1.5 text-[14px] text-gray-400 font-medium flex items-center justify-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          {locationText}
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 mb-10 items-stretch">
        {/* Week Strip */}
        <div className="flex-1 w-full">
          <div className="flex gap-4 h-[220px] w-full">
            {loading ? (
              <div className="w-full text-center text-gray-500 py-4 flex items-center justify-center">Memuat prakiraan...</div>
            ) : error && dailyForecasts.length === 0 ? (
              <div className="w-full text-center text-red-500 py-4 px-6 flex items-center justify-center font-medium">{error}</div>
            ) : dailyForecasts.length === 0 ? (
              <div className="w-full text-center text-gray-500 py-4 flex items-center justify-center">Tidak ada data prakiraan.</div>
            ) : dailyForecasts.map((d, i) => (
              <div key={i} className="flex-1 bg-white rounded-[24px] p-6 text-center hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer h-full flex flex-col justify-between items-center shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
                <div className="text-[16px] font-medium text-[#6b8f78]">{d.day}</div>
                <div className="flex-1 flex items-center justify-center my-4">
                  <WeatherIcon
                    condition={d.condition}
                    dateTime={d.waktu}
                    size={48}
                  />
                </div>
                <div className="text-[18px] font-semibold text-[#1c1c1e]">
                  {temp(d.max)}°<span className="text-[#c6c6cc] font-medium ml-1.5">{temp(d.min)}°</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Backend Integration Cards Slider */}
        <div className="w-full xl:w-[420px] shrink-0 h-[220px]">
          <BackendCards cards={contentCards} />
        </div>
      </div>

      <InfoSection cards={infoCards} />

      <div className="text-[20px] font-semibold mb-5 text-[#0f1f17]">Sorotan Hari Ini</div>

      <RainfallRecommendationChart className="mb-5" accent="green" />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 pb-8">

        {/* Wind Status */}
        <div className="bg-white rounded-[22px] p-[22px_24px] min-h-[170px] flex flex-col shadow-sm">
          <div className="mb-3.5 flex items-center justify-between gap-3 text-[14px]">
            <span className="text-[#6b8f78]">Kondisi Angin</span>
            <span className="font-medium text-right text-[#0f1f17]">
              {windDirection.label}
              {windDirection.abbreviation ? ` (${windDirection.abbreviation})` : ''}
            </span>
          </div>
          <div className="flex flex-1 items-center justify-between gap-3">
            <div className="whitespace-nowrap text-[40px] font-semibold leading-none">
              {currentSlot?.kecepatan_angin_kmjam || '--'}<span className="text-[15px] font-medium text-[#a9a9b0] ml-[2px]">km/jam</span>
            </div>
            <WindCompass direction={windDirection} />
          </div>
        </div>

        {/* Humidity */}
        <div className="bg-white rounded-[22px] p-[22px_24px] min-h-[170px] flex flex-col shadow-sm">
          <div className="text-[14px] text-[#6b8f78] mb-3.5">Kelembapan</div>
          <div className="flex flex-1 items-center text-[40px] font-semibold leading-none">
            {currentSlot?.kelembapan_persen || '--'}<span className="text-[15px] font-medium text-[#a9a9b0] ml-[2px]">%</span>
          </div>
        </div>

        {/* Visibility */}
        <div className="bg-white rounded-[22px] p-[22px_24px] min-h-[170px] flex flex-col shadow-sm">
          <div className="text-[14px] text-[#6b8f78] mb-3.5">Jarak Pandang</div>
          <div className="flex flex-1 items-center text-[40px] font-semibold leading-none">
            {currentSlot?.jarak_pandang || '--'}
          </div>
        </div>

      </div>

      <LandingMediaSection />

      <PublicFooter />

    </main>
  );
};
