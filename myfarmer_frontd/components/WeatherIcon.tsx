import React from "react";
import Image from "next/image";
import { getWeatherIconPath } from "@/lib/weatherIcons";

type WeatherIconProps = {
  /** Kondisi cuaca dari BMKG (contoh: "Hujan Ringan") */
  condition: string;
  /** Waktu prakiraan dari BMKG (contoh: "2026-07-22 14:00:00") */
  dateTime: string;
  /** Ukuran ikon dalam pixel (width = height) */
  size?: number;
  /** CSS class tambahan */
  className?: string;
};

/**
 * Komponen reusable untuk menampilkan ikon cuaca SVG
 * berdasarkan kondisi cuaca dan waktu (AM/PM).
 */
export function WeatherIcon({
  condition,
  dateTime,
  size = 48,
  className,
}: WeatherIconProps) {
  const iconPath = getWeatherIconPath(condition, dateTime);

  return (
    <Image
      src={iconPath}
      alt={condition || "Cuaca"}
      width={size}
      height={size}
      className={className}
      priority
    />
  );
}
