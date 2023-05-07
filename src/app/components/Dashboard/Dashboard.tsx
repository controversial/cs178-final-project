import React, { useCallback } from 'react';
import { useData } from '../DataProvider';
import useGlobalStore from '../../global-store';

import TripTime from '../TripTime';
import Histogram from '../Histogram';
import VehicleFilter from '../VehicleFilter';
import Heatmap from '../Heatmap/Heatmap';
import TripSelector from '../TripSelector';

import styles from './Dashboard.module.scss';
import classNames from 'classnames/bind';
const cx = classNames.bind(styles);

export default function DashboardLayout() {
  const { filteredTrips } = useData();

  const selectedTrips = useGlobalStore((state) => state.selectedTrips);
  const setDateFilter = useGlobalStore((state) => state.setDateFilter);
  const clearDateFilter = useGlobalStore((state) => state.clearDateFilter);
  const setTimeFilter = useGlobalStore((state) => state.setTimeFilter);
  const clearTimeFilter = useGlobalStore((state) => state.clearTimeFilter);

  const visibleSelectedTrips = [...selectedTrips].filter((tripId) => filteredTrips.has(tripId));

  return (
    <div className={cx('base', { 'selected-trips': visibleSelectedTrips.length > 0 })}>
      <Histogram
        label="Histogram: Months"
        className={cx('month-histogram')}
        accessor={useCallback((d) => d.timestamp.getUTCMonth(), [])}
        bins={new Array(12).fill(0).map((_, i) => i)}
        binLabels={new Array(12).fill(0).map((_, monthIdx) => new Date(2020, monthIdx).toLocaleString('default', { timeZone: 'UTC', month: 'short' }))}
        onBrush={(startBinIndex, endBinIndex) => {
          let endBinIndexCapped = endBinIndex; // checks for selecting out of range past Dec
          if (endBinIndexCapped === 12) {
            endBinIndexCapped = 11;
          }
          const startDate = new Date(Date.UTC(startBinIndex < 4 ? 2016 : 2015, startBinIndex, 1));
          const endYear = endBinIndex < 4 ? 2016 : 2015;
          const endDate = new Date(Date.UTC(
            endBinIndexCapped === 11 ? endYear + 1 : endYear,
            (endBinIndexCapped + 1) % 12,
            0,
          ));
          setDateFilter(startDate, endDate);
        }}
        onClearBrush={clearDateFilter}
      />
      <Histogram
        label="Histogram: Hours"
        className={cx('time-histogram')}
        accessor={useCallback((d) => d.timestamp.getUTCHours(), [])}
        bins={new Array(24).fill(0).map((_, i) => i)}
        onBrush={(startBinIndex, endBinIndex) => { setTimeFilter(startBinIndex, endBinIndex); }}
        onClearBrush={clearTimeFilter}
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
