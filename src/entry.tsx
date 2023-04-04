import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app';

const root = document.getElementById('root-container');
if (!root) throw new Error('React root element not found');

// Mount the MDX page
ReactDOM.createRoot(root).render((
  <React.StrictMode>
    <App />
  </React.StrictMode>
));
