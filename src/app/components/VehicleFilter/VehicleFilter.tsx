import React from 'react';
import useGlobalStore from '../../global-store';

import { carTypes } from '../../data/utils/schemas';

import styles from './VehicleFilter.module.scss';
import classNames from 'classnames';
import classNamesBinder from 'classnames/bind';
const cx = classNamesBinder.bind(styles);


function VehicleFilter({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const toggleVehicleTypeFilter = useGlobalStore((state) => state.toggleVehicleTypeFilter);

  return (
    <div className={classNames(cx('base', className))} {...props}>
      <p>Filter by Vehicle Type</p>

      {carTypes.map((carType) => (
        <label className={cx('item')} key={carType}>
          <input type="checkbox" onChange={(event) => toggleVehicleTypeFilter(carType, event.target.checked)} />
          {carType}
        </label>
      ))}
    </div>
  );
}

export default VehicleFilter;
