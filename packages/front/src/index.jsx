import { CssBaseline, GlobalStyles } from '@mui/material';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider } from '@mui/material/styles';
import ReactDOM from 'react-dom/client';
import numeral from 'numeral';
import * as Sentry from '@sentry/react';
/* styles */
import theme from './styleguide/theme';
import './sass/index.scss';

/* components */
import App from './App';

if (import.meta.env.VITE_GLITCHTIP_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_GLITCHTIP_DSN,
    environment: import.meta.env.VITE_APP_ENV || import.meta.env.MODE,
    release: import.meta.env.VITE_VERSION,
    tracesSampleRate: 0.01,
    autoSessionTracking: false, // GlitchTip does not support sessions
  });
}

numeral.register('locale', 'pt-br', {
  delimiters: {
    thousands: '.',
    decimal: ',',
  },
  abbreviations: {
    thousand: 'k',
    million: 'm',
    billion: 'b',
    trillion: 't',
  },
  currency: {
    symbol: 'R$',
  },
});
numeral.locale('pt-br');

const client = new QueryClient({ defaultOptions: { queries: { retry: 1, keepPreviousData: true } } });

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <QueryClientProvider client={client}>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles styles={{ body: { background: theme.palette.beige.gradient } }} />
      <Sentry.ErrorBoundary fallback={<p>Algo deu errado. Por favor, recarregue a página.</p>}>
        <App />
      </Sentry.ErrorBoundary>
    </ThemeProvider>
  </QueryClientProvider>,
);
