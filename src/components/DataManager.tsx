import { useRef } from 'react';
import { loadStudyNotes, saveStudyNotes, loadPracticeSessions, savePracticeSessions } from '../storage';

export default function DataManager() {
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!data.version || !Array.isArray(data.studyNotes) || !Array.isArray(data.practiceSessions)) {
          alert('올바른 백업 파일이 아닙니다.');
          return;
        }
        if (!confirm(`학습 기록 ${data.studyNotes.length}개, 연습 세션 ${data.practiceSessions.length}개를 가져올까요? 기존 데이터에 병합됩니다.`)) {
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

        alert(`가져오기 완료! 새 기록 ${newNotes.length}개, 새 세션 ${newSessions.length}개 추가됨.`);
        window.location.reload();
      } catch {
        alert('파일을 읽는 중 오류가 발생했습니다.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <div className="bg-piano-dark rounded-xl p-6 border border-piano-accent">
      <h3 className="text-lg font-semibold mb-4">데이터 관리</h3>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleExport}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors cursor-pointer"
        >
          📥 백업 내보내기 (JSON)
        </button>
        <label className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors cursor-pointer text-center">
          📤 백업 가져오기
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </label>
      </div>
      <p className="text-gray-600 text-xs mt-3">
        브라우저 데이터는 캐시 삭제 시 사라질 수 있습니다. 정기적으로 백업하세요.
      </p>
    </div>
  );
}
