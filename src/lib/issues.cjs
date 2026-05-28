'use strict';

function issueDraftsFromWarnings(args) {
  const lines = String(args.rawText || '').split(/\r?\n/);
  const grouped = new Map();
  for (const warning of [...new Set(args.warnings || [])]) {
    const match = String(warning).match(/D\S*ng\s+(\d+)/i);
    const lineNo = match ? Number(match[1]) : null;
    const sourceText = lineNo && lines[lineNo - 1] ? lines[lineNo - 1].trim() : null;
    const key = sourceText ? `${lineNo || ''}|${sourceText}` : String(warning);
    const existing = grouped.get(key);
    if (existing) {
      if (!existing.warning.includes(String(warning))) existing.warning += `; ${String(warning)}`;
      continue;
    }
    grouped.set(key, {
      message_date: args.date,
      region: args.region,
      warning: String(warning),
      line_no: lineNo,
      source_text: sourceText || null,
      status: 'open',
    });
  }
  return [...grouped.values()];
}

module.exports = { issueDraftsFromWarnings };
