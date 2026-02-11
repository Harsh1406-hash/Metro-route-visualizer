// DOM Elements
const srcDropdown = document.getElementById("source");
const destDropdown = document.getElementById("destination");
const preferenceDropdown = document.getElementById("preference");
const resultBox = document.getElementById("output");

// Populate source and destination station dropdowns
function loadStations() {
  srcDropdown.innerHTML = "";
  destDropdown.innerHTML = "";

  stations.forEach(stationName => {
    srcDropdown.appendChild(new Option(stationName, stationName));
    destDropdown.appendChild(new Option(stationName, stationName));
  });
}

// Find shortest metro route using Dijkstra's Algorithm
function calculateRoute() {
  const startStation = srcDropdown.value;
  const endStation = destDropdown.value;
  const optimizationType = preferenceDropdown.value;

  // Validation
  if (!startStation || !endStation) {
    resultBox.innerHTML =
      '<p class="text-red-600 font-semibold">Please choose both start and end stations.</p>';
    return;
  }

  if (startStation === endStation) {
    resultBox.innerHTML =
      '<p class="text-red-600 font-semibold">Start and end stations must be different.</p>';
    return;
  }

  // Apply Dijkstra Algorithm
  const shortestPath = dijkstra(graph, startStation, endStation, optimizationType);

  if (!shortestPath) {
    resultBox.innerHTML =
      `<p class="text-red-600 font-semibold">No metro route available between ${startStation} and ${endStation}.</p>`;
    return;
  }

  // Calculate total metrics
  let totalTravelTime = 0;
  let totalFare = 0;
  const totalStations = shortestPath.length - 1;

  for (let i = 0; i < shortestPath.length - 1; i++) {
    const connection = graph[shortestPath[i]].find(
      edge => edge.to === shortestPath[i + 1]
    );

    if (connection) {
      totalTravelTime += connection.time;
      totalFare += connection.cost;
    }
  }

  // Display result
  resultBox.innerHTML = `
    <h2 class="text-lg font-semibold mb-2">Shortest Metro Route</h2>
    <p class="mb-4 text-blue-700 font-medium">${shortestPath.join(" 🚇 → ")}</p>
    <ul class="list-disc list-inside text-gray-700 space-y-1">
      <li>⏱️ Estimated Time: <strong>${totalTravelTime} minutes</strong></li>
      <li>💰 Estimated Fare: <strong>${totalFare} units</strong></li>
      <li>🚏 Number of Stops: <strong>${totalStations}</strong></li>
    </ul>
  `;
}

// Reset UI selections
function clearSelection() {
  srcDropdown.value = "";
  destDropdown.value = "";
  preferenceDropdown.value = "time";
  resultBox.innerHTML =
    '<p class="italic text-center text-gray-500">Select stations to view route details.</p>';
}
loadStations();
