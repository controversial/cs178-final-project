import React, { useMemo } from 'react';
import useGlobalStore from '../../global-store';

import * as d3 from 'd3';

import { useData } from '../DataProvider';
import type { Row } from '../../data/utils/schemas';
import { gateNameSchema } from '../../data/utils/schemas';
import adjacencyGraph from '../../data/sensor-adjacency-graph';

import classNames from 'classnames';
import classNamesBinder from 'classnames/bind';
import styles from './Heatmap.module.scss';
const cx = classNamesBinder.bind(styles);


export default function Heatmap({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const { allTrips: trips } = useData();
  const hoveredGate = useGlobalStore((state) => state.hoveredGate);
  const freqs = useMemo(() => {
    const out: Partial<Record<`${Row['gateName']}--${Row['gateName']}`, number>> = {};
    [...trips.values()].forEach((tripRows) => {
      tripRows.slice(0, -1).forEach((row, i) => {
        const key = `${row.gateName}--${tripRows[i + 1]!.gateName}` as const;
        out[key] = (out[key] ?? 0) + 1;
      });
    });
    return out;
  }, [trips]);

  const widthScale = d3.scaleLinear().domain([0, d3.max(Object.values(freqs))!]).range([0, 20]);

  return (
    <figure className={classNames(cx('base'), className)} {...props}>
      <figcaption>Heatmap</figcaption>
      <svg viewBox="0 0 200 200">
        {Object.entries(freqs).map(([key, freq]) => {
          const [from, to] = key.split('--').map((gn) => gateNameSchema.parse(gn));
          const d = `M${adjacencyGraph[from!].x + 0.5},${adjacencyGraph[from!].y + 0.5} L${adjacencyGraph[to!].x + 0.5},${adjacencyGraph[to!].y + 0.5}`;
          return (
            <path key={key} d={d} fill="none" stroke="rgb(255 0 0 / 50%)" strokeWidth={widthScale(freq)} />
          );
        })}
        {hoveredGate && (
          <circle
            cx={adjacencyGraph[gateNameSchema.parse(hoveredGate)].x}
            cy={adjacencyGraph[gateNameSchema.parse(hoveredGate)].y}
            r="6"
            fill="blue"
          />
        )}
      </svg>

      <img src={`${import.meta.env.BASE_URL}basemap.bmp`} alt="Base map of the Lekagul Preserve" />
    </figure>
  );
}
