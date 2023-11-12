import React from 'react';
import ReactDOM from 'react-dom';
import './input.css';
import { disableReactDevTools } from '@fvilers/disable-react-devtools';
import App from './App';
import { AuthProvider } from './context/authprovider';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Notifications } from 'react-push-notification';

if (process.env.REACT_APP_NODE_ENV === 'production') {
  disableReactDevTools();
}

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
      <Notifications />
        <Routes>
          <Route path="/*" element={<App />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById('root')
);