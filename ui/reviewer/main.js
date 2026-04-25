const predictedValueBins = [
  { lowerBound: 0, upperBound: 10000, propertyCount: 1339 },
  { lowerBound: 10000, upperBound: 20000, propertyCount: 35665 },
  { lowerBound: 20000, upperBound: 30000, propertyCount: 38318 },
  { lowerBound: 30000, upperBound: 40000, propertyCount: 32196 },
  { lowerBound: 40000, upperBound: 50000, propertyCount: 31308 },
  { lowerBound: 50000, upperBound: 60000, propertyCount: 31036 },
  { lowerBound: 60000, upperBound: 70000, propertyCount: 28720 },
  { lowerBound: 70000, upperBound: 80000, propertyCount: 26311 },
  { lowerBound: 80000, upperBound: 90000, propertyCount: 24727 },
  { lowerBound: 90000, upperBound: 100000, propertyCount: 20356 },
  { lowerBound: 100000, upperBound: 110000, propertyCount: 23083 },
  { lowerBound: 110000, upperBound: 120000, propertyCount: 20659 },
  { lowerBound: 120000, upperBound: 130000, propertyCount: 14872 },
  { lowerBound: 130000, upperBound: 140000, propertyCount: 11732 },
  { lowerBound: 140000, upperBound: 150000, propertyCount: 18632 },
  { lowerBound: 150000, upperBound: 160000, propertyCount: 11185 },
  { lowerBound: 160000, upperBound: 170000, propertyCount: 15253 },
  { lowerBound: 170000, upperBound: 180000, propertyCount: 7702 },
  { lowerBound: 180000, upperBound: 190000, propertyCount: 7315 },
  { lowerBound: 190000, upperBound: 200000, propertyCount: 9517 },
  { lowerBound: 200000, upperBound: 210000, propertyCount: 6613 },
  { lowerBound: 210000, upperBound: 220000, propertyCount: 7910 },
  { lowerBound: 220000, upperBound: 230000, propertyCount: 4909 },
  { lowerBound: 230000, upperBound: 240000, propertyCount: 5516 },
  { lowerBound: 240000, upperBound: 250000, propertyCount: 4203 },
  { lowerBound: 250000, upperBound: 260000, propertyCount: 3942 },
  { lowerBound: 260000, upperBound: 270000, propertyCount: 3463 },
  { lowerBound: 270000, upperBound: 280000, propertyCount: 3456 },
  { lowerBound: 280000, upperBound: 290000, propertyCount: 3090 },
  { lowerBound: 290000, upperBound: 300000, propertyCount: 2884 },
  { lowerBound: 300000, upperBound: 310000, propertyCount: 2834 },
  { lowerBound: 310000, upperBound: 320000, propertyCount: 2842 },
  { lowerBound: 320000, upperBound: 330000, propertyCount: 2070 },
  { lowerBound: 330000, upperBound: 340000, propertyCount: 2653 },
  { lowerBound: 340000, upperBound: 350000, propertyCount: 2395 },
  { lowerBound: 350000, upperBound: 360000, propertyCount: 2391 },
  { lowerBound: 360000, upperBound: 370000, propertyCount: 2017 },
  { lowerBound: 370000, upperBound: 380000, propertyCount: 2373 },
  { lowerBound: 380000, upperBound: 390000, propertyCount: 1686 },
  { lowerBound: 390000, upperBound: 400000, propertyCount: 1951 },
  { lowerBound: 400000, upperBound: 410000, propertyCount: 1187 },
  { lowerBound: 410000, upperBound: 420000, propertyCount: 1715 },
  { lowerBound: 420000, upperBound: 430000, propertyCount: 1376 },
  { lowerBound: 430000, upperBound: 440000, propertyCount: 1191 },
  { lowerBound: 440000, upperBound: 450000, propertyCount: 985 },
  { lowerBound: 450000, upperBound: 460000, propertyCount: 794 },
  { lowerBound: 460000, upperBound: 470000, propertyCount: 1444 },
  { lowerBound: 470000, upperBound: 480000, propertyCount: 663 },
  { lowerBound: 480000, upperBound: 490000, propertyCount: 920 },
  { lowerBound: 490000, upperBound: 500000, propertyCount: 718 },
  { lowerBound: 500000, upperBound: 510000, propertyCount: 982 },
  { lowerBound: 510000, upperBound: 520000, propertyCount: 906 },
  { lowerBound: 520000, upperBound: 530000, propertyCount: 921 },
  { lowerBound: 530000, upperBound: 540000, propertyCount: 628 },
  { lowerBound: 540000, upperBound: 550000, propertyCount: 977 },
  { lowerBound: 550000, upperBound: 560000, propertyCount: 433 },
  { lowerBound: 560000, upperBound: 570000, propertyCount: 262 },
  { lowerBound: 570000, upperBound: 580000, propertyCount: 408 },
  { lowerBound: 580000, upperBound: 590000, propertyCount: 310 },
  { lowerBound: 590000, upperBound: 600000, propertyCount: 628 },
  { lowerBound: 600000, upperBound: 610000, propertyCount: 374 },
  { lowerBound: 610000, upperBound: 620000, propertyCount: 183 },
  { lowerBound: 620000, upperBound: 630000, propertyCount: 158 },
  { lowerBound: 630000, upperBound: 640000, propertyCount: 463 },
  { lowerBound: 640000, upperBound: 650000, propertyCount: 190 },
  { lowerBound: 650000, upperBound: 660000, propertyCount: 310 },
  { lowerBound: 660000, upperBound: 670000, propertyCount: 112 },
  { lowerBound: 670000, upperBound: 680000, propertyCount: 157 },
  { lowerBound: 680000, upperBound: 690000, propertyCount: 311 },
  { lowerBound: 690000, upperBound: 700000, propertyCount: 174 },
  { lowerBound: 700000, upperBound: 710000, propertyCount: 167 },
  { lowerBound: 710000, upperBound: 720000, propertyCount: 197 },
  { lowerBound: 720000, upperBound: 730000, propertyCount: 117 },
  { lowerBound: 730000, upperBound: 740000, propertyCount: 184 },
  { lowerBound: 740000, upperBound: 750000, propertyCount: 217 },
  { lowerBound: 750000, upperBound: 760000, propertyCount: 88 },
  { lowerBound: 760000, upperBound: 770000, propertyCount: 236 },
  { lowerBound: 770000, upperBound: 780000, propertyCount: 221 },
  { lowerBound: 780000, upperBound: 790000, propertyCount: 110 },
  { lowerBound: 790000, upperBound: 800000, propertyCount: 272 },
  { lowerBound: 800000, upperBound: 810000, propertyCount: 218 },
  { lowerBound: 810000, upperBound: 820000, propertyCount: 186 },
  { lowerBound: 820000, upperBound: 830000, propertyCount: 445 },
  { lowerBound: 830000, upperBound: 840000, propertyCount: 223 },
  { lowerBound: 840000, upperBound: 850000, propertyCount: 174 },
  { lowerBound: 850000, upperBound: 860000, propertyCount: 266 },
  { lowerBound: 860000, upperBound: 870000, propertyCount: 159 },
  { lowerBound: 870000, upperBound: 880000, propertyCount: 141 },
  { lowerBound: 880000, upperBound: 890000, propertyCount: 95 },
  { lowerBound: 890000, upperBound: 900000, propertyCount: 150 },
  { lowerBound: 900000, upperBound: 910000, propertyCount: 337 },
  { lowerBound: 910000, upperBound: 920000, propertyCount: 157 },
  { lowerBound: 920000, upperBound: 930000, propertyCount: 92 },
  { lowerBound: 930000, upperBound: 940000, propertyCount: 155 },
  { lowerBound: 940000, upperBound: 950000, propertyCount: 52 },
  { lowerBound: 950000, upperBound: 960000, propertyCount: 133 },
  { lowerBound: 960000, upperBound: 970000, propertyCount: 187 },
  { lowerBound: 970000, upperBound: 980000, propertyCount: 102 },
  { lowerBound: 980000, upperBound: 990000, propertyCount: 151 },
  { lowerBound: 990000, upperBound: 1000000, propertyCount: 160 },
  { lowerBound: 1000000, upperBound: 1010000, propertyCount: 89 },
  { lowerBound: 1010000, upperBound: 1020000, propertyCount: 82 },
  { lowerBound: 1020000, upperBound: 1030000, propertyCount: 166 },
  { lowerBound: 1030000, upperBound: 1040000, propertyCount: 114 },
  { lowerBound: 1040000, upperBound: 1050000, propertyCount: 246 },
  { lowerBound: 1050000, upperBound: 1060000, propertyCount: 74 },
  { lowerBound: 1060000, upperBound: 1070000, propertyCount: 85 },
  { lowerBound: 1070000, upperBound: 1080000, propertyCount: 129 },
  { lowerBound: 1080000, upperBound: 1090000, propertyCount: 60 },
  { lowerBound: 1090000, upperBound: 1100000, propertyCount: 107 },
  { lowerBound: 1100000, upperBound: 1110000, propertyCount: 43 },
  { lowerBound: 1110000, upperBound: 1120000, propertyCount: 18 },
  { lowerBound: 1120000, upperBound: 1130000, propertyCount: 47 },
  { lowerBound: 1130000, upperBound: 1140000, propertyCount: 376 },
  { lowerBound: 1140000, upperBound: 1150000, propertyCount: 86 },
  { lowerBound: 1150000, upperBound: 1160000, propertyCount: 43 },
  { lowerBound: 1160000, upperBound: 1170000, propertyCount: 29 },
  { lowerBound: 1170000, upperBound: 1180000, propertyCount: 72 },
  { lowerBound: 1180000, upperBound: 1190000, propertyCount: 32 },
  { lowerBound: 1190000, upperBound: 1200000, propertyCount: 66 },
  { lowerBound: 1200000, upperBound: 1210000, propertyCount: 20 },
  { lowerBound: 1210000, upperBound: 1220000, propertyCount: 53 },
  { lowerBound: 1220000, upperBound: 1230000, propertyCount: 36 },
  { lowerBound: 1230000, upperBound: 1240000, propertyCount: 25 },
  { lowerBound: 1240000, upperBound: 1250000, propertyCount: 64 },
  { lowerBound: 1250000, upperBound: 1260000, propertyCount: 12 },
  { lowerBound: 1260000, upperBound: 1270000, propertyCount: 2 },
  { lowerBound: 1270000, upperBound: 1280000, propertyCount: 24 },
  { lowerBound: 1280000, upperBound: 1290000, propertyCount: 32 },
  { lowerBound: 1290000, upperBound: 1300000, propertyCount: 37 },
  { lowerBound: 1300000, upperBound: 1310000, propertyCount: 60 },
  { lowerBound: 1320000, upperBound: 1330000, propertyCount: 28 },
  { lowerBound: 1330000, upperBound: 1340000, propertyCount: 41 },
  { lowerBound: 1340000, upperBound: 1350000, propertyCount: 28 },
  { lowerBound: 1350000, upperBound: 1360000, propertyCount: 5 },
  { lowerBound: 1360000, upperBound: 1370000, propertyCount: 6 },
  { lowerBound: 1370000, upperBound: 1380000, propertyCount: 2 },
  { lowerBound: 1380000, upperBound: 1390000, propertyCount: 4 },
  { lowerBound: 1390000, upperBound: 1400000, propertyCount: 3 },
  { lowerBound: 1400000, upperBound: 1410000, propertyCount: 25 },
  { lowerBound: 1410000, upperBound: 1420000, propertyCount: 4 },
  { lowerBound: 1420000, upperBound: 1430000, propertyCount: 18 },
  { lowerBound: 1430000, upperBound: 1440000, propertyCount: 6 },
  { lowerBound: 1440000, upperBound: 1450000, propertyCount: 104 },
  { lowerBound: 1450000, upperBound: 1460000, propertyCount: 34 },
  { lowerBound: 1460000, upperBound: 1470000, propertyCount: 24 },
  { lowerBound: 1480000, upperBound: 1490000, propertyCount: 3 },
  { lowerBound: 1490000, upperBound: 1500000, propertyCount: 16 },
  { lowerBound: 1510000, upperBound: 1520000, propertyCount: 12 },
  { lowerBound: 1540000, upperBound: 1550000, propertyCount: 1 },
  { lowerBound: 1550000, upperBound: 1560000, propertyCount: 13 },
  { lowerBound: 1580000, upperBound: 1590000, propertyCount: 11 },
  { lowerBound: 1610000, upperBound: 1620000, propertyCount: 3 },
  { lowerBound: 1620000, upperBound: 1630000, propertyCount: 18 },
  { lowerBound: 1640000, upperBound: 1650000, propertyCount: 7 },
  { lowerBound: 1660000, upperBound: 1670000, propertyCount: 22 },
  { lowerBound: 1680000, upperBound: 1690000, propertyCount: 7 },
  { lowerBound: 1720000, upperBound: 1730000, propertyCount: 1 },
  { lowerBound: 1730000, upperBound: 1740000, propertyCount: 20 },
  { lowerBound: 1790000, upperBound: 1800000, propertyCount: 5 }
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

function formatYAxisValue(value) {
  return Math.round(value).toLocaleString();
}

function renderDistributionHistogram(data) {
  const container = document.getElementById("distributionChart");
  const yAxis = document.getElementById("distributionYAxis");
  if (!container || !yAxis) return;

  container.innerHTML = "";
  yAxis.innerHTML = "";

  const maxCount = Math.max(...data.map((d) => d.propertyCount));

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
    bar.style.height = `${(bin.propertyCount / maxCount) * 100}%`;
    bar.title = `${formatBinLabel(bin.lowerBound, bin.upperBound)}: ${bin.propertyCount.toLocaleString()} properties`;

    const label = document.createElement("span");
    label.className = "histogram-label";

    const shouldShow =
      index === 0 || index === data.length - 1 || index % 2 === 0;

    label.textContent = shouldShow
      ? formatBinLabel(bin.lowerBound, bin.upperBound)
      : "";

    group.appendChild(bar);
    group.appendChild(label);
    chart.appendChild(group);
  });

  container.appendChild(chart);
}

renderDistributionHistogram(predictedValueBins);