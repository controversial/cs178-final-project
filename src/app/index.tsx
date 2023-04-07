import React, { useMemo, useState } from 'react';
import type { Row, RowWithTrip } from './data/schema';
import { dataPromise } from './data';

import styles from './index.module.scss';
import classNames from 'classnames/bind';
const cx = classNames.bind(styles);

function calculateTrips(rows: Row[] | undefined) {
  if (!rows) return undefined;

  rows.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  rows.sort((a, b) => a.carId.localeCompare(b.carId));

  let tripId = -1;
  let inPark = false;
  let prevCarId = '';
  rows.map((row, i) => {
    if (row.carId !== prevCarId) {
      inPark = row.gateName.startsWith('entrance');
      prevCarId = row.carId;
      tripId += 1;
    } else if (row.gateName.startsWith('entrance')) {
      inPark = !inPark;
      if (inPark) tripId += 1;
    }

    return { ...row, tripId };
  });

  return rows;
}

export default function App() {
  const [rows, setRows] = useState<Row[] | undefined>(undefined);
  const rowsWithTrips = useMemo(() => calculateTrips(rows?.slice()), [rows]);

  dataPromise
    .then((data) => { setRows(data); })
    .catch((e) => console.error(e));

  return (
    <div className={cx('base')}>
      <h1>CS178 Final Project</h1>
      <p>{!rows ? 'Loading...' : `Got ${rows.length.toLocaleString()} rows`}</p>
    </div>
  );
}
