(function () {
  try { history.scrollRestoration = 'manual' } catch (e) {}
  var key = 'restore:' + location.pathname + location.search
  var raw = null
  try { raw = sessionStorage.getItem(key) } catch (e) {}
  if (!raw) return
  var st = null
  try { st = JSON.parse(raw) } catch (e) {}
  if (!st || typeof st.y !== 'number') return
  // Не мешаем переходу по якорю
  if (location.hash) return
  // Раннее восстановление до первой отрисовки
  window.scrollTo(st.x || 0, st.y || 0)
  // Флаг для модулей, чтобы избежать повторного скролла
  window.__didEarlyRestore = true
  // Подстрахуемся на BFCache и после load
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) window.scrollTo(st.x || 0, st.y || 0)
  })
  window.addEventListener('load', function () {
    window.scrollTo(st.x || 0, st.y || 0)
  }, { once: true })
})();
