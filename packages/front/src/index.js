import { CssBaseline, GlobalStyles } from '@mui/material';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider } from '@mui/material/styles';
import ReactDOM from 'react-dom';
import numeral from 'numeral';
/* styles */
import theme from './styleguide/theme';
import './sass/index.scss';

/* components */
import App from './App';

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

ReactDOM.render(
  <QueryClientProvider client={client}>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles styles={{ body: { background: theme.palette.beige.gradient } }} />
      <App />
    </ThemeProvider>
  </QueryClientProvider>,
  document.getElementById('root'),
);
