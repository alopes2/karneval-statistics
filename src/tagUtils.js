export function splitTags(value) {
  if (!value) return ['Unknown'];
  return value.split('/').map(tag => tag.trim()).filter(Boolean);
}

export function enrichEntries(entries, overrides) {
  return entries.map(row => {
    const override = overrides[row.id] || {};
    const merged = {
      ...row,
      ...override,
      description: override.description || row.description || row.evidence,
    };

    return {
      ...merged,
      tags: override.tags || row.tags || splitTags(merged.country),
    };
  });
}

export function countTags(rows) {
  return Object.entries(rows.reduce((acc, row) => {
    row.tags.forEach(tag => {
      acc[tag] = (acc[tag] || 0) + 1;
    });
    return acc;
  }, {})).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
}
