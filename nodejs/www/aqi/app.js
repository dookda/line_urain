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

    var baseMap = {
        'สีเทา': mapbox.addTo(map),
        'ภูมิประเทศ': gter,
        'แผนที่ถนน': grod,
        'ภาพดาวเทียม': ghyb
    };

    var overLayer = {
        "จุดตรวจวัด AQI": fc.addTo(map),
        // '<img src="https://rti2dss.com/geoserver/wms?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&WIDTH=20&HEIGHT=20&LAYER=th:province_4326" /> จังหวัด': pro
    }

    L.control.layers(baseMap, overLayer).addTo(map);
}

function onLocationFound(e) {
    document.getElementById("lat").value = e.latlng.lat;
    document.getElementById("lng").value = e.latlng.lng;
}

function onLocationError(e) {
    console.log(e.message);
}

function refreshPage() {
    location.reload(true);
}

// map.on("locationfound", onLocationFound);
map.locate({ setView: true, maxZoom: 14 });
navigator.geolocation.getCurrentPosition(function (position) {
    // map.setView([position.coords.latitude, position.coords.longitude], 14);
    // document.getElementById("lat").value = position.coords.latitude;
    // document.getElementById("lng").value = position.coords.longitude;
    getLBS(position.coords.latitude, position.coords.longitude);
});

map.on("click", function (e) {
    // document.getElementById("lat").value = e.latlng.lat;
    // document.getElementById("lng").value = e.latlng.lng;
    getLBS(e.latlng.lat, e.latlng.lng);
});

var lc = L.control.locate({
    position: "topleft",
    strings: {
        title: "enable gps"
    },
    locateOptions: {
        maxZoom: 18,
        enableHighAccuracy: true
    }
}).addTo(map);

lc.start();

var myModal = new bootstrap.Modal(document.getElementById('myModal'), {
    keyboard: false,
})

let getLBS = (lat, lng) => {
    map.eachLayer(function (layer) {
        if (layer.options.name == "lyr") {
            map.removeLayer(layer);
        }
    });
    // console.log("getLBS");
    // let lat = document.getElementById("lat").value;
    // let lng = document.getElementById("lng").value;
    var point = turf.point([Number(lng), Number(lat)]);
    var buffered = turf.buffer(point, 20, { units: 'kilometers' });
    var bbox = turf.bbox(buffered);
    // map.fitBounds([
    //     [bbox[1], bbox[0]],
    //     [bbox[3], bbox[2]]
    // ]);

    let token = "2b9b7d19f47c41ab2f58a00c0f61315f7a0c5926"
    // GET https://api.waqi.info/v2/map/bounds?latlng={{minLat}},{{minLng}},{{maxLat}},{{maxLng}}&networks=all&token={{token}}
    axios.get(`https://api.waqi.info/v2/map/bounds?latlng=${bbox[1]},${bbox[0]},${bbox[3]},${bbox[2]}&networks=all&token=${token}`)
        .then(res => {
            // console.log(res);
            res.data.data.forEach(e => {
                var color = e.aqi <= 50 ? "#009966" : e.aqi <= 100 ? "#ffde33" : e.aqi <= 150 ? "#ff9933" : e.aqi <= 200 ? "#cc0033" : e.aqi <= 300 ? "#660099" : "#7e0023";
                // console.log(color);
                L.circleMarker([e.lat, e.lon], {
                    radius: 7,
                    color: color,
                    name: "lyr"
                }).bindPopup(`<div class="kanit"><b>${e.station.name}</b><br/>AQI: ${e.aqi}</div>`).addTo(fc);
            });

        })

    myModal.hide();
    axios.get(`https://api.waqi.info/feed/geo:${lat};${lng}/?token=${token}`)
        .then(res => {
            document.getElementById("aqiTxt").innerHTML = `
                <span class="badge rounded-pill text-bg-light">aqi: ${res.data.data.aqi}</span> 
                <span class="badge rounded-pill text-bg-light">pm2.5: ${res.data.data.iaqi.pm25.v}</span>
                <span class="badge rounded-pill text-bg-light">${res.data.data.time.s}</span>
            `;
        })
}

var legend = L.control({ position: "bottomleft" });

function showLegend() {
    legend.onAdd = function () {
        var div = L.DomUtil.create("div", "legend");
        div.innerHTML += `<button class="btn btn-sm" onClick="hideLegend()">
      <span class="kanit">ซ่อนสัญลักษณ์</span><i class="fa fa-angle-double-down" aria-hidden="true"></i>
    </button><br>`;
        // div.innerHTML += "<h4>Tegnforklaring</h4>";
        div.innerHTML += '<i style="background: #009966"></i><span class="kanit">อากาศดี</span><br>';
        div.innerHTML += '<i style="background: #ffde33"></i><span class="kanit">อากาศดีปานกลาง</span><br>';
        div.innerHTML += '<i style="background: #ff9933"></i><span class="kanit">อากาศเริ่มไม่ดี</span><br>';
        div.innerHTML += '<i style="background: #cc0033"></i><span class="kanit">อากาศไม่ดี</span><br>';
        div.innerHTML += '<i style="background: #660099"></i><span class="kanit">อากาศไม่มีอย่างยิ่ง</span><br>';
        div.innerHTML += '<i style="background: #7e0023"></i><span class="kanit">อันตราย</span><br>';
        // div.innerHTML += '<i style="background: #bd0000"></i><span class="kanit">ฝนตกหนักมาก</span><br>';
        return div;
    };
    legend.addTo(map);
}

function hideLegend() {
    legend.onAdd = function () {
        var div = L.DomUtil.create('div', 'info legend')
        div.innerHTML += `<button class="btn btn-sm" onClick="showLegend()">
        <small class="prompt"><span class="kanit">แสดงสัญลักษณ์</span></small> 
        <i class="fa fa-angle-double-up" aria-hidden="true"></i>
    </button><br> `;
        return div;
    };
    legend.addTo(map);
}

hideLegend()
initializeLiff()

