function dijkstra(graph, start, end, weightType) {
  const distances = {};
  const previous = {};
  const queue = new Set();

  for (const node in graph) {
    distances[node] = Infinity;
    previous[node] = null;
    queue.add(node);
  }

  distances[start] = 0;

  while (queue.size > 0) {
    let currentNode = null;
    let minDistance = Infinity;

    for (const node of queue) {
      if (distances[node] < minDistance) {
        minDistance = distances[node];
        currentNode = node;
      }
    }

    if (currentNode === end) break;
    queue.delete(currentNode);

    for (const neighbor of graph[currentNode]) {
      if (!queue.has(neighbor.to)) continue;
      const alt = distances[currentNode] + neighbor[weightType];

      if (alt < distances[neighbor.to]) {
        distances[neighbor.to] = alt;
        previous[neighbor.to] = currentNode;
      }
    }
  }

  const path = [];
  let curr = end;
  while (curr) {
    path.unshift(curr);
    curr = previous[curr];
  }

  if (path[0] !== start) return null;
  return path;
}

function bfs(graph, start, end) {
  const queue = [start];
  const visited = new Set();
  const previous = {};

  visited.add(start);

  while (queue.length > 0) {
    const node = queue.shift();

    if (node === end) break;

    for (const neighbor of graph[node]) {
      if (!visited.has(neighbor.to)) {
        visited.add(neighbor.to);
        queue.push(neighbor.to);
        previous[neighbor.to] = node;
      }
    }
  }

  const path = [];
  let curr = end;
  while (curr) {
    path.unshift(curr);
    curr = previous[curr];
  }

  if (path[0] !== start) return null;
  return path;
}
