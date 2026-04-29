const PROPERTY_LOOKUP_API_URL =
  window.PROPERTY_LOOKUP_API_URL ||
  new URLSearchParams(window.location.search).get("lookup_api_url") ||
  "https://property-assessment-lookup-bl43esqwsa-uk.a.run.app";

let assessmentHistoryChart = null;

function formatMoney(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "Not available";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(number);
}

function formatCompactCurrency(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "-";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(number);
}

function formatPercent(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "Not available";
  }

  return new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(number);
}

function formatPercentile(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return null;
  }

  const rounded = Math.round(number);
  const suffix =
    rounded % 100 >= 11 && rounded % 100 <= 13
      ? "th"
      : { 1: "st", 2: "nd", 3: "rd" }[rounded % 10] || "th";

  return `${rounded}${suffix}`;
}

function setLookupMessage(message = "", type = "neutral") {
  const messageElement = document.getElementById("lookupMessage");
  messageElement.textContent = message;
  messageElement.dataset.type = type;
}

function setLoading(isLoading) {
  const button = document.getElementById("searchBtn");
  const input = document.getElementById("opaIdInput");

  button.disabled = isLoading;
  input.disabled = isLoading;
  button.textContent = isLoading ? "Looking up..." : "Look up";
}

function showEmptyState() {
  document.getElementById("emptyState").hidden = false;
  document.getElementById("resultPanel").hidden = true;
}

function showResultState() {
  document.getElementById("emptyState").hidden = true;
  document.getElementById("resultPanel").hidden = false;
}

function formatOfficialChange(official) {
  if (
    official.prior_tax_year === null ||
    official.prior_tax_year === undefined ||
    official.prior_assessed_value === null ||
    official.prior_assessed_value === undefined ||
    official.change_pct === null ||
    official.change_pct === undefined
  ) {
    return {
      className: "change-neutral",
      text: "Prior-year comparison is not available.",
    };
  }

  const prior = formatMoney(official.prior_assessed_value);
  const changePct = Number(official.change_pct);

  if (changePct === 0) {
    return {
      className: "change-neutral",
      text: `— No change from Tax Year ${official.prior_tax_year} (${prior}).`,
    };
  }

  const direction = changePct > 0 ? "increase" : "decrease";
  const symbol = changePct > 0 ? "▲" : "▼";
  const className = changePct > 0 ? "change-positive" : "change-negative";

  return {
    className,
    text: `${symbol} ${formatPercent(Math.abs(changePct))} ${direction} from Tax Year ${official.prior_tax_year} (${prior}).`,
  };
}

function formatEstimateGap(estimate) {
  if (
    estimate.gap_value === null ||
    estimate.gap_value === undefined ||
    estimate.gap_pct === null ||
    estimate.gap_pct === undefined
  ) {
    return "Comparison with the official value is not available.";
  }

  const direction = estimate.gap_value >= 0 ? "above" : "below";
  return `${formatMoney(Math.abs(estimate.gap_value))} ${direction} the current official assessed value (${formatPercent(Math.abs(estimate.gap_pct))}).`;
}

function destroyHistoryChart() {
  if (assessmentHistoryChart) {
    assessmentHistoryChart.destroy();
    assessmentHistoryChart = null;
  }
}

function renderHistoryChart(history) {
  const chartElement = document.getElementById("assessmentHistoryChart");
  destroyHistoryChart();

  if (!window.ApexCharts) {
    chartElement.textContent = "Assessment history chart library failed to load.";
    return;
  }

  if (!Array.isArray(history) || history.length === 0) {
    chartElement.textContent = "No official assessment history is available.";
    return;
  }

  chartElement.textContent = "";

  assessmentHistoryChart = new window.ApexCharts(chartElement, {
    chart: {
      type: "line",
      height: 300,
      width: "100%",
      parentHeightOffset: 0,
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
      curve: "straight",
    },
    markers: {
      size: 4,
    },
    plotOptions: {
      bar: {
        borderRadius: 3,
        columnWidth: "58%",
      },
    },
    dataLabels: {
      enabled: false,
    },
    grid: {
      borderColor: "#d9dde5",
      strokeDashArray: 3,
      padding: {
        left: 10,
        right: 12,
        top: 8,
        bottom: 0,
      },
    },
    xaxis: {
      categories: history.map((item) => String(item.tax_year)),
      title: {
        text: "Tax year",
      },
      labels: {
        rotate: -45,
        trim: false,
        style: {
          fontSize: "11px",
        },
      },
    },
    yaxis: {
      title: {
        text: "Official assessed value",
      },
      labels: {
        minWidth: 72,
        formatter: (value) => formatCompactCurrency(value),
      },
    },
    tooltip: {
      x: {
        formatter: (_value, { dataPointIndex }) =>
          `Tax Year ${history[dataPointIndex].tax_year}`,
      },
      y: {
        formatter: (value) => formatMoney(value),
      },
    },
  });

  assessmentHistoryChart.render();
}

function renderProperty(payload) {
  const property = payload.property || {};
  const official = payload.official || {};
  const estimate = payload.estimate || {};
  const context = payload.context || {};
  const citywideOfficialPercentile = formatPercentile(
    context.citywide?.official_percentile,
  );
  const zipOfficialPercentile = formatPercentile(
    context.zip?.official_percentile,
  );

  document.getElementById("property-heading").textContent =
    property.address || "Address not available";
  document.getElementById("propertyIdText").textContent =
    property.property_id || "Not available";
  document.getElementById("propertyTypeText").textContent =
    property.property_type || "Not available";

  document.getElementById("officialValueText").textContent = formatMoney(
    official.latest_assessed_value,
  );
  document.getElementById("officialYearText").textContent =
    official.latest_tax_year !== null && official.latest_tax_year !== undefined
      ? `Tax Year ${official.latest_tax_year}`
      : "Tax Year not available";
  const officialChange = formatOfficialChange(official);
  const officialChangeElement = document.getElementById("officialChangeText");
  officialChangeElement.className = `change-text ${officialChange.className}`;
  officialChangeElement.textContent = officialChange.text;

  document.getElementById("contextCard").hidden =
    !citywideOfficialPercentile && !zipOfficialPercentile;
  document.getElementById("citywideContextRow").hidden =
    !citywideOfficialPercentile;
  document.getElementById("zipContextRow").hidden =
    !zipOfficialPercentile || !context.zip;
  document.getElementById("citywideContextValue").textContent =
    citywideOfficialPercentile || "-";
  document.getElementById("zipContextValue").textContent =
    zipOfficialPercentile || "-";
  document.getElementById("zipContextHelper").textContent = context.zip
    ? `in ${context.zip.label}`
    : "";

  document.getElementById("estimateValueText").textContent = formatMoney(
    estimate.estimated_current_market_value,
  );
  document.getElementById("estimateGapText").textContent =
    formatEstimateGap(estimate);

  const estimatedAt = estimate.predicted_at
    ? ` Estimate generated ${new Date(estimate.predicted_at).toLocaleDateString()}.`
    : "";
  document.getElementById("sourceNoteText").textContent =
    `Sources: Philadelphia OPA assessment records and CAMA model output.${estimatedAt}`;

  renderHistoryChart(payload.history || []);
  showResultState();
}

async function lookupProperty() {
  const propertyId = document.getElementById("opaIdInput").value.trim();

  if (!propertyId) {
    setLookupMessage("Enter an OPA ID or property ID to continue.", "error");
    return;
  }

  setLoading(true);
  setLookupMessage("Looking up property record...", "neutral");

  try {
    const url = new URL(PROPERTY_LOOKUP_API_URL, window.location.origin);
    url.searchParams.set("property_id", propertyId);

    const response = await fetch(url);
    const payload = await response.json();

    if (!response.ok || !payload.ok) {
      destroyHistoryChart();
      showEmptyState();
      setLookupMessage(payload.error || "Property lookup failed.", "error");
      return;
    }

    renderProperty(payload);
    setLookupMessage("Property record loaded.", "success");
  } catch (error) {
    destroyHistoryChart();
    showEmptyState();
    setLookupMessage(
      error instanceof Error
        ? error.message
        : "Unable to load the property record right now.",
      "error",
    );
  } finally {
    setLoading(false);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  showEmptyState();

  document.getElementById("searchBtn").addEventListener("click", lookupProperty);
  document.getElementById("opaIdInput").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      lookupProperty();
    }
  });
});
