"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { MainContent } from '@/components/MainContent';
import { fetchBmkgWeather, BmkgWeatherData } from '@/lib/bmkgClient';

const BMKG_KODE_ADM4 = process.env.NEXT_PUBLIC_BMKG_KODE_ADM4 || "35.07.20.2001";
const WEATHER_REFRESH_MS = 15 * 60 * 1000;

export default function PublicHomePage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [weatherData, setWeatherData] = useState<BmkgWeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [unit, setUnit] = useState<'C' | 'F'>('C');

  const loadWeather = useCallback(async () => {
    try {
      setWeatherLoading(true);
      setWeatherError(null);
      const result = await fetchBmkgWeather(BMKG_KODE_ADM4);
      setWeatherData(result);
    } catch (err) {
      setWeatherError(err instanceof Error ? err.message : "Gagal memuat data cuaca.");
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = setTimeout(loadWeather, 0);
    const interval = setInterval(loadWeather, WEATHER_REFRESH_MS);
    return () => {
      clearTimeout(initialLoad);
      clearInterval(interval);
    };
  }, [loadWeather]);

  return (
    <div className="flex w-full min-h-screen bg-white overflow-hidden">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        weatherData={weatherData}
        loading={weatherLoading}
        unit={unit}
      />
      <MainContent
        onOpenSidebar={() => setIsSidebarOpen(true)}
        weatherData={weatherData}
        loading={weatherLoading}
        error={weatherError}
        unit={unit}
        setUnit={setUnit}
      />
    </div>
  );
}
