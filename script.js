const regionSelect = document.querySelector("#regionSelect");
const provinceSelect = document.querySelector("#provinceSelect");
const marketSelect = document.querySelector("#marketSelect");
const generateInsight = document.querySelector("#generateInsight");
const categoryChart = document.querySelector("#categoryChart");
const provinceChart = document.querySelector("#provinceChart");

const fields = {
  itemsSold: document.querySelector("#itemsSold"),
  kwhSaved: document.querySelector("#kwhSaved"),
  co2Saved: document.querySelector("#co2Saved"),
  homeDays: document.querySelector("#homeDays"),
  treesEquivalent: document.querySelector("#treesEquivalent"),
  reuseRate: document.querySelector("#reuseRate"),
  itemsProgress: document.querySelector("#itemsProgress"),
  kwhProgress: document.querySelector("#kwhProgress"),
  co2Progress: document.querySelector("#co2Progress"),
  reuseProgress: document.querySelector("#reuseProgress"),
  storeName: document.querySelector("#storeName"),
  storeCity: document.querySelector("#storeCity"),
  storeAddress: document.querySelector("#storeAddress"),
  storeType: document.querySelector("#storeType"),
  storeSqm: document.querySelector("#storeSqm"),
  aiInsight: document.querySelector("#aiInsight"),
};

const energyPerItem = {
  Arredo: 18,
  Elettronica: 42,
  Moda: 7,
  Casa: 11,
  "Libri e giochi": 4,
};

const chartColors = ["#8fd400", "#20d6c5", "#ffd43b", "#ff6b4a", "#9d7cff"];
const numberFormatter = new Intl.NumberFormat("it-IT");
const maxImpact = {
  itemsSold: Math.max(...reuseMarkets.map((market) => market.itemsSold), 1),
  kwhSaved: Math.max(...reuseMarkets.map((market) => market.kwhSaved), 1),
  co2Saved: Math.max(...reuseMarkets.map((market) => market.co2Saved), 1),
};

function uniqueSorted(items) {
  return [...new Set(items)].filter(Boolean).sort((a, b) => a.localeCompare(b, "it"));
}

function formatNumber(value) {
  return numberFormatter.format(Math.round(value || 0));
}

function progressPercent(value, maxValue) {
  return Math.max(4, Math.min(100, Math.round((value / maxValue) * 100)));
}

function animateProgress(element, percent) {
  if (!element) return;
  element.style.transition = "none";
  element.style.width = "0%";
  element.offsetWidth;
  element.style.transition = "";
  requestAnimationFrame(() => {
    element.style.width = `${percent}%`;
  });
}

function setOptions(select, options, selectedValue) {
  select.innerHTML = options
    .map((option) => {
      const selected = option === selectedValue ? " selected" : "";
      return `<option value="${option}"${selected}>${option}</option>`;
    })
    .join("");
}

function marketsForSelection() {
  return reuseMarkets.filter(
    (market) =>
      market.region === regionSelect.value && market.province === provinceSelect.value
  );
}

function selectedMarket() {
  return (
    reuseMarkets.find((market) => market.id === marketSelect.value) ||
    marketsForSelection()[0] ||
    reuseMarkets[0]
  );
}

function populateRegions() {
  const regions = uniqueSorted(reuseMarkets.map((market) => market.region));
  setOptions(regionSelect, regions, regions[0]);
}

function populateProvinces(previousProvince) {
  const provinces = uniqueSorted(
    reuseMarkets
      .filter((market) => market.region === regionSelect.value)
      .map((market) => market.province)
  );
  const selected = provinces.includes(previousProvince) ? previousProvince : provinces[0];
  setOptions(provinceSelect, provinces, selected);
}

function populateMarkets(previousMarket) {
  const markets = marketsForSelection();
  const selected = markets.some((market) => market.id === previousMarket)
    ? previousMarket
    : markets[0]?.id;
  marketSelect.innerHTML = markets
    .map((market) => {
      const selectedAttr = market.id === selected ? " selected" : "";
      return `<option value="${market.id}"${selectedAttr}>${market.name}</option>`;
    })
    .join("");
}

function resizeCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.max(320, Math.floor(rect.width * ratio));
  canvas.height = Math.max(220, Math.floor(rect.height * ratio));
  return {
    ctx: canvas.getContext("2d"),
    width: canvas.width,
    height: canvas.height,
    ratio,
  };
}

function drawBarChart(canvas, rows, options = {}) {
  const { ctx, width, height, ratio } = resizeCanvas(canvas);
  const padding = {
    top: 24 * ratio,
    right: 18 * ratio,
    bottom: 58 * ratio,
    left: 58 * ratio,
  };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(...rows.map((row) => row.value), 1);

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "rgba(247, 251, 255, 0.05)";
  ctx.fillRect(padding.left, padding.top, innerWidth, innerHeight);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.11)";
  ctx.lineWidth = 1 * ratio;
  for (let i = 0; i <= 4; i += 1) {
    const y = padding.top + innerHeight - (innerHeight * i) / 4;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(padding.left + innerWidth, y);
    ctx.stroke();
  }

  const gap = 14 * ratio;
  const barWidth = Math.max(18 * ratio, (innerWidth - gap * (rows.length - 1)) / rows.length);

  rows.forEach((row, index) => {
    const barHeight = (row.value / maxValue) * (innerHeight - 18 * ratio);
    const x = padding.left + index * (barWidth + gap);
    const y = padding.top + innerHeight - barHeight;
    const color = chartColors[index % chartColors.length];

    ctx.fillStyle = color;
    ctx.fillRect(x, y, barWidth, barHeight);

    ctx.fillStyle = "#f7fbff";
    ctx.font = `${12 * ratio}px Inter, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(formatNumber(row.value), x + barWidth / 2, y - 8 * ratio);

    ctx.save();
    ctx.translate(x + barWidth / 2, padding.top + innerHeight + 14 * ratio);
    ctx.rotate(options.rotateLabels ? -0.55 : 0);
    ctx.fillStyle = "rgba(247, 251, 255, 0.78)";
    ctx.font = `${12 * ratio}px Inter, system-ui, sans-serif`;
    ctx.textAlign = options.rotateLabels ? "right" : "center";
    ctx.fillText(row.label, 0, 0);
    ctx.restore();
  });
}

function categoryRows(market) {
  return Object.entries(market.categories).map(([label, count]) => ({
    label,
    value: count * energyPerItem[label],
  }));
}

function provinceRows() {
  return marketsForSelection()
    .slice()
    .sort((a, b) => b.kwhSaved - a.kwhSaved)
    .slice(0, 6)
    .map((market) => ({
      label: market.city,
      value: market.kwhSaved,
    }));
}

function insightFor(market) {
  const topCategory = categoryRows(market).sort((a, b) => b.value - a.value)[0];
  const days = Math.max(1, Math.round(market.kwhSaved / 8.3));
  return `Stima AI demo: ${market.name} ha venduto ${formatNumber(
    market.itemsSold
  )} oggetti usati, evitando circa ${formatNumber(
    market.co2Saved
  )} kg di CO2 e risparmiando ${formatNumber(
    market.kwhSaved
  )} kWh. La categoria con l'impatto maggiore e ${topCategory.label.toLowerCase()}, perche pesa ${formatNumber(
    topCategory.value
  )} kWh sul totale. Tradotto in modo semplice, il risparmio energetico vale circa ${formatNumber(
    days
  )} giorni di consumo elettrico domestico medio.`;
}

function render() {
  const market = selectedMarket();
  const days = Math.max(1, Math.round(market.kwhSaved / 8.3));

  fields.itemsSold.textContent = formatNumber(market.itemsSold);
  fields.kwhSaved.textContent = formatNumber(market.kwhSaved);
  fields.co2Saved.textContent = formatNumber(market.co2Saved);
  fields.homeDays.textContent = `${formatNumber(days)} giorni di elettricita domestica`;
  fields.treesEquivalent.textContent = `${formatNumber(
    market.treesEquivalent
  )} alberi equivalenti in un anno`;
  fields.reuseRate.textContent = formatNumber(market.reuseRate);
  animateProgress(fields.itemsProgress, progressPercent(market.itemsSold, maxImpact.itemsSold));
  animateProgress(fields.kwhProgress, progressPercent(market.kwhSaved, maxImpact.kwhSaved));
  animateProgress(fields.co2Progress, progressPercent(market.co2Saved, maxImpact.co2Saved));
  animateProgress(fields.reuseProgress, progressPercent(market.reuseRate, 100));
  fields.storeName.textContent = market.name;
  fields.storeCity.textContent = `${market.city} (${market.province})`;
  fields.storeAddress.textContent = market.address || "-";
  fields.storeType.textContent = market.storeType;
  fields.storeSqm.textContent = market.sqm ? `${formatNumber(market.sqm)} mq` : "Non indicata";
  fields.aiInsight.textContent = insightFor(market);

  drawBarChart(categoryChart, categoryRows(market));
  drawBarChart(provinceChart, provinceRows(), { rotateLabels: true });
}

function handleRegionChange() {
  populateProvinces();
  populateMarkets();
  render();
}

function handleProvinceChange() {
  populateMarkets();
  render();
}

function init() {
  populateRegions();
  populateProvinces();
  populateMarkets();
  render();

  regionSelect.addEventListener("change", handleRegionChange);
  provinceSelect.addEventListener("change", handleProvinceChange);
  marketSelect.addEventListener("change", render);
  generateInsight.addEventListener("click", render);
  window.addEventListener("resize", render);
}

init();
