import { useState, useRef, useEffect, useCallback } from 'react';
import { loadPracticeSessions, savePracticeSessions } from '../storage';
import type { PracticeSession } from '../types';

export default function Metronome() {
  const [bpm, setBpm] = useState(120);
  const [beats, setBeats] = useState(4);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);

  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [memo, setMemo] = useState('');
  const [sessions, setSessions] = useState<PracticeSession[]>(loadPracticeSessions);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const beatRef = useRef(0);

  const tick = useCallback(() => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const isAccent = beatRef.current % beats === 0;
    osc.frequency.value = isAccent ? 1000 : 800;
    gain.gain.setValueAtTime(isAccent ? 0.5 : 0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);

    setCurrentBeat(beatRef.current % beats);
    beatRef.current++;
  }, [beats]);

  function startMetronome() {
    audioCtxRef.current = new AudioContext();
    beatRef.current = 0;
    tick();
    intervalRef.current = window.setInterval(tick, (60 / bpm) * 1000);
    setIsPlaying(true);
  }

  function stopMetronome() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    audioCtxRef.current?.close();
    setIsPlaying(false);
    setCurrentBeat(0);
  }

  useEffect(() => {
    if (isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = window.setInterval(tick, (60 / bpm) * 1000);
    }
  }, [bpm, isPlaying, tick]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function startTimer() {
    setTimerSeconds(0);
    setTimerRunning(true);
    timerRef.current = window.setInterval(() => {
      setTimerSeconds(s => s + 1);
    }, 1000);
  }

  function stopTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerRunning(false);
  }

  function saveSession() {
    if (timerSeconds === 0) return;
    const session: PracticeSession = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      duration: timerSeconds,
      memo,
    };
    const updated = [session, ...sessions];
    setSessions(updated);
    savePracticeSessions(updated);
    setTimerSeconds(0);
    setMemo('');
  }

  function deleteSession(id: string) {
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    savePracticeSessions(updated);
  }

  function formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  const totalPracticeTime = sessions.reduce((acc, s) => acc + s.duration, 0);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">메트로놈 & 연습 타이머</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Metronome */}
        <div className="bg-piano-dark rounded-xl p-6 border border-piano-accent">
          <h3 className="text-lg font-semibold mb-6">메트로놈</h3>

          <div className="flex justify-center gap-3 mb-6">
            {Array.from({ length: beats }).map((_, i) => (
              <div
                key={i}
                className={`w-6 h-6 rounded-full transition-colors ${
                  currentBeat === i && isPlaying
                    ? i === 0 ? 'bg-piano-highlight scale-125' : 'bg-blue-400 scale-110'
                    : 'bg-piano-accent'
                }`}
              />
            ))}
          </div>

          <div className="text-center mb-6">
            <span className="text-5xl font-bold text-white">{bpm}</span>
            <span className="text-gray-500 ml-2">BPM</span>
          </div>

          <input
            type="range"
            min={40}
            max={240}
            value={bpm}
            onChange={e => setBpm(Number(e.target.value))}
            className="w-full mb-4 accent-piano-highlight"
          />

          <div className="flex justify-center gap-2 mb-4">
            {[60, 80, 100, 120, 140, 160].map(v => (
              <button
                key={v}
                onClick={() => setBpm(v)}
                className={`px-2 py-1 rounded text-sm cursor-pointer transition-colors ${
                  bpm === v ? 'bg-piano-highlight text-white' : 'bg-piano-accent text-gray-300'
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          <div className="flex justify-center gap-3 mb-4">
            <span className="text-gray-400 self-center">박자:</span>
            {[2, 3, 4, 6].map(b => (
              <button
                key={b}
                onClick={() => setBeats(b)}
                className={`px-3 py-1 rounded cursor-pointer transition-colors ${
                  beats === b ? 'bg-piano-highlight text-white' : 'bg-piano-accent text-gray-300'
                }`}
              >
                {b}/4
              </button>
            ))}
          </div>

          <button
            onClick={isPlaying ? stopMetronome : startMetronome}
            className={`w-full py-3 rounded-lg text-white text-lg font-semibold transition-colors cursor-pointer ${
              isPlaying ? 'bg-red-600 hover:bg-red-700' : 'bg-piano-highlight hover:bg-red-600'
            }`}
          >
            {isPlaying ? '정지' : '시작'}
          </button>
        </div>

        {/* Practice Timer */}
        <div className="bg-piano-dark rounded-xl p-6 border border-piano-accent">
          <h3 className="text-lg font-semibold mb-6">연습 타이머</h3>

          <div className="text-center mb-6">
            <span className="text-5xl font-mono font-bold text-white">
              {formatTime(timerSeconds)}
            </span>
          </div>

          <div className="flex gap-3 mb-6">
            {!timerRunning ? (
              <button
                onClick={startTimer}
                className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors cursor-pointer"
              >
                시작
              </button>
            ) : (
              <button
                onClick={stopTimer}
                className="flex-1 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold transition-colors cursor-pointer"
              >
                정지
              </button>
            )}
          </div>

          {!timerRunning && timerSeconds > 0 && (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="연습 메모 (선택)"
                value={memo}
                onChange={e => setMemo(e.target.value)}
                className="w-full bg-piano-black border border-piano-accent rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-piano-highlight"
              />
              <button
                onClick={saveSession}
                className="w-full py-2 bg-piano-highlight hover:bg-red-600 text-white rounded-lg transition-colors cursor-pointer"
              >
                기록 저장
              </button>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-piano-accent">
            <div className="flex justify-between text-sm text-gray-400 mb-3">
              <span>총 연습 시간</span>
              <span className="text-white font-semibold">{formatTime(totalPracticeTime)}</span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {sessions.map(session => (
                <div
                  key={session.id}
                  className="flex items-center justify-between bg-piano-black rounded-lg px-3 py-2"
                >
                  <div>
                    <span className="text-sm text-gray-400">
                      {new Date(session.date).toLocaleDateString('ko-KR')}
                    </span>
                    <span className="text-white ml-2">{formatTime(session.duration)}</span>
                    {session.memo && (
                      <span className="text-gray-500 ml-2 text-sm">- {session.memo}</span>
                    )}
                  </div>
                  <button
                    onClick={() => deleteSession(session.id)}
                    className="text-gray-600 hover:text-red-400 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
