#!/usr/bin/env bash
# Pulls the 7 Higgsfield voice-over takes (voice: Archie, Seed Audio 1.0) and trims edge silence.
# Needs network access to d8j0ntlcm91z4.cloudfront.net. Run from the project root.
set -euo pipefail
B=https://d8j0ntlcm91z4.cloudfront.net/user_3Iiw2M0JUYKI7cQo0JrP0FoL1NE/hf_20261024_215228_
ids=(c1eead8f-cee9-4ce5-860e-95184e3fec17 acb5c88a-2d9b-462d-aa42-f2207b88f258 e4599940-e8a8-485f-a50c-99ea95727826
     8aaf6afc-4c9a-4362-92b8-4db4535dd524 9109a742-cfe8-40c5-b3e4-0f3b147a7868 44346046-e54a-4a1a-a309-2c8a64c626a4
     0b364275-2cc0-48ef-996b-94d5508a327a)
mkdir -p assets/vo/raw
for i in "${!ids[@]}"; do
  n=$((i + 1))
  [ -f "assets/vo/raw/vo-$n.wav" ] || curl -fsS -o "assets/vo/raw/vo-$n.wav" "$B${ids[$i]}.wav"
  # trim leading/trailing silence below -45 dB, keep 40 ms of air
  ffmpeg -v error -y -i "assets/vo/raw/vo-$n.wav" -af \
    "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.04,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.06,areverse" \
    -ar 48000 "assets/vo/vo-$n.wav"
  printf 'vo-%s %ss\n' "$n" "$(ffprobe -v error -show_entries format=duration -of csv=p=0 "assets/vo/vo-$n.wav")"
done
