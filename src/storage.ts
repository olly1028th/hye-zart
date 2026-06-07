import type { StudyNote, PracticeSession } from './types';

const STUDY_NOTES_KEY = 'piano-study-notes';
const PRACTICE_SESSIONS_KEY = 'piano-practice-sessions';

function safeParse<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return fallback;
    return parsed as T;
  } catch {
    console.warn(`localStorage "${key}" 데이터 손상 — 초기값으로 대체합니다.`);
    localStorage.removeItem(key);
    return fallback;
  }
}

export function loadStudyNotes(): StudyNote[] {
  return safeParse<StudyNote[]>(STUDY_NOTES_KEY, []);
}

export function saveStudyNotes(notes: StudyNote[]) {
  localStorage.setItem(STUDY_NOTES_KEY, JSON.stringify(notes));
}

export function loadPracticeSessions(): PracticeSession[] {
  return safeParse<PracticeSession[]>(PRACTICE_SESSIONS_KEY, []);
}

export function savePracticeSessions(sessions: PracticeSession[]) {
  localStorage.setItem(PRACTICE_SESSIONS_KEY, JSON.stringify(sessions));
}
