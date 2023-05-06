import React, { useRef } from 'react';

import { useData } from '../DataProvider';
import { useVirtualizer } from '@tanstack/react-virtual';

import styles from './TripSelector.module.scss';
import classNames from 'classnames';
import classNamesBinder from 'classnames/bind';
const cx = classNamesBinder.bind(styles);

export default function TripSelector({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const { selectedTrips, selectTrip, deselectTrip, filteredTrips } = useData();

  const parentRef = useRef<HTMLDivElement | null>(null);

  const rowVirtualizer = useVirtualizer({
    count: filteredTrips.size,
    // count: 10,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35,
  });

  return (
    <div className={classNames(cx('base'), className)} {...props}>
      <p className={cx('sectionTitle')}>List of Selectable Trips</p>
      <div className={cx('scroll')} ref={parentRef}>
        <div style={{ height: `${rowVirtualizer.getTotalSize()}px` }} className={cx('inner')}>
          {rowVirtualizer.getVirtualItems().map((virtualItem) => {
            const entry = [...filteredTrips][virtualItem.index];

            if (!entry) return null;

            const tripId = entry[0];
            const trip = entry[1];

            return (
              <div
                key={virtualItem.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
                className={cx('trip')}
              >
                <input
                  type="checkbox"
                  checked={selectedTrips.has(tripId)}
                  onChange={
                    (event) => (event.target.checked ? selectTrip(tripId) : deselectTrip(tripId))
                  }
                />
                <p>Trip {tripId}</p>
                <p>{trip[0]?.timestamp.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</p>
                <p>
                  {Math.round((Number(trip.at(-1)?.timestamp) - Number(trip[0]?.timestamp)) / (3600 * 100)) / 10} hours
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
