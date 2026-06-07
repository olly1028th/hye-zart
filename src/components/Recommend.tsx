import { useState, useMemo } from 'react';
import {
  PIECES,
  ERA_LABELS,
  GENRE_LABELS,
  MOOD_LABELS,
  DIFFICULTY_LABELS,
  DIFFICULTY_COLORS,
  type Era,
  type Genre,
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
  const [selectedEras, setSelectedEras] = useState<Set<Era>>(new Set());
  const [selectedGenres, setSelectedGenres] = useState<Set<Genre>>(new Set());
  const [selectedMoods, setSelectedMoods] = useState<Set<Mood>>(new Set());
  const [selectedDifficulties, setSelectedDifficulties] = useState<Set<Difficulty>>(new Set());
  const [results, setResults] = useState<PianoPiece[] | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const { savePiece, removePiece, isSaved, getRating, updateRating, savedPieces } = useSavedPieces();

  function toggle<T>(set: Set<T>, value: T, setter: (s: Set<T>) => void) {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  }

  const filtered = useMemo(() => {
    return PIECES.filter(p => {
      if (selectedEras.size > 0 && !selectedEras.has(p.era)) return false;
      if (selectedGenres.size > 0 && !selectedGenres.has(p.genre)) return false;
      if (selectedMoods.size > 0 && !p.moods.some(m => selectedMoods.has(m))) return false;
      if (selectedDifficulties.size > 0 && !selectedDifficulties.has(p.difficulty)) return false;
      return true;
    });
  }, [selectedEras, selectedGenres, selectedMoods, selectedDifficulties]);

  function handleRecommend() {
    const shuffled = shuffle(filtered);
    setResults(shuffled.slice(0, 5));
    setExpandedId(null);
  }

  function handleReset() {
    setSelectedEras(new Set());
    setSelectedGenres(new Set());
    setSelectedMoods(new Set());
    setSelectedDifficulties(new Set());
    setResults(null);
    setExpandedId(null);
  }

  const hasAnyFilter = selectedEras.size + selectedGenres.size + selectedMoods.size + selectedDifficulties.size > 0;

  return (
    <div className="space-y-6">
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
          {hasAnyFilter && (
            <button
              onClick={handleReset}
              className="text-gray-500 hover:text-white text-sm transition-colors cursor-pointer"
            >
              필터 초기화
            </button>
          )}
        </div>
      </div>

      {showFavorites && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-300">내 즐겨찾기</h3>
          {savedPieces.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p className="text-3xl mb-2">❤️</p>
              <p className="text-sm">추천받은 곡에서 하트를 눌러 즐겨찾기에 추가하세요.</p>
            </div>
          ) : (
            savedPieces.map(sp => {
              const piece = PIECES.find(p => p.id === sp.pieceId);
              if (!piece) return null;
              return (
                <div key={sp.id} className="bg-piano-dark border border-piano-accent rounded-xl p-4 flex items-center gap-3">
                  <button
                    onClick={() => removePiece(piece.id)}
                    className="text-red-400 hover:text-red-300 cursor-pointer shrink-0"
                  >❤️</button>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{piece.title}</p>
                    <p className="text-gray-500 text-xs">{piece.composer}</p>
                  </div>
                  <div className="flex gap-0.5 shrink-0">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        onClick={() => updateRating(piece.id, star === sp.rating ? 0 : star)}
                        className="cursor-pointer text-sm"
                      >
                        {star <= sp.rating ? '★' : '☆'}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      <div className="bg-piano-dark rounded-xl p-6 border border-piano-accent space-y-5">
        <FilterSection<Era>
          title="시대"
          items={ERA_LABELS}
          selected={selectedEras}
          onToggle={v => toggle(selectedEras, v, setSelectedEras)}
        />
        <FilterSection<Genre>
          title="장르"
          items={GENRE_LABELS}
          selected={selectedGenres}
          onToggle={v => toggle(selectedGenres, v, setSelectedGenres)}
        />
        <FilterSection<Mood>
          title="느낌 / 분위기"
          items={MOOD_LABELS}
          selected={selectedMoods}
          onToggle={v => toggle(selectedMoods, v, setSelectedMoods)}
        />
        <FilterSection<Difficulty>
          title="난이도"
          items={DIFFICULTY_LABELS}
          selected={selectedDifficulties}
          onToggle={v => toggle(selectedDifficulties, v, setSelectedDifficulties)}
        />

        <div className="flex items-center justify-between pt-2">
          <span className="text-gray-500 text-sm">
            {filtered.length}곡 중에서 추천합니다
          </span>
          <button
            onClick={handleRecommend}
            disabled={filtered.length === 0}
            className="bg-piano-highlight hover:bg-red-600 disabled:bg-gray-700 disabled:text-gray-500 text-white px-6 py-3 rounded-lg font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            추천받기
          </button>
        </div>
      </div>

      {results !== null && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-300">
            추천 결과 ({results.length}곡)
          </h3>

          {results.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <p className="text-4xl mb-2">🎵</p>
              <p>조건에 맞는 곡이 없습니다. 필터를 조정해보세요.</p>
            </div>
          ) : (
            results.map(piece => (
              <div
                key={piece.id}
                className="bg-piano-dark border border-piano-accent rounded-xl overflow-hidden hover:border-piano-highlight/50 transition-colors"
              >
                <button
                  onClick={() => setExpandedId(expandedId === piece.id ? null : piece.id)}
                  className="w-full text-left p-5 cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`${DIFFICULTY_COLORS[piece.difficulty]} text-white text-xs px-2 py-0.5 rounded-full`}>
                          {DIFFICULTY_LABELS[piece.difficulty]}
                        </span>
                        <span className="text-xs bg-piano-accent text-gray-300 px-2 py-0.5 rounded-full">
                          {GENRE_LABELS[piece.genre]}
                        </span>
                        <span className="text-xs text-gray-600">
                          {ERA_LABELS[piece.era]}
                        </span>
                      </div>
                      <h4 className="text-lg font-semibold text-white">{piece.title}</h4>
                      <p className="text-gray-400 text-sm">{piece.composer}</p>
                    </div>
                    <span className="text-gray-600 text-xl ml-4">
                      {expandedId === piece.id ? '▲' : '▼'}
                    </span>
                  </div>
                </button>

                {expandedId === piece.id && (
                  <div className="px-5 pb-5 border-t border-piano-accent pt-4 space-y-3">
                    <p className="text-gray-300">{piece.description}</p>

                    <div className="flex gap-2 flex-wrap">
                      {piece.moods.map(m => (
                        <span key={m} className="text-xs bg-piano-black text-gray-400 px-2 py-1 rounded">
                          {MOOD_LABELS[m]}
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-4 text-sm text-gray-500">
                      <span>연주 시간: {piece.duration}</span>
                    </div>

                    <div className="bg-piano-black rounded-lg p-4 border border-piano-accent">
                      <p className="text-sm text-gray-400">
                        <span className="text-piano-highlight font-semibold">연습 팁:</span>{' '}
                        {piece.tip}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <button
                        onClick={() => isSaved(piece.id) ? removePiece(piece.id) : savePiece(piece.id)}
                        className="flex items-center gap-1 text-sm cursor-pointer transition-colors hover:text-red-300"
                      >
                        <span>{isSaved(piece.id) ? '❤️' : '🤍'}</span>
                        <span className="text-gray-400">{isSaved(piece.id) ? '즐겨찾기 해제' : '즐겨찾기 추가'}</span>
                      </button>
                      {isSaved(piece.id) && (
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button
                              key={star}
                              onClick={() => updateRating(piece.id, star === getRating(piece.id) ? 0 : star)}
                              className="cursor-pointer"
                            >
                              {star <= getRating(piece.id) ? '★' : '☆'}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}

          <div className="text-center pt-2">
            <button
              onClick={handleRecommend}
              className="text-piano-highlight hover:text-red-400 transition-colors cursor-pointer"
            >
              다시 추천받기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterSection<T extends string>({
  title,
  items,
  selected,
  onToggle,
}: {
  title: string;
  items: Record<T, string>;
  selected: Set<T>;
  onToggle: (value: T) => void;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-400 mb-2">{title}</h3>
      <div className="flex gap-2 flex-wrap">
        {(Object.keys(items) as T[]).map(key => (
          <button
            key={key}
            onClick={() => onToggle(key)}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors cursor-pointer ${
              selected.has(key)
                ? 'bg-piano-highlight text-white'
                : 'bg-piano-accent text-gray-300 hover:bg-piano-highlight/30'
            }`}
          >
            {items[key]}
          </button>
        ))}
      </div>
    </div>
  );
}
