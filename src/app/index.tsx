import React, { Suspense, useCallback } from 'react';
import TripTime from './components/TripTime';
import Histogram from './components/Histogram';
import VehicleFilter from './components/VehicleFilter';
import Heatmap from './components/Heatmap/Heatmap';

import styles from './index.module.scss';
import classNames from 'classnames/bind';
const cx = classNames.bind(styles);

const DataProvider = React.lazy(() => import('./components/DataProvider'));


export default function App() {
  return (
    <div className={cx('base')}>
      <Suspense fallback={<p>Loading...</p>}>
        <DataProvider>
          <Histogram
            className={cx('month-histogram')}
            accessor={useCallback((d) => d.timestamp.getUTCMonth(), [])}
            bins={new Array(12).fill(0).map((_, i) => i)}
          />
          <Histogram
            className={cx('time-histogram')}
            accessor={useCallback((d) => d.timestamp.getUTCHours(), [])}
            bins={new Array(24).fill(0).map((_, i) => i)}
          />
          <Heatmap
            className={cx('heatmap')}
          />
          <TripTime
            className={cx('selected-trips-time')}
          />
          <VehicleFilter className={cx('vehicle-filter')} />
        </DataProvider>
      </Suspense>
    </div>
  );
}
