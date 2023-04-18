import React from 'react';

import { conn } from '../../data/database';
import '../../data/sensor-readings'; // Wait for the data we need to be loaded into the database

import useElementSize from '../../helpers/use-element-size';

import adjacencyGraph from '../../data/sensor-adjacency-graph';

import classNames from 'classnames/bind';
import styles from './Heatmap.module.scss';
const cx = classNames.bind(styles);

// console.time('trips query');
// const trips = await conn.query('SELECT gateName, tripId, timestamp FROM sensor_readings');
// console.timeEnd('trips query');
// console.log(trips.numRows, trips.numCols);
// console.log({ ...trips.toArray()[0] });


export default function Heatmap() {
  const [baseRef, [width, height]] = useElementSize();

  return (
    <div className={cx('base')} ref={baseRef}>
      {width != null && height != null && (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <g />
        </svg>
      )}

      <img src="/basemap.bmp" alt="Base map of the Lekagul Preserve" />
    </div>
  );
}
