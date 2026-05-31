export function splitTags(value) {
  if (!value) return ['Unknown'];
  return value.split('/').map(tag => tag.trim()).filter(Boolean);
}

export function enrichEntries(entries) {
  return entries.map(row => ({
    ...row,
    description: row.description || '',
    tags: row.tags || splitTags(row.country),
  }));
}

export function countTags(rows) {
  return Object.entries(rows.reduce((acc, row) => {
    row.tags.forEach(tag => {
      acc[tag] = (acc[tag] || 0) + 1;
    });
    return acc;
  }, {})).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
}
