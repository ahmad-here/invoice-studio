// Tiny deterministic motion-graphics engine. Each reel defines scene(t) (t in seconds).
// The renderer calls window.renderFrame(t) for every frame, so output is frame-exact and repeatable.
(() => {
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
  const ease = {
    linear: (t) => t,
    out: (t) => 1 - (1 - t) ** 3,
    in: (t) => t ** 3,
    inOut: (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2),
    back: (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2 },
    elastic: (t) => (t === 0 || t === 1 ? t : 2 ** (-10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1),
  }
  /** progress 0..1 of an animation starting at `start` lasting `dur` */
  const p = (t, start, dur, e = 'out') => ease[e](clamp((t - start) / dur))
  /** in-then-out window: rises over `fade` after start, holds, falls over `fade` before end */
  const win = (t, start, end, fade = 0.35) => Math.min(p(t, start, fade), 1 - p(t, end - fade, fade, 'in'))
  const lerp = (a, b, k) => a + (b - a) * k
  const $ = (s) => document.querySelector(s)
  const $$ = (s) => [...document.querySelectorAll(s)]
  function tf(el, { x = 0, y = 0, s = 1, r = 0, o = 1, sx, sy, blur = 0 } = {}) {
    if (!el) return
    el.style.transform = `translate(${x}px, ${y}px) rotate(${r}deg) scale(${sx ?? s}, ${sy ?? s})`
    el.style.opacity = String(clamp(o))
    el.style.filter = blur ? `blur(${blur}px)` : ''
  }
  /** Kinetic words: wraps each word in a span once, then reveals them with a stagger. */
  function words(el, t, start, { stagger = 0.08, dur = 0.5, rise = 60, out = Infinity } = {}) {
    if (!el) return
    if (!el.dataset.split) {
      el.innerHTML = el.innerHTML.split(/(<[^>]+>[^<]*<\/[^>]+>|\s+)/).filter((x) => x && x.trim()).map((w) => `<span class="w">${w}</span>`).join(' ')
      el.dataset.split = '1'
    }
    const ws = el.querySelectorAll('.w')
    const leave = p(t, out, 0.35, 'in')
    ws.forEach((w, i) => {
      const k = p(t, start + i * stagger, dur, 'back')
      tf(w, { y: (1 - k) * rise - leave * 40, o: Math.min(p(t, start + i * stagger, dur * 0.6), 1 - leave) })
    })
  }
  function type(el, text, k) { if (el) el.textContent = text.slice(0, Math.round(text.length * clamp(k))) }
  function count(el, from, to, k, fmt = (v) => Math.round(v).toLocaleString('en-US')) { if (el) el.textContent = fmt(lerp(from, to, clamp(k))) }
  const usd = (v) => '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  /** Shared end card (logo, promise, CTA). Present in every reel as #end. */
  function endCard(t, start) {
    const el = $('#end'); if (!el) return
    const k = p(t, start, 0.6)
    el.style.opacity = String(k)
    el.style.pointerEvents = 'none'
    tf($('#end .logo'), { s: lerp(0.6, 1, p(t, start + 0.1, 0.7, 'back')), o: p(t, start + 0.1, 0.4) })
    words($('#end .name'), t, start + 0.3, { stagger: 0.07 })
    words($('#end .claim'), t, start + 0.6, { stagger: 0.05 })
    tf($('#end .cta'), { y: (1 - p(t, start + 1.0, 0.6, 'back')) * 80, o: p(t, start + 1.0, 0.4) })
    tf($('#end .url'), { o: p(t, start + 1.4, 0.5) })
    $$('#end .chip').forEach((c, i) => tf(c, { s: lerp(0.7, 1, p(t, start + 1.2 + i * 0.12, 0.5, 'back')), o: p(t, start + 1.2 + i * 0.12, 0.3) }))
  }

  window.M = { clamp, ease, p, win, lerp, $, $$, tf, words, type, count, usd, endCard }
  window.renderFrame = (t) => { window.scene(t); return true }
})()
