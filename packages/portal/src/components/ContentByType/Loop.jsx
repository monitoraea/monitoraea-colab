import { Link } from 'react-router-dom';
import { portals } from '../../utils';
import imgplaceholder from './placeholder.png';

import './style.scss';

export default function Loop({ data, portal='main' }) {
    return (
        <>
            <div className="loop">
                {data.map((item) => (
                    <Link to={`/novidade-single/${item.id}`} key={item.id}>
                        <div className="loop-item">
                            {!!item.featured_images && <img src={item.featured_images} alt="" />}
                            {!item.featured_images && <img src={imgplaceholder} alt="" />}
                            <div className="backdrop"></div>
                            <div className="content">
                                <div className="title">{item.title}</div>
                                {/* <div className="views">{item.views} visualizações</div> */}
                                {portal === 'main' && item.portal !== 'main' && <div className={`tag ${item.portal}`}>{portals[item.portal][1]}</div>}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </>
    );
}