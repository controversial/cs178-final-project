import React, { useCallback } from 'react';
import { useData } from './components/DataProvider';

import TripTime from './components/TripTime';
import Histogram from './components/Histogram';
import VehicleFilter from './components/VehicleFilter';
import Heatmap from './components/Heatmap/Heatmap';
import TripSelector from './components/TripSelector';

import styles from './Dashboard.module.scss';
import classNames from 'classnames/bind';
const cx = classNames.bind(styles);

export default function DashboardLayout() {
  const { selectedTrips } = useData();

  return (
    <div className={cx('base', { 'selected-trips': selectedTrips.size > 0 })}>
      <Histogram
        label="Histogram: Months"
        className={cx('month-histogram')}
        accessor={useCallback((d) => d.timestamp.getUTCMonth(), [])}
        bins={new Array(12).fill(0).map((_, i) => i)}
        binLabels={new Array(12).fill(0).map((_, monthIdx) => new Date(2020, monthIdx).toLocaleString('default', { timeZone: 'UTC', month: 'short' }))}
      />
      <Histogram
        label="Histogram: Hours"
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
      <TripSelector className={cx('trip-selector')} />
    </div>
  );
}