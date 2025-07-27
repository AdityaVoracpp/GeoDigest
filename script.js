function getColorFromSenti(senti) {
  if (senti === -1) return 'red';
  if (senti === 0) return 'yellow';
  if (senti === 1) return 'green';
  return 'gray'; // fallback
}





const map = L.map('map').setView([20, 0], 2);

let currentMarkers = [];


L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
maxZoom: 18,
}).addTo(map);

document.getElementById('queryForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const query = document.getElementById('queryInput').value.trim();
  if (!query) return;

  fetch('http://localhost:3000/news', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query })
})
.then(res => res.json())
.then(data => {

  if (data.length === 0) {
    alert('No news found for this query.');
    return;
  }

  currentMarkers.forEach(marker => map.removeLayer(marker));
  currentMarkers = [];

  

  data.forEach((article,index) => {
    const color = getColorFromSenti(article.senti);
    const marker = L.circleMarker([article.lat, article.lon], {
      color: color,
      fillColor: color,
      fillOpacity: 0.8,
      radius: 8
    }).addTo(map);

    const popupContent = `
      <strong>${article.title}</strong><br>
      ${article.description || 'No description available'}<br>
      <a href="${article.url}" target="_blank">Read more</a>
    `;

    marker.bindPopup(popupContent);
    currentMarkers.push(marker);

    const headingEle = document.getElementById(`head${index + 1}`);
    const paraEle= document.getElementById(`para${index + 1}`);

    if (headingEle) headingEle.textContent = article.title;
    if (paraEle) paraEle.textContent = article.description || 'No description available';
  });

  })
  .catch(err => {
  console.error('Fetch failed:', err); 
  });
});

// === AI Summary Modal Logic ===

const modal = document.getElementById("myModal");
const btn = document.getElementById("summarizeBtn");
const closeBtn = document.querySelector(".close");

btn.onclick = function () {
  modal.style.display = "block";
}

closeBtn.onclick = function () {
  modal.style.display = "none";
}

window.onclick = function (event) {
  if (event.target === modal) {
    modal.style.display = "none";
  }
}
