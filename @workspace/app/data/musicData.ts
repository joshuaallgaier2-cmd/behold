export interface Song {
  id: string;
  number: number;
  title: string;
  category: 'hymn' | 'children' | 'youth';
  sourceBook: string;
  pageKeys: string[]; // Reference keys pointing to our asset map registry
}

// Strictly evaluate all assets using hardcoded literal strings so Metro compiles cleanly
export const HYMN_ASSET_REGISTRY: Record<string, any> = {
  'hymn_173_p1': require('../../assets/hymn_173_p1.png'),
};

export const LDS_MUSIC_DATABASE: Song[] = [
  {
    id: 'hymn-173',
    number: 173,
    title: 'While of These Emblems We Partake',
    category: 'hymn',
    sourceBook: 'Hymns (Official)',
    pageKeys: ['hymn_173_p1']
  }
];