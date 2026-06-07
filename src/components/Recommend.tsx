import { useState, useMemo } from 'react';
import {
  PIECES,
  MOOD_LABELS,
  DIFFICULTY_LABELS,
  DIFFICULTY_COLORS,
  GENRE_LABELS,
  type Mood,
  type Difficulty,
  type PianoPiece,
} from '../data/pieces';
import { useSavedPieces } from '../hooks/useSavedPieces';

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function Recommend() {
  const [selectedMoods, setSelectedMoods] = useState<Set<Mood>>(new Set());
  const [selectedDifficulties, setSelectedDifficulties] = useState<Set<Difficulty>>(new Set());
  const [results, setResults] = useState<PianoPiece[] | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const { savePiece, removePiece, isSaved, getRating, updateRating, savedPieces } = useSavedPieces();

  function toggleMood(m: Mood) {
    const next = new Set(selectedMoods);
    next.has(m) ? next.delete(m) : next.add(m);
    setSelectedMoods(next);
  }

  function toggleDifficulty(d: Difficulty) {
    const next = new Set(selectedDifficulties);
    next.has(d) ? next.delete(d) : next.add(d);
    setSelectedDifficulties(next);
  }

  const filtered = useMemo(() => {
    return PIECES.filter(p => {
      if (selectedMoods.size > 0 && !p.moods.some(m => selectedMoods.has(m))) return false;
      if (selectedDifficulties.size > 0 && !selectedDifficulties.has(p.difficulty)) return false;
      return true;
    });
  }, [selectedMoods, selectedDifficulties]);

  function handleRecommend() {
    setResults(shuffle(filtered).slice(0, 5));
    setExpandedId(null);
    setShowFavorites(false);
  }

  function handleReset() {
    setSelectedMoods(new Set());
    setSelectedDifficulties(new Set());
    setResults(null);
  }

  const hasFilter = selectedMoods.size + selectedDifficulties.size > 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-2xl font-bold">연습곡 추천</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFavorites(!showFavorites)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer ${
              showFavorites ? 'bg-piano-highlight text-white' : 'bg-piano-accent text-gray-300'
            }`}
          >
            ❤️ 즐겨찾기 ({savedPieces.length})
          </button>
          {hasFilter && (
            <button onClick={handleReset} className="text-gray-500 hover:text-white text-sm cursor-pointer">
              초기화
            </button>
          )}
        </div>
      </div>

      {showFavorites ? (
        <FavoritesList savedPieces={savedPieces} removePiece={removePiece} updateRating={updateRating} />
      ) : (
        <>
          <div className="bg-piano-dark rounded-xl p-4 sm:p-5 border border-piano-accent space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-2">어떤 느낌?</h3>
              <div className="flex gap-1.5 flex-wrap">
                {(Object.keys(MOOD_LABELS) as Mood[]).map(m => (
                  <button
                    key={m}
                    onClick={() => toggleMood(m)}
                    className={`px-2.5 py-1 rounded-full text-sm cursor-pointer transition-colors ${
                      selectedMoods.has(m) ? 'bg-piano-highlight text-white' : 'bg-piano-accent text-gray-300 hover:bg-piano-highlight/30'
                    }`}
                  >
                    {MOOD_LABELS[m]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-2">난이도</h3>
              <div className="flex gap-1.5 flex-wrap">
                {(Object.keys(DIFFICULTY_LABELS) as Difficulty[]).map(d => (
                  <button
                    key={d}
                    onClick={() => toggleDifficulty(d)}
                    className={`px-2.5 py-1 rounded-full text-sm cursor-pointer transition-colors ${
                      selectedDifficulties.has(d) ? 'bg-piano-highlight text-white' : 'bg-piano-accent text-gray-300 hover:bg-piano-highlight/30'
                    }`}
                  >
                    {DIFFICULTY_LABELS[d]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-gray-600 text-sm">{filtered.length}곡</span>
              <button
                onClick={handleRecommend}
                disabled={filtered.length === 0}
                className="bg-piano-highlight hover:bg-red-600 disabled:bg-gray-700 disabled:text-gray-500 text-white px-5 py-2.5 rounded-lg font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                추천받기
              </button>
            </div>
          </div>

          {results !== null && (
            <div className="space-y-2.5">
              {results.length === 0 ? (
                <p className="text-center text-gray-500 py-8">조건에 맞는 곡이 없습니다.</p>
              ) : (
                results.map(piece => (
                  <PieceCard
                    key={piece.id}
                    piece={piece}
                    expanded={expandedId === piece.id}
                    onToggle={() => setExpandedId(expandedId === piece.id ? null : piece.id)}
                    isSaved={isSaved(piece.id)}
                    rating={getRating(piece.id)}
                    onSave={() => isSaved(piece.id) ? removePiece(piece.id) : savePiece(piece.id)}
                    onRate={(r) => updateRating(piece.id, r)}
                  />
                ))
              )}
              <div className="text-center pt-1">
                <button onClick={handleRecommend} className="text-piano-highlight hover:text-red-400 cursor-pointer text-sm">
                  다시 추천받기
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PieceCard({
  piece, expanded, onToggle, isSaved, rating, onSave, onRate,
}: {
  piece: PianoPiece;
  expanded: boolean;
  onToggle: () => void;
  isSaved: boolean;
  rating: number;
  onSave: () => void;
  onRate: (r: number) => void;
}) {
  return (
    <div className="bg-piano-dark border border-piano-accent rounded-xl overflow-hidden hover:border-piano-highlight/50 transition-colors">
      <button onClick={onToggle} className="w-full text-left p-4 cursor-pointer">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className={`${DIFFICULTY_COLORS[piece.difficulty]} text-white text-xs px-2 py-0.5 rounded-full`}>
            {DIFFICULTY_LABELS[piece.difficulty]}
          </span>
          <span className="text-xs bg-piano-accent text-gray-300 px-2 py-0.5 rounded-full">
            {GENRE_LABELS[piece.genre]}
          </span>
        </div>
        <h4 className="text-base font-semibold text-white">{piece.title}</h4>
        <p className="text-gray-500 text-sm">{piece.composer}</p>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-piano-accent pt-3 space-y-3">
          <p className="text-gray-300 text-sm">{piece.description}</p>
          <div className="flex gap-1.5 flex-wrap">
            {piece.moods.map(m => (
              <span key={m} className="text-xs bg-piano-black text-gray-400 px-2 py-0.5 rounded">
                {MOOD_LABELS[m]}
              </span>
            ))}
          </div>
          <p className="text-gray-500 text-xs">연주 시간: {piece.duration}</p>
          <div className="bg-piano-black rounded-lg p-3 border border-piano-accent">
            <p className="text-sm text-gray-400">
              <span className="text-piano-highlight font-semibold">연습 팁:</span> {piece.tip}
            </p>
          </div>
          <div className="flex items-center justify-between pt-1">
            <button onClick={onSave} className="flex items-center gap-1 text-sm cursor-pointer">
              <span>{isSaved ? '❤️' : '🤍'}</span>
              <span className="text-gray-400">{isSaved ? '즐겨찾기 해제' : '즐겨찾기'}</span>
            </button>
            {isSaved && (
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s} onClick={() => onRate(s === rating ? 0 : s)} className="cursor-pointer text-sm">
                    {s <= rating ? '★' : '☆'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FavoritesList({
  savedPieces, removePiece, updateRating,
}: {
  savedPieces: { pieceId: string; rating: number; id: string }[];
  removePiece: (id: string) => void;
  updateRating: (id: string, r: number) => void;
}) {
  if (savedPieces.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p className="text-3xl mb-2">❤️</p>
        <p className="text-sm">추천받은 곡에서 하트를 눌러 즐겨찾기에 추가하세요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {savedPieces.map(sp => {
        const piece = PIECES.find(p => p.id === sp.pieceId);
        if (!piece) return null;
        return (
          <div key={sp.id} className="bg-piano-dark border border-piano-accent rounded-xl p-3 flex items-center gap-3">
            <button onClick={() => removePiece(piece.id)} className="text-red-400 cursor-pointer shrink-0">❤️</button>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm truncate">{piece.title}</p>
              <p className="text-gray-500 text-xs">{piece.composer}</p>
            </div>
            <div className="flex gap-0.5 shrink-0">
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s} onClick={() => updateRating(piece.id, s === sp.rating ? 0 : s)} className="cursor-pointer text-sm">
                  {s <= sp.rating ? '★' : '☆'}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
