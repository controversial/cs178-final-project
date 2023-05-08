import { create } from 'zustand';
import type { Row, CarType, GateType } from './data/utils/schemas';
import { gateTypes } from './data/utils/schemas';
import * as d3 from 'd3';


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
  clearSelectedTrips: () => void;

  hoveredGate: Row['gateName'] | null;
  setHoveredGate: (gateName: Row['gateName'] | null) => void;
  clearHoveredGate: () => void;

  selectedGates: Set<Row['gateName']>;
  selectGate: (gateName: Row['gateName']) => void;
  deselectGate: (gateName: Row['gateName']) => void;
  clearSelectedGates: () => void;

  selectedTripsHighlightX: number | null;
  setSelectedTripsHighlightX: (x: number | null) => void;
  clearSelectedTripsHighlightX: () => void;

  gateSymbolScale: d3.ScaleOrdinal<GateType, d3.SymbolType>,

  computed: {
    selectedTripsColorScale: d3.ScaleOrdinal<Row['tripId'], string>;
  };
}


const useGlobalStore = create<GlobalState>((set, get) => ({
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
  clearSelectedTrips: () => set({ selectedTrips: new Set() }),

  hoveredGate: null,
  setHoveredGate: (gateName) => set({ hoveredGate: gateName }),
  clearHoveredGate: () => set({ hoveredGate: null }),

  selectedGates: new Set<Row['gateName']>(),
  selectGate: (gameName) => set((state) => ({
    selectedGates: new Set(state.selectedGates).add(gameName),
  })),
  deselectGate: (gameName) => set((state) => {
    const newSet = new Set(state.selectedGates);
    newSet.delete(gameName);
    return { selectedGates: newSet };
  }),
  clearSelectedGates: () => set({ selectedGates: new Set() }),

  selectedTripsHighlightX: null,
  setSelectedTripsHighlightX: (x) => set({ selectedTripsHighlightX: x }),
  clearSelectedTripsHighlightX: () => set({ selectedTripsHighlightX: null }),

  gateSymbolScale: d3.scaleOrdinal(gateTypes, d3.symbolsFill.slice(1)),

  computed: {
    get selectedTripsColorScale() {
      return d3.scaleOrdinal([...get().selectedTrips], d3.schemeCategory10);
    },
  },
}));


export default useGlobalStore;
