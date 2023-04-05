import '../../polyfill';

import { rowSchema } from './schema';
import type { Row, WorkerMessage } from './schema';

let parsedRows: Row[] = []; // Holds rows we’ve finished parsing but haven’t sent to the main thread
let channelOpened = false; // Whether the main thread has indicated it’s ready to receive data

/**
 * “Attempt” to send pending data to the main thread.
 * No-op if the channel hasn’t been opened or if there’s nothing to send.
 */
function sendUpdate() {
  if (!channelOpened || parsedRows.length === 0) return;
  globalThis.postMessage({
    type: 'update',
    data: parsedRows,
  } satisfies WorkerMessage);
  parsedRows = [];
}

// Receive start event from the main thread
globalThis.addEventListener('message', async (event: MessageEvent<unknown>) => {
  if (event.data === 'start') {
    channelOpened = true;
    sendUpdate(); // flush everything that may have accumulated before the channel was opened
  } else {
    throw new Error(`Worker got unexpected message: ${event.data}`);
  }
});

const req = await fetch('/sensor-data.csv');
if (!req.body) throw new Error('Failed to fetch data');


let isHeaderRow = true;
let textBuffer = '';

const textDecoder = new TextDecoder('utf-8');


for await (const chunkBytes of req.body) {
  const chunk = textDecoder.decode(chunkBytes);
  textBuffer += chunk;
  const textToParse = textBuffer.slice(0, textBuffer.lastIndexOf('\n'));
  textBuffer = textBuffer.slice(textToParse.length + 1);

  // Process header row
  const linesToParse = textToParse.split('\n');
  if (isHeaderRow) {
    const headerRow = linesToParse.shift();
    if (headerRow !== 'Timestamp,car-id,car-type,gate-name') throw new Error('Found unexpected header row');
    isHeaderRow = false;
  }
  // Process all complete lines; manageable chunks to prevent call stack overflow
  for (let i = 0; i < linesToParse.length; i += 1000) {
    parsedRows.push(...linesToParse.slice(i, i + 1000).map((rawLine) => rowSchema.parse(rawLine.split(','))));
  }
  sendUpdate();
}
// There could be a final line at the end if the file didn’t end with a newline
if (textBuffer.trim().length) {
  parsedRows.push(rowSchema.parse(textBuffer.split(',')));
  sendUpdate();
}

// Send final event to the main thread
setTimeout(() => {
  globalThis.postMessage({
    type: 'finished',
  } satisfies WorkerMessage);
}, 1);
