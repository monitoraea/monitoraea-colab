import { CssBaseline, GlobalStyles } from '@mui/material';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider } from '@mui/material/styles';
import ReactDOM from 'react-dom/client';
import numeral from 'numeral';
import { configure } from '@community-assistant/client';
/* styles */
import theme from './styleguide/theme';
import './sass/index.scss';
import '@community-assistant/client/styles.css';

/* components */
import App from './App';

// Walking-skeleton CAS integration: FormPage instances point at the new
// /cas_api mount (see packages/backend/services/cas_api/routes.js), same
// origin/base the rest of the app already uses via VITE_SERVER.
configure({ apiBaseUrl: `${import.meta.env.VITE_SERVER}cas_api` });

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
      <App />
    </ThemeProvider>
  </QueryClientProvider>,
);
