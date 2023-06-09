import React, { useMemo, useCallback, useState } from 'react';
import useGlobalStore from '../../global-store';

import { useData } from '../DataProvider';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  SortingState,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  createColumnHelper,
  flexRender,
  CellContext,
} from '@tanstack/react-table';
import { Row as DataRow } from '../../data/utils/schemas';

import styles from './TripSelector.module.scss';
import classNames from 'classnames';
import classNamesBinder from 'classnames/bind';
const cx = classNamesBinder.bind(styles);

type TripStats = {
  tripId: number;
  carId: string | number;
  numTrips: number;
  tripLength: number;
  tripDate: Date;
  carType: DataRow['carType'];
};

const columnHelper = createColumnHelper<TripStats>();

export default function TripSelector({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const { filteredTrips, allTrips } = useData();
  const selectedTrips = useGlobalStore((state) => state.selectedTrips);
  const selectTrip = useGlobalStore((state) => state.selectTrip);
  const deselectTrip = useGlobalStore((state) => state.deselectTrip);
  const { selectedTripsColorScale } = useGlobalStore((state) => state.computed);

  const visibleColumnAccessor = useCallback((cellProps: CellContext<TripStats, unknown>) => (
    <div className={cx('checkbox')}>
      <input
        type="checkbox"
        checked={selectedTrips.has(cellProps.row.original.tripId)}
        onChange={
          (event) => (event.target.checked
            ? selectTrip(cellProps.row.original.tripId)
            : deselectTrip(cellProps.row.original.tripId))
          }
      />
    </div>
  ), [deselectTrip, selectTrip, selectedTrips]);

  const carIdColumnAccessor = useCallback((cellProps: CellContext<TripStats, unknown>) => (
    <div className={cx('text')}>
      {cellProps.getValue() as string | number}
    </div>
  ), []);

  const columns = useMemo(() => [
    columnHelper.display({
      id: 'Visible',
      header: 'Visible',
      cell: visibleColumnAccessor,
      size: 40,
    }),

    columnHelper.accessor('tripId', { header: 'Trip ID', size: 80 }),
    columnHelper.accessor('carId', { header: 'Vehicle ID', cell: carIdColumnAccessor }),
    columnHelper.accessor('numTrips', { header: 'Num. Trips', size: 40 }),
    columnHelper.accessor('tripDate', {
      cell: (cellProps) => cellProps.getValue().toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' }),
      header: 'Date',
      size: 70,
    }),
    columnHelper.accessor('carType', { header: 'Vehicle type', size: 40 }),
    columnHelper.accessor('tripLength', {
      cell: (cellProps) => `${Math.round(cellProps.getValue() / (3600 * 100)) / 10} hours`,
      header: 'Total length',
    }),
  ], [visibleColumnAccessor, carIdColumnAccessor]);

  const numTripsMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const [, trip] of allTrips) {
      const carId = trip[0]?.carId;
      if (carId) {
        map.set(carId, (map.get(carId) ?? 0) + 1);
      }
    }
    return map;
  }, [allTrips]);

  const data: TripStats[] = useMemo(() => [...filteredTrips].map(([tripId, trip]) => ({
    tripId,
    carId: trip[0]?.carId.slice(4) ?? 0,
    numTrips: numTripsMap.get(trip[0]?.carId ?? '') ?? 0,
    tripDate: trip[0]?.timestamp ?? new Date(),
    carType: trip[0]?.carType ?? '1',
    tripLength: Number(trip.at(-1)?.timestamp) - Number(trip[0]?.timestamp),
  })), [filteredTrips, numTripsMap]);

  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const tableContainerRef = React.useRef<HTMLDivElement>(null);

  const { rows } = table.getRowModel();
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 20,
    overscan: 10,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();
  const paddingTop = virtualRows.length > 0 ? virtualRows?.[0]?.start || 0 : 0;
  const paddingBottom = virtualRows.length > 0
    ? totalSize - (virtualRows?.[virtualRows.length - 1]?.end || 0)
    : 0;

  return (
    <div className={classNames(cx('base'), className)} {...props}>
      <p className={cx('sectionTitle')}>List of Selectable Trips</p>
      <div className={cx('scroll')} ref={tableContainerRef}>
        <table>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    colSpan={header.colSpan}
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder ? null : (
                      <button
                        type="button"
                        className={classNames(cx('header'), header.column.getCanSort() ? 'cursor-pointer select-none' : '')}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {{
                          asc: ' 🔼',
                          desc: ' 🔽',
                        }[header.column.getIsSorted() as string] ?? null}
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {paddingTop > 0 && (
              <tr>
                <td style={{ height: `${paddingTop}px` }} />
              </tr>
            )}
            {rowVirtualizer.getVirtualItems().map((virtualItem) => {
              const row = rows[virtualItem.index];
              if (!row) return null;
              const { tripId } = row.original;

              return (
                <tr
                  key={virtualItem.key}
                  style={
                    selectedTrips.has(tripId)
                      ? { color: selectedTripsColorScale(tripId) }
                      : {}
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
            {paddingBottom > 0 && (
              <tr>
                <td style={{ height: `${paddingBottom}px` }} />
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
