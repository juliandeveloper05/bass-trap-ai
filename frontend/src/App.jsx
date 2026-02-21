import React, { useState, useRef, useCallback } from 'react';
import {
  UploadCloud, Music, Download, Loader2, CheckCircle2,
  AlertCircle, FileAudio, X, Terminal, Zap
} from 'lucide-react';

// --- Constants ---
const ALLOWED_TYPES = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/ogg'];
const ALLOWED_EXTS = ['.mp3', '.wav', '.flac', '.ogg'];
const MAX_SIZE_MB = 100;
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const LOG_STEPS = [
  { delay: 0,    text: '🎵 Reading audio file...' },
  { delay: 2000, text: '📊 Detecting BPM with Librosa...' },
  { delay: 5000, text: '🤖 Demucs isolating bass stem (this takes a while)...' },
  { delay: 15000, text: '⏳ Demucs is still processing...' },
  { delay: 30000, text: '🎹 Converting bass audio to MIDI with Basic Pitch...' },
  { delay: 45000, text: '✨ Finalizing and encoding MIDI...' },
];

// --- Helper ---
function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validateFile(file) {
  if (!file) return 'No file selected.';
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  if (!ALLOWED_EXTS.includes(ext)) return `Invalid file type. Allowed: ${ALLOWED_EXTS.join(', ')}`;
  if (file.size > MAX_SIZE_MB * 1024 * 1024) return `File too large. Max size: ${MAX_SIZE_MB}MB.`;
  return null;
}

// --- Sub-components ---
function LogPanel({ logs }) {
  const bottomRef = useRef(null);
  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="mt-6 bg-neutral-950 border border-neutral-800 rounded-xl p-4 h-36 overflow-y-auto font-mono text-xs">
      <div className="flex items-center gap-2 mb-2 text-neutral-500">
        <Terminal className="w-3 h-3" />
        <span>Processing Log</span>
      </div>
      {logs.map((log, i) => (
        <p key={i} className="text-emerald-400 leading-relaxed">{log}</p>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

function ResultCard({ result, onDownload, onReset }) {
  return (
    <div className="mt-6 bg-neutral-950 border border-emerald-500/30 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        <span className="font-semibold text-emerald-400">Extraction Complete</span>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-neutral-900 rounded-lg p-3 text-center">
          <p className="text-neutral-500 text-xs mb-1">Detected BPM</p>
          <p className="text-2xl font-extrabold text-indigo-400">{result.bpm}</p>
        </div>
        <div className="bg-neutral-900 rounded-lg p-3 text-center">
          <p className="text-neutral-500 text-xs mb-1">Source File</p>
          <p className="text-sm font-semibold text-neutral-200 truncate">{result.filename}</p>
        </div>
      </div>
      <button
        onClick={onDownload}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white font-bold py-3 rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/20 cursor-pointer"
      >
        <Download className="w-4 h-4" />
        Download MIDI
      </button>
      <button
        onClick={onReset}
        className="w-full mt-2 text-neutral-500 hover:text-neutral-300 text-sm py-2 transition-colors cursor-pointer"
      >
        Process another file
      </button>
    </div>
  );
}

// --- Main App ---
export default function App() {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const logTimersRef = useRef([]);

  const pushLog = useCallback((text) => {
    setLogs(prev => [...prev, text]);
  }, []);

  const startSimulatedLogs = useCallback(() => {
    logTimersRef.current.forEach(clearTimeout);
    logTimersRef.current = LOG_STEPS.map(({ delay, text }) =>
      setTimeout(() => pushLog(text), delay)
    );
  }, [pushLog]);

  const stopSimulatedLogs = useCallback(() => {
    logTimersRef.current.forEach(clearTimeout);
    logTimersRef.current = [];
  }, []);

  const applyFile = useCallback((f) => {
    const err = validateFile(f);
    if (err) { setError(err); return; }
    setError(null);
    setResult(null);
    setLogs([]);
    setFile(f);
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) applyFile(e.target.files[0]);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) applyFile(dropped);
  }, [applyFile]);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  const handleProcess = async () => {
    if (!file || isProcessing) return;

    setIsProcessing(true);
    setError(null);
    setResult(null);
    setLogs([]);
    startSimulatedLogs();

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_URL}/process`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ detail: 'Unknown server error.' }));
        throw new Error(errData.detail || `Server error: ${response.status}`);
      }

      const data = await response.json();
      pushLog('🎉 Done! MIDI is ready.');
      setResult(data);
    } catch (err) {
      const msg = err.message.includes('Failed to fetch')
        ? 'Cannot reach the backend. Is the FastAPI server running on port 8000?'
        : err.message;
      setError(msg);
      pushLog(`❌ Error: ${msg}`);
    } finally {
      stopSimulatedLogs();
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result?.midi) return;
    const binary = atob(result.midi);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: 'audio/midi' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${result.filename?.replace(/\.[^.]+$/, '') || 'bass'}_extracted.mid`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  };

  const handleReset = () => {
    stopSimulatedLogs();
    setFile(null);
    setResult(null);
    setError(null);
    setLogs([]);
    setIsProcessing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (e) => {
    e.stopPropagation();
    handleReset();
  };

  return (
    <div className="min-h-screen bg-neutral-950 font-sans text-neutral-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">

      {/* Background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-600/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="z-10 w-full max-w-2xl bg-neutral-900/60 backdrop-blur-2xl border border-neutral-800 rounded-3xl p-8 md:p-12 shadow-2xl">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-2xl mb-6 shadow-lg shadow-indigo-500/20">
            <Music className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
            Bass Trap
          </h1>
          <p className="text-neutral-400 text-base">
            Upload your track · Isolate the bass · Export to MIDI
          </p>
        </div>

        {/* Drop Zone */}
        {!result && (
          <div
            onClick={() => !isProcessing && fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ${
              isProcessing
                ? 'cursor-not-allowed opacity-60 border-neutral-700'
                : isDragging
                ? 'border-indigo-400 bg-indigo-500/10 cursor-copy'
                : file
                ? 'border-emerald-500/50 bg-emerald-500/5 cursor-pointer'
                : 'border-neutral-700 hover:border-neutral-500 hover:bg-neutral-800/40 cursor-pointer'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_EXTS.join(',')}
              onChange={handleFileChange}
              className="hidden"
              disabled={isProcessing}
            />

            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileAudio className="w-6 h-6 text-emerald-400 shrink-0" />
                <div className="text-left">
                  <p className="font-semibold text-emerald-300 truncate max-w-xs">{file.name}</p>
                  <p className="text-neutral-500 text-sm">{formatBytes(file.size)}</p>
                </div>
                {!isProcessing && (
                  <button
                    onClick={removeFile}
                    className="ml-auto text-neutral-500 hover:text-neutral-200 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <div>
                <UploadCloud className={`w-10 h-10 mx-auto mb-3 transition-colors ${isDragging ? 'text-indigo-400' : 'text-neutral-600'}`} />
                <p className="text-neutral-400 font-medium">
                  {isDragging ? 'Drop it!' : 'Drag & drop or click to upload'}
                </p>
                <p className="text-neutral-600 text-sm mt-1">
                  MP3, WAV, FLAC, OGG · Max {MAX_SIZE_MB}MB
                </p>
              </div>
            )}
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="mt-4 flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Process button */}
        {!result && (
          <button
            onClick={handleProcess}
            disabled={!file || isProcessing}
            className={`mt-4 w-full flex items-center justify-center gap-2 font-bold py-4 rounded-2xl transition-all duration-200 text-base ${
              !file || isProcessing
                ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white shadow-lg shadow-indigo-500/20 cursor-pointer'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing... (may take 1–2 min)
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                Extract Bass to MIDI
              </>
            )}
          </button>
        )}

        {/* Log Panel: shows while processing or after if there are logs */}
        {logs.length > 0 && <LogPanel logs={logs} />}

        {/* Result */}
        {result && (
          <ResultCard
            result={result}
            onDownload={handleDownload}
            onReset={handleReset}
          />
        )}
      </div>
    </div>
  );
}
