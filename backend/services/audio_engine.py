import os
import subprocess
import shutil
import base64
import librosa
import numpy as np
from basic_pitch.inference import predict_and_save

class BassExtractor:
    def __init__(self, file_path: str):
        self.file_path = file_path
        self.bpm = None
        self.bass_path = None
        self.midi_data_b64 = None

    def extract_bpm(self):
        print("Extracting BPM with librosa...")
        y, sr = librosa.load(self.file_path, sr=None)
        tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
        
        if isinstance(tempo, np.ndarray):
            self.bpm = round(float(tempo[0]))
        else:
            self.bpm = round(float(tempo))
            
        print(f"Detected BPM: {self.bpm}")

    def isolate_bass(self):
        print("Isolating bass using Demucs...")
        filename = os.path.basename(self.file_path)
        name_no_ext = os.path.splitext(filename)[0]
        out_dir = "temp/demucs_out"
        
        subprocess.run([
            "demucs",
            "-n", "htdemucs",
            "--two-stems", "bass",
            "-o", out_dir,
            self.file_path
        ], check=True)

        self.bass_path = os.path.join(out_dir, "htdemucs", name_no_ext, "bass.wav")
        print(f"Bass isolated at: {self.bass_path}")

    def convert_to_midi(self):
        print("Converting bass audio to MIDI with basic-pitch...")
        out_dir = os.path.dirname(self.bass_path)
        
        predict_and_save(
            audio_path_list=[self.bass_path],
            output_directory=out_dir,
            save_midi=True,
            sonify_midi=False,
            save_model_outputs=False,
            save_notes=False
        )
        
        bass_filename_no_ext = os.path.splitext(os.path.basename(self.bass_path))[0]
        midi_filepath = os.path.join(out_dir, f"{bass_filename_no_ext}_basic_pitch.mid")
        
        with open(midi_filepath, "rb") as f:
            midi_bytes = f.read()
            
        self.midi_data_b64 = base64.b64encode(midi_bytes).decode('utf-8')
        print("MIDI conversion completed.")

    def cleanup(self):
        print("Cleaning up temporary files...")
        if os.path.exists(self.file_path):
            os.remove(self.file_path)
            
        out_dir = "temp/demucs_out"
        if os.path.exists(out_dir):
            shutil.rmtree(out_dir, ignore_errors=True)
        
    def process_pipeline(self):
        self.extract_bpm()
        self.isolate_bass()
        self.convert_to_midi()
        return self.bpm, self.midi_data_b64
