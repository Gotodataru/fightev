import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Served from https://gotodataru.github.io/fightev/
export default defineConfig({
  base: '/fightev/',
  plugins: [react()],
})
