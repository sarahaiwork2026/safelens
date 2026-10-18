import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { TestRunCreated } from 'core';
import { api, ApiError } from '../../lib/api';
import { queryClient } from '../../lib/query';
import { copy } from '../../copy';
function restoreRun(): TestRunCreated | null {
  try {
    const value: unknown = JSON.parse(
      sessionStorage.getItem('safelens-test-run') ?? 'null',
    );
    if (
      value &&
      typeof value === 'object' &&
      'runId' in value &&
      typeof value.runId === 'string' &&
      'baseTime' in value &&
      typeof value.baseTime === 'number' &&
      'order' in value &&
      Array.isArray(value.order) &&
      value.order.every((v) => typeof v === 'string')
    )
      return {
        runId: value.runId,
        baseTime: value.baseTime,
        order: value.order,
      };
  } catch (error) {
    if (error instanceof Error) console.info('Test run could not be restored');
  }
  return null;
}

export function useTestRun() {
  const [engine, setEngine] = useState<'rules' | 'ai'>('rules'),
    [run, setRun] = useState<TestRunCreated | null>(restoreRun),
    [running, setRunning] = useState(false),
    [error, setError] = useState(''),
    [waiting, setWaiting] = useState(0);
  const health = useQuery({ queryKey: ['health'], queryFn: api.health }),
    query = useQuery({
      queryKey: ['test-run', run?.runId],
      queryFn: () => api.results(run?.runId ?? ''),
      enabled: Boolean(run),
    }),
    data = query.data;
  const passed = data?.results.filter((r) => r.pass).length ?? 0,
    total = data?.results.length ?? 0;
  async function wait(seconds: number) {
    for (let n = seconds; n > 0; n--) {
      setWaiting(n);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    setWaiting(0);
  }
  async function start() {
    setError('');
    setRunning(true);
    try {
      let active = run;
      if (!active || total === 25) {
        active = await api.run(engine);
        setRun(active);
        try {
          sessionStorage.setItem('safelens-test-run', JSON.stringify(active));
        } catch (storageError) {
          if (storageError instanceof Error)
            console.info('Test run persistence unavailable');
        }
      }
      const existing = await api.results(active.runId);
      const completed = new Set(existing.results.map((r) => r.reportId));
      for (const reportId of active.order) {
        if (completed.has(reportId)) continue;
        let accepted = false;
        while (!accepted) {
          try {
            await api.step(active.runId, reportId);
            accepted = true;
          } catch (stepError) {
            if (
              stepError instanceof ApiError &&
              stepError.code === 'rate_limited' &&
              stepError.retryAfter > 0
            ) {
              await wait(Math.min(stepError.retryAfter, 60));
              continue;
            }
            throw stepError;
          }
        }
        const updated = await api.results(active.runId);
        queryClient.setQueryData(['test-run', active.runId], updated);
        if (existing.engine === 'ai') await wait(3);
      }
    } catch (runError) {
      setError(
        runError instanceof Error ? runError.message : copy.errors.generic,
      );
    } finally {
      setRunning(false);
    }
  }
  async function reset() {
    if (!run) return;
    setError('');
    try {
      await api.reset(run.runId);
      queryClient.removeQueries({ queryKey: ['test-run', run.runId] });
      setRun(null);
      sessionStorage.removeItem('safelens-test-run');
    } catch (resetError) {
      setError(
        resetError instanceof Error ? resetError.message : copy.errors.generic,
      );
    }
  }
  return {
    engine,
    setEngine,
    run,
    running,
    error,
    waiting,
    health,
    query,
    data,
    passed,
    total,
    start,
    reset,
  };
}
