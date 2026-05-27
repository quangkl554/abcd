'use strict';

function issueDraftsFromWarnings(args) {
  const lines = String(args.rawText || '').split(/\r?\n/);
  return [...new Set(args.warnings || [])].map(warning => {
    const match = String(warning).match(/(?:Dòng|DĂ²ng)\s+(\d+)/i);
    const lineNo = match ? Number(match[1]) : null;
    const sourceText = lineNo && lines[lineNo - 1] ? lines[lineNo - 1].trim() : null;
    return {
      message_date: args.date,
      region: args.region,
      warning: String(warning),
      line_no: lineNo,
      source_text: sourceText || null,
      status: 'open',
    };
  });
}

module.exports = { issueDraftsFromWarnings };
