import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { CafeProvider } from './context/CafeContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import './index.css';

// Order matters: the cart needs café options and promos, so CafeProvider is outside CartProvider.
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <CafeProvider>
        <AuthProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </AuthProvider>
      </CafeProvider>
    </BrowserRouter>
  </React.StrictMode>
);