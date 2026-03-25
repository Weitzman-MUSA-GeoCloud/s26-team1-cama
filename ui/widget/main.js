const propertyData = {
  address: "123 Market St",
  value: "$320,000",
  change: "+14%",
  neighborhood: "Center City",
  explanation:
    "This property’s assessed value increased in line with recent neighborhood trends. The change may reflect surrounding market activity and comparable residential values.",
  lat: 39.9526,
  lng: -75.1652
};

document.getElementById("searchBtn").addEventListener("click", () => {
  const input = document.getElementById("addressInput").value.trim();

  if (input) {
    document.getElementById("addressText").textContent = input;
  } else {
    document.getElementById("addressText").textContent = propertyData.address;
  }

  document.getElementById("valueText").textContent = propertyData.value;
  document.getElementById("changeText").textContent = propertyData.change;
  document.getElementById("neighborhoodText").textContent = propertyData.neighborhood;
  document.getElementById("explanationText").textContent = propertyData.explanation;
});

const map = L.map("map").setView([propertyData.lat, propertyData.lng], 14);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

L.marker([propertyData.lat, propertyData.lng])
  .addTo(map)
  .bindPopup("123 Market St")
  .openPopup();