import z from 'zod';

export const rowSchema = z.tuple([
  z.string().transform((s) => new Date(s)),
  z.string(),
  z.enum(['1', '2', '2P', '3', '4', '5', '6']),
  z.enum([
    'entrance0', 'entrance1', 'entrance2', 'entrance3', 'entrance4',
    'gate0', 'gate1', 'gate2', 'gate3', 'gate4', 'gate5', 'gate6', 'gate7', 'gate8',
    'general-gate0', 'general-gate1', 'general-gate2', 'general-gate3', 'general-gate4', 'general-gate5', 'general-gate6', 'general-gate7',
    'ranger-stop0', 'ranger-stop1', 'ranger-stop2', 'ranger-stop3', 'ranger-stop4', 'ranger-stop5', 'ranger-stop6', 'ranger-stop7',
    'ranger-base',
    'camping0', 'camping1', 'camping2', 'camping3', 'camping4', 'camping5', 'camping6', 'camping7', 'camping8',
  ]),
]).transform(([timestamp, carId, carType, gateName]) => ({
  timestamp,
  carId,
  carType,
  gateName,
}));
export type Row = z.infer<typeof rowSchema>;

/** Checks messages sent from the worker to the main thread */
export const workerMessageSchema = z.discriminatedUnion('type', [
  // note: we don’t actually check the Row schema here, since we assume it’s been been checked by
  // the worker and we want to avoid the expensive operation on the main thread
  z.object({ type: z.literal('update'), data: z.custom<Row[]>() }),

  z.object({ type: z.literal('finished') }),
]);
export type WorkerMessage = z.infer<typeof workerMessageSchema>;
