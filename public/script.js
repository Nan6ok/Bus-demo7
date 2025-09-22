// 香港巴士 API 來源：https://data.gov.hk/tc-data/dataset/hk-td-tis_21-etabus-routes-stop
// 九巴、新巴/城巴 都有 API

const map = L.map("map").setView([22.3193, 114.1694], 12); // 中環中心點
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap",
}).addTo(map);

const routeSelect = document.getElementById("routeSelect");
const showRouteBtn = document.getElementById("showRoute");
let busMarkers = [];

// 🔹 1. 取九巴所有路線
async function loadRoutes() {
  let res = await fetch("https://data.etabus.gov.hk/v1/transport/kmb/route/");
  let data = await res.json();

  data.data.forEach(route => {
    let opt = document.createElement("option");
    opt.value = route.route;
    opt.textContent = "KMB " + route.route;
    routeSelect.appendChild(opt);
  });
}
loadRoutes();

// 🔹 2. 顯示路線 + 巴士實時位置
showRouteBtn.addEventListener("click", async () => {
  clearMarkers();
  const routeNo = routeSelect.value;
  if (!routeNo) return;

  // 路線站點
  let stopsRes = await fetch(`https://data.etabus.gov.hk/v1/transport/kmb/route-stop/${routeNo}/inbound/1`);
  let stopsData = await stopsRes.json();

  stopsData.data.forEach(async stop => {
    let stopInfoRes = await fetch(`https://data.etabus.gov.hk/v1/transport/kmb/stop/${stop.stop}`);
    let stopInfo = await stopInfoRes.json();
    let lat = stopInfo.data.lat;
    let long = stopInfo.data.long;

    L.marker([lat, long]).addTo(map).bindPopup(`巴士站: ${stopInfo.data.name_tc}`);
  });

  // 🔹 3. 每 5 秒更新實時巴士位置
  setInterval(async () => {
    clearMarkers();
    let etaRes = await fetch(`https://data.etabus.gov.hk/v1/transport/kmb/eta/${stopsData.data[0].stop}/${routeNo}/1`);
    let etaData = await etaRes.json();

    etaData.data.forEach(bus => {
      if (bus.eta) {
        let lat = 22.3193 + (Math.random() - 0.5) * 0.1; // demo 假位置
        let long = 114.1694 + (Math.random() - 0.5) * 0.1;
        let marker = L.marker([lat, long], { icon: busIcon })
          .addTo(map)
          .bindPopup(`路線 ${bus.route}<br>車牌: ${bus.license_plate || "未知"}<br>到達時間: ${bus.eta}`);
        busMarkers.push(marker);
      }
    });
  }, 5000);
});

// 清除舊巴士 marker
function clearMarkers() {
  busMarkers.forEach(m => map.removeLayer(m));
  busMarkers = [];
}

// 巴士 icon
const busIcon = L.icon({
  iconUrl: "assets/bus-icon.png",
  iconSize: [32, 32],
});
