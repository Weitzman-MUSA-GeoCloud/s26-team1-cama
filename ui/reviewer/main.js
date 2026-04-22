const predictedValueBins = [
  { lower_bound: 0, upper_bound: 10000, property_count: 1339 },
  { lower_bound: 10000, upper_bound: 20000, property_count: 35665 },
  { lower_bound: 20000, upper_bound: 30000, property_count: 38318 },
  { lower_bound: 30000, upper_bound: 40000, property_count: 32196 },
  { lower_bound: 40000, upper_bound: 50000, property_count: 31308 },
  { lower_bound: 50000, upper_bound: 60000, property_count: 31036 },
  { lower_bound: 60000, upper_bound: 70000, property_count: 28720 },
  { lower_bound: 70000, upper_bound: 80000, property_count: 26311 },
  { lower_bound: 80000, upper_bound: 90000, property_count: 24727 },
  { lower_bound: 90000, upper_bound: 100000, property_count: 20356 },
  { lower_bound: 100000, upper_bound: 110000, property_count: 23083 },
  { lower_bound: 110000, upper_bound: 120000, property_count: 20659 },
  { lower_bound: 120000, upper_bound: 130000, property_count: 14872 },
  { lower_bound: 130000, upper_bound: 140000, property_count: 11732 },
  { lower_bound: 140000, upper_bound: 150000, property_count: 18632 },
  { lower_bound: 150000, upper_bound: 160000, property_count: 11185 },
  { lower_bound: 160000, upper_bound: 170000, property_count: 15253 },
  { lower_bound: 170000, upper_bound: 180000, property_count: 7702 },
  { lower_bound: 180000, upper_bound: 190000, property_count: 7315 },
  { lower_bound: 190000, upper_bound: 200000, property_count: 9517 },
  { lower_bound: 200000, upper_bound: 210000, property_count: 6613 },
  { lower_bound: 210000, upper_bound: 220000, property_count: 7910 },
  { lower_bound: 220000, upper_bound: 230000, property_count: 4909 },
  { lower_bound: 230000, upper_bound: 240000, property_count: 5516 },
  { lower_bound: 240000, upper_bound: 250000, property_count: 4203 },
  { lower_bound: 250000, upper_bound: 260000, property_count: 3942 },
  { lower_bound: 260000, upper_bound: 270000, property_count: 3463 },
  { lower_bound: 270000, upper_bound: 280000, property_count: 3456 },
  { lower_bound: 280000, upper_bound: 290000, property_count: 3090 },
  { lower_bound: 290000, upper_bound: 300000, property_count: 2884 },
  { lower_bound: 300000, upper_bound: 310000, property_count: 2834 },
  { lower_bound: 310000, upper_bound: 320000, property_count: 2842 },
  { lower_bound: 320000, upper_bound: 330000, property_count: 2070 },
  { lower_bound: 330000, upper_bound: 340000, property_count: 2653 },
  { lower_bound: 340000, upper_bound: 350000, property_count: 2395 },
  { lower_bound: 350000, upper_bound: 360000, property_count: 2391 },
  { lower_bound: 360000, upper_bound: 370000, property_count: 2017 },
  { lower_bound: 370000, upper_bound: 380000, property_count: 2373 },
  { lower_bound: 380000, upper_bound: 390000, property_count: 1686 },
  { lower_bound: 390000, upper_bound: 400000, property_count: 1951 },
  { lower_bound: 400000, upper_bound: 410000, property_count: 1187 },
  { lower_bound: 410000, upper_bound: 420000, property_count: 1715 },
  { lower_bound: 420000, upper_bound: 430000, property_count: 1376 },
  { lower_bound: 430000, upper_bound: 440000, property_count: 1191 },
  { lower_bound: 440000, upper_bound: 450000, property_count: 985 },
  { lower_bound: 450000, upper_bound: 460000, property_count: 794 },
  { lower_bound: 460000, upper_bound: 470000, property_count: 1444 },
  { lower_bound: 470000, upper_bound: 480000, property_count: 663 },
  { lower_bound: 480000, upper_bound: 490000, property_count: 920 },
  { lower_bound: 490000, upper_bound: 500000, property_count: 718 },
  { lower_bound: 500000, upper_bound: 510000, property_count: 982 },
  { lower_bound: 510000, upper_bound: 520000, property_count: 906 },
  { lower_bound: 520000, upper_bound: 530000, property_count: 921 },
  { lower_bound: 530000, upper_bound: 540000, property_count: 628 },
  { lower_bound: 540000, upper_bound: 550000, property_count: 977 },
  { lower_bound: 550000, upper_bound: 560000, property_count: 433 },
  { lower_bound: 560000, upper_bound: 570000, property_count: 262 },
  { lower_bound: 570000, upper_bound: 580000, property_count: 408 },
  { lower_bound: 580000, upper_bound: 590000, property_count: 310 },
  { lower_bound: 590000, upper_bound: 600000, property_count: 628 },
  { lower_bound: 600000, upper_bound: 610000, property_count: 374 },
  { lower_bound: 610000, upper_bound: 620000, property_count: 183 },
  { lower_bound: 620000, upper_bound: 630000, property_count: 158 },
  { lower_bound: 630000, upper_bound: 640000, property_count: 463 },
  { lower_bound: 640000, upper_bound: 650000, property_count: 190 },
  { lower_bound: 650000, upper_bound: 660000, property_count: 310 },
  { lower_bound: 660000, upper_bound: 670000, property_count: 112 },
  { lower_bound: 670000, upper_bound: 680000, property_count: 157 },
  { lower_bound: 680000, upper_bound: 690000, property_count: 311 },
  { lower_bound: 690000, upper_bound: 700000, property_count: 174 },
  { lower_bound: 700000, upper_bound: 710000, property_count: 167 },
  { lower_bound: 710000, upper_bound: 720000, property_count: 197 },
  { lower_bound: 720000, upper_bound: 730000, property_count: 117 },
  { lower_bound: 730000, upper_bound: 740000, property_count: 184 },
  { lower_bound: 740000, upper_bound: 750000, property_count: 217 },
  { lower_bound: 750000, upper_bound: 760000, property_count: 88 },
  { lower_bound: 760000, upper_bound: 770000, property_count: 236 },
  { lower_bound: 770000, upper_bound: 780000, property_count: 221 },
  { lower_bound: 780000, upper_bound: 790000, property_count: 110 },
  { lower_bound: 790000, upper_bound: 800000, property_count: 272 },
  { lower_bound: 800000, upper_bound: 810000, property_count: 218 },
  { lower_bound: 810000, upper_bound: 820000, property_count: 186 },
  { lower_bound: 820000, upper_bound: 830000, property_count: 445 },
  { lower_bound: 830000, upper_bound: 840000, property_count: 223 },
  { lower_bound: 840000, upper_bound: 850000, property_count: 174 },
  { lower_bound: 850000, upper_bound: 860000, property_count: 266 },
  { lower_bound: 860000, upper_bound: 870000, property_count: 159 },
  { lower_bound: 870000, upper_bound: 880000, property_count: 141 },
  { lower_bound: 880000, upper_bound: 890000, property_count: 95 },
  { lower_bound: 890000, upper_bound: 900000, property_count: 150 },
  { lower_bound: 900000, upper_bound: 910000, property_count: 337 },
  { lower_bound: 910000, upper_bound: 920000, property_count: 157 },
  { lower_bound: 920000, upper_bound: 930000, property_count: 92 },
  { lower_bound: 930000, upper_bound: 940000, property_count: 155 },
  { lower_bound: 940000, upper_bound: 950000, property_count: 52 },
  { lower_bound: 950000, upper_bound: 960000, property_count: 133 },
  { lower_bound: 960000, upper_bound: 970000, property_count: 187 },
  { lower_bound: 970000, upper_bound: 980000, property_count: 102 },
  { lower_bound: 980000, upper_bound: 990000, property_count: 151 },
  { lower_bound: 990000, upper_bound: 1000000, property_count: 160 },
  { lower_bound: 1000000, upper_bound: 1010000, property_count: 89 },
  { lower_bound: 1010000, upper_bound: 1020000, property_count: 82 },
  { lower_bound: 1020000, upper_bound: 1030000, property_count: 166 },
  { lower_bound: 1030000, upper_bound: 1040000, property_count: 114 },
  { lower_bound: 1040000, upper_bound: 1050000, property_count: 246 },
  { lower_bound: 1050000, upper_bound: 1060000, property_count: 74 },
  { lower_bound: 1060000, upper_bound: 1070000, property_count: 85 },
  { lower_bound: 1070000, upper_bound: 1080000, property_count: 129 },
  { lower_bound: 1080000, upper_bound: 1090000, property_count: 60 },
  { lower_bound: 1090000, upper_bound: 1100000, property_count: 107 },
  { lower_bound: 1100000, upper_bound: 1110000, property_count: 43 },
  { lower_bound: 1110000, upper_bound: 1120000, property_count: 18 },
  { lower_bound: 1120000, upper_bound: 1130000, property_count: 47 },
  { lower_bound: 1130000, upper_bound: 1140000, property_count: 376 },
  { lower_bound: 1140000, upper_bound: 1150000, property_count: 86 },
  { lower_bound: 1150000, upper_bound: 1160000, property_count: 43 },
  { lower_bound: 1160000, upper_bound: 1170000, property_count: 29 },
  { lower_bound: 1170000, upper_bound: 1180000, property_count: 72 },
  { lower_bound: 1180000, upper_bound: 1190000, property_count: 32 },
  { lower_bound: 1190000, upper_bound: 1200000, property_count: 66 },
  { lower_bound: 1200000, upper_bound: 1210000, property_count: 20 },
  { lower_bound: 1210000, upper_bound: 1220000, property_count: 53 },
  { lower_bound: 1220000, upper_bound: 1230000, property_count: 36 },
  { lower_bound: 1230000, upper_bound: 1240000, property_count: 25 },
  { lower_bound: 1240000, upper_bound: 1250000, property_count: 64 },
  { lower_bound: 1250000, upper_bound: 1260000, property_count: 12 },
  { lower_bound: 1260000, upper_bound: 1270000, property_count: 2 },
  { lower_bound: 1270000, upper_bound: 1280000, property_count: 24 },
  { lower_bound: 1280000, upper_bound: 1290000, property_count: 32 },
  { lower_bound: 1290000, upper_bound: 1300000, property_count: 37 },
  { lower_bound: 1300000, upper_bound: 1310000, property_count: 60 },
  { lower_bound: 1320000, upper_bound: 1330000, property_count: 28 },
  { lower_bound: 1330000, upper_bound: 1340000, property_count: 41 },
  { lower_bound: 1340000, upper_bound: 1350000, property_count: 28 },
  { lower_bound: 1350000, upper_bound: 1360000, property_count: 5 },
  { lower_bound: 1360000, upper_bound: 1370000, property_count: 6 },
  { lower_bound: 1370000, upper_bound: 1380000, property_count: 2 },
  { lower_bound: 1380000, upper_bound: 1390000, property_count: 4 },
  { lower_bound: 1390000, upper_bound: 1400000, property_count: 3 },
  { lower_bound: 1400000, upper_bound: 1410000, property_count: 25 },
  { lower_bound: 1410000, upper_bound: 1420000, property_count: 4 },
  { lower_bound: 1420000, upper_bound: 1430000, property_count: 18 },
  { lower_bound: 1430000, upper_bound: 1440000, property_count: 6 },
  { lower_bound: 1440000, upper_bound: 1450000, property_count: 104 },
  { lower_bound: 1450000, upper_bound: 1460000, property_count: 34 },
  { lower_bound: 1460000, upper_bound: 1470000, property_count: 24 },
  { lower_bound: 1480000, upper_bound: 1490000, property_count: 3 },
  { lower_bound: 1490000, upper_bound: 1500000, property_count: 16 },
  { lower_bound: 1510000, upper_bound: 1520000, property_count: 12 },
  { lower_bound: 1540000, upper_bound: 1550000, property_count: 1 },
  { lower_bound: 1550000, upper_bound: 1560000, property_count: 13 },
  { lower_bound: 1580000, upper_bound: 1590000, property_count: 11 },
  { lower_bound: 1610000, upper_bound: 1620000, property_count: 3 },
  { lower_bound: 1620000, upper_bound: 1630000, property_count: 18 },
  { lower_bound: 1640000, upper_bound: 1650000, property_count: 7 },
  { lower_bound: 1660000, upper_bound: 1670000, property_count: 22 },
  { lower_bound: 1680000, upper_bound: 1690000, property_count: 7 },
  { lower_bound: 1720000, upper_bound: 1730000, property_count: 1 },
  { lower_bound: 1730000, upper_bound: 1740000, property_count: 20 },
  { lower_bound: 1790000, upper_bound: 1800000, property_count: 5 }
];

const map = L.map("map").setView([39.9526, -75.1652], 12);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

const neighborhoodPoints = [
  { name: "Center City", lat: 39.9526, lng: -75.1652, valueBand: "$100k–$110k" },
  { name: "University City", lat: 39.9607, lng: -75.1993, valueBand: "$90k–$100k" },
  { name: "West Philadelphia", lat: 39.9651, lng: -75.2217, valueBand: "$70k–$80k" },
  { name: "Fishtown", lat: 39.9697, lng: -75.1339, valueBand: "$120k–$130k" }
];

neighborhoodPoints.forEach((point) => {
  L.circleMarker([point.lat, point.lng], {
    radius: 9,
    weight: 2,
    color: "#ffffff",
    fillColor: "#688898",
    fillOpacity: 0.9
  })
    .addTo(map)
    .bindPopup(
      `<strong>${point.name}</strong><br/>Predicted value band: ${point.valueBand}`
    );
});

function formatBinLabel(lower, upper) {
  return `$${Math.round(lower / 1000)}k–$${Math.round(upper / 1000)}k`;
}

function formatBinLabel(lower, upper) {
  return `$${Math.round(lower / 1000)}k–$${Math.round(upper / 1000)}k`;
}

function formatYAxisValue(value) {
  return Math.round(value).toLocaleString();
}

function renderDistributionHistogram(data) {
  const container = document.getElementById("distributionChart");
  const yAxis = document.getElementById("distributionYAxis");
  if (!container || !yAxis) return;

  container.innerHTML = "";
  yAxis.innerHTML = "";

  const maxCount = Math.max(...data.map((d) => d.property_count));

  const tickCount = 5;
  for (let i = tickCount; i >= 0; i--) {
    const tick = document.createElement("div");
    tick.textContent = formatYAxisValue((maxCount / tickCount) * i);
    yAxis.appendChild(tick);
  }

  const chart = document.createElement("div");
  chart.className = "histogram-bars";

  data.forEach((bin, index) => {
    const group = document.createElement("div");
    group.className = "histogram-group";

    const bar = document.createElement("div");
    bar.className = "histogram-bar";
    bar.style.height = `${(bin.property_count / maxCount) * 100}%`;
    bar.title = `${formatBinLabel(bin.lower_bound, bin.upper_bound)}: ${bin.property_count.toLocaleString()} properties`;

    const label = document.createElement("span");
    label.className = "histogram-label";

    const shouldShow =
      index === 0 || index === data.length - 1 || index % 2 === 0;

    label.textContent = shouldShow
      ? formatBinLabel(bin.lower_bound, bin.upper_bound)
      : "";

    group.appendChild(bar);
    group.appendChild(label);
    chart.appendChild(group);
  });

  container.appendChild(chart);
}

renderDistributionHistogram(predictedValueBins);