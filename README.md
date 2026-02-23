# 🎸 Bass Trap AI

![Bass Trap](https://img.shields.io/badge/Bass_Trap-v1.1.0-indigo?style=flat-square) ![React](https://img.shields.io/badge/React_19-Vite-61DAFB?style=flat-square&logo=react) ![FastAPI](https://img.shields.io/badge/FastAPI-Python_3.11-009688?style=flat-square&logo=fastapi) ![PyTorch](https://img.shields.io/badge/PyTorch-2.1-EE4C2C?style=flat-square&logo=pytorch) ![TensorFlow](https://img.shields.io/badge/TensorFlow-2.15-FF6F00?style=flat-square&logo=tensorflow) ![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?style=flat-square&logo=docker) ![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

> **AI-powered bass extraction tool.** Upload your track · Isolate the bass · Export to MIDI.

Bass Trap is a full-stack AI application that extracts the bass line from any audio file using **two neural networks** (Meta AI's Demucs + Spotify's Basic Pitch) and converts it into a playable MIDI sequence — ready to drop into your DAW.

🔗 **Live Demo:** [bass-trap-ai-dumu.vercel.app](https://bass-trap-ai-dumu.vercel.app)

---

## 🧠 AI & Machine Learning

| Model | Created by | Architecture | Purpose |
|---|---|---|---|
| **Demucs v4** (`mdx_extra_q`) | Meta AI / Facebook Research | U-Net + Transformer | Source Separation — isolates bass from full mix |
| **Basic Pitch** | Spotify Research | Convolutional Neural Network (CNN) | Audio-to-MIDI — detects pitch, onset & notes |

Both models run inference on **CPU** using PyTorch and TensorFlow respectively.

### How the AI Pipeline Works

```
Audio File (MP3/WAV/FLAC/OGG)
        │
        ▼
[1] BPM Detection      — Librosa beat_track() · Signal processing
        │
        ▼
[2] Bass Isolation      — Demucs mdx_extra_q · Deep neural network inference
        │
        ▼
[3] MIDI Conversion     — Basic Pitch predict_and_save() · CNN inference
        │
        ▼
[4] Base64 Encode       — MIDI bytes → JSON response → client download
        │
        ▼
[5] Cleanup             — /temp wiped regardless of success or failure
```

---

## 🎯 Features

### 🎵 Audio Processing
- **BPM Detection** with Librosa — analytical tempo extraction via DSP
- **Bass Stem Isolation** via Demucs (`mdx_extra_q` model) — neural network source separation
- **Audio → MIDI Conversion** powered by Spotify's Basic Pitch — CNN-based pitch detection
- Supports **MP3, WAV, FLAC, OGG** · Max 100MB

### 🖥️ Frontend
- Drag & drop file upload with visual feedback
- Real-time processing log with simulated step-by-step output
- Inline error handling — no alerts, no crashes
- Detected BPM displayed on result card
- One-click MIDI download with auto-generated filename
- Dark mode UI with glassmorphism design

### 🔒 Backend Architecture
- **Service Pattern** — isolated `BassExtractor` class handles all pipeline logic
- **Non-blocking processing** — `asyncio.to_thread()` keeps event loop responsive
- **Bulletproof cleanup** — `try/finally` guarantees `/temp` is wiped on success or failure
- **UUID-based file paths** — anti path traversal, no race conditions
- **Base64 MIDI transfer** — files returned encoded in JSON, never served as static assets

---

## 🛠️ Tech Stack

### Backend (Python)
| Technology | Version | Purpose |
|---|---|---|
| FastAPI | 0.111.0 | Async REST API framework with OpenAPI docs |
| Uvicorn | 0.29.0 | High-performance ASGI server |
| PyTorch | 2.1.2 (CPU) | ML inference engine for Demucs |
| TensorFlow | 2.15 | ML inference engine for Basic Pitch |
| Demucs | 4.0.1 | Neural network source separation (Meta AI) |
| Basic Pitch | 0.3.3 | Neural network audio-to-MIDI (Spotify) |
| Librosa | 0.10.2 | Audio analysis & BPM detection |
| NumPy | <2.0 | Numerical operations on audio arrays |
| SoundFile | 0.12.1 | Audio file I/O (WAV/FLAC) |

### Frontend (JavaScript)
| Technology | Purpose |
|---|---|
| React 19 | Reactive UI with functional components & hooks |
| Vite | Ultra-fast bundler (<20s builds) |
| Tailwind CSS | Utility-first styling with dark mode |
| Lucide React | SVG icon library |

### DevOps & Infrastructure
| Technology | Purpose |
|---|---|
| Docker | Containerized backend with layer-optimized builds |
| Hugging Face Spaces | Backend hosting (16GB RAM, free CPU tier) |
| Vercel | Frontend hosting (CDN, auto-deploy on push) |
| Git | Multi-remote version control (GitHub + HF) |
| ffmpeg | System-level audio codec support |

---

## 📁 Project Structure

```
bass-trap-ai/
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Main UI — upload, logs, result, download
│   │   ├── index.css            # Tailwind + custom styles
│   │   └── main.jsx             # React entry point
│   ├── vercel.json              # SPA rewrites for React Router
│   └── vite.config.js           # Dev proxy + build config
├── backend/
│   ├── main.py                  # FastAPI app + CORS middleware
│   ├── api/
│   │   └── routes.py            # POST /api/process endpoint
│   ├── services/
│   │   └── audio_engine.py      # BassExtractor class — full AI pipeline
│   └── requirements.txt         # Pinned Python dependencies
├── Dockerfile                   # Production container (Python 3.11 + CPU torch)
├── hf-space/                    # Hugging Face Spaces deployment
│   ├── Dockerfile               # HF-adapted (non-root user, port 7860)
│   ├── README.md                # HF Space metadata (YAML frontmatter)
│   └── backend/                 # Backend code copy for HF
└── README.md
```

---

## 🚀 Deployment

### Production (Current)
| Service | Platform | URL |
|---|---|---|
| Frontend | Vercel | [bass-trap-ai-dumu.vercel.app](https://bass-trap-ai-dumu.vercel.app) |
| Backend | Hugging Face Spaces | [julian4deep-bass-trap-ai.hf.space](https://julian4deep-bass-trap-ai.hf.space) |

### Local Development

#### Prerequisites
- **Node.js 18+**
- **Python 3.11+**
- **ffmpeg** installed on your system

```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg

# Windows
winget install ffmpeg
```

#### 1. Start the Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

API at `http://localhost:8000` · Docs at `http://localhost:8000/docs`

#### 2. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

UI at `http://localhost:5173`

#### 3. Docker (Production-like)

```bash
docker build -t bass-trap .
docker run -p 7860:7860 bass-trap
```

---

## 🗺️ Roadmap

### Phase 1 — Core AI Pipeline ✅ v1.0.0
- [x] Audio upload with type and size validation
- [x] BPM detection via Librosa (DSP)
- [x] Bass stem isolation via Demucs neural network
- [x] Audio-to-MIDI conversion via Basic Pitch CNN
- [x] Base64 MIDI response + one-click download
- [x] Real-time processing log UI

### Phase 1.1 — Production Deployment ✅ v1.1.0
- [x] Dockerized backend with CPU-only PyTorch
- [x] Deployed to Hugging Face Spaces (16GB RAM)
- [x] Frontend deployed to Vercel (CDN)
- [x] Non-blocking async processing (`asyncio.to_thread`)
- [x] Non-root container security

### Phase 2 — Enhanced Processing 📅 v1.2.0
- [ ] Progress streaming via Server-Sent Events (SSE)
- [ ] MIDI preview player in the browser
- [ ] Waveform visualization of isolated bass stem
- [ ] Adjustable Basic Pitch parameters (onset, frame, min note length)

### Phase 3 — Advanced AI Features 📅 v2.0.0
- [ ] Multiple stem export (drums, vocals, other)
- [ ] Key detection and chord suggestions
- [ ] MIDI quantization and cleanup post-processing
- [ ] Batch file processing

---

## 👨‍💻 Author

**Julian Soto**
Full-Stack Developer · AI & Audio Processing
Specialized in Python, TypeScript, React, Machine Learning & Cloud Deployment

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Julian_Soto-0A66C2?style=flat-square&logo=linkedin)](https://linkedin.com/in/juliansoto)
[![GitHub](https://img.shields.io/badge/GitHub-juliandeveloper05-181717?style=flat-square&logo=github)](https://github.com/juliandeveloper05)

📧 **Email:** juliansoto.dev@gmail.com

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

**Bass Trap AI v1.1.0** — Made with ❤️ and 🧠 by Julian Javier Soto