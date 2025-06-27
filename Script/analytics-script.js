// DOM Elements
const loadingScreen = document.getElementById("loadingScreen")
const themeToggle = document.getElementById("themeToggle")
const refreshBtn = document.getElementById("refreshBtn")
const periodSelect = document.getElementById("periodSelect")
const cryptoSelect = document.getElementById("cryptoSelect")

// Metric Elements
const currentPrice = document.getElementById("currentPrice")
const priceChange = document.getElementById("priceChange")
const avgPrice = document.getElementById("avgPrice")
const avgChange = document.getElementById("avgChange")
const totalVolume = document.getElementById("totalVolume")
const volumeChange = document.getElementById("volumeChange")
const volatility = document.getElementById("volatility")
const volatilityTrend = document.getElementById("volatilityTrend")
const maxPrice = document.getElementById("maxPrice")
const maxDate = document.getElementById("maxDate")
const minPrice = document.getElementById("minPrice")
const minDate = document.getElementById("minDate")

// Chart Elements
let priceChart = null
let volumeChart = null
let monthlyChart = null

// Global Variables
let currentCrypto = "bitcoin"
let currentPeriod = 30
let historicalData = []
let isLoading = false

// Initialize App
document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 Inicializando CryptoTracker Analytics...")

  initializeTheme()
  setupEventListeners()

  // Aguardar Chart.js carregar
  await waitForChart()

  await loadAnalyticsData()
  hideLoadingScreen()
})

// Aguardar Chart.js estar disponível
function waitForChart() {
  return new Promise((resolve) => {
    if (typeof Chart !== "undefined") {
      console.log("✅ Chart.js carregado")
      resolve()
    } else {
      console.log("⏳ Aguardando Chart.js...")
      setTimeout(() => waitForChart().then(resolve), 100)
    }
  })
}

// Theme Management
function initializeTheme() {
  const savedTheme = localStorage.getItem("cryptoTheme") || "light"
  document.documentElement.setAttribute("data-theme", savedTheme)
  updateThemeIcon(savedTheme)
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme")
  const newTheme = currentTheme === "dark" ? "light" : "dark"

  document.documentElement.setAttribute("data-theme", newTheme)
  localStorage.setItem("cryptoTheme", newTheme)
  updateThemeIcon(newTheme)
}

function updateThemeIcon(theme) {
  const icon = themeToggle.querySelector("i")
  icon.className = theme === "dark" ? "fas fa-sun" : "fas fa-moon"
}

// Event Listeners
function setupEventListeners() {
  themeToggle.addEventListener("click", toggleTheme)
  refreshBtn.addEventListener("click", refreshData)
  periodSelect.addEventListener("change", handlePeriodChange)
  cryptoSelect.addEventListener("change", handleCryptoChange)
}

// Data Loading Functions
async function loadAnalyticsData() {
  if (isLoading) return

  isLoading = true
  showLoadingState()

  try {
    console.log(`📊 Carregando dados analíticos para ${currentCrypto} (${currentPeriod} dias)`)

    // Buscar dados históricos
    const data = await fetchHistoricalData(currentCrypto, currentPeriod)

    if (data && data.length > 0) {
      historicalData = data

      // Atualizar métricas
      updateMetrics(data)

      // Atualizar gráficos
      await updatePriceChart(data)
      await updateVolumeChart(data)
      await updateMonthlyChart(data)

      // Atualizar tabela de performance
      updatePerformanceTable(data)

      // Atualizar análise técnica
      updateTechnicalAnalysis(data)

      console.log(`✅ Dados analíticos carregados: ${data.length} pontos`)
      showNotification("Dados carregados com sucesso!", "success")
    } else {
      throw new Error("Dados históricos não disponíveis")
    }
  } catch (error) {
    console.error("❌ Erro ao carregar dados analíticos:", error)
    showErrorState()
    showNotification("Erro ao carregar dados. Usando dados de demonstração.", "warning")

    // Usar dados de fallback
    const fallbackData = generateFallbackData(currentCrypto, currentPeriod)
    if (fallbackData.length > 0) {
      historicalData = fallbackData
      updateMetrics(fallbackData)
      await updatePriceChart(fallbackData)
      await updateVolumeChart(fallbackData)
      await updateMonthlyChart(fallbackData)
      updatePerformanceTable(fallbackData)
      updateTechnicalAnalysis(fallbackData)
    }
  } finally {
    isLoading = false
    hideLoadingState()
  }
}

// API Data Fetching
async function fetchHistoricalData(crypto, days) {
  try {
    console.log(`🔍 Buscando dados históricos: ${crypto} (${days} dias)`)

    const url = `https://api.coingecko.com/api/v3/coins/${crypto}/market_chart?vs_currency=usd&days=${days}`

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    if (!data.prices || !Array.isArray(data.prices)) {
      throw new Error("Formato de dados inválido")
    }

    console.log(`✅ ${data.prices.length} pontos de dados carregados`)

    // Normalizar dados
    return data.prices.map((price, index) => ({
      timestamp: price[0],
      date: new Date(price[0]),
      price: price[1],
      volume: data.total_volumes && data.total_volumes[index] ? data.total_volumes[index][1] : 0,
      marketCap: data.market_caps && data.market_caps[index] ? data.market_caps[index][1] : 0,
    }))
  } catch (error) {
    console.error("❌ Erro ao buscar dados históricos:", error)
    throw error
  }
}

// Fallback Data Generator
function generateFallbackData(crypto, days) {
  console.log("🔄 Gerando dados de fallback...")

  const cryptoPrices = {
    bitcoin: 45000,
    ethereum: 2500,
    binancecoin: 300,
    cardano: 0.5,
    solana: 100,
    polkadot: 7,
    chainlink: 15,
    litecoin: 70,
  }

  const basePrice = cryptoPrices[crypto] || 100
  const data = []
  const now = Date.now()
  const interval = (days * 24 * 60 * 60 * 1000) / 100 // 100 pontos

  for (let i = 0; i < 100; i++) {
    const timestamp = now - (99 - i) * interval
    const volatility = 0.02 // 2% de volatilidade
    const trend = Math.sin(i * 0.1) * 0.1 // Tendência senoidal
    const randomChange = (Math.random() - 0.5) * volatility
    const price = basePrice * (1 + trend + randomChange)

    data.push({
      timestamp,
      date: new Date(timestamp),
      price: Math.max(price, basePrice * 0.5), // Não deixar cair muito
      volume: Math.random() * 1000000000 + 500000000, // Volume entre 500M e 1.5B
      marketCap: price * 19000000, // Market cap estimado
    })
  }

  console.log(`✅ ${data.length} pontos de fallback gerados`)
  return data
}

// Metrics Calculation and Update
function updateMetrics(data) {
  if (!data || data.length === 0) return

  try {
    const prices = data.map((d) => d.price)
    const volumes = data.map((d) => d.volume)
    const currentPriceValue = prices[prices.length - 1]
    const previousPrice = prices[prices.length - 2] || currentPriceValue

    // Preço atual
    currentPrice.textContent = formatCurrency(currentPriceValue)
    const priceChangePercent = ((currentPriceValue - previousPrice) / previousPrice) * 100
    updateChangeElement(priceChange, priceChangePercent)

    // Média do período
    const avgPriceValue = prices.reduce((sum, price) => sum + price, 0) / prices.length
    avgPrice.textContent = formatCurrency(avgPriceValue)
    const avgChangePercent = ((currentPriceValue - avgPriceValue) / avgPriceValue) * 100
    updateChangeElement(avgChange, avgChangePercent)

    // Volume total
    const totalVolumeValue = volumes.reduce((sum, vol) => sum + vol, 0)
    totalVolume.textContent = formatLargeNumber(totalVolumeValue)
    const avgVolume = totalVolumeValue / volumes.length
    const recentVolume = volumes.slice(-7).reduce((sum, vol) => sum + vol, 0) / 7
    const volumeChangePercent = avgVolume > 0 ? ((recentVolume - avgVolume) / avgVolume) * 100 : 0
    updateChangeElement(volumeChange, volumeChangePercent)

    // Volatilidade
    const volatilityValue = calculateVolatility(prices)
    volatility.textContent = `${volatilityValue.toFixed(2)}%`

    // Máxima e mínima
    const maxPriceValue = Math.max(...prices)
    const minPriceValue = Math.min(...prices)
    const maxIndex = prices.indexOf(maxPriceValue)
    const minIndex = prices.indexOf(minPriceValue)

    maxPrice.textContent = formatCurrency(maxPriceValue)
    minPrice.textContent = formatCurrency(minPriceValue)
    maxDate.textContent = formatDate(data[maxIndex].date)
    minDate.textContent = formatDate(data[minIndex].date)

    console.log("✅ Métricas atualizadas")
  } catch (error) {
    console.error("❌ Erro ao atualizar métricas:", error)
  }
}

function calculateVolatility(prices) {
  if (prices.length < 2) return 0

  const returns = []
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1])
  }

  const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length

  return Math.sqrt(variance) * Math.sqrt(365) * 100 // Anualizada
}

function updateChangeElement(element, changePercent) {
  if (!element) return

  element.textContent = `${changePercent >= 0 ? "+" : ""}${changePercent.toFixed(2)}%`
  element.className = "metric-change"

  if (changePercent > 0) {
    element.classList.add("positive")
  } else if (changePercent < 0) {
    element.classList.add("negative")
  } else {
    element.classList.add("neutral")
  }
}

// Chart Updates
async function updatePriceChart(data) {
  try {
    const ctx = document.getElementById("priceChart")?.getContext("2d")
    if (!ctx) {
      console.error("❌ Canvas priceChart não encontrado")
      return
    }

    if (priceChart) {
      priceChart.destroy()
    }

    const labels = data.map((d) => d.date)
    const prices = data.map((d) => d.price)

    // Calcular médias móveis
    const ma7 = calculateMovingAverage(prices, 7)
    const ma30 = calculateMovingAverage(prices, 30)

    priceChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Preço",
            data: prices,
            borderColor: "#f7931a",
            backgroundColor: "rgba(247, 147, 26, 0.1)",
            borderWidth: 2,
            fill: true,
            tension: 0.1,
          },
          {
            label: "Média 7d",
            data: ma7,
            borderColor: "#10b981",
            borderWidth: 2,
            fill: false,
            tension: 0.1,
          },
          {
            label: "Média 30d",
            data: ma30,
            borderColor: "#3b82f6",
            borderWidth: 2,
            fill: false,
            tension: 0.1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: "index",
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            titleColor: "#fff",
            bodyColor: "#fff",
            borderColor: "#f7931a",
            borderWidth: 1,
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              maxTicksLimit: 10,
            },
          },
          y: {
            beginAtZero: false,
            grid: {
              color: "rgba(0, 0, 0, 0.1)",
            },
            ticks: {
              callback: (value) => formatCurrency(value),
            },
          },
        },
      },
    })

    console.log("✅ Gráfico de preços atualizado")
  } catch (error) {
    console.error("❌ Erro ao atualizar gráfico de preços:", error)
  }
}

async function updateVolumeChart(data) {
  try {
    const ctx = document.getElementById("volumeChart")?.getContext("2d")
    if (!ctx) {
      console.error("❌ Canvas volumeChart não encontrado")
      return
    }

    if (volumeChart) {
      volumeChart.destroy()
    }

    const labels = data.map((d) => d.date)
    const volumes = data.map((d) => d.volume)

    volumeChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Volume",
            data: volumes,
            backgroundColor: "rgba(247, 147, 26, 0.6)",
            borderColor: "#f7931a",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            titleColor: "#fff",
            bodyColor: "#fff",
            borderColor: "#f7931a",
            borderWidth: 1,
            callbacks: {
              label: (context) => `Volume: ${formatLargeNumber(context.parsed.y)}`,
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              maxTicksLimit: 10,
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: "rgba(0, 0, 0, 0.1)",
            },
            ticks: {
              callback: (value) => formatLargeNumber(value),
            },
          },
        },
      },
    })

    console.log("✅ Gráfico de volume atualizado")
  } catch (error) {
    console.error("❌ Erro ao atualizar gráfico de volume:", error)
  }
}

async function updateMonthlyChart(data) {
  try {
    const ctx = document.getElementById("monthlyChart")?.getContext("2d")
    if (!ctx) {
      console.error("❌ Canvas monthlyChart não encontrado")
      return
    }

    if (monthlyChart) {
      monthlyChart.destroy()
    }

    // Agrupar dados por mês
    const monthlyData = groupDataByMonth(data)
    const labels = Object.keys(monthlyData)
    const avgPrices = labels.map((month) => monthlyData[month].avgPrice)

    monthlyChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Preço Médio Mensal",
            data: avgPrices,
            borderColor: "#f7931a",
            backgroundColor: "rgba(247, 147, 26, 0.1)",
            borderWidth: 3,
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: "index",
        },
        plugins: {
          legend: {
            position: "top",
          },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            titleColor: "#fff",
            bodyColor: "#fff",
            borderColor: "#f7931a",
            borderWidth: 1,
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
          },
          y: {
            beginAtZero: false,
            grid: {
              color: "rgba(0, 0, 0, 0.1)",
            },
            ticks: {
              callback: (value) => formatCurrency(value),
            },
          },
        },
      },
    })

    // Atualizar estatísticas mensais
    updateMonthlyStats(monthlyData)

    console.log("✅ Gráfico mensal atualizado")
  } catch (error) {
    console.error("❌ Erro ao atualizar gráfico mensal:", error)
  }
}

function groupDataByMonth(data) {
  const grouped = {}

  data.forEach((item) => {
    const monthKey = item.date.toLocaleDateString("pt-BR", { year: "numeric", month: "short" })

    if (!grouped[monthKey]) {
      grouped[monthKey] = {
        prices: [],
        volumes: [],
        count: 0,
      }
    }

    grouped[monthKey].prices.push(item.price)
    grouped[monthKey].volumes.push(item.volume)
    grouped[monthKey].count++
  })

  // Calcular médias
  Object.keys(grouped).forEach((month) => {
    const monthData = grouped[month]
    monthData.avgPrice = monthData.prices.reduce((sum, price) => sum + price, 0) / monthData.prices.length
    monthData.totalVolume = monthData.volumes.reduce((sum, vol) => sum + vol, 0)
    monthData.maxPrice = Math.max(...monthData.prices)
    monthData.minPrice = Math.min(...monthData.prices)
    monthData.volatility = calculateVolatility(monthData.prices)
  })

  return grouped
}

function updateMonthlyStats(monthlyData) {
  const statsContainer = document.getElementById("monthlyStats")
  if (!statsContainer) return

  const months = Object.keys(monthlyData)

  if (months.length < 2) {
    statsContainer.innerHTML = "<p>Dados insuficientes para comparação mensal</p>"
    return
  }

  const currentMonth = monthlyData[months[months.length - 1]]
  const previousMonth = monthlyData[months[months.length - 2]]

  const priceChange = ((currentMonth.avgPrice - previousMonth.avgPrice) / previousMonth.avgPrice) * 100
  const volumeChange = ((currentMonth.totalVolume - previousMonth.totalVolume) / previousMonth.totalVolume) * 100

  statsContainer.innerHTML = `
    <div class="stat-item">
      <span class="stat-label">Meses Analisados</span>
      <span class="stat-value">${months.length}</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">Variação Mensal</span>
      <span class="stat-value ${priceChange >= 0 ? "text-success" : "text-danger"}">
        ${priceChange >= 0 ? "+" : ""}${priceChange.toFixed(2)}%
      </span>
    </div>
    <div class="stat-item">
      <span class="stat-label">Volume vs Mês Anterior</span>
      <span class="stat-value ${volumeChange >= 0 ? "text-success" : "text-danger"}">
        ${volumeChange >= 0 ? "+" : ""}${volumeChange.toFixed(2)}%
      </span>
    </div>
    <div class="stat-item">
      <span class="stat-label">Maior Alta Mensal</span>
      <span class="stat-value text-success">
        ${Math.max(...months.map((m) => ((monthlyData[m].maxPrice - monthlyData[m].minPrice) / monthlyData[m].minPrice) * 100)).toFixed(2)}%
      </span>
    </div>
  `
}

function updatePerformanceTable(data) {
  const tableBody = document.getElementById("performanceTableBody")
  if (!tableBody) return

  // Dividir dados em períodos
  const periods = [
    { name: "7 Dias", days: 7 },
    { name: "30 Dias", days: 30 },
    { name: "90 Dias", days: 90 },
  ]

  let tableHTML = ""

  periods.forEach((period) => {
    if (data.length >= period.days) {
      const periodData = data.slice(-period.days)
      const startPrice = periodData[0].price
      const endPrice = periodData[periodData.length - 1].price
      const variation = ((endPrice - startPrice) / startPrice) * 100
      const avgVolume = periodData.reduce((sum, d) => sum + d.volume, 0) / periodData.length
      const volatilityValue = calculateVolatility(periodData.map((d) => d.price))
      const roi = variation

      tableHTML += `
        <tr>
          <td>${period.name}</td>
          <td>${formatCurrency(startPrice)}</td>
          <td>${formatCurrency(endPrice)}</td>
          <td class="${variation >= 0 ? "positive" : "negative"}">
            ${variation >= 0 ? "+" : ""}${variation.toFixed(2)}%
          </td>
          <td>${formatLargeNumber(avgVolume)}</td>
          <td>${volatilityValue.toFixed(2)}%</td>
          <td class="${roi >= 0 ? "positive" : "negative"}">
            ${roi >= 0 ? "+" : ""}${roi.toFixed(2)}%
          </td>
        </tr>
      `
    }
  })

  tableBody.innerHTML = tableHTML
}

function updateTechnicalAnalysis(data) {
  const prices = data.map((d) => d.price)

  // Indicadores de tendência
  const trendContainer = document.getElementById("trendIndicators")
  if (trendContainer) {
    const ma20 = calculateMovingAverage(prices, 20)
    const ma50 = calculateMovingAverage(prices, 50)
    const currentPriceValue = prices[prices.length - 1]
    const currentMA20 = ma20[ma20.length - 1] || currentPriceValue
    const currentMA50 = ma50[ma50.length - 1] || currentPriceValue

    let trendSignal = "neutral"
    if (currentPriceValue > currentMA20 && currentMA20 > currentMA50) {
      trendSignal = "bullish"
    } else if (currentPriceValue < currentMA20 && currentMA20 < currentMA50) {
      trendSignal = "bearish"
    }

    trendContainer.innerHTML = `
      <div class="indicator-item">
        <span class="indicator-label">Tendência Geral</span>
        <span class="indicator-signal ${trendSignal}">
          ${trendSignal === "bullish" ? "Alta" : trendSignal === "bearish" ? "Baixa" : "Lateral"}
        </span>
      </div>
      <div class="indicator-item">
        <span class="indicator-label">Média Móvel 20</span>
        <span class="indicator-value">${formatCurrency(currentMA20)}</span>
      </div>
      <div class="indicator-item">
        <span class="indicator-label">Média Móvel 50</span>
        <span class="indicator-value">${formatCurrency(currentMA50)}</span>
      </div>
    `
  }

  // Suporte e Resistência
  const supportResistanceContainer = document.getElementById("supportResistance")
  if (supportResistanceContainer) {
    const support = Math.min(...prices.slice(-30))
    const resistance = Math.max(...prices.slice(-30))
    const currentPriceValue = prices[prices.length - 1]

    supportResistanceContainer.innerHTML = `
      <div class="indicator-item">
        <span class="indicator-label">Suporte (30d)</span>
        <span class="indicator-value">${formatCurrency(support)}</span>
      </div>
      <div class="indicator-item">
        <span class="indicator-label">Resistência (30d)</span>
        <span class="indicator-value">${formatCurrency(resistance)}</span>
      </div>
      <div class="indicator-item">
        <span class="indicator-label">Distância do Suporte</span>
        <span class="indicator-value">${(((currentPriceValue - support) / support) * 100).toFixed(2)}%</span>
      </div>
    `
  }

  // Momentum
  const momentumContainer = document.getElementById("momentumIndicators")
  if (momentumContainer) {
    const rsi = calculateRSI(prices, 14)
    const momentum =
      prices.length >= 10
        ? ((prices[prices.length - 1] - prices[prices.length - 10]) / prices[prices.length - 10]) * 100
        : 0

    let rsiSignal = "neutral"
    if (rsi > 70) rsiSignal = "bearish"
    else if (rsi < 30) rsiSignal = "bullish"

    momentumContainer.innerHTML = `
      <div class="indicator-item">
        <span class="indicator-label">RSI (14)</span>
        <span class="indicator-value">${rsi.toFixed(2)}</span>
        <span class="indicator-signal ${rsiSignal}">
          ${rsiSignal === "bullish" ? "Oversold" : rsiSignal === "bearish" ? "Overbought" : "Neutro"}
        </span>
      </div>
      <div class="indicator-item">
        <span class="indicator-label">Momentum (10d)</span>
        <span class="indicator-value ${momentum >= 0 ? "text-success" : "text-danger"}">
          ${momentum >= 0 ? "+" : ""}${momentum.toFixed(2)}%
        </span>
      </div>
    `
  }
}

// Utility Functions
function calculateMovingAverage(data, period) {
  const result = []
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null)
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0)
      result.push(sum / period)
    }
  }
  return result
}

function calculateRSI(prices, period = 14) {
  if (prices.length < period + 1) return 50

  const gains = []
  const losses = []

  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1]
    gains.push(change > 0 ? change : 0)
    losses.push(change < 0 ? Math.abs(change) : 0)
  }

  const avgGain = gains.slice(-period).reduce((sum, gain) => sum + gain, 0) / period
  const avgLoss = losses.slice(-period).reduce((sum, loss) => sum + loss, 0) / period

  if (avgLoss === 0) return 100

  const rs = avgGain / avgLoss
  return 100 - 100 / (1 + rs)
}

function formatCurrency(value) {
  if (value === null || value === undefined || isNaN(value)) return "-"

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: value < 1 ? 6 : 2,
    maximumFractionDigits: value < 1 ? 6 : 2,
  }).format(value)
}

function formatLargeNumber(value) {
  if (value === null || value === undefined || isNaN(value)) return "-"

  if (value >= 1e12) {
    return `$${(value / 1e12).toFixed(2)}T`
  } else if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`
  } else if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`
  } else if (value >= 1e3) {
    return `$${(value / 1e3).toFixed(2)}K`
  } else {
    return `$${value.toFixed(2)}`
  }
}

function formatDate(date) {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  })
}

// Event Handlers
function handlePeriodChange() {
  currentPeriod = Number.parseInt(periodSelect.value)
  loadAnalyticsData()
}

function handleCryptoChange() {
  currentCrypto = cryptoSelect.value
  loadAnalyticsData()
}

async function refreshData() {
  refreshBtn.style.transform = "rotate(360deg)"

  try {
    await loadAnalyticsData()
    showNotification("Dados atualizados com sucesso!", "success")
  } catch (error) {
    showNotification("Erro ao atualizar dados", "error")
  }

  setTimeout(() => {
    refreshBtn.style.transform = "rotate(0deg)"
  }, 500)
}

// UI State Management
function showLoadingState() {
  document.querySelectorAll(".metric-card").forEach((card) => {
    card.classList.add("loading")
  })
}

function hideLoadingState() {
  document.querySelectorAll(".metric-card").forEach((card) => {
    card.classList.remove("loading")
  })
}

function showErrorState() {
  const elements = [currentPrice, avgPrice, totalVolume, volatility, maxPrice, minPrice]
  elements.forEach((el) => {
    if (el) el.textContent = "Erro"
  })
}

function hideLoadingScreen() {
  setTimeout(() => {
    loadingScreen.style.opacity = "0"
    setTimeout(() => {
      loadingScreen.style.display = "none"
    }, 500)
  }, 1500)
}

// Notification System
function showNotification(message, type = "info") {
  const notification = document.createElement("div")
  notification.className = `notification ${type}`
  notification.textContent = message

  notification.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 8px;
    color: white;
    font-weight: 500;
    z-index: 10000;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    ${getNotificationColor(type)}
  `

  document.body.appendChild(notification)

  setTimeout(() => {
    notification.style.transform = "translateX(0)"
  }, 10)

  setTimeout(() => {
    notification.style.transform = "translateX(100%)"
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification)
      }
    }, 300)
  }, 3000)
}

function getNotificationColor(type) {
  switch (type) {
    case "success":
      return "background: #10b981;"
    case "error":
      return "background: #ef4444;"
    case "warning":
      return "background: #f59e0b;"
    default:
      return "background: #6366f1;"
  }
}

// Auto-refresh data every 5 minutes
setInterval(() => {
  if (!document.hidden && !isLoading) {
    loadAnalyticsData()
  }
}, 300000) // 5 minutos

// Handle visibility change to pause/resume updates
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && !isLoading) {
    loadAnalyticsData()
  }
})

// Log inicial
console.log("📊 CryptoTracker Analytics inicializado")
console.log(`🎯 Crypto selecionada: ${currentCrypto}`)
console.log(`📅 Período: ${currentPeriod} dias`)