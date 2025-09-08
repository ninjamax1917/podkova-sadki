// Логика интерфейса сайта: год в футере, плавные якоря, кнопка «наверх», восстановление позиции и фокуса

function initYear() {
  const yearEl = document.getElementById('year')
  if (yearEl) yearEl.textContent = String(new Date().getFullYear())
}

// Определение типа навигации (reload / back_forward / navigate)
function getNavigationType() {
  try {
    const nav = performance.getEntriesByType('navigation')[0]
    if (nav && nav.type) return nav.type
  } catch {}
  // fallback для старых браузеров
  try {
    const t = performance.navigation && performance.navigation.type
    if (t === 1) return 'reload'
    if (t === 2) return 'back_forward'
  } catch {}
  return 'navigate'
}

// Восстановление прокрутки и фокуса при reload/BFCache на всех устройствах
function initScrollAndFocusRestore() {
  try {
    if ('scrollRestoration' in history) {
      // Управляем скроллом вручную, чтобы вести себя одинаково везде
      history.scrollRestoration = 'manual'
    }
  } catch {}

  const storageKey = `restore:${location.pathname}${location.search}`

  const isNaturallyFocusable = (el) => {
    if (!el) return false
    const focusableSelectors = [
      'a[href]', 'area[href]', 'input:not([disabled])', 'select:not([disabled])',
      'textarea:not([disabled])', 'button:not([disabled])', 'iframe', 'object',
      'embed', '[tabindex]:not([tabindex="-1"])', '[contenteditable="true"]'
    ]
    return el.matches?.(focusableSelectors.join(','))
  }

  const saveState = () => {
    try {
      const active = document.activeElement
      const activeId = active && active !== document.body && active !== document.documentElement && (active.id || null)
      const state = { x: window.scrollX, y: window.scrollY, activeId, ts: Date.now() }
      sessionStorage.setItem(storageKey, JSON.stringify(state))
    } catch {}
  }

  // Троттлинг, чтобы не спамить сессию
  let saveT = 0
  const throttledSave = () => {
    const now = Date.now()
    if (now - saveT > 150) {
      saveT = now
      saveState()
    }
  }

  window.addEventListener('scroll', throttledSave, { passive: true })
  window.addEventListener('focusin', throttledSave, true)
  window.addEventListener('beforeunload', saveState)
  window.addEventListener('pagehide', saveState)
  document.addEventListener('visibilitychange', () => { if (document.hidden) saveState() })

  const maybeRestore = (reason) => {
    try {
      const raw = sessionStorage.getItem(storageKey)
      if (!raw) return false
      const st = JSON.parse(raw)
      if (!st || typeof st.y !== 'number') return false

      // Не перебиваем переход к якорю из адресной строки
      if (location.hash && reason === 'navigate') return false

      const doScrollIfNeeded = () => {
        // Если раннее восстановление уже произошло в <head> — пропускаем повторный скролл
        if (window.__didEarlyRestore) return
        const html = document.documentElement
        const prev = html.style.scrollBehavior
        html.style.scrollBehavior = 'auto'
        window.scrollTo(st.x || 0, st.y || 0)
        requestAnimationFrame(() => {
          window.scrollTo(st.x || 0, st.y || 0)
          html.style.scrollBehavior = prev || ''
        })
      }

      // Скроллим после того как контент разложится
      setTimeout(doScrollIfNeeded, 0)

      if (st.activeId) {
        const el = document.getElementById(st.activeId)
        if (el) {
          const restoreTabindex = !isNaturallyFocusable(el)
          if (restoreTabindex) el.setAttribute('tabindex', '-1')
          try {
            el.focus({ preventScroll: true })
          } catch {
            // ignore
          }
          if (restoreTabindex) {
            // Удалим tabindex после потери фокуса, чтобы не ломать таб-цикл
            el.addEventListener('blur', () => el.removeAttribute('tabindex'), { once: true })
          }
        }
      }
      return true
    } catch { return false }
  }

  const navType = getNavigationType()
  // pageshow для BFCache, load для обычной перезагрузки
  window.addEventListener('pageshow', (e) => {
    const reason = e.persisted ? 'back_forward' : navType
    maybeRestore(reason)
  })
  window.addEventListener('load', () => {
    // В некоторых браузерах pageshow не срабатывает с нужными флагами
    maybeRestore(navType)
  }, { once: true })

  // Помечаем для других модулей, что у нас есть сохранённое состояние
  try {
    const flagKey = `restore:has:${location.pathname}${location.search}`
    const hadState = sessionStorage.getItem(storageKey) ? '1' : ''
    sessionStorage.setItem(flagKey, hadState)
  } catch {}
}

// На мобильных при обновлении страницы ранее принудительно скроллили к началу геро-секции.
// Теперь делаем это только если НЕ планируется восстановление позиции и нет сохранённого состояния.
function ensureTopOnMobileRefresh() {
  try {
    if ('scrollRestoration' in history) {
      // не меняем: управляется в initScrollAndFocusRestore
    }
  } catch {}

  const isMobile = () => window.matchMedia('(max-width: 639px)').matches
  const noHash = () => !window.location.hash

  const hasRestoreState = () => {
    try {
      const storageKey = `restore:${location.pathname}${location.search}`
      const raw = sessionStorage.getItem(storageKey)
      if (!raw) return false
      const st = JSON.parse(raw)
      return st && typeof st.y === 'number' && st.y > 0
    } catch { return false }
  }

  const jumpTopInstant = () => {
    const html = document.documentElement
    const prev = html.style.scrollBehavior
    html.style.scrollBehavior = 'auto'
    // Двойной вызов для надёжности (iOS/Safari)
    window.scrollTo(0, 0)
    document.body.scrollTop = 0
    document.documentElement.scrollTop = 0
    requestAnimationFrame(() => {
      window.scrollTo(0, 0)
      html.style.scrollBehavior = prev || ''
    })
  }

  const maybeJump = () => {
  // Не мешаем восстановлению прокрутки
  if (isMobile() && noHash() && !hasRestoreState()) jumpTopInstant()
  }

  // На первичную загрузку
  if (document.readyState === 'complete') {
    maybeJump()
  } else {
    window.addEventListener('load', maybeJump, { once: true })
  }
  // Для Safari BFCache
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) maybeJump()
  })
}

function initSmoothAnchors() {
  const anchorLinks = document.querySelectorAll('header a[href^="#"], nav a[href^="#"]')
  anchorLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href')
      if (!href || href === '#') return
      const target = document.querySelector(href)
      if (target) {
        e.preventDefault()
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        history.pushState(null, '', href)
      }
    })
  })
}

function initBackToTop() {
  const backToTop = document.getElementById('backToTop')
  const toggleBackToTop = () => {
    if (!backToTop) return
    const show = window.scrollY > 400
    backToTop.classList.toggle('opacity-100', show)
    backToTop.classList.toggle('pointer-events-auto', show)
    backToTop.classList.toggle('opacity-0', !show)
    backToTop.classList.toggle('pointer-events-none', !show)
  }
  window.addEventListener('scroll', toggleBackToTop, { passive: true })
  toggleBackToTop()
  backToTop?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  })
}

// Настройка перенаправлений соц-иконок на номер +79131877470
function initSocialRedirects() {
  const PHONE = '79131877470'
  const PHONE_PLUS = '+79131877470'

  const maxLinks = document.querySelectorAll('a[aria-label="Max"]')
  const tgLinks = document.querySelectorAll('a[aria-label="Telegram"]')
  const waLinks = document.querySelectorAll('a[aria-label="WhatsApp"]')

  // MAX: направляем на сайт с номером как параметром (фолбэк)
  maxLinks.forEach((a) => {
    const web = `https://max.ru/?phone=${encodeURIComponent(PHONE_PLUS)}`
    a.setAttribute('href', web)
    a.setAttribute('rel', 'noopener')
    a.setAttribute('target', a.getAttribute('target') || '_blank')
  })

  // Telegram: deeplink в приложение, фолбэк на web
  tgLinks.forEach((a) => {
    const app = `tg://resolve?phone=${PHONE}`
    const web = `https://t.me/+${PHONE}`
    a.setAttribute('href', web)
    a.setAttribute('rel', 'noopener')
    a.setAttribute('target', a.getAttribute('target') || '_blank')
    a.addEventListener('click', (e) => {
      try {
        e.preventDefault()
        const target = a.getAttribute('target') || '_self'
        const opener = (url) => { if (target === '_self') location.href = url; else window.open(url, target) }
        // Пытаемся открыть приложение
        opener(app)
        // Фолбэк через 800мс на web-ссылку
        setTimeout(() => opener(web), 800)
      } catch {
        // На всякий случай — web
        const target = a.getAttribute('target') || '_self'
        if (target === '_self') location.href = web; else window.open(web, target)
      }
    })
  })

  // WhatsApp: deeplink + web-фолбэк
  waLinks.forEach((a) => {
    const app = `whatsapp://send?phone=${PHONE}`
    const web = `https://wa.me/${PHONE}`
    a.setAttribute('href', web)
    a.setAttribute('rel', 'noopener')
    a.setAttribute('target', a.getAttribute('target') || '_blank')
    a.addEventListener('click', (e) => {
      try {
        e.preventDefault()
        const target = a.getAttribute('target') || '_self'
        const opener = (url) => { if (target === '_self') location.href = url; else window.open(url, target) }
        opener(app)
        setTimeout(() => opener(web), 800)
      } catch {
        const target = a.getAttribute('target') || '_self'
        if (target === '_self') location.href = web; else window.open(web, target)
      }
    })
  })
}

export function initSiteUI() {
  initYear()
  initScrollAndFocusRestore()
  ensureTopOnMobileRefresh()
  initSmoothAnchors()
  initBackToTop()
  initSocialRedirects()
}
