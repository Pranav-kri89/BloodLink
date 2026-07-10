import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import axios from 'axios'
import { ThemeProvider } from './context/ThemeProvider'
import App from './App'
import './index.css'

// Set base URL for production. In development, Vite proxy will handle '/api' if VITE_API_URL is not set.
axios.defaults.baseURL = import.meta.env.VITE_API_URL || '';

import { ClerkProvider } from '@clerk/clerk-react'

// Import your Publishable Key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  console.error("Missing Publishable Key")
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
            <BrowserRouter>
                <AuthProvider>
                    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
                        <App />
                    </ThemeProvider>
                </AuthProvider>
            </BrowserRouter>
        </ClerkProvider>
    </React.StrictMode>
)
