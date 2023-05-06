import React, { useMemo } from 'react';

import * as d3 from 'd3';
import { useData } from '../DataProvider';
import type { Row } from '../../data/utils/schemas';
import wrapChart from '../ChartWrapper/ChartWrapper';


function Histogram<T extends { toString(): string }>({
  width,
  height,
  accessor,
  bins,
  ...props
}: {
  width: number,
  height: number,
  accessor: (d: Row) => T,
  bins: T[],
} & Omit<React.HTMLAttributes<SVGElement>, 'width' | 'height' | 'viewBox'>) {
  const { filteredReadings } = useData();

  const freqs = bins.map(() => 0);
  filteredReadings.forEach((reading) => {
    const key = accessor(reading);
    freqs[bins.indexOf(key)] += 1;
  });

  const xMax = width;
  const yMax = height;

  // scales, memoize for performance
  const xScale = useMemo(
    () => d3.scaleBand<T>()
      .range([0, xMax])
      .round(true)
      .domain(filteredReadings.map(accessor))
      .padding(0.4),
    [xMax, filteredReadings, accessor],
  );
  const yScale = useMemo(
    () => d3.scaleLinear()
      .rangeRound([yMax, 0])
      .domain([0, Math.max(...freqs)]),
    [yMax, freqs],
  );

  return (
    <svg {...props} width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {freqs.map((count, binIdx) => {
        const barWidth = xScale.bandwidth();
        const barHeight = yMax - yScale(count);
        const barX = xScale(bins[binIdx]!);
        const barY = yMax - barHeight;
        return (
          <rect
            key={`bar-${binIdx}`}
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
