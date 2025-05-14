const apiKey = '8236ad7f4fb4ee2f566cec2244cff9b2';

let isFahrenheit = false;
let map;
let marker;
let weatherLayer;

function getWeather() {
  const city = document.getElementById("cityInput").value;

  const unit = isFahrenheit ? "imperial" : "metric";
  const urlNow = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${unit}&lang=id`;
  const urlForecast = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=${unit}&lang=id`;

  fetch(urlNow)
    .then(response => response.json())
    .then(data => {
      const weather = data.weather[0].main.toLowerCase();
      // Hapus class cuaca sebelumnya
document.body.classList.remove("weather-clear", "weather-rain", "weather-clouds", "weather-snow", "weather-thunderstorm");

// Tambahkan class baru sesuai cuaca
if (weather.includes("cloud")) document.body.classList.add("weather-clouds");
else if (weather.includes("rain") || weather.includes("drizzle")) document.body.classList.add("weather-rain");
else if (weather.includes("clear")) document.body.classList.add("weather-clear");
else if (weather.includes("snow")) document.body.classList.add("weather-snow");
else if (weather.includes("thunderstorm")) document.body.classList.add("weather-thunderstorm");
else document.body.style.backgroundColor = "#ffffff"; // default fallback


      const currentWeather = `
        <h2>${data.name}</h2>
        <p>${data.weather[0].description}</p>
        <p>Suhu : ${data.main.temp}°${isFahrenheit ? 'F' : 'C'}</p>
        <p>Angin : ${data.wind.speed} ${isFahrenheit ? "mph" : "m/s"}</p>
        <p>Kelembapan : ${data.main.humidity}%</p>
        <p>Tekanan : ${data.main.pressure} hPa</p>
        <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png">
      `;

      const localTime = new Date((data.dt + data.timezone) * 1000).toLocaleString('id-ID', { timeZoneName: 'short' });

      document.getElementById("currentTab").innerHTML = `
        <div class="current-weather">
          ${currentWeather}
          
        </div>
      `;

      document.getElementById("forecastTab").innerHTML = `
        <h3>Prediksi 5 Hari ke Depan :</h3>
        <div id="forecastList"></div>
        <canvas id="temperatureChart" width="400" height="200"></canvas>
      `;

      fetch(urlForecast)
        .then(res => res.json())
        .then(forecastData => {
          const forecastList = forecastData.list.filter(item => item.dt_txt.includes("12:00:00"));

          let forecastHTML = "<ul>";
          forecastList.forEach(item => {
            const date = new Date(item.dt_txt);
            forecastHTML += `
              <li>
                <strong>${date.toLocaleDateString("id-ID", { weekday: 'long', day: 'numeric', month: 'long' })}</strong><br>
                ${item.weather[0].description}<br>
                Suhu : ${item.main.temp}°${isFahrenheit ? 'F' : 'C'}<br>
                Angin : ${item.wind.speed} ${isFahrenheit ? "mph" : "m/s"}<br>
                Kelembapan : ${item.main.humidity}%<br>
                Tekanan : ${item.main.pressure} hPa<br>
                <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png">
              </li>
            `;
          });
          forecastHTML += "</ul>";

          document.getElementById("forecastList").innerHTML = forecastHTML;
          createTemperatureChart(forecastData);
        });

      updateMap(data.coord.lat, data.coord.lon, data.name);
    })
    .catch(() => {
      document.getElementById("weatherResult").innerHTML = `<p>Kota tidak ditemukan.</p>`;
      document.body.style.backgroundColor = "#ffffff";
    });
}

function updateMap(lat, lon, cityName) {
  if (!map) {
    map = L.map('map', { maxZoom: 12 }).setView([lat, lon], 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    marker = L.marker([lat, lon]).addTo(map).bindPopup(cityName).openPopup();

    weatherLayer = L.tileLayer(`https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${apiKey}`, {
      attribution: '&copy; <a href="https://openweathermap.org/">OpenWeatherMap</a>',
      opacity: 0.6
    }).addTo(map);

  } else {
    map.setView([lat, lon], 10);
    marker.setLatLng([lat, lon]).setPopupContent(cityName).openPopup();

    if (weatherLayer) map.removeLayer(weatherLayer);

    const selectedLayer = document.getElementById("layerSelect")?.value || "temp_new";
    weatherLayer = L.tileLayer(`https://tile.openweathermap.org/map/${selectedLayer}/{z}/{x}/{y}.png?appid=${apiKey}`, {
      attribution: '&copy; <a href="https://openweathermap.org/">OpenWeatherMap</a>',
      opacity: 0.6
    }).addTo(map);
  }
}

function changeWeatherLayer() {
  const selectedLayer = document.getElementById("layerSelect").value;
  if (weatherLayer) map.removeLayer(weatherLayer);

  weatherLayer = L.tileLayer(`https://tile.openweathermap.org/map/${selectedLayer}/{z}/{x}/{y}.png?appid=${apiKey}`, {
    attribution: '&copy; <a href="https://openweathermap.org/">OpenWeatherMap</a>',
    opacity: 0.6
  }).addTo(map);
}

function toggleDarkMode() {
  const body = document.body;
  const container = document.querySelector(".container");
  const input = document.querySelector("input");

  body.classList.toggle("dark-mode");
  container.classList.toggle("dark-mode");
  input.classList.toggle("dark-mode");

  const button = document.getElementById("toggleDarkMode");
  button.innerText = body.classList.contains("dark-mode") ? "☀️ Light Mode" : "🌙 Dark Mode";
}

function exportToPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = 20;

  // Data cuaca saat ini
  const cityName = document.querySelector("#currentTab h2")?.innerText || "Kota Tidak Diketahui";
  const desc = document.querySelector("#currentTab p:nth-child(2)")?.innerText || "";
  const temp = document.querySelector("#currentTab p:nth-child(3)")?.innerText || "";
  const wind = document.querySelector("#currentTab p:nth-child(4)")?.innerText || "";
  const humid = document.querySelector("#currentTab p:nth-child(5)")?.innerText || "";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Laporan Cuaca", 20, y);
  y += 12;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text(`Kota: ${cityName}`, 20, y); y += 8;
  doc.text(`Kondisi: ${desc}`, 20, y); y += 8;
  doc.text(`${temp}`, 20, y); y += 8;
  doc.text(`${wind}`, 20, y); y += 8;
  doc.text(`${humid}`, 20, y); y += 12;

  // Judul prediksi
  doc.setFont("helvetica", "bold");
  doc.text("Prediksi Cuaca 5 Hari Mendatang:", 20, y);
  y += 10;

  const forecastItems = document.querySelectorAll("#forecastList li");

  doc.setFont("helvetica", "normal");
  forecastItems.forEach(item => {
    const textLines = item.innerText.trim().split('\n');

    // Tanggal
    doc.text(`${textLines[0]}`, 20, y);
    y += 7;

    // Detail lainnya
    textLines.slice(1).forEach(line => {
      doc.text(line.trim(), 25, y);
      y += 6;
    });

    y += 6; // Spasi antar hari

    if (y > 260) {
      doc.addPage();
      y = 20;
    }
  });

  // Tambahkan grafik suhu jika ada
  const chartCanvas = document.getElementById("temperatureChart");
  if (chartCanvas) {
    const chartImage = chartCanvas.toDataURL("image/png");

    if (y > 180) {
      doc.addPage();
      y = 20;
    }

    doc.addImage(chartImage, 'PNG', 15, y, 180, 80);
  }

  doc.save(`${cityName}_Cuaca_Laporan.pdf`);
}

function createTemperatureChart(forecastData) {
  const labels = [];
  const temperatures = [];

  forecastData.list.forEach(item => {
    if (item.dt_txt.includes("12:00:00")) {
      const date = new Date(item.dt_txt);
      labels.push(date.toLocaleDateString("id-ID", { weekday: 'long', day: 'numeric', month: 'long' }));
      temperatures.push(item.main.temp);
    }
  });

  const ctx = document.getElementById("temperatureChart").getContext("2d");

  if (window.temperatureChart) window.temperatureChart.destroy();

  window.temperatureChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: `Suhu (°${isFahrenheit ? 'F' : 'C'})`,
        data: temperatures,
        borderColor: '#FF5733',
        fill: false,
        tension: 0.1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: false
        }
      }
    }
  });
}

function switchTab(tabId) {
  document.querySelectorAll(".tab-content").forEach(tab => tab.classList.remove("active-tab"));
  document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));

  document.getElementById(tabId).classList.add("active-tab");
  const index = tabId === "currentTab" ? 0 : 1;
  document.querySelectorAll(".tab-btn")[index].classList.add("active");

  if (tabId === "forecastTab" && window.temperatureChart) window.temperatureChart.resize();
}

// Event Listeners
document.getElementById("toggleDarkMode").addEventListener("click", toggleDarkMode);
document.getElementById("downloadPDF").addEventListener("click", exportToPDF);

document.getElementById("toggleUnit").addEventListener("click", () => {
  isFahrenheit = !isFahrenheit;
  document.getElementById("toggleUnit").innerText = isFahrenheit ? "🌡️ Celsius" : "🌡️ Fahrenheit";
  getWeather();
});
