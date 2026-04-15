const TAX_YEAR_BINS_URL =
  "https://storage.googleapis.com/musa5090s26-team1-public/configs/tax_year_assessment_bins.json";

const searchBtn = document.querySelector("#search-btn");
const addressInput = document.querySelector("#address-input");
const propertyAddress = document.querySelector("#property-address");
const marketValue = document.querySelector("#market-value");
const valueChange = document.querySelector("#value-change");
const neighborhood = document.querySelector("#neighborhood");

let latestAssessmentChart = null;

function formatCurrency(value) {
  return `$${Number(value).toLocaleString()}`;
}

function updateMockPropertySummary() {
  const typedAddress = addressInput?.value?.trim();
  propertyAddress.textContent = typedAddress || "1234 Market St, Philadelphia, PA";
  marketValue.textContent = "$425,000";
  valueChange.textContent = "+8.4%";
  neighborhood.textContent = "Center City";
}

function initSearch() {
  if (!searchBtn) return;

  searchBtn.addEventListener("click", () => {
    updateMockPropertySummary();
  });
}

function initMap() {
  const mapContainer = document.querySelector("#map");
  if (!mapContainer) return;

  const map = L.map("map").setView([39.9526, -75.1652], 12);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

  L.marker([39.9526, -75.1652])
    .addTo(map)
    .bindPopup("Sample parcel location")
    .openPopup();
}

async function loadTaxYearAssessmentBins() {
  const response = await fetch(TAX_YEAR_BINS_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch tax year bins: ${response.status}`);
  }
  return await response.json();
}

function getMostRecentTaxYear(data) {
  return Math.max(...data.map((d) => Number(d.tax_year)));
}

function filterLatestYearData(data) {
  const mostRecentYear = getMostRecentTaxYear(data);

  return data
    .filter((d) => Number(d.tax_year) === mostRecentYear)
    .sort((a, b) => Number(a.lower_bound) - Number(b.lower_bound));
}

function buildChartSeries(data) {
  return data.map((d) => ({
    x: Number(d.lower_bound),
    y: Number(d.property_count),
  }));
}

function renderLatestAssessmentChart(data) {
  const chartContainer = document.querySelector("#latest-assessment-chart");
  if (!chartContainer) return;

  const seriesData = buildChartSeries(data);

  if (latestAssessmentChart) {
    latestAssessmentChart.destroy();
  }

  latestAssessmentChart = new ApexCharts(chartContainer, {
    chart: {
      type: "bar",
      height: 420,
      toolbar: {
        show: false,
      },
    },
    series: [
      {
        name: "Properties",
        data: seriesData,
      },
    ],
    plotOptions: {
      bar: {
        columnWidth: "85%",
      },
    },
    dataLabels: {
      enabled: false,
    },
    title: {
      text: "Most Recent Assessment Year Distribution",
      align: "left",
    },
    xaxis: {
      type: "numeric",
      title: {
        text: "Assessment Value Lower Bound",
      },
      labels: {
        formatter(value) {
          return formatCurrency(value);
        },
      },
    },
    yaxis: {
      title: {
        text: "Number of Properties",
      },
      labels: {
        formatter(value) {
          return Number(value).toLocaleString();
        },
      },
    },
    tooltip: {
      x: {
        formatter(value) {
          return formatCurrency(value);
        },
      },
      y: {
        formatter(value) {
          return `${Number(value).toLocaleString()} properties`;
        },
      },
    },
  });

  latestAssessmentChart.render();
}

async function initLatestAssessmentChart() {
  try {
    const rawData = await loadTaxYearAssessmentBins();
    const latestYearData = filterLatestYearData(rawData);
    renderLatestAssessmentChart(latestYearData);
  } catch (error) {
    console.error("Error loading latest assessment chart:", error);

    const chartContainer = document.querySelector("#latest-assessment-chart");
    if (chartContainer) {
      chartContainer.innerHTML =
        '<p class="chart-error">Failed to load assessment distribution data.</p>';
    }
  }
}

function initApp() {
  initSearch();
  initMap();
  initLatestAssessmentChart();
}

initApp();
