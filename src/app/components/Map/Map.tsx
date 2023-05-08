import React, { useMemo } from 'react';
import useGlobalStore from '../../global-store';
import { useData } from '../DataProvider';
import { Row } from '../../data/utils/schemas';
import { adjacencyGraph, paths, smoothPaths } from './roadways';
import { concatPaths, simplifyPath, shiftPath, removeClosePoints } from './path-utils';

import * as d3 from 'd3';

import classNames from 'classnames';
import classNamesBinder from 'classnames/bind';
import styles from './Map.module.scss';
const cx = classNamesBinder.bind(styles);


const line = d3.line();


function Heatmap({ img }: { img: React.ReactElement }) {
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

  const maxFreq = Math.max(...Object.values(freqs));
  const alphaScale = d3.scaleLinear().domain([1, maxFreq]).range([0, 80]);

  return (
    <>
      <figcaption>Heatmap</figcaption>
      <div className={cx('container')}>
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
        {img}
      </div>
    </>
  );
}


function TripLine({ tripId, color }: { tripId: number, color: string }) {
  const { filteredTrips } = useData();
  const trip = filteredTrips.get(tripId);
  const tripPath = useMemo(() => {
    if (!trip) return null;
    const componentPaths: { x: number, y: number }[][] = [];
    for (let i = 1; i < trip.length; i += 1) {
      const sensor1 = trip[i - 1]!.gateName;
      const sensor2 = trip[i]!.gateName;
      const tracedPath = paths[`${sensor1}--${sensor2}`];
      const fallbackPath = [adjacencyGraph[sensor1], adjacencyGraph[sensor2]];
      componentPaths.push(tracedPath ?? fallbackPath);
    }
    let points = concatPaths(componentPaths);
    points = simplifyPath(points, 0.3, 0.3);
    points = removeClosePoints(points, 1);
    points = shiftPath(points, 1.5, 3);
    points = simplifyPath(points, 0.7, 0.1);
    return points;
  }, [trip]);

  if (!tripPath) return null;
  const pathString = line(tripPath.map(({ x, y }) => [x + 0.5, y + 0.5]));
  if (!pathString) return null;

  return (
    <path
      d={pathString}
      stroke={color}
      strokeWidth={3}
      fill="none"
    />
  );
}


function SelectedTripsMap({ img }: { img: React.ReactElement }) {
  const selectedTrips = useGlobalStore((state) => state.selectedTrips);
  const selectedTripsColorScale = useGlobalStore((state) => state.computed.selectedTripsColorScale);

  return (
    <>
      <figcaption>Selected Trips: Map</figcaption>
      <div className={cx('container')}>
        <svg viewBox="0 0 200 200">
          {[...selectedTrips].map((tripId) => (
            <TripLine
              key={tripId}
              tripId={tripId}
              color={selectedTripsColorScale(tripId)}
            />
          ))}
        </svg>
        {img}
      </div>
    </>
  );
}


export default function Map({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const selectedGates = useGlobalStore((state) => state.selectedGates);
  const clearSelectedGates = useGlobalStore((state) => state.clearSelectedGates);

  const selectedTrips = useGlobalStore((state) => state.selectedTrips);

  const img = <img src={`${import.meta.env.BASE_URL}basemap.bmp`} alt="Base map of the Lekagul Preserve" />;

  return (
    <figure className={classNames(cx('base'), className)} {...props}>
      {selectedTrips.size ? <SelectedTripsMap img={img} /> : <Heatmap img={img} />}
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
