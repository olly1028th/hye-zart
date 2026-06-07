import { useState } from 'react';
import type { TabType } from './types';
import StudyLog from './components/StudyLog';
import PianoKeyboard from './components/PianoKeyboard';
import Metronome from './components/Metronome';
import Recommend from './components/Recommend';

const TABS: { id: TabType; label: string; icon: string }[] = [
  { id: 'study', label: '학습 기록', icon: '📝' },
  { id: 'keyboard', label: '건반 & 악보', icon: '🎹' },
  { id: 'metronome', label: '메트로놈', icon: '⏱️' },
  { id: 'recommend', label: '곡 추천', icon: '🎵' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('study');

  return (
    <div className="min-h-screen bg-piano-black">
      <header className="bg-piano-dark border-b border-piano-accent">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-white">
            🎵 Piano Study Tracker
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            피아노 학습을 기록하고 연습하세요
          </p>
        </div>
      </header>

      <nav className="bg-piano-dark border-b border-piano-accent sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 flex gap-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-medium transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'text-piano-highlight border-b-2 border-piano-highlight'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {activeTab === 'study' && <StudyLog />}
        {activeTab === 'keyboard' && <PianoKeyboard />}
        {activeTab === 'metronome' && <Metronome />}
        {activeTab === 'recommend' && <Recommend />}
      </main>
    </div>
  );
}
