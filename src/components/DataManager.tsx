import { useRef, useState } from 'react';
import { loadStudyNotes, saveStudyNotes, loadPracticeSessions, savePracticeSessions } from '../storage';

export default function DataManager() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  function showMessage(text: string, type: 'success' | 'error') {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  }

  function handleExport() {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      studyNotes: loadStudyNotes(),
      practiceSessions: loadPracticeSessions(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `piano-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showMessage('백업 파일이 다운로드되었습니다.', 'success');
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!data.version || !Array.isArray(data.studyNotes) || !Array.isArray(data.practiceSessions)) {
          showMessage('올바른 백업 파일이 아닙니다.', 'error');
          return;
        }
        const existingNotes = loadStudyNotes();
        const existingSessions = loadPracticeSessions();
        const existingNoteIds = new Set(existingNotes.map(n => n.id));
        const existingSessionIds = new Set(existingSessions.map(s => s.id));

        const newNotes = data.studyNotes.filter((n: { id: string }) => !existingNoteIds.has(n.id));
        const newSessions = data.practiceSessions.filter((s: { id: string }) => !existingSessionIds.has(s.id));

        saveStudyNotes([...newNotes, ...existingNotes]);
        savePracticeSessions([...newSessions, ...existingSessions]);

        showMessage(`기록 ${newNotes.length}개, 세션 ${newSessions.length}개 추가됨`, 'success');
        setTimeout(() => window.location.reload(), 1500);
      } catch {
        showMessage('파일을 읽는 중 오류가 발생했습니다.', 'error');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <div className="bg-piano-dark rounded-xl p-4 border border-piano-accent">
      <h3 className="text-sm font-semibold text-gray-400 mb-3">데이터 관리</h3>

      {message && (
        <div className={`mb-3 px-3 py-2 rounded-lg text-sm ${
          message.type === 'success' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleExport}
          className="flex-1 bg-piano-accent hover:bg-piano-highlight text-white py-2 rounded-lg text-sm transition-colors cursor-pointer"
        >
          📥 백업 내보내기
        </button>
        <label className="flex-1 bg-piano-accent hover:bg-piano-highlight text-white py-2 rounded-lg text-sm transition-colors cursor-pointer text-center">
          📤 가져오기
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
        </label>
      </div>
    </div>
  );
}
