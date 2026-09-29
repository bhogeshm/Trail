set -e
python3 sd.py
J=$(ffmpeg -hide_banner -nostats -i premaster.wav -af loudnorm=I=-13:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/{/,/}/p')
MI=$(echo "$J"|python3 -c "import json,sys;d=json.load(sys.stdin);print(f\"measured_I={d['input_i']}:measured_TP={d['input_tp']}:measured_LRA={d['input_lra']}:measured_thresh={d['input_thresh']}:offset={d['target_offset']}\")")
ffmpeg -loglevel error -i premaster.wav -af "loudnorm=I=-13:TP=-1.5:LRA=11:$MI:linear=true,alimiter=limit=0.82:attack=2:release=60:level=false" -ar 48000 -c:a pcm_s16le -y mix.wav
ffmpeg -hide_banner -nostats -i mix.wav -af ebur128=peak=true:framelog=quiet -f null - 2>&1 | grep -A20 Summary | grep -E "I:|Peak:"
