import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

import type { Row } from '../../data/utils/schemas';
import { gateNameSchema } from '../../data/utils/schemas';
import rows from '../../data/sensor-readings';
import adjacencyGraph from '../../data/sensor-adjacency-graph';

import classNames from 'classnames/bind';
import styles from './Heatmap.module.scss';
const cx = classNames.bind(styles);

const trips = d3.group(rows, (r) => r.tripId);
const freqs: Partial<Record<`${Row['gateName']}--${Row['gateName']}`, number>> = {};
trips.forEach((tripRows) => {
  tripRows.slice(0, -1).forEach((row, i) => {
    const key = `${row.gateName}--${tripRows[i + 1]!.gateName}` as const;
    freqs[key] = (freqs[key] ?? 0) + 1;
  });
});


export default function Heatmap() {
  const widthScale = d3.scaleLinear().domain([0, d3.max(Object.values(freqs))!]).range([0, 20]);

  return (
    <div className={cx('base')}>
      <svg width="100%" height="100%" viewBox="0 0 200 200">
        {Object.entries(freqs).map(([key, freq]) => {
          const [from, to] = key.split('--').map((gn) => gateNameSchema.parse(gn));
          const d = `M${adjacencyGraph[from!].x + 0.5},${adjacencyGraph[from!].y + 0.5} L${adjacencyGraph[to!].x + 0.5},${adjacencyGraph[to!].y + 0.5}`;
          return (
            <path key={key} d={d} fill="none" stroke="rgb(255 0 0 / 50%)" strokeWidth={widthScale(freq)} />
          );
        })}
      </svg>

      <img src="/basemap.bmp" alt="Base map of the Lekagul Preserve" />
    </div>
  );
}
