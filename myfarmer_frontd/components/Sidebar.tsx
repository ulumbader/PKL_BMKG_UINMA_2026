"use client";
import Image from 'next/image';
import React from 'react';
import { CloseIcon } from './Icons';
import { WeatherIcon } from './WeatherIcon';
import { BmkgWeatherData } from '@/lib/bmkgClient';

export const Sidebar = ({
  isOpen,
  onClose,
  weatherData,
  loading,
  unit
}: {
  isOpen: boolean;
  onClose: () => void;
  weatherData: BmkgWeatherData | null;
  loading: boolean;
  unit: 'C' | 'F';
}) => {

  const currentSlot = weatherData?.prakiraan[0];

  let tempValue = '--';
  if (currentSlot) {
    let t = parseFloat(currentSlot.suhu_celsius);
    if (unit === 'F') {
      t = (t * 9 / 5) + 32;
    }
    tempValue = Math.round(t).toString();
  }

  const locationText = weatherData ? `${weatherData.kecamatan}, ${weatherData.provinsi}` : 'Memuat...';

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

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-[340px] flex-shrink-0 bg-gradient-to-b from-[#168039] to-[#0a3a19]
        flex flex-col py-9 px-8 border-r border-white/10
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0
      `}>
        {/* Close button for mobile */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 lg:hidden text-white/60 hover:text-white"
        >
          <CloseIcon className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-2.5 mt-4 lg:mt-0">
          {/* BMKG Logo */}
          <Image
            src="/logo_bmkg.png"
            alt="Logo BMKG"
            width={36}
            height={36}
            className="h-9 w-9 shrink-0"
          />
          <span className="text-[17px] font-semibold text-white tracking-tight">MyFarmer</span>
        </div>

        <div className="flex justify-center items-center my-6">
          {currentSlot ? (
            <WeatherIcon
              condition={currentSlot.kondisi_cuaca}
              dateTime={currentSlot.waktu_prakiraan}
              size={160}
            />
          ) : (
            <div className="w-[160px] h-[160px] rounded-full bg-white/10 animate-pulse" />
          )}
        </div>

        <div className="text-[64px] font-semibold leading-none tracking-tight mt-1.5 flex items-start text-white">
          {loading ? '...' : (
            <>
              {tempValue}
              <span className="text-[34px] font-medium ml-1 mt-1 text-white/80">°{unit}</span>
            </>
          )}
        </div>

        <div className="mt-[18px] text-[15px] text-white font-medium">
          {day}, <span className="text-white/60 font-normal">{timeStr}</span>
        </div>

        <div className="h-px bg-white/10 my-5"></div>

        <div className="flex items-center gap-3 text-sm text-white/80 mb-4 capitalize">
          {currentSlot ? (
            <WeatherIcon
              condition={currentSlot.kondisi_cuaca}
              dateTime={currentSlot.waktu_prakiraan}
              size={20}
              className="shrink-0"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-white/10 shrink-0" />
          )}
          {condition}
        </div>

        <div className="mt-auto relative rounded-[18px] overflow-hidden h-[130px] w-full group shrink-0">
          <video
            src="/vid_side_panel.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/55 pointer-events-none"></div>
          <div className="absolute left-4 bottom-3.5 text-white text-sm font-medium z-10 line-clamp-2">{locationText}</div>
        </div>
      </aside>
    </>
  );
};
