import React, { Suspense, useState } from 'react';

import { GlobalContextProvider } from './components/GlobalContext';

import styles from './index.module.scss';
import classNames from 'classnames/bind';
const cx = classNames.bind(styles);

const Status = React.lazy(async () => {
  const { default: rows } = await import('./data/sensor-readings');
  return {
    default: () => <p>Got {rows.length.toLocaleString()} rows</p>,
  };
});
const Heatmap = React.lazy(() => import('./components/Heatmap'));
const TripExaminer = React.lazy(() => import('./components/TripExaminer'));

export default function App() {
  const [filters, setFilters] = useState<Record<string, string[]>>({});

  return (
    <GlobalContextProvider filters={filters} setFilters={setFilters}>
      <div className={cx('base')}>
        <h1>CS178 Final Project</h1>
        <Suspense fallback={<p>Loading...</p>}>
          <Status />
          <div className={cx('container')}>
            <Heatmap />
            <TripExaminer selectedGates={[]} />
          </div>
        </Suspense>
      </div>
    </GlobalContextProvider>
  );
}
