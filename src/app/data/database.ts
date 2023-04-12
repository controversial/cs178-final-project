import * as duckdb from '@duckdb/duckdb-wasm';
import { Row } from './schemas';

import duckdbWasm from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url';
import duckdbWorker from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url';

const worker = new Worker(duckdbWorker);
const logger = new duckdb.ConsoleLogger();
const db = new duckdb.AsyncDuckDB(logger, worker);
await db.instantiate(duckdbWasm);

export const conn = await db.connect();

let uid = 0;
export async function insertRows(rows: Row[]) {
  const path = `rows-${uid}.json`;
  const isFirst = uid === 0;
  uid += 1;

  await db.registerFileText(path, JSON.stringify(rows));
  await conn.insertJSONFromPath(path, {
    name: 'sensor_readings',
    create: isFirst,
  });
}
