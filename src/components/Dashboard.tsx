import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useStudyNotes } from '../hooks/useStudyNotes';
import { usePracticeSessions } from '../hooks/usePracticeSessions';
import type { PracticeSession } from '../types';
import { formatTimeKorean } from '../utils/format';
import DataManager from './DataManager';

function getWeeklyData(sessions: PracticeSession[]) {
  const now = new Date();
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const days: { name: string; minutes: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const total = sessions
      .filter(s => s.date.slice(0, 10) === dateStr)
      .reduce((sum, s) => sum + s.duration, 0);
    days.push({
      name: i === 0 ? '오늘' : dayNames[d.getDay()],
      minutes: Math.round(total / 60),
    });
  }
  return days;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { notes } = useStudyNotes();
  const { sessions } = usePracticeSessions();

  const totalPracticeTime = sessions.reduce((sum, s) => sum + s.duration, 0);
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayTime = sessions
    .filter(s => s.date.slice(0, 10) === todayStr)
    .reduce((sum, s) => sum + s.duration, 0);

  const weeklyData = useMemo(() => getWeeklyData(sessions), [sessions]);

  const streak = useMemo(() => {
    let count = 0;
    const now = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      if (sessions.some(s => s.date.slice(0, 10) === dateStr)) {
        count++;
      } else if (i > 0) {
        break;
      }
    }
    return count;
  }, [sessions]);

  const recentNotes = notes.slice(0, 3);
  const categoryLabels: Record<string, string> = {
    theory: '이론', piece: '연주곡', composer: '작곡가', progress: '진행도',
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        {user?.avatar ? (
          <img src={user.avatar} alt="" className="w-10 h-10 rounded-full" />
        ) : (
          <div className="w-10 h-10 bg-piano-highlight rounded-full flex items-center justify-center text-lg">
            {user?.name?.[0] || '?'}
          </div>
        )}
        <div>
          <h2 className="text-lg font-bold">안녕하세요, {user?.name || '게스트'}님!</h2>
          <p className="text-gray-600 text-xs">{user?.email}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="오늘" value={formatTimeKorean(todayTime)} icon="🎹" />
        <StatCard label="총 연습" value={formatTimeKorean(totalPracticeTime)} icon="⏱️" />
        <StatCard label="연속" value={`${streak}일`} icon="🔥" />
      </div>

      {/* Weekly Chart */}
      {sessions.length > 0 && (
        <div className="bg-piano-dark rounded-xl p-4 border border-piano-accent">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">이번 주 연습량 (분)</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2e303a" />
              <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: '#16213e', border: '1px solid #0f3460', borderRadius: '8px' }}
                labelStyle={{ color: '#f5f5f5' }}
                itemStyle={{ color: '#e94560' }}
              />
              <Bar dataKey="minutes" fill="#e94560" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Notes */}
      {recentNotes.length > 0 && (
        <div className="bg-piano-dark rounded-xl p-4 border border-piano-accent">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">최근 학습 기록</h3>
          <div className="space-y-2">
            {recentNotes.map(note => (
              <div key={note.id} className="bg-piano-black rounded-lg p-3 flex items-center gap-3">
                <span className="text-xs bg-piano-accent text-gray-300 px-2 py-0.5 rounded-full whitespace-nowrap">
                  {categoryLabels[note.category] || note.category}
                </span>
                <span className="text-white text-sm truncate flex-1">{note.title}</span>
                <span className="text-gray-600 text-xs whitespace-nowrap">
                  {new Date(note.date).toLocaleDateString('ko-KR')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <DataManager />
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bg-piano-dark rounded-xl p-3 border border-piano-accent text-center">
      <p className="text-xl mb-0.5">{icon}</p>
      <p className="text-base sm:text-lg font-bold text-white">{value}</p>
      <p className="text-gray-500 text-xs">{label}</p>
    </div>
  );
}
