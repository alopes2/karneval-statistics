export const entryOverrides = {
  'p-005': {
    country: 'Mexico / Latin American diaspora',
    tags: ['Mexico', 'Latin American diaspora'],
    confidence: 70,
    description: 'Calaca is a strong Mexican Día de los Muertos cultural signal, but the public description is primarily political and artistic, so the inference remains diaspora-aware.'
  },
  'p-012': {
    country: 'Latin American diaspora',
    tags: ['Latin American diaspora'],
    description: 'Spanish-language naming and the Latido Verde framing suggest Latin American diaspora context, while the source description focuses on ocean protection rather than a specific country.'
  },
  'p-013': {
    country: 'Syria / Argentina',
    tags: ['Syria', 'Argentina'],
    description: 'The description explicitly mentions Syrian ethnic groups and Argentine tango / Murga elements, so the inference is narrowed to the named country signals instead of generic Latin America.'
  },
  'p-015': {
    country: 'Cuba / Caribbean',
    tags: ['Cuba', 'Caribbean'],
    description: 'The Salsa Cubana / Son signal points most strongly to Cuba and the Caribbean rather than broad Latin America.'
  },
  'p-020': {
    country: 'Iran / Middle East',
    tags: ['Iran', 'Middle East'],
    confidence: 70,
    description: 'Minab is a city in Iran and the description refers to Middle Eastern mourning cultures; this is more specific than a generic Middle East tag but still below high confidence because the country is not explicitly stated in the listing.'
  },
  'p-029': {
    country: 'Peru / multicultural',
    tags: ['Peru', 'multicultural'],
    description: 'The description names Peruvian artist Lilia Gomez while presenting a broader multicultural peace theme.'
  },
  'p-046': {
    country: 'South American fictional setting',
    tags: ['South American fictional setting'],
    description: 'The description uses a fictional South American country and political symbolism, so it should not be forced into a real country.'
  },
  'p-049': {
    country: 'Cuba / Caribbean',
    tags: ['Cuba', 'Caribbean'],
    description: 'The listing references Son and Salsa Cubana, so this should count as Cuban and Caribbean rather than a single broad Latin American signal.'
  },
  'p-040': {
    tags: ['Colombia', 'Caribbean'],
    description: 'Salsa Caleña is anchored in Cali, Colombia, while salsa also carries a wider Caribbean music and dance lineage.'
  },
  's-009': {
    country: 'African / Caribbean / Brazilian diaspora',
    tags: ['African diaspora', 'Caribbean', 'Brazil'],
    description: 'The programme references African, Caribbean and Latin diasporic club styles; Baile Funk gives a Brazil signal, while Dancehall and Soca point to Caribbean contexts.'
  },
  's-010': {
    country: 'Latin America-wide programme',
    tags: ['Latin America-wide programme'],
    description: 'Latin Hell is explicitly presented as a programme for the musical and cultural diversity of Latin America as a whole, so no single country should be assigned.'
  },
  's-018': {
    country: 'Argentina / Peru / Uruguay / Cuba',
    tags: ['Argentina', 'Peru', 'Uruguay', 'Cuba'],
    confidence: 78,
    description: 'The description lists Zamba, Huayno, Candombe, Festejo and Son, which point to Argentina, Peru, Uruguay and Cuba rather than a generic Latin America tag.'
  },
  's-019': {
    tags: ['Cuba', 'Caribbean', 'Latin America'],
    description: 'The salsa framing is transnational, but its strongest roots in this row are Cuban and Caribbean.'
  },
  's-021': {
    tags: ['Colombia', 'Caribbean', 'African diaspora'],
    description: 'Bullerengue and Afro-Colombian coastal culture make this Colombian, Caribbean-coast and African-diaspora tagged.'
  },
  's-024': {
    tags: ['Chile', 'Colombia', 'Latin America'],
    description: 'The group was founded by Chilean musicians and plays Cumbia, a Colombian-rooted Latin American genre.'
  },
  's-025': {
    tags: ['Cuba', 'Caribbean'],
    description: 'LA MEKANICA is a Cuban Timba and Salsa band, so it should count as both Cuban and Caribbean.'
  },
  's-027': {
    country: 'Argentina / Uruguay / Latin America',
    tags: ['Argentina', 'Uruguay', 'Latin America'],
    confidence: 70,
    description: 'The programme labels Tango and Latin American songs; Tango narrows the signal toward Argentina and Uruguay while keeping the broader repertoire visible.'
  },
  's-029': {
    tags: ['Cuba', 'Caribbean', 'Latin America'],
    description: 'Salsa, Son and Cuban rhythmic language make the entry Cuban and Caribbean, with a wider Latin-jazz context.'
  },
  's-031': {
    tags: ['Peru', 'Colombia', 'Venezuela', 'African diaspora'],
    description: 'The description references Afro-Peruvian rhythms plus folklore from Colombia and Venezuela.'
  },
  's-032': {
    tags: ['Cuba', 'Caribbean', 'African diaspora'],
    description: 'Afro-Cuban rumba should be counted as Cuban, Caribbean and African-diaspora culture.'
  },
  's-033': {
    country: 'Latin American diaspora',
    tags: ['Latin American diaspora'],
    description: 'The description identifies a Berlin women’s vocal ensemble performing Latin American folklore, but does not name one country.'
  },
  's-050': {
    country: 'Spanish-language theatre / Latin American diaspora',
    tags: ['Spanish-language culture', 'Latin American diaspora'],
    description: 'The Spanish-language company name and ecological street-theatre framing suggest a Spanish-language cultural signal, but the source does not name a specific country.'
  },
  's-053': {
    tags: ['Uruguay', 'Chile', 'African diaspora'],
    description: 'Candombe and Tumbe point to Afro-Uruguayan and Afro-Chilean cultural forms.'
  },
  's-063': {
    tags: ['Colombia', 'Latin America'],
    description: 'Cumbia has a Colombian origin and a wider Latin American circulation.'
  },
  's-077': {
    country: 'Central America / Mesoamerican cultures',
    tags: ['Central America', 'Mesoamerican cultures'],
    confidence: 88,
    description: 'The description explicitly mentions traditional songs of Central America and Mesoamerican musical traditions.'
  }
};
