import { rowSchema, messageToWorkerSchema } from './schema';
import type { MessageFromWorker } from './schema';

function assertNever(x: never): never { throw new Error(`Unexpected object: ${x}`); }

let isHeaderRow = true;
let lastParsedTimestamp = -Infinity;
let textBuffer = '';

const textDecoder = new TextDecoder('utf-8');

function process(chunkBytes: Uint8Array) {
  // Add this new chunk to our working copy
  const chunk = textDecoder.decode(chunkBytes);
  textBuffer += chunk;
  // Identify all “complete” rows
  const textToParse = textBuffer.slice(0, textBuffer.lastIndexOf('\n'));
  textBuffer = textBuffer.slice(textToParse.length + 1);

  // Discard empty lines
  const linesToParse = textToParse.split('\n')
    .filter((line) => line.trim().length > 0);

  // Discard the first row, which contains a header
  if (isHeaderRow) {
    const headerRow = linesToParse.shift();
    if (headerRow !== 'Timestamp,car-id,car-type,gate-name') throw new Error('Found unexpected header row');
    isHeaderRow = false;
  }
  // Process the remaining rows
  const parsedRows = linesToParse.map((rawLine) => {
    const parsed = rowSchema.parse(rawLine.split(','));
    if (parsed.timestamp.getTime() < lastParsedTimestamp) throw new Error('Invariant violation: Encountered row out of order');
    lastParsedTimestamp = parsed.timestamp.getTime();
    return parsed;
  });

  // Send what we’ve processed back to the parent
  globalThis.postMessage({
    type: 'rows',
    data: parsedRows,
  } satisfies MessageFromWorker);
}

// Receive unprocessed data from the main thread
globalThis.addEventListener('message', async (event: MessageEvent<unknown>) => {
  const message = messageToWorkerSchema.parse(event.data);
  // Process data
  if (message.type === 'chunk') {
    process(message.data);
  // Confirm when we finish
  } else if (message.type === 'finish') {
    if (textBuffer.length) {
      if (textBuffer.endsWith('\n')) throw new Error('Invariant violation: textBuffer should not be left ending with a newline');
      else {
        console.warn('CSV did not end with a newline; parsing last row separately');
        textBuffer += '\n';
        process(new Uint8Array([]));
      }
      if (textBuffer.length) throw new Error('Invariant violation: textBuffer should be empty after parsing finishes row');
    }
  // Make TypeScript enforce that we handled all cases
  } else assertNever(message);
});
