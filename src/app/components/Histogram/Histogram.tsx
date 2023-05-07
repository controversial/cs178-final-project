import React, { useMemo } from 'react';

import * as d3 from 'd3';
import wrapChart from '../ChartWrapper/ChartWrapper';

import { useData } from '../DataProvider';
import type { Row } from '../../data/utils/schemas';

import styles from './Histogram.module.scss';
import classNamesBinder from 'classnames/bind';
import classNames from 'classnames';
const cx = classNamesBinder.bind(styles);


function HistogramBarsSvg<T extends { toString(): string }>({
  width,
  height,
  accessor,
  bins,
  binLabels = undefined,
  ...props
}: {
  width: number,
  height: number,
  accessor: (d: Row) => T,
  bins: T[],
  binLabels?: string[],
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
      .domain(bins)
      .range([0, xMax])
      .round(true)
      .padding(0.4),
    [bins, xMax],
  );
  const yScale = useMemo(
    () => d3.scaleLinear()
      .rangeRound([yMax, 20])
      .domain([0, Math.max(...freqs)]),
    [yMax, freqs],
  );

  return (
    <svg {...props} width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {freqs.map((count, binIdx) => {
        const barWidth = xScale.bandwidth();
        const barHeight = yMax - yScale(count);
        const barX = xScale(bins[binIdx]!)!;
        const barY = yMax - barHeight;
        const labelX = barX + barWidth / 2;
        const labelY = yMax - 15;
        return (
          <g key={`bar-${binIdx}`}>
            <rect
              x={barX}
              y={barY - 20}
              width={barWidth}
              height={barHeight}
              fill="blue"
            />
            <text
              x={labelX}
              y={labelY}
              fill="white"
              textAnchor="middle"
              dominantBaseline="hanging"
            >
              {(binLabels ? binLabels[binIdx] : bins[binIdx]?.toString()) ?? null}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

const HistogramBars = wrapChart(HistogramBarsSvg);


export default function Histogram({
  label,
  className,
  ...props
}: {
  label: React.ReactNode,
} & React.ComponentProps<typeof HistogramBars>) {
  return (
    <figure className={classNames(cx('base'), className)}>
      <figcaption>{label}</figcaption>
      <HistogramBars {...props} />
    </figure>
  );
}
