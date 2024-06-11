import React, { useState, useEffect } from 'react';
import './style.scss';
import { Link } from 'react-router-dom';

import axios from 'axios';
import { useQuery } from 'react-query';

import imgplaceholder from './placeholder.png';

function Slider({ autoplayInterval = 5000, portal = 'main', staleTime = 3600000 /* 1h */ }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const { data: slides } = useQuery(['new', { portal }], { /* TODO: tudo que pode variar: , offset */
    queryFn: async () => (await axios.get(`${import.meta.env.VITE_SERVER}content/featured/?portal=${portal}`)).data, /* TODO: se nao vou reaproveitar, fixar limit e offset? */
    staleTime,
  });

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  useEffect(() => {
    const autoplayTimer = setInterval(() => {
      const nextSlide = (currentSlide + 1) % slides.length;
      setCurrentSlide(nextSlide);
    }, autoplayInterval);

    return () => {
      clearInterval(autoplayTimer);
    };
  }, [currentSlide, slides, autoplayInterval]);

  // Verificar se slides é um array antes de acessar sua propriedade length
  if (!Array.isArray(slides) || slides.length === 0) {
    return null; // Ou qualquer outro comportamento desejado quando não há slides
  }

  const currentSlideInfo = slides[currentSlide];

  return (
    <div className="slider">
      <div className="slide">
        <img className="slide-bg" src={currentSlideInfo.featured_images || imgplaceholder} alt="" />
        <div className="slide-backdrop"></div>
        <div className="slide-content">
          <div className="slide-title">{currentSlideInfo.title}</div>
          <More data={currentSlideInfo} />
        </div>
      </div>
      <SliderNavigation
        currentSlide={currentSlide}
        totalSlides={slides.length}
        onSlideChange={goToSlide}
      />
    </div>
  );
}

function SliderNavigation({ currentSlide, totalSlides, onSlideChange }) {
  const navItems = Array.from({ length: totalSlides }, (_, index) => index);

  return (
    <div className="banner-navigation">
      {navItems.map((index) => (
        <div
          key={index}
          className={`banner-nav-item ${currentSlide === index ? 'active' : ''}`}
          onClick={() => onSlideChange(index)}
        ></div>
      ))}
    </div>
  );
}

function More({ data, ...rest }) {
  // console.log({data})
  if (data.type === 'news') return (<Link to={`/novidade-single/${data.id}`} {...rest}><button className="btn-outline">Saiba mais</button></Link>)
  if (data.type === 'page') return (<Link to={`/page/${data.id}`} {...rest}><button className="btn-outline">Saiba mais</button></Link>)  
}

export default Slider;
