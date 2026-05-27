'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type WorkspaceRegion = 'nam' | 'trung' | 'bac';

type LoadWorkspaceOptions = {
  force?: boolean;
  targetDate?: string;
  targetRegion?: WorkspaceRegion;
  silent?: boolean;
};

const workspaceCache = new Map<string, unknown>();

function cacheKey(date: string, region: WorkspaceRegion) {
  return `${date}|${region}`;
}

export function invalidateWorkspaceCache(date?: string, region?: WorkspaceRegion) {
  if (date && region) {
    workspaceCache.delete(cacheKey(date, region));
    return;
  }
  workspaceCache.clear();
}

export function useWorkspaceData<TWorkspace>(date: string, region: WorkspaceRegion) {
  const [workspace, setWorkspace] = useState<TWorkspace | null>(() => {
    return (workspaceCache.get(cacheKey(date, region)) as TWorkspace | undefined) || null;
  });
  const [loading, setLoading] = useState(!workspace);
  const [error, setError] = useState('');
  const requestSeq = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const loadWorkspace = useCallback(async (options?: LoadWorkspaceOptions) => {
    const queryDate = options?.targetDate || date;
    const queryRegion = options?.targetRegion || region;
    const key = cacheKey(queryDate, queryRegion);
    const cached = !options?.force ? (workspaceCache.get(key) as TWorkspace | undefined) : undefined;

    if (cached) {
      setWorkspace(cached);
      setLoading(false);
    }

    const seq = ++requestSeq.current;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    if (!cached && !options?.silent) setLoading(true);
    if (!cached) setError('');

    try {
      const response = await fetch(`/api/workspace?date=${encodeURIComponent(queryDate)}&region=${encodeURIComponent(queryRegion)}`, {
        cache: 'no-store',
        signal: controller.signal,
      });
      const payload = await response.json();
      if (seq !== requestSeq.current) return null;
      if (!response.ok || !payload.ok) {
        if (!cached) setError(payload.error || 'Không tải được dữ liệu.');
        return null;
      }
      workspaceCache.set(key, payload);
      setWorkspace(payload as TWorkspace);
      return payload as TWorkspace;
    } catch (loadError) {
      if ((loadError as Error).name === 'AbortError') return null;
      if (seq === requestSeq.current && !cached) setError('Không tải được dữ liệu.');
      return null;
    } finally {
      if (seq === requestSeq.current) {
        if (abortRef.current === controller) abortRef.current = null;
        setLoading(false);
      }
    }
  }, [date, region]);

  useEffect(() => {
    void loadWorkspace({ targetDate: date, targetRegion: region });
    return () => abortRef.current?.abort();
  }, [date, region, loadWorkspace]);

  return { workspace, loading, error, setError, loadWorkspace };
}
