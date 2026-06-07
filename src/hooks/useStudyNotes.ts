import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { loadStudyNotes, saveStudyNotes } from '../storage';
import { useAuth } from '../context/AuthContext';
import type { StudyNote, CategoryType } from '../types';

export function useStudyNotes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    if (isSupabaseConfigured && supabase && user) {
      const { data, error } = await supabase
        .from('study_notes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const mapped: StudyNote[] = data.map(row => ({
          id: row.id,
          category: row.category as CategoryType,
          title: row.title,
          content: row.content,
          date: row.created_at,
          tags: row.tags,
        }));
        setNotes(mapped);
      }
    } else {
      setNotes(loadStudyNotes());
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const addNote = useCallback(async (note: Omit<StudyNote, 'id' | 'date'>) => {
    const newNote: StudyNote = {
      id: crypto.randomUUID(),
      ...note,
      date: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase && user) {
      await supabase.from('study_notes').insert({
        id: newNote.id,
        user_id: user.id,
        category: newNote.category,
        title: newNote.title,
        content: newNote.content,
        tags: newNote.tags,
      });
    }

    const updated = [newNote, ...notes];
    setNotes(updated);
    saveStudyNotes(updated);
    return newNote;
  }, [notes, user]);

  const updateNote = useCallback(async (id: string, changes: Partial<StudyNote>) => {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('study_notes').update({
        category: changes.category,
        title: changes.title,
        content: changes.content,
        tags: changes.tags,
      }).eq('id', id);
    }

    const updated = notes.map(n => n.id === id ? { ...n, ...changes } : n);
    setNotes(updated);
    saveStudyNotes(updated);
  }, [notes]);

  const deleteNote = useCallback(async (id: string) => {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('study_notes').delete().eq('id', id);
    }

    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    saveStudyNotes(updated);
  }, [notes]);

  return { notes, loading, addNote, updateNote, deleteNote, refetch: fetchNotes };
}
