import numpy as np, wave
SR=44100; D=60.0; N=int(SR*D); t=np.arange(N)/SR
L=np.zeros(N); R=np.zeros(N)
def hz(m): return 440*2**((m-69)/12)
def pad(notes, s, e, amp=0.05):
    i0,i1=int(s*SR),int(min(e,D)*SR); tt=np.arange(i1-i0)/SR; n=len(tt)
    env=np.minimum(1,tt/2.2)*np.minimum(1,(n/SR-tt)/2.0)
    for k,m in enumerate(notes):
        f=hz(m); ph=k*1.3
        v=(np.sin(2*np.pi*f*tt+ph)+0.35*np.sin(2*np.pi*2*f*tt*1.001)+0.12*np.sin(2*np.pi*3*f*tt))
        v*= (0.8+0.2*np.sin(2*np.pi*0.15*tt+k))
        pan=0.5+0.35*np.sin(k*2.1)
        L[i0:i1]+=v*env*amp*(1-pan)*2/len(notes)*2; R[i0:i1]+=v*env*amp*pan*2/len(notes)*2
def bell(m, s, amp=0.06, dec=2.6, pan=0.5):
    i0=int(s*SR); n=min(int(5*SR),N-i0); tt=np.arange(n)/SR; f=hz(m)
    env=np.exp(-tt/dec)*np.minimum(1,tt/0.008)
    v=np.sin(2*np.pi*f*tt)+0.4*np.sin(2*np.pi*2.003*f*tt)*np.exp(-tt/0.8)+0.15*np.sin(2*np.pi*3.01*f*tt)*np.exp(-tt/0.4)
    L[i0:i0+n]+=v*env*amp*(1-pan)*2; R[i0:i0+n]+=v*env*amp*pan*2
def sub(m,s,dur,amp=0.08):
    i0=int(s*SR); n=min(int(dur*SR),N-i0); tt=np.arange(n)/SR
    env=np.minimum(1,tt/0.05)*np.exp(-tt/(dur/2.5))
    v=np.sin(2*np.pi*hz(m)*tt)*env*amp; L[i0:i0+n]+=v; R[i0:i0+n]+=v
def swell(s,dur=1.6,amp=0.035):
    i0=int((s-dur)*SR); n=int(dur*SR); tt=np.arange(n)/SR
    rng=np.random.default_rng(int(s*10)); no=rng.standard_normal(n)
    no=np.convolve(no,np.ones(40)/40,'same'); env=(tt/dur)**3
    L[i0:i0+n]+=no*env*amp*4; R[i0:i0+n]+=np.roll(no,50)*env*amp*4
# progression in D: Dmaj9 | Bm11 | Gmaj7#11 | Asus | ...
chords=[(0,[50,57,61,64,66]),(7.5,[47,54,57,61,64]),(15,[43,50,54,57,61]),(22.5,[45,52,55,57,62]),
        (30,[50,57,61,64,66]),(37.5,[47,54,59,62,66]),(45,[43,50,55,59,62]),(52.5,[45,52,57,61,64]),(56,[50,57,62,66,69])]
for i,(s,ns) in enumerate(chords):
    e=chords[i+1][0]+2.0 if i+1<len(chords) else 60
    pad(ns,max(0,s-1.0),e,0.05)
# gentle piano-like arpeggio motif
motif=[74,69,73,76, 71,74,78,76, 67,71,74,73, 69,73,76,74]
for bar in range(15):
    if bar*4+0.5>55: break
    base=bar*4
    for j in range(4):
        idx=(bar%8)//2*4+j
        bell(motif[idx% len(motif)], base+0.5+j*0.95, amp=0.035 if bar<2 else 0.045, pan=0.3+0.4*(j%2))
# accents on key reveals
for s,m in [(0.2,38),(5.0,38),(13.0,35),(24.0,31),(30.0,38),(39.0,35),(56.0,38)]:
    sub(m,s,4.0); bell(m+36,s,amp=0.05,dec=3.5,pan=0.5)
for s in [5.0,13.0,24.0,30.0,56.0]: swell(s)
bell(86,56.2,0.05,5,0.4); bell(81,56.5,0.04,5,0.6); bell(78,56.8,0.035,5,0.5)
# simple stereo reverb via multi-tap feedback delays
def verb(x, taps=((0.031,0.5),(0.047,0.45),(0.071,0.4),(0.113,0.35),(0.173,0.3),(0.251,0.25))):
    y=x.copy()
    for rep in range(3):
        z=np.zeros_like(y)
        for d,g in taps:
            k=int(d*SR*(1+rep*0.7)); z[k:]+=y[:-k]*g*(0.6**rep)
        y=y+z*0.35
    return y
L=verb(L); R=verb(R[::-1])[::-1]*0+verb(R)
mx=max(abs(L).max(),abs(R).max()); L/=mx/0.7; R/=mx/0.7
fade=np.ones(N); fo=int(3.5*SR); fade[-fo:]=np.linspace(1,0,fo)**1.5; fade[:int(0.05*SR)]=np.linspace(0,1,int(0.05*SR))
st=(np.stack([L*fade,R*fade],1)*32767).astype(np.int16)
w=wave.open('assets/score.wav','wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(st.tobytes()); w.close()
print('ok')
