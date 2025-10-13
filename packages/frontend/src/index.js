import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import _ from 'lodash';
import moment from 'moment';
import 'moment/locale/fr';
import 'moment/locale/es';
import 'moment/locale/de';

window._ = _;
window.moment = moment;

console.log('Lodash version:', _.VERSION);
console.log('Moment loaded with locales:', moment.locales());

window.onerror = function(message, source, lineno, colno, error) {
  console.error('Global error:', { message, source, lineno, colno, error });
  return false;
};

window.onunhandledrejection = function(event) {
  console.error('Unhandled promise rejection:', event.reason);
};

const startTime = performance.now();

const isDev = process.env.NODE_ENV === 'development';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Failed to find root element');
}

window.APP_VERSION = '1.0.0';
window.DEBUG = isDev;

window.API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const renderApp = () => {
  try {
    const appRoot = ReactDOM.createRoot(root);

    appRoot.render(
        <App />
    );

    if (isDev) {
      const endTime = performance.now();
      console.log(`App rendered in ${endTime - startTime}ms`);
    }
  } catch (error) {
    console.error('Failed to render app:', error);
    root.innerHTML = '<div style="color: red;">Failed to load application.</div>';
  }
};

renderApp();

if (module.hot) {
  module.hot.accept('./App', () => {
    renderApp();
  });
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
        .register('/service-worker.js')
        .then(registration => {
          console.log('SW registered:', registration);
        })
        .catch(error => {
          console.error('SW registration failed:', error);
        });
  });
}

window.addEventListener('unload', () => {
  console.log('App cleanup');
});

window.addEventListener('error', (event) => {
  console.error('Runtime error:', event.error);
});

if (isDev) {
  const reportWebVitals = (metric) => {
    console.log(metric);
  };

  import('web-vitals').then(({ onCLS, onFCP, onLCP, onTTFB }) => {
    onCLS(reportWebVitals);
    onFCP(reportWebVitals);
    onLCP(reportWebVitals);
    onTTFB(reportWebVitals);
  });
}
