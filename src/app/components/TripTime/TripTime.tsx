import React, { useMemo } from 'react';
import * as d3 from 'd3';
import wrapChart from '../ChartWrapper/ChartWrapper';
import { useData } from '../DataProvider';

import styles from './TripTime.module.scss';
import classNamesBinder from 'classnames/bind';
import classNames from 'classnames';
const cx = classNamesBinder.bind(styles);

function TripTimeSvg({
  width,
  height,
  ...props
}: {
  width: number;
  height: number;
} & Omit<React.HTMLAttributes<SVGElement>, 'width' | 'height' | 'viewBox'>) {
  const { selectedTrips, filteredTrips } = useData();

  const tripsSegmentTimes = useMemo(() => new Map(
    [...selectedTrips].flatMap((tripId) => {
      const trip = filteredTrips.get(tripId);
      if (!trip) return [];
      const segmentTimes = trip.slice(0, -1).map((r, i) => +trip[i + 1]!.timestamp - +r.timestamp);
      return [[tripId, segmentTimes]];
    }),
  ), [filteredTrips, selectedTrips]);

  const scaleX = useMemo(
    () => d3.scaleLinear()
      .domain([0, Math.max(...[...tripsSegmentTimes.values()].map((t) => t.length))])
      .range([0, width]),
    [tripsSegmentTimes, width],
  );
  const scaleY = useMemo(
    () => d3.scaleLinear()
      .domain([0, Math.max(...[...tripsSegmentTimes.values()].flat())])
      .range([height, 0]),
    [tripsSegmentTimes, height],
  );

  return (
    <svg {...props} width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {[...tripsSegmentTimes.entries()].map(([tripId, segmentTimes]) => {
        const line = d3.line().curve(d3.curveNatural);
        const path = line([
          [scaleX(0), scaleY(0)],
          ...segmentTimes.map((t, i): [number, number] => [scaleX(i + 1), scaleY(t)]),
        ]);
        if (!path) return null;
        return (
          <g key={tripId}>
            <path d={path} fill="none" stroke="red" strokeWidth="2" />
          </g>
        );
      })}
    </svg>
  );
}

const TripTimeGraph = wrapChart(TripTimeSvg);

export default function TripTime({
  className,
  ...props
}: React.ComponentProps<typeof TripTimeGraph>) {
  return (
    <div className={classNames(cx('base'), className)}>
      Selected Trips: Time Between Sensor Readings
      <TripTimeGraph {...props} />
    </div>
  );
}
