# 🎵 Dumu — AI Bass Extraction

![Dumu](https://img.shields.io/badge/Dumu-v1.2.0-a3e635?style=flat-square) ![React](https://img.shields.io/badge/React_18-Vite_4-61DAFB?style=flat-square&logo=react) ![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi) ![PyTorch](https://img.shields.io/badge/PyTorch-2.1_CPU-EE4C2C?style=flat-square&logo=pytorch) ![TensorFlow](https://img.shields.io/badge/TensorFlow-2.15-FF6F00?style=flat-square&logo=tensorflow) ![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?style=flat-square&logo=docker) ![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

> **Upload your track · Isolate the bass with AI · Export to MIDI.**

Dumu is a full-stack AI application that extracts the bass line from any audio file using **two neural networks** — Meta AI's **Demucs** for source separation and Spotify's **Basic Pitch** for audio-to-MIDI conversion — and delivers a playable MIDI file ready for your DAW.

🔗 **Live:** [dumu.vercel.app](https://dumu.vercel.app)  
🔗 **Backend API:** [julian4deep-bass-trap-ai.hf.space](https://julian4deep-bass-trap-ai.hf.space)

---

## ✨ What's New in v1.2.0

- ✅ **Animated progress bar** with percentage and stage descriptions
- ✅ **Info notification** on page load — warns users about CPU processing time
- ✅ **Full professional footer** with GitHub, LinkedIn, Instagram, Portfolio, email & phone
- ✅ **404 page** with glitch design for invalid routes
- ✅ **Fixed Basic Pitch 0.3.x** compatibility (`model_or_model_path`)
- ✅ **Fixed `diffq` dependency** in Docker — required by Demucs `mdx_extra_q`
- ✅ **Proper env var alignment** — `VITE_API_URL` consistent across frontend and Vercel
- ✅ **Increased server timeout** to 300s for large audio files on CPU

---

## 🧠 AI & Machine Learning

| Model | Created by | Architecture | Purpose |
|---|---|---|---|
| **Demucs v4** (`mdx_extra_q`) | Meta AI / Facebook Research | U-Net + Transformer | Source Separation — isolates bass from full mix |
| **Basic Pitch** | Spotify Research | CNN (Convolutional Neural Network) | Audio-to-MIDI — detects pitch, onset & notes |

Both models run inference on **CPU** using PyTorch and TensorFlow respectively. Processing a full-length WAV can take 3–7 minutes on CPU.

### Pipeline Architecture

```
Audio File (MP3/WAV/FLAC/OGG)
        │
        ▼
[1] BPM Detection      — Librosa beat_track() · DSP analysis
        │
        ▼
[2] Bass Isolation      — Demucs mdx_extra_q · Neural network inference (~3-5 min)
        │
        ▼
[3] MIDI Conversion     — Basic Pitch predict_and_save() · CNN inference
        │
        ▼
[4] Base64 Encode       — MIDI bytes → JSON response → browser download
        │
        ▼
[5] Cleanup             — /temp directory wiped regardless of outcome
```

---

## 🎯 Features

### 🎵 Audio Processing
- **BPM Detection** — Librosa beat_track() for tempo extraction
- **Bass Stem Isolation** — Demucs `mdx_extra_q` neural network source separation
- **Audio → MIDI** — Spotify's Basic Pitch CNN with ICASSP 2022 model
- Supports **MP3, WAV, FLAC, OGG** · Max 100MB

### 🖥️ Frontend
- **Drag & drop** file upload with visual hover feedback
- **Animated progress bar** (0–100%) with pipeline stage descriptions
- **Real-time processing log** with timestamped steps
- **Info notification on load** — warns about CPU processing time
- **Pipeline step indicator** — Upload → Process → Download
- **Result card** with detected BPM and one-click MIDI download
- **404 page** with glitch design for invalid routes
- **Responsive footer** with GitHub, LinkedIn, Instagram, Portfolio, email & phone
- Dark theme with acid-green accent color system

### 🔒 Backend Architecture
- **Service Pattern** — isolated `BassExtractor` class handles the full pipeline
- **Non-blocking** — `asyncio.to_thread()` keeps FastAPI responsive
- **Bulletproof cleanup** — `try/finally` guarantees temp files are always removed
- **UUID-based paths** — prevents path traversal and race conditions
- **Base64 transfer** — MIDI returned encoded in JSON, never as static files
- **CORS configured** — Vercel origin whitelisted

---

## 🛠️ Tech Stack

### Backend (Python)
| Technology | Version | Purpose |
|---|---|---|
| FastAPI | 0.111.0 | Async REST API with OpenAPI docs |
| Uvicorn | 0.29.0 | ASGI server |
| PyTorch | 2.1.2 (CPU) | ML engine for Demucs |
| TensorFlow | 2.15 | ML engine for Basic Pitch |
| Demucs | 4.0.1 | Neural source separation (Meta AI) |
| diffq | 0.2.4 | Quantization support for Demucs |
| Basic Pitch | 0.3.3 | Audio-to-MIDI conversion (Spotify) |
| Librosa | 0.10.2 | Audio analysis & BPM detection |
| NumPy | <2.0 | Numerical operations |
| SoundFile | 0.12.1 | Audio file I/O |

### Frontend (JavaScript)
| Technology | Purpose |
|---|---|
| React 18 | Reactive UI with hooks |
| Vite 4 | Fast dev server & bundler |
| Tailwind CSS 3 | Utility-first styling |
| Lucide React | SVG icon library |
| PostCSS + Autoprefixer | CSS processing |

### DevOps & Infrastructure
| Technology | Purpose |
|---|---|
| Docker | Containerized backend (layer-optimized) |
| Hugging Face Spaces | Backend hosting (16GB RAM, CPU) |
| Vercel | Frontend CDN with auto-deploy |
| Git | Multi-remote (GitHub + HF) |
| ffmpeg | System audio codec support |

---

## 📁 Project Structure

```
dumu/
├── frontend/
│   ├── src/
│   │   ├── App.jsx               # Main UI — state machine + all views
│   │   ├── main.jsx              # React entry point
│   │   ├── index.css             # Tailwind base styles
│   │   ├── styles/
│   │   │   └── global.css        # Design tokens, animations, keyframes
│   │   ├── api/
│   │   │   └── bassApi.js        # Centralized fetch + error handling
│   │   ├── hooks/
│   │   │   └── useExtraction.js  # FSM hook: idle → processing → done/error
│   │   └── components/
│   │       ├── DropZone.jsx      # Drag & drop upload
│   │       ├── LogConsole.jsx    # Processing log with auto-scroll
│   │       ├── ResultCard.jsx    # BPM display + MIDI download
│   │       └── NotFound.jsx      # 404 page
│   ├── vercel.json               # SPA rewrites
│   ├── vite.config.js            # Dev proxy + build config
│   ├── tailwind.config.js        # Custom theme (acid colors, fonts)
│   └── postcss.config.js         # PostCSS + Autoprefixer
├── hf-space/
│   ├── Dockerfile                # HF Spaces Docker (non-root, port 7860)
│   ├── main.py                   # FastAPI app + CORS middleware
│   ├── audio_engine.py           # BassExtractor — full AI pipeline
│   ├── routes.py                 # POST /api/process endpoint
│   └── requirements.txt          # Pinned Python dependencies
├── backend/                      # Local dev backend (same code)
└── README.md
```

---

## 🚀 Deployment

### Production
| Service | Platform | URL |
|---|---|---|
| Frontend | Vercel | [dumu.vercel.app](https://dumu.vercel.app) |
| Backend | Hugging Face Spaces | [julian4deep-bass-trap-ai.hf.space](https://julian4deep-bass-trap-ai.hf.space) |

### Environment Variables

**Vercel (Frontend):**
| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://julian4deep-bass-trap-ai.hf.space` |

### Local Development

#### Prerequisites
- **Node.js 18+** · **Python 3.11+** · **ffmpeg**

```bash
# Install ffmpeg
# macOS: brew install ffmpeg
# Ubuntu: sudo apt install ffmpeg
# Windows: winget install ffmpeg
```

#### 1. Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
# API at http://localhost:8000 · Docs at http://localhost:8000/docs
```

#### 2. Frontend
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
# UI at http://localhost:5173
```

#### 3. Docker
```bash
docker build -t dumu .
docker run -p 7860:7860 dumu
```

---

## 🗺️ Roadmap

### Phase 1 — Core AI Pipeline ✅ v1.0.0
- [x] Audio upload with type & size validation
- [x] BPM detection via Librosa
- [x] Bass isolation via Demucs neural network
- [x] Audio-to-MIDI via Basic Pitch CNN
- [x] Base64 MIDI response + one-click download
- [x] Processing log UI

### Phase 1.1 — Production Deploy ✅ v1.1.0
- [x] Dockerized backend (CPU-only PyTorch)
- [x] Deployed to Hugging Face Spaces
- [x] Frontend on Vercel CDN
- [x] Non-blocking async processing
- [x] Non-root container security

### Phase 1.2 — UX & Stability ✅ v1.2.0
- [x] Animated progress bar (0–100%)
- [x] Info notification about CPU processing time
- [x] Professional footer with social links & contact
- [x] 404 page with glitch design
- [x] Fixed Basic Pitch 0.3.x API compatibility
- [x] Fixed diffq dependency for Demucs
- [x] Environment variable alignment
- [x] Increased server timeout to 300s

### Phase 2 — Enhanced Processing 📅 v1.3.0
- [ ] Real-time progress streaming via SSE
- [ ] MIDI preview player in the browser
- [ ] Waveform visualization of isolated bass
- [ ] Adjustable Basic Pitch parameters

### Phase 3 — Advanced AI Features 📅 v2.0.0
- [ ] Multiple stem export (drums, vocals, other)
- [ ] Key detection & chord suggestions
- [ ] MIDI quantization & cleanup
- [ ] Batch file processing

---

## ⚠️ Performance Notes

> Processing on **CPU takes 3–7+ minutes** for full-length tracks. This is expected behavior — Demucs runs a deep neural network on every audio frame. For faster results, use shorter audio clips (< 30s) or MP3 files instead of WAV.

---

## 👨‍💻 Author

**Julian Javier Soto**  
Senior Software Engineer · AI & Audio Processing  
Specialized in Python, TypeScript, React, Machine Learning & Cloud Deployment

[![GitHub](https://img.shields.io/badge/GitHub-juliandeveloper05-181717?style=flat-square&logo=github)](https://github.com/juliandeveloper05)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Julian_Soto-0A66C2?style=flat-square&logo=linkedin)](https://www.linkedin.com/in/full-stack-julian-soto/)
[![Portfolio](https://img.shields.io/badge/Portfolio-juliansoto-000?style=flat-square&logo=vercel)](https://juliansoto-portfolio.vercel.app/es)
[![Instagram](https://img.shields.io/badge/Instagram-palee__0x71-E4405F?style=flat-square&logo=instagram)](https://www.instagram.com/palee_0x71)

📧 **Email:** juliansoto.dev@gmail.com  
📱 **WhatsApp:** +54 9 11 3066-6369

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

**Dumu v1.2.0** — Made with ❤️ and 🧠 by Julian Javier Soto · © 2026