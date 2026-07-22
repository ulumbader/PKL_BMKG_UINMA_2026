/**
 * Utilitas terpusat untuk mapping kondisi_cuaca BMKG → path file ikon SVG,
 * dengan logika AM/PM berdasarkan jam prakiraan.
 *
 * Ikon berada di:
 *   /icons/weather/am/{nama}.svg  (siang: 06:00–17:59)
 *   /icons/weather/pm/{nama}.svg  (malam: 18:00–05:59)
 */

/** Mapping kondisi cuaca BMKG (lowercase) → nama file SVG (tanpa .svg) */
const CONDITION_MAP: Record<string, string> = {
  cerah: "cerah",
  "cerah berawan": "cerah-berawan",
  berawan: "berawan",
  "berawan tebal": "berawan-tebal",
  "udara kabur": "udara-kabur",
  kabut: "kabut",
  asap: "asap",
  "hujan ringan": "hujan-ringan",
  "hujan sedang": "hujan-sedang",
  "hujan lebat": "hujan-lebat",
  "hujan lokal": "hujan-lokal",
  "hujan petir": "hujan-petir",
};

const FALLBACK_ICON = "berawan";

/**
 * Tentukan apakah waktu termasuk AM (siang) atau PM (malam).
 * AM = 06:00–17:59, PM = 18:00–05:59.
 */
function getPeriod(waktuPrakiraan: string): "am" | "pm" {
  try {
    const dateStr = waktuPrakiraan.replace(" ", "T");
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "am";
    const hour = date.getHours();
    return hour >= 6 && hour < 18 ? "am" : "pm";
  } catch {
    return "am";
  }
}

/**
 * Dapatkan path ikon cuaca berdasarkan kondisi cuaca dan waktu prakiraan.
 *
 * @param kondisiCuaca — String kondisi cuaca dari BMKG (contoh: "Hujan Ringan")
 * @param waktuPrakiraan — Waktu prakiraan dari BMKG (contoh: "2026-07-22 14:00:00")
 * @returns Path relatif ke file SVG (contoh: "/icons/weather/am/hujan-ringan.svg")
 */
export function getWeatherIconPath(
  kondisiCuaca: string,
  waktuPrakiraan: string,
): string {
  const normalized = kondisiCuaca.trim().toLowerCase();
  const fileName = CONDITION_MAP[normalized] ?? FALLBACK_ICON;
  const period = getPeriod(waktuPrakiraan);
  return `/icons/weather/${period}/${fileName}.svg`;
}

/**
 * Dapatkan period saja (am/pm) dari waktu prakiraan.
 * Berguna untuk komponen yang perlu tahu siang/malam terpisah dari ikon.
 */
export function getWeatherPeriod(waktuPrakiraan: string): "am" | "pm" {
  return getPeriod(waktuPrakiraan);
}
