import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { I18nProvider } from './i18n'
import Accuracy from './pages/Accuracy'
import Case from './pages/Case'
import Fights from './pages/Fights'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <Layout>
          <Routes>
            <Route path="/" element={<Fights />} />
            <Route path="/accuracy" element={<Accuracy />} />
            <Route path="/case" element={<Case />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </I18nProvider>
  </StrictMode>,
)
