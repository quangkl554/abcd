'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { issueDraftsFromWarnings } = require('../src/lib/issues.cjs');

test('warning lines become editable parse issues', () => {
  const issues = issueDraftsFromWarnings({
    warnings: ['Dòng 2: chưa hiểu đoạn này', 'Dòng 2: chưa hiểu đoạn này'],
    rawText: 'nguoi 1:\n867.10n\n23b10n',
    date: '2026-05-26',
    region: 'nam',
  });

  assert.equal(issues.length, 1);
  assert.equal(issues[0].line_no, 2);
  assert.equal(issues[0].source_text, '867.10n');
  assert.equal(issues[0].status, 'open');
});

test('unicode warning line prefix becomes editable parse issue', () => {
  const issues = issueDraftsFromWarnings({
    warnings: ['Dòng 2: bỏ qua token "bli05"'],
    rawText: 'nguoi 1:\nbli05 45 85b 100n',
    date: '2026-05-26',
    region: 'nam',
  });

  assert.equal(issues.length, 1);
  assert.equal(issues[0].line_no, 2);
  assert.equal(issues[0].source_text, 'bli05 45 85b 100n');
});
