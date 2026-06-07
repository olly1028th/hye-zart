import { useState } from 'react';
import type { CategoryType } from '../types';
import { useStudyNotes } from '../hooks/useStudyNotes';

const CATEGORY_LABELS: Record<CategoryType, string> = {
  theory: '이론',
  piece: '연주곡',
  composer: '작곡가',
  progress: '진행도',
};

const CATEGORY_COLORS: Record<CategoryType, string> = {
  theory: 'bg-blue-500',
  piece: 'bg-green-500',
  composer: 'bg-purple-500',
  progress: 'bg-yellow-500',
};

export default function StudyLog() {
  const { notes, loading, addNote, updateNote, deleteNote } = useStudyNotes();
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<CategoryType | 'all'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<CategoryType>('theory');
  const [tagInput, setTagInput] = useState('');

  function resetForm() {
    setTitle('');
    setContent('');
    setCategory('theory');
    setTagInput('');
    setEditingId(null);
    setShowForm(false);
  }

  async function handleSave() {
    if (!title.trim()) return;
    const tags = tagInput.split(',').map(t => t.trim()).filter(Boolean);

    if (editingId) {
      await updateNote(editingId, { title, content, category, tags });
    } else {
      await addNote({ category, title, content, tags });
    }
    resetForm();
  }

  function handleEdit(note: { id: string; category: CategoryType; title: string; content: string; tags: string[] }) {
    setTitle(note.title);
    setContent(note.content);
    setCategory(note.category);
    setTagInput(note.tags.join(', '));
    setEditingId(note.id);
    setShowForm(true);
  }

  const filtered = notes.filter(n => {
    if (filter !== 'all' && n.category !== filter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  if (loading) {
    return <div className="text-center text-gray-500 py-12">불러오는 중...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">학습 기록</h2>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="bg-piano-highlight hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer"
        >
          {showForm ? '취소' : '+ 새 기록'}
        </button>
      </div>

      {showForm && (
        <div className="bg-piano-dark border border-piano-accent rounded-xl p-4 sm:p-6 space-y-4">
          <div className="flex gap-2 sm:gap-3 flex-wrap">
            {(Object.keys(CATEGORY_LABELS) as CategoryType[]).map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1 rounded-full text-sm transition-colors cursor-pointer ${
                  category === cat
                    ? 'bg-piano-highlight text-white'
                    : 'bg-piano-accent text-gray-300 hover:bg-piano-highlight/50'
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="제목"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full bg-piano-black border border-piano-accent rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-piano-highlight"
          />
          <textarea
            placeholder="내용을 입력하세요..."
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={4}
            className="w-full bg-piano-black border border-piano-accent rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-piano-highlight resize-none"
          />
          <input
            type="text"
            placeholder="태그 (쉼표로 구분: 바흐, 인벤션, 대위법)"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            className="w-full bg-piano-black border border-piano-accent rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-piano-highlight"
          />
          <button
            onClick={handleSave}
            className="bg-piano-highlight hover:bg-red-600 text-white px-6 py-2 rounded-lg transition-colors cursor-pointer"
          >
            {editingId ? '수정' : '저장'}
          </button>
        </div>
      )}

      <input
        type="text"
        placeholder="제목, 내용, 태그로 검색..."
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        className="w-full bg-piano-dark border border-piano-accent rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-piano-highlight"
      />

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded-full text-sm transition-colors cursor-pointer ${
            filter === 'all' ? 'bg-piano-highlight text-white' : 'bg-piano-accent text-gray-300'
          }`}
        >
          전체
        </button>
        {(Object.keys(CATEGORY_LABELS) as CategoryType[]).map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1 rounded-full text-sm transition-colors cursor-pointer ${
              filter === cat ? 'bg-piano-highlight text-white' : 'bg-piano-accent text-gray-300'
            }`}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          <p className="text-4xl mb-2">📝</p>
          <p>{searchQuery ? '검색 결과가 없습니다.' : '아직 기록이 없습니다. 첫 번째 학습 기록을 추가해보세요!'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(note => (
            <div
              key={note.id}
              className="bg-piano-dark border border-piano-accent rounded-xl p-4 sm:p-5 hover:border-piano-highlight/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`${CATEGORY_COLORS[note.category]} text-white text-xs px-2 py-0.5 rounded-full`}>
                      {CATEGORY_LABELS[note.category]}
                    </span>
                    <span className="text-gray-500 text-sm">
                      {new Date(note.date).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">{note.title}</h3>
                  <p className="text-gray-400 whitespace-pre-wrap">{note.content}</p>
                  {note.tags.length > 0 && (
                    <div className="flex gap-1 mt-3 flex-wrap">
                      {note.tags.map(tag => (
                        <span key={tag} className="text-xs bg-piano-accent text-gray-300 px-2 py-0.5 rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 ml-4 shrink-0">
                  <button
                    onClick={() => handleEdit(note)}
                    className="text-gray-500 hover:text-white transition-colors cursor-pointer"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
