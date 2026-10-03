
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.tsx';
import { CallApiContextProvider } from './context/callApi/CallApiContextProvider.tsx';
import { AuthProvider } from './context/login/AuthContextProvider.tsx';

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <CallApiContextProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </CallApiContextProvider>
  </BrowserRouter>
);
