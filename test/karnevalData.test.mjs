import test from 'node:test';
import assert from 'node:assert/strict';

import inferredRows from '../data/inferred-nationalities.json' with { type: 'json' };
import {
  addGeneralTag,
  dedupeFestEntries,
  mergeDescription,
  normalizeName,
  parseParadeEntries,
  sanitizeText,
} from '../scripts/lib/karnevalData.mjs';

test('normalizeName collapses punctuation and diacritics for source matching', () => {
  assert.equal(normalizeName("Kira / KIRASOL"), 'kirakirasol');
  assert.equal(normalizeName("Freak de l´Afrique "), 'freakdelafrique');
});

test('sanitizeText strips markup and normalizes html entities', () => {
  const input = '<p>Hello&nbsp;World<br>Rock &amp; Roll &#8211; now</p>';
  assert.equal(sanitizeText(input), 'Hello World Rock & Roll - now');
});

test('addGeneralTag collapses fallback tags to standalone General', () => {
  assert.deepEqual(addGeneralTag(['Berlin'], 58), ['Berlin']);
  assert.deepEqual(addGeneralTag([], 58), ['General']);
  assert.deepEqual(addGeneralTag(['Berlin'], 60), ['Berlin']);
  assert.deepEqual(addGeneralTag(['Berlin', 'General'], 72), ['Berlin']);
  assert.deepEqual(addGeneralTag(['multicultural'], 58), ['General']);
  assert.deepEqual(addGeneralTag(['Intercultural'], 72), ['General']);
  assert.deepEqual(addGeneralTag(['Global'], 60), ['General']);
  assert.deepEqual(addGeneralTag(['Global', 'Brazil'], 60), ['Brazil']);
  assert.deepEqual(addGeneralTag(['POC', 'diaspora collective'], 58), ['General']);
  assert.deepEqual(addGeneralTag(['Africa', 'diaspora'], 66), ['Africa']);
  assert.deepEqual(addGeneralTag(['Latin America-wide programme'], 84), ['Latin America']);
  assert.deepEqual(addGeneralTag(['Africa', 'Afrobeat'], 70), ['Africa']);
});

test('mergeDescription prefers fetched source description over missing row description', () => {
  const row = { id: 's-001', evidence: 'Evidence only' };
  assert.deepEqual(mergeDescription(row, 'Fetched description'), {
    id: 's-001',
    evidence: 'Evidence only',
    description: 'Fetched description',
  });
});

test('dedupeFestEntries keeps one entry per normalized name and preserves descriptions', () => {
  const rows = dedupeFestEntries([
    { name: 'AFRO HAUS Music Corner', description: '' },
    { name: 'AFRO HAUS', description: 'Corner description' },
    { name: 'Bike Stunt Berlin', description: 'Show 1' },
    { name: 'Bike Stunt Berlin', description: '' },
  ]);

  assert.equal(rows.length, 3);
  assert.equal(rows.find(row => normalizeName(row.name) === 'afrohausmusiccorner')?.description, '');
  assert.equal(rows.find(row => normalizeName(row.name) === 'afrohaus')?.description, 'Corner description');
  assert.equal(rows.find(row => normalizeName(row.name) === 'bikestuntberlin')?.description, 'Show 1');
});

test('parseParadeEntries extracts nested description paragraphs from lineup names info', () => {
  const html = `
    <div class="kdk-lineup__names-item">
      <button type="button" class="kdk-lineup__names-trigger">
        <span class="kdk-lineup__names-name">Sapucaiu no Samba</span>
      </button>
      <div class="kdk-lineup__names-detail" hidden>
        <div class="kdk-lineup__names-detail-inner">
          <div class="kdk-lineup__names-info">
            <p class="kdk-lineup__desc"><p>Mit „Manguebeat – Von den Mangroven in die Welt“ lädt Sapucaiu no Samba ein.</p></p>
            <ul class="kdk-lineup__details"></ul>
          </div>
        </div>
      </div>
    </div>
  `;

  assert.deepEqual(parseParadeEntries(html), [
    {
      name: 'Sapucaiu no Samba',
      description: 'Mit „Manguebeat – Von den Mangroven in die Welt“ lädt Sapucaiu no Samba ein.',
      style: '',
      pool: 'parade',
    },
  ]);
});

test('parseParadeEntries extracts descriptions when details list is absent', () => {
  const html = `
    <div class="kdk-lineup__names-item">
      <button type="button" class="kdk-lineup__names-trigger">
        <span class="kdk-lineup__names-name">ABENTEUER TANZ</span>
      </button>
      <div class="kdk-lineup__names-detail" hidden>
        <div class="kdk-lineup__names-detail-inner">
          <div class="kdk-lineup__names-info">
            <p class="kdk-lineup__desc"><p>Unter der Leitung der Künstlerin Lilia Gomez aus Peru wollen wir unser Thema TANZ FÜR FRIEDEN UND FREIHEIT präsentieren.</p></p>
            <div class="kdk-lineup__artist-logos"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  assert.equal(
    parseParadeEntries(html)[0].description,
    'Unter der Leitung der Künstlerin Lilia Gomez aus Peru wollen wir unser Thema TANZ FÜR FRIEDEN UND FREIHEIT präsentieren.',
  );
});

test('generated data does not infer countries from unsupported generic genre text', () => {
  const byName = new Map(inferredRows.map(row => [row.name, row]));

  assert.deepEqual(byName.get('Knicki, Kröte, Karuna: Homeless Tatütataa!')?.tags, ['General']);
  assert.equal(byName.get('Knicki, Kröte, Karuna: Homeless Tatütataa!')?.country, 'General');
  assert.ok(!byName.get('Knicki, Kröte, Karuna: Homeless Tatütataa!')?.tags.includes('Cuba'));

  assert.deepEqual(byName.get('De Berlin Son')?.tags, ['Spain']);
  assert.ok(!byName.get('De Berlin Son')?.tags.includes('Colombia'));

  assert.deepEqual(byName.get('Cuatro Piraguas')?.tags, ['Peru', 'Colombia', 'Venezuela', 'African diaspora']);
  assert.deepEqual(byName.get('Toshin')?.tags, ['Nigeria', 'Ireland']);
});

test('generated data keeps explicit nationality signals ahead of generic programme wording', () => {
  const byName = new Map(inferredRows.map(row => [row.name, row]));

  assert.deepEqual(byName.get('Colores de Quisqueya')?.tags, ['Dominican Republic', 'Caribbean']);
  assert.deepEqual(byName.get('SunKidz 44 - Wir sind Neukölln!!!')?.tags, ['Germany', 'Berlin']);
  assert.deepEqual(byName.get('BRAZUKAIADA und Furiosa')?.tags, ['Brazil']);
  assert.deepEqual(byName.get('AdlerA e.V.')?.tags, ['Ukraine', 'Germany']);
  assert.deepEqual(byName.get('Org. por Bolivia')?.tags, ['Bolivia']);

  assert.deepEqual(byName.get('Koreanischer Verein Berlin e.V. "Arirang Korea"')?.tags, ['Korea']);
  assert.deepEqual(byName.get('Kuker Berlin')?.tags, ['Bulgaria']);
  assert.deepEqual(byName.get('Ghana Carnival 4 BLACK STARS')?.tags, ['Ghana']);
  assert.deepEqual(byName.get('ESAN AKOAMHEN PROGRESSIVE UNION e.V.')?.tags, ['Nigeria']);
});
