export function normalizeName(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&amp;/g, 'and')
    .replace(/[^a-z0-9]+/g, '');
}

export function sanitizeText(value) {
  return String(value || '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#8230;/g, '…')
    .replace(/&#8211;/g, '-')
    .replace(/&#8222;/g, '„')
    .replace(/&#8220;/g, '“')
    .replace(/&#8221;/g, '”')
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

export function addGeneralTag(tags, confidence) {
  const fallbackTags = new Set(['general', 'multicultural', 'intercultural', 'global']);
  const tagAliases = new Map([
    ['Afrobeat', 'Africa'],
    ['diaspora', 'General'],
    ['diaspora collective', 'General'],
    ['Latin America-wide programme', 'Latin America'],
    ['POC', 'General'],
  ]);
  const normalizedTags = (tags || [])
    .filter(Boolean)
    .map(tag => tagAliases.get(tag) || (fallbackTags.has(String(tag).toLowerCase()) ? 'General' : tag));
  const nextTags = Array.from(new Set(normalizedTags));
  const nonGeneralTags = nextTags.filter(tag => tag !== 'General');

  if (nonGeneralTags.length > 0) return nonGeneralTags;
  return ['General'];
}

export function mergeDescription(row, description) {
  return {
    ...row,
    description: description || row.description || '',
  };
}

export function dedupeFestEntries(entries) {
  const byName = new Map();
  for (const entry of entries) {
    const key = normalizeName(entry.name);
    if (!key) continue;
    if (!byName.has(key)) {
      byName.set(key, entry);
      continue;
    }

    const current = byName.get(key);
    if (!current.description && entry.description) {
      byName.set(key, { ...current, description: entry.description });
    }
  }

  return [...byName.values()];
}

export function createId(pool, index) {
  const prefix = pool === 'parade' ? 'p' : 's';
  return `${prefix}-${String(index).padStart(3, '0')}`;
}

export function parseParadeEntries(html) {
  const entries = [];
  const blockPattern = /<div class="kdk-lineup__names-item"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/g;

  for (const block of html.match(blockPattern) || []) {
    const nameMatch = block.match(/<span class="kdk-lineup__names-name">([\s\S]*?)<\/span>/);
    if (!nameMatch) continue;

    const descMatch = block.match(/<p class="kdk-lineup__desc">\s*<p>([\s\S]*?)<\/p>/);
    entries.push({
      name: sanitizeText(nameMatch[1]),
      description: sanitizeText(descMatch?.[1] || ''),
      style: '',
      pool: 'parade',
    });
  }

  return entries;
}

export function parseFestEntries(html) {
  const entries = [];

  for (const match of html.matchAll(/<div class="kdk-tabs__text"><h3>([\s\S]*?)<\/h3>\s*<p(?: class="[^"]*")?>([\s\S]*?)<\/p>/g)) {
    entries.push({
      name: sanitizeText(match[1]),
      description: sanitizeText(match[2]),
      style: '',
      pool: 'street-fest',
    });
  }

  const headingMatches = [...html.matchAll(/<h3 class="kdk-lineup__name">([\s\S]*?)<\/h3>/g)];
  for (let index = 0; index < headingMatches.length; index += 1) {
    const match = headingMatches[index];
    const start = match.index + match[0].length;
    const end = index + 1 < headingMatches.length ? headingMatches[index + 1].index : html.length;
    const chunk = html.slice(start, end);
    const styleMatch = chunk.match(/<span class="kdk-lineup__style[^"]*">([\s\S]*?)<\/span>/);
    const descMatch = chunk.match(/<div class="kdk-lineup__desc[^"]*">([\s\S]*?)<\/div>/);

    entries.push({
      name: sanitizeText(match[1]),
      style: sanitizeText(styleMatch?.[1] || ''),
      description: sanitizeText(descMatch?.[1] || ''),
      pool: 'street-fest',
    });
  }

  return dedupeFestEntries(entries);
}
