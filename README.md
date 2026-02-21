# 🎸 Bass Trap v1.0.0
![Bass Trap](https://img.shields.io/badge/Bass_Trap-v1.0.0-indigo?style=flat-square) ![React](https://img.shields.io/badge/React-Vite-61DAFB?style=flat-square&logo=react) ![FastAPI](https://img.shields.io/badge/FastAPI-Python_3.10+-009688?style=flat-square&logo=fastapi) ![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

> **AI-powered bass extraction tool.** Upload your track · Isolate the bass · Export to MIDI.

Bass Trap is a full-stack AI application that extracts the bass line from any audio file and automatically converts it into a playable MIDI sequence — ready to drop into your DAW.

---

## 🎯 Features

### 🎵 Audio Processing
- **BPM Detection** with Librosa — analytical tempo extraction
- **Bass Stem Isolation** via Demucs (`htdemucs` model, `--two-stems bass`)
- **Audio → MIDI Conversion** powered by Spotify's Basic Pitch
- Supports **MP3, WAV, FLAC, OGG** · Max 100MB

### 🖥️ Frontend UI
- Drag & drop file upload with visual feedback
- Real-time processing log with simulated step-by-step output
- Inline error handling — no alerts, no crashes
- Detected BPM displayed on result card
- One-click MIDI download with auto-generated filename

### 🔒 Backend Architecture
- **Service Pattern** — isolated `BassExtractor` class handles all pipeline logic
- **Bulletproof cleanup** — `try/finally` guarantees `/temp` is wiped on success or failure
- **UUID-based file paths** — no path traversal, no race conditions between requests
- **Base64 MIDI transfer** — files returned encoded in JSON, never served as static assets

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React + Vite, Tailwind CSS, Lucide React |
| **Backend** | FastAPI (Python 3.10+) |
| **BPM Detection** | Librosa |
| **Bass Isolation** | Demucs (`htdemucs`) |
| **MIDI Conversion** | Basic Pitch (Spotify) |
| **Audio** | ffmpeg (system dependency) |

---

## 📁 Project Structure

```
bass-trap/
├── frontend/
│   └── src/
│       ├── App.jsx           # Main UI — upload, logs, result, download
│       └── main.jsx
├── backend/
│   ├── main.py               # FastAPI app entry point + CORS
│   ├── api/
│   │   └── routes.py         # POST /process endpoint
│   ├── services/
│   │   └── audio_engine.py   # BassExtractor class — full pipeline
│   ├── temp/                 # Auto-created, auto-cleaned working directory
│   └── requirements.txt
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+**
- **Python 3.10+**
- **ffmpeg** installed on your system

```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg

# Windows
winget install ffmpeg
```

### 1. Start the Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

API will be available at `http://localhost:8000`

### 2. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

UI will be available at `http://localhost:5173`

### 3. Process Your Track
Upload an audio file, wait for the AI pipeline to run (1–2 min), then download your `.mid` file. 🪄

---

## ⚙️ How It Works

```
Audio File (MP3/WAV/FLAC/OGG)
        │
        ▼
[1] BPM Detection      — librosa.beat.beat_track()
        │
        ▼
[2] Bass Isolation     — Demucs htdemucs --two-stems bass → bass.wav
        │
        ▼
[3] MIDI Conversion    — Basic Pitch predict_and_save() → bass_basic_pitch.mid
        │
        ▼
[4] Base64 Encode      — MIDI bytes → JSON response → client download
        │
        ▼
[5] Cleanup            — /temp wiped regardless of success or failure
```

---

## 🗺️ Roadmap

### Phase 1 — Core Pipeline ✅ v1.0.0
- [x] Audio upload with type and size validation
- [x] BPM detection via Librosa
- [x] Bass stem isolation via Demucs
- [x] Audio-to-MIDI conversion via Basic Pitch
- [x] Base64 MIDI response + one-click download
- [x] Bulletproof temp file cleanup
- [x] Real-time processing log UI
- [x] Drag & drop upload interface

### Phase 2 — Enhanced Processing 📅 v1.1.0
- [ ] Progress streaming via Server-Sent Events (SSE)
- [ ] Pitch detection confidence threshold controls
- [ ] MIDI preview player in the browser
- [ ] Waveform visualization of the isolated bass stem

### Phase 3 — Advanced Features 📅 v1.2.0
- [ ] Batch file processing
- [ ] Adjustable Basic Pitch parameters (onset, frame, min note length)
- [ ] Download isolated bass WAV alongside MIDI
- [ ] Session history with re-download support

### Phase 4 — AI Enhancements 📅 v2.0.0
- [ ] Multiple stem export (drums, vocals, other)
- [ ] Key detection and chord suggestions
- [ ] MIDI quantization and cleanup post-processing
- [ ] DAW-ready MIDI packaging (tempo map embedded)

---

## 👨‍💻 Author

**Julian Soto**
Senior Software Engineer
Specialized in TypeScript, Modern Web Architecture & Legacy Systems Modernization

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Julian_Soto-0A66C2?style=flat-square&logo=linkedin)](https://linkedin.com/in/juliansoto)
[![GitHub](https://img.shields.io/badge/GitHub-juliandeveloper05-181717?style=flat-square&logo=github)](https://github.com/juliandeveloper05)

📧 **Email:** juliansoto.dev@gmail.com
📱 **Phone:** +54 9 11 3066-6369

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2026 Julian Javier Soto

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

**Bass Trap v1.0.0** — Made with ❤️ by Julian Javier Soto