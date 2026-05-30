import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts';
import { Globe2, MapPinned, Music2, Search, ShieldQuestion } from 'lucide-react';
import entries from '../data/inferred-nationalities.json';
import './styles.css';

const COLORS = ['#fb7185', '#f97316', '#facc15', '#4ade80', '#22c55e', '#2dd4bf', '#38bdf8', '#818cf8', '#c084fc', '#f472b6'];

function countBy(rows, key) {
  return Object.entries(rows.reduce((acc, row) => {
    const value = row[key] || 'Unknown';
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {})).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
}

function avgConfidence(rows) {
  if (!rows.length) return 0;
  return Math.round(rows.reduce((sum, row) => sum + row.confidence, 0) / rows.length);
}

function Metric({ icon: Icon, label, value, note }) {
  return <div className="metric"><Icon size={22} /><div><strong>{value}</strong><span>{label}</span>{note && <small>{note}</small>}</div></div>;
}

function ChartCard({ title, children }) {
  return <section className="card"><h3>{title}</h3>{children}</section>;
}

function DataTable({ rows }) {
  return <div className="tableWrap"><table><thead><tr><th>Name</th><th>Pool</th><th>Inferred nationality / culture</th><th>Region</th><th>Confidence</th><th>Evidence</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td>{row.name}</td><td>{row.pool}</td><td>{row.country}</td><td>{row.region}</td><td><span className={`pill ${row.confidence >= 85 ? 'high' : row.confidence >= 65 ? 'medium' : 'low'}`}>{row.confidence}%</span></td><td>{row.evidence}</td></tr>)}</tbody></table></div>;
}

function App() {
  const [pool, setPool] = useState('all');
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => entries.filter(row => (pool === 'all' || row.pool === pool) && `${row.name} ${row.country} ${row.region} ${row.evidence}`.toLowerCase().includes(query.toLowerCase())), [pool, query]);
  const countryData = countBy(filtered, 'country').slice(0, 12);
  const regionData = countBy(filtered, 'region');
  const scatter = filtered.map((row, i) => ({ x: i + 1, y: row.confidence, name: row.name, country: row.country }));
  const parade = entries.filter(row => row.pool === 'parade');
  const fest = entries.filter(row => row.pool === 'street-fest');

  return <main>
    <section className="hero">
      <p className="eyebrow">Berlin Karneval der Kulturen 2026</p>
      <h1>Nationality and cultural signal explorer</h1>
      <p className="lede">A front-end landing page for inferred nationalities and cultural identities across the parade and street-fest programme. This is not passport-demographic data; each row is inferred from public names, descriptions, cultural forms, languages, and country references.</p>
      <div className="metrics">
        <Metric icon={Globe2} label="inferred entries" value={entries.length} note="starter dataset" />
        <Metric icon={MapPinned} label="parade sample" value={parade.length} />
        <Metric icon={Music2} label="street-fest sample" value={fest.length} />
        <Metric icon={ShieldQuestion} label="avg. confidence" value={`${avgConfidence(entries)}%`} />
      </div>
    </section>

    <section className="controls card">
      <div><label>Pool</label><select value={pool} onChange={event => setPool(event.target.value)}><option value="all">Whole demographic pool</option><option value="parade">Parade sample pool</option><option value="street-fest">Street fest</option></select></div>
      <div className="search"><Search size={18} /><input placeholder="Search country, group, evidence..." value={query} onChange={event => setQuery(event.target.value)} /></div>
    </section>

    <section className="grid two">
      <ChartCard title="Top inferred nationalities / cultures"><ResponsiveContainer width="100%" height={330}><BarChart data={countryData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" angle={-30} textAnchor="end" height={90} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="count" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></ChartCard>
      <ChartCard title="Regional distribution"><ResponsiveContainer width="100%" height={330}><PieChart><Pie data={regionData} dataKey="count" nameKey="name" outerRadius={110} label>{regionData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></ChartCard>
    </section>

    <section className="grid two">
      <ChartCard title="Inference confidence"><ResponsiveContainer width="100%" height={300}><ScatterChart><CartesianGrid /><XAxis dataKey="x" name="entry" /><YAxis dataKey="y" name="confidence" domain={[40, 100]} /><Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(value, name, props) => [`${value}%`, props.payload.name]} /><Scatter data={scatter} /></ScatterChart></ResponsiveContainer></ChartCard>
      <section className="card methodology"><h3>Methodology</h3><p><strong>High confidence:</strong> explicit country, nationality, flag, language, or named folklore tradition.</p><p><strong>Medium confidence:</strong> strong cultural form such as samba, dabke, cumbia, capoeira, flamenco, bhangra, or regional music/dance.</p><p><strong>Low confidence:</strong> regional or diaspora identity where multiple countries are plausible.</p><p>Sources: karneval.berlin/umzug and karneval.berlin/fest. Improve the dataset by adding evidence snippets and source URLs to <code>data/inferred-nationalities.json</code>.</p></section>
    </section>

    <section className="card"><h2>{pool === 'all' ? 'Whole demographic pool' : pool === 'parade' ? 'Parade sample pool' : 'Street fest pool'}</h2><DataTable rows={filtered} /></section>
  </main>;
}

createRoot(document.getElementById('root')).render(<App />);
