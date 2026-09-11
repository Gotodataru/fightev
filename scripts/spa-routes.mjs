// GitHub Pages has no SPA fallback: give every route its own index.html (served with 200),
// and 404.html for anything else so a mistyped link still lands in the app.
import { copyFileSync, mkdirSync } from 'node:fs'

const ROUTES = ['accuracy', 'case']
for (const r of ROUTES) {
  mkdirSync(`dist/${r}`, { recursive: true })
  copyFileSync('dist/index.html', `dist/${r}/index.html`)
}
copyFileSync('dist/index.html', 'dist/404.html')
console.log(`spa routes: ${ROUTES.join(', ')} + 404.html`)
