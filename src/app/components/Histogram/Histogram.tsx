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
  onBrush,
  onClearBrush,
  ...props
}: {
  width: number,
  height: number,
  accessor: (d: Row) => T,
  bins: T[],
  binLabels?: string[],
  onBrush: (
    start: { bin: T, binIdx: number, t: number } | null,
    end: { bin: T, binIdx: number, t: number } | null,
  ) => void,
  onClearBrush: () => void,
} & Omit<React.HTMLAttributes<SVGElement>, 'width' | 'height' | 'viewBox'>) {
  const { vehicleTypeFilteredReadings: filteredReadings } = useData();

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
      .paddingOuter(0)
      .paddingInner(0.2),
    [bins, xMax],
  );
  const yScale = useMemo(
    () => d3.scaleLinear()
      .rangeRound([yMax, 20])
      .domain([0, Math.max(...freqs)]),
    [yMax, freqs],
  );

  const brush = d3.brushX()
    .extent([[0, 0], [xMax, yMax - 20]])
    .on('end', (event: d3.D3BrushEvent<SVGGElement>) => {
      if (!event.selection) {
        onClearBrush();
        return;
      }
      const findBin = (x: number) => {
        const domain = xScale.domain();
        if (!domain[0]) return null;
        let binIdx = domain.findIndex((b) => xScale(b)! >= x) - 1;
        if (binIdx === -2) binIdx = domain.length - 1;
        if (binIdx === -1) binIdx = 0;

        const bin = bins[binIdx]!;
        const binX = xScale(bin)!;
        const binWidth = xScale.bandwidth();
        return { bin, binIdx, t: Math.min((x - binX) / binWidth, 1) };
      };

      const selection = event.selection as [number, number];
      onBrush(findBin(selection[0]), findBin(selection[1]));
    });

  return (
    <svg {...props} width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <g ref={(node) => { if (node) { d3.select(node).call(brush); } }}>
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
                fontSize={15}
              >
                {(binLabels ? binLabels[binIdx] : bins[binIdx]?.toString()) ?? null}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

const HistogramBars = wrapChart(HistogramBarsSvg) as <T extends { toString(): string }>(
  props: Omit<React.ComponentProps<typeof HistogramBarsSvg<T>>, 'width' | 'height'>,
) => JSX.Element;


export default function Histogram<T extends { toString(): string }>({
  label,
  className,
  ...props
}: {
  label: React.ReactNode,
} & React.ComponentProps<typeof HistogramBars<T>>) {
  return (
    <figure className={classNames(cx('base'), className)}>
      <figcaption>{label}</figcaption>
      <HistogramBars {...props} />
    </figure>
  );
}
