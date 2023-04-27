import React from 'react';

import rows from '../../data/sensor-readings';

import styles from './TripExaminer.module.scss';
import classNames from 'classnames/bind';
const cx = classNames.bind(styles);

export default function TripExaminer({ selectedGates = [] }: { selectedGates: string[] }) {
  return <div className={cx('base')}>{rows.length} / {selectedGates.length}</div>;
}
