function getColorFromSenti(senti) {
  if (senti === -1) return 'red';
  if (senti === 0) return 'yellow';
  if (senti === 1) return 'green';
  return 'gray'; // fallback
}





const map = L.map('map').setView([20, 0], 2); // world view

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
  console.log('Response from backend:', data);

    ///////////mark
  if (data.length === 0) {
    alert('No news found for this query.');
    return;
  }

  // Clear old markers if any
  currentMarkers.forEach(marker => map.removeLayer(marker));
  currentMarkers = [];

  data.forEach(article => {
    const color = getColorFromSenti(article.senti);
    const marker = L.circleMarker([article.lat, article.lon], {
      color: color,
      fillColor: color,
      fillOpacity: 0.8,
      radius: 8
    }).addTo(map);

    const popupContent = `
      <strong>${article.title}</strong><br>
      ${article.description || 'No description'}<br>
      <a href="${article.url}" target="_blank">Read more</a>
    `;

    marker.bindPopup(popupContent);
    currentMarkers.push(marker);
  });

  })
  .catch(err => {
  console.error('Fetch failed:', err); // ← this WILL tell you what went wrong
  });
});
