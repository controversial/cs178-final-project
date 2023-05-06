import React, { useContext, createContext, useState, useMemo } from 'react';
import { Row } from '../data/utils/schemas';
import * as d3 from 'd3';


import rows from '../data/sensor-readings';
const trips = d3.group(rows, (r) => r.tripId);


function useDataContextValue() {
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<Row['carType'][]>([]);
  const [timeFilter, setTimeFilter] = useState<{ start: number, end: number } | false>(false);
  const [dateFilter, setDateFilter] = useState<{ start: Date, end: Date } | false>(false);

  const [selectedTrips, setSelectedTrips] = useState<Set<Row['tripId']>>(new Set());

  // Filter sensor readings
  const filteredReadings = useMemo(() => {
    let filtered = rows;
    if (vehicleTypeFilter) {
      filtered = filtered.filter((row) => vehicleTypeFilter.includes(row.carType));
    }
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
  }, [vehicleTypeFilter, timeFilter, dateFilter]);

  // Filter trips to only include those that are covered *entirely* by the filtered readings
  const filteredRowIds = useMemo(
    () => new Set(filteredReadings.map((row) => row.id)),
    [filteredReadings],
  );
  const filteredTrips = useMemo(() => (
    new Map(
      [...trips].filter(([, tripRows]) => (
        tripRows.every((row) => filteredRowIds.has(row.id))
      )),
    )
  ), [filteredRowIds]);

  return useMemo(() => ({
    allReadings: rows,
    allTrips: trips,

    filteredReadings,
    filteredRowIds,
    filteredTrips,

    selectedTrips,

    toggleVehicleTypeFilter: (vt: Row['carType'], included: boolean) => {
      if (included) setVehicleTypeFilter((vts) => [...vts, vt]);
      else setVehicleTypeFilter((vts) => vts.filter((v) => v !== vt));
    },

    setTimeFilter: (start: number, end: number) => setTimeFilter({ start, end }),
    clearTimeFilter: () => setTimeFilter(false),

    setDateFilter: (start: Date, end: Date) => setDateFilter({ start, end }),
    clearDateFilter: () => setDateFilter(false),

    selectTrip: (tripId: Row['tripId']) => setSelectedTrips((oldSelectedTrips) => {
      const newSelectedTrips = new Set(oldSelectedTrips);
      newSelectedTrips.add(tripId);
      return newSelectedTrips;
    }),
    deselectTrip: (tripId: Row['tripId']) => setSelectedTrips((oldSelectedTrips) => {
      const newTrips = new Set(oldSelectedTrips);
      newTrips.delete(tripId);
      return newTrips;
    }),
  }), [filteredReadings, filteredRowIds, filteredTrips, selectedTrips]);
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
