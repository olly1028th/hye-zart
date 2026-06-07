export interface StudyNote {
  id: string;
  category: 'theory' | 'piece' | 'composer' | 'progress';
  title: string;
  content: string;
  date: string;
  tags: string[];
}

export interface PracticeSession {
  id: string;
  date: string;
  duration: number;
  memo: string;
}

export interface MelodyNote {
  key: string;
  duration: number;
}

export type TabType = 'study' | 'keyboard' | 'metronome';
export type CategoryType = StudyNote['category'];
