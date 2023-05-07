import { create } from 'zustand';
import type { Row, CarType } from './data/utils/schemas';


export interface GlobalState {
  vehicleTypeFilter: CarType[];
  toggleVehicleTypeFilter: (vt: CarType, included?: boolean) => void;

  timeFilter: { start: number, end: number } | false;
  setTimeFilter: (start: number, end: number) => void;
  clearTimeFilter: () => void;

  dateFilter: { start: Date, end: Date } | false;
  setDateFilter: (start: Date, end: Date) => void;
  clearDateFilter: () => void;

  selectedTrips: Set<Row['tripId']>;
  selectTrip: (tripId: Row['tripId']) => void;
  deselectTrip: (tripId: Row['tripId']) => void;

  hoveredGate: Row['gateName'] | null;
  setHoveredGate: (gateName: Row['gateName'] | null) => void;
  clearHoveredGate: () => void;
}


const useGlobalStore = create<GlobalState>((set) => ({
  vehicleTypeFilter: [],
  toggleVehicleTypeFilter: (vt, included = true) => set((state) => ({
    vehicleTypeFilter: included
      ? [...state.vehicleTypeFilter, vt]
      : state.vehicleTypeFilter.filter((t) => t !== vt),
  })),

  timeFilter: false,
  setTimeFilter: (start, end) => set({ timeFilter: { start, end } }),
  clearTimeFilter: () => set({ timeFilter: false }),

  dateFilter: false,
  setDateFilter: (start, end) => set({ dateFilter: { start, end } }),
  clearDateFilter: () => set({ dateFilter: false }),

  selectedTrips: new Set(),
  selectTrip: (tripId) => set((state) => ({
    selectedTrips: new Set(state.selectedTrips).add(tripId),
  })),
  deselectTrip: (tripId) => set((state) => {
    const newSet = new Set(state.selectedTrips);
    newSet.delete(tripId);
    return { selectedTrips: newSet };
  }),

  hoveredGate: null,
  setHoveredGate: (gateName) => set({ hoveredGate: gateName }),
  clearHoveredGate: () => set({ hoveredGate: null }),
}));


export default useGlobalStore;
