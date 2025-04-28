import L from 'leaflet';

/* Full credits to https://gist.github.com/rclark/6908938 */

L.TileLayer.BetterWMS = L.TileLayer.WMS.extend({

    initialize: function (url, options, onGetFeatureInfo, onFetching) {
        if (onGetFeatureInfo) this._onGetFeatureInfo = onGetFeatureInfo;
        if (onFetching) this._onFetching = onFetching;

        L.TileLayer.WMS.prototype.initialize.call(this, url, options);
    },

    onAdd: function (map) {
        // Triggered when the layer is added to a map.
        //   Register a click listener, then do all the upstream WMS things
        L.TileLayer.WMS.prototype.onAdd.call(this, map);
        map.on('click', this.getFeatureInfo, this);
    },

    onRemove: function (map) {
        // Triggered when the layer is removed from a map.
        //   Unregister a click listener, then do all the upstream WMS things
        L.TileLayer.WMS.prototype.onRemove.call(this, map);
        map.off('click', this.getFeatureInfo, this);
    },

    getFeatureInfo: function (evt) {
        // Make an AJAX request to the server and hope for the best
        var url = this.getFeatureInfoUrl(evt.latlng),
            showResults = L.Util.bind(this.showGetFeatureInfo, this);

        this._onFetching(true);
        fetch(url)
            .then(response => response.json())
            .then(data => {
                this._onFetching(false);
                const err = typeof data === 'object' ? null : data;
                showResults(err, evt.latlng, data);
            });
    },

    getFeatureInfoUrl: function (latlng) {
        // Construct a GetFeatureInfo request URL given a point
        var point = this._map.latLngToContainerPoint(latlng, this._map.getZoom()),
            size = this._map.getSize(),
            params = {
                request: 'GetFeatureInfo',
                service: 'WMS',
                srs: 'EPSG:4326',
                styles: this.wmsParams.styles,
                transparent: this.wmsParams.transparent,
                version: this.wmsParams.version,
                format: this.wmsParams.format,
                bbox: this._map.getBounds().toBBoxString(),
                height: size.y,
                width: size.x,
                layers: this.wmsParams.layers,
                query_layers: this.wmsParams.layers,
                // info_format: 'text/html'
                info_format: 'application/json'
            };

        params[params.version === '1.3.0' ? 'i' : 'x'] = Math.round(point.x);
        params[params.version === '1.3.0' ? 'j' : 'y'] = Math.round(point.y);

        if(this.wmsParams?.cql_filter) params.cql_filter = this.wmsParams.cql_filter;

        console.log(this._url + L.Util.getParamString(params, this._url, true))

        return this._url + L.Util.getParamString(params, this._url, true);
    },

    showGetFeatureInfo: function (err, latlng, content) {
        if (err) { console.log(err); return; } // do nothing if there's an error

        this._onGetFeatureInfo(content, latlng);
    }
});

L.tileLayer.betterWms = function (url, options) {
    return new L.TileLayer.BetterWMS(url, options);
};