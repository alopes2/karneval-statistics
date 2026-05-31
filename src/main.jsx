import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts';
import { ChevronDown, Globe2, MapPinned, Music2, Search, ShieldQuestion } from 'lucide-react';
import entries from '../data/inferred-nationalities.json';
import { entryOverrides } from './dataOverrides';
import { countTags, enrichEntries } from './tagUtils';
import './styles.css';

const COLORS = ['#fb7185', '#f97316', '#facc15', '#4ade80', '#22c55e', '#2dd4bf', '#38bdf8', '#818cf8', '#c084fc', '#f472b6'];
const enrichedEntries = enrichEntries(entries, entryOverrides);

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
  return <section className="card chartCard"><h3>{title}</h3>{children}</section>;
}

function TagList({ tags }) {
  return <div className="tagList">{tags.map(tag => <span className="tag" key={tag}>{tag}</span>)}</div>;
}

function DataTable({ rows }) {
  return <div className="tableWrap"><table><thead><tr><th>Name</th><th>Pool</th><th>Nationality / culture tags</th><th>Region</th><th>Confidence</th><th>Description</th><th>Evidence</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td data-label="Name">{row.name}</td><td data-label="Pool">{row.pool}</td><td data-label="Nationality / culture tags"><TagList tags={row.tags} /></td><td data-label="Region">{row.region}</td><td data-label="Confidence"><span className={`pill ${row.confidence >= 85 ? 'high' : row.confidence >= 65 ? 'medium' : 'low'}`}>{row.confidence}%</span></td><td data-label="Description">{row.description}</td><td data-label="Evidence">{row.evidence}</td></tr>)}</tbody></table></div>;
}

function SampleDataAccordion({ title, rows }) {
  const [isOpen, setIsOpen] = useState(false);
  return <section className="card sampleAccordion"><button className="accordionToggle" type="button" onClick={() => setIsOpen(open => !open)} aria-expanded={isOpen}><div><h2>{title}</h2><p>{rows.length} entries shown. Use search and pool filters to inspect descriptions, evidence, and tags.</p></div><ChevronDown className={isOpen ? 'chevron open' : 'chevron'} size={24} aria-hidden="true" /></button>{isOpen && <DataTable rows={rows} />}</section>;
}

function App() {
  const [pool, setPool] = useState('all');
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => enrichedEntries.filter(row => (pool === 'all' || row.pool === pool) && `${row.name} ${row.country} ${row.tags.join(' ')} ${row.region} ${row.description} ${row.evidence}`.toLowerCase().includes(query.toLowerCase())), [pool, query]);
  const countryData = countTags(filtered).slice(0, 14);
  const regionData = countBy(filtered, 'region');
  const scatter = filtered.map((row, i) => ({ x: i + 1, y: row.confidence, name: row.name, country: row.tags.join(' / ') }));
  const parade = enrichedEntries.filter(row => row.pool === 'parade');
  const fest = enrichedEntries.filter(row => row.pool === 'street-fest');

  return <main>
    <section className="hero">
      <p className="eyebrow">Berlin Karneval der Kulturen 2026</p><h1>Nationality and cultural signal explorer</h1>
      <p className="lede">A front-end landing page for inferred nationalities and cultural identities across the parade and street-fest programme. Entries can have multiple tags when a group or style points to more than one country or culture.</p>
      <div className="metrics"><Metric icon={Globe2} label="inferred entries" value={enrichedEntries.length} note="expanded source-backed sample" /><Metric icon={MapPinned} label="parade sample" value={parade.length} /><Metric icon={Music2} label="street-fest sample" value={fest.length} /><Metric icon={ShieldQuestion} label="avg. confidence" value={`${avgConfidence(enrichedEntries)}%`} /></div>
    </section>
    <section className="controls card"><div className="field"><label>Pool</label><select value={pool} onChange={event => setPool(event.target.value)}><option value="all">Whole demographic pool</option><option value="parade">Parade sample pool</option><option value="street-fest">Street fest</option></select></div><div className="search"><Search size={18} /><input placeholder="Search country, tag, group, description, evidence..." value={query} onChange={event => setQuery(event.target.value)} /></div></section>
    <section className="grid two"><ChartCard title="Top inferred nationality / culture tags"><ResponsiveContainer width="100%" height={330}><BarChart data={countryData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" angle={-30} textAnchor="end" height={95} interval={0} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="count" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></ChartCard><ChartCard title="Regional distribution"><ResponsiveContainer width="100%" height={330}><PieChart><Pie data={regionData} dataKey="count" nameKey="name" outerRadius={110} label>{regionData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></ChartCard></section>
    <section className="grid two"><ChartCard title="Inference confidence"><ResponsiveContainer width="100%" height={300}><ScatterChart><CartesianGrid /><XAxis dataKey="x" name="entry" /><YAxis dataKey="y" name="confidence" domain={[40, 100]} /><Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(value, name, props) => [`${value}%`, props.payload.name]} /><Scatter data={scatter} /></ScatterChart></ResponsiveContainer></ChartCard><section className="card methodology"><h3>Methodology</h3><p><strong>High confidence:</strong> explicit country, nationality, flag, language, or named folklore tradition.</p><p><strong>Medium confidence:</strong> strong cultural form such as samba, salsa, cumbia, capoeira, flamenco, bhangra, or regional music/dance.</p><p><strong>Multi-tag entries:</strong> styles with layered roots are counted across all relevant tags. For example, Salsa Caleña can count as Colombia and Caribbean; Salsa Cubana can count as Cuba and Caribbean.</p><p>Broad regional labels are kept only where the source does not give enough country signal.</p></section></section>
    <SampleDataAccordion title={pool === 'all' ? 'Whole demographic pool' : pool === 'parade' ? 'Parade sample pool' : 'Street fest pool'} rows={filtered} />
  </main>;
}

createRoot(document.getElementById('root')).render(<App />);
