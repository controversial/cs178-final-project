import React, { useCallback } from 'react';
import { useData } from '../DataProvider';
import useGlobalStore from '../../global-store';

import TripTime from '../TripTime';
import Histogram from '../Histogram';
import VehicleFilter from '../VehicleFilter';
import Map from '../Map';
import TripSelector from '../TripSelector';

import styles from './Dashboard.module.scss';
import classNames from 'classnames/bind';
const cx = classNames.bind(styles);


function MonthHistogram() {
  const { allReadings } = useData();
  // 100 to cut off stragglers
  const firstDate = [
    allReadings[100]!.timestamp.getUTCFullYear(),
    allReadings[100]!.timestamp.getUTCMonth(),
  ] as const;
  const lastDate = [
    allReadings.at(-100)!.timestamp.getUTCFullYear(),
    allReadings.at(-100)!.timestamp.getUTCMonth(),
  ] as const;

  const months = new Array((lastDate[0] - firstDate[0]) * 12 + lastDate[1] - firstDate[1] + 1)
    .fill(null)
    .map((_, i) => new Date(Date.UTC(firstDate[0], firstDate[1] + i, 1)));
  const monthBins = months.map((d) => `${d.getUTCFullYear()}-${d.getUTCMonth()}` as const);

  const setDateFilter = useGlobalStore((state) => state.setDateFilter);
  const clearDateFilter = useGlobalStore((state) => state.clearDateFilter);

  return (
    <Histogram
      label="Histogram: Months"
      className={cx('month-histogram')}
      accessor={useCallback((d) => `${d.timestamp.getUTCFullYear()}-${d.timestamp.getUTCMonth()}`, [])}
      bins={monthBins}
      binLabels={months.map((d) => d.toLocaleString('default', { timeZone: 'UTC', month: 'short' }))}
      onBrush={(start, end) => {
        let startTimestamp: number = 0;
        let endTimestamp: number = allReadings.at(-1)!.timestamp.getTime() + 1;
        if (start) {
          const d1 = months[start.binIdx]!;
          const afterD1 = new Date(Date.UTC(d1.getUTCFullYear(), d1.getUTCMonth() + 1, 1));
          startTimestamp = +d1 + (start.t * (+afterD1 - +d1));
        }
        if (end) {
          const d2 = months[end.binIdx]!;
          const afterD2 = new Date(Date.UTC(d2.getUTCFullYear(), d2.getUTCMonth() + 1, 1));
          endTimestamp = +d2 + (end.t * (+afterD2 - +d2));
        }
        setDateFilter(new Date(startTimestamp), new Date(endTimestamp));
      }}
      onClearBrush={clearDateFilter}
    />
  );
}


export default function DashboardLayout() {
  const { filteredTrips } = useData();

  const selectedTrips = useGlobalStore((state) => state.selectedTrips);
  const setTimeFilter = useGlobalStore((state) => state.setTimeFilter);
  const clearTimeFilter = useGlobalStore((state) => state.clearTimeFilter);

  const visibleSelectedTrips = [...selectedTrips].filter((tripId) => filteredTrips.has(tripId));

  return (
    <div className={cx('base', { 'selected-trips': visibleSelectedTrips.length > 0 })}>
      <MonthHistogram />
      <Histogram
        label="Histogram: Hours"
        className={cx('time-histogram')}
        accessor={useCallback((d) => d.timestamp.getUTCHours(), [])}
        bins={new Array(24).fill(0).map((_, i) => i)}
        onBrush={(startBin, endBin) => {
          const s = startBin ? (startBin.bin + startBin.t) : -1;
          const e = endBin ? (endBin.bin + endBin.t) : -1;
          setTimeFilter(s, e);
        }}
        onClearBrush={clearTimeFilter}
      />
      <Map
        className={cx('map')}
      />
      <TripTime
        className={cx('selected-trips-time')}
      />
      <VehicleFilter className={cx('vehicle-filter')} />
      <TripSelector className={cx('trip-selector')} />
    </div>
  );
}
