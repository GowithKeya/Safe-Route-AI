export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

export function findSafestRouteDijkstra(routes: any[], hotspots: any[], startCoord: [number, number], endCoord: [number, number]) {
  // 1. Build Graph from all points in all routes
  const nodes = new Map<string, [number, number]>();
  const adjacencyList = new Map<string, { to: string, weight: number, distance: number }[]>();

  const getCoordKey = (coord: [number, number]) => `${coord[0].toFixed(5)},${coord[1].toFixed(5)}`;

  routes.forEach(route => {
    const points = Array.isArray(route.overview_polyline.points) 
      ? route.overview_polyline.points 
      : [];
    
    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      const key = getCoordKey(point);
      if (!nodes.has(key)) {
        nodes.set(key, point);
      }
      if (!adjacencyList.has(key)) {
        adjacencyList.set(key, []);
      }

      if (i > 0) {
        const prevPoint = points[i - 1];
        const prevKey = getCoordKey(prevPoint);
        const dist = calculateDistance(prevPoint[0], prevPoint[1], point[0], point[1]);
        
        // Calculate penalty based on hotspots
        let penalty = 0;
        hotspots.forEach(hotspot => {
          const distToHotspot = calculateDistance(point[0], point[1], hotspot.lat, hotspot.lng);
          if (distToHotspot < 500) { // within 500 meters
            penalty += hotspot.severity === 'High' ? 5000 : 2000; // Add huge penalty distance
          }
        });

        const weight = dist + penalty;

        adjacencyList.get(prevKey)?.push({ to: key, weight, distance: dist });
        adjacencyList.get(key)?.push({ to: prevKey, weight, distance: dist }); // undirected for simplicity
      }
    }
  });

  // Connect start and end to nearest nodes if they are not exactly in the routes
  const startKey = getCoordKey(startCoord);
  const endKey = getCoordKey(endCoord);
  
  if (!nodes.has(startKey)) {
    nodes.set(startKey, startCoord);
    adjacencyList.set(startKey, []);
    let minDist = Infinity;
    let closest = '';
    nodes.forEach((coord, key) => {
      if (key !== startKey && key !== endKey) {
        const d = calculateDistance(startCoord[0], startCoord[1], coord[0], coord[1]);
        if (d < minDist) { minDist = d; closest = key; }
      }
    });
    if (closest) {
      adjacencyList.get(startKey)?.push({ to: closest, weight: minDist, distance: minDist });
      adjacencyList.get(closest)?.push({ to: startKey, weight: minDist, distance: minDist });
    }
  }

  if (!nodes.has(endKey)) {
    nodes.set(endKey, endCoord);
    adjacencyList.set(endKey, []);
    let minDist = Infinity;
    let closest = '';
    nodes.forEach((coord, key) => {
      if (key !== startKey && key !== endKey) {
        const d = calculateDistance(endCoord[0], endCoord[1], coord[0], coord[1]);
        if (d < minDist) { minDist = d; closest = key; }
      }
    });
    if (closest) {
      adjacencyList.get(endKey)?.push({ to: closest, weight: minDist, distance: minDist });
      adjacencyList.get(closest)?.push({ to: endKey, weight: minDist, distance: minDist });
    }
  }

  // 2. Dijkstra's Algorithm
  const distances = new Map<string, number>();
  const previous = new Map<string, string>();
  const unvisited = new Set<string>();

  nodes.forEach((_, key) => {
    distances.set(key, Infinity);
    unvisited.add(key);
  });
  distances.set(startKey, 0);

  while (unvisited.size > 0) {
    let current = '';
    let minDistance = Infinity;
    unvisited.forEach(key => {
      const dist = distances.get(key)!;
      if (dist < minDistance) {
        minDistance = dist;
        current = key;
      }
    });

    if (current === '' || current === endKey) {
      break;
    }

    unvisited.delete(current);

    const neighbors = adjacencyList.get(current) || [];
    for (const neighbor of neighbors) {
      if (unvisited.has(neighbor.to)) {
        const newDist = distances.get(current)! + neighbor.weight;
        if (newDist < distances.get(neighbor.to)!) {
          distances.set(neighbor.to, newDist);
          previous.set(neighbor.to, current);
        }
      }
    }
  }

  // 3. Reconstruct Path
  const path: [number, number][] = [];
  let curr: string | undefined = endKey;
  let totalDistance = 0;

  if (previous.has(endKey) || startKey === endKey) {
    while (curr) {
      path.unshift(nodes.get(curr)!);
      const prev: string | undefined = previous.get(curr);
      if (prev) {
        const edge = adjacencyList.get(prev)?.find(e => e.to === curr);
        if (edge) totalDistance += edge.distance;
      }
      curr = prev;
    }
  }

  return { path, distance: totalDistance };
}
