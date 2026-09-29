import sys, subprocess
sys.path.insert(0,"audio")
from edit import EDIT, HOLD
parts=[]
for i,(a,b,c,d) in enumerate(EDIT):
    n=round(d*30)-round(c*30)
    if i==len(EDIT)-1: n+=round(HOLD*30)
    f=((d-c)+2/30)/(b-a)
    tail=f",tpad=stop_mode=clone:stop_duration={HOLD+0.2}" if i==len(EDIT)-1 else ""
    parts.append(f"[0:v]trim=start={a}:end={b},setpts=(PTS-STARTPTS)*{f:.5f},fps=30{tail},trim=end_frame={n},settb=1/30,setpts=N[v{i}]")
fc=";".join(parts)+";"+"".join(f"[v{i}]" for i in range(len(EDIT)))+f"concat=n={len(EDIT)}:v=1:a=0,settb=1/30,setpts=N,format=yuv420p[v]"
subprocess.run(["ffmpeg","-loglevel","error","-i","in.mp4","-filter_complex",fc,"-map","[v]","-r","30","-c:v","libx264","-crf","14","-preset","medium","-y","edit.mp4"],check=True)
