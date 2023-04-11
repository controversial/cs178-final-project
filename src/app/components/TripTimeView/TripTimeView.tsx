import React from 'react';
import { RowWithTrip } from '../../data/schema';
import useElementSize from '../../helpers/use-element-size';

import styles from './TripTimeView.module.scss';
import classNames from 'classnames/bind';
const cx = classNames.bind(styles);

export interface ITripTimeViewProps {
  trip: RowWithTrip[];
}

export default function TripTimeView({ trip }: ITripTimeViewProps) {
  const [ref, [width, height]] = useElementSize();

  const withTime = trip.map((row, i) => ({ ...row, time: row.timestamp.getTime() }));
  const withTimeSincePrev = withTime.map((row, i) => ({ ...row, timeSincePrev: i == 0 ? 0 : row.time - trip[i - 1].time }));

  // This is messy
  const maxTime = Math.max(...withTimeSincePrev.map((row) => row.timeSincePrev));

  return (
    <div className={cx('base')}>
      <div className={(cx('container'))} ref={ref}>
        {width != null && height != null && (
        <svg viewBox={`0 0 ${width} ${height}`}>
          {withTimeSincePrev.map((row, i) => {
            const x = (i / trip.length) * width;
            const y = (row.timeSincePrev / maxTime) * height;
            return <circle key={i} cx={x} cy={y} r={10} fill="white" />;
          })}
        </svg>
        )}
      </div>
    </div>
  );
}
