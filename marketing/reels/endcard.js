// Injects the shared end card markup (rendered by M.endCard).
document.addEventListener('DOMContentLoaded', () => {})
window.injectEnd = (claim, chips = ['100% free', 'No sign-up', 'Works offline']) => {
  const el = document.createElement('div')
  el.id = 'end'
  el.className = 'bg-blue'
  el.innerHTML = `
    <svg class="logo" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#fff"/><path d="M10 7.5h9l4 4V24a.5.5 0 0 1-.5.5h-12A.5.5 0 0 1 10 24V8a.5.5 0 0 1 .5-.5Z" fill="#0692F4"/><path d="M19 7.5v4h4" fill="#9fd4ff"/><rect x="13" y="14" width="7" height="1.6" rx=".8" fill="#fff"/><rect x="13" y="17.4" width="7" height="1.6" rx=".8" fill="#fff" opacity=".7"/><rect x="13" y="20.8" width="4.5" height="1.6" rx=".8" fill="#fff" opacity=".7"/></svg>
    <div class="name">Invoice Studio</div>
    <div class="claim">${claim}</div>
    <div class="chips">${chips.map((c) => `<span class="chip">${c}</span>`).join('')}</div>
    <div class="cta">Create your invoice — free</div>
    <div class="url">invoicestudio.app · Android app available</div>`
  document.querySelector('.stage').appendChild(el)
}
