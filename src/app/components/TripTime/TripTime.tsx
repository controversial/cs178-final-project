import React from 'react';

import useElementSize from '../../helpers/use-element-size';
import { Row } from '../../data/utils/schemas';

import styles from './TripTime.module.scss';
import classNames from 'classnames';
const cx = classNames.bind(styles);

interface ITripTimeProps {
  trips: [Row[]];
}

export default function TripTime({ trips }: ITripTimeProps) {
  const [baseRef, [width, height]] = useElementSize();

  return (
    <div className={cx('base')} ref={baseRef}>
      {width != null && height != null && (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          {}
          <g />
        </svg>
      )}
    </div>
  );
}
