// Логика интерфейса сайта: год в футере, плавные якоря, кнопка «наверх»

function initYear() {
  const yearEl = document.getElementById('year')
  if (yearEl) yearEl.textContent = String(new Date().getFullYear())
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

export function initSiteUI() {
  initYear()
  initSmoothAnchors()
  initBackToTop()
}
