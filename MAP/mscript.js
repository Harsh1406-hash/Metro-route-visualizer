// Initialize the map
const map = L.map('map', {
  center: [28.65, 77.2],
  zoom: 13,
  minZoom: 13,
  maxZoom: 18
});

// Add OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const nodes = [];
const edges = [];

const nodeNameInput = document.getElementById('nodeName');
const latInput = document.getElementById('lat');
const lngInput = document.getElementById('lng');
const addNodeBtn = document.getElementById('addNodeBtn');

const startSelect = document.getElementById('startSelect');
const endSelect = document.getElementById('endSelect');
const w1Input = document.getElementById('w1'); // Distance in km
const hhInput = document.getElementById('hh');
const mmInput = document.getElementById('mm');
const ssInput = document.getElementById('ss');
const w3Input = document.getElementById('w3'); // Cost in rupees
const connectBtn = document.getElementById('connectBtn');
const downloadBtn = document.getElementById('downloadBtn');
const exportJsonBtn = document.getElementById('exportJsonBtn');

// Update dropdown options for stations in start/end selects
function updateOptions() {
  [startSelect, endSelect].forEach(select => {
    select.innerHTML = '<option value="">Select</option>';
    nodes.forEach(n => {
      const opt = document.createElement('option');
      opt.value = n.name;
      opt.textContent = n.name;
      select.appendChild(opt);
    });
  });
}

// Create a node marker on the map
function createNode(name, coords) {
  const marker = L.circleMarker(coords, {
    radius: 8,
    color: 'red',
    fillColor: 'yellow',
    fillOpacity: 1
  }).bindPopup(`🚉 Station: ${name}`).addTo(map);
  return { name, coords, marker };
}

// Connect two nodes with polyline and add edge to edges array
function connectNodes(n1, n2, weights) {
  const distance = parseFloat(weights[0]);
  const timeInMinutes = parseFloat(weights[1]);
  const cost = parseFloat(weights[2]);

  // Format time as HH : MM : SS
  const totalSeconds = Math.round(timeInMinutes * 60);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  const timeFormatted = `${hours} : ${minutes} : ${seconds}`;

  const label = `Distance: ${distance} km<br>Time: ${timeFormatted}<br>Cost: ₹${cost}`;

  // Draw polyline on map
  L.polyline([n1.coords, n2.coords], {
    color: '#444',
    weight: 4,
    dashArray: '6, 6'
  }).bindPopup(`🛤️ Track: ${n1.name} ↔ ${n2.name}<br>${label}`).addTo(map);

  edges.push({
    from: n1.name,
    to: n2.name,
    weights: [distance, timeInMinutes, cost]
  });
}

// Fetch lat,lng from Nominatim API for place name
async function fetchLatLng(place) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}&limit=1`;
  try {
    const response = await fetch(url, { headers: { 'User-Agent': 'RailwayNetworkMap/1.0' } });
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching location:', error);
    return null;
  }
}

// Auto-fetch lat/lng when user changes station name input
nodeNameInput.addEventListener('change', async () => {
  const place = nodeNameInput.value.trim();
  if (place) {
    latInput.value = 'Searching...';
    lngInput.value = 'Searching...';
    const coords = await fetchLatLng(place);
    if (coords) {
      latInput.value = coords.lat.toFixed(6);
      lngInput.value = coords.lng.toFixed(6);
    } else {
      alert('Location not found! Please enter valid station name.');
      latInput.value = '';
      lngInput.value = '';
    }
  } else {
    latInput.value = '';
    lngInput.value = '';
  }
});

// Add node button click handler
addNodeBtn.addEventListener('click', () => {
  const name = nodeNameInput.value.trim();
  const lat = parseFloat(latInput.value);
  const lng = parseFloat(lngInput.value);

  if (!name || isNaN(lat) || isNaN(lng)) {
    alert('Enter valid station name and coordinates');
    return;
  }
  if (nodes.find(n => n.name === name)) {
    alert('Station with this name already exists');
    return;
  }

  const node = createNode(name, [lat, lng]);
  nodes.push(node);
  updateOptions();

  // Clear inputs
  nodeNameInput.value = '';
  latInput.value = '';
  lngInput.value = '';
});

// Connect stations button click handler
connectBtn.addEventListener('click', () => {
  const sName = startSelect.value;
  const eName = endSelect.value;
  const distance = parseFloat(w1Input.value);
  const h = parseInt(hhInput.value) || 0;
  const m = parseInt(mmInput.value) || 0;
  const s = parseInt(ssInput.value) || 0;
  const cost = parseFloat(w3Input.value);

  if (!sName || !eName) {
    alert('Select both start and end stations');
    return;
  }
  if (isNaN(distance) || isNaN(cost) || distance <= 0 || cost < 0) {
    alert('Enter valid distance and cost');
    return;
  }
  if (h < 0 || m < 0 || m >= 60 || s < 0 || s >= 60) {
    alert('Enter valid time values');
    return;
  }

  const totalMinutes = h * 60 + m + s / 60;
  const n1 = nodes.find(n => n.name === sName);
  const n2 = nodes.find(n => n.name === eName);
  if (!n1 || !n2) {
    alert('Selected stations not found');
    return;
  }

  connectNodes(n1, n2, [distance, totalMinutes, cost]);

  // Clear inputs after connecting
  w1Input.value = '';
  hhInput.value = '';
  mmInput.value = '';
  ssInput.value = '';
  w3Input.value = '';
});

// Download map as PNG
downloadBtn.addEventListener('click', () => {
  html2canvas(document.querySelector("#map")).then(canvas => {
    const link = document.createElement('a');
    link.download = 'railway_network_map.png';
    link.href = canvas.toDataURL("image/png");
    link.click();
  });
});

// Export network data as JSON
exportJsonBtn.addEventListener('click', () => {
  const exportData = {
    nodes: nodes.map(n => ({
      name: n.name,
      latitude: n.coords[0],
      longitude: n.coords[1]
    })),
    edges: edges.map(e => ({
      from: e.from,
      to: e.to,
      weights: {
        distance_km: e.weights[0],
        time_min: e.weights[1],
        cost_rupees: e.weights[2]
      }
    }))
  };
  const jsonStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "network_data.json";
  a.click();
  URL.revokeObjectURL(url);
});

// Predefined dataset for Delhi Metro Network
const predefinedData = {
  nodes: [
    // Yellow Line (Samaypur Badli to HUDA City Centre)
    { name: "Samaypur Badli", latitude: 28.7389, longitude: 77.1674 },
    { name: "Rohini Sector 18", latitude: 28.7312, longitude: 77.1723 },
    { name: "Haiderpur Badli Mor", latitude: 28.7234, longitude: 77.1772 },
    { name: "Jahangirpuri", latitude: 28.7156, longitude: 77.1821 },
    { name: "Kashmere Gate", latitude: 28.6692, longitude: 77.2285 },
    { name: "Rajiv Chowk", latitude: 28.6324, longitude: 77.2197 },
    { name: "Central Secretariat", latitude: 28.6129, longitude: 77.2095 },
    { name: "Hauz Khas", latitude: 28.5442, longitude: 77.2065 },
    { name: "Saket", latitude: 28.5197, longitude: 77.2019 },
    { name: "Qutub Minar", latitude: 28.5245, longitude: 77.1855 },
    { name: "HUDA City Centre", latitude: 28.4697, longitude: 77.0947 },

    // Blue Line (Dwarka Sector 21 to Noida Electronic City)
    { name: "Dwarka Sector 21", latitude: 28.5442, longitude: 77.0589 },
    { name: "Dwarka Sector 8", latitude: 28.5697, longitude: 77.0589 },
    { name: "Dwarka Mor", latitude: 28.5952, longitude: 77.0589 },
    { name: "Rajouri Garden", latitude: 28.6324, longitude: 77.1219 },
    { name: "Karol Bagh", latitude: 28.6424, longitude: 77.1919 },
    { name: "Rajiv Chowk", latitude: 28.6324, longitude: 77.2197 },
    { name: "Yamuna Bank", latitude: 28.6324, longitude: 77.2797 },
    { name: "Noida Sector 15", latitude: 28.5744, longitude: 77.3275 },
    { name: "Noida Sector 16", latitude: 28.5703, longitude: 77.3270 },
    { name: "Noida Electronic City", latitude: 28.6364, longitude: 77.3687 },

    // Red Line (Rithala to Shaheed Sthal)
    { name: "Rithala", latitude: 28.7197, longitude: 77.1019 },
    { name: "Rohini West", latitude: 28.7097, longitude: 77.1119 },
    { name: "Pitampura", latitude: 28.6997, longitude: 77.1219 },
    { name: "Kashmere Gate", latitude: 28.6692, longitude: 77.2285 },
    { name: "Welcome", latitude: 28.6692, longitude: 77.2785 },
    { name: "Seelampur", latitude: 28.6692, longitude: 77.2885 },
    { name: "Shaheed Sthal", latitude: 28.6692, longitude: 77.3185 }
  ],
  edges: [
    // Yellow Line connections
    { from: "Samaypur Badli", to: "Rohini Sector 18", weights: { distance_km: 1.2, time_min: 2, cost_rupees: 10 } },
    { from: "Rohini Sector 18", to: "Haiderpur Badli Mor", weights: { distance_km: 1.0, time_min: 2, cost_rupees: 10 } },
    { from: "Haiderpur Badli Mor", to: "Jahangirpuri", weights: { distance_km: 1.1, time_min: 2, cost_rupees: 10 } },
    { from: "Jahangirpuri", to: "Kashmere Gate", weights: { distance_km: 2.5, time_min: 4, cost_rupees: 20 } },
    { from: "Kashmere Gate", to: "Rajiv Chowk", weights: { distance_km: 3.2, time_min: 5, cost_rupees: 30 } },
    { from: "Rajiv Chowk", to: "Central Secretariat", weights: { distance_km: 2.8, time_min: 4, cost_rupees: 20 } },
    { from: "Central Secretariat", to: "Hauz Khas", weights: { distance_km: 4.5, time_min: 7, cost_rupees: 40 } },
    { from: "Hauz Khas", to: "Saket", weights: { distance_km: 1.8, time_min: 3, cost_rupees: 20 } },
    { from: "Saket", to: "Qutub Minar", weights: { distance_km: 2.2, time_min: 3, cost_rupees: 20 } },
    { from: "Qutub Minar", to: "HUDA City Centre", weights: { distance_km: 8.5, time_min: 12, cost_rupees: 60 } },

    // Blue Line connections
    { from: "Dwarka Sector 21", to: "Dwarka Sector 8", weights: { distance_km: 1.5, time_min: 2, cost_rupees: 10 } },
    { from: "Dwarka Sector 8", to: "Dwarka Mor", weights: { distance_km: 1.3, time_min: 2, cost_rupees: 10 } },
    { from: "Dwarka Mor", to: "Rajouri Garden", weights: { distance_km: 4.2, time_min: 6, cost_rupees: 30 } },
    { from: "Rajouri Garden", to: "Karol Bagh", weights: { distance_km: 2.8, time_min: 4, cost_rupees: 20 } },
    { from: "Karol Bagh", to: "Rajiv Chowk", weights: { distance_km: 2.5, time_min: 4, cost_rupees: 20 } },
    { from: "Rajiv Chowk", to: "Yamuna Bank", weights: { distance_km: 3.5, time_min: 5, cost_rupees: 30 } },
    { from: "Yamuna Bank", to: "Noida Sector 15", weights: { distance_km: 4.2, time_min: 6, cost_rupees: 30 } },
    { from: "Noida Sector 15", to: "Noida Sector 16", weights: { distance_km: 1.2, time_min: 2, cost_rupees: 10 } },
    { from: "Noida Sector 16", to: "Noida Electronic City", weights: { distance_km: 3.8, time_min: 5, cost_rupees: 30 } },

    // Red Line connections
    { from: "Rithala", to: "Rohini West", weights: { distance_km: 1.4, time_min: 2, cost_rupees: 10 } },
    { from: "Rohini West", to: "Pitampura", weights: { distance_km: 1.2, time_min: 2, cost_rupees: 10 } },
    { from: "Pitampura", to: "Kashmere Gate", weights: { distance_km: 3.5, time_min: 5, cost_rupees: 30 } },
    { from: "Kashmere Gate", to: "Welcome", weights: { distance_km: 2.8, time_min: 4, cost_rupees: 20 } },
    { from: "Welcome", to: "Seelampur", weights: { distance_km: 1.5, time_min: 2, cost_rupees: 10 } },
    { from: "Seelampur", to: "Shaheed Sthal", weights: { distance_km: 2.2, time_min: 3, cost_rupees: 20 } }
  ]
};

// Function to load predefined data
function loadPredefinedData() {
  // Clear existing data
  nodes.forEach(node => node.marker.remove());
  nodes.length = 0;
  edges.length = 0;
  
  // Add nodes
  predefinedData.nodes.forEach(node => {
    const newNode = createNode(node.name, [node.latitude, node.longitude]);
    nodes.push(newNode);
  });
  
  // Add edges
  predefinedData.edges.forEach(edge => {
    const n1 = nodes.find(n => n.name === edge.from);
    const n2 = nodes.find(n => n.name === edge.to);
    if (n1 && n2) {
      connectNodes(n1, n2, [
        edge.weights.distance_km,
        edge.weights.time_min,
        edge.weights.cost_rupees
      ]);
    }
  });
  
  // Update dropdowns
  updateOptions();
  
  // Fit map to show all stations
  const bounds = nodes.map(n => n.coords);
  map.fitBounds(bounds);
}

// Load predefined data when the page loads
document.addEventListener('DOMContentLoaded', loadPredefinedData);
