# 🎸 Bass Trap: El Mapa del Tesoro

> Sube tu track. Aisla el bajo. Conviértelo a MIDI.

Bass Trap es una herramienta basada en Inteligencia Artificial diseñada para extraer el bajo de un archivo de audio (.mp3 o .wav) y transformarlo automáticamente a secuencias MIDI.

## 🏗️ Stack Tecnológico

El proyecto está construido como un monorepo dividiendo claramente las responsabilidades:

- **Frontend (Cliente)**: React + Vite, estilizado con Tailwind CSS v4 y componentes visuales de Lucide React.
- **Backend (API)**: FastAPI en Python.
- **Audio Machine Learning**:
  - `librosa`: Detección analítica de BPM.
  - `demucs`: Aislamiento asíncrono e inteligente de stems (específicamente `--two-stems bass`).
  - `basic-pitch`: Inferencia y conversión de ondas acústicas (audio) a notas e impulsos (MIDI).

## 🚀 Instalación y Uso

### 1. Iniciar el Backend
El backend utiliza modelos de procesamiento pesados. Asegúrate de tener instalado `ffmpeg` en tu sistema.

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### 2. Iniciar el Frontend
En una terminal separada, arranca la UI dinámica:

```bash
cd frontend
npm install
npm run dev
```

### 3. ¡A Disfrutar!
Entra a `http://localhost:5173/`, sube tu pista y deja que la IA haga su magia. 🪄
