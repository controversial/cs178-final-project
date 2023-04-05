import z from 'zod';

const req = await fetch('/sensor-data.csv');
if (!req.body) throw new Error('Failed to fetch data');

const rowSchema = z.tuple([
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
export const rows: Row[] = [];

let isHeaderRow = true;
const linesToParse = [];
const textDecoder = new TextDecoder('utf-8');

console.time('parse csv');
for await (const chunkBytes of req.body) {
  const chunk = textDecoder.decode(chunkBytes);
  const chunkLines = chunk.split('\n');
  // Process header row
  if (isHeaderRow) {
    const headerRow = chunkLines.shift();
    if (headerRow !== 'Timestamp,car-id,car-type,gate-name') throw new Error('Found unexpected header row');
    isHeaderRow = false;
  }
  // Add this chunk to our list of lines to parse
  if (linesToParse[0]) {
    linesToParse[0] += chunkLines[0];
    chunkLines.shift();
  }
  linesToParse.push(...chunkLines);
  // Process all complete lines
  while (linesToParse.length > 1) { // The final line is not complete until we get the next chunk
    const line = linesToParse.shift()!.split(',');
    if (line.length === 0) continue;
    rows.push(rowSchema.parse(line));
  }
}
// There could be a final line at the end if the file didn’t end with a newline
if (linesToParse[0] && linesToParse[0].trim().length > 0) rows.push(rowSchema.parse(linesToParse[0].split(',')));
console.timeEnd('parse csv');
