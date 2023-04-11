import React, { useState } from 'react';
import { dataPromise } from './data';
import type { Row } from './data/schemas';

import styles from './index.module.scss';
import classNames from 'classnames/bind';
const cx = classNames.bind(styles);

export default function App() {
  const [rows, setRows] = useState<Row[] | undefined>(undefined);

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
