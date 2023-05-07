import React, { useMemo } from 'react';
import useGlobalStore from '../../global-store';

import * as d3 from 'd3';

import { useData } from '../DataProvider';
import { Row, gateNames, gateNameSchema } from '../../data/utils/schemas';
import { adjacencyGraph, paths } from './roadways';

import classNames from 'classnames';
import classNamesBinder from 'classnames/bind';
import styles from './Heatmap.module.scss';
const cx = classNamesBinder.bind(styles);


export default function Heatmap({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const { filteredTrips: trips } = useData();
  const hoveredGate = useGlobalStore((state) => state.hoveredGate);
  const selectedGates = useGlobalStore((state) => state.selectedGates);
  const selectGate = useGlobalStore((state) => state.selectGate);
  const deselectGate = useGlobalStore((state) => state.deselectGate);
  const clearSelectedGates = useGlobalStore((state) => state.clearSelectedGates);

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
        {gateNames.map((gn) => (
          <g key={gn}>
            <circle
              cx={adjacencyGraph[gn].x}
              cy={adjacencyGraph[gn].y}
              r="2.5"
              fill={selectedGates.has(gn) ? 'white' : 'black'}
              stroke="white"
              strokeWidth="1"
            />
            <circle
              cx={adjacencyGraph[gn].x}
              cy={adjacencyGraph[gn].y}
              r="6"
              fill="transparent"
              onClick={() => (selectedGates.has(gn) ? deselectGate(gn) : selectGate(gn))}
              style={{ cursor: 'pointer' }}
            />
          </g>
        ))}
      </svg>

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
