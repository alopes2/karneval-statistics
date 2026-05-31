import test from 'node:test';
import assert from 'node:assert/strict';

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

test('addGeneralTag appends general only below confidence 60', () => {
  assert.deepEqual(addGeneralTag(['Berlin'], 58), ['Berlin']);
  assert.deepEqual(addGeneralTag([], 58), ['General']);
  assert.deepEqual(addGeneralTag(['Berlin'], 60), ['Berlin']);
  assert.deepEqual(addGeneralTag(['Berlin', 'General'], 72), ['Berlin']);
  assert.deepEqual(addGeneralTag(['multicultural'], 58), ['General']);
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
