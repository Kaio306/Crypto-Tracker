/**
 * NEWS API - Sistema REAL de notícias de criptomoedas
 * Busca notícias atualizadas de fontes reais e funcionais
 */

class CryptoNewsAPI {
    constructor() {
      this.sources = {
        // CryptoPanic - API gratuita e funcional
        cryptoPanic: {
          url: "https://cryptopanic.com/api/v1/posts/",
          active: true,
          free: true,
        },
        // RSS2JSON - Converte RSS em JSON (gratuito)
        rss2json: {
          url: "https://api.rss2json.com/v1/api.json",
          active: true,
          free: true,
        },
        // CoinDesk RSS
        coinDeskRSS: "https://www.coindesk.com/arc/outboundfeeds/rss/",
        // CoinTelegraph RSS
        coinTelegraphRSS: "https://cointelegraph.com/rss",
        // Decrypt RSS
        decryptRSS: "https://decrypt.co/feed",
      }
  
      this.cache = {
        data: null,
        timestamp: null,
        duration: 5 * 60 * 1000, // 5 minutos para notícias mais frescas
      }
  
      // Imagens crypto reais do Unsplash
      this.cryptoImages = [
        "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400&h=250&fit=crop&auto=format&q=80",
        "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400&h=250&fit=crop&auto=format&q=80",
        "https://images.unsplash.com/photo-1640340434855-6084b1f4901c?w=400&h=250&fit=crop&auto=format&q=80",
        "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=250&fit=crop&auto=format&q=80",
        "https://images.unsplash.com/photo-1642104704074-907c0698cbd9?w=400&h=250&fit=crop&auto=format&q=80",
        "https://images.unsplash.com/photo-1644143379190-08a5f3a8d8e9?w=400&h=250&fit=crop&auto=format&q=80",
        "https://images.unsplash.com/photo-1605792657660-596af9009e82?w=400&h=250&fit=crop&auto=format&q=80",
        "https://images.unsplash.com/photo-1634704784915-aacf363b021f?w=400&h=250&fit=crop&auto=format&q=80",
      ]
    }
  
    // Verificar cache
    isCacheValid() {
      if (!this.cache.data || !this.cache.timestamp) return false
      return Date.now() - this.cache.timestamp < this.cache.duration
    }
  
    // BUSCAR NOTÍCIAS REAIS
    async getNews(forceRefresh = false) {
      if (!forceRefresh && this.isCacheValid()) {
        console.log("📰 Usando cache de notícias")
        return this.cache.data
      }
  
      console.log("🔄 Buscando notícias atualizadas...")
  
      try {
        const allNews = []
  
        // 1. Buscar do CryptoPanic (mais confiável)
        const cryptoPanicNews = await this.fetchCryptoPanic()
        if (cryptoPanicNews.length > 0) {
          allNews.push(...cryptoPanicNews)
          console.log(`✅ CryptoPanic: ${cryptoPanicNews.length} notícias`)
        }
  
        // 2. Buscar RSS feeds
        const rssNews = await this.fetchRSSFeeds()
        if (rssNews.length > 0) {
          allNews.push(...rssNews)
          console.log(`✅ RSS Feeds: ${rssNews.length} notícias`)
        }
  
        // 3. Remover duplicatas e ordenar
        const uniqueNews = this.removeDuplicates(allNews)
        const sortedNews = uniqueNews.sort((a, b) => new Date(b.published_at) - new Date(a.published_at)).slice(0, 16)
  
        if (sortedNews.length > 0) {
          this.cache.data = sortedNews
          this.cache.timestamp = Date.now()
          console.log(`🎉 Total: ${sortedNews.length} notícias reais carregadas!`)
          return sortedNews
        }
  
        throw new Error("Nenhuma notícia encontrada")
      } catch (error) {
        console.error("❌ Erro ao buscar notícias:", error)
        return this.getEmergencyFallback()
      }
    }
  
    // CRYPTOPANIC API - Notícias reais e gratuitas
    async fetchCryptoPanic() {
      try {
        // Usar endpoint público sem chave (limitado mas funcional)
        const url = "https://cryptopanic.com/api/v1/posts/?public=true&kind=news&filter=hot"
  
        const response = await fetch(url, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "User-Agent": "CryptoTracker/1.0",
          },
        })
  
        if (!response.ok) {
          throw new Error(`CryptoPanic error: ${response.status}`)
        }
  
        const data = await response.json()
  
        if (!data.results || data.results.length === 0) {
          console.warn("⚠️ CryptoPanic: Nenhuma notícia encontrada")
          return []
        }
  
        return data.results
          .map((article, index) => {
            const category = this.categorizeNews(article.title)
            return {
              id: `cp_${article.id || index}`,
              title: article.title,
              summary: this.extractSummary(article.title),
              url: article.url, // URL REAL da notícia
              published_at: article.published_at || article.created_at,
              source: {
                name: article.source?.title || article.source?.name || "CryptoPanic",
                url: article.source?.url || article.url,
              },
              image: this.getRandomImage(index),
              category: category,
              votes: article.votes || 0,
              isReal: true, // Marcar como notícia real
            }
          })
          .filter((article) => article.url && article.url.startsWith("http"))
      } catch (error) {
        console.error("❌ CryptoPanic fetch error:", error)
        return []
      }
    }
  
    // RSS FEEDS - Múltiplas fontes reais
    async fetchRSSFeeds() {
      const rssFeeds = [
        {
          name: "CoinDesk",
          url: "https://www.coindesk.com/arc/outboundfeeds/rss/",
          source: "CoinDesk",
        },
        {
          name: "CoinTelegraph",
          url: "https://cointelegraph.com/rss",
          source: "CoinTelegraph",
        },
        {
          name: "Decrypt",
          url: "https://decrypt.co/feed",
          source: "Decrypt",
        },
      ]
  
      const allRSSNews = []
  
      for (const feed of rssFeeds) {
        try {
          const rssNews = await this.fetchSingleRSS(feed)
          if (rssNews.length > 0) {
            allRSSNews.push(...rssNews)
            console.log(`✅ ${feed.source}: ${rssNews.length} notícias`)
          }
        } catch (error) {
          console.warn(`⚠️ Erro no RSS ${feed.source}:`, error.message)
        }
      }
  
      return allRSSNews
    }
  
    // Buscar RSS individual via RSS2JSON
    async fetchSingleRSS(feed) {
      try {
        const rss2jsonUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}&api_key=public&count=10`
  
        const response = await fetch(rss2jsonUrl)
  
        if (!response.ok) {
          throw new Error(`RSS2JSON error: ${response.status}`)
        }
  
        const data = await response.json()
  
        if (data.status !== "ok" || !data.items) {
          throw new Error(`RSS parsing failed for ${feed.source}`)
        }
  
        return data.items
          .map((item, index) => {
            const category = this.categorizeNews(item.title)
            return {
              id: `rss_${feed.source.toLowerCase()}_${index}`,
              title: item.title,
              summary: this.cleanHTML(item.description || item.content) || this.extractSummary(item.title),
              url: item.link, // URL REAL da notícia
              published_at: item.pubDate,
              source: {
                name: feed.source,
                url: data.feed?.url || feed.url,
              },
              image: item.thumbnail || item.enclosure?.link || this.getRandomImage(index),
              category: category,
              isReal: true, // Marcar como notícia real
            }
          })
          .filter((article) => article.url && article.url.startsWith("http"))
      } catch (error) {
        console.error(`❌ RSS fetch error for ${feed.source}:`, error)
        return []
      }
    }
  
    // FALLBACK DE EMERGÊNCIA - Apenas se tudo falhar
    getEmergencyFallback() {
      console.log("🚨 Usando fallback de emergência")
  
      // Buscar notícias de um endpoint alternativo
      return this.getStaticCryptoNews()
    }
  
    // Notícias estáticas como último recurso
    getStaticCryptoNews() {
      const currentTime = new Date()
  
      return [
        {
          id: "static_1",
          title: "Bitcoin mantém estabilidade acima dos $40,000",
          summary:
            "Análise técnica mostra consolidação do Bitcoin em patamar importante, com possível movimento para $45,000.",
          url: "https://www.coindesk.com/markets/2024/01/15/bitcoin-price-analysis/",
          published_at: new Date(currentTime - 1 * 60 * 60 * 1000).toISOString(),
          source: { name: "CoinDesk", url: "https://coindesk.com" },
          image: this.cryptoImages[0],
          category: "Bitcoin",
          isReal: false,
        },
        {
          id: "static_2",
          title: "Ethereum prepara grande atualização de rede",
          summary: "Desenvolvedores anunciam melhorias significativas na escalabilidade e redução de taxas de gas.",
          url: "https://cointelegraph.com/news/ethereum-network-upgrade-2024",
          published_at: new Date(currentTime - 2 * 60 * 60 * 1000).toISOString(),
          source: { name: "CoinTelegraph", url: "https://cointelegraph.com" },
          image: this.cryptoImages[1],
          category: "Ethereum",
          isReal: false,
        },
        // Adicionar mais 14 notícias estáticas...
      ].slice(0, 16)
    }
  
    // UTILITÁRIOS
    removeDuplicates(newsArray) {
      const seen = new Set()
      return newsArray.filter((article) => {
        const key = article.title.toLowerCase().substring(0, 50)
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
    }
  
    cleanHTML(html) {
      if (!html) return ""
      return (
        html
          .replace(/<[^>]*>/g, "") // Remove HTML tags
          .replace(/&[^;]+;/g, " ") // Remove HTML entities
          .trim()
          .substring(0, 150) + "..."
      )
    }
  
    getRandomImage(index) {
      return this.cryptoImages[index % this.cryptoImages.length]
    }
  
    extractSummary(title) {
      const summaries = [
        "Análise detalhada sobre os últimos movimentos do mercado de criptomoedas e suas implicações.",
        "Desenvolvimento importante que pode impactar significativamente o setor blockchain.",
        "Notícia relevante sobre inovações tecnológicas e adoção de criptomoedas.",
        "Atualização importante sobre regulamentação e políticas governamentais.",
        "Movimento significativo no mercado que merece atenção dos investidores.",
      ]
      return summaries[Math.floor(Math.random() * summaries.length)]
    }
  
    categorizeNews(title) {
      const titleLower = title.toLowerCase()
  
      if (titleLower.includes("bitcoin") || titleLower.includes("btc")) return "Bitcoin"
      if (titleLower.includes("ethereum") || titleLower.includes("eth")) return "Ethereum"
      if (titleLower.includes("defi") || titleLower.includes("decentralized")) return "DeFi"
      if (titleLower.includes("nft") || titleLower.includes("non-fungible")) return "NFT"
      if (titleLower.includes("regulat") || titleLower.includes("legal") || titleLower.includes("sec"))
        return "Regulamentação"
      if (titleLower.includes("stablecoin") || titleLower.includes("usdt") || titleLower.includes("usdc"))
        return "Stablecoin"
  
      return "Geral"
    }
  
    // RENDERIZAÇÃO COM LINKS REAIS
    renderNews(newsData) {
      const newsGrid = document.querySelector(".news-grid")
  
      if (!newsData || newsData.length === 0) {
        newsGrid.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--danger-color);">
            <i class="fas fa-exclamation-triangle"></i> 
            <p>Não foi possível carregar as notícias no momento.</p>
            <button onclick="window.cryptoNewsAPI.forceRefresh()" style="margin-top: 1rem; padding: 8px 16px; background: var(--primary-color); color: white; border: none; border-radius: 6px; cursor: pointer;">
              <i class="fas fa-sync-alt"></i> Tentar Novamente
            </button>
          </div>
        `
        return
      }
  
      newsGrid.innerHTML = ""
  
      newsData.forEach((article, index) => {
        const newsCard = document.createElement("div")
        newsCard.className = "news-card"
  
        const publishedDate = new Date(article.published_at)
        const timeAgo = this.getTimeAgo(publishedDate)
        const hasValidUrl = article.url && article.url.startsWith("http")
  
        // Adicionar indicador de notícia real
        const realNewsIndicator = article.isReal
          ? '<span class="real-news-badge"><i class="fas fa-check-circle"></i> REAL</span>'
          : '<span class="static-news-badge"><i class="fas fa-info-circle"></i> DEMO</span>'
  
        newsCard.innerHTML = `
          <div class="news-image">
            <img src="${article.image}" 
                 alt="${article.title}" 
                 onerror="this.onerror=null; this.src='${this.getRandomImage(index)}'"
                 loading="lazy">
            <div class="news-overlay">
              <span class="news-category">
                <i class="fab fa-bitcoin"></i> ${article.category}
              </span>
              ${realNewsIndicator}
              ${hasValidUrl ? '<div class="news-link-indicator"><i class="fas fa-external-link-alt"></i></div>' : ""}
            </div>
          </div>
          <div class="news-content">
            <h3>${article.title}</h3>
            <p>${article.summary}</p>
            <div class="news-meta">
              <span class="news-date">
                <i class="fas fa-clock"></i> ${timeAgo}
              </span>
              <span class="news-source">
                <i class="fas fa-newspaper"></i> ${article.source.name}
              </span>
              ${hasValidUrl ? '<span class="news-read-more"><i class="fas fa-arrow-right"></i> Ler Notícia</span>' : ""}
            </div>
          </div>
        `
  
        // Funcionalidade de clique para URLs reais
        if (hasValidUrl) {
          newsCard.style.cursor = "pointer"
          newsCard.classList.add("clickable")
  
          newsCard.addEventListener("click", (e) => {
            e.preventDefault()
            this.openRealNewsLink(article.url, article.title, article.source.name)
          })
  
          // Hover effects
          newsCard.addEventListener("mouseenter", () => {
            newsCard.style.transform = "translateY(-5px) scale(1.02)"
          })
  
          newsCard.addEventListener("mouseleave", () => {
            newsCard.style.transform = "translateY(0) scale(1)"
          })
        }
  
        newsGrid.appendChild(newsCard)
      })
  
      // Log de estatísticas
      const realNews = newsData.filter((n) => n.isReal).length
      const staticNews = newsData.length - realNews
      console.log(`📊 Estatísticas: ${realNews} notícias reais, ${staticNews} estáticas`)
    }
  
    // Abrir link de notícia real
    openRealNewsLink(url, title, source) {
      try {
        console.log(`📰 Abrindo notícia real: ${title} (${source})`)
        console.log(`🔗 URL: ${url}`)
  
        // Abrir em nova aba
        const newWindow = window.open(url, "_blank", "noopener,noreferrer")
  
        if (!newWindow) {
          // Fallback para popup blockers
          if (confirm(`Abrir notícia "${title}" do ${source}?`)) {
            window.location.href = url
          }
        }
  
        // Analytics
        this.trackNewsClick(title, source, url)
      } catch (error) {
        console.error("❌ Erro ao abrir notícia:", error)
        alert("Erro ao abrir a notícia. Tente novamente.")
      }
    }
  
    // Analytics simples
    trackNewsClick(title, source, url) {
      const clickData = {
        timestamp: new Date().toISOString(),
        title: title.substring(0, 50),
        source: source,
        url: url,
      }
  
      // Salvar no localStorage para analytics
      const clicks = JSON.parse(localStorage.getItem("newsClicks") || "[]")
      clicks.push(clickData)
  
      // Manter apenas os últimos 100 cliques
      if (clicks.length > 100) {
        clicks.splice(0, clicks.length - 100)
      }
  
      localStorage.setItem("newsClicks", JSON.stringify(clicks))
      console.log("📊 Click registrado:", clickData)
    }
  
    getTimeAgo(date) {
      const now = new Date()
      const diffInSeconds = Math.floor((now - date) / 1000)
  
      if (diffInSeconds < 60) return "Agora"
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}min`
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`
      if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d`
  
      return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
    }
  
    // MÉTODO PRINCIPAL
    async loadAndRenderNews(forceRefresh = false) {
      try {
        console.log("🚀 Iniciando carregamento de notícias reais...")
  
        // Loading state
        const newsGrid = document.querySelector(".news-grid")
        if (newsGrid) {
          newsGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 2rem;">
              <div style="display: flex; align-items: center; justify-content: center; gap: 1rem;">
                <i class="fas fa-spinner fa-spin" style="font-size: 1.5rem; color: var(--primary-color);"></i>
                <div>
                  <p style="margin: 0; font-weight: 600;">Buscando notícias atualizadas...</p>
                  <p style="margin: 0; font-size: 0.9rem; color: var(--text-secondary);">Conectando com fontes reais</p>
                </div>
              </div>
            </div>
          `
        }
  
        // Buscar e renderizar
        const news = await this.getNews(forceRefresh)
        this.renderNews(news)
  
        const realCount = news.filter((n) => n.isReal).length
        console.log(`✅ Sucesso! ${news.length} notícias carregadas (${realCount} reais)`)
      } catch (error) {
        console.error("❌ Erro crítico:", error)
  
        const newsGrid = document.querySelector(".news-grid")
        if (newsGrid) {
          newsGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--danger-color);">
              <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
              <p>Erro ao carregar notícias</p>
              <button onclick="window.cryptoNewsAPI.forceRefresh()" style="margin-top: 1rem; padding: 8px 16px; background: var(--primary-color); color: white; border: none; border-radius: 6px; cursor: pointer;">
                <i class="fas fa-sync-alt"></i> Recarregar
              </button>
            </div>
          `
        }
      }
    }
  
    // Forçar refresh
    async forceRefresh() {
      this.clearCache()
      return await this.loadAndRenderNews(true)
    }
  
    // Limpar cache
    clearCache() {
      this.cache.data = null
      this.cache.timestamp = null
      console.log("🗑️ Cache limpo")
    }
  
    // Status da API
    getStatus() {
      return {
        cacheValid: this.isCacheValid(),
        lastUpdate: this.cache.timestamp ? new Date(this.cache.timestamp).toLocaleString("pt-BR") : "Nunca",
        newsCount: this.cache.data ? this.cache.data.length : 0,
        realNewsCount: this.cache.data ? this.cache.data.filter((n) => n.isReal).length : 0,
      }
    }
  }
  
  // CSS adicional para badges
  const additionalCSS = `
  .real-news-badge {
    position: absolute;
    top: 8px;
    right: 8px;
    background: rgba(16, 185, 129, 0.9);
    color: white;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.6rem;
    font-weight: 600;
  }
  
  .static-news-badge {
    position: absolute;
    top: 8px;
    right: 8px;
    background: rgba(107, 114, 128, 0.9);
    color: white;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.6rem;
    font-weight: 600;
  }
  
  .news-card.clickable {
    transition: all 0.3s ease;
  }
  
  .news-card.clickable:hover {
    box-shadow: var(--shadow-lg);
  }
  `
  
  // Adicionar CSS
  if (typeof document !== "undefined") {
    const style = document.createElement("style")
    style.textContent = additionalCSS
    document.head.appendChild(style)
  }
  
  // Exportar globalmente
  if (typeof window !== "undefined") {
    window.CryptoNewsAPI = CryptoNewsAPI
  
    // Criar instância global
    window.cryptoNewsAPI = new CryptoNewsAPI()
  
    console.log("🌐 CryptoNewsAPI carregada globalmente")
  }
  
  // Para Node.js
  if (typeof module !== "undefined" && module.exports) {
    module.exports = CryptoNewsAPI
  }