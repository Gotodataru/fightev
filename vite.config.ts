import { rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * The fighter portraits come from ufc.com. They live in public/data/photos so a local
 * build can show them, and Vite copies public/ into the output wholesale — which means
 * a public build shipped them as reachable files even though nothing in the interface
 * asked for them. Nothing in git stopped it either: the deploy was clean only because
 * the folder happens to be git-ignored. So the build itself deletes them, and only the
 * VITE_PHOTOS=1 build (npm run build:photos, dist-photos/, never deployed) keeps them.
 */
const dropPhotos = (outDir: string) => ({
  name: 'drop-unlicensed-photos',
  apply: 'build' as const,
  closeBundle: async () => {
    if (process.env.VITE_PHOTOS === '1') return
    await rm(resolve(outDir, 'data/photos'), { recursive: true, force: true })
  },
})

// Served from https://gotodataru.github.io/fightev/
export default defineConfig(({ command }) => {
  const outDir = process.env.VITE_PHOTOS === '1' ? 'dist-photos' : 'dist'
  return {
    base: '/fightev/',
    plugins: [react(), ...(command === 'build' ? [dropPhotos(outDir)] : [])],
  }
})
