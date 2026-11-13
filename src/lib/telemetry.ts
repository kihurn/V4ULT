export interface Sample {
  time: number;
  duration: number;
  failed: boolean;
}
const samples: (Sample & { id: number })[] = [];
let nextSampleId = 0;
const listeners = new Set<() => void>();
let version = 0;
let epoch = 0;
export function recordSample(sample: Sample) {
  samples.push({ ...sample, id: nextSampleId++ });
  if (samples.length > 1000) samples.shift();
  version++;
  listeners.forEach((fn) => fn());
}
export function summarize(input: Sample[], now = Date.now()) {
  const durations = input.map((s) => s.duration),
    failed = input.filter((s) => s.failed).length;
  return {
    count: input.length,
    average: input.length
      ? durations.reduce((a, b) => a + b, 0) / input.length
      : null,
    peak: input.length ? Math.max(...durations) : null,
    recent: input.filter((s) => now - s.time < 60000).length,
    failed,
    errorRate: input.length ? (failed / input.length) * 100 : null,
    durations: durations.slice(-20),
  };
}
export const telemetry = {
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
  getVersion: () => version,
  getSummary: () => ({
    ...summarize(samples),
    bars: samples.slice(-20).map(({ id, duration }) => ({ id, duration })),
  }),
  reset() {
    epoch++;
    samples.length = 0;
    version++;
    listeners.forEach((fn) => fn());
  },
};
export async function observedFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  const start = performance.now(),
    currentEpoch = epoch;
  try {
    const response = await fetch(input, init);
    if (currentEpoch === epoch)
      recordSample({
        time: Date.now(),
        duration: performance.now() - start,
        failed: !response.ok,
      });
    return response;
  } catch (error) {
    if (
      currentEpoch === epoch &&
      !(error instanceof DOMException && error.name === "AbortError")
    )
      recordSample({
        time: Date.now(),
        duration: performance.now() - start,
        failed: true,
      });
    throw error;
  }
}
