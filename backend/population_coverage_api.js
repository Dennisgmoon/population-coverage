
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const haversine = require('haversine-distance');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

let zipData = [];
try {
  const filePath = path.join(__dirname, 'zip_population_coordinates.json');
  if (fs.existsSync(filePath)) {
    zipData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    console.log(`✅ Loaded ${zipData.length} ZIP records`);
  } else {
    console.error('❌ ZIP data file not found.');
  }
} catch (err) {
  console.error('Error loading ZIP data:', err);
}

app.get('/api/coverage/:zip', (req, res) => {
  const originZip = req.params.zip;
  const origin = zipData.find(z => z.zip === originZip);
  if (!origin) return res.status(404).json({ error: 'ZIP not found' });

  const results = [];
  for (let radius = 5; radius <= 110; radius += 5) {
    const zipsInRadius = zipData.filter(z => {
      const dist = haversine({ lat: origin.lat, lon: origin.lng }, { lat: z.lat, lon: z.lng }) / 1609.34;
      return dist <= radius;
    });
    const population = zipsInRadius.reduce((sum, z) => sum + z.population, 0);
    results.push({
      radius,
      population,
      zipCount: zipsInRadius.length,
      zips: zipsInRadius.map(z => z.zip)
    });
  }

  res.json(results);
});

app.post('/api/zips/details', (req, res) => {
  const { zips } = req.body;
  const found = zipData.filter(z => zips.includes(z.zip));
  res.json(found);
});

app.listen(PORT, () => {
  console.log(`🚀 Backend API running on port ${PORT}`);
});
