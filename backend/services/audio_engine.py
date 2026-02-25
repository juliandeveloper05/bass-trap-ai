# backend/services/audio_engine.py
import os
import glob
import subprocess
import shutil
import base64
import uuid
from typing import Callable, Optional
import librosa
import numpy as np
from basic_pitch.inference import predict_and_save

DEMUCS_MODEL = "mdx_extra_q"


class BassExtractor:
    def __init__(self, file_path: str):
        self.file_path = os.path.abspath(file_path)
        self.session_id = uuid.uuid4().hex
        self.demucs_out_dir = os.path.abspath(f"temp/demucs_{self.session_id}")
        self.bpm: int | None = None
        self.bass_path: str | None = None
        self.midi_data_b64: str | None = None

    def extract_bpm(self) -> None:
        print("[BassExtractor] Extracting BPM with librosa...")
        y, sr = librosa.load(self.file_path, sr=None, mono=True)
        tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
        raw = float(tempo[0]) if isinstance(tempo, np.ndarray) else float(tempo)
        self.bpm = round(raw)
        print(f"[BassExtractor] Detected BPM: {self.bpm}")

    def isolate_bass(self) -> None:
        print(f"[BassExtractor] Isolating bass with Demucs ({DEMUCS_MODEL})...")
        os.makedirs(self.demucs_out_dir, exist_ok=True)

        name_no_ext = os.path.splitext(os.path.basename(self.file_path))[0]

        result = subprocess.run(
            [
                "demucs",
                "-n", DEMUCS_MODEL,
                "--two-stems", "bass",
                "-o", self.demucs_out_dir,
                self.file_path,
            ],
            capture_output=True,
            text=True,
        )

        if result.returncode != 0:
            raise RuntimeError(
                f"Demucs failed:\nSTDOUT: {result.stdout}\nSTDERR: {result.stderr}"
            )

        # mdx_extra_q output path is: {out_dir}/{model}/{track_name}/bass.wav
        self.bass_path = os.path.join(
            self.demucs_out_dir, DEMUCS_MODEL, name_no_ext, "bass.wav"
        )

        if not os.path.exists(self.bass_path):
            raise FileNotFoundError(
                f"Expected bass stem not found at: {self.bass_path}"
            )

        print(f"[BassExtractor] Bass isolated at: {self.bass_path}")

    def convert_to_midi(self) -> None:
        print("[BassExtractor] Converting bass to MIDI with Basic Pitch...")
        midi_out_dir = os.path.dirname(self.bass_path)

        predict_and_save(
            audio_path_list=[self.bass_path],
            output_directory=midi_out_dir,
            save_midi=True,
            sonify_midi=False,
            save_model_outputs=False,
            save_notes=False,
        )

        bass_stem_name = os.path.splitext(os.path.basename(self.bass_path))[0]
        midi_path = os.path.join(midi_out_dir, f"{bass_stem_name}_basic_pitch.mid")

        # Fallback: glob for any .mid file if exact name doesn't match
        if not os.path.exists(midi_path):
            # Basic Pitch varies output naming across versions — glob fallback
            mid_files = glob.glob(os.path.join(midi_out_dir, "*.mid"))
            if mid_files:
                midi_path = mid_files[0]
                print(f"[BassExtractor] Fallback MIDI found: {midi_path}")
            else:
                raise FileNotFoundError(f"No MIDI file found in: {midi_out_dir}")

        with open(midi_path, "rb") as f:
            self.midi_data_b64 = base64.b64encode(f.read()).decode("utf-8")

        print("[BassExtractor] MIDI conversion complete.")

    def cleanup(self) -> None:
        print("[BassExtractor] Running cleanup...")
        if self.file_path and os.path.exists(self.file_path):
            try:
                os.remove(self.file_path)
            except OSError as e:
                print(f"[BassExtractor] Warning: could not remove input file: {e}")

        if os.path.exists(self.demucs_out_dir):
            shutil.rmtree(self.demucs_out_dir, ignore_errors=True)

        print("[BassExtractor] Cleanup done.")

    def process_pipeline(
        self,
        progress_callback: Optional[Callable[[int, str], None]] = None,
    ) -> tuple[int, str]:
        def _emit(progress: int, message: str) -> None:
            if progress_callback:
                progress_callback(progress, message)

        try:
            _emit(10, "📊 Detecting BPM with Librosa...")
            self.extract_bpm()

            _emit(30, "🤖 Isolating bass with Demucs...")
            self.isolate_bass()

            _emit(85, "🎹 Converting to MIDI with Basic Pitch...")
            self.convert_to_midi()

            _emit(100, "✅ Done. Encoding output...")
            return self.bpm, self.midi_data_b64
        except Exception:
            raise
