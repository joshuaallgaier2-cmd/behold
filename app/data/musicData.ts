/**
 * Structural data contract for all music items in the Behold ecosystem.
 */
export interface Song {
  id: string;
  number: number;
  title: string;
  category: 'hymn' | 'children' | 'youth';
  sourceBook: string;
  audioUrl?: string; // Optional remote backup URL
  pageKeys: string[]; // List of keys for the BEHOLD_ASSET_REGISTRY
}

/**
 * Immutable reference dictionary for static assets.
 * Strictly maps asset keys to hard-coded require statements to ensure Metro
 * compiler can resolve all paths during the build process.
 */
export const BEHOLD_ASSET_REGISTRY: Record<string, any> = {
  'hymn_173_p1': require('../../assets/hymn_173_p1.png'),
};

/**
 * Global Music Database
 * Type-safe collection of LDS music assets including Hymns, Children's Songbook,
 * and Youth Tracks.
 */
export const LDS_MUSIC_DATABASE: Song[] = [
  {
    id: 'hymn-173',
    number: 173,
    title: 'While of These Emblems We Partake',
    category: 'hymn',
    sourceBook: 'Hymns',
    pageKeys: ['hymn_173_p1'],
  },
  {
    id: 'children-1',
    number: 1,
    title: 'I Am a Child of God',
    category: 'children',
    sourceBook: "Children's Songbook",
    pageKeys: [], // Placeholder for future imports
  },
  {
    id: 'youth-1',
    number: 1,
    title: 'As Watchmen on the Tower',
    category: 'youth',
    sourceBook: 'Youth Tracks',
    pageKeys: [], // Placeholder for future imports
  },
];
