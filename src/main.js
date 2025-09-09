import './style.css'
import { initSiteUI } from './js/site.js'
import { initTelegramShare } from './js/telegram.js'
import { initMap } from './js/map.js'

function syncHeaderHeightVar() {
  const set = () => {
    const header = document.querySelector('header')
    const h = header ? Math.ceil(header.getBoundingClientRect().height) : 64
    document.documentElement.style.setProperty('--header-h', h + 'px')
  }
  set()
  window.addEventListener('resize', () => { requestAnimationFrame(set) })
  window.addEventListener('pageshow', set)
}

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

function initInlineVideoOverlay() {
  const containers = document.querySelectorAll('[data-video-container]')
  containers.forEach((wrap) => {
    const video = wrap.querySelector('video')
    const overlay = wrap.querySelector('[data-video-overlay]')
    if (!video || !overlay) return

    const show = () => overlay.classList.remove('hidden')
    const hide = () => overlay.classList.add('hidden')

    // Изначально показываем кнопку Play
    show()

    overlay.addEventListener('click', () => {
      hide()
      // включаем воспроизведение
      const p = video.play()
      if (p && typeof p.then === 'function') {
        p.catch(() => show())
      }
    })

    video.addEventListener('play', hide)
    video.addEventListener('playing', hide)
    video.addEventListener('pause', show)
    video.addEventListener('ended', show)
  })
}

document.addEventListener('DOMContentLoaded', () => {
  syncHeaderHeightVar()
  initSiteUI()
  initTelegramShare()
  initMap()
  initHeroVideoAutoplay()
  initInlineVideoOverlay()
  initGalleryCarousel()
})

// Toggle compact header on scroll
;(function initHeaderCompact() {
  const header = document.querySelector('header')
  if (!header) return
  const threshold = 60
  let compact = false
  const apply = (on) => {
    compact = !!on
    header.classList.toggle('header--compact', compact)
    // after class change, update header height var so hero offset stays correct
    requestAnimationFrame(syncHeaderHeightVar)
  }
  const onScroll = () => {
    const should = window.scrollY > threshold
    if (should !== compact) apply(should)
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})()

// Простая карусель для секции "ФОТОГАЛЕРЕЯ"
function initGalleryCarousel() {
  const root = document.querySelector('[data-carousel="gallery"]')
  if (!root) return
  const track = root.querySelector('[data-carousel-track]')
  const prev = root.querySelector('[data-carousel-prev]')
  const next = root.querySelector('[data-carousel-next]')
  const dotsWrap = root.querySelector('[data-carousel-dots]')
  if (!track) return

  const slides = Array.from(track.children)
  // ширина слайда = ширина контейнера (w-full)
  const getSlideWidth = () => root.getBoundingClientRect().width

  // создаём точки
  const dots = slides.map((_, i) => {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = 'w-2.5 h-2.5 rounded-full bg-slate-300 aria-[current=true]:bg-emerald-600'
    b.setAttribute('aria-label', `Показать слайд ${i + 1}`)
    b.addEventListener('click', () => scrollToIndex(i))
    dotsWrap?.appendChild(b)
    return b
  })

  const indexFromScroll = () => {
    const w = getSlideWidth()
    const i = Math.round(track.scrollLeft / (w + 16 /* gap-4 */))
    return Math.max(0, Math.min(slides.length - 1, i))
  }

  let current = 0
  const setActive = (i) => {
    current = i
    dots.forEach((d, idx) => d.setAttribute('aria-current', String(idx === i)))
  }

  const scrollToIndex = (i) => {
    const w = getSlideWidth()
    track.scrollTo({ left: i * (w + 16), behavior: 'smooth' })
    setActive(i)
  }

  prev?.addEventListener('click', () => scrollToIndex(Math.max(0, current - 1)))
  next?.addEventListener('click', () => scrollToIndex(Math.min(slides.length - 1, current + 1)))

  // обновление активной точки при прокрутке/свайпе
  let raf
  track.addEventListener('scroll', () => {
    cancelAnimationFrame(raf)
    raf = requestAnimationFrame(() => setActive(indexFromScroll()))
  }, { passive: true })

  // resize
  window.addEventListener('resize', () => setActive(indexFromScroll()))

  // --- Touch drag swipe (pointer events) — только для touch/coarse устройств ---
  let isDown = false
  let startX = 0
  let startScroll = 0
  let dragged = false

  const onPointerDown = (e) => {
    // Для мыши — только левая кнопка
    if (e.pointerType === 'mouse' && e.button !== 0) return
    isDown = true
    dragged = false
    track.setPointerCapture?.(e.pointerId)
    startX = e.clientX
    startScroll = track.scrollLeft
    track.classList.add('is-dragging')
  }

  const onPointerMove = (e) => {
    if (!isDown) return
    const dx = e.clientX - startX
    if (Math.abs(dx) > 3) dragged = true
    track.scrollLeft = startScroll - dx
  }

  const onPointerUp = (e) => {
    if (!isDown) return
    isDown = false
    track.releasePointerCapture?.(e.pointerId)
    track.classList.remove('is-dragging')
    // Привязка к ближайшему слайду
    const i = indexFromScroll()
    scrollToIndex(i)
  }

  const addDrag = () => {
    track.addEventListener('pointerdown', onPointerDown)
    track.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
  }
  const removeDrag = () => {
    track.removeEventListener('pointerdown', onPointerDown)
    track.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
    window.removeEventListener('pointercancel', onPointerUp)
  }

  // Блокируем клики во время перетаскивания (актуально только при drag активном)
  const onTrackClick = (e) => {
    if (dragged) {
      e.preventDefault()
      e.stopPropagation()
      dragged = false
    }
  }
  const addClickBlock = () => track.addEventListener('click', onTrackClick, true)
  const removeClickBlock = () => track.removeEventListener('click', onTrackClick, true)

  // --- Horizontal wheel swipe (трекпад/горизонтальное колесо) — только для touch/coarse устройств ---
  const onWheel = (e) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      e.preventDefault()
      track.scrollLeft += e.deltaX
    }
  }
  const addWheel = () => track.addEventListener('wheel', onWheel, { passive: false })
  const removeWheel = () => track.removeEventListener('wheel', onWheel)

  // Применяем режимы для десктопа/мобилы
  const mql = window.matchMedia ? window.matchMedia('(pointer: coarse)') : { matches: 'ontouchstart' in window }
  const applyMode = () => {
    const isCoarse = !!mql.matches
    if (isCoarse) {
      // мобильные/тач: разрешаем свайп и горизонтальную прокрутку
      removeWheel(); removeDrag(); removeClickBlock()
      addDrag(); addWheel(); addClickBlock()
      // обеспечить видимость прокрутки по X
      track.style.overflowX = 'auto'
    } else {
      // десктоп: запрещаем свайп и колесо, скрываем возможность ручной прокрутки
      removeWheel(); removeDrag(); removeClickBlock()
      track.style.overflowX = 'hidden'
      // выровнять к текущему слайду, чтобы не зависнуть между
      scrollToIndex(indexFromScroll())
    }
  }
  applyMode()
  if (mql.addEventListener) mql.addEventListener('change', applyMode)
  else if (mql.addListener) mql.addListener(applyMode)

  // стартовое состояние
  setActive(0)
}
