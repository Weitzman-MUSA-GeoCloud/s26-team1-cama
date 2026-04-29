const SAMPLE_PROPERTIES = [
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

const TAX_YEAR_ASSESSMENT_BINS_URL =
  "https://storage.googleapis.com/musa5090s26-team1-public/configs/tax_year_assessment_bins.json";
const MAIN_DISPLAY_MAX = 2500000;
const MAIN_DISPLAY_BIN_SIZE = 100000;
const OVERFLOW_LABEL = ">$2.5M";
const RANGE_SEPARATOR = "-";

const DEFAULT_VIEW = {
  lat: 39.9526,
  lng: -75.1652,
  zoom: 12,
};

let map = null;
let marker = null;
let assessmentHistoryChart = null;
let latestAssessmentChart = null;

function formatMoney(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCompactCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value);
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

function setLookupMessage(message = "") {
  document.getElementById("lookupMessage").textContent = message;
}

function updateMap(property) {
  if (!map) {
    return;
  }

  map.setView([property.lat, property.lng], 15);

  if (marker) {
    map.removeLayer(marker);
  }

  marker = L.marker([property.lat, property.lng])
    .addTo(map)
    .bindPopup(`${property.address}<br>OPA ID: ${property.propertyId}`)
    .openPopup();
}

function renderSummary(property) {
  const latest = property.history[property.history.length - 1];

  document.getElementById("opaIdText").textContent = property.propertyId;
  document.getElementById("addressText").textContent = property.address;
  document.getElementById("currentValueText").textContent = formatMoney(
    latest.marketValue,
  );
  document.getElementById("taxYearText").textContent = latest.year;
  document.getElementById("neighborhoodText").textContent = property.neighborhood;
}

function renderAssessmentHistory(property) {
  const chartElement = document.getElementById("assessmentHistoryChart");

  if (assessmentHistoryChart) {
    assessmentHistoryChart.destroy();
  }

  assessmentHistoryChart = new window.ApexCharts(chartElement, {
    chart: {
      type: "bar",
      height: 300,
      width: "100%",
      parentHeightOffset: 0,
      toolbar: {
        show: false,
      },
    },
    series: [
      {
        name: "Assessed value",
        data: property.history.map((item) => Number(item.marketValue)),
      },
    ],
    colors: ["#0d3b66"],
    fill: {
      type: "solid",
      opacity: 1,
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: "58%",
      },
    },
    dataLabels: {
      enabled: false,
    },
    grid: {
      borderColor: "#e5e7eb",
      padding: {
        left: 10,
        right: 12,
        top: 6,
        bottom: 0,
      },
      strokeDashArray: 4,
    },
    xaxis: {
      categories: property.history.map((item) => item.year),
      title: {
        text: "Tax year",
      },
      labels: {
        rotate: -45,
        rotateAlways: false,
        trim: false,
        hideOverlappingLabels: false,
        style: {
          fontSize: "11px",
        },
      },
    },
    yaxis: {
      title: {
        text: "Assessed value",
      },
      labels: {
        minWidth: 72,
        formatter: (value) => formatCompactCurrency(value),
      },
    },
    tooltip: {
      x: {
        formatter: (_value, { dataPointIndex }) =>
          `Tax year ${property.history[dataPointIndex].year}`,
      },
      y: {
        formatter: (value) => formatMoney(value),
        title: {
          formatter: () => "Assessed value:",
        },
      },
    },
    responsive: [
      {
        breakpoint: 760,
        options: {
          chart: {
            height: 320,
          },
          plotOptions: {
            bar: {
              columnWidth: "66%",
            },
          },
        },
      },
    ],
  });

  assessmentHistoryChart.render();
}

function renderProperty(property) {
  renderSummary(property);
  renderAssessmentHistory(property);
  updateMap(property);
}

function lookupProperty() {
  const opaId = document.getElementById("opaIdInput").value.trim();
  const property = SAMPLE_PROPERTIES.find((item) => item.propertyId === opaId);

  if (!property) {
    setLookupMessage("OPA ID not found in sample data. Try 502244720.");
    return;
  }

  setLookupMessage("");
  renderProperty(property);
}

function setChartError(message = "") {
  const errorElement = document.getElementById("latest-assessment-chart-error");
  errorElement.textContent = message;
  errorElement.style.display = message ? "block" : "none";
}

function setChartHelperText(message) {
  document.getElementById("latest-assessment-chart-helper").textContent = message;
}

function destroyLatestAssessmentChart() {
  if (latestAssessmentChart) {
    latestAssessmentChart.destroy();
    latestAssessmentChart = null;
  }
}

function buildDisplayBins(rows) {
  const bins = [];
  let lowerBound = 0;

  while (lowerBound < MAIN_DISPLAY_MAX) {
    bins.push({
      lowerBound,
      upperBound: lowerBound + MAIN_DISPLAY_BIN_SIZE,
      propertyCount: 0,
      label: "",
      tooltipLabel: "",
      isOverflow: false,
    });
    lowerBound += MAIN_DISPLAY_BIN_SIZE;
  }

  bins.push({
    lowerBound: MAIN_DISPLAY_MAX,
    upperBound: null,
    propertyCount: 0,
    label: OVERFLOW_LABEL,
    tooltipLabel: `>${formatMoney(MAIN_DISPLAY_MAX)}`,
    isOverflow: true,
  });

  for (const row of rows) {
    if (row.lowerBound >= MAIN_DISPLAY_MAX || row.upperBound > MAIN_DISPLAY_MAX) {
      bins[bins.length - 1].propertyCount += row.propertyCount;
      continue;
    }

    const index = Math.floor(row.lowerBound / MAIN_DISPLAY_BIN_SIZE);
    if (bins[index]) {
      bins[index].propertyCount += row.propertyCount;
    }
  }

  for (const bin of bins) {
    if (bin.isOverflow) {
      continue;
    }

    bin.tooltipLabel = `${formatMoney(bin.lowerBound)} ${RANGE_SEPARATOR} ${formatMoney(bin.upperBound - 1)}`;

    if (bin.lowerBound === 0) {
      bin.label = "$0";
    } else if (bin.lowerBound % 500000 === 0) {
      bin.label = formatCompactCurrency(bin.lowerBound);
    } else {
      bin.label = "";
    }
  }

  return bins;
}

function renderLatestAssessmentChart(rows, latestTaxYear) {
  const chartElement = document.getElementById("latest-assessment-chart");
  const categories = rows.map((row) => row.label);
  const seriesData = rows.map((row) => ({
    x: row.label,
    y: row.propertyCount,
  }));

  destroyLatestAssessmentChart();
  setChartError("");
  setChartHelperText(
    `Latest tax year (${latestTaxYear}) distribution. Main range shown up to $2.5M; higher values grouped into an overflow bin.`,
  );

  latestAssessmentChart = new window.ApexCharts(chartElement, {
    chart: {
      type: "bar",
      height: 340,
      toolbar: {
        show: false,
      },
      animations: {
        easing: "easeinout",
        speed: 350,
      },
    },
    series: [
      {
        name: "Properties",
        data: seriesData,
      },
    ],
    colors: ["#0d3b66"],
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: "86%",
      },
    },
    dataLabels: {
      enabled: false,
    },
    legend: {
      show: false,
    },
    grid: {
      borderColor: "#e5e7eb",
      strokeDashArray: 4,
    },
    xaxis: {
      categories,
      tickPlacement: "between",
      labels: {
        rotate: 0,
        trim: false,
        hideOverlappingLabels: true,
      },
      title: {
        text: "Assessed value range",
      },
    },
    yaxis: {
      title: {
        text: "Property count",
      },
      labels: {
        formatter: (value) => formatNumber(Math.round(value)),
      },
    },
    tooltip: {
      x: {
        formatter: (_value, { dataPointIndex }) => rows[dataPointIndex].tooltipLabel,
      },
      y: {
        formatter: (value) => `${formatNumber(value)} properties`,
      },
    },
  });

  latestAssessmentChart.render();
}

async function loadLatestAssessmentChart() {
  try {
    setChartError("");
    setChartHelperText("Loading citywide assessment distribution...");

    if (!window.ApexCharts) {
      throw new Error("Assessment chart library failed to load.");
    }

    const response = await fetch(TAX_YEAR_ASSESSMENT_BINS_URL);
    if (!response.ok) {
      throw new Error(`Unable to load assessment chart data (${response.status}).`);
    }

    const payload = await response.json();
    if (!Array.isArray(payload) || payload.length === 0) {
      destroyLatestAssessmentChart();
      setChartError("No assessment distribution data is available right now.");
      return;
    }

    const taxYears = payload
      .map((row) => Number(row.tax_year))
      .filter((taxYear) => Number.isFinite(taxYear));

    if (taxYears.length === 0) {
      destroyLatestAssessmentChart();
      setChartError("Assessment distribution data is missing tax year values.");
      return;
    }

    const latestTaxYear = Math.max(...taxYears);
    const latestRows = payload
      .filter((row) => Number(row.tax_year) === latestTaxYear)
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

    if (latestRows.length === 0) {
      destroyLatestAssessmentChart();
      setChartError(
        `No assessment distribution bins were found for tax year ${latestTaxYear}.`,
      );
      return;
    }

    renderLatestAssessmentChart(buildDisplayBins(latestRows), latestTaxYear);
  } catch (error) {
    destroyLatestAssessmentChart();
    setChartError(
      error instanceof Error
        ? error.message
        : "Unable to load the latest assessment distribution chart.",
    );
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const sampleProperty = SAMPLE_PROPERTIES[0];

  initializeMap();
  renderProperty(sampleProperty);
  loadLatestAssessmentChart();

  document.getElementById("opaIdInput").value = sampleProperty.propertyId;
  document.getElementById("searchBtn").addEventListener("click", lookupProperty);
  document.getElementById("opaIdInput").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      lookupProperty();
    }
  });
});
