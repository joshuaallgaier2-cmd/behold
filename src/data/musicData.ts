export interface InteractiveSong {
  id: string;
  number: string;
  title: string;
  category: 'hymn' | 'children' | 'youth';
  difficulty: 'easy' | 'medium' | 'hard';
  tempo: string;
}

export const INTERACTIVE_MUSIC_DATABASE: InteractiveSong[] = [
  {
    id: '1',
    number: '173',
    title: 'Hymn 173',
    category: 'hymn',
    difficulty: 'medium',
    tempo: '80 BPM',
  },
  {
    id: '2',
    number: 'C01',
    title: 'Childrens Song Example',
    category: 'children',
    difficulty: 'easy',
    tempo: '100 BPM',
  },
  {
    id: '3',
    number: 'Y01',
    title: 'Youth Album Track',
    category: 'youth',
    difficulty: 'hard',
    tempo: '120 BPM',
  },
];