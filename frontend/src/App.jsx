import React, { useState } from 'react';
import { UploadCloud, Music, Activity, Download, Loader2, Sparkles } from 'lucide-react';

export default function App() {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsProcessing(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8000/process", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) throw new Error("Processing failed");
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error(error);
      alert("Error processing file. Backend might not be running.");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadMidi = () => {
    if (!result?.midi) return;
    
    const byteCharacters = atob(result.midi);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const fileBlob = new Blob([byteArray], { type: 'audio/midi' });
    
    const element = document.createElement('a');
    element.href = URL.createObjectURL(fileBlob);
    element.download = "bass_extracted.mid";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen bg-neutral-950 font-sans text-neutral-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-600/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="z-10 w-full max-w-2xl bg-neutral-900/60 backdrop-blur-2xl border border-neutral-800 rounded-3xl p-8 md:p-12 shadow-2xl relative">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-2xl mb-6 shadow-lg shadow-indigo-500/20">
            <Music className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
            Bass Trap
          </h1>
          <p className="text-neutral-400 text-lg">
            Sube tu track. Aisla el bajo. Conviértelo a MIDI.
          </p>
        </div>

        <div className="space-y-8">
          
          {/* Upload Area */}
          <div className="relative group">
            <input 
              type="file" 
              accept="audio/mp3, audio/wav" 
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
            />
            <div className={`
              border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300
              ${file ? 'border-indigo-500 bg-indigo-500/5' : 'border-neutral-700 hover:border-indigo-500/50 hover:bg-neutral-800/50 bg-neutral-900'}
            `}>
              <UploadCloud className={`w-12 h-12 mx-auto mb-4 ${file ? 'text-indigo-400' : 'text-neutral-500 group-hover:text-indigo-400 transition-colors'}`} />
              {file ? (
                <div className="text-indigo-300 font-medium">{file.name}</div>
              ) : (
                <div>
                  <span className="text-indigo-400 font-semibold cursor-pointer">Arrastra tu archivo</span> o haz clic para subir
                  <div className="text-sm text-neutral-500 mt-2">MP3 o WAV (Max 50MB)</div>
                </div>
              )}
            </div>
          </div>

          {/* Process Button */}
          <button 
            onClick={handleUpload}
            disabled={!file || isProcessing}
            className={`
              w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300
              ${!file || isProcessing 
                ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed' 
                : 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-1'}
            `}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Procesando con IA...
              </>
            ) : (
              <>
                <Sparkles className="w-6 h-6" />
                Extraer Bajo a MIDI
              </>
            )}
          </button>

          {/* Results Area */}
          {result && (
            <div className="mt-8 p-6 bg-neutral-800/50 rounded-2xl border border-neutral-700/50 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                Análisis Completado
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-fr">
                <div className="bg-neutral-900/80 p-5 rounded-xl border border-neutral-800 flex items-center justify-between">
                  <div className="text-neutral-400">BPM Extracto</div>
                  <div className="text-2xl font-black text-cyan-400">{result.bpm || "120"}</div>
                </div>
                
                <button 
                  onClick={downloadMidi}
                  className="bg-neutral-900/80 hover:bg-neutral-800 p-5 rounded-xl border border-neutral-800 flex items-center justify-between group transition-colors cursor-pointer"
                >
                  <div className="text-neutral-400 group-hover:text-neutral-300">Descargar MIDI</div>
                  <div className="bg-neutral-800 group-hover:bg-neutral-700 p-3 rounded-lg transition-colors">
                    <Download className="w-6 h-6 text-white group-hover:-translate-y-1 group-hover:scale-110 transition-all" />
                  </div>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
