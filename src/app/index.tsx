import React, { useState } from 'react';
import { dataPromise } from './data';
import adjacencyGraphPromise from './data/sensor-graph';

import type { AdjacencyGraph, Row } from './data/schemas';
import type { AsyncDuckDBConnection } from '@duckdb/duckdb-wasm';

import { GlobalContextProvider } from './components/GlobalContext';

import styles from './index.module.scss';
import classNames from 'classnames/bind';
const cx = classNames.bind(styles);


export default function App() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [conn, setConn] = useState<AsyncDuckDBConnection | null>(null);
  const [graph, setGraph] = useState<AdjacencyGraph | null>(null);

  dataPromise
    .then((data) => {
      setRows(data.rows);
      setConn(data.conn);
      // @ts-ignore
      globalThis.rows = data.rows;
      // @ts-ignore
      globalThis.conn = data.conn;
    })
    .catch((e) => console.error(e));

  adjacencyGraphPromise
    .then((g) => {
      setGraph(g);
      // @ts-ignore
      globalThis.graph = g;
    })
    .catch((e) => console.error(e));

  if (!rows || !conn || !graph) return <p>Loading...</p>;

  return (
    <GlobalContextProvider conn={conn} graph={graph}>
      <div className={cx('base')}>
        <h1>CS178 Final Project</h1>
        <p>Got {rows.length.toLocaleString()} rows</p>
      </div>
    </GlobalContextProvider>
  );
}
