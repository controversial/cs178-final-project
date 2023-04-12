import * as duckdb from '@duckdb/duckdb-wasm';

import duckdbWasm from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url';
import duckdbWorker from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url';

const worker = new Worker(duckdbWorker);
const logger = new duckdb.ConsoleLogger();
const db = new duckdb.AsyncDuckDB(logger, worker);
await db.instantiate(duckdbWasm);

export const conn = await db.connect();

let first = true;
export function insertArrow(ipc: Uint8Array) {
  const prom = conn.insertArrowFromIPCStream(ipc, {
    name: 'sensor_readings',
    create: first,
  });
  first = false;
  return prom;
}
