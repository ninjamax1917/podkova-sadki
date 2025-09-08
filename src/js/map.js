// Инициализация карты Яндекс с ленивой загрузкой API и graceful fallback.

const API_KEY = 'd36b5481-4624-40a6-8698-b0dd0c33d972'
const COORDS = [45.946525, 38.111089]

let scriptLoading = null
let initOnce = false

function loadYMaps() {
  if (window.ymaps) return Promise.resolve()
  if (scriptLoading) return scriptLoading
  const src = `https://api-maps.yandex.ru/2.1/?apikey=${encodeURIComponent(API_KEY)}&lang=ru_RU`
  scriptLoading = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = src
    s.async = true
    s.onerror = () => reject(new Error('Yandex Maps API failed to load'))
    s.onload = () => {
      if (window.ymaps?.ready) {
        window.ymaps.ready(resolve)
      } else {
        resolve()
      }
    }
    document.head.appendChild(s)
  })
  return scriptLoading
}

function makeMap(container) {
  try {
  // Очистим плейсхолдер загрузки
  container.textContent = ''

    const map = new window.ymaps.Map(container, {
      center: COORDS,
      // Увеличение масштаба примерно на 1.2x относительно текущего: используем дробный zoom
      zoom: 17.3,
      controls: ['zoomControl', 'fullscreenControl', 'routeButtonControl']
    }, {
      suppressMapOpenBlock: true,
      yandexMapDisablePoiInteractivity: true
    })

  const placemark = new window.ymaps.Placemark(
      COORDS,
      {
        balloonContentHeader: 'База отдыха «Подкова»',
        balloonContentBody: 'Хутор Садки, Приморско‑Ахтарский район. Тел.: <a href="tel:+79131877470">+7 913 187‑74‑70</a>',
        hintContent: 'База отдыха «Подкова»'
      },
      {
        preset: 'islands#redIcon'
      }
    )
    map.geoObjects.add(placemark)

    // Оставляем стандартное поведение баллуна (по клику)

    // Кнопка построения маршрута
    try {
      const routeBtn = map.controls.get('routeButtonControl')
      if (routeBtn && routeBtn.routePanel) {
        routeBtn.routePanel.state.set({ fromEnabled: true, to: COORDS })
        routeBtn.routePanel.options.set({
          allowSwitch: true,
          types: { auto: true, masstransit: true, pedestrian: true, bicycle: true }
        })
      }
    } catch {}

    // Центрирование при ресайзе контейнера/окна
    const onResize = () => map.setCenter(COORDS)
    window.addEventListener('resize', onResize)
  } catch (e) {
    // В крайнем случае — встраиваем iframe-конструктор
    fallbackIframe(container)
  }
}

function fallbackIframe(container) {
  if (!container) return
  container.innerHTML = ''
  const url = 'https://yandex.ru/map-widget/v1/?ll=38.111089%2C45.946525&pt=38.111089%2C45.946525&z=15'
  const iframe = document.createElement('iframe')
  iframe.src = url
  iframe.style.border = '0'
  iframe.width = '100%'
  iframe.height = '100%'
  iframe.setAttribute('loading', 'lazy')
  container.appendChild(iframe)
}

export function initMap() {
  const container = document.getElementById('yandexMap')
  if (!container || initOnce) return
  initOnce = true

  const start = () => {
    loadYMaps()
      .then(() => makeMap(container))
      .catch(() => fallbackIframe(container))
  }

  // Ленивая инициализация: когда блок попал в вьюпорт
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      const isVisible = entries.some(e => e.isIntersecting)
      if (isVisible) {
        io.disconnect()
        start()
      }
    }, { rootMargin: '200px' })
    io.observe(container)
  } else {
    // Fallback без IO — по таймеру после загрузки
    window.addEventListener('load', () => setTimeout(start, 500))
  }
}
