/**
 * Headless smoke test using the system Edge via puppeteer-core.
 * Verifies rendering, search, filters, and links against the built app.
 *
 * Usage: npm run preview (or vite preview) then: node scripts/smoke.mjs
 */
import puppeteer from 'puppeteer-core'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const URL = process.env.SMOKE_URL ?? 'http://localhost:4173'

const results = []
function check(label, ok, detail = '') {
  results.push({ label, ok })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`)
}

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: true,
  args: ['--no-first-run', '--disable-gpu'],
})
const page = await browser.newPage()
page.on('console', (msg) => {
  if (msg.type() === 'error') console.log(`  [console.error] ${msg.text()}`)
})
page.on('pageerror', (err) => console.log(`  [pageerror] ${err.message}`))

await page.setViewport({ width: 1280, height: 900 })
await page.goto(URL, { waitUntil: 'networkidle0', timeout: 30000 })

/* 1. initial render */
const rowCount = await page.evaluate(
  () => document.querySelectorAll('li[id^="evt-"]').length + document.querySelectorAll('ul li a[href*="API_"]').length,
)
check('rows rendered', rowCount > 1000, `${rowCount} rows`)

const text = await page.evaluate(() => document.body.innerText)
check('brand title', text.includes('AWS Events Directory'))
check('count pill 1130', text.includes('1130'))
check('group header Instances', text.includes('Instances'))
check('group header Credentials & Sessions', text.includes('Credentials & Sessions'))
check('event RunInstances', text.includes('RunInstances'))
check('event CreateVpc', text.includes('CreateVpc'))
check('service chips', ['IAM', 'STS', 'EC2', 'VPC', 'RDS'].every((s) => text.includes(s)))

/* 2. search behavior */
await page.type('#search', 'CreateVpc')
await page.waitForFunction(
  () => document.body.innerText.includes('CreateVpcEndpoint') || document.body.innerText.includes('CreateVpcPeeringConnection'),
  { timeout: 5000 },
)
const searchResults = await page.evaluate(() =>
  Array.from(document.querySelectorAll('a[href*="API_"]')).map((a) => a.textContent?.trim()),
)
check(
  'search "CreateVpc" returns VPC actions',
  searchResults.length > 0 && searchResults.every((n) => n.startsWith('CreateVpc')),
  `${searchResults.length} results: ${searchResults.slice(0, 5).join(', ')}`,
)
const searchCount = await page.evaluate(() => {
  const pill = document.querySelector('[aria-live="polite"]')
  return pill?.textContent ?? ''
})
check('result count shown', /\d+ \/ \d+/.test(searchCount), searchCount)

/* 4. copy button exists (after clearing search, before hash filters) */
await page.click('button[aria-label="Clear search"]')
await page.waitForFunction(
  () => document.querySelectorAll('li a[href*="API_"]').length > 1000,
  { timeout: 5000 },
)
const copyBtns = await page.$$('button[aria-label^="Copy"]')
check('copy buttons present', copyBtns.length > 100, `${copyBtns.length} buttons`)

/* 5. hash state round-trip */
await page.type('#search', ' ') /* noop */
await page.evaluate(() => window.history.replaceState(null, '', '#q=instances&svc=ec2'))
await page.reload({ waitUntil: 'networkidle0' })
const afterReload = await page.evaluate(() => ({
  input: document.querySelector('#search')?.value,
  chipActive: document.querySelector('[aria-pressed="true"]')?.textContent ?? '',
}))
check('hash restores search query', afterReload.input === 'instances', `input="${afterReload.input}"`)
check('hash restores service chip', afterReload.chipActive.includes('EC2'), `chip="${afterReload.chipActive}"`)

/* 4. event link opens API reference */
const firstLink = await page.evaluate(() => {
  const a = document.querySelector('a[href*="API_"]')
  return { href: a?.href }
})
const linkCheck = await fetch(firstLink.href, { method: 'HEAD' })
check('event link resolves on docs.aws.amazon.com', linkCheck.status === 200, `${firstLink.href} -> ${linkCheck.status}`)

/* 6. mobile viewport renders without horizontal overflow */
await page.setViewport({ width: 390, height: 844 })
await page.goto(URL, { waitUntil: 'networkidle0' })
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
check('no horizontal overflow on mobile', overflow <= 0, `overflow=${overflow}px`)

/* 7. mobile tap targets are comfortably sized */
const targets = await page.evaluate(() => {
  const h = (sel) => {
    const el = document.querySelector(sel)
    return el ? Math.round(el.getBoundingClientRect().height) : null
  }
  return {
    search: h('#search'),
    chips: h('button[aria-pressed]'),
    letter: h('nav[aria-label="Jump to letter"] button'),
    row: h('ul li'),
    copy: h('button[aria-label^="Copy"]'),
  }
})
check('mobile search input height', targets.search >= 44, `${targets.search}px`)
check('mobile service chip height', targets.chips >= 44, `${targets.chips}px`)
check('mobile letter button height', targets.letter >= 36, `${targets.letter}px`)
check('mobile event row height', targets.row >= 44, `${targets.row}px`)
check('mobile copy button height', targets.copy >= 40, `${targets.copy}px`)

/* 8. back-to-top appears after scrolling on mobile */
await page.evaluate(() => window.scrollTo(0, 800))
await new Promise((r) => setTimeout(r, 400))
const topBtn = await page.evaluate(() => {
  const b = document.querySelector('button[aria-label="Back to top"]')
  return b ? getComputedStyle(b).opacity !== '0' : false
})
check('back-to-top appears after scroll', topBtn)

/* 9. service chips stay sticky on mobile (search + chips in fixed zone) */
const stickyZone = await page.evaluate(() => {
  const search = document.querySelector('#search')
  const chip = document.querySelector('button[aria-pressed]')
  const searchRect = search?.getBoundingClientRect()
  const chipRect = chip?.getBoundingClientRect()
  const stickyTop = chip?.closest('div.sticky')?.getBoundingClientRect().top ?? -1
  return {
    searchInSticky: !!search?.closest('div.sticky'),
    chipInSticky: !!chip?.closest('div.sticky'),
    searchTop: Math.round(searchRect?.top ?? -1),
    chipTop: Math.round(chipRect?.top ?? -1),
    stickyTop: Math.round(stickyTop),
  }
})
check(
  'search and chips in sticky zone on mobile',
  stickyZone.searchInSticky &&
    stickyZone.chipInSticky &&
    stickyZone.searchTop >= stickyZone.stickyTop &&
    stickyZone.chipTop > stickyZone.searchTop &&
    stickyZone.chipTop <= stickyZone.stickyTop + 120,
  `search=${stickyZone.searchTop} chip=${stickyZone.chipTop} sticky=${stickyZone.stickyTop}`,
)

await browser.close()

const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
process.exit(failed.length > 0 ? 1 : 0)
