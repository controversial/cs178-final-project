import React, { useMemo } from 'react';
import * as d3 from 'd3';

import useElementSize from '../../helpers/use-element-size';

import styles from './TripTime.module.scss';
import classNames from 'classnames/bind';
import { useData } from '../DataProvider';
const cx = classNames.bind(styles);


export default function TripTime() {
  const [baseRef, [width, height]] = useElementSize();
  const { selectedTrips, allTrips } = useData();

  const tripsSegmentTimes = useMemo(() => new Map(
    [...selectedTrips].map((tripId) => {
      const trip = allTrips.get(tripId);
      if (!trip) throw new Error('missing trip (invariant violation)');
      const segmentTimes = trip.slice(0, -1).map((r, i) => +trip[i + 1]!.timestamp - +r.timestamp);
      return [tripId, segmentTimes];
    }),
  ), [allTrips, selectedTrips]);

  const scaleX = useMemo(
    () => d3.scaleLinear()
      .domain([0, Math.max(...[...tripsSegmentTimes.values()].map((t) => t.length))])
      .range([0, width ?? 0]),
    [tripsSegmentTimes, width],
  );
  const scaleY = useMemo(
    () => d3.scaleLinear()
      .domain([0, Math.max(...[...tripsSegmentTimes.values()].flat())])
      .range([0, height ?? 0]),
    [tripsSegmentTimes, height],
  );

  return (
    <div className={cx('base')} ref={baseRef}>
      {width != null && height != null && (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          {[...tripsSegmentTimes.entries()].map(([tripId, segmentTimes]) => {
            const line = d3.line().curve(d3.curveNatural);
            const path = line(segmentTimes.map((t, i) => [scaleX(i), scaleY(t)]));
            if (!path) return null;
            return (
              <g key={tripId}>
                <path d={path} fill="none" stroke="red" strokeWidth="2" />
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}
