import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { loadPracticeSessions, savePracticeSessions } from '../storage';
import { useAuth } from '../context/AuthContext';
import type { PracticeSession } from '../types';

export function usePracticeSessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    if (isSupabaseConfigured && supabase && user) {
      const { data, error } = await supabase
        .from('practice_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const mapped: PracticeSession[] = data.map(row => ({
          id: row.id,
          date: row.created_at,
          duration: row.duration,
          memo: row.memo,
        }));
        setSessions(mapped);
      }
    } else {
      setSessions(loadPracticeSessions());
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const addSession = useCallback(async (session: Omit<PracticeSession, 'id' | 'date'>) => {
    const newSession: PracticeSession = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      ...session,
    };

    if (isSupabaseConfigured && supabase && user) {
      await supabase.from('practice_sessions').insert({
        id: newSession.id,
        user_id: user.id,
        duration: newSession.duration,
        memo: newSession.memo,
      });
    }

    const updated = [newSession, ...sessions];
    setSessions(updated);
    savePracticeSessions(updated);
    return newSession;
  }, [sessions, user]);

  const deleteSession = useCallback(async (id: string) => {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('practice_sessions').delete().eq('id', id);
    }

    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    savePracticeSessions(updated);
  }, [sessions]);

  return { sessions, loading, addSession, deleteSession, refetch: fetchSessions };
}
