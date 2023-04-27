import React from 'react';

import useElementSize from '../../helpers/use-element-size';

import rows from '../../data/sensor-readings';
import adjacencyGraph from '../../data/sensor-adjacency-graph';

import classNames from 'classnames/bind';
import styles from './Heatmap.module.scss';
const cx = classNames.bind(styles);

console.log(rows.length);
console.log(rows[0]);


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
