import React, { useMemo, useRef, useEffect } from 'react';
import { useData } from '../DataProvider';
import useGlobalStore from '../../global-store';
import { Row, getGateType } from '../../data/utils/schemas';

import * as d3 from 'd3';
import wrapChart from '../ChartWrapper/ChartWrapper';

import styles from './TripTime.module.scss';
import classNamesBinder from 'classnames/bind';
import classNames from 'classnames';
const cx = classNamesBinder.bind(styles);


function Circle({
  x,
  y,
  gateId,
  color,
}: {
  x: number;
  y: number;
  gateId: Row['gateName'];
  color: string;
}) {
  const hoveredGate = useGlobalStore((state) => state.hoveredGate);
  const hovered = hoveredGate === gateId;
  const setHoveredGate = useGlobalStore((state) => state.setHoveredGate);
  const clearHoveredGate = useGlobalStore((state) => state.clearHoveredGate);

  const selectedGates = useGlobalStore((state) => state.selectedGates);
  const selected = selectedGates.has(gateId);
  const selectGate = useGlobalStore((state) => state.selectGate);
  const deselectGate = useGlobalStore((state) => state.deselectGate);

  const gateSymbolScale = useGlobalStore((state) => state.gateSymbolScale);
  const gateType = getGateType(gateId);
  const gateShape = gateSymbolScale(gateType);
  const path = d3.symbol(gateShape, hovered ? 200 : 120)();
  if (!path) return null;

  return (
    <g>
      <path
        d={path}
        transform={`translate(${x},${y})`}
        fill={selected ? color : '#020012'}
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <circle
        cx={x}
        cy={y}
        r="10"
        onMouseEnter={() => setHoveredGate(gateId)}
        onMouseLeave={() => clearHoveredGate()}
        onClick={() => {
          if (selected) deselectGate(gateId);
          else selectGate(gateId);
        }}
        fill="transparent"
        stroke="none"
      />
    </g>
  );
}


function TripTimeSvg({
  width,
  height,
  ...props
}: {
  width: number;
  height: number;
} & Omit<React.HTMLAttributes<SVGElement>, 'width' | 'height' | 'viewBox'>) {
  const selectedTrips = useGlobalStore((state) => state.selectedTrips);
  const { selectedTripsColorScale } = useGlobalStore((state) => state.computed);
  const { filteredTrips } = useData();

  const tripsSegmentTimes = useMemo(() => new Map(
    [...selectedTrips].flatMap((tripId) => {
      const trip = filteredTrips.get(tripId);
      if (!trip) return [];
      const segmentTimes = trip
        .map((r, i) => (
          i === 0
            ? 0
            : +r.timestamp - +trip[i - 1]!.timestamp
        ))
        .map((ms) => ms / 1000 / 60 / 60); // convert to hours
      return [[tripId, segmentTimes]];
    }),
  ), [filteredTrips, selectedTrips]);

  const scaleX = useMemo(
    () => d3.scaleLinear()
      .domain([0, Math.max(...[...tripsSegmentTimes.values()].map((t) => t.length - 1))])
      .range([55, width - 15]),
    [tripsSegmentTimes, width],
  );
  const scaleY = useMemo(
    () => d3.scaleLinear()
      .domain([0, Math.max(...[...tripsSegmentTimes.values()].flat())])
      .range([height - 15, 15]),
    [tripsSegmentTimes, height],
  );

  const yAxis = useMemo(() => {
    const ticks = scaleY.ticks(5);
    return d3.axisLeft(scaleY).tickValues(ticks).tickFormat((d) => `${d3.format('~r')(d)}`);
  }, [scaleY]);


  const highlightLineRef = useRef<SVGLineElement>(null);
  const setHighlightX = useGlobalStore((state) => state.setSelectedTripsHighlightX);
  const clearHighlightX = useGlobalStore((state) => state.clearSelectedTripsHighlightX);
  useEffect(() => useGlobalStore.subscribe(({ selectedTripsHighlightX: highlightX }) => {
    const highlightLine = highlightLineRef.current;
    if (!highlightLine) return;
    if (highlightX != null) {
      highlightLine.setAttribute('transform', `translate(${scaleX(highlightX)}, 0)`);
      highlightLine.removeAttribute('display');
    } else {
      highlightLine.setAttribute('display', 'none');
    }
  }), [scaleX]);

  return (
    <svg
      {...props}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      onMouseMove={(e) => {
        const svgX = e.nativeEvent.clientX - e.currentTarget.getBoundingClientRect().left;
        const graphX = scaleX.invert(svgX);
        if (graphX < 0 || graphX > scaleX.domain()[1]!) {
          clearHighlightX();
        } else {
          setHighlightX(graphX);
        }
      }}
      onMouseLeave={clearHighlightX}
    >
      <line
        x1={0}
        x2={0}
        y1={0}
        y2={height}
        stroke="grey"
        ref={highlightLineRef}
      />
      <g transform={`translate(${45}, ${0})`}>
        <g ref={(node) => { if (node) d3.select(node).call(yAxis); }} />
        <text
          x={-height / 2}
          y={-35}
          transform="rotate(-90)"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize="15"
        >
          Elapsed Time (hrs)
        </text>
      </g>
      {[...tripsSegmentTimes.entries()].map(([tripId, segmentTimes]) => {
        const line = d3.line().curve(d3.curveMonotoneX);
        const path = line(segmentTimes.map((t, i) => [scaleX(i), scaleY(t)]));
        if (!path) return null;
        const color = selectedTripsColorScale(tripId);
        return (
          <g key={tripId}>
            <path d={path} fill="none" stroke={color} strokeWidth="2" />
            {segmentTimes.map((t, i) => (
              <Circle
                key={`${tripId}-${i}`}
                color={color}
                x={scaleX(i)}
                y={scaleY(t)}
                gateId={filteredTrips.get(tripId)![i]!.gateName}
              />
            ))}
          </g>
        );
      })}
    </svg>
  );
}

const TripTimeGraph = wrapChart(TripTimeSvg);


export default function TripTime({
  className,
  ...props
}: React.ComponentProps<typeof TripTimeGraph>) {
  const clearSelectedTrips = useGlobalStore((state) => state.clearSelectedTrips);

  return (
    <figure className={classNames(cx('base'), className)}>
      <figcaption>Selected Trips: Time Between Sensor Readings</figcaption>
      <TripTimeGraph {...props} />
      <button
        className={cx('clear')}
        type="button"
        onClick={clearSelectedTrips}
      >
        Clear Selection
      </button>
    </figure>
  );
}
