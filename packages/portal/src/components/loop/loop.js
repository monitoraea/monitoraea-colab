import React from 'react';
import './style.scss';
import { Link } from 'react-router-dom';

function Loop({ loopItems }) {
  return (
    <>
      <div className="loop">
        {loopItems.map((item, index) => (
          <Link to={item.link} key={index}>
            <div className="loop-item">
              <img src={item.img} alt="" />
              <div className="backdrop"></div>
              <div className="content">
                <div className="title">{item.posttitle}</div>
                {/* <div className="views">{item.views} visualizações</div> */}
                <div className={`tag ${item.tagvalue}`}>{item.tagvalue}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}

export default Loop;
