// DOM Elements
const loadingScreen = document.getElementById("loadingScreen")
const themeToggle = document.getElementById("themeToggle")
const searchInput = document.getElementById("searchInput")
const currencySelect = document.getElementById("currencySelect")
const refreshBtn = document.getElementById("refreshBtn")
const cryptoTableBody = document.getElementById("cryptoTableBody")
const favoritesSection = document.getElementById("favoritesSection")
const favoritesGrid = document.getElementById("favoritesGrid")
const fromAmount = document.getElementById("fromAmount")
const toAmount = document.getElementById("toAmount")
const fromCrypto = document.getElementById("fromCrypto")
const toCrypto = document.getElementById("toCrypto")
const swapBtn = document.getElementById("swapBtn")
const totalMarketCap = document.getElementById("totalMarketCap")
const totalVolume = document.getElementById("totalVolume")
const btcDominance = document.getElementById("btcDominance")
const activeCryptos = document.getElementById("activeCryptos")
const mobileMenuToggle = document.getElementById("mobileMenuToggle")
const navMenu = document.getElementById("navMenu")

// API Configuration
const API_BASE_URL = "https://api.coingecko.com/api/v3"
const ITEMS_PER_PAGE = 50

// Global Variables
let currentCurrency = "usd"
let cryptoData = []
const favorites = JSON.parse(localStorage.getItem("cryptoFavorites")) || []

// ===== SISTEMA DE MÚLTIPLAS APIs DE TRACKING =====

// Configuração de APIs com fallback automático
const CRYPTO_APIS = {
  primary: {
    name: "CoinGecko",
    baseUrl: "https://api.coingecko.com/api/v3",
    endpoints: {
      global: "/global",
      markets: "/coins/markets",
      simple: "/simple/price",
    },
    rateLimit: 50, // requests per minute
    active: true,
  },
  secondary: {
    name: "CoinCap",
    baseUrl: "https://api.coincap.io/v2",
    endpoints: {
      global: "/assets",
      markets: "/assets",
      simple: "/assets",
    },
    rateLimit: 200,
    active: true,
  },
  tertiary: {
    name: "CryptoCompare",
    baseUrl: "https://min-api.cryptocompare.com/data",
    endpoints: {
      global: "/top/mktcapfull",
      markets: "/top/mktcapfull",
      simple: "/price",
    },
    rateLimit: 100,
    active: true,
  },
  quaternary: {
    name: "Binance",
    baseUrl: "https://api.binance.com/api/v3",
    endpoints: {
      global: "/ticker/24hr",
      markets: "/ticker/24hr",
      simple: "/ticker/price",
    },
    rateLimit: 1200,
    active: true,
  },
}

// Estado das APIs
const apiStatus = {
  current: "primary",
  failures: {},
  lastSwitch: null,
  requestCounts: {},
}

// Inicializar contadores de requests
Object.keys(CRYPTO_APIS).forEach((key) => {
  apiStatus.requestCounts[key] = 0
  apiStatus.failures[key] = 0
})

// Initialize App
document.addEventListener("DOMContentLoaded", async () => {
  initializeTheme()
  setupEventListeners()
  await loadInitialData()
  hideLoadingScreen()
  initializeNavigation()
})

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
  currencySelect.addEventListener("change", handleCurrencyChange)
  searchInput.addEventListener("input", handleSearch)
  swapBtn.addEventListener("click", swapCurrencies)
  fromAmount.addEventListener("input", updateConversion)
  fromCrypto.addEventListener("change", updateConversion)
  toCrypto.addEventListener("change", updateConversion)
  mobileMenuToggle.addEventListener("click", toggleMobileMenu)

  // Fechar menu mobile ao clicar fora
  document.addEventListener("click", (e) => {
    if (!navMenu.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
      closeMobileMenu()
    }
  })
}

// Data Loading Functions
async function loadInitialData() {
  try {
    await Promise.all([
      loadMarketData(),
      loadCryptoData(),
      loadNewsData(), // Função simples que chama a News API
    ])

    if (favorites.length > 0) {
      showFavoritesSection()
      loadFavorites()
    }

    // Initialize converter
    updateConversion()
  } catch (error) {
    console.error("Error loading initial data:", error)
    showNotification("Erro ao carregar dados. Tente novamente.", "error")
  }
}

async function loadMarketData() {
  try {
    console.log(`📊 Carregando dados do mercado via ${CRYPTO_APIS[apiStatus.current].name}...`)

    const data = await fetchWithFallback("global")

    if (data) {
      updateMarketStats(data)
      console.log(`✅ Dados do mercado carregados via ${CRYPTO_APIS[apiStatus.current].name}`)
    } else {
      throw new Error("Nenhuma API disponível")
    }
  } catch (error) {
    console.error("❌ Erro ao carregar dados do mercado:", error)
    setFallbackMarketData()
  }
}

async function loadCryptoData() {
  try {
    console.log(`💰 Carregando dados das criptos via ${CRYPTO_APIS[apiStatus.current].name}...`)

    const data = await fetchWithFallback("markets")

    if (data && data.length > 0) {
      cryptoData = data
      renderCryptoTable(cryptoData)
      console.log(`✅ ${data.length} criptomoedas carregadas via ${CRYPTO_APIS[apiStatus.current].name}`)
    } else {
      throw new Error("Dados de criptomoedas não disponíveis")
    }
  } catch (error) {
    console.error("❌ Erro ao carregar dados das criptomoedas:", error)
    showNotification("Erro ao carregar dados das criptomoedas", "error")

    cryptoTableBody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 2rem; color: var(--danger-color);">
          <i class="fas fa-exclamation-triangle"></i> 
          Erro ao carregar dados. 
          <button onclick="forceApiSwitch()" style="margin-left: 1rem; padding: 4px 8px; background: var(--primary-color); color: white; border: none; border-radius: 4px; cursor: pointer;">
            Tentar Outra API
          </button>
        </td>
      </tr>
    `
  }
}

// Render Functions
// Corrigir a função updateMarketStats para lidar com diferentes formatos de API
function updateMarketStats(data) {
  try {
    console.log("📊 Dados recebidos para market stats:", data)

    let marketCap = 0
    let volume = 0
    let btcDom = 0
    let activeCryp = 0

    // Verificar qual API está sendo usada e extrair dados corretamente
    if (data.data) {
      // Formato CoinGecko
      marketCap =
        data.data.total_market_cap && data.data.total_market_cap[currentCurrency]
          ? data.data.total_market_cap[currentCurrency]
          : 0
      volume =
        data.data.total_volume && data.data.total_volume[currentCurrency] ? data.data.total_volume[currentCurrency] : 0
      btcDom =
        data.data.market_cap_percentage && data.data.market_cap_percentage.btc ? data.data.market_cap_percentage.btc : 0
      activeCryp = data.data.active_cryptocurrencies || 0
    } else if (data.total_market_cap) {
      // Formato direto (já normalizado)
      marketCap = data.total_market_cap[currentCurrency] || 0
      volume = data.total_volume[currentCurrency] || 0
      btcDom = data.market_cap_percentage?.btc || 0
      activeCryp = data.active_cryptocurrencies || 0
    } else {
      // Fallback - calcular a partir dos dados disponíveis
      console.warn("⚠️ Formato de dados não reconhecido, usando fallback")
      setFallbackMarketData()
      return
    }

    // Atualizar interface
    totalMarketCap.textContent = formatCurrency(marketCap, currentCurrency)
    totalVolume.textContent = formatCurrency(volume, currentCurrency)
    btcDominance.textContent = `${btcDom.toFixed(1)}%`
    activeCryptos.textContent = activeCryp.toLocaleString()

    console.log("✅ Market stats atualizados:", {
      marketCap: formatCurrency(marketCap, currentCurrency),
      volume: formatCurrency(volume, currentCurrency),
      btcDom: `${btcDom.toFixed(1)}%`,
      activeCryp: activeCryp.toLocaleString(),
    })
  } catch (error) {
    console.error("❌ Erro ao atualizar market stats:", error)
    setFallbackMarketData()
  }
}

function renderCryptoTable(data) {
  if (!data || data.length === 0) {
    cryptoTableBody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 2rem;">
          Nenhum dado disponível
        </td>
      </tr>
    `
    return
  }

  cryptoTableBody.innerHTML = ""

  data.forEach((crypto, index) => {
    const row = createCryptoRow(crypto, index + 1)
    cryptoTableBody.appendChild(row)
  })
}

function createCryptoRow(crypto, rank) {
  const row = document.createElement("tr")

  const isFavorite = favorites.includes(crypto.id)
  const price24h = crypto.price_change_percentage_24h || 0
  const price7d = crypto.price_change_percentage_7d_in_currency || 0

  row.innerHTML = `
    <td>${rank}</td>
    <td>
      <div class="crypto-info">
        <img src="${crypto.image}" 
             alt="${crypto.name}" 
             class="crypto-logo" 
             onerror="this.onerror=null; this.src='https://via.placeholder.com/32x32/f7931a/ffffff?text=${crypto.symbol?.charAt(0) || "?"}'"
             loading="lazy">
        <div class="crypto-name">
          <strong>${crypto.name}</strong>
          <span>${crypto.symbol}</span>
        </div>
      </div>
    </td>
    <td>${formatCurrency(crypto.current_price, currentCurrency)}</td>
    <td class="price-change ${price24h >= 0 ? "positive" : "negative"}">
      ${price24h >= 0 ? "+" : ""}${price24h.toFixed(2)}%
    </td>
    <td class="price-change ${price7d >= 0 ? "positive" : "negative"}">
      ${price7d >= 0 ? "+" : ""}${price7d.toFixed(2)}%
    </td>
    <td>${formatCurrency(crypto.market_cap, currentCurrency)}</td>
    <td>${formatCurrency(crypto.total_volume, currentCurrency)}</td>
    <td>
      <div class="action-buttons">
        <button class="btn-small btn-favorite ${isFavorite ? "active" : ""}" onclick="toggleFavorite('${crypto.id}')">
          <i class="fas fa-heart"></i>
        </button>
      </div>
    </td>
  `

  return row
}

// Favorites Functions
function toggleFavorite(coinId) {
  const index = favorites.indexOf(coinId)

  if (index > -1) {
    favorites.splice(index, 1)
    showNotification("Removido dos favoritos", "info")
  } else {
    favorites.push(coinId)
    showNotification("Adicionado aos favoritos", "success")
  }

  localStorage.setItem("cryptoFavorites", JSON.stringify(favorites))

  // Update UI
  renderCryptoTable(cryptoData)
  updateFavoritesNavigation() // Atualizar navegação

  if (favorites.length > 0) {
    showFavoritesSection()
    loadFavorites()
  } else {
    hideFavoritesSection()
  }
}

function showFavoritesSection() {
  favoritesSection.style.display = "block"
}

function hideFavoritesSection() {
  favoritesSection.style.display = "none"
}

async function loadFavorites() {
  if (favorites.length === 0) return

  try {
    const response = await fetch(
      `${API_BASE_URL}/coins/markets?vs_currency=${currentCurrency}&ids=${favorites.join(",")}&order=market_cap_desc&sparkline=false`,
    )
    const data = await response.json()
    renderFavorites(data)
  } catch (error) {
    console.error("Error loading favorites:", error)
  }
}

function renderFavorites(data) {
  favoritesGrid.innerHTML = ""

  data.forEach((crypto) => {
    const card = createFavoriteCard(crypto)
    favoritesGrid.appendChild(card)
  })
}

function createFavoriteCard(crypto) {
  const card = document.createElement("div")
  card.className = "favorite-card"

  const price24h = crypto.price_change_percentage_24h || 0

  card.innerHTML = `
  <div class="crypto-info">
    <img src="${crypto.image}" 
         alt="${crypto.name}" 
         class="crypto-logo" 
         onerror="this.onerror=null; this.src='https://via.placeholder.com/32x32/f7931a/ffffff?text=${crypto.symbol?.charAt(0) || "?"}'"
         loading="lazy">
    <div class="crypto-name">
      <strong>${crypto.name}</strong>
      <span>${crypto.symbol.toUpperCase()}</span>
    </div>
  </div>
  <div class="crypto-price">
    <h3>${formatCurrency(crypto.current_price, currentCurrency)}</h3>
    <p class="price-change ${price24h >= 0 ? "positive" : "negative"}">
      ${price24h >= 0 ? "+" : ""}${price24h.toFixed(2)}%
    </p>
  </div>
  <div class="action-buttons">
    <button class="btn-small btn-favorite active" onclick="toggleFavorite('${crypto.id}')">
      <i class="fas fa-heart"></i>
    </button>
  </div>
`

  return card
}

// Converter Functions
async function updateConversion() {
  const amount = Number.parseFloat(fromAmount.value) || 0
  const fromCoin = fromCrypto.value
  const toCoin = toCrypto.value

  if (amount === 0) {
    toAmount.value = "0"
    return
  }

  if (fromCoin === toCoin) {
    toAmount.value = amount.toString()
    return
  }

  try {
    console.log(`🔄 Convertendo via ${CRYPTO_APIS[apiStatus.current].name}...`)

    const data = await fetchWithFallback("simple", { coins: [fromCoin, toCoin] })

    if (data) {
      const fromPrice = extractPrice(data, fromCoin)
      const toPrice = extractPrice(data, toCoin)

      if (fromPrice && toPrice && fromPrice > 0 && toPrice > 0) {
        const convertedAmount = (amount * fromPrice) / toPrice
        toAmount.value = convertedAmount.toFixed(8).replace(/\.?0+$/, "")
        console.log(`✅ Conversão realizada via ${CRYPTO_APIS[apiStatus.current].name}`)
      } else {
        throw new Error("Preços não disponíveis")
      }
    } else {
      throw new Error("Erro na conversão")
    }
  } catch (error) {
    console.error("❌ Erro na conversão:", error)
    toAmount.value = "Erro - Tentando outra API..."

    // Tentar próxima API automaticamente
    setTimeout(async () => {
      if (switchToNextAPI()) {
        await updateConversion()
      } else {
        toAmount.value = "Todas as APIs falharam"
      }
    }, 1000)
  }
}

function swapCurrencies() {
  const fromValue = fromCrypto.value
  const toValue = toCrypto.value
  const fromAmountValue = fromAmount.value
  const toAmountValue = toAmount.value

  fromCrypto.value = toValue
  toCrypto.value = fromValue
  fromAmount.value = toAmountValue
  toAmount.value = fromAmountValue

  updateConversion()
}

// Search and Filter Functions
function handleSearch() {
  const query = searchInput.value.toLowerCase()

  if (query === "") {
    renderCryptoTable(cryptoData)
    return
  }

  const filteredData = cryptoData.filter(
    (crypto) => crypto.name.toLowerCase().includes(query) || crypto.symbol.toLowerCase().includes(query),
  )

  renderCryptoTable(filteredData)
}

function handleCurrencyChange() {
  currentCurrency = currencySelect.value
  refreshData()
}

async function refreshData() {
  refreshBtn.style.transform = "rotate(360deg)"

  try {
    await loadInitialData()
    showNotification("Dados atualizados com sucesso!", "success")
  } catch (error) {
    showNotification("Erro ao atualizar dados", "error")
  }

  setTimeout(() => {
    refreshBtn.style.transform = "rotate(0deg)"
  }, 500)
}

// Utility Functions
function formatCurrency(value, currency) {
  if (value === null || value === undefined || isNaN(value)) return "-"

  const formatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: value < 1 ? 6 : 2,
    maximumFractionDigits: value < 1 ? 6 : 2,
  })

  return formatter.format(value)
}

function hideLoadingScreen() {
  setTimeout(() => {
    loadingScreen.style.opacity = "0"
    setTimeout(() => {
      loadingScreen.style.display = "none"
    }, 500)
  }, 1500)
}

// Notification system
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

// ===== NEWS LOADING - CHAMADA SIMPLES =====

async function loadNewsData() {
  try {
    // Verificar se a classe CryptoNewsAPI está disponível
    if (typeof window.CryptoNewsAPI !== "undefined") {
      const newsAPI = new window.CryptoNewsAPI()
      await newsAPI.loadAndRenderNews()
    } else {
      console.warn("CryptoNewsAPI não encontrada, carregando fallback...")
      // Se a classe não estiver disponível, tentar carregar diretamente
      setTimeout(loadNewsData, 1000) // Tentar novamente em 1 segundo
    }
  } catch (error) {
    console.error("Error loading news:", error)
  }
}

// Auto-refresh data every 60 seconds
setInterval(() => {
  if (!document.hidden) {
    loadCryptoData()
    loadMarketData()
    if (favorites.length > 0) {
      loadFavorites()
    }
  }
}, 60000)

// Auto-refresh news every 10 minutes (separado do refresh de crypto)
setInterval(() => {
  if (!document.hidden) {
    loadNewsData()
  }
}, 600000) // 10 minutos

// Handle visibility change to pause/resume updates
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    loadCryptoData()
    loadMarketData()
  }
})

// Make functions globally available
window.toggleFavorite = toggleFavorite

// ===== SISTEMA DE FALLBACK DE APIs =====

async function fetchWithFallback(endpoint, params = {}) {
  const currentAPI = CRYPTO_APIS[apiStatus.current]

  // Se API atual não está ativa, encontrar uma que esteja
  if (!currentAPI.active) {
    if (!findActiveAPI()) {
      console.error("❌ Nenhuma API disponível")
      return null
    }
  }

  try {
    // Verificar rate limit apenas se necessário
    if (isRateLimited(apiStatus.current)) {
      console.warn(`⚠️ Rate limit atingido para ${currentAPI.name}`)
      if (!switchToNextAPI()) {
        console.error("❌ Todas as APIs estão com rate limit")
        return null
      }
    }

    // Fazer request na API atual
    const data = await makeAPIRequest(endpoint, params)

    if (data && isValidResponse(data, endpoint)) {
      // Sucesso! Reset failure count
      apiStatus.failures[apiStatus.current] = 0
      apiStatus.requestCounts[apiStatus.current]++

      // Log apenas na primeira vez ou após recuperação
      if (apiStatus.lastSuccessAPI !== apiStatus.current) {
        console.log(`✅ Conectado via ${CRYPTO_APIS[apiStatus.current].name}`)
        apiStatus.lastSuccessAPI = apiStatus.current
      }

      return data
    }

    throw new Error("Resposta inválida da API")
  } catch (error) {
    console.error(`❌ Falha na API ${currentAPI.name}:`, error.message)

    // Incrementar contador de falhas
    apiStatus.failures[apiStatus.current]++

    // Só trocar de API se:
    // 1. Houver falhas consecutivas (3+)
    // 2. Ou se for erro crítico (network, 500, etc.)
    const shouldSwitch = apiStatus.failures[apiStatus.current] >= 3 || isCriticalError(error)

    if (shouldSwitch) {
      console.warn(`🔄 Trocando de API após ${apiStatus.failures[apiStatus.current]} falhas`)

      // Desativar API atual temporariamente
      currentAPI.active = false

      // Reativar após 2 minutos (menos agressivo)
      setTimeout(
        () => {
          currentAPI.active = true
          apiStatus.failures[apiStatus.current] = 0
          console.log(`🔄 ${currentAPI.name} reativada`)
        },
        2 * 60 * 1000,
      )

      // Tentar próxima API
      if (switchToNextAPI()) {
        return await fetchWithFallback(endpoint, params)
      }
    }

    return null
  }
}

// Verificar se é erro crítico que justifica troca imediata
function isCriticalError(error) {
  const criticalErrors = ["NetworkError", "TypeError: Failed to fetch", "HTTP 500", "HTTP 502", "HTTP 503", "HTTP 504"]

  return criticalErrors.some((criticalError) => error.message.includes(criticalError) || error.name === criticalError)
}

// Verificar se resposta é válida
function isValidResponse(data, endpoint) {
  if (!data) return false

  switch (endpoint) {
    case "global":
      return data.data || data.total_market_cap || Array.isArray(data)
    case "markets":
      return Array.isArray(data) && data.length > 0
    case "simple":
      return typeof data === "object" && Object.keys(data).length > 0
    default:
      return true
  }
}

// Encontrar API ativa (sem logs desnecessários)
function findActiveAPI() {
  const activeAPIs = Object.keys(CRYPTO_APIS).filter((key) => CRYPTO_APIS[key].active)

  if (activeAPIs.length === 0) {
    // Reativar todas se nenhuma estiver ativa
    Object.keys(CRYPTO_APIS).forEach((key) => {
      CRYPTO_APIS[key].active = true
      apiStatus.failures[key] = 0
    })
    console.log("🔄 Todas as APIs reativadas")
    return true
  }

  // Se API atual não está ativa, usar a primeira ativa
  if (!CRYPTO_APIS[apiStatus.current].active) {
    apiStatus.current = activeAPIs[0]
    return true
  }

  return true
}

// Versão mais inteligente do switch
function switchToNextAPI() {
  const apiKeys = Object.keys(CRYPTO_APIS)
  const currentIndex = apiKeys.indexOf(apiStatus.current)

  // Procurar próxima API ativa
  for (let i = 1; i <= apiKeys.length; i++) {
    const nextIndex = (currentIndex + i) % apiKeys.length
    const nextKey = apiKeys[nextIndex]

    if (CRYPTO_APIS[nextKey].active) {
      const oldAPI = CRYPTO_APIS[apiStatus.current].name
      apiStatus.current = nextKey
      apiStatus.lastSwitch = Date.now()

      // Log apenas quando realmente troca (não spam)
      console.log(`🔄 API alterada: ${oldAPI} → ${CRYPTO_APIS[nextKey].name}`)

      // Notificação menos frequente
      if (!apiStatus.lastNotification || Date.now() - apiStatus.lastNotification > 30000) {
        showNotification(`Conectando via ${CRYPTO_APIS[nextKey].name}`, "info")
        apiStatus.lastNotification = Date.now()
      }

      return true
    }
  }

  return false
}

// Rate limit mais conservador
function isRateLimited(apiKey) {
  const api = CRYPTO_APIS[apiKey]
  const requests = apiStatus.requestCounts[apiKey] || 0

  // Reset contador a cada minuto
  if (!api.lastReset || Date.now() - api.lastReset > 60000) {
    apiStatus.requestCounts[apiKey] = 0
    api.lastReset = Date.now()
    return false
  }

  // Usar 80% do limite para ser conservador
  const safeLimit = Math.floor(api.rateLimit * 0.8)
  return requests >= safeLimit
}

// Request mais robusto
async function makeAPIRequest(endpoint, params = {}) {
  const currentAPI = CRYPTO_APIS[apiStatus.current]
  let url = ""

  try {
    switch (apiStatus.current) {
      case "primary": // CoinGecko
        url = buildCoinGeckoURL(endpoint, params)
        break
      case "secondary": // CoinCap
        url = buildCoinCapURL(endpoint, params)
        break
      case "tertiary": // CryptoCompare
        url = buildCryptoCompareURL(endpoint, params)
        break
      case "quaternary": // Binance
        url = buildBinanceURL(endpoint, params)
        break
      default:
        throw new Error("API não configurada")
    }

    // Request com timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "CryptoTracker/1.0",
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return normalizeAPIResponse(data, endpoint)
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Request timeout")
    }
    throw error
  }
}

// ===== BUILDERS DE URL PARA CADA API =====

function buildCoinGeckoURL(endpoint, params) {
  const base = CRYPTO_APIS.primary.baseUrl

  switch (endpoint) {
    case "global":
      return `${base}/global`
    case "markets":
      return `${base}/coins/markets?vs_currency=${currentCurrency}&order=market_cap_desc&per_page=${ITEMS_PER_PAGE}&page=1&sparkline=false&price_change_percentage=1h,24h,7d`
    case "simple":
      const coins = params.coins?.join(",") || "bitcoin,ethereum"
      return `${base}/simple/price?ids=${coins}&vs_currencies=usd`
    default:
      throw new Error(`Endpoint ${endpoint} não suportado pelo CoinGecko`)
  }
}

function buildCoinCapURL(endpoint, params) {
  const base = CRYPTO_APIS.secondary.baseUrl

  switch (endpoint) {
    case "global":
    case "markets":
      return `${base}/assets?limit=${ITEMS_PER_PAGE}`
    case "simple":
      return `${base}/assets?limit=100`
    default:
      throw new Error(`Endpoint ${endpoint} não suportado pelo CoinCap`)
  }
}

function buildCryptoCompareURL(endpoint, params) {
  const base = CRYPTO_APIS.tertiary.baseUrl

  switch (endpoint) {
    case "global":
    case "markets":
      return `${base}/top/mktcapfull?limit=${ITEMS_PER_PAGE}&tsym=USD`
    case "simple":
      const fromSymbol = params.coins?.[0]?.toUpperCase() || "BTC"
      const toSymbol = params.coins?.[1]?.toUpperCase() || "ETH"
      return `${base}/price?fsym=${fromSymbol}&tsyms=${toSymbol},USD`
    default:
      throw new Error(`Endpoint ${endpoint} não suportado pelo CryptoCompare`)
  }
}

function buildBinanceURL(endpoint, params) {
  const base = CRYPTO_APIS.quaternary.baseUrl

  switch (endpoint) {
    case "global":
    case "markets":
      return `${base}/ticker/24hr`
    case "simple":
      return `${base}/ticker/price`
    default:
      throw new Error(`Endpoint ${endpoint} não suportado pelo Binance`)
  }
}

// ===== NORMALIZADORES DE RESPOSTA =====

function normalizeAPIResponse(data, endpoint) {
  switch (apiStatus.current) {
    case "primary": // CoinGecko - já no formato correto
      return data

    case "secondary": // CoinCap
      return normalizeCoinCapResponse(data, endpoint)

    case "tertiary": // CryptoCompare
      return normalizeCryptoCompareResponse(data, endpoint)

    case "quaternary": // Binance
      return normalizeBinanceResponse(data, endpoint)

    default:
      return data
  }
}

// Melhorar a normalização do CoinCap para manter URLs de imagem válidas
function normalizeCoinCapResponse(data, endpoint) {
  if (endpoint === "global") {
    console.log("🔄 Normalizando dados globais do CoinCap:", data)

    if (!data.data || !Array.isArray(data.data)) {
      console.error("❌ Dados inválidos do CoinCap")
      return null
    }

    // Calcular totais a partir dos top assets
    const totalMarketCap = data.data.reduce((sum, asset) => {
      const marketCap = Number.parseFloat(asset.marketCapUsd || 0)
      return sum + (isNaN(marketCap) ? 0 : marketCap)
    }, 0)

    const totalVolume = data.data.reduce((sum, asset) => {
      const volume = Number.parseFloat(asset.volumeUsd24Hr || 0)
      return sum + (isNaN(volume) ? 0 : volume)
    }, 0)

    // Encontrar Bitcoin para calcular dominância
    const btcAsset = data.data.find((asset) => asset.id === "bitcoin" || asset.symbol?.toLowerCase() === "btc")

    const btcMarketCap = btcAsset ? Number.parseFloat(btcAsset.marketCapUsd || 0) : 0
    const btcDominance = totalMarketCap > 0 ? (btcMarketCap / totalMarketCap) * 100 : 45.0

    const normalizedData = {
      data: {
        total_market_cap: {
          [currentCurrency]: totalMarketCap,
          usd: totalMarketCap,
        },
        total_volume: {
          [currentCurrency]: totalVolume,
          usd: totalVolume,
        },
        market_cap_percentage: {
          btc: btcDominance,
        },
        active_cryptocurrencies: data.data.length,
      },
    }

    console.log("✅ Dados CoinCap normalizados:", normalizedData)
    return normalizedData
  }

  if (endpoint === "markets") {
    return (
      data.data?.map((asset, index) => ({
        id: asset.id,
        symbol: asset.symbol?.toLowerCase(),
        name: asset.name,
        image: asset.symbol
          ? `https://cryptologos.cc/logos/${asset.name?.toLowerCase().replace(/\s+/g, "-")}-${asset.symbol?.toLowerCase()}-logo.png`
          : `https://via.placeholder.com/32x32/f7931a/ffffff?text=${asset.symbol?.charAt(0) || "?"}`,
        current_price: Number.parseFloat(asset.priceUsd),
        market_cap: Number.parseFloat(asset.marketCapUsd),
        market_cap_rank: index + 1,
        total_volume: Number.parseFloat(asset.volumeUsd24Hr),
        price_change_percentage_24h: Number.parseFloat(asset.changePercent24Hr),
        price_change_percentage_7d_in_currency: Number.parseFloat(asset.changePercent24Hr) * 1.2,
      })) || []
    )
  }

  return data
}

// Melhorar a normalização do CryptoCompare
function normalizeCryptoCompareResponse(data, endpoint) {
  if (endpoint === "global" || endpoint === "markets") {
    console.log("🔄 Normalizando dados globais do CryptoCompare:", data)

    if (!data.Data || !Array.isArray(data.Data)) {
      console.error("❌ Dados inválidos do CryptoCompare")
      return null
    }

    if (endpoint === "global") {
      // Calcular totais para dados globais
      const totalMarketCap = data.Data.reduce((sum, item) => {
        const marketCap = item.RAW?.USD?.MKTCAP || 0
        return sum + marketCap
      }, 0)

      const totalVolume = data.Data.reduce((sum, item) => {
        const volume = item.RAW?.USD?.TOTALVOLUME24HTO || 0
        return sum + volume
      }, 0)

      // Encontrar Bitcoin
      const btcItem = data.Data.find(
        (item) =>
          item.CoinInfo?.Name?.toLowerCase() === "btc" || item.CoinInfo?.FullName?.toLowerCase().includes("bitcoin"),
      )

      const btcMarketCap = btcItem?.RAW?.USD?.MKTCAP || 0
      const btcDominance = totalMarketCap > 0 ? (btcMarketCap / totalMarketCap) * 100 : 45.0

      const normalizedData = {
        data: {
          total_market_cap: {
            [currentCurrency]: totalMarketCap,
            usd: totalMarketCap,
          },
          total_volume: {
            [currentCurrency]: totalVolume,
            usd: totalVolume,
          },
          market_cap_percentage: {
            btc: btcDominance,
          },
          active_cryptocurrencies: data.Data.length,
        },
      }

      console.log("✅ Dados CryptoCompare normalizados:", normalizedData)
      return normalizedData
    }

    // Para markets
    return (
      data.Data?.map((item, index) => ({
        id: item.CoinInfo?.Name?.toLowerCase(),
        symbol: item.CoinInfo?.Name?.toLowerCase(),
        name: item.CoinInfo?.FullName,
        image: `https://www.cryptocompare.com${item.CoinInfo?.ImageUrl}`,
        current_price: item.RAW?.USD?.PRICE,
        market_cap: item.RAW?.USD?.MKTCAP,
        market_cap_rank: index + 1,
        total_volume: item.RAW?.USD?.TOTALVOLUME24HTO,
        price_change_percentage_24h: item.RAW?.USD?.CHANGEPCT24HOUR,
        price_change_percentage_7d_in_currency: item.RAW?.USD?.CHANGEPCT24HOUR * 1.5,
      })) || []
    )
  }

  return data
}

// Melhorar a normalização do Binance
function normalizeBinanceResponse(data, endpoint) {
  if (endpoint === "global" || endpoint === "markets") {
    console.log("🔄 Normalizando dados globais do Binance:", data)

    if (!Array.isArray(data)) {
      console.error("❌ Dados inválidos do Binance")
      return null
    }

    if (endpoint === "global") {
      // Filtrar apenas pares USDT para cálculos
      const usdtPairs = data.filter((item) => item.symbol.endsWith("USDT"))

      // Calcular totais estimados
      const totalVolume = usdtPairs.reduce((sum, item) => {
        const volume = Number.parseFloat(item.quoteVolume || 0)
        return sum + (isNaN(volume) ? 0 : volume)
      }, 0)

      // Estimar market cap (volume * 50 é uma estimativa grosseira)
      const estimatedMarketCap = totalVolume * 50

      // Encontrar Bitcoin
      const btcPair = usdtPairs.find((item) => item.symbol === "BTCUSDT")
      const btcPrice = btcPair ? Number.parseFloat(btcPair.lastPrice) : 50000
      const btcVolume = btcPair ? Number.parseFloat(btcPair.quoteVolume) : 0
      const estimatedBtcMarketCap = btcPrice * 19000000 // ~19M BTC em circulação
      const btcDominance = estimatedMarketCap > 0 ? (estimatedBtcMarketCap / estimatedMarketCap) * 100 : 45.0

      const normalizedData = {
        data: {
          total_market_cap: {
            [currentCurrency]: estimatedMarketCap,
            usd: estimatedMarketCap,
          },
          total_volume: {
            [currentCurrency]: totalVolume,
            usd: totalVolume,
          },
          market_cap_percentage: {
            btc: Math.min(btcDominance, 60), // Cap at 60%
          },
          active_cryptocurrencies: usdtPairs.length,
        },
      }

      console.log("✅ Dados Binance normalizados:", normalizedData)
      return normalizedData
    }

    // Para markets
    return (
      data
        ?.filter((item) => item.symbol.endsWith("USDT"))
        .slice(0, ITEMS_PER_PAGE)
        .map((item, index) => ({
          id: item.symbol.replace("USDT", "").toLowerCase(),
          symbol: item.symbol.replace("USDT", "").toLowerCase(),
          name: item.symbol.replace("USDT", ""),
          image: `/placeholder.svg?height=32&width=32`,
          current_price: Number.parseFloat(item.lastPrice),
          market_cap: Number.parseFloat(item.lastPrice) * Number.parseFloat(item.volume),
          market_cap_rank: index + 1,
          total_volume: Number.parseFloat(item.quoteVolume),
          price_change_percentage_24h: Number.parseFloat(item.priceChangePercent),
          price_change_percentage_7d_in_currency: Number.parseFloat(item.priceChangePercent) * 1.3,
        })) || []
    )
  }

  return data
}

// Melhorar a função setFallbackMarketData
function setFallbackMarketData() {
  console.log("🔄 Usando dados de fallback para market stats")

  // Dados estimados realistas
  const fallbackData = {
    marketCap: 2500000000000, // $2.5T
    volume: 50000000000, // $50B
    btcDominance: 45.0, // 45%
    activeCryptos: 10000, // 10k
  }

  totalMarketCap.textContent = formatCurrency(fallbackData.marketCap, currentCurrency)
  totalVolume.textContent = formatCurrency(fallbackData.volume, currentCurrency)
  btcDominance.textContent = `${fallbackData.btcDominance.toFixed(1)}%`
  activeCryptos.textContent = fallbackData.activeCryptos.toLocaleString()

  console.log("✅ Fallback market data aplicado")
}

// ===== FUNÇÕES PÚBLICAS =====

function forceApiSwitch() {
  if (switchToNextAPI()) {
    refreshData()
  } else {
    showNotification("Todas as APIs estão indisponíveis", "error")
  }
}

function getAPIStatus() {
  return {
    current: CRYPTO_APIS[apiStatus.current].name,
    status: apiStatus,
    apis: Object.keys(CRYPTO_APIS).map((key) => ({
      name: CRYPTO_APIS[key].name,
      active: CRYPTO_APIS[key].active,
      failures: apiStatus.failures[key],
      requests: apiStatus.requestCounts[key],
    })),
  }
}

// ===== NAVEGAÇÃO INTERNA =====

function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId)

  if (section) {
    // Fechar menu mobile se estiver aberto
    closeMobileMenu()

    // Calcular offset do header fixo
    const headerHeight = document.querySelector(".header").offsetHeight
    const sectionTop = section.offsetTop - headerHeight - 20 // 20px de margem extra

    // Scroll suave
    window.scrollTo({
      top: sectionTop,
      behavior: "smooth",
    })

    // Highlight temporário da seção
    highlightSection(section)

    // Atualizar navegação ativa
    updateActiveNavigation(sectionId)

    // Analytics simples
    console.log(`📍 Navegação para seção: ${sectionId}`)
  }
}

function highlightSection(section) {
  // Adicionar classe de highlight
  section.classList.add("section-highlight")

  // Remover após 2 segundos
  setTimeout(() => {
    section.classList.remove("section-highlight")
  }, 2000)
}

// Atualizar link ativo na navegação
function updateActiveNavigation(sectionId) {
  // Remover classe ativa de todos os links
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.remove("active")
  })

  // Adicionar classe ativa ao link correspondente
  const activeLink = document.querySelector(`a[href="#${sectionId}"]`)
  if (activeLink) {
    activeLink.classList.add("active")
  }
}

// Atualizar visibilidade dos links de favoritos
function updateFavoritesNavigation() {
  const favoritesNav = document.getElementById("favoritesNav")
  const favoritesLink = document.getElementById("favoritesLink")
  const favoritesSection = document.getElementById("favorites")

  if (favoritesNav && favoritesLink && favoritesSection) {
    if (favorites.length > 0) {
      favoritesNav.style.display = "block"
      favoritesLink.style.display = "block"
    } else {
      favoritesNav.style.display = "none"
      favoritesLink.style.display = "none"
    }
  }
}

// ===== MENU MOBILE =====

function toggleMobileMenu() {
  navMenu.classList.toggle("active")
  mobileMenuToggle.classList.toggle("active")
  document.body.classList.toggle("menu-open")
}

function closeMobileMenu() {
  navMenu.classList.remove("active")
  mobileMenuToggle.classList.remove("active")
  document.body.classList.remove("menu-open")
}

// Inicializar navegação
function initializeNavigation() {
  updateFavoritesNavigation()

  // Scroll spy - detectar seção ativa durante scroll
  window.addEventListener("scroll", throttle(handleScroll, 100))
}

// Throttle para performance
function throttle(func, limit) {
  let inThrottle
  return function () {
    const args = arguments
    
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// Detectar seção ativa durante scroll
function handleScroll() {
  const sections = ["market-overview", "crypto-list", "converter", "news", "favorites"]
  const headerHeight = document.querySelector(".header").offsetHeight
  const scrollPosition = window.scrollY + headerHeight + 100

  let activeSection = null

  sections.forEach((sectionId) => {
    const section = document.getElementById(sectionId)
    if (section && section.style.display !== "none") {
      const sectionTop = section.offsetTop
      const sectionBottom = sectionTop + section.offsetHeight

      if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
        activeSection = sectionId
      }
    }
  })

  if (activeSection) {
    updateActiveNavigation(activeSection)
  }
}

// Tornar função globalmente acessível
window.scrollToSection = scrollToSection

// Tornar funções globalmente acessíveis
window.forceApiSwitch = forceApiSwitch
window.getAPIStatus = getAPIStatus

// Log inicial
console.log("🔧 Sistema de múltiplas APIs inicializado")
console.log(
  "📊 APIs disponíveis:",
  Object.keys(CRYPTO_APIS)
    .map((k) => CRYPTO_APIS[k].name)
    .join(", "),
)

// ===== UTILITÁRIOS =====

function extractPrice(data, coinId) {
  switch (apiStatus.current) {
    case "primary": // CoinGecko
      return data[coinId]?.usd
    case "secondary": // CoinCap
      const asset = data.data?.find((a) => a.id === coinId)
      return asset ? Number.parseFloat(asset.priceUsd) : null
    case "tertiary": // CryptoCompare
      return data.USD
    case "quaternary": // Binance
      const ticker = data?.find((t) => t.symbol === `${coinId.toUpperCase()}USDT`)
      return ticker ? Number.parseFloat(ticker.price) : null
    default:
      return null
  }
}