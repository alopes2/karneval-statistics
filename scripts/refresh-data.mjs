import fs from 'node:fs/promises';

import {
  addGeneralTag,
  createId,
  parseFestEntries,
  parseParadeEntries,
} from './lib/karnevalData.mjs';

const PARADE_URL = 'https://karneval.berlin/umzug/';
const FEST_URL = 'https://karneval.berlin/fest/';

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
  ['Balkans', 'Europe'],
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
  ['Greece', 'Europe / Mediterranean'],
  ['India', 'South Asia'],
  ['Islamic tradition', 'Middle East / Global'],
  ['Iran', 'Middle East'],
  ['Ireland', 'Europe'],
  ['Italy', 'Europe'],
  ['Jamaica', 'Caribbean'],
  ['Japan', 'East Asia'],
  ['Jewish diaspora', 'Europe / Diaspora'],
  ['Korea', 'East Asia'],
  ['Kosovo', 'Europe'],
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

function inferredDescription(entry) {
  return entry.description || entry.style || 'Listed on the official programme page without an individual description.';
}

function makeRow(base, entry, index) {
  const tags = addGeneralTag(base.tags, base.confidence);
  const region = base.region || inferRegion(tags);
  const country = normalizeCountry(base.country, tags);

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

function normalizeCountry(country, tags) {
  if (tags.length === 1 && tags[0] === 'General') return 'General';

  const fallbackCountryParts = new Set([
    'general',
    'global',
    'intercultural',
    'multicultural',
    'diaspora',
    'diaspora collective',
    'poc',
    'afrobeat',
  ]);
  const countryAliases = new Map([
    ['Latin America-wide programme', 'Latin America'],
  ]);
  const parts = String(country || '')
    .split('/')
    .map(part => countryAliases.get(part.trim()) || part.trim())
    .filter(part => part && !fallbackCountryParts.has(part.toLowerCase()));

  return parts.length > 0 ? parts.join(' / ') : tags.join(' / ');
}

function inferRegion(tags) {
  for (const tag of tags) {
    const region = regionByTag.get(tag);
    if (region) return region;
  }
  return 'Global';
}

function lowConfidence(tags, country, evidence) {
  const fallbackTags = new Set(['general', 'General', 'multicultural', 'Intercultural', 'Global']);
  const hasSpecificTag = tags.some(tag => !fallbackTags.has(tag));
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
  const has = pattern => pattern.test(haystack);

  if (has(/abenteuer tanz/) || has(/lilia gomez aus peru/)) {
    return {
      country: 'Peru',
      confidence: 84,
      tags: ['Peru'],
      evidence: 'Source description names artist Lilia Gomez from Peru while presenting a broader peace and solidarity performance.',
    };
  }

  if (has(/ríos profundos|rios profundos/)) {
    return {
      country: 'South American',
      confidence: 58,
      tags: ['South American', 'Latin America'],
      evidence: 'Source frames the work through a fictional South American political setting, so it is tagged at subcontinental level rather than as a real country.',
    };
  }

  if (has(/12volt|zuckersession|artqueen/)) {
    return {
      country: 'Sweden / Chile / Venezuela / Peru / Algeria / Italy / Ukraine / Berlin',
      confidence: 72,
      tags: ['Sweden', 'Chile', 'Venezuela', 'Peru', 'Algeria', 'Italy', 'Ukraine', 'Berlin'],
      evidence: 'Source description lists Swedish, Chilean, Venezuelan, Peruvian, Algerian, Italian, Ukrainian and Berlin-based participants or influences.',
    };
  }

  if (has(/exylium|rostock-lichtenhagen|hausbesetzerbewegung/)) {
    return {
      country: 'Germany / Berlin',
      confidence: 68,
      tags: ['Germany', 'Berlin'],
      evidence: 'Source description centers German and Berlin historical references, including Rostock-Lichtenhagen and Berlin squatting history.',
    };
  }

  if (has(/república dominicana|republica dominicana|dominikan|quisqueya/)) {
    return {
      country: 'Dominican Republic',
      confidence: 92,
      tags: ['Dominican Republic', 'Caribbean'],
      evidence: 'Source description explicitly references the Dominican Republic, Dominican culture, or Quisqueya.',
    };
  }

  if (has(/bolivia|bolivian|bolivien|bolivianisch|suri sikuri/)) {
    return {
      country: 'Bolivia',
      confidence: 90,
      tags: ['Bolivia'],
      evidence: 'Source name or description explicitly references Bolivia or Bolivian Andean folklore.',
    };
  }

  if (has(/ukrain|україн/)) {
    const tags = ['Ukraine'];
    if (has(/deutsch|german|berlin/)) tags.push('Germany');
    return {
      country: tags.join(' / '),
      confidence: 90,
      tags,
      evidence: 'Source description explicitly references Ukrainian or Ukrainian-German cultural context.',
    };
  }

  if (has(/korea|koreanisch|korean|arirang/)) {
    return {
      country: 'Korea',
      confidence: 90,
      tags: ['Korea'],
      evidence: 'Source description explicitly references Korean culture, Korea, or Arirang.',
    };
  }

  if (has(/bosn|kosovo|sandžak|sandzak|ex‑jugoslaw|ex-jugoslaw|jugoslaw|balkan/)) {
    const tags = [];
    if (has(/bosn/)) tags.push('Bosnia');
    if (has(/kosovo/)) tags.push('Kosovo');
    if (has(/sandžak|sandzak|ex‑jugoslaw|ex-jugoslaw|jugoslaw|balkan/) || tags.length === 0) tags.push('Balkans');
    return {
      country: tags.join(' / '),
      confidence: 84,
      tags,
      evidence: 'Source description explicitly references Bosnian, Kosovo, Sandžak, ex-Yugoslav or Balkan traditions.',
    };
  }

  if (has(/bulgar|kuker|kukeri/)) {
    return {
      country: 'Bulgaria',
      confidence: 90,
      tags: ['Bulgaria'],
      evidence: 'Source description explicitly references Bulgaria, Bulgarian folklore, or Kukeri traditions.',
    };
  }

  if (has(/bangladesh|bangladesch|bengalisch|bengali|mangal-shobhajatra/)) {
    const tags = ['Bangladesh'];
    if (has(/\bindia\b|indien|indisch/)) tags.push('India');
    return {
      country: tags.join(' / '),
      confidence: 88,
      tags,
      evidence: 'Source description explicitly references Bengali culture, Bangladesh, or Mangal-Shobhajatra.',
    };
  }

  if (has(/ghana|black stars|hi-life|highlife/)) {
    return {
      country: 'Ghana',
      confidence: 90,
      tags: ['Ghana'],
      evidence: 'Source description explicitly references Ghana, Ghanaian Black Stars, or Highlife music.',
    };
  }

  if (has(/nigerianisch-irisch|nigerian-irish|nigerian irish/)) {
    return {
      country: 'Nigeria / Ireland',
      confidence: 86,
      tags: ['Nigeria', 'Ireland'],
      evidence: 'Source description identifies the artist as Nigerian-Irish.',
    };
  }

  if (has(/esan|igbabonelimhin|asonogun|oduduwa|yorùbá|yoruba|nigeria|nigerian/)) {
    return {
      country: 'Nigeria',
      confidence: 90,
      tags: ['Nigeria'],
      evidence: 'Source description explicitly references Nigerian, Esan, or Yoruba culture.',
    };
  }

  if (has(/mexico|mexiko|mexican|mexikan/)) {
    return {
      country: 'Mexico',
      confidence: 86,
      tags: ['Mexico'],
      evidence: 'Source listing explicitly references Mexico or Mexican culture.',
    };
  }

  if (has(/producciones abismales/)) {
    return {
      country: 'Spanish-language theatre / Latin American diaspora',
      confidence: 58,
      tags: ['Spanish-language culture', 'Latin American diaspora'],
      evidence: 'Spanish-language company name and ecological street-theatre framing suggest a Spanish-language cultural signal without a specific country.',
    };
  }

  if (has(/sufi|rabbaniyya|derwisch|dervish|islamic/)) {
    return {
      country: 'Sufi / Islamic tradition',
      confidence: 62,
      tags: ['Sufi', 'Islamic tradition'],
      evidence: 'Source listing explicitly references Sufi or dervish performance tradition.',
    };
  }

  if (has(/afro-peruan/) && has(/kolumbien|colombia/) && has(/venezuela/)) {
    return {
      country: 'Peru / Colombia / Venezuela',
      confidence: 86,
      tags: ['Peru', 'Colombia', 'Venezuela', 'African diaspora'],
      evidence: 'Source description explicitly mentions Afro-Peruvian rhythms and folklore from Colombia and Venezuela.',
    };
  }

  if (has(/argentinien bis kolumbien|argentina .*colombia|argentin.*kolumb/)) {
    return {
      country: 'Argentina / Colombia',
      confidence: 78,
      tags: ['Argentina', 'Colombia', 'South America'],
      evidence: 'Source description frames the music as a South American journey from Argentina to Colombia.',
    };
  }

  if (has(/\b(samba|forro|forró|capoeira|maracatu|bahia|baiano|bloco|bateria)\b|sambagruppe|funk carioca|rio funk|brazilian jazz|brasil|brasilian|brazil|brazilian|recife|pernambuco/)) {
    return {
      country: 'Brazil',
      confidence: 86,
      tags: ['Brazil'],
      evidence: 'Source listing uses Brazilian genres or place signals such as samba, maracatu, Bahia, or Pernambuco.',
    };
  }

  if (has(/galicia|galician|galicisch/)) {
    return {
      country: 'Spain',
      confidence: 82,
      tags: ['Spain'],
      evidence: 'Source listing references Galician culture from northern Spain.',
    };
  }

  if (has(/colombia|colombian|kolumbien|kolumbian|cali \(kolumbien\)|gabriel garcía márquez|garcia marquez|bullerengue/) || (has(/gaita/) && has(/colombia|colombian|kolumbien|kolumbian|karibikküste|costa|coast|caribe|caribbean/))) {
    const tags = ['Colombia'];
    if (has(/bullerengue|afro-colombian|afro-kolumbian/)) tags.push('African diaspora');
    if (has(/bullerengue|karibikküste|costa|coast|caribe|caribbean/)) tags.push('Caribbean');
    return {
      country: 'Colombia',
      confidence: tags.includes('African diaspora') ? 86 : 78,
      tags,
      evidence: 'Source listing points to Colombian-origin genres, with Caribbean or Afro-Colombian signals where stated.',
    };
  }

  if (has(/flamenco|spain|spanish/)) {
    return {
      country: 'Spain',
      confidence: 82,
      tags: ['Spain'],
      evidence: 'Source listing references Spanish regional or flamenco traditions.',
    };
  }

  if (has(/timba|rumba cubana|kubanisch|kubanische|kubanischer|kubanischen|havana|havanna|cuba|cuban|afro-cuban|afrokuban/)) {
    const tags = ['Cuba', 'Caribbean'];
    if (has(/afro-cuban|afrokuban|afrokubanisch|afrokubanische/)) tags.push('African diaspora');
    return {
      country: 'Cuba / Caribbean',
      confidence: 84,
      tags,
      evidence: 'Source listing references Cuban musical forms such as salsa, son, timba, or rumba.',
    };
  }

  if (has(/\b(salsa|salsera|salseras|salseros)\b/)) {
    return lowConfidence(['Latin America'], 'Latin America / general', 'Source listing references salsa but does not provide a reliable Cuban or other country-specific signal.');
  }

  if (has(/latin|latinx|tango|huayno|zamba|andean|andes|mesoamerican|central america|mittelamerikas|peru|peruvian|chile|chilenisch|cueca|argentin|uruguay|cumbia/)) {
    if (has(/peru|peruvian|huayno|festejo|afro-peruan/)) {
      return {
        country: 'Peru',
        confidence: 84,
        tags: ['Peru'],
        evidence: 'Source listing explicitly references Peru or Peruvian folklore.',
      };
    }
    if (has(/chile|chilenisch|cueca|afro-chilen/)) {
      return {
        country: 'Chile',
        confidence: 84,
        tags: ['Chile'],
        evidence: 'Source listing explicitly references Chile or Chilean dance traditions.',
      };
    }
    if ((has(/argentin|tango/) && has(/uruguay/)) || has(/candombe/)) {
      return {
        country: 'Argentina / Uruguay',
        confidence: 78,
        tags: ['Argentina', 'Uruguay'],
        evidence: 'Source listing centers tango or explicitly references both Argentina and Uruguay.',
      };
    }
    if (has(/argentin|tango/)) {
      return {
        country: 'Argentina / Latin America',
        confidence: 70,
        tags: ['Argentina', 'Latin America'],
        evidence: 'Source listing points to tango or Argentine musical heritage with broader Latin American framing.',
      };
    }
    if (has(/mesoamerican|central america|mittelamerikas/)) {
      return {
        country: 'Central America / Mesoamerican cultures',
        confidence: 82,
        tags: ['Central America', 'Mesoamerican cultures'],
        evidence: 'Source description explicitly references Central America or Mesoamerican musical traditions.',
      };
    }
    return lowConfidence(['Latin America'], 'Latin America / general', 'Source listing signals a broad Latin American context without a single dominant country match.');
  }

  if (has(/\b(afro|afrobeats?|afrofunk|afrofutur|amapiano|highlife|makossa|soukous|mandinka|fulani|west ?african|african)\b/)) {
    if (has(/nigerianisch-irisch|nigerian-irish|nigerian irish/)) {
      return {
        country: 'Nigeria / Ireland',
        confidence: 86,
        tags: ['Nigeria', 'Ireland'],
        evidence: 'Source description identifies the artist as Nigerian-Irish.',
      };
    }
    if (has(/nigeria|nigerian|yoruba|fela/)) {
      return {
        country: 'Nigeria / African diaspora',
        confidence: 82,
        tags: ['Nigeria', 'African diaspora'],
        evidence: 'Source language points to Nigerian and broader African-diasporic musical references.',
      };
    }
    if (has(/senegal|casamance|mandinka/)) {
      return {
        country: 'Senegal',
        confidence: 90,
        tags: ['Senegal'],
        evidence: 'Source description explicitly references Senegal or Mandinka cultural context.',
      };
    }
    if (has(/fulani/)) {
      return {
        country: 'Fulani / West African diaspora',
        confidence: 84,
        tags: ['Fulani', 'West African diaspora'],
        evidence: 'Source description explicitly mentions Fulani roots and west African rhythms.',
      };
    }
    if (has(/zambia|sambia/)) {
      return {
        country: 'Zambia',
        confidence: 90,
        tags: ['Zambia'],
        evidence: 'Source description explicitly identifies Zambian origin.',
      };
    }
    if (has(/kinshasa|congo|lingala/)) {
      return {
        country: 'Congo',
        confidence: 88,
        tags: ['Congo'],
        evidence: 'Source description explicitly references Congolese music or Kinshasa.',
      };
    }
    return lowConfidence(['African diaspora'], 'African diaspora / general', 'Source listing uses broad African or Afro-diasporic musical markers without a single dominant national signal.');
  }

  if (has(/musikalische weltreise|global brass fusion|globale rhythmen|global sounds|global club sounds/)) {
    return {
      country: 'General',
      confidence: 60,
      tags: ['General'],
      evidence: 'Source listing frames the entry as global or world-spanning rather than tied to one nationality.',
    };
  }

  if (has(/turkish|türk|anatolian|anatol|alevit|baris manco|barış manço|alaturka|oriental groove/)) {
    return {
      country: 'Turkey / Anatolia',
      confidence: 84,
      tags: ['Turkey', 'Anatolia'],
      evidence: 'Source listing explicitly references Turkish or Anatolian music and performance traditions.',
    };
  }

  if (has(/balkan|bosni|ajvar/)) {
    return {
      country: 'Balkans',
      confidence: 76,
      tags: ['Balkans'],
      evidence: 'Source listing frames the act within Balkan musical repertoire or fusion.',
    };
  }

  if (has(/greek|bouzouki/)) {
    return {
      country: 'Greece',
      confidence: 80,
      tags: ['Greece'],
      evidence: 'Source listing explicitly references Greek musical forms or instruments.',
    };
  }

  if (has(/klezmer|sinti|roma/)) {
    if (has(/sinti/)) {
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

  if (has(/japan|mikoshi|honkyoku|shakuhachi/)) {
    return {
      country: 'Japan',
      confidence: 82,
      tags: ['Japan'],
      evidence: 'Source listing explicitly references Japanese traditions or instruments.',
    };
  }

  if (has(/india|indian|bollywood|kannada|bhangra/)) {
    return {
      country: 'India',
      confidence: 84,
      tags: ['India'],
      evidence: 'Source listing explicitly references Indian cultural traditions.',
    };
  }

  if (has(/qi gong|kung fu|viet vo dao|vietnam/)) {
    return {
      country: 'China / Vietnam',
      confidence: 76,
      tags: ['China', 'Vietnam'],
      evidence: 'Source listing references Chinese and Vietnamese martial or movement traditions.',
    };
  }

  if (has(/jamaica|jamaikan|jamaican|sound-system-kultur|reggae-community|reggaeinberlin|one love/)) {
    return {
      country: 'Jamaica / reggae diaspora',
      confidence: 82,
      tags: ['Jamaica', 'reggae diaspora'],
      evidence: 'Source listing references reggae, dancehall, rocksteady, or Jamaica directly.',
    };
  }

  if (has(/karib|caribbean roots/)) {
    return {
      country: 'Caribbean diaspora / Berlin',
      confidence: 70,
      tags: ['Caribbean diaspora', 'Berlin'],
      evidence: 'Source description explicitly mentions Caribbean roots in a Berlin-based act.',
    };
  }

  if (has(/\bberlin(er|s|isch|ische|isches|ischen)?\b|kreuzberg|tempelhof|neukölln|neukoelln|schöneberg|schoeneberg|sonnenallee/)) {
    return {
      country: 'Germany / Berlin',
      confidence: 58,
      tags: ['Germany', 'Berlin'],
      evidence: 'Source listing is anchored in Berlin or the Berlin-Brandenburg local context rather than an external nationality signal.',
    };
  }

  if (has(/recycling|workshop|infostand|siebdruk|siebdruck|kostüm|kostüme|circus kultur|clownin|kinder|familie|urbanen raum/)) {
    return lowConfidence(['General'], 'General', 'Source listing is a workshop, family programme or performance activity without a reliable nationality signal.');
  }

  if (has(/interreligi|segen|gottesdienst|kirche|orgel|meditation|yoga|friedensgebet|begegnung/)) {
    return lowConfidence(['General'], 'General', 'Source programme item is framed as an interfaith or community activity rather than a specific nationality signal.');
  }

  return lowConfidence(['General'], 'General', 'Source listing does not provide enough evidence for a reliable nationality or culture match.');
}

function mergeSourceEntries(entries) {
  return entries.map((entry, index) => makeRow(inferRow(entry), entry, index + 1));
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
  const rows = [
    ...mergeSourceEntries(paradeEntries),
    ...mergeSourceEntries(festEntries),
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
