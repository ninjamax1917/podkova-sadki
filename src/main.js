import './style.css'
import { initSiteUI } from './js/site.js'
import { initTelegramShare } from './js/telegram.js'
import { initMap } from './js/map.js'

function initHeroVideoAutoplay() {
  const videos = Array.from(document.querySelectorAll('video.hero-video'))
  const posters = Array.from(document.querySelectorAll('.hero-poster'))
  if (!videos.length) return

  const ensureFlags = (el) => {
    try {
      el.muted = true
      el.playsInline = true
      el.setAttribute('playsinline', '')
      el.setAttribute('webkit-playsinline', '')
    } catch {}
  }

  const isVisible = (el) => {
    // Rely on CSS display none for responsive classes
    return el.offsetParent !== null || getComputedStyle(el).display !== 'none'
  }

  const playEl = (el) => {
    if (!el) return
    ensureFlags(el)
    const p = el.play()
    if (p && typeof p.then === 'function') p.catch(() => {})
  }

  const pauseEl = (el) => { try { el.pause() } catch {} }
  
  const findPosterFor = (videoEl) => {
    // Предпочтительно ближайший предыдущий сосед .hero-poster
    let p = videoEl.previousElementSibling
    while (p && !p.classList?.contains('hero-poster')) p = p.previousElementSibling
    if (p && p.classList?.contains('hero-poster')) return p
    // Иначе пытаемся сопоставить по breakpoint-классам
    return posters.find(pp => (
      (videoEl.classList.contains('sm:hidden') && pp.classList.contains('sm:hidden')) ||
      (videoEl.classList.contains('sm:block') && pp.classList.contains('sm:block'))
    )) || null
  }

  let playTimeout
  const pickAndPlay = () => {
    const target = videos.find(isVisible) || videos[0]
    // Остановить остальные и сбросить их состояние
    videos.forEach(v => { if (v !== target) { pauseEl(v); v.classList.remove('is-ready') } })
    // Показать все постеры (снимет скрытие с нецелевых)
    posters.forEach(p => p.classList.remove('is-hidden'))

    const posterEl = findPosterFor(target)

    const start = () => {
      ensureFlags(target)
      // Кроссфейд при готовности
      const onReady = () => {
        target.classList.add('is-ready')
        if (posterEl) posterEl.classList.add('is-hidden')
      }
      target.addEventListener('playing', onReady, { once: true })
      target.addEventListener('canplay', onReady, { once: true })
      playEl(target)
    }

    clearTimeout(playTimeout)
  // Задержка 1 секунда для показа превью перед стартом
  playTimeout = setTimeout(start, 1000)
  }

  // Initial attempt after load/visibility
  pickAndPlay()
  // Retry on resize (switch mobile/desktop)
  let resizeT
  window.addEventListener('resize', () => {
    clearTimeout(resizeT)
    resizeT = setTimeout(pickAndPlay, 200)
  })

  // First user gesture fallback
  const once = () => {
    pickAndPlay()
    window.removeEventListener('pointerdown', once, true)
    window.removeEventListener('keydown', once, true)
    window.removeEventListener('touchstart', once, true)
    window.removeEventListener('scroll', once, true)
  }
  window.addEventListener('pointerdown', once, true)
  window.addEventListener('keydown', once, true)
  window.addEventListener('touchstart', once, true)
  window.addEventListener('scroll', once, true)

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) pickAndPlay()
  })
}

document.addEventListener('DOMContentLoaded', () => {
  initSiteUI()
  initTelegramShare()
  initMap()
  initHeroVideoAutoplay()
})
