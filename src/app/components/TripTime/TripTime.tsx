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
      const segmentTimes = trip
        .map((r, i) => (
          i === 0
            ? 0
            : +r.timestamp - +trip[i - 1]!.timestamp
        ))
        .map((ms) => ms / 1000 / 60 / 60); // convert to hours
      return [[tripId, segmentTimes]];
    }),
  ), [filteredTrips, selectedTrips]);

  const scaleX = useMemo(
    () => d3.scaleLinear()
      .domain([0, Math.max(...[...tripsSegmentTimes.values()].map((t) => t.length))])
      .range([35, width - 5]),
    [tripsSegmentTimes, width],
  );
  const scaleY = useMemo(
    () => d3.scaleLinear()
      .domain([0, Math.max(...[...tripsSegmentTimes.values()].flat())])
      .range([height - 5, 5]),
    [tripsSegmentTimes, height],
  );

  const yAxis = useMemo(() => {
    const ticks = scaleY.ticks(5);
    return d3.axisLeft(scaleY).tickValues(ticks).tickFormat((d) => `${d3.format('~r')(d)}`);
  }, [scaleY]);

  return (
    <svg {...props} width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <g transform={`translate(${45}, ${0})`}>
        <g ref={(node) => { if (node) d3.select(node).call(yAxis); }} />
        <text
          x={-height / 2}
          y={-35}
          transform="rotate(-90)"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize="15"
        >
          Elapsed Time (hrs)
        </text>
      </g>
      {[...tripsSegmentTimes.entries()].map(([tripId, segmentTimes]) => {
        const line = d3.line().curve(d3.curveMonotoneX);
        const path = line(segmentTimes.map((t, i) => [scaleX(i), scaleY(t)]));
        if (!path) return null;
        return (
          <g key={tripId}>
            <path d={path} fill="none" stroke="red" strokeWidth="2" />
            {segmentTimes.map((t, i) => (
              <circle
                key={`${tripId}-${i}`}
                cx={scaleX(i)}
                cy={scaleY(t)}
                r="4"
                fill="red"
              />
            ))}
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
