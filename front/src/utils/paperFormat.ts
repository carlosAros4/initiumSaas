
export const PAPER_FORMATS = [
  'letter',
  'legal',
  'tabloid',
  'ledger',
  'a0',
  'a1',
  'a2',
  'a3',
  'a4',
  'a5',
  'a6',
] as const;
export type PaperFormat = (typeof PAPER_FORMATS)[number];