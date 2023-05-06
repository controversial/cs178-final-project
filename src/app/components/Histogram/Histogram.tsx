import React, { useMemo } from 'react';

import * as d3 from 'd3';
import { useData } from '../DataProvider';
import type { Row } from '../../data/utils/schemas';
import wrapChart from '../ChartWrapper/ChartWrapper';

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] as const;


function Histogram({ width, height }: { width: number, height: number }) {
  const { filteredReadings } = useData();

  const getMonth = (d: Row) => d.timestamp.getUTCMonth();

  // const monthCounts = useMemo(() => {}, []);
  const monthCounts = months.map(() => 0);
  filteredReadings.forEach((reading) => {
    const month = reading.timestamp.getUTCMonth();
    monthCounts[month] += 1;
  });

  const xMax = width;
  const yMax = height;

  // scales, memoize for performance
  const xScale = useMemo(
    () => d3.scaleBand<number>()
      .range([0, xMax])
      .round(true)
      .domain(filteredReadings.map(getMonth))
      .padding(0.4),
    [xMax, filteredReadings],
  );
  const yScale = useMemo(
    () => d3.scaleLinear()
      .rangeRound([yMax, 0])
      .domain([0, Math.max(...monthCounts)]),
    [yMax, monthCounts],
  );

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {monthCounts.map((count, monthIdx) => {
        const barWidth = xScale.bandwidth();
        const barHeight = yMax - yScale(count);
        const barX = xScale(monthIdx);
        const barY = yMax - barHeight;
        return (
          <rect
            key={`bar-${months[monthIdx]}`}
            x={barX}
            y={barY}
            width={barWidth}
            height={barHeight}
            fill="blue"
          />
        );
      })}
    </svg>
  );
}

export default wrapChart(Histogram);
