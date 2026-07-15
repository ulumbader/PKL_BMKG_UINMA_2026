/**
 * Client untuk memanggil API publik BMKG langsung dari browser.
 *
 * API BMKG mengirim header `Access-Control-Allow-Origin: *`
 * sehingga aman dipanggil dari browser tanpa proxy backend.
 *
 * Referensi endpoint:
 *   https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=<kode_adm4>
 */

const BMKG_API_BASE = "https://api.bmkg.go.id/publik/prakiraan-cuaca";
const BMKG_TIMEOUT_MS = 10_000; // 10 detik timeout

/* ────────────────────────────────────────────
   Tipe data response BMKG (raw)
   ──────────────────────────────────────────── */

/** Satu slot prakiraan dari BMKG (per 3 jam). */
type BmkgSlot = {
  local_datetime: string;
  weather_desc: string;
  weather_desc_en: string;
  t: number;            // suhu °C
  hu: number;           // kelembapan %
  ws: number;           // kecepatan angin km/jam
  wd: string;           // arah angin
  vs_text: string;      // jarak pandang
  image: string;        // URL ikon cuaca
  tp: number | null;    // curah hujan mm (bisa null)
};

/** Lokasi yang dikembalikan BMKG. */
type BmkgLokasi = {
  desa: string;
  kecamatan: string;
  kotkab: string;
  provinsi: string;
  lat: number;
  lon: number;
  timezone: string;
};

/** Root response dari API BMKG. */
type BmkgResponse = {
  lokasi: BmkgLokasi;
  data: Array<{
    cuaca: BmkgSlot[][];
  }>;
};

/* ────────────────────────────────────────────
   Tipe data yang dipakai UI
   ──────────────────────────────────────────── */

export type WeatherSlot = {
  waktu_prakiraan: string;
  suhu_celsius: string;
  curah_hujan_mm: string;
  kelembapan_persen: string;
  kecepatan_angin_kmjam: string;
  arah_angin: string;
  jarak_pandang: string;
  kondisi_cuaca: string;
  ikon_url: string;
};

export type BmkgWeatherData = {
  wilayah: string;
  kecamatan: string;
  kotkab: string;
  provinsi: string;
  kode_adm4: string;
  prakiraan: WeatherSlot[];
};

/* ────────────────────────────────────────────
   Fetch & Transform
   ──────────────────────────────────────────── */

/**
 * Ambil prakiraan cuaca langsung dari API BMKG.
 *
 * @param kodeAdm4 — Kode wilayah ADM4 (contoh: "35.07.20.2001")
 * @returns Data cuaca yang sudah ditransformasi ke format UI
 * @throws Error jika fetch gagal atau timeout
 */
export async function fetchBmkgWeather(kodeAdm4: string): Promise<BmkgWeatherData> {
  const url = `${BMKG_API_BASE}?adm4=${encodeURIComponent(kodeAdm4)}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), BMKG_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("Koneksi ke API BMKG timeout. Coba lagi nanti.");
    }
    throw new Error("Gagal menghubungi API BMKG. Periksa koneksi internet.");
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new Error(`API BMKG mengembalikan status ${response.status}. Coba lagi nanti.`);
  }

  const raw = (await response.json()) as BmkgResponse;

  // Validasi struktur dasar
  if (!raw.lokasi || !raw.data?.[0]?.cuaca) {
    throw new Error("Format response API BMKG tidak sesuai.");
  }

  // Flatten semua slot prakiraan dari semua hari
  const allSlots: WeatherSlot[] = [];
  const now = new Date();

  for (const harianGroup of raw.data[0].cuaca) {
    for (const slot of harianGroup) {
      // Hanya ambil prakiraan dari sekarang ke depan
      const slotTime = new Date(slot.local_datetime.replace(" ", "T"));
      if (slotTime >= now) {
        allSlots.push({
          waktu_prakiraan: slot.local_datetime,
          suhu_celsius: String(slot.t),
          curah_hujan_mm: String(slot.tp ?? 0),
          kelembapan_persen: String(slot.hu),
          kecepatan_angin_kmjam: String(slot.ws),
          arah_angin: slot.wd || "-",
          jarak_pandang: slot.vs_text || "-",
          kondisi_cuaca: slot.weather_desc,
          ikon_url: slot.image ? slot.image.replace(/ /g, "%20") : "",
        });
      }
    }
  }

  // Urutkan berdasarkan waktu
  allSlots.sort((a, b) =>
    a.waktu_prakiraan.localeCompare(b.waktu_prakiraan),
  );

  const lokasi = raw.lokasi;
  const wilayahParts = [lokasi.desa, lokasi.kecamatan, lokasi.kotkab].filter(Boolean);

  return {
    wilayah: wilayahParts.join(", "),
    kecamatan: lokasi.kecamatan || "-",
    kotkab: lokasi.kotkab || "-",
    provinsi: lokasi.provinsi || "-",
    kode_adm4: kodeAdm4,
    prakiraan: allSlots,
  };
}
