import { chromium } from 'playwright'
const b = await chromium.launch()
const ctx = await b.newContext({ storageState: 'tests/.auth/user.json', viewport: { width: 1440, height: 900 } })
const p = await ctx.newPage()
await p.goto('http://localhost:5174/dashboard', { waitUntil: 'networkidle' })
await p.waitForTimeout(1200)
const h = await p.evaluate(()=>{ const g=s=>{const e=document.querySelector(s);return e?Math.round(e.getBoundingClientRect().height):null}; return { mode:g('.cb-mode .mode-switcher'), modeBtn:g('.cb-mode .mode-switcher__btn'), tabs:g('.cb-tabs'), tabPill:g('.cb-tabs .scrollable-tabs__pill'), gear:g('.settings-trigger') } })
console.log(JSON.stringify(h))
await b.close()
