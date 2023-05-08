import React, { useState, useRef, useMemo, useEffect } from 'react';
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

  // Each leg of the trip
  const segmentsPoints = useMemo(() => {
    if (!trip) return null;
    const out: { x: number, y: number }[][] = [];
    for (let i = 1; i < trip.length; i += 1) {
      const sensor1 = trip[i - 1]!.gateName;
      const sensor2 = trip[i]!.gateName;
      const tracedPath = paths[`${sensor1}--${sensor2}`];
      const fallbackPath = [adjacencyGraph[sensor1], adjacencyGraph[sensor2]];
      out.push(tracedPath ?? fallbackPath);
    }
    return out;
  }, [trip]);

  // The entire trip
  const tripPoints = useMemo(() => {
    if (!segmentsPoints) return null;
    let points = concatPaths(segmentsPoints);
    points = simplifyPath(points, 0.3, 0.3);
    points = removeClosePoints(points, 1);
    points = shiftPath(points, 1.5, 3);
    points = simplifyPath(points, 0.7, 0.1);
    return points;
  }, [segmentsPoints]);

  if (!tripPoints) return null;
  const pathString = line(tripPoints.map(({ x, y }) => [x + 0.5, y + 0.5]));
  if (!pathString) return null;

  return <path d={pathString} stroke={color} strokeWidth={3} fill="none" />;
}


function TripTrace({ tripId, color }: { tripId: number, color: string }) {
  const { filteredTrips } = useData();
  const trip = filteredTrips.get(tripId);

  // Each leg of the trip
  const segmentsPoints = useMemo(() => {
    if (!trip) return null;
    const out: { x: number, y: number }[][] = [];
    for (let i = 1; i < trip.length; i += 1) {
      const sensor1 = trip[i - 1]!.gateName;
      const sensor2 = trip[i]!.gateName;
      const tracedPath = smoothPaths[`${sensor1}--${sensor2}`];
      const fallbackPath = [adjacencyGraph[sensor1], adjacencyGraph[sensor2]];
      out.push(tracedPath ?? fallbackPath);
    }
    return out;
  }, [trip]);

  // Marker for “highlightX” position in the trip
  const highlightDotRef = useRef<SVGCircleElement>(null);
  // Keep a SVGPathElement for each leg of the trip as we need it to draw the highlight dot
  const [oldSegmentPaths, setOldSegmentPaths] = useState(segmentsPoints);
  const tripSegmentPaths = useRef<(SVGPathElement | null)[]>([]);
  if (segmentsPoints !== oldSegmentPaths) {
    setOldSegmentPaths(segmentsPoints);
    tripSegmentPaths.current = [];
  }
  // When the trip path changes
  useEffect(() => useGlobalStore.subscribe((state) => {
    const off = () => { if (highlightDotRef.current) highlightDotRef.current.setAttribute('display', 'none'); };
    if (!highlightDotRef.current) return null;
    if (state.selectedTripsHighlightX == null) return off();
    if (!segmentsPoints) return off();
    // which leg of the trip are we in?
    const legIdx = Math.floor(state.selectedTripsHighlightX);
    if (legIdx < 0 || legIdx >= segmentsPoints.length) return off();
    // Construct a SVG path for this leg if we don’t have one stored
    if (typeof tripSegmentPaths.current[legIdx] === 'undefined') {
      const path = line(segmentsPoints[legIdx]!.map(({ x, y }) => [x + 0.5, y + 0.5]));
      if (path) {
        tripSegmentPaths.current[legIdx] = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        tripSegmentPaths.current[legIdx]!.setAttribute('d', path);
      } else tripSegmentPaths.current[legIdx] = null;
    }
    const pathEl = tripSegmentPaths.current[legIdx];
    if (!pathEl) return off();
    // Get the position of the highlight dot in the leg
    const legX = state.selectedTripsHighlightX - legIdx;
    const pathLength = pathEl.getTotalLength();
    const { x, y } = pathEl.getPointAtLength(pathLength * legX);
    // Move the highlight dot to the position
    highlightDotRef.current.removeAttribute('display');
    highlightDotRef.current.setAttribute('cx', x.toString());
    highlightDotRef.current.setAttribute('cy', y.toString());
    return null;
  }));

  return (
    <circle
      ref={highlightDotRef}
      r={2}
      fill={color}
      stroke="rgb(0 0 0 / 50%)"
      strokeWidth={1}
      cx={0}
      cy={0}
      display="none"
    />
  );
}


function SelectedTripsMap({ img }: { img: React.ReactElement }) {
  const selectedTrips = useGlobalStore((state) => state.selectedTrips);
  const { selectedTripsColorScale } = useGlobalStore((state) => state.computed);

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
          {[...selectedTrips].map((tripId) => (
            <TripTrace
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
  const { filteredTrips } = useData();
  const filteredSelectedTrips = useMemo(
    () => [...selectedTrips].filter((tripId) => filteredTrips.has(tripId)),
    [selectedTrips, filteredTrips],
  );

  const img = <img src={`${import.meta.env.BASE_URL}basemap.bmp`} alt="Base map of the Lekagul Preserve" />;

  return (
    <figure className={classNames(cx('base'), className)} {...props}>
      {filteredSelectedTrips.length ? <SelectedTripsMap img={img} /> : <Heatmap img={img} />}
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
