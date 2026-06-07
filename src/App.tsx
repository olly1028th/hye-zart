import { useState } from 'react';
import type { TabType } from './types';
import { useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import Dashboard from './components/Dashboard';
import StudyLog from './components/StudyLog';
import PianoKeyboard from './components/PianoKeyboard';
import Metronome from './components/Metronome';
import Recommend from './components/Recommend';

const TABS: { id: TabType; label: string; icon: string; shortLabel: string }[] = [
  { id: 'dashboard', label: '대시보드', icon: '🏠', shortLabel: '홈' },
  { id: 'study', label: '학습 기록', icon: '📝', shortLabel: '기록' },
  { id: 'keyboard', label: '건반 & 악보', icon: '🎹', shortLabel: '건반' },
  { id: 'metronome', label: '메트로놈', icon: '⏱️', shortLabel: '메트로놈' },
  { id: 'recommend', label: '곡 추천', icon: '🎵', shortLabel: '추천' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-piano-black">
      <header className="bg-piano-dark border-b border-piano-accent">
        <div className="max-w-5xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              🎵 Piano Study Tracker
            </h1>
            <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
              피아노 학습을 기록하고 연습하세요
            </p>
          </div>
          {user && (
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-xs sm:text-sm hidden sm:inline">{user.name}</span>
              <div className="w-8 h-8 bg-piano-highlight rounded-full flex items-center justify-center text-sm text-white">
                {user.name[0]}
              </div>
              <button
                onClick={logout}
                className="text-gray-500 hover:text-white text-xs transition-colors cursor-pointer"
              >
                로그아웃
              </button>
            </div>
          )}
        </div>
      </header>

      <nav className="bg-piano-dark border-b border-piano-accent sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-2 sm:px-4 flex gap-0 sm:gap-1 overflow-x-auto scrollbar-hide">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-2 sm:px-4 py-2.5 sm:py-3 font-medium transition-colors cursor-pointer whitespace-nowrap text-sm sm:text-base ${
                activeTab === tab.id
                  ? 'text-piano-highlight border-b-2 border-piano-highlight'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab.icon} <span className="sm:hidden">{tab.shortLabel}</span><span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <ErrorBoundary fallbackMessage="이 기능에서 문제가 발생했습니다">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'study' && <StudyLog />}
          {activeTab === 'keyboard' && <PianoKeyboard />}
          {activeTab === 'metronome' && <Metronome />}
          {activeTab === 'recommend' && <Recommend />}
        </ErrorBoundary>
      </main>
    </div>
  );
}
