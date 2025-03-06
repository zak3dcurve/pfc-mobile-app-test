import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AppRouter from './router/app-router'
import { AuthProvider } from './features/auth/utils/auth-context'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Navbar from './components/app-navbar'
import Login from './features/auth/pages/login'

createRoot(document.getElementById('root')).render(
  <StrictMode>

    <BrowserRouter>
    <AuthProvider>
    <Routes>
      {/* Public route: Login page */}
      <Route path="/login" element={<Login />} />
      <Route path="/*" element={<App />} />  
      </Routes>
    </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
