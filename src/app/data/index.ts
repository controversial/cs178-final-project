import { workerMessageSchema } from './schema';
import type { Row } from './schema';

function assertNever(x: never): never { throw new Error(`Unexpected object: ${x}`); }

/** Does the fetching and the CPU-heavy processing on a separate thread */
export const worker = new Worker(
  new URL('./csv-worker.ts', import.meta.url),
  { type: 'module' },
);

/** Holds all the rows of the CSV */
export const rows: Row[] = [];

let startTime = 0;
/** Resolves when the rows have all been downloaded and parsed */
export const ready = new Promise<void>((resolve, reject) => {
  // Get ready to receive messages from the worker
  worker.addEventListener('message', (e) => {
    const message = workerMessageSchema.parse(e.data);
    if (message.type === 'update') {
      rows.push(...message.data);
      console.log(`[${((performance.now() - startTime) / 1000).toFixed(4)}s]  ${rows.length.toLocaleString()} rows  (${message.data.length.toLocaleString()} new)`);
    } else if (message.type === 'finished') {
      resolve();
      console.log(`[${((performance.now() - startTime) / 1000).toFixed(4)}s]  Finished loading ${rows.length.toLocaleString()} rows`);
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
