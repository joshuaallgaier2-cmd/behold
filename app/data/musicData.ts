export interface Song {
  id: string;
  number: number;
  title: string;
  category: 'hymn' | 'children' | 'youth';
  sourceBook: string;
  pages: string[]; // Maps to the local filenames of your sheet music images
}

export const LDS_MUSIC_DATABASE: Song[] = [
  {
    id: 'hymn-1',
    number: 1,
    title: 'The Morning Breaks',
    category: 'hymn',
    sourceBook: 'Hymns (Official)',
    pages: ['the_morning_breaks_p1.png']
  },
  {
    id: 'children-1',
    number: 2,
    title: 'I Am a Child of God',
    category: 'children',
    sourceBook: 'Children\'s Songbook',
    pages: ['child_of_god_p1.png', 'child_of_god_p2.png']
  },
  {
    id: 'youth-2026',
    number: 2026,
    title: 'Strive to Be Track',
    category: 'youth',
    sourceBook: 'Youth Album 2026',
    pages: ['youth_track_p1.png']
  }
];