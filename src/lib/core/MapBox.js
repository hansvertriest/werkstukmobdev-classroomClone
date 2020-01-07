/**
 * A MapBox wrapper
 * docs: https://docs.mapbox.com/mapbox-gl-js/api/
 *
 * @author Tim De Paepe <tim.depaepe@arteveldehs.be>
 */

import mapboxgl from 'mapbox-gl/dist/mapbox-gl';

class MapBox {
	constructor(apiKey, options = {}) {
		// set the apiKey & accessToken
		this.apiKey = apiKey;
		mapboxgl.accessToken = this.apiKey;

		// set the options (in case nothing was added, get the defaultOptions)
		this.options = Object.keys(options).length === 0 ? this.getDefaultOptions() : options;

		// create a new mapbox instance
		this.map = new mapboxgl.Map(this.options);
	}

	getDefaultOptions() {
		return {
			container: 'map',
			style: 'mapbox://styles/mapbox/streets-v11',
			zoom: 13,
		};
	}

	getMap() {
		return this.map;
	}

	goToCoords(long, lat) {
		this.map.jumpTo({ center: [long, lat] });
		this.map.zoomTo(16);
	}

	flyToCoords(long, lat) {
		this.map.flyTo({ center: [long, lat] });
	}

	getMemberLayers(members) {
		const allLayers = this.getMap().getStyle().layers;
		return allLayers.filter((layer) => members.includes(layer.id))
			.map((layer) => layer.id);
	}

	addPoint(source, coordinates) {
		this.getMap().addSource(source, {
			type: 'geojson',
			data: {
				type: 'Point',
				coordinates,
			},
		});
		this.getMap().addLayer({
			id: source,
			source,
			type: 'circle',
			paint: {
				'circle-radius': 10,
				'circle-color': '#007cbf',
			},
		});
	}

	removePoint(source) {
		this.getMap().removeLayer(source);
		this.getMap().removeSource(source);
	}

	updatePointcolor(source, color) {
		this.getMap().setPaintProperty(source, 'circle-color', color);
	}

	smoothDotMove(source, data, time) {
		const frameTime = 400;
		const framesAmount = Math.floor(time / frameTime);
		let currentFrame = 0;
		const lonOld = this.getMap().getSource(source)._data.coordinates[0];
		const latOld = this.getMap().getSource(source)._data.coordinates[1];
		const lonDifference = lonOld - data.coordinates[0];
		const latDifference = latOld - data.coordinates[1];
		const lonPerFrame = lonDifference / framesAmount;
		const latPerFrame = latDifference / framesAmount;
		const interval = setInterval(() => {
			const lonPrevious = this.getMap().getSource(source)._data.coordinates[0];
			const latPrevious = this.getMap().getSource(source)._data.coordinates[1];
			// calculate new distance
			// create a geoJson object
			const newData = {
				type: 'Point',
				coordinates: [lonPrevious + lonPerFrame, latPrevious + latPerFrame],
			};
			// update location
			this.getMap().getSource(source).setData(newData);
			// check if all frames have been updated
			if (currentFrame === framesAmount) {
				clearInterval(interval);
				console.log('step done');
			}
			// add to curretnframe
			currentFrame++;
		}, frameTime);
	}

	changeData(source, data) {
		this.getMap().getSource(source).setData(data);
		// this.smoothDotMove(source, data, 3000);
	}

	checkDistance(lon1, lat1, lon2, lat2) {
		if ((lat1 === lat2) && (lon1 === lon2)) {
			return 0;
		} else {
			const radlat1 = (Math.PI * lat1) / 180;
			const radlat2 = (Math.PI * lat2) / 180;
			const theta = lon1 - lon2;
			const radtheta = (Math.PI * theta) / 180;
			// eslint-disable-next-line max-len
			let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
			if (dist > 1) {
				dist = 1;
			}
			dist = Math.acos(dist);
			dist = (dist * 180) / Math.PI;
			dist = dist * 60 * 1.1515;
			dist *= 1.609344;
			return dist;
		}
	}
}

export default MapBox;
