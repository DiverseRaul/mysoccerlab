// Scroll-reveal engine — a single shared IntersectionObserver that plays a
// varied entrance animation on any element carrying a `data-reveal` attribute
// as it scrolls into view, and *reverses* it when the element scrolls back out
// (so the motion replays every time, not just once). The animation types live
// in styles/reveal.css; this module decides which element gets which type and
// toggles `.is-revealed` on/off as visibility changes.

let io = null

function ensureObserver () {
  if (io) return io
  if (typeof IntersectionObserver === 'undefined') return null
  io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      // Reversible: revealed while anywhere near the viewport, re-armed only once
      // it's well clear so it animates again on the way back. A generous margin +
      // zero threshold means a tile reveals the instant any part approaches view
      // (so nothing ever sits stuck in its hidden state).
      entry.target.classList.toggle('is-revealed', entry.isIntersecting)
    }
  }, { threshold: 0, rootMargin: '240px 0px 240px 0px' })
  return io
}

// Observe every [data-reveal] element under `root` (defaults to the document).
// Safe to call repeatedly — the observer de-duplicates elements.
export function revealScan (root) {
  const obs = ensureObserver()
  if (!obs) return
  ;(root || document).querySelectorAll('[data-reveal]').forEach((el) => obs.observe(el))
}

// Varied, bold entrance types cycled across a grid's children so tiles don't
// just fade — they flood with brand colour, pop, rise, tilt and unblur in a
// staggered cascade. All types are overflow-safe (vertical / scale / filter
// only — no horizontal translate that would widen the page).
const GRID_TYPES = ['rv-flood', 'rv-pop', 'rv-wipe', 'rv-blur', 'rv-flood', 'rv-swing', 'rv-tilt', 'rv-pop']

// Tag each `.bento-grid` child (and section headers) inside `root` with a
// reveal type + staggered delay index, then observe. Idempotent: already-tagged
// elements are left alone, so it can run again after the tile set re-renders.
export function decorateBento (root) {
  if (!root) return
  root.querySelectorAll('.overview-section').forEach((section) => {
    const header = section.querySelector('.overview-group')
    if (header && !header.dataset.reveal) header.dataset.reveal = 'rv-rise'

    const grid = section.querySelector('.bento-grid')
    if (!grid) return
    Array.from(grid.children).forEach((el, i) => {
      if (el.dataset.reveal) return
      el.dataset.reveal = GRID_TYPES[i % GRID_TYPES.length]
      // Cap the stagger so long grids don't trickle in too slowly.
      el.style.setProperty('--rv-i', String(Math.min(i, 5)))
    })
  })
  revealScan(root)
}
