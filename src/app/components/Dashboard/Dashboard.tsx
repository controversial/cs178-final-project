import React, { useCallback } from 'react';
import { useData } from '../DataProvider';

import TripTime from '../TripTime';
import Histogram from '../Histogram';
import VehicleFilter from '../VehicleFilter';
import Heatmap from '../Heatmap/Heatmap';
import TripSelector from '../TripSelector';

import styles from './Dashboard.module.scss';
import classNames from 'classnames/bind';
const cx = classNames.bind(styles);

export default function DashboardLayout() {
  const { selectedTrips, filteredTrips } = useData();
  const visibleSelectedTrips = [...selectedTrips].filter((tripId) => filteredTrips.has(tripId));

  return (
    <div className={cx('base', { 'selected-trips': visibleSelectedTrips.length > 0 })}>
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
