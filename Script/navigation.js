/**
 * SISTEMA DE NAVEGAÇÃO ENTRE TELAS
 * Gerencia a navegação entre Dashboard Principal e Analytics
 */

class NavigationManager {
    constructor() {
      this.currentPage = this.getCurrentPage()
      this.init()
    }
  
    getCurrentPage() {
      const path = window.location.pathname
      if (path.includes("analytics.html")) {
        return "analytics"
      }
      return "dashboard"
    }
  
    init() {
      this.setupNavigationEvents()
      this.updateActiveNavigation()
      this.addNavigationIndicators()
    }
  
    setupNavigationEvents() {
      // Interceptar cliques nos links de navegação
      document.addEventListener("click", (e) => {
        const navLink = e.target.closest(".nav-link, .analytics-btn")
  
        if (navLink && navLink.href) {
          // Adicionar loading state
          this.showNavigationLoading(navLink)
  
          // Salvar estado atual
          this.saveCurrentState()
  
          // Log da navegação
          console.log(`🧭 Navegando para: ${navLink.href}`)
        }
      })
  
      // Detectar mudanças de página
      window.addEventListener("beforeunload", () => {
        this.saveCurrentState()
      })
  
      // Restaurar estado ao carregar
      window.addEventListener("load", () => {
        this.restoreState()
      })
    }
  
    showNavigationLoading(element) {
      const originalContent = element.innerHTML
      element.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Carregando...'
      element.style.pointerEvents = "none"
  
      // Restaurar após um tempo (caso a navegação falhe)
      setTimeout(() => {
        element.innerHTML = originalContent
        element.style.pointerEvents = "auto"
      }, 3000)
    }
  
    updateActiveNavigation() {
      // Remover classe active de todos os links
      document.querySelectorAll(".nav-link").forEach((link) => {
        link.classList.remove("active")
      })
  
      // Adicionar classe active ao link atual
      const currentLink = document.querySelector(
        this.currentPage === "analytics" ? 'a[href="analytics.html"]' : 'a[href="index.html"]',
      )
  
      if (currentLink) {
        currentLink.classList.add("active")
      }
    }
  
    addNavigationIndicators() {
      // Adicionar breadcrumb
      this.createBreadcrumb()
  
      // Adicionar indicador de página ativa
      this.addPageIndicator()
    }
  
    createBreadcrumb() {
      const breadcrumbContainer = document.createElement("div")
      breadcrumbContainer.className = "breadcrumb"
      breadcrumbContainer.innerHTML = `
        <div class="breadcrumb-container">
          <a href="index.html" class="breadcrumb-item ${this.currentPage === "dashboard" ? "active" : ""}">
            <i class="fas fa-home"></i>
            Dashboard
          </a>
          <span class="breadcrumb-separator">
            <i class="fas fa-chevron-right"></i>
          </span>
          <a href="analytics.html" class="breadcrumb-item ${this.currentPage === "analytics" ? "active" : ""}">
            <i class="fas fa-chart-line"></i>
            Analytics
          </a>
        </div>
      `
  
      // Inserir breadcrumb no header
      const header = document.querySelector(".header")
      if (header && !document.querySelector(".breadcrumb")) {
        header.appendChild(breadcrumbContainer)
      }
    }
  
    addPageIndicator() {
      const pageTitle = document.title
      const indicator = document.createElement("div")
      indicator.className = "page-indicator"
      indicator.innerHTML = `
        <div class="page-status">
          <i class="fas fa-circle"></i>
          <span>${this.currentPage === "analytics" ? "Analytics" : "Dashboard"}</span>
        </div>
      `
  
      // Adicionar ao footer
      const footer = document.querySelector(".footer-bottom")
      if (footer && !document.querySelector(".page-indicator")) {
        footer.appendChild(indicator)
      }
    }
  
    saveCurrentState() {
      const state = {
        page: this.currentPage,
        timestamp: Date.now(),
        scrollPosition: window.scrollY,
        theme: document.documentElement.getAttribute("data-theme"),
      }
  
      // Salvar estado específico da página
      if (this.currentPage === "dashboard") {
        state.selectedCurrency = document.getElementById("currencySelect")?.value
        state.searchQuery = document.getElementById("searchInput")?.value
      } else if (this.currentPage === "analytics") {
        state.selectedCrypto = document.getElementById("cryptoSelect")?.value
        state.selectedPeriod = document.getElementById("periodSelect")?.value
      }
  
      localStorage.setItem("cryptoTracker_navigationState", JSON.stringify(state))
      console.log("💾 Estado salvo:", state)
    }
  
    restoreState() {
      try {
        const savedState = localStorage.getItem("cryptoTracker_navigationState")
        if (!savedState) return
  
        const state = JSON.parse(savedState)
  
        // Restaurar apenas se for da mesma página
        if (state.page !== this.currentPage) return
  
        // Restaurar tema
        if (state.theme) {
          document.documentElement.setAttribute("data-theme", state.theme)
        }
  
        // Restaurar estado específico da página
        if (this.currentPage === "dashboard") {
          if (state.selectedCurrency) {
            const currencySelect = document.getElementById("currencySelect")
            if (currencySelect) currencySelect.value = state.selectedCurrency
          }
          if (state.searchQuery) {
            const searchInput = document.getElementById("searchInput")
            if (searchInput) searchInput.value = state.searchQuery
          }
        } else if (this.currentPage === "analytics") {
          if (state.selectedCrypto) {
            const cryptoSelect = document.getElementById("cryptoSelect")
            if (cryptoSelect) cryptoSelect.value = state.selectedCrypto
          }
          if (state.selectedPeriod) {
            const periodSelect = document.getElementById("periodSelect")
            if (periodSelect) periodSelect.value = state.selectedPeriod
          }
        }
  
        // Restaurar posição de scroll (com delay)
        if (state.scrollPosition) {
          setTimeout(() => {
            window.scrollTo(0, state.scrollPosition)
          }, 100)
        }
  
        console.log("🔄 Estado restaurado:", state)
      } catch (error) {
        console.error("❌ Erro ao restaurar estado:", error)
      }
    }
  
    // Método público para navegação programática
    navigateTo(page) {
      const urls = {
        dashboard: "index.html",
        analytics: "analytics.html",
      }
  
      if (urls[page]) {
        this.saveCurrentState()
        window.location.href = urls[page]
      }
    }
  
    // Método para adicionar notificação de navegação
    showNavigationNotification(message, type = "info") {
      const notification = document.createElement("div")
      notification.className = `navigation-notification ${type}`
      notification.innerHTML = `
        <i class="fas fa-info-circle"></i>
        <span>${message}</span>
      `
  
      document.body.appendChild(notification)
  
      // Mostrar notificação
      setTimeout(() => {
        notification.classList.add("show")
      }, 100)
  
      // Remover após 3 segundos
      setTimeout(() => {
        notification.classList.remove("show")
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification)
          }
        }, 300)
      }, 3000)
    }
  }
  
  // CSS para navegação
  const navigationCSS = `
  .breadcrumb {
    background: rgba(0, 0, 0, 0.05);
    padding: 0.5rem 0;
    border-top: 1px solid var(--border-color);
  }
  
  .breadcrumb-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 2rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
  }
  
  .breadcrumb-item {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    color: var(--text-secondary);
    text-decoration: none;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    transition: all 0.3s ease;
  }
  
  .breadcrumb-item:hover {
    color: var(--primary-color);
    background: rgba(247, 147, 26, 0.1);
  }
  
  .breadcrumb-item.active {
    color: var(--primary-color);
    font-weight: 600;
  }
  
  .breadcrumb-separator {
    color: var(--text-secondary);
    font-size: 0.7rem;
  }
  
  .page-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 1rem;
  }
  
  .page-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: rgba(247, 147, 26, 0.1);
    border-radius: 20px;
    font-size: 0.8rem;
    color: var(--primary-color);
    font-weight: 500;
  }
  
  .page-status i {
    font-size: 0.6rem;
    animation: pulse 2s infinite;
  }
  
  .navigation-notification {
    position: fixed;
    top: 100px;
    right: 20px;
    background: var(--info-color);
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
    z-index: 10000;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    box-shadow: var(--shadow-lg);
  }
  
  .navigation-notification.show {
    transform: translateX(0);
  }
  
  .navigation-notification.success {
    background: var(--success-color);
  }
  
  .navigation-notification.error {
    background: var(--danger-color);
  }
  
  @media (max-width: 768px) {
    .breadcrumb-container {
      padding: 0 1rem;
      font-size: 0.8rem;
    }
    
    .breadcrumb-item span {
      display: none;
    }
    
    .page-indicator {
      margin-top: 0.5rem;
    }
  }
  `
  
  // Adicionar CSS
  if (typeof document !== "undefined") {
    const style = document.createElement("style")
    style.textContent = navigationCSS
    document.head.appendChild(style)
  }
  
  // Inicializar navegação quando DOM estiver pronto
  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", () => {
      window.navigationManager = new NavigationManager()
      console.log("🧭 Sistema de navegação inicializado")
    })
  }
  
  // Exportar para uso global
  if (typeof window !== "undefined") {
    window.NavigationManager = NavigationManager
  }