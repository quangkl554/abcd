import { createRequire } from 'node:module';
import type { Region } from './core';

const require = createRequire(import.meta.url);
const shared = require('./issues.cjs') as {
  issueDraftsFromWarnings: (args: {
    warnings: string[];
    rawText: string;
    date: string;
    region: Region;
  }) => ParseIssueDraft[];
};

export type ParseIssueDraft = {
  message_date: string;
  region: Region;
  warning: string;
  line_no: number | null;
  source_text: string | null;
  status: 'open';
};

export function issueDraftsFromWarnings(args: {
  warnings: string[];
  rawText: string;
  date: string;
  region: Region;
}): ParseIssueDraft[] {
  return shared.issueDraftsFromWarnings(args);
}
