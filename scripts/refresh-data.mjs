import fs from 'node:fs/promises';

import sourceRows from '../data/inferred-nationalities.json' with { type: 'json' };
import {
  addGeneralTag,
  createId,
  normalizeName,
  parseFestEntries,
  parseParadeEntries,
} from './lib/karnevalData.mjs';

const PARADE_URL = 'https://karneval.berlin/umzug/';
const FEST_URL = 'https://karneval.berlin/fest/';

const aliasToCurrentName = new Map([
  ['afrohaus', 'AFRO HAUS Music Corner'],
  ['heiligkreuzkirche', 'Heilig-Kreuz-Kirche programme'],
  ['tanzpoesiederderwische', 'Sufi-Zentrum Rabbaniyya'],
  ['kira', 'Kira / KIRASOL'],
]);

const regionByTag = new Map([
  ['Africa', 'Africa'],
  ['African diaspora', 'Africa / Diaspora'],
  ['Algeria', 'Africa'],
  ['Angola', 'Africa'],
  ['Anatolia', 'Middle East / Europe'],
  ['Argentina', 'Latin America'],
  ['Armenia', 'Caucasus / West Asia'],
  ['Australia', 'Oceania'],
  ['Bangladesh', 'South Asia'],
  ['Belarus', 'Europe'],
  ['Berlin', 'Europe'],
  ['Bolivia', 'Latin America'],
  ['Bosnia', 'Europe'],
  ['Brazil', 'Latin America'],
  ['Bulgaria', 'Europe'],
  ['Caribbean', 'Caribbean'],
  ['Caribbean diaspora', 'Caribbean / Diaspora'],
  ['Catalonia', 'Europe'],
  ['Central America', 'Latin America'],
  ['Chile', 'Latin America'],
  ['China', 'East Asia'],
  ['Colombia', 'Latin America'],
  ['Congo', 'Africa'],
  ['Cuba', 'Caribbean'],
  ['Dominican Republic', 'Caribbean'],
  ['Ecuador', 'Latin America'],
  ['El Salvador', 'Latin America'],
  ['Europe', 'Europe'],
  ['France', 'Europe'],
  ['Fulani', 'Africa / Diaspora'],
  ['Gambia', 'Africa'],
  ['General', 'Global'],
  ['Germany', 'Europe'],
  ['Ghana', 'Africa'],
  ['Global', 'Global'],
  ['Greece', 'Europe / Mediterranean'],
  ['India', 'South Asia'],
  ['Intercultural', 'Global'],
  ['Islamic tradition', 'Middle East / Global'],
  ['Iran', 'Middle East'],
  ['Ireland', 'Europe'],
  ['Italy', 'Europe'],
  ['Jamaica', 'Caribbean'],
  ['Japan', 'East Asia'],
  ['Jewish diaspora', 'Europe / Diaspora'],
  ['Korea', 'East Asia'],
  ['Latin America', 'Latin America'],
  ['Latin American diaspora', 'Latin America / Diaspora'],
  ['Mexico', 'Latin America'],
  ['Mesoamerican cultures', 'Latin America'],
  ['Middle East', 'Middle East'],
  ['Nepal', 'South Asia'],
  ['Nigeria', 'Africa'],
  ['Pakistan', 'South Asia'],
  ['Peru', 'Latin America'],
  ['POC', 'Global / Diaspora'],
  ['Portugal', 'Europe'],
  ['reggae diaspora', 'Caribbean / Diaspora'],
  ['Senegal', 'Africa'],
  ['Sephardic diaspora', 'Europe / Mediterranean / Diaspora'],
  ['Sinti', 'Europe / Diaspora'],
  ['Sinti / Roma culture', 'Europe / Diaspora'],
  ['South America', 'Latin America'],
  ['South American', 'Latin America'],
  ['Spain', 'Europe'],
  ['Sufi', 'Middle East / Global'],
  ['Syria', 'Middle East'],
  ['Tibet', 'Asia / Diaspora'],
  ['Turkey', 'Middle East / Europe'],
  ['Ukraine', 'Europe'],
  ['Uruguay', 'Latin America'],
  ['Venezuela', 'Latin America'],
  ['Vietnam', 'Southeast Asia'],
  ['West African diaspora', 'Africa / Diaspora'],
  ['Zambia', 'Africa'],
]);

function splitTags(value) {
  if (!value) return [];
  return value.split('/').map(tag => tag.trim()).filter(Boolean);
}

function enrichExistingRow(row) {
  const tags = row.tags || splitTags(row.country);
  return {
    ...row,
    tags,
  };
}

function inferredDescription(entry) {
  return entry.description || entry.style || 'Listed on the official programme page without an individual description.';
}

function makeRow(base, entry, index) {
  const tags = addGeneralTag(base.tags, base.confidence);
  const region = base.region || inferRegion(tags);
  const country = tags.length === 1 && tags[0] === 'General'
    ? 'General'
    : base.country.replace(/\s*\/\s*general/gi, '').replace(/^general$/i, 'General');

  return {
    id: createId(entry.pool, index),
    pool: entry.pool,
    name: entry.name,
    country,
    region,
    confidence: base.confidence,
    tags,
    description: inferredDescription(entry),
    evidence: base.evidence,
  };
}

function inferRegion(tags) {
  for (const tag of tags) {
    const region = regionByTag.get(tag);
    if (region) return region;
  }
  return 'Global';
}

function lowConfidence(tags, country, evidence) {
  const hasSpecificTag = tags.some(tag => tag !== 'general' && tag !== 'General' && tag !== 'multicultural');
  const normalizedCountry = hasSpecificTag
    ? country.replace(/\s*\/\s*general/gi, '')
    : 'General';

  return {
    country: normalizedCountry,
    confidence: 55,
    tags,
    evidence,
  };
}

function inferRow(entry) {
  const haystack = `${entry.name} ${entry.style} ${entry.description}`.toLowerCase();

  if (/abenteuer tanz/.test(haystack) || /lilia gomez aus peru/.test(haystack)) {
    return {
      country: 'Peru',
      confidence: 84,
      tags: ['Peru'],
      evidence: 'Source description names artist Lilia Gomez from Peru while presenting a broader peace and solidarity performance.',
    };
  }

  if (/ríos profundos|rios profundos/.test(haystack)) {
    return {
      country: 'South American',
      confidence: 58,
      tags: ['South American', 'Latin America'],
      evidence: 'Source frames the work through a fictional South American political setting, so it is tagged at subcontinental level rather than as a real country.',
    };
  }

  if (/12volt|zuckersession|artqueen/.test(haystack)) {
    return {
      country: 'Sweden / Chile / Venezuela / Peru / Algeria / Italy / Ukraine / Berlin',
      confidence: 72,
      tags: ['Sweden', 'Chile', 'Venezuela', 'Peru', 'Algeria', 'Italy', 'Ukraine', 'Berlin'],
      evidence: 'Source description lists Swedish, Chilean, Venezuelan, Peruvian, Algerian, Italian, Ukrainian and Berlin-based participants or influences.',
    };
  }

  if (/exylium|rostock-lichtenhagen|hausbesetzerbewegung/.test(haystack)) {
    return {
      country: 'Germany / Berlin',
      confidence: 68,
      tags: ['Germany', 'Berlin'],
      evidence: 'Source description centers German and Berlin historical references, including Rostock-Lichtenhagen and Berlin squatting history.',
    };
  }

  if (/musikalische weltreise|global brass fusion|welt|global/.test(haystack)) {
    return {
      country: 'Global',
      confidence: 60,
      tags: ['Global'],
      evidence: 'Source listing frames the entry as global or world-spanning rather than tied to one nationality.',
    };
  }

  if (/producciones abismales/.test(haystack)) {
    return {
      country: 'Spanish-language theatre / Latin American diaspora',
      confidence: 58,
      tags: ['Spanish-language culture', 'Latin American diaspora'],
      evidence: 'Spanish-language company name and ecological street-theatre framing suggest a Spanish-language cultural signal without a specific country.',
    };
  }

  if (/kreuzberg|tempelhof|woltersdorf|100% tempelhof/.test(haystack)) {
    return {
      country: 'Germany / Berlin',
      confidence: 58,
      tags: ['Germany', 'Berlin'],
      evidence: 'Source listing is anchored in Berlin or the Berlin-Brandenburg local context rather than an external nationality signal.',
    };
  }

  if (/(recycling|workshop|infostand|siebdruk|siebdruck|kostüm|kostüme|circus kultur|clownin|kinder|familie|urbanen raum)/.test(haystack)) {
    return lowConfidence(['Berlin'], 'Berlin', 'Source listing is a local street-fest workshop, family programme or performance activity without a stronger nationality signal.');
  }

  if (/(interreligi|segen|gottesdienst|kirche|orgel|meditation|yoga|friedensgebet|begegnung)/.test(haystack)) {
    return lowConfidence(['Intercultural'], 'Intercultural / general', 'Source programme item is framed as an interfaith or community activity rather than a specific nationality signal.');
  }

  if (/(sufi|rabbaniyya|derwisch|dervish|islamic)/.test(haystack)) {
    return {
      country: 'Sufi / Islamic tradition',
      confidence: 62,
      tags: ['Sufi', 'Islamic tradition'],
      evidence: 'Source listing explicitly references Sufi or dervish performance tradition.',
    };
  }

  if (/(afro|afo|afrobeat|afrofunk|afrofutur|amapiano|highlife|makossa|soukous|mandinka|fulani|westafrican|african)/.test(haystack)) {
    if (/nigeria|yoruba|fela/.test(haystack)) {
      return {
        country: 'Nigeria / African diaspora',
        confidence: 82,
        tags: ['Nigeria', 'African diaspora'],
        evidence: 'Source language points to Nigerian and broader African-diasporic musical references.',
      };
    }
    if (/senegal|casamance|mandinka/.test(haystack)) {
      return {
        country: 'Senegal',
        confidence: 90,
        tags: ['Senegal'],
        evidence: 'Source description explicitly references Senegal or Mandinka cultural context.',
      };
    }
    if (/zambia|sambia/.test(haystack)) {
      return {
        country: 'Zambia',
        confidence: 90,
        tags: ['Zambia'],
        evidence: 'Source description explicitly identifies Zambian origin.',
      };
    }
    if (/kinshasa|congo|lingala/.test(haystack)) {
      return {
        country: 'Congo',
        confidence: 88,
        tags: ['Congo'],
        evidence: 'Source description explicitly references Congolese music or Kinshasa.',
      };
    }
    return lowConfidence(['African diaspora'], 'African diaspora / general', 'Source listing uses broad African or Afro-diasporic musical markers without a single dominant national signal.');
  }

  if (/(samba|forro|forró|coco|capoeira|maracatu|bahia|baiano|bloco|bateria|funk carioca|rio funk|brazilian jazz|brasil|recife|pernambuco)/.test(haystack)) {
    return {
      country: 'Brazil',
      confidence: 86,
      tags: ['Brazil'],
      evidence: 'Source listing uses Brazilian genres or place signals such as samba, maracatu, Bahia, or Pernambuco.',
    };
  }

  if (/(cumbia|colombia|colombian|bullerengue|gaita)/.test(haystack)) {
    const tags = ['Colombia'];
    if (/bullerengue|afro-colombian/.test(haystack)) tags.push('African diaspora');
    if (/bullerengue|costa|coast|caribe|cumbia/.test(haystack)) tags.push('Caribbean');
    return {
      country: 'Colombia',
      confidence: tags.includes('African diaspora') ? 86 : 78,
      tags,
      evidence: 'Source listing points to Colombian-origin genres, with Caribbean or Afro-Colombian signals where stated.',
    };
  }

  if (/(salsa|son|timba|rumba cubana|kubanisch|havana|havanna|cuba|cuban)/.test(haystack)) {
    const tags = ['Cuba', 'Caribbean'];
    if (/afro-cuban|afrokuban/.test(haystack)) tags.push('African diaspora');
    return {
      country: 'Cuba / Caribbean',
      confidence: 84,
      tags,
      evidence: 'Source listing references Cuban musical forms such as salsa, son, timba, or rumba.',
    };
  }

  if (/(latin|latinx|tango|huayno|zamba|andean|andes|mesoamerican|central america|mittelamerikas|peru|peruvian|chile|cueca|argentin|uruguay)/.test(haystack)) {
    if (/peru/.test(haystack)) {
      return {
        country: 'Peru',
        confidence: 84,
        tags: ['Peru'],
        evidence: 'Source listing explicitly references Peru or Peruvian folklore.',
      };
    }
    if (/chile|cueca/.test(haystack)) {
      return {
        country: 'Chile',
        confidence: 84,
        tags: ['Chile'],
        evidence: 'Source listing explicitly references Chile or Chilean dance traditions.',
      };
    }
    if (/argentin|tango/.test(haystack) && /uruguay/.test(haystack)) {
      return {
        country: 'Argentina / Uruguay',
        confidence: 78,
        tags: ['Argentina', 'Uruguay'],
        evidence: 'Source listing centers tango or explicitly references both Argentina and Uruguay.',
      };
    }
    if (/argentin|tango/.test(haystack)) {
      return {
        country: 'Argentina / Latin America',
        confidence: 70,
        tags: ['Argentina', 'Latin America'],
        evidence: 'Source listing points to tango or Argentine musical heritage with broader Latin American framing.',
      };
    }
    if (/mesoamerican|central america|mittelamerikas/.test(haystack)) {
      return {
        country: 'Central America / Mesoamerican cultures',
        confidence: 82,
        tags: ['Central America', 'Mesoamerican cultures'],
        evidence: 'Source description explicitly references Central America or Mesoamerican musical traditions.',
      };
    }
    return lowConfidence(['Latin America'], 'Latin America / general', 'Source listing signals a broad Latin American context without a single dominant country match.');
  }

  if (/(turkish|türk|anatolian|anatol|alevit|baris manco|barış manço|alaturka|oriental groove)/.test(haystack)) {
    return {
      country: 'Turkey / Anatolia',
      confidence: 84,
      tags: ['Turkey', 'Anatolia'],
      evidence: 'Source listing explicitly references Turkish or Anatolian music and performance traditions.',
    };
  }

  if (/(balkan|bosni|ajvar)/.test(haystack)) {
    return {
      country: 'Balkans',
      confidence: 76,
      tags: ['Balkans'],
      evidence: 'Source listing frames the act within Balkan musical repertoire or fusion.',
    };
  }

  if (/(greek|bouzouki)/.test(haystack)) {
    return {
      country: 'Greece',
      confidence: 80,
      tags: ['Greece'],
      evidence: 'Source listing explicitly references Greek musical forms or instruments.',
    };
  }

  if (/(flamenco|galicia|galician|spain|spanish)/.test(haystack)) {
    return {
      country: 'Spain',
      confidence: 82,
      tags: ['Spain'],
      evidence: 'Source listing references Spanish regional or flamenco traditions.',
    };
  }

  if (/(klezmer|sinti|roma)/.test(haystack)) {
    if (/sinti/.test(haystack)) {
      return {
        country: 'Sinti / Roma culture',
        confidence: 78,
        tags: ['Sinti / Roma culture'],
        evidence: 'Source listing explicitly identifies Sinti or Roma cultural framing.',
      };
    }
    return {
      country: 'Jewish diaspora',
      confidence: 74,
      tags: ['Jewish diaspora'],
      evidence: 'Source listing references klezmer or Jewish diasporic musical traditions.',
    };
  }

  if (/(japan|mikoshi|honkyoku|shakuhachi)/.test(haystack)) {
    return {
      country: 'Japan',
      confidence: 82,
      tags: ['Japan'],
      evidence: 'Source listing explicitly references Japanese traditions or instruments.',
    };
  }

  if (/(india|indian|bollywood|kannada|bhangra)/.test(haystack)) {
    return {
      country: 'India',
      confidence: 84,
      tags: ['India'],
      evidence: 'Source listing explicitly references Indian cultural traditions.',
    };
  }

  if (/(qi gong|kung fu|viet vo dao|vietnam)/.test(haystack)) {
    return {
      country: 'China / Vietnam',
      confidence: 76,
      tags: ['China', 'Vietnam'],
      evidence: 'Source listing references Chinese and Vietnamese martial or movement traditions.',
    };
  }

  if (/(reggae|dancehall|rocksteady|jamaica|one love)/.test(haystack)) {
    return {
      country: 'Jamaica / reggae diaspora',
      confidence: 82,
      tags: ['Jamaica', 'reggae diaspora'],
      evidence: 'Source listing references reggae, dancehall, rocksteady, or Jamaica directly.',
    };
  }

  if (/(karib|caribbean roots)/.test(haystack)) {
    return {
      country: 'Caribbean diaspora / Berlin',
      confidence: 70,
      tags: ['Caribbean diaspora', 'Berlin'],
      evidence: 'Source description explicitly mentions Caribbean roots in a Berlin-based act.',
    };
  }

  if (/(berlin|street|club|dj|performance|theater|theatre|workshop|show|laufparty|music scene|pop|r&b|neo-soul|family|bubble|bike|stunt|paint|grossfiguren|figuren)/.test(haystack)) {
    return lowConfidence(['Berlin'], 'Berlin / general', 'Source listing mainly describes a Berlin-based local performance or activity rather than a strong nationality signal.');
  }

  return lowConfidence(['General'], 'General', 'Source listing does not provide enough evidence for a reliable nationality or culture match.');
}

function canonicalExistingName(entry) {
  const normalized = normalizeName(entry.name);
  return aliasToCurrentName.get(normalized) || entry.name;
}

function buildExistingMap() {
  const map = {
    parade: new Map(),
    'street-fest': new Map(),
  };
  for (const row of sourceRows.map(enrichExistingRow)) {
    map[row.pool].set(normalizeName(row.name), row);
  }
  return map;
}

function mergeSourceEntries(entries, existingMap) {
  return entries.map((entry, index) => {
    const existing = existingMap[entry.pool].get(normalizeName(canonicalExistingName(entry)));
    const inferred = inferRow(entry);
    const preserved = existing
      ? {
          country: existing.country,
          region: existing.region,
          confidence: existing.confidence,
          tags: existing.tags,
          evidence: existing.evidence,
        }
      : null;
    const row = preserved && preserved.confidence > inferred.confidence
      ? preserved
      : inferred;

    return makeRow(row, entry, index + 1);
  });
}

async function fetchHtml(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return response.text();
}

async function main() {
  const [paradeHtml, festHtml] = await Promise.all([fetchHtml(PARADE_URL), fetchHtml(FEST_URL)]);
  const paradeEntries = parseParadeEntries(await paradeHtml);
  const festEntries = parseFestEntries(await festHtml);
  const existingMap = buildExistingMap();
  const rows = [
    ...mergeSourceEntries(paradeEntries, existingMap),
    ...mergeSourceEntries(festEntries, existingMap),
  ];

  await fs.writeFile(
    new URL('../data/inferred-nationalities.json', import.meta.url),
    `${JSON.stringify(rows, null, 2)}\n`,
  );

  console.log(`Wrote ${rows.length} entries (${paradeEntries.length} parade, ${festEntries.length} street-fest).`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
