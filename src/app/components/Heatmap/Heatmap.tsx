import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

import rows from '../../data/sensor-readings';
import adjacencyGraph from '../../data/sensor-adjacency-graph';

import classNames from 'classnames/bind';
import styles from './Heatmap.module.scss';
const cx = classNames.bind(styles);


export default function Heatmap() {
  const containerRef = useRef<SVGGElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return () => undefined;

    const container = containerRef.current;
    const tripsWithCoordinates = d3.map(rows, (r) => {
      const { x, y } = adjacencyGraph[r.gateName];
      return { ...r, x, y };
    });
    const trips = d3.group(tripsWithCoordinates, (d) => d.tripId);
    // Create a path from each trip
    const paths = Array.from(trips.values()).map((trip) => {
      const path = d3.path();
      if (!trip[0]) return null;
      const jitter = () => Math.random() * 8 - 4;
      path.moveTo(trip[0].x + jitter(), trip[0].y + jitter());
      for (let i = 1; i < trip.length; i += 1) {
        path.lineTo(trip[i]!.x + jitter(), trip[i]!.y + jitter());
      }
      return path;
    });
    // Add paths
    d3.select(container)
      .selectAll('path')
      .data(paths)
      .join('path')
      .filter((d) => d != null)
      .attr('d', (d) => d?.toString() ?? '')
      .attr('stroke', 'rgb(255 0 0 / 0.05)')
      .attr('stroke-width', 0.1)
      .attr('fill', 'none');

    return () => {
      container.innerHTML = '';
    };
  }, []);

  return (
    <div className={cx('base')}>
      <svg width="100%" height="100%" viewBox="0 0 200 200">
        <g ref={containerRef} />
      </svg>

      <img src="/basemap.bmp" alt="Base map of the Lekagul Preserve" />
    </div>
  );
}
