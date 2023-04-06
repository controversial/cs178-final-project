import { messageFromWorkerSchema } from './schema';
import type { MessageToWorker, Row } from './schema';

console.log(`[${(performance.now() / 1000).toFixed(4)}s]  script executing`);

function assertNever(x: never): never { throw new Error(`Unexpected object: ${x}`); }

/** Does CPU-heavy data processing on a separate thread */
export const worker = new Worker(
  new URL('./csv-worker.ts', import.meta.url),
  { type: 'module' },
);

/**
 * Holds all the rows of the CSV.
 * Fills up gradually as CSV loads.
 */
export const rows: Row[] = [];


export const dataPromise: Promise<Row[]> = fetch('/sensor-data.csv')
  .then((response) => new Promise((resolve, reject) => {
    // Keep track of how many chunks we’ve sent to the worker, and whether we’ve sent the whole file
    let finishedSending = false;
    let chunksSent = 0;
    let chunksReceived = 0;
    // Get ready to receive rows back from the worker
    worker.addEventListener('message', (e: MessageEvent<unknown>) => {
      const message = messageFromWorkerSchema.parse(e.data);
      if (message.type === 'rows') {
        chunksReceived += 1;
        if (message.data.length) {
          console.log(`[${(performance.now() / 1000).toFixed(4)}s]  receiving chunk ${chunksReceived} from worker (${message.data.length.toLocaleString()} rows; ${(rows.length + message.data.length).toLocaleString()} total)`);
          // Record new rows in manageable chunks to prevent call stack overflow
          for (let i = 0; i < message.data.length; i += 1000) {
            rows.push(...message.data.slice(i, i + 1000));
          }
        }
        // Check success condition
        if (finishedSending && chunksSent === chunksReceived) {
          console.log(`[${(performance.now() / 1000).toFixed(4)}s]  Finished loading ${rows.length.toLocaleString()} rows`);
          resolve(rows);
        }
      // make Typescript enforce that we handled all cases
      } else assertNever(message.type);
    });

    // Get ready to handle any error that occurs in the worker
    worker.addEventListener('error', (e) => {
      reject(e.error);
    });

    // Read the CSV in chunks and send them to the worker
    (async () => {
      if (!response.ok || response.body === null) throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
      for await (const chunk of response.body) {
        console.log(`[${(performance.now() / 1000).toFixed(4)}s]  sending chunk ${chunksSent + 1} to worker (${chunk.byteLength.toLocaleString()} bytes)`);
        worker.postMessage({ type: 'chunk', data: chunk } satisfies MessageToWorker, [chunk.buffer]);
        chunksSent += 1;
      }
      worker.postMessage({ type: 'chunk', data: new TextEncoder().encode('\n') } satisfies MessageToWorker);
      chunksSent += 1;

      finishedSending = true;
    })().catch((e) => reject(e));
  }));
