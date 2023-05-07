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
      .range([15, width - 5]),
    [tripsSegmentTimes, width],
  );
  const scaleY = useMemo(
    () => d3.scaleLinear()
      .domain([0, Math.max(...[...tripsSegmentTimes.values()].flat())])
      .range([height - 5, 5]),
    [tripsSegmentTimes, height],
  );

  return (
    <svg {...props} width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {[...tripsSegmentTimes.entries()].map(([tripId, segmentTimes]) => {
        const line = d3.line().curve(d3.curveMonotoneX);
        const path = line([
          [scaleX(0), scaleY(0)],
          ...segmentTimes.map((t, i): [number, number] => [scaleX(i + 1), scaleY(t)]),
        ]);
        if (!path) return null;
        return (
          <g key={tripId}>
            <path d={path} fill="none" stroke="red" strokeWidth="2" />
            {segmentTimes.map((t, i) => (
              <circle
                key={`${tripId}-${i + 1}`}
                cx={scaleX(i + 1)}
                cy={scaleY(t)}
                r="4"
                fill="red"
              />
            ))}
            {/* first circle */ }
            <circle
              key={`${tripId}-${0}`}
              cx={scaleX(0)}
              cy={scaleY(0)}
              r="4"
              fill="red"
            />
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
    <figure className={classNames(cx('base'), className)}>
      <figcaption>Selected Trips: Time Between Sensor Readings</figcaption>
      <TripTimeGraph {...props} />
    </figure>
  );
}
