"use client";

import { useCallback, useEffect, useState } from "react";

import { ApiError } from "@/lib/apiClient";
import { getPublicMedia, type PublicMediaGroups } from "@/lib/media";

const emptyGroups: PublicMediaGroups = { sorotan: [], poster: [], pdf: [] };

export function useLandingMedia() {
  const [data, setData] = useState<PublicMediaGroups>(emptyGroups);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const retry = useCallback(() => setReloadKey((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError("");
      try {
        setData(await getPublicMedia(controller.signal));
      } catch (caught) {
        if (controller.signal.aborted) return;
        setData(emptyGroups);
        setError(caught instanceof ApiError ? caught.message : "Media gagal dimuat.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, [reloadKey]);

  return { data, loading, error, retry };
}
