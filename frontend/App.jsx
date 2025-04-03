
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, Cell } from 'recharts';

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

      setResults(data.map((d, i) => {
        const delta = i > 0 ? d.population - data[i - 1].population : 0;
        return {
          ...d,
          delta,
          highlight: d.radius === highlightRadius,
          percent: i > 0 ? (delta / data[i - 1].population) * 100 : 0
        };
      }));
    } catch (err) {
      setError(err.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    if (results.length === 0) return;
    const rows = [["Radius (mi)", "ZIP Code"]];
    results.forEach((r) => {
      r.zips.forEach((z) => {
        rows.push([r.radius, z]);
      });
    });
    const csvContent = rows.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `zip_coverage_${zip}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      {results.length > 0 && (
        <>
          <button onClick={handleDownloadCSV} style={{ marginLeft: '1rem', padding: '0.5rem' }}>
            ⬇️ Download ZIP Coverage CSV
          </button>
          <div style={{ marginTop: '2rem' }}>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={results} margin={{ top: 20, right: 20, left: 40, bottom: 40 }}>
                <XAxis
                  dataKey="radius"
                  tickFormatter={(value) => `${value} mi`}
                  tick={{ fontSize: 12, fill: '#555' }}
                  label={{ value: 'Radius (miles)', position: 'insideBottom', offset: -5 }}
                />
                <YAxis
                  tickFormatter={(value) => {
                    if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
                    if (value >= 1000) return (value / 1000).toFixed(0) + 'K';
                    return value;
                  }}
                  tick={{ fontSize: 12, fill: '#555' }}
                  label={{ value: 'Population', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip formatter={(value) => value.toLocaleString()} />
                <Bar dataKey="population" isAnimationActive={false}>
                  <LabelList
                    dataKey="delta"
                    position="top"
                    formatter={(val, entry = {}) => (entry.highlight ? `+${val.toLocaleString()}` : '')}
                  />
                  {results.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.highlight ? '#f59e0b' : '#3b82f6'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p style={{ fontSize: '0.9rem', marginTop: '0.5rem', color: '#555' }}>
              Highlighted bar shows where the largest population increase occurs per radius.
            </p>
          </div>
        </>
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
