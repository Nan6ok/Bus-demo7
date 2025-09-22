// 初始化地圖
const map = L.map("map").setView([22.3193, 114.1694], 12);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap",
}).addTo(map);

const routeSelect = document.getElementById("routeSelect");
const showRouteBtn = document.getElementById("showRoute");
let busMarkers = [];

// 巴士 icon（直接用網上 URL）
const busIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/61/61231.png",
  iconSize: [32, 32],
});

// 🔹 1. 載入所有九巴路線
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

// 🔹 2. 顯示路線 + 巴士站 + 模擬實時車
showRouteBtn.addEventListener("click", async () => {
  clearMarkers();
  const routeNo = routeSelect.value;
  if (!routeNo) return;

  // 取路線站點
  let stopsRes = await fetch(`https://data.etabus.gov.hk/v1/transport/kmb/route-stop/${routeNo}/inbound/1`);
  let stopsData = await stopsRes.json();

  stopsData.data.forEach(async stop => {
    let stopInfoRes = await fetch(`https://data.etabus.gov.hk/v1/transport/kmb/stop/${stop.stop}`);
    let stopInfo = await stopInfoRes.json();
    let lat = stopInfo.data.lat;
    let long = stopInfo.data.long;

    L.marker([lat, long]).addTo(map).bindPopup(`巴士站: ${stopInfo.data.name_tc}`);
  });

  // 🔹 模擬巴士每 5 秒移動（真實 API 沒有 GPS，只能假裝）
  setInterval(async () => {
    clearMarkers();

    stopsData.data.slice(0, 5).forEach((stop, index) => {
      let latShift = 0.001 * index + (Math.random() - 0.5) * 0.002;
      let longShift = 0.001 * index + (Math.random() - 0.5) * 0.002;
      let stopLat = 22.3193 + latShift;
      let stopLong = 114.1694 + longShift;

      let marker = L.marker([stopLat, stopLong], { icon: busIcon })
        .addTo(map)
        .bindPopup(`路線 ${routeNo}<br>模擬巴士位置`);
      busMarkers.push(marker);
    });
  }, 5000);
});

// 清除舊巴士 marker
function clearMarkers() {
  busMarkers.forEach(m => map.removeLayer(m));
  busMarkers = [];
}
