// Runs one scenario for one version, then prints operations per second as JSON.
// run.ts starts a fresh process for each run, so the JIT state of one
// scenario cannot change the results of another.
import { callsPerSample, scenarios, sink, type Version } from './scenarios.ts';

const [scenarioName, version] = process.argv.slice(2) as [string, Version];
const makeSample = scenarios[scenarioName];
if (!makeSample || (version !== 'v6' && version !== 'v7')) {
  throw new Error(`Unknown scenario or version: ${scenarioName} ${version}`);
}
const sample = makeSample(version);

function runFor(ms: number, onSample?: (ns: number) => void): void {
  const end = performance.now() + ms;
  while (performance.now() < end) {
    const start = process.hrtime.bigint();
    sample();
    onSample?.(Number(process.hrtime.bigint() - start));
  }
}

// warm up, so the JIT has optimized the code before we measure
runFor(1_000);

const times: number[] = [];
runFor(2_000, (ns) => times.push(ns));
times.sort((a, b) => a - b);
const median = times[Math.floor(times.length / 2)];

process.stdout.write(
  JSON.stringify({ opsPerSecond: callsPerSample / (median / 1e9), sink: sink.value }),
);
