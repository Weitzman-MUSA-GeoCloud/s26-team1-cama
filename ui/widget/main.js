const propertyData = {
  address: "123 Market St",
  value: "$320,000",
  change: "+14%",
  neighborhood: "Center City",
  explanation:
    "This property's assessed value increased in line with recent neighborhood trends. The change may reflect surrounding market activity and comparable residential values.",
  lat: 39.9526,
  lng: -75.1652,
};

const TAX_YEAR_ASSESSMENT_BINS_URL =
  "https://storage.googleapis.com/musa5090s26-team1-public/configs/tax_year_assessment_bins.json";
const MAIN_DISPLAY_MAX = 2500000;
const MAIN_DISPLAY_BIN_SIZE = 100000;
const OVERFLOW_LABEL = ">$2.5M";
const RANGE_SEPARATOR = "\u2013";

let latestAssessmentChart = null;

function formatCurrency(value) {
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

function setChartError(message = "") {
  const errorElement = document.getElementById("latest-assessment-chart-error");
  errorElement.textContent = message;
  errorElement.style.display = message ? "block" : "none";
}

function setChartHelperText(message) {
  const helperElement = document.getElementById("latest-assessment-chart-helper");
  helperElement.textContent = message;
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
      lower_bound: lowerBound,
      upper_bound: lowerBound + MAIN_DISPLAY_BIN_SIZE,
      property_count: 0,
      label: "",
      tooltip_label: "",
      is_overflow: false,
    });
    lowerBound += MAIN_DISPLAY_BIN_SIZE;
  }

  bins.push({
    lower_bound: MAIN_DISPLAY_MAX,
    upper_bound: null,
    property_count: 0,
    label: OVERFLOW_LABEL,
    tooltip_label: `>${formatCurrency(MAIN_DISPLAY_MAX)}`,
    is_overflow: true,
  });

  for (const row of rows) {
    if (row.lower_bound >= MAIN_DISPLAY_MAX || row.upper_bound > MAIN_DISPLAY_MAX) {
      bins[bins.length - 1].property_count += row.property_count;
      continue;
    }

    const index = Math.floor(row.lower_bound / MAIN_DISPLAY_BIN_SIZE);
    if (bins[index]) {
      bins[index].property_count += row.property_count;
    }
  }

  for (const bin of bins) {
    if (bin.is_overflow) {
      continue;
    }

    bin.tooltip_label = `${formatCurrency(bin.lower_bound)} ${RANGE_SEPARATOR} ${formatCurrency(bin.upper_bound - 1)}`;

    if (bin.lower_bound === 0) {
      bin.label = "$0";
    } else if (bin.lower_bound % 500000 === 0) {
      bin.label = formatCompactCurrency(bin.lower_bound);
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
    y: row.property_count,
  }));

  destroyLatestAssessmentChart();
  setChartError("");
  setChartHelperText(
    `Latest assessment year (${latestTaxYear}) distribution. Main range shown up to $2.5M; higher values grouped into an overflow bin.`,
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
    colors: ["#A64E30"],
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
      axisBorder: {
        color: "#cfd4dc",
      },
      axisTicks: {
        color: "#cfd4dc",
      },
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
        formatter: (_value, { dataPointIndex }) => rows[dataPointIndex].tooltip_label,
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
    setChartHelperText(
      "Distribution of assessed property values for the latest assessment year",
    );

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
        lower_bound: Number(row.lower_bound),
        upper_bound: Number(row.upper_bound),
        property_count: Number(row.property_count),
      }))
      .filter(
        (row) =>
          Number.isFinite(row.lower_bound) &&
          Number.isFinite(row.upper_bound) &&
          Number.isFinite(row.property_count),
      )
      .sort((left, right) => left.lower_bound - right.lower_bound);

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
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

L.marker([propertyData.lat, propertyData.lng])
  .addTo(map)
  .bindPopup("123 Market St")
  .openPopup();

loadLatestAssessmentChart();
