import React from 'react';

import useDbQuery from '../../helpers/use-db-query';

import styles from './TripExaminer.module.scss';
import classNames from 'classnames/bind';
const cx = classNames.bind(styles);

interface ITripExaminerProps {
  selectedGates: string[];
}

export default function TripExaminer({ selectedGates = [] }: ITripExaminerProps) {
  const rows = useDbQuery([`WHERE tripId IN (SELECT tripId FROM sensor_readings ${selectedGates.length === 0 ? '' : `WHERE gateName IN (${selectedGates.join(', ')}`})`, 'GROUP BY tripId, carId, carType'], ['tripId, carId, carType, MIN(timestamp) as entry, MAX(timestamp) as exit, COUNT(*) as length']);
  const trips = rows?.toArray().map((row) => ({ ...row }));
  console.log(trips?.[0]);

  return rows !== undefined ? (
    <div className={cx('base')}>
      {trips?.map((trip) => (<p key={trip.tripId}>{trip.carType} {trip.entry.toLocaleString()} {trip.exit.toLocaleString()} {Number(trip.length)}</p>))}
    </div>
  ) : null;
}
