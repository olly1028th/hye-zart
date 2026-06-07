import { useState, useRef, useEffect, useCallback } from 'react';
import { Renderer, Stave, StaveNote, Voice, Formatter, Accidental } from 'vexflow';

function generateNotes(startOctave: number, octaves: number) {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const notes: { key: string; label: string; isBlack: boolean }[] = [];
  for (let oct = startOctave; oct < startOctave + octaves; oct++) {
    for (const name of noteNames) {
      notes.push({
        key: `${name}${oct}`,
        label: name.replace('#', ''),
        isBlack: name.includes('#'),
      });
    }
  }
  notes.push({ key: `C${startOctave + octaves}`, label: 'C', isBlack: false });
  return notes;
}

const KEY_BINDINGS: Record<string, string> = {
  z: 'C3', s: 'C#3', x: 'D3', d: 'D#3', c: 'E3',
  v: 'F3', g: 'F#3', b: 'G3', h: 'G#3', n: 'A3',
  j: 'A#3', m: 'B3',
  q: 'C4', '2': 'C#4', w: 'D4', '3': 'D#4', e: 'E4',
  r: 'F4', '5': 'F#4', t: 'G4', '6': 'G#4', y: 'A4',
  '7': 'A#4', u: 'B4',
  i: 'C5', '9': 'C#5', o: 'D5', '0': 'D#5', p: 'E5',
};

function toVexFlowKey(noteKey: string): string {
  const match = noteKey.match(/^([A-G]#?)(\d)$/);
  if (!match) return 'c/4';
  return `${match[1].toLowerCase()}/${match[2]}`;
}

const NOTE_SEMITONES: Record<string, number> = {
  'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4,
  'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11,
};

let sharedAudioCtx: AudioContext | null = null;
function getAudioCtx() {
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    sharedAudioCtx = new AudioContext();
  }
  return sharedAudioCtx;
}

function playNote(noteKey: string, volume: number) {
  const ctx = getAudioCtx();
  const match = noteKey.match(/^([A-G]#?)(\d)$/);
  if (!match) return;

  const semitone = NOTE_SEMITONES[match[1]];
  const octave = parseInt(match[2]);
  const freq = 440 * Math.pow(2, (semitone - 9) / 12 + (octave - 4));
  const t = ctx.currentTime;
  const vol = volume * 0.4;

  const fundamental = ctx.createOscillator();
  const fundGain = ctx.createGain();
  fundamental.type = 'sine';
  fundamental.frequency.value = freq;
  fundGain.gain.setValueAtTime(vol, t);
  fundGain.gain.exponentialRampToValueAtTime(vol * 0.5, t + 0.05);
  fundGain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
  fundamental.connect(fundGain);

  const harmonic2 = ctx.createOscillator();
  const h2Gain = ctx.createGain();
  harmonic2.type = 'sine';
  harmonic2.frequency.value = freq * 2;
  h2Gain.gain.setValueAtTime(vol * 0.3, t);
  h2Gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
  harmonic2.connect(h2Gain);

  const harmonic3 = ctx.createOscillator();
  const h3Gain = ctx.createGain();
  harmonic3.type = 'sine';
  harmonic3.frequency.value = freq * 3;
  h3Gain.gain.setValueAtTime(vol * 0.1, t);
  h3Gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  harmonic3.connect(h3Gain);

  const master = ctx.createGain();
  master.gain.value = 1;
  fundGain.connect(master);
  h2Gain.connect(master);
  h3Gain.connect(master);
  master.connect(ctx.destination);

  fundamental.start(t);
  harmonic2.start(t);
  harmonic3.start(t);
  fundamental.stop(t + 1.3);
  harmonic2.stop(t + 0.7);
  harmonic3.stop(t + 0.4);
}

export default function PianoKeyboard() {
  const [melody, setMelody] = useState<string[]>([]);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.7);
  const [octaveStart, setOctaveStart] = useState(3);
  const sheetRef = useRef<HTMLDivElement>(null);

  const NOTES = generateNotes(octaveStart, 3);

  const handleKeyPress = useCallback((noteKey: string) => {
    setActiveKey(noteKey);
    playNote(noteKey, volume);
    setMelody(prev => {
      const updated = [...prev, noteKey];
      if (updated.length > 64) return updated.slice(-64);
      return updated;
    });
    setTimeout(() => setActiveKey(null), 150);
  }, [volume]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.repeat || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const note = KEY_BINDINGS[e.key.toLowerCase()];
      if (note) {
        e.preventDefault();
        handleKeyPress(note);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleKeyPress]);

  useEffect(() => {
    if (!sheetRef.current || melody.length === 0) return;

    sheetRef.current.innerHTML = '';
    const renderer = new Renderer(sheetRef.current, Renderer.Backends.SVG);
    const notesPerStave = 8;
    const staveCount = Math.ceil(melody.length / notesPerStave);
    const staveWidth = Math.min(500, sheetRef.current.clientWidth - 20);
    const staveHeight = 120;

    renderer.resize(staveWidth + 20, staveCount * staveHeight + 20);
    const context = renderer.getContext();

    for (let s = 0; s < staveCount; s++) {
      const staveNotes = melody.slice(s * notesPerStave, (s + 1) * notesPerStave);
      const stave = new Stave(10, s * staveHeight + 10, staveWidth);
      if (s === 0) stave.addClef('treble');
      stave.setContext(context).draw();

      const vfNotes = staveNotes.map(n => {
        const vfKey = toVexFlowKey(n);
        const note = new StaveNote({ keys: [vfKey], duration: 'q' });
        if (n.includes('#')) {
          note.addModifier(new Accidental('#'), 0);
        }
        return note;
      });

      const voice = new Voice({ numBeats: staveNotes.length, beatValue: 4 });
      voice.addTickables(vfNotes);
      new Formatter().joinVoices([voice]).format([voice], staveWidth - 60);
      voice.draw(context, stave);
    }
  }, [melody]);

  function clearMelody() {
    setMelody([]);
    if (sheetRef.current) sheetRef.current.innerHTML = '';
  }

  function undoLast() {
    setMelody(prev => prev.slice(0, -1));
  }

  const whiteKeys = NOTES.filter(n => !n.isBlack);
  const blackKeys = NOTES.filter(n => n.isBlack);

  const whiteKeyW = 38;
  const blackKeyW = 24;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-2xl font-bold">가상 건반</h2>
        <div className="flex gap-2 items-center">
          <span className="text-gray-500 text-sm">
            {melody.length}/64
          </span>
          <button
            onClick={undoLast}
            disabled={melody.length === 0}
            className="bg-piano-accent hover:bg-piano-highlight disabled:opacity-40 text-white px-3 py-2 rounded-lg transition-colors cursor-pointer text-sm"
          >
            되돌리기
          </button>
          <button
            onClick={clearMelody}
            className="bg-piano-accent hover:bg-piano-highlight text-white px-3 py-2 rounded-lg transition-colors cursor-pointer text-sm"
          >
            초기화
          </button>
        </div>
      </div>

      <div className="bg-piano-dark rounded-xl p-4 sm:p-6 border border-piano-accent">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <p className="text-gray-500 text-sm">
            <span className="hidden sm:inline">건반 클릭 또는 키보드: 하단(Z~M) 중단(Q~U) 상단(I~P)</span>
            <span className="sm:hidden">건반을 터치하세요</span>
          </p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-xs">옥타브</span>
              <button
                onClick={() => setOctaveStart(Math.max(1, octaveStart - 1))}
                disabled={octaveStart <= 1}
                className="bg-piano-accent text-white w-7 h-7 rounded text-sm cursor-pointer disabled:opacity-40"
              >-</button>
              <span className="text-white text-sm w-12 text-center">C{octaveStart}-C{octaveStart + 3}</span>
              <button
                onClick={() => setOctaveStart(Math.min(5, octaveStart + 1))}
                disabled={octaveStart >= 5}
                className="bg-piano-accent text-white w-7 h-7 rounded text-sm cursor-pointer disabled:opacity-40"
              >+</button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-xs">음량</span>
              <input
                type="range"
                min={0}
                max={100}
                value={volume * 100}
                onChange={e => setVolume(Number(e.target.value) / 100)}
                className="w-16 sm:w-20 accent-piano-highlight"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="relative mx-auto" style={{ width: `${whiteKeys.length * whiteKeyW}px`, height: '160px', minWidth: '300px' }}>
            {whiteKeys.map((note, i) => (
              <button
                key={note.key}
                onPointerDown={() => handleKeyPress(note.key)}
                className={`absolute bottom-0 border border-gray-300 rounded-b-md transition-colors cursor-pointer touch-none select-none ${
                  activeKey === note.key
                    ? 'bg-piano-highlight'
                    : 'bg-white hover:bg-gray-100 active:bg-piano-highlight'
                }`}
                style={{
                  left: `${i * whiteKeyW}px`,
                  width: `${whiteKeyW - 2}px`,
                  height: '150px',
                }}
              >
                <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 select-none">
                  {note.label}{note.key.match(/\d/)?.[0]}
                </span>
              </button>
            ))}
            {blackKeys.map(note => {
              const pos = getBlackKeyPosition(note.key, NOTES);
              return (
                <button
                  key={note.key}
                  onPointerDown={() => handleKeyPress(note.key)}
                  className={`absolute top-0 rounded-b-md z-10 transition-colors cursor-pointer touch-none select-none ${
                    activeKey === note.key
                      ? 'bg-piano-highlight'
                      : 'bg-gray-900 hover:bg-gray-700 active:bg-piano-highlight'
                  }`}
                  style={{
                    left: `${pos * whiteKeyW + (whiteKeyW - blackKeyW / 2 - 2)}px`,
                    width: `${blackKeyW}px`,
                    height: '95px',
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-piano-dark rounded-xl p-4 sm:p-6 border border-piano-accent">
        <h3 className="text-lg font-semibold mb-4">악보</h3>
        {melody.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            건반을 눌러 악보를 그려보세요
          </p>
        ) : (
          <div ref={sheetRef} className="overflow-x-auto bg-white rounded-lg p-2 sm:p-4" />
        )}
      </div>
    </div>
  );
}

function getBlackKeyPosition(key: string, allNotes: { key: string; isBlack: boolean }[]): number {
  let whiteIndex = 0;
  for (const n of allNotes) {
    if (n.key === key) return whiteIndex;
    if (!n.isBlack) whiteIndex++;
  }
  return 0;
}
