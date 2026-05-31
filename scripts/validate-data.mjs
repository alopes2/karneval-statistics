import rows from '../data/inferred-nationalities.json' with { type: 'json' };

const errors = [];
const ids = new Set();

for (const row of rows) {
  for (const key of ['id', 'pool', 'name', 'country', 'region', 'confidence', 'tags', 'description', 'evidence']) {
    if (row[key] === undefined || row[key] === null || row[key] === '') {
      errors.push(`${row.id || row.name}: missing ${key}`);
    }
  }

  if (ids.has(row.id)) errors.push(`${row.id}: duplicate id`);
  ids.add(row.id);

  if (!Array.isArray(row.tags) || row.tags.length === 0) {
    errors.push(`${row.id}: missing tags array`);
  }

  if (row.description === row.evidence) {
    errors.push(`${row.id}: description matches evidence`);
  }

  const hasLowercaseGeneral = Array.isArray(row.tags) && row.tags.includes('general');
  const hasGeneral = Array.isArray(row.tags) && row.tags.includes('General');
  const fallbackAliases = ['Global', 'Intercultural', 'multicultural', 'POC', 'diaspora', 'diaspora collective'];
  const tagAliases = ['Afrobeat', 'Latin America-wide programme'];
  if (hasLowercaseGeneral) {
    errors.push(`${row.id}: uses lowercase general tag`);
  }
  for (const tag of fallbackAliases) {
    if (Array.isArray(row.tags) && row.tags.includes(tag)) {
      errors.push(`${row.id}: uses ${tag} fallback tag instead of General`);
    }
  }
  for (const tag of tagAliases) {
    if (Array.isArray(row.tags) && row.tags.includes(tag)) {
      errors.push(`${row.id}: uses ${tag} tag instead of canonical regional tag`);
    }
  }
  if (hasGeneral && row.tags.length > 1) {
    errors.push(`${row.id}: General must be a standalone fallback tag`);
  }
  if (row.country.includes('general')) {
    errors.push(`${row.id}: country includes lowercase general`);
  }
  if (fallbackAliases.includes(row.country) || tagAliases.includes(row.country)) {
    errors.push(`${row.id}: uses ${row.country} fallback country instead of General`);
  }
}

const paradeCount = rows.filter(row => row.pool === 'parade').length;
const festCount = rows.filter(row => row.pool === 'street-fest').length;

if (paradeCount !== 66) {
  errors.push(`expected 66 parade entries, found ${paradeCount}`);
}

if (festCount < 120) {
  errors.push(`expected at least 120 street-fest entries after refresh, found ${festCount}`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Validated ${rows.length} rows (${paradeCount} parade, ${festCount} street-fest).`);
}
