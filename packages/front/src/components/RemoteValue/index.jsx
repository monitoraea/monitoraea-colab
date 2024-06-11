import { useQuery } from 'react-query';

export function RemoteValue({ url }) {
    const { data } = useQuery( url );

    return (<div>{data}</div>)
}