import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface SavedPiece {
  id: string;
  pieceId: string;
  rating: number;
  memo: string;
  createdAt: string;
}

const STORAGE_KEY = 'piano-saved-pieces';

function loadLocal(): SavedPiece[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocal(pieces: SavedPiece[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pieces));
}

export function useSavedPieces() {
  const { user } = useAuth();
  const [savedPieces, setSavedPieces] = useState<SavedPiece[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSaved = useCallback(async () => {
    setLoading(true);
    if (isSupabaseConfigured && supabase && user) {
      const { data, error } = await supabase
        .from('saved_pieces')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setSavedPieces(data.map(row => ({
          id: row.id,
          pieceId: row.piece_id,
          rating: row.rating,
          memo: row.memo,
          createdAt: row.created_at,
        })));
      }
    } else {
      setSavedPieces(loadLocal());
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchSaved(); }, [fetchSaved]);

  const savePiece = useCallback(async (pieceId: string, rating: number = 0, memo: string = '') => {
    const existing = savedPieces.find(p => p.pieceId === pieceId);
    if (existing) return;

    const newSaved: SavedPiece = {
      id: crypto.randomUUID(),
      pieceId,
      rating,
      memo,
      createdAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase && user) {
      await supabase.from('saved_pieces').insert({
        id: newSaved.id,
        user_id: user.id,
        piece_id: pieceId,
        rating,
        memo,
      });
    }

    const updated = [newSaved, ...savedPieces];
    setSavedPieces(updated);
    saveLocal(updated);
  }, [savedPieces, user]);

  const removePiece = useCallback(async (pieceId: string) => {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('saved_pieces').delete().eq('piece_id', pieceId);
    }

    const updated = savedPieces.filter(p => p.pieceId !== pieceId);
    setSavedPieces(updated);
    saveLocal(updated);
  }, [savedPieces]);

  const updateRating = useCallback(async (pieceId: string, rating: number) => {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('saved_pieces').update({ rating }).eq('piece_id', pieceId);
    }

    const updated = savedPieces.map(p =>
      p.pieceId === pieceId ? { ...p, rating } : p
    );
    setSavedPieces(updated);
    saveLocal(updated);
  }, [savedPieces]);

  const isSaved = useCallback((pieceId: string) => {
    return savedPieces.some(p => p.pieceId === pieceId);
  }, [savedPieces]);

  const getRating = useCallback((pieceId: string) => {
    return savedPieces.find(p => p.pieceId === pieceId)?.rating ?? 0;
  }, [savedPieces]);

  return { savedPieces, loading, savePiece, removePiece, updateRating, isSaved, getRating, refetch: fetchSaved };
}
