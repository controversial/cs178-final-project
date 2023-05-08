import React, { useMemo } from 'react';
import useGlobalStore from '../../global-store';

import * as d3 from 'd3';

import { useData } from '../DataProvider';
import { Row } from '../../data/utils/schemas';
import { adjacencyGraph, smoothPaths } from './roadways';

import classNames from 'classnames';
import classNamesBinder from 'classnames/bind';
import styles from './Map.module.scss';
const cx = classNamesBinder.bind(styles);


function Heatmap() {
  const { filteredTrips: trips } = useData();

  const freqs = useMemo(() => {
    const out: Partial<Record<`${Row['gateName']}--${Row['gateName']}`, number>> = {};
    [...trips.values()].forEach((tripRows) => {
      tripRows.slice(0, -1).forEach((row, i) => {
        const a = row.gateName;
        const b = tripRows[i + 1]!.gateName;
        const key = `${a}--${b}` as const;
        if (a !== b) out[key] = (out[key] ?? 0) + 1;
      });
    });
    return out;
  }, [trips]);

  const line = d3.line();
  const maxFreq = Math.max(...Object.values(freqs));
  const alphaScale = d3.scaleLinear().domain([1, maxFreq]).range([0, 80]);

  return (
    <svg viewBox="0 0 200 200">
      {Object.entries(freqs).map(([key, freq]) => {
        const [from, to] = key.split('--') as [Row['gateName'], Row['gateName']];
        const straightLinePath = `M${adjacencyGraph[from!].x + 0.5},${adjacencyGraph[from!].y + 0.5} L${adjacencyGraph[to!].x + 0.5},${adjacencyGraph[to!].y + 0.5}`;
        const smoothPathPoints = smoothPaths[key];
        const smoothPath = smoothPathPoints
          && line(smoothPathPoints.map(({ x, y }) => [x + 0.5, y + 0.5]));
        const d = smoothPath ?? straightLinePath;
        return (
          <path
            key={key}
            d={d}
            fill="none"
            stroke={`rgb(255 0 0 / ${alphaScale(freq)}%)`}
            strokeWidth={5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}


export default function Map({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const selectedGates = useGlobalStore((state) => state.selectedGates);
  const clearSelectedGates = useGlobalStore((state) => state.clearSelectedGates);

  return (
    <figure className={classNames(cx('base'), className)} {...props}>
      <figcaption>Heatmap</figcaption>
      <Heatmap />
      <img src={`${import.meta.env.BASE_URL}basemap.bmp`} alt="Base map of the Lekagul Preserve" />
      {selectedGates.size ? (
        <button
          className={cx('clear')}
          type="button"
          onClick={clearSelectedGates}
        >
          Clear
        </button>
      ) : null}
    </figure>
  );
}
