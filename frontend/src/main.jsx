import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#181b27',
            border: '1px solid #252839',
            color: '#d1d5db',
            fontSize: '13px',
            borderRadius: '8px',
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
)
