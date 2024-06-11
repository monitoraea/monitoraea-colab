import React from 'react';
import './app.scss';
import 'leaflet/dist/leaflet.css';

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { QueryClient, QueryClientProvider } from 'react-query'

import axios from 'axios';
import Nav from './components/nav/nav';
import Footer from './components/footer/footer';
import Home from './pages/Home/Home';
import Facilitadores from './pages/Facilitadores/Facilitadores';
import Novidades from './pages/Novidades/Novidades';
import NovidadeSingle from './pages/NovidadeSingle/NovidadeSingle';
import ProjetoSingle from './pages/ProjetoSingle/ProjetoSingle';
import PPEA from './pages/PPEA/PPEA';
import PPPZCM from './pages/PPPZCM/PPPZCM';
import ANPPEA from './pages/ANPPEA/';
import Monitora from './pages/Monitora/Monitora';
import ScrollToTop from './components/ScrollTop';
import Login from './pages/Login';

function App() {

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryFn: async ({ queryKey }) => (await axios.get(`${import.meta.env.VITE_SERVER}${queryKey}`)).data,
        retry: false,
      },
    },
  })

  return (<QueryClientProvider client={queryClient}>
    <Router>
      <ScrollToTop />
      <Nav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/facilitadores" element={<Facilitadores />} />
        <Route path="/novidades/:content_type/:portal?" element={<Novidades />} />
        <Route path="/novidade-single/:id" element={<NovidadeSingle />} />
        <Route path="/page/:id" element={<NovidadeSingle />} />
        <Route path="/projeto-single/:id" element={<ProjetoSingle />} />
        <Route path="/sobre" element={<Monitora />} />
        <Route path="/sobre/ppea" element={<PPEA />} />
        <Route path="/sobre/pppzcm" element={<PPPZCM />} />
        <Route path="/sobre/anppea" element={<ANPPEA />} />
        <Route path="/login" element={<Login />} />
      </Routes>
      <Footer />
    </Router>
  </QueryClientProvider>);
}

export default App;
