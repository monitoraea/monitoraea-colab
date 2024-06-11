import React, { useState } from 'react';
import './style.scss';

function AccordeonItem({ title, content, isOpen, onClick }) {
  return (
    <div className="accordeon-item">
      <div className={`accordeon-title ${isOpen ? 'open' : ''}`} onClick={onClick}>
        {title}
        <div className="icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="8" viewBox="0 0 12 8" fill="none">
            <path d="M0.651367 0.868408L6.07585 6.78496L11.5003 0.868408" stroke="#666666" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
      {isOpen && <div className="accordeon-content">{content}</div>}
    </div>
  );
}

function Accordeon({ items }) {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleItem = (index) => {
    if (index === openIndex) {
      // Se o mesmo item estiver aberto, feche-o
      setOpenIndex(null);
    } else {
      setOpenIndex(index);
    }
  };

  return (
    <div className="accordeon">
      {items.map((item, index) => (
        <AccordeonItem
          key={index}
          title={item.title}
          content={item.content}
          isOpen={index === openIndex}
          onClick={() => toggleItem(index)}
        />
      ))}
    </div>
  );
}

export default Accordeon;
