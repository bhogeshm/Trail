import sys, soundfile as sf, numpy as np
from kokoro_onnx import Kokoro
d, out = sys.argv[1], sys.argv[2]
k = Kokoro(f"{d}/kokoro-v1.0.onnx", f"{d}/voices-v1.0.bin")
V = "hm_omega"
lines = [("Every creation starts with an idea.", False), ("I give ideas motion.", False),
         ("From design... to motion.", False), ("From pixels... to worlds.", False),
         ("And AI opened another canvas.", False), ("I'm not limited to one medium.", False),
         ("Seen by thousands. Built frame by frame.", False),
         ("aɪm bˈoʊɡeɪʃ mˈoʊləɡəvˌʌli.", True), ("The tools change. The story doesn't.", False)]
for i, (t, ph) in enumerate(lines):
    s, sr = k.create(t, voice=V, speed=0.86, lang="en-us", is_phonemes=ph) if ph else k.create(t, voice=V, speed=0.86, lang="en-us")
    s = np.asarray(s, dtype=np.float32)
    nz = np.where(np.abs(s) > 0.01)[0]; s = s[max(0, nz[0]-240): nz[-1]+2400]  # trim silence
    sf.write(f"{out}/vo{i}.wav", s, sr); print(f"vo{i}", round(len(s)/sr, 2), sr)
