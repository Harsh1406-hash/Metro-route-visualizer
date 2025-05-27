
const sourceSelect = document.getElementById('source');
const destinationSelect = document.getElementById('destination');
const preferenceSelect = document.getElementById('preference');
const outputDiv = document.getElementById('output');

function populateStations() {
  sourceSelect.innerHTML = '';
  destinationSelect.innerHTML = '';
  stations.forEach(station => {
    const opt1 = new Option(station, station);
    const opt2 = new Option(station, station);
    sourceSelect.appendChild(opt1);
    destinationSelect.appendChild(opt2);
  });
}

function findRoute() {
  const source = sourceSelect.value;
  const destination = destinationSelect.value;
  const preference = preferenceSelect.value;

  if (!source || !destination) {
    outputDiv.innerHTML = '<p class="text-red-600 font-semibold">Please select both source and destination stations.</p>';
    return;
  }

  if (source === destination) {
    outputDiv.innerHTML = '<p class="text-red-600 font-semibold">Source and destination cannot be the same.</p>';
    return;
  }

  const path = dijkstra(graph, source, destination, preference);
  if (!path) {
    outputDiv.innerHTML = `<p class="text-red-600 font-semibold">No route found between ${source} and ${destination}.</p>`;
    return;
  }

  let totalTime = 0, totalCost = 0, totalStops = path.length - 1;
  for (let i = 0; i < path.length - 1; i++) {
    const edge = graph[path[i]].find(e => e.to === path[i + 1]);
    if (edge) {
      totalTime += edge.time;
      totalCost += edge.cost;
    }
  }

  outputDiv.innerHTML = `
    <h2 class="text-lg font-semibold mb-2">Route found:</h2>
    <p class="mb-4 text-blue-700 font-medium">${path.join(' 🚇 → ')}</p>
    <ul class="list-disc list-inside text-gray-700 space-y-1">
      <li>⏱️ Total Time: <strong>${totalTime} minutes</strong></li>
      <li>💰 Total Cost: <strong>${totalCost} units</strong></li>
      <li>🚏 Total Stops: <strong>${totalStops}</strong></li>
    </ul>
  `;
}

function resetUI() {
  sourceSelect.value = '';
  destinationSelect.value = '';
  preferenceSelect.value = 'time';
  outputDiv.innerHTML = '<p class="italic text-center text-gray-500">Route details will appear here...</p>';
}
