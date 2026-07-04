from pathlib import Path
import base64
import math
import struct

root = Path('assets')
(root / 'audio').mkdir(parents=True, exist_ok=True)

png_bytes = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAIAAeIhvAAAAAElFTkSuQmCC')
(root / 'hymn_173_p1.png').write_bytes(png_bytes)

sample_rate = 22050
freq = 440.0
duration = 0.35
frames = int(sample_rate * duration)
samples = bytearray()
for i in range(frames):
    x = int(127 + 80 * math.sin(2 * math.pi * freq * i / sample_rate))
    samples.append(max(0, min(255, x)))

wav = bytearray()
wav.extend(b'RIFF')
wav.extend(struct.pack('<I', 36 + len(samples)))
wav.extend(b'WAVE')
wav.extend(b'fmt ')
wav.extend(struct.pack('<IHHIIHH', 16, 1, 1, sample_rate, sample_rate, 1, 8))
wav.extend(b'data')
wav.extend(struct.pack('<I', len(samples)))
wav.extend(samples)
(root / 'audio' / 'hymn_173.wav').write_bytes(wav)

print('created', root / 'hymn_173_p1.png')
print('created', root / 'audio' / 'hymn_173.wav')
