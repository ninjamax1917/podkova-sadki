import './style.css'
import { initSiteUI } from './js/site.js'
import { initTelegramShare } from './js/telegram.js'
import { initMap } from './js/map.js'

document.addEventListener('DOMContentLoaded', () => {
  initSiteUI()
  initTelegramShare()
  initMap()
})
