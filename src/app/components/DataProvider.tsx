import React, { useContext, createContext, useMemo } from 'react';
import * as d3 from 'd3';

import useGlobalStore from '../global-store';

import rows from '../data/sensor-readings';
const trips = d3.group(rows, (r) => r.tripId);


function useDataContextValue() {
  const vehicleTypeFilter = useGlobalStore((state) => state.vehicleTypeFilter);
  const timeFilter = useGlobalStore((state) => state.timeFilter);
  const dateFilter = useGlobalStore((state) => state.dateFilter);
  const selectedGates = useGlobalStore((state) => state.selectedGates);

  // Filter sensor readings based off of vehicle type, without applying the other filters
  // This is for the histogram
  const vehicleTypeFilteredReadings = useMemo(() => (
    vehicleTypeFilter.length ? rows.filter((row) => vehicleTypeFilter.includes(row.carType)) : rows
  ), [vehicleTypeFilter]);


  // Apply the rest of the filters
  const filteredReadings = useMemo(() => {
    let filtered = vehicleTypeFilteredReadings;
    if (timeFilter) {
      filtered = filtered.filter((row) => {
        const hour = row.timestamp.getUTCHours()
          + row.timestamp.getUTCMinutes() / 60
          + row.timestamp.getUTCSeconds() / 3600;
        return hour >= timeFilter.start && hour <= timeFilter.end;
      });
    }
    if (dateFilter) {
      filtered = filtered.filter((row) => (
        (row.timestamp >= dateFilter.start) && (row.timestamp <= dateFilter.end)
      ));
    }
    return filtered;
  }, [vehicleTypeFilteredReadings, timeFilter, dateFilter]);

  // Filter trips to only include those that are covered *entirely* by the filtered readings
  const filteredRowIds = useMemo(
    () => new Set(filteredReadings.map((row) => row.id)),
    [filteredReadings],
  );
  const filteredTrips = useMemo(() => (
    new Map(
      [...trips].filter(([, tripRows]) => (
        tripRows.every((row) => filteredRowIds.has(row.id))
        && (
          !(selectedGates.size)
          || [...selectedGates].every((gate) => (tripRows.some((row) => row.gateName === gate)))
        )
      )),
    )
  ), [filteredRowIds, selectedGates]);

  return useMemo(() => ({
    allReadings: rows,
    allTrips: trips,

    vehicleTypeFilteredReadings,
    filteredReadings,
    filteredRowIds,
    filteredTrips,
  }), [
    vehicleTypeFilteredReadings,
    filteredReadings,
    filteredRowIds,
    filteredTrips,
  ]);
}


export type GlobalData = ReturnType<typeof useDataContextValue>;
const dataContext = createContext<GlobalData | null>(null);


export default function DataProvider({ children }: { children: React.ReactNode }) {
  return (
    <dataContext.Provider value={useDataContextValue()}>
      {children}
    </dataContext.Provider>
  );
}


export function useData() {
  const value = useContext(dataContext);
  if (!value) throw new Error('useData must be used within a DataProvider');
  return value;
}
