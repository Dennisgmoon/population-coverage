
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const pathModule = require('path');
const haversine = require('haversine-distance');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Load ZIP data
let zipData = [];
try {
  const filePath = pathModule.join(__dirname, 'zip_population_coordinates.json');
  if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    zipData = JSON.parse(fileContent);
    console.log(`✅ Loaded ${zipData.length} ZIP entries`);
  } else {
    console.warn('⚠️ zip_population_coordinates.json not found, continuing without coverage data.');
  }
} catch (err) {
  console.error('❌ Error loading ZIP data:', err);
}

// API: Population coverage by radius
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

// API: Lookup ZIP coordinates
app.post('/api/zips/details', (req, res) => {
  const { zips } = req.body;
  const found = zipData.filter(z => zips.includes(z.zip));
  res.json(found);
});

// API: Cluster data (optional)
app.get('/api/zip-clusters', (req, res) => {
  const clusterPath = pathModule.join(__dirname, 'zip_clusters_sample_GA_top20.json');
  if (!fs.existsSync(clusterPath)) {
    return res.status(404).json({ error: 'Cluster data not found' });
  }

  const clusterData = JSON.parse(fs.readFileSync(clusterPath, 'utf-8'));
  res.json(clusterData);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
