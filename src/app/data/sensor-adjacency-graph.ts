import CSVParser from './utils/csv-parser';
import { adjacencyGraphSchema, adjacencyGraphRowSchema } from './utils/schemas';

const graph = await fetch('/sensors-graph.csv')
  .then((res) => res.text())
  .then((text) => new CSVParser(['id', 'y', 'x', 'adj'], adjacencyGraphRowSchema).parse(text))
  .then((rows) => adjacencyGraphSchema.parse(
    Object.fromEntries(rows.map(({ id, ...value }) => [id, value])),
  ));

export default graph;
