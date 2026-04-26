const data = [
  {
    propertyId: "502244720",
    address: "Sample property record",
    neighborhood: "Philadelphia",
    lat: 39.9526,
    lng: -75.1652,
    history: [
      { year: "2015", marketValue: 169600 },
      { year: "2016", marketValue: 169600 },
      { year: "2017", marketValue: 169600 },
      { year: "2018", marketValue: 169600 },
      { year: "2019", marketValue: 167000 },
      { year: "2020", marketValue: 169200 },
      { year: "2021", marketValue: 169200 },
      { year: "2022", marketValue: 169200 },
      { year: "2023", marketValue: 185000 },
      { year: "2024", marketValue: 185000 },
      { year: "2025", marketValue: 306700 },
      { year: "2026", marketValue: 306700 },
    ],
  },
];

let map = null;
let marker = null;

const DEFAULT_VIEW = {
  lat: 39.9526,
  lng: -75.1652,
  zoom: 12,
};

function formatMoney(value) {
  return `$${Number(value).toLocaleString()}`;
}

function initializeMap() {
  map = L.map("map").setView(
    [DEFAULT_VIEW.lat, DEFAULT_VIEW.lng],
    DEFAULT_VIEW.zoom,
  );

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);
}

function updateMap(property) {
  if (!map) return;

  map.setView([property.lat, property.lng], 15);

  if (marker) {
    map.removeLayer(marker);
  }

  marker = L.marker([property.lat, property.lng])
    .addTo(map)
    .bindPopup(`${property.address}<br>OPA ID: ${property.propertyId}`)
    .openPopup();
}

function resetSummary() {
  document.getElementById("opaIdText").textContent = "—";
  document.getElementById("addressText").textContent = "—";
  document.getElementById("currentValueText").textContent = "—";
  document.getElementById("taxYearText").textContent = "—";
  document.getElementById("neighborhoodText").textContent = "—";
}

function resetTrend() {
  const trendContainer = document.querySelector(".trend-placeholder");
  trendContainer.innerHTML =
    '<p class="empty-message">Assessment history will appear after lookup.</p>';
}

function resetView() {
  resetSummary();
  resetTrend();

  if (map) {
    map.setView([DEFAULT_VIEW.lat, DEFAULT_VIEW.lng], DEFAULT_VIEW.zoom);

    if (marker) {
      map.removeLayer(marker);
      marker = null;
    }
  }
}

function renderTrend(property) {
  const trendContainer = document.querySelector(".trend-placeholder");
  trendContainer.innerHTML = "";

  const maxValue = Math.max(
    ...property.history.map((item) => Number(item.marketValue)),
  );

  property.history.forEach((item) => {
    const group = document.createElement("div");
    group.className = "bar-group";

    const bar = document.createElement("div");
    bar.className = "bar";
    bar.style.height = `${(Number(item.marketValue) / maxValue) * 100}%`;

    const label = document.createElement("span");
    label.textContent = item.year;

    group.appendChild(bar);
    group.appendChild(label);
    trendContainer.appendChild(group);
  });
}

function renderSummary(property) {
  document.getElementById("opaIdText").textContent = property.propertyId;
  document.getElementById("addressText").textContent = property.address || "N/A";
  document.getElementById("neighborhoodText").textContent =
    property.neighborhood || "N/A";

  const latest = property.history[property.history.length - 1];
  document.getElementById("currentValueText").textContent = formatMoney(
    latest.marketValue,
  );
  document.getElementById("taxYearText").textContent = latest.year;
}

function renderProperty(property) {
  renderSummary(property);
  renderTrend(property);
  updateMap(property);
}

document.addEventListener("DOMContentLoaded", () => {
  initializeMap();
  resetView();

  document.getElementById("searchBtn").addEventListener("click", () => {
    const opaId = document.getElementById("opaIdInput").value.trim();
    const match = data.find((item) => item.propertyId === opaId);

    if (match) {
      renderProperty(match);
    } else {
      alert("OPA ID not found in sample data.");
      resetView();
    }
  });
});