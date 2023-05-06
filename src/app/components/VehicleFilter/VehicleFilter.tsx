import React from 'react';
import { carTypes } from '../../data/utils/schemas';

import styles from './VehicleFilter.module.scss';
import classNames from 'classnames/bind';
import { useData } from '../DataProvider';
const cx = classNames.bind(styles);


function VehicleFilter({ ...props }: React.HTMLAttributes<HTMLElement>) {
  const { toggleVehicleTypeFilter } = useData();
  return (
    <div {...props}>
      <p>Filter by Vehicle Type</p>
      <div className={cx('base')}>
        {carTypes.map((carType) => (
          <label className={cx('item')} key={carType}>
            <input type="checkbox" onChange={(event) => toggleVehicleTypeFilter(carType, event.target.checked)} />
            {carType}
          </label>
        ))}
      </div>
    </div>
  );
}

export default VehicleFilter;
