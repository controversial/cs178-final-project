/* eslint-env worker */

import CSVParser from './csv-parser';
import { rowSchema, messageToWorkerSchema, gateTypeSchema } from './schemas';
import type { MessageFromWorker, Row } from './schemas';

function assertNever(x: never): never { throw new Error(`Unexpected object: ${x}`); }

const csvParser = new CSVParser(
  ['Timestamp', 'car-id', 'car-type', 'gate-name'],
  rowSchema,
);

/**
 * As we process rows, a car is “in the park” at the current row if it has a trip ID assigned.
 * When it leaves the park, it will be removed from the map.
*/
const carTripIds = new Map<string, number>();
let nextTripId = 0;

// Receive unprocessed data from the main thread
globalThis.addEventListener('message', async (event: MessageEvent<unknown>) => {
  // Receive and process data

  const message = messageToWorkerSchema.parse(event.data);
  let newRows;
  if (message.type === 'chunk') newRows = csvParser.ingestChunk(message.data);
  else if (message.type === 'finish') newRows = csvParser.flush();
  // Make TypeScript enforce that we handled all cases
  else assertNever(message);


  // Assign a few computed properties to the new rows

  const transformedRows = newRows.map((row) => {
    // "gateType" is the category of gate that the vehicle is scanning at
    const gateType = gateTypeSchema.parse(row.gateName.match(/^([a-zA-Z-]+)[0-9]*$/)?.[1]);

    // A new “trip” starts every time a vehicle enters the park; a “tripId” uniquely identifies each
    let tripId = carTripIds.get(row.carId);
    if (tripId == null) {
      // we encountered a car that isn’t “in the park” at this point
      tripId = nextTripId;
      carTripIds.set(row.carId, tripId);
      nextTripId += 1;
    // if a car that is already in the park goes through an entrance, it’s leaving
    } else if (gateType === 'entrance') {
      carTripIds.delete(row.carId);
    }

    return { ...row, gateType, tripId } satisfies Row;
  });


  // Send processed data back to the main thread

  globalThis.postMessage(
    {
      type: 'rows',
      data: transformedRows,
    } satisfies MessageFromWorker,
  );
});
