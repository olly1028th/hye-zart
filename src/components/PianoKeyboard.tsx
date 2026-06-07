import { useState, useRef, useEffect, useCallback } from 'react';
import { Renderer, Stave, StaveNote, Voice, Formatter, Accidental } from 'vexflow';

const NOTES = [
  { key: 'C4', label: 'C', isBlack: false },
  { key: 'C#4', label: 'C#', isBlack: true },
  { key: 'D4', label: 'D', isBlack: false },
  { key: 'D#4', label: 'D#', isBlack: true },
  { key: 'E4', label: 'E', isBlack: false },
  { key: 'F4', label: 'F', isBlack: false },
  { key: 'F#4', label: 'F#', isBlack: true },
  { key: 'G4', label: 'G', isBlack: false },
  { key: 'G#4', label: 'G#', isBlack: true },
  { key: 'A4', label: 'A', isBlack: false },
  { key: 'A#4', label: 'A#', isBlack: true },
  { key: 'B4', label: 'B', isBlack: false },
  { key: 'C5', label: 'C', isBlack: false },
  { key: 'C#5', label: 'C#', isBlack: true },
  { key: 'D5', label: 'D', isBlack: false },
  { key: 'D#5', label: 'D#', isBlack: true },
  { key: 'E5', label: 'E', isBlack: false },
  { key: 'F5', label: 'F', isBlack: false },
  { key: 'F#5', label: 'F#', isBlack: true },
  { key: 'G5', label: 'G', isBlack: false },
  { key: 'G#5', label: 'G#', isBlack: true },
  { key: 'A5', label: 'A', isBlack: false },
  { key: 'A#5', label: 'A#', isBlack: true },
  { key: 'B5', label: 'B', isBlack: false },
];

const KEY_BINDINGS: Record<string, string> = {
  a: 'C4', w: 'C#4', s: 'D4', e: 'D#4', d: 'E4',
  f: 'F4', t: 'F#4', g: 'G4', y: 'G#4', h: 'A4',
  u: 'A#4', j: 'B4', k: 'C5', o: 'C#5', l: 'D5',
  p: 'D#5', ';': 'E5',
};

function toVexFlowKey(noteKey: string): string {
  const match = noteKey.match(/^([A-G]#?)(\d)$/);
  if (!match) return 'c/4';
  const name = match[1].toLowerCase();
  const octave = match[2];
  return `${name}/${octave}`;
}

function playNote(noteKey: string) {
  const audioCtx = new AudioContext();
  const match = noteKey.match(/^([A-G]#?)(\d)$/);
  if (!match) return;

  const noteNames: Record<string, number> = {
    'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4,
    'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11,
  };

  const semitone = noteNames[match[1]];
  const octave = parseInt(match[2]);
  const freq = 440 * Math.pow(2, (semitone - 9) / 12 + (octave - 4));

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.8);
}

export default function PianoKeyboard() {
  const [melody, setMelody] = useState<string[]>([]);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const handleKeyPress = useCallback((noteKey: string) => {
    setActiveKey(noteKey);
    playNote(noteKey);
    setMelody(prev => {
      const updated = [...prev, noteKey];
      if (updated.length > 32) return updated.slice(-32);
      return updated;
    });
    setTimeout(() => setActiveKey(null), 150);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.repeat) return;
      const note = KEY_BINDINGS[e.key.toLowerCase()];
      if (note) handleKeyPress(note);
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
    const staveWidth = 500;
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
      new Formatter().joinVoices([voice]).format([voice], staveWidth - 50);
      voice.draw(context, stave);
    }
  }, [melody]);

  function clearMelody() {
    setMelody([]);
    if (sheetRef.current) sheetRef.current.innerHTML = '';
  }

  const whiteKeys = NOTES.filter(n => !n.isBlack);
  const blackKeys = NOTES.filter(n => n.isBlack);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">가상 건반</h2>
        <div className="flex gap-2">
          <span className="text-gray-500 text-sm self-center">
            {melody.length}개 음표
          </span>
          <button
            onClick={clearMelody}
            className="bg-piano-accent hover:bg-piano-highlight text-white px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            초기화
          </button>
        </div>
      </div>

      <div className="bg-piano-dark rounded-xl p-6 border border-piano-accent">
        <p className="text-gray-500 text-sm mb-4">
          건반을 클릭하거나 키보드(A~;)를 사용하세요
        </p>
        <div className="relative mx-auto" style={{ width: `${whiteKeys.length * 44}px`, height: '180px' }}>
          {whiteKeys.map((note, i) => (
            <button
              key={note.key}
              onClick={() => handleKeyPress(note.key)}
              className={`absolute bottom-0 border border-gray-300 rounded-b-md transition-colors cursor-pointer ${
                activeKey === note.key
                  ? 'bg-piano-highlight'
                  : 'bg-white hover:bg-gray-100'
              }`}
              style={{
                left: `${i * 44}px`,
                width: '42px',
                height: '170px',
              }}
            >
              <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-gray-500">
                {note.label}
              </span>
            </button>
          ))}
          {blackKeys.map(note => {
            const whiteIndex = getBlackKeyPosition(note.key);
            return (
              <button
                key={note.key}
                onClick={() => handleKeyPress(note.key)}
                className={`absolute top-0 rounded-b-md z-10 transition-colors cursor-pointer ${
                  activeKey === note.key
                    ? 'bg-piano-highlight'
                    : 'bg-gray-900 hover:bg-gray-700'
                }`}
                style={{
                  left: `${whiteIndex * 44 + 28}px`,
                  width: '28px',
                  height: '110px',
                }}
              />
            );
          })}
        </div>
      </div>

      <div className="bg-piano-dark rounded-xl p-6 border border-piano-accent">
        <h3 className="text-lg font-semibold mb-4">악보</h3>
        {melody.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            건반을 눌러 악보를 그려보세요
          </p>
        ) : (
          <div ref={sheetRef} className="overflow-x-auto bg-white rounded-lg p-4" />
        )}
      </div>
    </div>
  );
}

function getBlackKeyPosition(key: string): number {
  const blackPositions: Record<string, number> = {
    'C#4': 0, 'D#4': 1, 'F#4': 3, 'G#4': 4, 'A#4': 5,
    'C#5': 7, 'D#5': 8, 'F#5': 10, 'G#5': 11, 'A#5': 12,
  };
  return blackPositions[key] ?? 0;
}
