/**
 * Simplify a path
 */
export function simplifyPath(
  points: { x: number, y: number }[],
  alpha = 0.5,
  beta = 0.1,
  tol = 0.0001,
) {
  const newPoints = points.map(({ x, y }) => ({ x, y }));
  let loss = tol;

  while (loss >= tol) {
    loss = 0;
    for (let i = 2; i < points.length - 2; i += 1) {
      const initial = points[i]!;

      const updated = newPoints[i]!;
      const updatedPrev = newPoints[i - 1]!;
      const updatedNext = newPoints[i + 1]!;

      newPoints[i] = {
        x: updated.x
          + alpha * (initial.x - updated.x)
          + beta * (updatedNext.x + updatedPrev.x - 2 * updated.x),
        y: updated.y
          + alpha * (initial.y - updated.y)
          + beta * (updatedNext.y + updatedPrev.y - 2 * updated.y),
      };
      loss += Math.abs(newPoints[i]!.x - updated.x) + Math.abs(newPoints[i]!.y - updated.y);
    }
  }

  return newPoints;
}


/**
 * Remove points from a path that are too close to their neighbors
 */
export function removeClosePoints(
  points: { x: number, y: number }[],
  thresh = 1,
) {
  if (points.length < 4) return points;
  const newPoints = [points[0]!, points[1]!];
  for (let i = 2; i < points.length - 2; i += 1) {
    const p0 = newPoints.at(-1)!;
    const p = points[i]!;
    const p2 = points[i + 1]!;
    const dist1 = Math.sqrt((p.x - p0.x) ** 2 + (p.y - p0.y) ** 2);
    const dist2 = Math.sqrt((p2.x - p.x) ** 2 + (p2.y - p.y) ** 2);
    if (dist1 > thresh || dist2 > thresh) newPoints.push(p);
  }
  newPoints.push(points.at(-2)!, points.at(-1)!);
  return newPoints;
}


/**
 * Shift a path to the right side of the road
 */
export function shiftPath(
  points: { x: number, y: number }[],
  shift = 1.5,
  lookAround = 3,
  taper = 3,
) {
  // for weighting the tangent at each point
  const falloff = (d: number) => 1 - (d / (lookAround + 1)) ** 2;

  return points.map((p, centerIdx) => {
    // don’t look further around than we can look in both directions
    // except look at least 1 at the start and end
    const lookAroundHere = Math.max(1, Math.min(lookAround, points.length - 1 - centerIdx));

    // Calculate tangent around this point
    const t = { x: 0, y: 0 };
    for (let i = centerIdx - lookAroundHere; i <= centerIdx + lookAroundHere; i += 1) {
      if (i <= 0) continue; // start after first point
      if (i >= points.length) break; // can go through last point
      const p2 = points[i]!; // this point
      const p1 = points[i - 1]!; // previous point
      // weight for this tangent
      const d = i - centerIdx;
      const f = falloff(d);
      // Add this tangent (weighted)
      t.x += (p2.x - p1!.x) * f;
      t.y += (p2!.y - p1!.y) * f;
    }
    // Normalize tangent
    const len = Math.sqrt(t.x ** 2 + t.y ** 2);
    t.x /= len;
    t.y /= len;
    // unit length normal pointing to the right
    const n = { x: -t.y, y: t.x };
    // Taper to 0 shift at the ends of the path
    const distanceFromEnd = Math.min(centerIdx - 0, points.length - 1 - centerIdx);
    const taperShift = taper ? Math.min((distanceFromEnd / taper), 1) : 1;
    const s = shift * taperShift;
    // shift the point and return
    return { x: p.x + n.x * s, y: p.y + n.y * s };
  });
}
