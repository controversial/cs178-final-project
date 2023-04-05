import React, { useState } from 'react';
import type { Row } from './data/schema';
import { dataPromise } from './data';

import styles from './index.module.scss';
import classNames from 'classnames/bind';
const cx = classNames.bind(styles);


export default function App() {
  const [rows, setRows] = useState<Row[] | null>(null);
  dataPromise.then((data) => { setRows(data); });

  return (
    <div className={cx('base')}>
      <h1>CS178 Final Project</h1>
      <p>{!rows ? 'Loading...' : `Got ${rows.length.toLocaleString()} rows`}</p>
    </div>
  );
}
