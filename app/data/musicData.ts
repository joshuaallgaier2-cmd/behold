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
    id: 'hymn-173',
    number: 173,
    title: 'While of These Emblems We Partake',
    category: 'hymn',
    sourceBook: 'Hymns (Official)',
    pages: ['while_of_these_emblems_we_partake_saul.jpg']
  }
];