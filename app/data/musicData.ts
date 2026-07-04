export interface Song {
  id: string;
  number: number;
  title: string;
  category: 'hymn' | 'children' | 'youth';
  sourceBook: string;
  audioKey?: string;
  pageKeys: string[];
}

export const BEHOLD_ASSET_REGISTRY: Record<string, any> = {
  hymn_173_p1: require('../../assets/hymn_173_p1.png'),
  hymn_173_audio: require('../../assets/audio/hymn_173.wav'),
};

export const LDS_MUSIC_DATABASE: Song[] = [
  {
    id: 'hymn_173',
    number: 173,
    title: 'While of These Emblems We Partake',
    category: 'hymn',
    sourceBook: 'Official Hymnal',
    audioKey: 'hymn_173_audio',
    pageKeys: ['hymn_173_p1'],
  },
  {
    id: 'children_1',
    number: 1,
    title: 'I Am a Child of God',
    category: 'children',
    sourceBook: "Children's Songbook",
    pageKeys: [],
  },
  {
    id: 'children_2',
    number: 2,
    title: 'Teach Me to Walk in the Light',
    category: 'children',
    sourceBook: "Children's Songbook",
    pageKeys: [],
  },
  {
    id: 'children_3',
    number: 3,
    title: 'The Wise Man and the Foolish Man',
    category: 'children',
    sourceBook: "Children's Songbook",
    pageKeys: [],
  },
  {
    id: 'youth_1',
    number: 2001,
    title: 'Youth Theme Prelude',
    category: 'youth',
    sourceBook: 'Youth Track Series',
    pageKeys: [],
  },
  {
    id: 'youth_2',
    number: 2002,
    title: 'Sacred Covenant Reflection',
    category: 'youth',
    sourceBook: 'Youth Track Series',
    pageKeys: [],
  },
  {
    id: 'youth_3',
    number: 2003,
    title: 'Missionary Purpose Instrumental',
    category: 'youth',
    sourceBook: 'Youth Track Series',
    pageKeys: [],
  },
];