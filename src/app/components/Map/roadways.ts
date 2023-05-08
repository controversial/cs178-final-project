import CSVParser from '../../data/utils/csv-parser';
import { sensorRowSchema } from '../../data/utils/schemas';
import { simplifyPath, shiftPath, removeClosePoints } from './path-utils';


/** Load the bitmap image of the park map */
async function getMapImage() {
  const req = await fetch(`${import.meta.env.BASE_URL}basemap.bmp`);
  const blob = await req.blob();
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(blob);
  });
  return image;
}

/** Load the sensor locations */
async function getSensors() {
  const req = await fetch(`${import.meta.env.BASE_URL}sensors.csv`);
  const text = await req.text();
  const rows = new CSVParser(['id', 'y', 'x'], sensorRowSchema).parse(text);
  return rows;
}

// Don’t wait for these to finish until we need them
const mapImagePromise = getMapImage();
const sensorsPromise = getSensors();

// Get map data
const mapImage = await mapImagePromise;
const canvas = document.createElement('canvas');
canvas.width = mapImage.width;
canvas.height = mapImage.height;
const ctx = canvas.getContext('2d', { willReadFrequently: true });
if (!ctx) throw new Error('Could not get canvas context');
ctx.drawImage(mapImage, 0, 0);
const mapData = ctx.getImageData(0, 0, mapImage.width, mapImage.height);
function readMapData(x: number, y: number) {
  const index = (y * mapImage.width + x) * 4;
  return mapData.data.subarray(index, index + 3);
}

// Get sensor locations
const sensors = await sensorsPromise;
type Sensor = typeof sensors[number];
const sensorsByPos = Object.fromEntries(
  sensors.map((sensor) => [`${sensor.x}-${sensor.y}`, sensor]),
);
const sensorsById = Object.fromEntries(sensors.map((sensor) => [sensor.id, sensor]));


// Set up our output data structures

// Will track which sensors are adjacent
export const adjacencyGraph = Object.fromEntries(sensors.map(({ id, x, y }) => [
  id,
  { x, y, adjacentGates: [] },
])) as Record<Sensor['id'], { x: number, y: number, adjacentGates: Sensor['id'][] }>;

// Will track the path between each pair of adjacent sensors
export const paths: Partial<Record<
  `${Sensor['id']}--${Sensor['id']}`,
  { x: number, y: number }[]>
> = {};


// Trace paths between sensors

const mapSize = mapImage.width * mapImage.height;
const idx = (x: number, y: number) => y * mapImage.width + x;

console.time('trace');
// For each sensor, find shortest path to each adjacent sensor by BFS
// White pixels on the bitmap are traversable, other colors are not
for (const sensor of sensors) {
  const startPos = { x: sensor.x, y: sensor.y };
  // Will track where we’ve been
  const visited = new Uint8Array(mapSize);
  // 0 means no previous pixel (there are no paths near (0, 0))
  const previous = new Uint32Array(mapSize);
  // Will track the pixels we need to visit next
  const queue = [startPos];

  while (queue.length) {
    const { x, y } = queue.shift()!;
    const atStart = x === startPos.x && y === startPos.y;
    const color = readMapData(x, y);
    // If we’ve already visited this pixel, skip it
    if (visited[idx(x, y)]) continue;
    visited[idx(x, y)] = 1;
    // If this pixel is black, skip it
    if (Math.max(...color) < 128) continue;
    // If this pixel is a sensor and not the start pixel, add it to the adjacency graph
    const sensorKey = `${x}-${y}`;
    const sensor2 = sensorsByPos[sensorKey];
    if (sensor2 && !atStart) {
      adjacencyGraph[sensor.id].adjacentGates.push(sensor2.id);
      continue;
    }
    // Add adjacent pixels to the queue
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]] as const) {
      const x2 = x + dx;
      const y2 = y + dy;
      // don't go out of bounds
      if (x2 < 0 || x2 >= mapImage.width || y2 < 0 || y2 >= mapImage.height) continue;
      // don't revisit pixels
      if (visited[idx(x2, y2)]) continue;
      // in BFS, first path to arrive is the shortest path; other paths will see “visited” and stop
      previous[idx(x2, y2)] = idx(x, y);
      // Schedule a visit
      queue.push({ x: x2, y: y2 });
    }
  }

  // Backtrack from each sensor to find the shortest path to each adjacent sensor
  for (const sensor2Id of adjacencyGraph[sensor.id].adjacentGates) {
    const path: { x: number, y: number }[] = [];
    const sensor2 = sensorsById[sensor2Id];
    if (!sensor2) throw new Error(`Unknown sensor ${sensor2Id}`);
    const endPos = { x: sensor2.x, y: sensor2.y };
    let { x, y } = endPos;
    while (x !== startPos.x || y !== startPos.y) {
      path.push({ x, y });
      const xy = previous[idx(x, y)];
      if (!xy) throw new Error('backtrack failed');
      x = xy % mapImage.width;
      y = Math.floor(xy / mapImage.width);
    }
    path.push(startPos);
    paths[`${sensor.id}--${sensor2Id}`] = path.reverse();
  }
}
console.timeEnd('trace');


console.time('smoothPaths');
export const smoothPaths = Object.fromEntries(Object.entries(paths).map(([key, pathPoints]) => {
  if (pathPoints.length < 2) return [key, pathPoints];

  let points = pathPoints;
  points = simplifyPath(points, 0.3, 0.3);
  points = removeClosePoints(points, 1);
  points = shiftPath(points, 1.5, 3);
  points = simplifyPath(points, 0.7, 0.1);
  return [key, points];
}));
console.timeEnd('smoothPaths');
