function initializeLiff() {
    liff.init({
        liffId: "1654067025-8gw745KY"
    }).then((e) => {
        if (!liff.isLoggedIn()) {
            liff.login();
        } else {
            getUserid();
            loadMap();
            myModal.show()
        }
    }).catch((err) => {
        console.log(err);
    });
}

async function getUserid() {
    const profile = await liff.getProfile();
    userid = await profile.userId;
    document.getElementById("statusMessage").innerHTML = await profile.statusMessage;
    document.getElementById("pictureUrl").src = await profile.pictureUrl;
    document.getElementById("displayName").innerHTML = await profile.displayName;
    // chkAdmin(profile.userId)
    // console.log(profile);
}

var map = L.map("map", {
    center: [16.769616, 100.198335],
    zoom: 8
});

var fc = L.featureGroup()

function loadMap() {
    var mapbox = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
        maxZoom: 18,
        id: 'mapbox/light-v9',
        tileSize: 512,
        zoomOffset: -1
    });

    const grod = L.tileLayer("https://{s}.google.com/vt/lyrs=r&x={x}&y={y}&z={z}", {
        maxZoom: 20,
        subdomains: ["mt0", "mt1", "mt2", "mt3"]
    });

    const gter = L.tileLayer('https://{s}.google.com/vt/lyrs=t,m&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    });

    const ghyb = L.tileLayer("https://{s}.google.com/vt/lyrs=y,m&x={x}&y={y}&z={z}", {
        maxZoom: 20,
        subdomains: ["mt0", "mt1", "mt2", "mt3"]
    });

    // const pro = L.tileLayer.wms("https://rti2dss.com/geoserver/th/wms?", {
    //     layers: "th:province_4326",
    //     format: "image/png",
    //     transparent: true
    // });

    var baseMap = {
        'สีเทา': mapbox.addTo(map),
        'ภูมิประเทศ': gter,
        'แผนที่ถนน': grod,
        'ภาพดาวเทียม': ghyb
    };

    var overLayer = {
        "จุดความร้อน": fc.addTo(map),
        // '<img src="https://rti2dss.com/geoserver/wms?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&WIDTH=20&HEIGHT=20&LAYER=th:province_4326" /> จังหวัด': pro
    }

    L.control.layers(baseMap, overLayer).addTo(map);
}

function onLocationFound(e) {
    console.log(e)
    // gps = L.marker(e.latlng);
    var point = turf.point([e.latlng.lng, e.latlng.lat]);
    var buffered = turf.buffer(point, 20, { units: 'kilometers' });
    var bbox = turf.bbox(buffered);
    map.fitBounds([
        [bbox[1], bbox[0]],
        [bbox[3], bbox[2]]
    ]);

    let token = "2b9b7d19f47c41ab2f58a00c0f61315f7a0c5926"
    // GET https://api.waqi.info/v2/map/bounds?latlng={{minLat}},{{minLng}},{{maxLat}},{{maxLng}}&networks=all&token={{token}}
    let aqiData = axios.get(`https://api.waqi.info/v2/map/bounds?latlng=${bbox[1]},${bbox[0]},${bbox[3]},${bbox[2]}&networks=all&token=${token}`);
    loadHotspot(aqiData);
}

function onLocationError(e) {
    console.log(e.message);
}

function refreshPage() {
    location.reload(true);
}

map.on("locationfound", onLocationFound);

var lc = L.control.locate({
    position: "topleft",
    strings: {
        title: "enable gps"
    },
    locateOptions: {
        maxZoom: 8,
        enableHighAccuracy: true
    }
}).addTo(map);

lc.start();


let loadHotspot = async (aqiData) => {
    map.eachLayer(function (layer) {
        if (layer.options.name == "lyr") {
            map.removeLayer(layer);
        }
    });

    let aqi = await aqiData;
    aqi.data.data.forEach(e => {
        var color = e.aqi <= 50 ? "green" : e.aqi <= 100 ? "yellow" : e.aqi <= 150 ? "orange" : e.aqi <= 200 ? "red" : e.aqi <= 300 ? "purple" : "maroon";
        console.log(color);
        L.circleMarker([e.lat, e.lon], {
            radius: 5,
            color: color,
            name: "lyr"
        }).bindPopup(`<div class="kanit"><b>${e.station.name}</b><br/>AQI: ${e.aqi}</div>`).addTo(fc);
    });
    myModal.hide();
}

var myModal = new bootstrap.Modal(document.getElementById('myModal'), {
    keyboard: false,
})


initializeLiff()  
