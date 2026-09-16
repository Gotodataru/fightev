import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, HashRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { I18nProvider } from './i18n'
import { ThemeProvider } from './theme'
import Accuracy from './pages/Accuracy'
import Case from './pages/Case'
import Fights from './pages/Fights'
import NotFound from './pages/NotFound'
import './index.css'

// a preview copy is served from a plain static host with no SPA fallback, so it routes on the hash
const hashRouting = import.meta.env.VITE_HASH_ROUTER === '1'
const Router = hashRouting ? HashRouter : BrowserRouter
const basename = hashRouting ? undefined : import.meta.env.BASE_URL.replace(/\/$/, '')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <I18nProvider>
        <Router basename={basename}>
          <Layout>
            <Routes>
              <Route path="/" element={<Fights />} />
              <Route path="/accuracy" element={<Accuracy />} />
              <Route path="/case" element={<Case />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </Router>
      </I18nProvider>
    </ThemeProvider>
  </StrictMode>,
)
