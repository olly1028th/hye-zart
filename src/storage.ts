import type { StudyNote, PracticeSession } from './types';

const STUDY_NOTES_KEY = 'piano-study-notes';
const PRACTICE_SESSIONS_KEY = 'piano-practice-sessions';

export function loadStudyNotes(): StudyNote[] {
  const raw = localStorage.getItem(STUDY_NOTES_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveStudyNotes(notes: StudyNote[]) {
  localStorage.setItem(STUDY_NOTES_KEY, JSON.stringify(notes));
}

export function loadPracticeSessions(): PracticeSession[] {
  const raw = localStorage.getItem(PRACTICE_SESSIONS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function savePracticeSessions(sessions: PracticeSession[]) {
  localStorage.setItem(PRACTICE_SESSIONS_KEY, JSON.stringify(sessions));
}
