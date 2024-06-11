import React, { useState, useEffect, Fragment, Suspense } from "react";
import { useInView } from 'react-intersection-observer';
import styled from 'styled-components';
import './index.scss';

export default function FlowRenderer({ notifications, hasMore, onMore, onSend, loading, sending }) {
    const [message, _message] = useState('');
    const [loadMoreActive, _loadMoreActive] = useState(false);

    useEffect(()=>{
        if(loading === 'fetched')
        setTimeout(()=>_loadMoreActive(true), 3000) /* TODO: best practices */
    },[loading])

    const [ref, inView] = useInView({
        /* Optional options */
        threshold: 0,
    });

    useEffect(() => {
        if (inView && hasMore && loading === 'fetched') {
            console.log('load more...')
            onMore();
        }
    }, [inView, hasMore, onMore, loading]); 

    return (
        <div className="flow">
            <div className="flow-new">
                <textarea placeholder="Inicie um tópico..." className="textarea-box" value={message} onChange={(e) => _message(e.target.value)} />
                <button className='button-primary' disabled={sending === 'sending'} onClick={() => { onSend(message); _message('') }}>publicar</button>
            </div>
            <div className="flow-line"/>

            {notifications.map(n => {
                const { id, Element } = n;

                return <Fragment key={id}>
                    <Suspense fallback={<div>...</div>}>
                        <Element data={n} />
                    </Suspense>
                </Fragment>
            })}

            {loading === 'fetching' && <>...</>}
            {/* {loading !== 'fetching' && <>
                {hasMore && <button disabled={loading === 'fetching_more'} onClick={onMore}>{loading === 'fetching_more' ? <>...</> : <>more messages</>}</button>}
            </>} */}

            {loadMoreActive && <MoreContainer ref={ref}>...</MoreContainer>}
        </div>
    )
}

const MoreContainer = styled.div`
    width: 100%;
    margin-top: 5px; 
    position: relative;
`;