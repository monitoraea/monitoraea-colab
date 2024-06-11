import axios from 'axios';
import { useQuery } from 'react-query';
import ContentRenderer from './ContentRenderer';
import './ck-content-styles.css';

export default function DynamicContent({ keyRef, staleTime=3600000 /* 1h */ }) {
  
    const { data: content } = useQuery(['dynamic_content', { key_ref: keyRef }], {
      queryFn: async () => (await axios.get(`${process.env.REACT_APP_SERVER}helpbox/${keyRef}`)).data,
      enabled: !!keyRef,
      staleTime,
    });

    return <>
        {content ? <ContentRenderer text={content.text}/> : ''}
    </>
}