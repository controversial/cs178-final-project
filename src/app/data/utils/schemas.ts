import z from 'zod';


/*
 * 01. Schemas and types for rows from the sensor-data.csv file
 */


export const gateNames = [
  'entrance0', 'entrance1', 'entrance2', 'entrance3', 'entrance4',
  'gate0', 'gate1', 'gate2', 'gate3', 'gate4', 'gate5', 'gate6', 'gate7', 'gate8',
  'general-gate0', 'general-gate1', 'general-gate2', 'general-gate3', 'general-gate4', 'general-gate5', 'general-gate6', 'general-gate7',
  'ranger-stop0', 'ranger-stop1', 'ranger-stop2', 'ranger-stop3', 'ranger-stop4', 'ranger-stop5', 'ranger-stop6', 'ranger-stop7',
  'ranger-base',
  'camping0', 'camping1', 'camping2', 'camping3', 'camping4', 'camping5', 'camping6', 'camping7', 'camping8',
] as const;
export const gateNameSchema = z.enum(gateNames);
export const gateTypes = ['entrance', 'gate', 'general-gate', 'ranger-stop', 'ranger-base', 'camping'] as const;
export const gateTypeSchema = z.enum(gateTypes);
export const getGateType = (gateName: string) => gateTypeSchema.parse(gateName.match(/^([a-zA-Z-]+)[0-9]*$/)?.[1]);

export const carTypes = ['1', '2', '2P', '3', '4', '5', '6'] as const;
export type CarType = typeof carTypes[number];


export const rowSchema = z.tuple([
  z.string().transform((s) => new Date(s)),
  z.string(),
  z.enum(carTypes),
  gateNameSchema,
]).transform(([timestamp, carId, carType, gateName]) => ({
  id: globalThis.crypto.randomUUID(),
  timestamp,
  carId,
  carType,
  gateName,
}));
export type BaseRow = z.output<typeof rowSchema>;
// We add a few computed attributes after Zod’s initial parsing
export type Row = BaseRow & {
  tripId: number;
  gateType: z.infer<typeof gateTypeSchema>;
};
export type Trip = Row[];


/*
 * 02. Schemas and types for messages passed between the CSV worker and the main thread
 */


/** Checks messages sent from the worker to the main thread */
export const messageFromWorkerSchema = z.discriminatedUnion('type', [
  // note: we don’t actually check the Row schema here, since we assume it’s been been checked by
  // the worker and we want to avoid the expensive operation on the main thread
  z.object({
    type: z.literal('rows'),
    data: z.custom<Row[]>(),
  }),
]);
export type MessageFromWorker = z.infer<typeof messageFromWorkerSchema>;


/** Checks messages sent from the main thread to the worker */
export const messageToWorkerSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('chunk'), data: z.instanceof(Uint8Array) }),
  z.object({ type: z.literal('finish') }),
]);
export type MessageToWorker = z.infer<typeof messageToWorkerSchema>;


/*
 * 03. Schemas and types for the “adjacency graph” from sensor-graph.csv
 */


export const sensorRowSchema = z.tuple([
  gateNameSchema,
  z.string().transform((y) => parseInt(y, 10)),
  z.string().transform((x) => parseInt(x, 10)),
]).transform(([id, y, x]) => ({
  id,
  x,
  y,
}));
