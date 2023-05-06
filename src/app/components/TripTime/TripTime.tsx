import React, { useMemo } from 'react';
import * as d3 from 'd3';
import wrapChart from '../ChartWrapper/ChartWrapper';
import { useData } from '../DataProvider';

function TripTime({
  width,
  height,
  ...props
}: {
  width: number;
  height: number;
} & Omit<React.HTMLAttributes<SVGElement>, 'width' | 'height' | 'viewBox'>) {
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

export default wrapChart(TripTime);
