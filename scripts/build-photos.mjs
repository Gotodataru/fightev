/**
 * The private build — the one with the fighter photographs in it.
 *
 * The portraits come from ufc.com and are not ours to republish, so this build never
 * goes near the deploy: it writes to dist-photos/, which is git-ignored, and exists so
 * the work can be shown to an employer in person. Publishing it anywhere with a public
 * URL — another host, another account, a share-with-anyone link — is the same act of
 * publication the public build deliberately avoids.
 *
 *   npm run build:photos      →  dist-photos/
 *   npm run preview:photos    →  http://localhost:4174/fightev/
 */
import { spawnSync } from 'node:child_process'

const run = (cmd, args) => {
  const r = spawnSync(cmd, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, VITE_PHOTOS: '1' },
  })
  if (r.status !== 0) process.exit(r.status ?? 1)
}

run('tsc', ['--noEmit'])
run('vite', ['build', '--outDir', 'dist-photos'])
run('node', ['scripts/spa-routes.mjs', 'dist-photos'])
console.log('\nprivate build written to dist-photos/ — do not deploy it')
