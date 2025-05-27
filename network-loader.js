
let stations = [];
let graph = {};

document.getElementById("jsonUpload").addEventListener("change", function (event) {
  const file = event.target.files[0];
  const reader = new FileReader();

  reader.onload = function (e) {
    const data = JSON.parse(e.target.result);

    stations = data.nodes.map(n => n.name);
    graph = {};
    stations.forEach(s => graph[s] = []);

    data.edges.forEach(edge => {
      const { from, to, weights } = edge;
      const entry = {
        to,
        time: weights.time_min,
        cost: weights.cost_rupees,
        stops: 1
      };
      graph[from].push(entry);
      graph[to].push({ ...entry, to: from });
    });

    populateStations();
    resetUI();
  };

  reader.readAsText(file);
});
