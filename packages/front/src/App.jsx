import React from 'react';

import { Dorothy } from 'dorothy-dna-react';

import { ReactQueryDevtools } from 'react-query/devtools'

import { QueryClient, QueryClientProvider } from 'react-query'

import axios from 'axios';

import tools from './tools';

import Body from './Body';

import { SnackbarProvider } from 'notistack';

const config = {
  app_name: 'pppzcm',
  path: import.meta.env.VITE_PATH,
  server: import.meta.env.VITE_SERVER,
  tools
};

function Prep() {
  return (<strong>...</strong>)
}
function App() {

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryFn: async ({ queryKey }) => (await axios.get(`${config.server}${queryKey}`)).data,
        retry: false,
      },
    },
  })

  return (<div id="App">
    <Dorothy config={config} preparingEl={<Prep />}>
      <QueryClientProvider client={queryClient}>
        <SnackbarProvider maxSnack={3}>
          <Body />
        </SnackbarProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </Dorothy>
  </div>);
}

export default App;
