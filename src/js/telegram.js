// Логика отправки сообщения в Telegram без сервера

function buildTelegramText(name, phone, message) {
  const n = encodeURIComponent(name || '')
  const p = encodeURIComponent(phone || '')
  const m = encodeURIComponent(message || '')
  return `Заявка с сайта «Подкова»%0AИмя: ${n}%0AТелефон: ${p}%0AСообщение: ${m}`
}

export function initTelegramShare() {
  const submitBtn = document.getElementById('contactSubmit')
  submitBtn?.addEventListener('click', () => {
    const name = (document.getElementById('cf-name')?.value || '').trim()
    const phone = (document.getElementById('cf-phone')?.value || '').trim()
    const message = (document.getElementById('cf-message')?.value || '').trim()

    const text = buildTelegramText(name, phone, message)
    const siteUrl = 'https://example.com' // TODO: заменить на ваш домен
    const webUrl = `https://t.me/share/url?url=${encodeURIComponent(siteUrl)}&text=${text}`
    const appUrl = `tg://msg?text=${text}`

    const w = window.open(appUrl, '_blank')
    setTimeout(() => {
      if (!w || w.closed || typeof w.closed === 'undefined') {
        window.open(webUrl, '_blank')
      }
    }, 300)
  })
}
