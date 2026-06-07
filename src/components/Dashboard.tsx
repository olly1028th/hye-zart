import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { loadStudyNotes, loadPracticeSessions } from '../storage';
import { PIECES } from '../data/pieces';
import type { StudyNote, PracticeSession } from '../types';
import DataManager from './DataManager';

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}시간 ${m}분`;
  return `${m}분`;
}

function getWeeklyData(sessions: PracticeSession[]) {
  const now = new Date();
  const days: { name: string; minutes: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
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

function getMonthlyData(sessions: PracticeSession[]) {
  const now = new Date();
  const weeks: { name: string; minutes: number }[] = [];
  for (let i = 3; i >= 0; i--) {
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - i * 7);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 6);
    const total = sessions
      .filter(s => {
        const d = new Date(s.date);
        return d >= weekStart && d <= weekEnd;
      })
      .reduce((sum, s) => sum + s.duration, 0);
    weeks.push({
      name: i === 0 ? '이번 주' : `${i}주 전`,
      minutes: Math.round(total / 60),
    });
  }
  return weeks;
}

function getCategoryStats(notes: StudyNote[]) {
  const counts = { theory: 0, piece: 0, composer: 0, progress: 0 };
  const labels = { theory: '이론', piece: '연주곡', composer: '작곡가', progress: '진행도' };
  notes.forEach(n => counts[n.category]++);
  return Object.entries(counts).map(([key, count]) => ({
    name: labels[key as keyof typeof labels],
    count,
  }));
}

export default function Dashboard() {
  const { user } = useAuth();
  const notes = useMemo(loadStudyNotes, []);
  const sessions = useMemo(loadPracticeSessions, []);

  const totalPracticeTime = sessions.reduce((sum, s) => sum + s.duration, 0);
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayTime = sessions
    .filter(s => s.date.slice(0, 10) === todayStr)
    .reduce((sum, s) => sum + s.duration, 0);

  const weeklyData = useMemo(() => getWeeklyData(sessions), [sessions]);
  const monthlyData = useMemo(() => getMonthlyData(sessions), [sessions]);
  const categoryStats = useMemo(() => getCategoryStats(notes), [notes]);

  const recentNotes = notes.slice(0, 3);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-piano-highlight rounded-full flex items-center justify-center text-xl">
          {user?.name?.[0] || '?'}
        </div>
        <div>
          <h2 className="text-xl font-bold">
            안녕하세요, {user?.name || '게스트'}님!
          </h2>
          <p className="text-gray-500 text-sm">{user?.email}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="오늘 연습" value={formatTime(todayTime)} icon="🎹" />
        <StatCard label="총 연습 시간" value={formatTime(totalPracticeTime)} icon="⏱️" />
        <StatCard label="학습 기록" value={`${notes.length}개`} icon="📝" />
        <StatCard label="연속 연습" value={`${streak}일`} icon="🔥" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-piano-dark rounded-xl p-4 sm:p-6 border border-piano-accent">
          <h3 className="text-base font-semibold mb-4">주간 연습량 (분)</h3>
          {sessions.length === 0 ? (
            <p className="text-gray-600 text-center py-8 text-sm">아직 연습 기록이 없습니다</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
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
          )}
        </div>

        <div className="bg-piano-dark rounded-xl p-4 sm:p-6 border border-piano-accent">
          <h3 className="text-base font-semibold mb-4">월간 연습량 (분)</h3>
          {sessions.length === 0 ? (
            <p className="text-gray-600 text-center py-8 text-sm">아직 연습 기록이 없습니다</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2e303a" />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#16213e', border: '1px solid #0f3460', borderRadius: '8px' }}
                  labelStyle={{ color: '#f5f5f5' }}
                  itemStyle={{ color: '#3b82f6' }}
                />
                <Bar dataKey="minutes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Category Stats */}
      <div className="bg-piano-dark rounded-xl p-4 sm:p-6 border border-piano-accent">
        <h3 className="text-base font-semibold mb-4">카테고리별 학습 기록</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {categoryStats.map(stat => (
            <div key={stat.name} className="bg-piano-black rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-white">{stat.count}</p>
              <p className="text-gray-500 text-sm">{stat.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Notes */}
      <div className="bg-piano-dark rounded-xl p-4 sm:p-6 border border-piano-accent">
        <h3 className="text-base font-semibold mb-4">최근 학습 기록</h3>
        {recentNotes.length === 0 ? (
          <p className="text-gray-600 text-center py-4 text-sm">학습 기록 탭에서 첫 기록을 추가해보세요!</p>
        ) : (
          <div className="space-y-2">
            {recentNotes.map(note => (
              <div key={note.id} className="bg-piano-black rounded-lg p-3 flex items-center gap-3">
                <span className="text-xs bg-piano-accent text-gray-300 px-2 py-0.5 rounded-full whitespace-nowrap">
                  {{ theory: '이론', piece: '연주곡', composer: '작곡가', progress: '진행도' }[note.category]}
                </span>
                <span className="text-white text-sm truncate flex-1">{note.title}</span>
                <span className="text-gray-600 text-xs whitespace-nowrap">
                  {new Date(note.date).toLocaleDateString('ko-KR')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Recommend */}
      <div className="bg-piano-dark rounded-xl p-4 sm:p-6 border border-piano-accent">
        <h3 className="text-base font-semibold mb-4">오늘의 추천곡</h3>
        <DailyRecommend />
      </div>

      <DataManager />
    </div>
  );
}

function DailyRecommend() {
  const today = new Date().toISOString().slice(0, 10);
  const seed = today.split('-').reduce((a, b) => a + parseInt(b), 0);
  const picks = [
    PIECES[seed % PIECES.length],
    PIECES[(seed * 7 + 3) % PIECES.length],
    PIECES[(seed * 13 + 11) % PIECES.length],
  ];

  const diffColors: Record<string, string> = {
    beginner: 'bg-green-600', intermediate: 'bg-blue-600',
    advanced: 'bg-orange-600', expert: 'bg-red-600',
  };
  const diffLabels: Record<string, string> = {
    beginner: '초급', intermediate: '중급', advanced: '상급', expert: '전문가',
  };

  return (
    <div className="space-y-2">
      {picks.map(p => (
        <div key={p.id} className="bg-piano-black rounded-lg p-3 flex items-center gap-3">
          <span className={`text-xs text-white px-2 py-0.5 rounded-full ${diffColors[p.difficulty]}`}>
            {diffLabels[p.difficulty]}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm truncate">{p.title}</p>
            <p className="text-gray-500 text-xs">{p.composer}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bg-piano-dark rounded-xl p-4 border border-piano-accent text-center">
      <p className="text-2xl mb-1">{icon}</p>
      <p className="text-lg sm:text-xl font-bold text-white">{value}</p>
      <p className="text-gray-500 text-xs sm:text-sm">{label}</p>
    </div>
  );
}
