import { workerMessageSchema } from './schema';
import type { Row } from './schema';

function assertNever(x: never): never { throw new Error(`Unexpected object: ${x}`); }

/** Does the fetching and the CPU-heavy processing on a separate thread */
export const worker = new Worker(
  new URL('./csv-worker.ts', import.meta.url),
  { type: 'module' },
);

/**
 * Holds all the rows of the CSV.
 * Fills up gradually as CSV loads.
 */
export const rows: Row[] = [];

let startTime = 0;
/** Resolves when the rows have all been downloaded and parsed */
export const dataPromise = new Promise<Row[]>((resolve, reject) => {
  // Get ready to receive messages from the worker
  worker.addEventListener('message', (e) => {
    const message = workerMessageSchema.parse(e.data);
    if (message.type === 'rows') {
      console.log(`[${((performance.now() - startTime) / 1000).toFixed(4)}s]  ${(rows.length + message.data.length).toLocaleString()} rows  (${message.data.length.toLocaleString()} new)`);
      // manageable chunks to prevent call stack overflow
      for (let i = 0; i < message.data.length; i += 1000) {
        rows.push(...message.data.slice(i, i + 1000));
      }
    } else if (message.type === 'finished') {
      console.log(`[${((performance.now() - startTime) / 1000).toFixed(4)}s]  Finished loading ${rows.length.toLocaleString()} rows`);
      resolve(rows);
      console.log('rows sample', rows.slice(0, 10));
    } else {
      // make sure we’ve already handled all cases
      assertNever(message);
    }
  });
  // Handle errors that occur in the worker
  worker.addEventListener('error', (e) => {
    reject(e.error);
  });
  // Open the channel to start receiving messages
  console.log('Loading rows...');
  startTime = performance.now();
  worker.postMessage('start');
});
