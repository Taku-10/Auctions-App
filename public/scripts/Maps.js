 
 mapboxgl.accessToken = mapToken;
 const map = new mapboxgl.Map({
 container: 'map', // container ID
 style: 'mapbox://styles/mapbox/streets-v12', // style URL
 center: listing.geometry.coordinates, // starting position [lng, lat]
 zoom: 10, // starting zoom
});

new mapboxgl.Marker()
.setLngLat(listing.geometry.coordinates)
.setPopup(
    new mapboxgl.Popup({offset: 25})
    .setHTML(
        `<h3>${listing.title}</h3> <p>${listing.location}</p>`
    )
)
.addTo(map);
