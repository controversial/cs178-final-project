import z from 'zod';

const textDecoder = new TextDecoder();


/**
 * A streaming CSV parser that uses Zod to validate and transform rows.
 */
export default class CSVParser<
  const ColumnNamesT extends readonly [string, ...string[]],
  OutputT extends {},
> {
  public rows: OutputT[] = [];
  private textBuffer = '';
  public headerRowParsed = false;
  constructor(
    public columnNames: ColumnNamesT,
    public rowSchema: z.ZodEffects<z.ZodTypeAny, OutputT, string[]>,
  ) {}

  /**
   * Ingest a “chunk” of a CSV file.
   * Will return all the rows that were “made complete” by the new chunk.
   */
  ingestChunk(chunk: string | Uint8Array) {
    // Add this new chunk to our working copy
    const decodedChunk = typeof chunk === 'string' ? chunk : textDecoder.decode(chunk);
    this.textBuffer += decodedChunk;
    // Take all “complete” rows out of text buffer
    const cutoff = this.textBuffer.lastIndexOf('\n');
    if (cutoff === -1) return [];
    const textToParse = this.textBuffer.slice(0, cutoff);
    const linesToParse = textToParse.split('\n');
    this.textBuffer = this.textBuffer.slice(cutoff + 1);
    // The first row contains the header; check it’s what we expect and discard it
    if (!this.headerRowParsed) {
      const firstRow = linesToParse.shift()!.split(',');
      z.tuple([
        z.literal(this.columnNames[0]), // always defined; ColumnNamesT requires one value
        ...this.columnNames.slice(1).map((k) => z.literal(k)),
      ]).parse(firstRow);
      this.headerRowParsed = true;
    }
    // Process the remaining rows
    const parsedRows = linesToParse.map((l) => {
      const values = l.split(',');
      if (values.length !== this.columnNames.length) throw new Error('Found incomplete row');
      return this.rowSchema.parse(values);
    });
    // Add to our list of rows in chunks to avoid stack overflow
    for (let i = 0; i < parsedRows.length; i += 1000) {
      this.rows.push(...parsedRows.slice(i, i + 1000));
    }
    return parsedRows;
  }

  /**
   * Force parsing any remaining row in the textbuffer even if we haven’t reached a newline.
   */
  flush() {
    if (!this.textBuffer.length) return [];
    if (this.textBuffer.endsWith('\n')) throw new Error('Invariant violation: textBuffer should not be left ending with a newline');
    const newRow = this.ingestChunk('\n');
    if (this.textBuffer.length) throw new Error('Invariant violation: textBuffer should be empty after flush');
    return newRow;
  }

  /**
   * Parse a “complete” CSV file start to finish.
   * Leaves the buffer empty.
   */
  parse(data: string | Uint8Array) {
    const rows = this.ingestChunk(data);
    rows.push(...this.flush());
    return rows;
  }
}
