import CSVParser from './csv-parser';
import { rowSchema, messageToWorkerSchema } from './schema';
import type { MessageFromWorker } from './schema';

function assertNever(x: never): never { throw new Error(`Unexpected object: ${x}`); }

const csvParser = new CSVParser(
  ['Timestamp', 'car-id', 'car-type', 'gate-name'],
  rowSchema,
);

// Receive unprocessed data from the main thread
globalThis.addEventListener('message', async (event: MessageEvent<unknown>) => {
  const message = messageToWorkerSchema.parse(event.data);
  // Process data
  if (message.type === 'chunk') {
    globalThis.postMessage({
      type: 'rows',
      data: csvParser.ingestChunk(message.data),
    } satisfies MessageFromWorker);
  // Confirm when we finish
  } else if (message.type === 'finish') {
    globalThis.postMessage({
      type: 'rows',
      data: csvParser.flush(),
    } satisfies MessageFromWorker);
  // Make TypeScript enforce that we handled all cases
  } else assertNever(message);
});
