const map = L.map("map").setView([39.9526, -75.1652], 12);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

const neighborhoodPoints = [
  { name: "Center City", lat: 39.9526, lng: -75.1652, change: "+12.4%" },
  { name: "University City", lat: 39.9607, lng: -75.1993, change: "+8.1%" },
  { name: "West Philadelphia", lat: 39.9651, lng: -75.2217, change: "+5.7%" },
  { name: "Fishtown", lat: 39.9697, lng: -75.1339, change: "+10.3%" }
];

neighborhoodPoints.forEach((point) => {
  L.circleMarker([point.lat, point.lng], {
    radius: 9,
    weight: 2,
    color: "#ffffff",
    fillColor: "#2563eb",
    fillOpacity: 0.85
  })
    .addTo(map)
    .bindPopup(`<strong>${point.name}</strong><br/>Median change: ${point.change}`);
});