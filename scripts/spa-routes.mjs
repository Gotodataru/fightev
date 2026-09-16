// GitHub Pages has no SPA fallback: give every route its own index.html (served with 200),
// and 404.html for anything else so a mistyped link still lands in the app.
import { copyFileSync, mkdirSync } from 'node:fs'

const OUT = process.argv[2] ?? 'dist'
const ROUTES = ['accuracy', 'case']
for (const r of ROUTES) {
  mkdirSync(`${OUT}/${r}`, { recursive: true })
  copyFileSync(`${OUT}/index.html`, `${OUT}/${r}/index.html`)
}
copyFileSync(`${OUT}/index.html`, `${OUT}/404.html`)
console.log(`spa routes: ${ROUTES.join(', ')} + 404.html  → ${OUT}`)
