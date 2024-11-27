import L from 'leaflet'
import { withLeaflet, GridLayer } from 'react-leaflet';
import isEqual from 'fast-deep-equal';

import './betterwms';

export const EVENTS_RE = /^on(.+)$/i;

class BetterWMS extends GridLayer {
    createLeafletElement(props) {
        let { url, onGetFeatureInfo, onFetching, ...params } = props

        if(params.cql_filter === null) delete params.cql_filter;

        const { leaflet: _l, ...options } = this.getOptions(params)
        return new L.TileLayer.BetterWMS(url, options, onGetFeatureInfo, onFetching)
    }

    updateLeafletElement(fromProps, toProps) {
        super.updateLeafletElement(fromProps, toProps)

        const { url: prevUrl, opacity: _po, zIndex: _pz, ...prevProps } = fromProps
        const { leaflet: _pl, ...prevParams } = this.getOptions(prevProps)
        const { url, opacity: _o, zIndex: _z, ...props } = toProps
        const { leaflet: _l, ...params } = this.getOptions(props)

        if (url !== prevUrl) {
            console.log(url);
            this.leafletElement.setUrl(url)
        }
        if (!isEqual(params, prevParams)) {
            console.log('AQUI')
            if(params.cql_filter === null) params.cql_filter = 'INCLUDE';
            this.leafletElement.setParams(params)
        }
    }

    getOptions(params) {
        const superOptions = super.getOptions(params)
        return Object.keys(superOptions).reduce((options, key) => {
            if (!EVENTS_RE.test(key)) {
                options[key] = superOptions[key]
            }
            return options
        }, {})
    }
}

export default withLeaflet(BetterWMS);