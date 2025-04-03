
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from 'recharts';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export default function App() {
  const [zip, setZip] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCheckCoverage = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/coverage/${zip}`);
      if (!response.ok) throw new Error('ZIP code not found or server error.');
      const data = await response.json();

      let maxDelta = 0;
      let highlightRadius = null;
      for (let i = 1; i < data.length; i++) {
        const delta = data[i].population - data[i - 1].population;
        data[i].delta = delta;
        if (delta > maxDelta) {
          maxDelta = delta;
          highlightRadius = data[i].radius;
        }
      }

      setResults(data.map(d => ({
        ...d,
        highlight: d.radius === highlightRadius,
        percent: i > 0 ? ((d.population - data[i - 1].population) / data[i - 1].population) * 100 : 0
      })));
    } catch (err) {
      setError(err.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>🚀 Population Coverage by ZIP</h1>
      <p>Enter a ZIP code to see population coverage by distance radius.</p>
      <input
        value={zip}
        onChange={(e) => setZip(e.target.value)}
        placeholder="Enter ZIP"
        style={{ marginRight: '1rem', padding: '0.5rem' }}
      />
      <button onClick={handleCheckCoverage} disabled={loading}>
        {loading ? 'Loading...' : 'Check Coverage'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {results.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={results}>
              <XAxis dataKey="radius" label={{ value: 'Radius (mi)', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Population', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value) => value.toLocaleString()} />
              <Bar dataKey="population" fill="#3b82f6">
                <LabelList
                  dataKey="delta"
                  position="top"
                  formatter={(val, entry) => (entry.highlight ? `+${val.toLocaleString()}` : '')}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p style={{ fontSize: '0.9rem', marginTop: '0.5rem', color: '#555' }}>
            Highlighted bar shows where the largest population increase occurs per radius.
          </p>
        </div>
      )}
    </div>
  );
}
