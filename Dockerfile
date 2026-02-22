FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    ffmpeg \
    git \
    libsndfile1 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/requirements.txt .

# ⚡ CRÍTICO: instalar torch CPU-only PRIMERO
# Esto previene que pip baje 4GB de CUDA wheels
RUN pip install --no-cache-dir \
    torch==2.2.2+cpu \
    torchaudio==2.2.2+cpu \
    --index-url https://download.pytorch.org/whl/cpu

# Ahora instalar el resto (demucs va a reusar el torch ya instalado)
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

RUN mkdir -p temp

EXPOSE 8080

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080", "--timeout-keep-alive", "300"]
