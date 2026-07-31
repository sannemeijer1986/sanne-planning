export interface PackableItem {
  id: string;
  startIndex: number;
  endIndex: number; // inclusive
}

/**
 * Greedily assigns each item to the first lane (row) where it doesn't
 * overlap an already-placed item, so simultaneous items stack instead of
 * colliding. Returns a map of item id -> lane index (0-based).
 */
export function assignLanes(items: PackableItem[]): Map<string, number> {
  const sorted = [...items].sort((a, b) => a.startIndex - b.startIndex || a.endIndex - b.endIndex);
  const laneEnds: number[] = []; // last occupied column index per lane
  const laneOf = new Map<string, number>();

  for (const item of sorted) {
    let lane = laneEnds.findIndex((end) => end < item.startIndex);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(item.endIndex);
    } else {
      laneEnds[lane] = item.endIndex;
    }
    laneOf.set(item.id, lane);
  }

  return laneOf;
}
