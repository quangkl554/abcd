'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type WorkspaceRegion = 'nam' | 'trung' | 'bac' | 'all';
export type WorkspaceEndpoint = 'app' | 'results' | 'summary' | 'legacy';

type LoadWorkspaceOptions = {
  force?: boolean;
  targetDate?: string;
  targetRegion?: WorkspaceRegion;
  silent?: boolean;
};

type UseWorkspaceOptions = {
  endpoint?: WorkspaceEndpoint;
  params?: Record<string, string | number | boolean | null | undefined>;
  enabled?: boolean;
};

const workspaceCache = new Map<string, unknown>();

function cacheKey(endpoint: WorkspaceEndpoint, date: string, region: WorkspaceRegion, paramsKey: string) {
  return `${endpoint}|${date}|${region}|${paramsKey}`;
}

export function invalidateWorkspaceCache(date?: string, region?: WorkspaceRegion) {
  if (!date) {
    workspaceCache.clear();
    return;
  }
  for (const key of workspaceCache.keys()) {
    const [, cachedDate, cachedRegion] = key.split('|');
    const sameRegion = !region || cachedRegion === region;
    const aggregateAffected = region && region !== 'all' && cachedRegion === 'all';
    if (cachedDate === date && (sameRegion || aggregateAffected)) {
      workspaceCache.delete(key);
    }
  }
}

export function useWorkspaceData<TWorkspace>(date: string, region: WorkspaceRegion, options?: UseWorkspaceOptions) {
  const endpoint = options?.endpoint || 'legacy';
  const enabled = options?.enabled ?? true;
  const paramsKey = stableParams(options?.params);
  const [workspace, setWorkspace] = useState<TWorkspace | null>(() => {
    return (workspaceCache.get(cacheKey(endpoint, date, region, paramsKey)) as TWorkspace | undefined) || null;
  });
  const [loading, setLoading] = useState(enabled && !workspace);
  const [error, setError] = useState('');
  const requestSeq = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const loadWorkspace = useCallback(async (options?: LoadWorkspaceOptions) => {
    if (!enabled) return null;
    const queryDate = options?.targetDate || date;
    const queryRegion = options?.targetRegion || region;
    if (options?.force) invalidateWorkspaceCache(queryDate, queryRegion);

    const key = cacheKey(endpoint, queryDate, queryRegion, paramsKey);
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
    if (!cached) {
      setWorkspace(null);
      setError('');
    }

    try {
      const response = await fetch(workspaceUrl(endpoint, queryDate, queryRegion, paramsKey), {
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
  }, [date, enabled, endpoint, paramsKey, region]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    void loadWorkspace({ targetDate: date, targetRegion: region });
    return () => abortRef.current?.abort();
  }, [date, enabled, region, paramsKey, loadWorkspace]);

  return { workspace, loading, error, setError, loadWorkspace };
}

function workspaceUrl(endpoint: WorkspaceEndpoint, date: string, region: WorkspaceRegion, paramsKey: string) {
  const path = endpointPath(endpoint, region);
  const query = new URLSearchParams(paramsKey);
  query.set('date', date);
  if (endpoint !== 'legacy' || region !== 'all') query.set('region', region);
  return `${path}?${query.toString()}`;
}

function endpointPath(endpoint: WorkspaceEndpoint, region: WorkspaceRegion) {
  if (endpoint === 'app') return '/api/workspace/app';
  if (endpoint === 'results') return '/api/workspace/results';
  if (endpoint === 'summary') return '/api/workspace/summary';
  return region === 'all' ? '/api/workspace/day' : '/api/workspace';
}

function stableParams(params?: UseWorkspaceOptions['params']) {
  if (!params) return '';
  const entries = Object.entries(params)
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => [key, String(value)] as [string, string]);
  return new URLSearchParams(entries).toString();
}
