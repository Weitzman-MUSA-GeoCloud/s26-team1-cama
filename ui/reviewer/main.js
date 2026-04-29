const PUBLIC_BASE_URL =
  "https://storage.googleapis.com/musa5090s26-team1-public";
const MAP_STYLE_METADATA_URL = `${PUBLIC_BASE_URL}/configs/map_style_metadata.json`;
const TAX_YEAR_ASSESSMENT_BINS_URL = `${PUBLIC_BASE_URL}/configs/tax_year_assessment_bins.json`;
const CURRENT_ASSESSMENT_BINS_URL = `${PUBLIC_BASE_URL}/configs/current_assessment_bins.json`;
const ZIP_ASSESSMENT_CONTEXT_URL = `${PUBLIC_BASE_URL}/configs/zip_assessment_context.json`;
const PROPERTY_LOOKUP_API_URL =
  window.PROPERTY_LOOKUP_API_URL ||
  new URLSearchParams(window.location.search).get("lookup_api_url") ||
  "https://property-assessment-lookup-bl43esqwsa-uk.a.run.app";

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
let zipContext = null;
let activeMode = "official";
let activeGeography = "citywide";
let propertyTileLayer = null;
let hoverPopup = null;
let officialChart = null;
let modelChart = null;
let selectedHistoryChart = null;
let legendControl = null;
let citywideOfficialRows = [];
let citywideModelRows = [];
let selectedProperties = null;
let selectedLookupPayload = null;

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

function formatPercentile(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "-";
  }

  const rounded = Math.round(number);
  const suffix =
    rounded % 100 >= 11 && rounded % 100 <= 13
      ? "th"
      : { 1: "st", 2: "nd", 3: "rd" }[rounded % 10] || "th";

  return `${rounded}${suffix}`;
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

function styleFeature(properties) {
  const value = getTilePropertyValue(properties);
  const outsideSelectedZip =
    activeGeography !== "citywide" && properties.zip_code !== activeGeography;
  const gapUnavailable = activeMode === "gap" && !Number.isFinite(Number(value));

  return {
    fill: true,
    fillColor: outsideSelectedZip ? "#d9dde5" : getColor(value),
    fillOpacity: outsideSelectedZip || gapUnavailable ? 0.2 : 0.72,
    color: "#ffffff",
    opacity: outsideSelectedZip ? 0.1 : 0.35,
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
        ZIP: ${properties.zip_code || "N/A"}<br>
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
    const properties = event.layer.properties;

    if (activeGeography !== "citywide" && properties.zip_code !== activeGeography) {
      setStatus(`That property is outside ZIP ${activeGeography}.`);
      return;
    }

    renderSelectedProperty(properties);
  });

  propertyTileLayer.addTo(map);
  renderLegend();
}

function normalizeBinRows(rows) {
  return rows
    .map((row) => ({
      lowerBound: Number(row.lower_bound),
      upperBound: row.upper_bound === null ? null : Number(row.upper_bound),
      propertyCount: Number(row.property_count),
    }))
    .filter(
      (row) =>
        Number.isFinite(row.lowerBound) && Number.isFinite(row.propertyCount),
    )
    .sort((left, right) => left.lowerBound - right.lowerBound);
}

function buildDisplayBins(rows) {
  const bins = [];

  for (
    let lowerBound = 0;
    lowerBound < MAIN_DISPLAY_MAX;
    lowerBound += MAIN_DISPLAY_BIN_SIZE
  ) {
    bins.push({
      lowerBound,
      upperBound: lowerBound + MAIN_DISPLAY_BIN_SIZE,
      propertyCount: 0,
      category: `${formatCompactMoney(lowerBound)} to ${formatCompactMoney(
        lowerBound + MAIN_DISPLAY_BIN_SIZE,
      )}`,
      label:
        lowerBound === 0 || lowerBound % 500000 === 0
          ? formatCompactMoney(lowerBound)
          : "",
    });
  }

  bins.push({
    lowerBound: MAIN_DISPLAY_MAX,
    upperBound: null,
    propertyCount: 0,
    category: ">$2.5M",
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

function getMarkerCategory(rows, selectedValue) {
  const value = Number(selectedValue);

  if (!Number.isFinite(value)) {
    return null;
  }

  const match = rows.find(
    (row) =>
      value >= row.lowerBound &&
      (row.upperBound === null || value < row.upperBound),
  );

  return match?.category || null;
}

function computeMedianFromBins(rows) {
  const total = rows.reduce((sum, row) => sum + row.propertyCount, 0);
  let cumulative = 0;

  if (total === 0) {
    return null;
  }

  for (const row of rows) {
    cumulative += row.propertyCount;
    if (cumulative >= total / 2) {
      return row.lowerBound + MAIN_DISPLAY_BIN_SIZE / 2;
    }
  }

  return null;
}

function getAreaData() {
  if (activeGeography !== "citywide") {
    const area = zipContext?.areas?.[activeGeography];

    return {
      label: area?.label || `ZIP ${activeGeography}`,
      recordCount: area?.record_count,
      officialMedian: area?.official?.approx_median,
      modelMedian: area?.model?.approx_median,
      officialRows: normalizeBinRows(area?.official?.bins || []),
      modelRows: normalizeBinRows(area?.model?.bins || []),
    };
  }

  return {
    label: "Citywide",
    recordCount: metadata?.record_count,
    officialMedian: computeMedianFromBins(citywideOfficialRows),
    modelMedian: computeMedianFromBins(citywideModelRows),
    officialRows: citywideOfficialRows,
    modelRows: citywideModelRows,
  };
}

function renderDistributionChart(chartElementId, rows, chartRef, selectedValue) {
  const chartElement = document.getElementById(chartElementId);
  const displayRows = buildDisplayBins(rows);
  const markerCategory = getMarkerCategory(displayRows, selectedValue);
  const labelByCategory = Object.fromEntries(
    displayRows.map((row) => [row.category, row.label]),
  );

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
    annotations: {
      xaxis: markerCategory
        ? [
            {
              x: markerCategory,
              borderColor: "#0f2438",
              label: {
                text: "Selected",
                style: {
                  background: "#0f2438",
                  color: "#ffffff",
                },
              },
            },
          ]
        : [],
    },
    series: [
      {
        name: "Properties",
        data: displayRows.map((row) => row.propertyCount),
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
      categories: displayRows.map((row) => row.category),
      labels: {
        rotate: 0,
        hideOverlappingLabels: true,
        formatter: (value) => labelByCategory[value] || "",
      },
    },
    yaxis: {
      labels: {
        formatter: (value) => formatNumber(value),
      },
    },
    tooltip: {
      x: {
        formatter: (value) => value,
      },
      y: {
        formatter: (value) => `${formatNumber(value)} properties`,
      },
    },
  });

  chart.render();
  return chart;
}

function updateSummary() {
  const area = getAreaData();

  document.getElementById("geographyText").textContent = area.label;
  document.getElementById("recordCountText").textContent = formatNumber(
    area.recordCount,
  );
  document.getElementById("medianOfficialText").textContent = formatMoney(
    area.officialMedian,
  );
  document.getElementById("medianModelText").textContent = formatMoney(
    area.modelMedian,
  );
  document.getElementById("mapModeText").textContent = modes[activeMode].label;
  document.getElementById("modeLabel").textContent = modes[activeMode].description;
}

function updateCharts() {
  if (!window.ApexCharts) {
    document.getElementById("officialChartHelper").textContent =
      "Chart library failed to load.";
    document.getElementById("modelChartHelper").textContent =
      "Chart library failed to load.";
    return;
  }

  const area = getAreaData();
  officialChart = renderDistributionChart(
    "officialDistributionChart",
    area.officialRows,
    officialChart,
    selectedProperties?.tax_year_assessed_value,
  );
  modelChart = renderDistributionChart(
    "modelDistributionChart",
    area.modelRows,
    modelChart,
    selectedProperties?.current_assessed_value,
  );

  document.getElementById("officialChartHelper").textContent =
    `${area.label}; values above $2.5M are grouped.`;
  document.getElementById("modelChartHelper").textContent =
    `${area.label}; values above $2.5M are grouped.`;
}

function populateGeographySelect() {
  const select = document.getElementById("geographySelect");
  const zipCodes = Object.keys(zipContext?.areas || {}).sort();

  zipCodes.forEach((zipCode) => {
    const option = document.createElement("option");
    option.value = zipCode;
    option.textContent = `ZIP ${zipCode}`;
    select.appendChild(option);
  });
}

function renderModeControls() {
  document.querySelectorAll(".mode-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === activeMode);
  });
  updateSummary();
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

function destroySelectedHistoryChart() {
  if (selectedHistoryChart) {
    selectedHistoryChart.destroy();
    selectedHistoryChart = null;
  }
}

function renderSelectedHistory(history) {
  const helper = document.getElementById("selectedHistoryHelper");
  const chartElement = document.getElementById("selectedHistoryChart");
  destroySelectedHistoryChart();

  if (!Array.isArray(history) || history.length === 0 || !window.ApexCharts) {
    helper.textContent = "Assessment history unavailable.";
    chartElement.innerHTML = "";
    return;
  }

  helper.textContent = "Official assessed values by tax year.";
  chartElement.innerHTML = "";

  selectedHistoryChart = new window.ApexCharts(chartElement, {
    chart: {
      type: "line",
      height: 180,
      toolbar: {
        show: false,
      },
    },
    series: [
      {
        name: "Official assessed value",
        data: history.map((item) => Number(item.assessed_value)),
      },
    ],
    colors: ["#1f5f99"],
    stroke: {
      width: 3,
    },
    markers: {
      size: 3,
    },
    xaxis: {
      categories: history.map((item) => String(item.tax_year)),
    },
    yaxis: {
      labels: {
        formatter: (value) => formatCompactMoney(value),
      },
    },
    tooltip: {
      y: {
        formatter: (value) => formatMoney(value),
      },
    },
  });

  selectedHistoryChart.render();
}

async function loadSelectedLookup(propertyId) {
  try {
    const url = new URL(PROPERTY_LOOKUP_API_URL, window.location.origin);
    url.searchParams.set("property_id", propertyId);

    const response = await fetch(url);
    const payload = await response.json();

    if (!response.ok || !payload.ok) {
      throw new Error(payload.error || "Assessment history unavailable.");
    }

    selectedLookupPayload = payload;
    renderSelectedPercentiles();
    renderSelectedHistory(payload.history || []);
  } catch (error) {
    selectedLookupPayload = null;
    renderSelectedPercentiles();
    renderSelectedHistory([]);
  }
}

function renderSelectedPercentiles() {
  const citywide = selectedLookupPayload?.context?.citywide || {};
  const zip = selectedLookupPayload?.context?.zip || {};

  document.getElementById("selectedOfficialCitywidePercentile").textContent =
    formatPercentile(citywide.official_percentile);
  document.getElementById("selectedOfficialZipPercentile").textContent =
    formatPercentile(zip.official_percentile);
  document.getElementById("selectedModelCitywidePercentile").textContent =
    formatPercentile(citywide.model_percentile);
  document.getElementById("selectedModelZipPercentile").textContent =
    formatPercentile(zip.model_percentile);
}

function renderSelectedProperty(properties) {
  selectedProperties = properties;
  selectedLookupPayload = null;
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
  document.getElementById("selectedHistoryHelper").textContent =
    "Loading assessment history...";
  document.getElementById("selectedHistoryChart").innerHTML = "";
  renderSelectedPercentiles();
  updateCharts();
  loadSelectedLookup(properties.property_id);
}

function clearSelection() {
  selectedProperties = null;
  selectedLookupPayload = null;
  destroySelectedHistoryChart();
  document.getElementById("citywidePanel").hidden = false;
  document.getElementById("selectedPanel").hidden = true;
  updateCharts();
}

async function loadDistributionInputs() {
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
  citywideOfficialRows = normalizeBinRows(
    officialPayload.filter((row) => Number(row.tax_year) === latestTaxYear),
  );
  citywideModelRows = normalizeBinRows(modelPayload);
}

async function initializeDashboard() {
  try {
    const [metadataResponse, zipResponse] = await Promise.all([
      fetch(MAP_STYLE_METADATA_URL),
      fetch(ZIP_ASSESSMENT_CONTEXT_URL),
    ]);

    if (!metadataResponse.ok || !zipResponse.ok) {
      throw new Error("Unable to load public dashboard assets.");
    }

    metadata = await metadataResponse.json();
    zipContext = await zipResponse.json();
    await loadDistributionInputs();
    populateGeographySelect();
    updateSummary();
    updateCharts();
    renderTileLayer();
    setStatus("");
  } catch (error) {
    setStatus(
      error instanceof Error
        ? error.message
        : "Unable to load public dashboard assets.",
    );
    metadata = metadata || {};
    zipContext = zipContext || { areas: {} };
    updateSummary();
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

  document.getElementById("geographySelect").addEventListener("change", (event) => {
    activeGeography = event.target.value;
    if (
      selectedProperties &&
      activeGeography !== "citywide" &&
      selectedProperties.zip_code !== activeGeography
    ) {
      clearSelection();
    }
    updateSummary();
    updateCharts();
    renderTileLayer();
  });

  document.getElementById("clearSelectionBtn").addEventListener("click", clearSelection);
  initializeDashboard();
});
