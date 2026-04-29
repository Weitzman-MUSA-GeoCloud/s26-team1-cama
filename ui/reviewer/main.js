const PUBLIC_BASE_URL =
  "https://storage.googleapis.com/musa5090s26-team1-public";
const MAP_STYLE_METADATA_URL = `${PUBLIC_BASE_URL}/configs/map_style_metadata.json`;
const TAX_YEAR_ASSESSMENT_BINS_URL = `${PUBLIC_BASE_URL}/configs/tax_year_assessment_bins.json`;
const CURRENT_ASSESSMENT_BINS_URL = `${PUBLIC_BASE_URL}/configs/current_assessment_bins.json`;

const DEFAULT_TILE_URL = `${PUBLIC_BASE_URL}/tiles/properties/{z}/{x}/{y}.pbf`;
const DEFAULT_TILE_LAYER = "property_tile_info";
const MAIN_DISPLAY_MAX = 2500000;
const MAIN_DISPLAY_BIN_SIZE = 100000;
const VALUE_COLORS = ["#eff6ff", "#bfdbfe", "#93c5fd", "#60a5fa", "#2563eb", "#1e3a8a"];
const GAP_UNAVAILABLE_COLOR = "#d9dde5";
const GAP_BINS = [
  { max: -75, label: "&le; -75%", color: "#53627f" },
  { min: -75, max: -25, label: "-75% to -25%", color: "#8798b3" },
  { min: -25, max: 25, label: "-25% to +25%", color: "#d8dee9" },
  { min: 25, max: 75, label: "+25% to +75%", color: "#c99a5c" },
  { min: 75, label: "&gt; +75%", color: "#87552c" },
];

const map = L.map("map", {
  zoomControl: true,
}).setView([39.9526, -75.1652], 12);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

let metadata = null;
let activeMode = "official";
let propertyTileLayer = null;
let hoverPopup = null;
let officialChart = null;
let modelChart = null;
let legendControl = null;

const modes = {
  official: {
    label: "Official Value",
    description: "Showing official assessed value across residential parcels.",
    field: "tax_year_assessed_value",
    metadataField: "tax_year_assessed_value",
    colors: VALUE_COLORS,
  },
  estimate: {
    label: "Model Estimate",
    description: "Showing model estimated current market value across residential parcels.",
    field: "current_assessed_value",
    metadataField: "current_assessed_value",
    colors: VALUE_COLORS,
  },
  gap: {
    label: "Gap (%)",
    description: "Showing percent difference between model estimate and official value.",
    field: "gap_pct",
    metadataField: "percent_change",
    colors: GAP_BINS.map((bin) => bin.color),
  },
};

function formatMoney(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "N/A";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(number);
}

function formatCompactMoney(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "N/A";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(number);
}

function formatNumber(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "N/A";
  }

  return new Intl.NumberFormat("en-US").format(Math.round(number));
}

function formatPercent(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "N/A";
  }

  return new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(number);
}

function formatGapPercent(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "Gap unavailable";
  }

  return `${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(number)}%`;
}

function setStatus(message = "") {
  document.getElementById("mapStatus").textContent = message;
}

function getTilePropertyValue(properties, modeName = activeMode) {
  if (modeName === "gap") {
    const official = Number(properties.tax_year_assessed_value);
    const estimate = Number(properties.current_assessed_value);

    if (
      !Number.isFinite(official) ||
      official < 10000 ||
      !Number.isFinite(estimate)
    ) {
      return null;
    }

    return ((estimate - official) / official) * 100;
  }

  return Number(properties[modes[modeName].field]);
}

function getBreakpoints(modeName = activeMode) {
  const mode = modes[modeName];
  const fieldMetadata = metadata?.fields?.[mode.metadataField];
  const breakpoints =
    fieldMetadata?.quantile_breakpoints || fieldMetadata?.fixed_breakpoints || [];

  return breakpoints
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value))
    .sort((left, right) => left - right);
}

function getColor(value, modeName = activeMode) {
  const number = Number(value);
  const mode = modes[modeName];
  const breakpoints = getBreakpoints(modeName);

  if (modeName === "gap") {
    const gapBin = getGapBin(number);
    return gapBin ? gapBin.color : GAP_UNAVAILABLE_COLOR;
  }

  if (!Number.isFinite(number)) {
    return "#cfd6df";
  }

  if (breakpoints.length < 2) {
    return mode.colors[Math.floor(mode.colors.length / 2)];
  }

  let index = 0;
  for (let i = 1; i < breakpoints.length; i += 1) {
    if (number >= breakpoints[i]) {
      index = i;
    }
  }

  return mode.colors[Math.min(index, mode.colors.length - 1)];
}

function getGapBin(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return null;
  }

  return GAP_BINS.find((bin) => {
    const aboveMin = bin.min === undefined || number > bin.min;
    const belowMax = bin.max === undefined || number <= bin.max;
    return aboveMin && belowMax;
  });
}

function styleFeature(properties) {
  const value = getTilePropertyValue(properties);
  const gapUnavailable = activeMode === "gap" && !Number.isFinite(Number(value));

  return {
    fill: true,
    fillColor: getColor(value),
    fillOpacity: gapUnavailable ? 0.25 : 0.72,
    color: "#ffffff",
    opacity: 0.35,
    weight: 0.45,
  };
}

function formatModeValue(value, modeName = activeMode) {
  return modeName === "gap" ? formatGapPercent(value) : formatMoney(value);
}

function getTileConfig() {
  return {
    url: metadata?.vector_tiles?.url_template || DEFAULT_TILE_URL,
    sourceLayer: metadata?.vector_tiles?.source_layer || DEFAULT_TILE_LAYER,
    minzoom: Number(metadata?.vector_tiles?.minzoom) || 12,
    maxzoom: Number(metadata?.vector_tiles?.maxzoom) || 18,
  };
}

function renderLegend() {
  const mode = modes[activeMode];
  const breakpoints = getBreakpoints();

  if (!legendControl) {
    legendControl = L.control({ position: "bottomright" });
    legendControl.onAdd = () => {
      const div = L.DomUtil.create("div", "map-legend");
      div.id = "mapLegend";
      return div;
    };
    legendControl.addTo(map);
  }

  const legend = document.getElementById("mapLegend");
  const labels =
    activeMode === "gap"
      ? GAP_BINS.map(
          (bin) => `
            <div class="legend-row">
              <span style="background:${bin.color}"></span>
              <em>${bin.label}</em>
            </div>
          `,
        )
      : breakpoints.slice(0, mode.colors.length).map((breakpoint, index) => {
          const next = breakpoints[index + 1];
          const label =
            next === undefined
              ? `${formatModeValue(breakpoint)}+`
              : `${formatModeValue(breakpoint)} to ${formatModeValue(next)}`;

          return `
            <div class="legend-row">
              <span style="background:${mode.colors[index]}"></span>
              <em>${label}</em>
            </div>
          `;
        });

  legend.innerHTML = `
    <strong>${mode.label}</strong>
    ${labels.join("")}
  `;
}

function renderTileLayer() {
  const tileConfig = getTileConfig();

  if (propertyTileLayer) {
    map.removeLayer(propertyTileLayer);
  }

  propertyTileLayer = L.vectorGrid.protobuf(tileConfig.url, {
    rendererFactory: L.canvas.tile,
    interactive: true,
    minZoom: tileConfig.minzoom,
    maxZoom: tileConfig.maxzoom,
    maxNativeZoom: tileConfig.maxzoom,
    vectorTileLayerStyles: {
      [tileConfig.sourceLayer]: styleFeature,
    },
  });

  propertyTileLayer.on("mouseover", (event) => {
    const properties = event.layer.properties;
    const value = getTilePropertyValue(properties);

    hoverPopup = L.popup({
      closeButton: false,
      autoPan: false,
      className: "hover-popup",
    })
      .setLatLng(event.latlng)
      .setContent(`
        <strong>${properties.address || "Address not available"}</strong><br>
        Official: ${formatMoney(properties.tax_year_assessed_value)}<br>
        Estimate: ${formatMoney(properties.current_assessed_value)}<br>
        ${modes[activeMode].label}: ${formatModeValue(value)}
      `)
      .openOn(map);
  });

  propertyTileLayer.on("mouseout", () => {
    if (hoverPopup) {
      map.closePopup(hoverPopup);
      hoverPopup = null;
    }
  });

  propertyTileLayer.on("click", (event) => {
    renderSelectedProperty(event.layer.properties);
  });

  propertyTileLayer.addTo(map);
  renderLegend();
}

function renderModeControls() {
  document.querySelectorAll(".mode-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === activeMode);
  });
  document.getElementById("modeLabel").textContent = modes[activeMode].description;
  renderLegend();

  if (propertyTileLayer) {
    renderTileLayer();
  }
}

function calculateGapValue(properties) {
  const official = Number(properties.tax_year_assessed_value);
  const estimate = Number(properties.current_assessed_value);

  if (
    !Number.isFinite(official) ||
    official < 10000 ||
    !Number.isFinite(estimate)
  ) {
    return null;
  }

  return estimate - official;
}

function calculateGapPercent(properties) {
  const official = Number(properties.tax_year_assessed_value);
  const gap = calculateGapValue(properties);

  if (!Number.isFinite(official) || official < 10000 || !Number.isFinite(gap)) {
    return null;
  }

  return (gap / official) * 100;
}

function renderSelectedProperty(properties) {
  document.getElementById("citywidePanel").hidden = true;
  document.getElementById("selectedPanel").hidden = false;
  document.getElementById("selectedAddress").textContent =
    properties.address || "Address not available";
  document.getElementById("selectedPropertyId").textContent =
    properties.property_id || "N/A";
  document.getElementById("selectedOfficialValue").textContent = formatMoney(
    properties.tax_year_assessed_value,
  );
  document.getElementById("selectedEstimateValue").textContent = formatMoney(
    properties.current_assessed_value,
  );
  document.getElementById("selectedGapValue").textContent =
    `${formatMoney(calculateGapValue(properties))} (${formatGapPercent(calculateGapPercent(properties))})`;
}

function clearSelection() {
  document.getElementById("citywidePanel").hidden = false;
  document.getElementById("selectedPanel").hidden = true;
}

function normalizeBinRows(rows) {
  return rows
    .map((row) => ({
      lowerBound: Number(row.lower_bound),
      upperBound: Number(row.upper_bound),
      propertyCount: Number(row.property_count),
    }))
    .filter(
      (row) =>
        Number.isFinite(row.lowerBound) &&
        Number.isFinite(row.upperBound) &&
        Number.isFinite(row.propertyCount),
    )
    .sort((left, right) => left.lowerBound - right.lowerBound);
}

function buildDisplayBins(rows) {
  const bins = [];

  for (let lowerBound = 0; lowerBound < MAIN_DISPLAY_MAX; lowerBound += MAIN_DISPLAY_BIN_SIZE) {
    bins.push({
      lowerBound,
      upperBound: lowerBound + MAIN_DISPLAY_BIN_SIZE,
      propertyCount: 0,
      label: lowerBound === 0 || lowerBound % 500000 === 0 ? formatCompactMoney(lowerBound) : "",
    });
  }

  bins.push({
    lowerBound: MAIN_DISPLAY_MAX,
    upperBound: null,
    propertyCount: 0,
    label: ">$2.5M",
  });

  rows.forEach((row) => {
    if (row.lowerBound >= MAIN_DISPLAY_MAX || row.upperBound > MAIN_DISPLAY_MAX) {
      bins[bins.length - 1].propertyCount += row.propertyCount;
      return;
    }

    const index = Math.floor(row.lowerBound / MAIN_DISPLAY_BIN_SIZE);
    if (bins[index]) {
      bins[index].propertyCount += row.propertyCount;
    }
  });

  return bins;
}

function renderDistributionChart(chartElementId, rows, chartRef) {
  const chartElement = document.getElementById(chartElementId);

  if (chartRef) {
    chartRef.destroy();
  }

  const chart = new window.ApexCharts(chartElement, {
    chart: {
      type: "bar",
      height: 220,
      toolbar: {
        show: false,
      },
    },
    series: [
      {
        name: "Properties",
        data: rows.map((row) => row.propertyCount),
      },
    ],
    colors: ["#1f5f99"],
    dataLabels: {
      enabled: false,
    },
    plotOptions: {
      bar: {
        columnWidth: "85%",
      },
    },
    grid: {
      borderColor: "#d9dde5",
      strokeDashArray: 3,
    },
    xaxis: {
      categories: rows.map((row) => row.label),
      labels: {
        rotate: 0,
        hideOverlappingLabels: true,
      },
    },
    yaxis: {
      labels: {
        formatter: (value) => formatNumber(value),
      },
    },
    tooltip: {
      y: {
        formatter: (value) => `${formatNumber(value)} properties`,
      },
    },
  });

  chart.render();
  return chart;
}

async function loadDistributionCharts() {
  if (!window.ApexCharts) {
    document.getElementById("officialChartHelper").textContent =
      "Chart library failed to load.";
    document.getElementById("modelChartHelper").textContent =
      "Chart library failed to load.";
    return;
  }

  const [officialResponse, modelResponse] = await Promise.all([
    fetch(TAX_YEAR_ASSESSMENT_BINS_URL),
    fetch(CURRENT_ASSESSMENT_BINS_URL),
  ]);

  if (!officialResponse.ok || !modelResponse.ok) {
    throw new Error("Unable to load one or more public distribution configs.");
  }

  const [officialPayload, modelPayload] = await Promise.all([
    officialResponse.json(),
    modelResponse.json(),
  ]);

  const taxYears = officialPayload
    .map((row) => Number(row.tax_year))
    .filter((taxYear) => Number.isFinite(taxYear));
  const latestTaxYear = Math.max(...taxYears);
  const latestOfficialRows = officialPayload.filter(
    (row) => Number(row.tax_year) === latestTaxYear,
  );

  officialChart = renderDistributionChart(
    "officialDistributionChart",
    buildDisplayBins(normalizeBinRows(latestOfficialRows)),
    officialChart,
  );
  modelChart = renderDistributionChart(
    "modelDistributionChart",
    buildDisplayBins(normalizeBinRows(modelPayload)),
    modelChart,
  );

  document.getElementById("officialChartHelper").textContent =
    `Latest tax year ${latestTaxYear}; values above $2.5M are grouped.`;
  document.getElementById("modelChartHelper").textContent =
    "Current model estimates; values above $2.5M are grouped.";
}

function renderMetadataSummary() {
  document.getElementById("recordCountText").textContent = formatNumber(
    metadata?.record_count,
  );
  document.getElementById("defaultFieldText").textContent =
    metadata?.default_style_field || "current_assessed_value";
}

async function initializeDashboard() {
  try {
    const metadataResponse = await fetch(MAP_STYLE_METADATA_URL);
    if (!metadataResponse.ok) {
      throw new Error("Unable to load map style metadata.");
    }

    metadata = await metadataResponse.json();
    renderMetadataSummary();
    renderTileLayer();
    await loadDistributionCharts();
    setStatus("");
  } catch (error) {
    setStatus(
      error instanceof Error
        ? error.message
        : "Unable to load public dashboard assets.",
    );
    metadata = metadata || {};
    renderMetadataSummary();
    renderTileLayer();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".mode-button").forEach((button) => {
    button.addEventListener("click", () => {
      activeMode = button.dataset.mode;
      renderModeControls();
    });
  });

  document.getElementById("clearSelectionBtn").addEventListener("click", clearSelection);
  initializeDashboard();
});
