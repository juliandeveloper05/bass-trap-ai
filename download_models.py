"""
Script para descargar los modelos de Bass Trap y visualizarlos en Netron.
Ejecutar: python download_models.py
Después arrastrar los archivos generados a netron.app
"""
import os

print("=" * 50)
print("Bass Trap — Model Downloader para Netron")
print("=" * 50)

# --- Basic Pitch (Spotify) ---
print("\n[1/2] Descargando modelo de Basic Pitch (Spotify)...")
try:
    from basic_pitch import inference
    # Basic Pitch usa un modelo TF/ONNX internamente
    import basic_pitch
    model_path = os.path.dirname(basic_pitch.__file__)
    print(f"  ✅ Basic Pitch instalado en: {model_path}")
    
    # Buscar archivos del modelo
    for root, dirs, files in os.walk(model_path):
        for f in files:
            if f.endswith(('.onnx', '.pb', '.h5', '.tflite', '.savedmodel')):
                full = os.path.join(root, f)
                print(f"  📄 Modelo encontrado: {full}")
                print(f"     → Arrastrá este archivo a netron.app")
    
    # También exportar info del modelo
    print(f"\n  📂 Buscá archivos .onnx o .pb en: {model_path}")
    print(f"     Listando contenido:")
    for item in os.listdir(model_path):
        print(f"     - {item}")
except ImportError:
    print("  ⚠️ basic-pitch no está instalado. Instalalo con: pip install basic-pitch")

# --- Demucs (Meta AI) ---
print("\n[2/2] Descargando modelo de Demucs (Meta AI)...")
try:
    import torch
    from demucs.pretrained import get_model
    
    model = get_model("mdx_extra_q")
    
    # Guardar como .pt para Netron
    output_file = "demucs_mdx_extra_q.pt"
    torch.save(model.state_dict(), output_file)
    print(f"  ✅ Modelo guardado en: {os.path.abspath(output_file)}")
    print(f"     → Arrastrá este archivo a netron.app")
    
    # También mostrar la arquitectura en texto
    print(f"\n  📊 Arquitectura de Demucs mdx_extra_q:")
    print(f"     Parámetros totales: {sum(p.numel() for p in model.parameters()):,}")
    print(f"     Tipo: {type(model).__name__}")
    
except ImportError:
    print("  ⚠️ demucs no está instalado. Instalalo con: pip install demucs")

print("\n" + "=" * 50)
print("Listo! Abrí netron.app y arrastrá los archivos .pt/.onnx/.pb")
print("=" * 50)
