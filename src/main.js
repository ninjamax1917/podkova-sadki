import './style.css'
import { initSiteUI } from './js/site.js'
import { initTelegramShare } from './js/telegram.js'
import { initMap } from './js/map.js'

function initHeroVideoAutoplay() {
  const video = document.querySelector('video[autoplay][muted]')
  if (!video) return

  // Ensure proper flags for mobile autoplay
  try {
    video.muted = true
    video.playsInline = true
    video.setAttribute('playsinline', '')
    video.setAttribute('webkit-playsinline', '')
  } catch {}

  const tryPlay = () => {
    const p = video.play()
    if (p && typeof p.then === 'function') {
      p.catch(() => {/* swallow – will retry on user gesture */})
    }
  }

  // Try once on load and when visible
  tryPlay()
  const io = ('IntersectionObserver' in window)
    ? new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) tryPlay() })
      })
    : null
  if (io) io.observe(video)

  // Fallback: attempt on first user gesture
  const once = () => {
    tryPlay()
    window.removeEventListener('pointerdown', once, true)
    window.removeEventListener('keydown', once, true)
    window.removeEventListener('touchstart', once, true)
    window.removeEventListener('scroll', once, true)
  }
  window.addEventListener('pointerdown', once, true)
  window.addEventListener('keydown', once, true)
  window.addEventListener('touchstart', once, true)
  window.addEventListener('scroll', once, true)

  // Resume after tab visibility changes
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) tryPlay()
  })
}

document.addEventListener('DOMContentLoaded', () => {
  initSiteUI()
  initTelegramShare()
  initMap()
  initHeroVideoAutoplay()
})
