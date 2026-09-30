"""Builds SchoolMiles.xml — a Final Cut Pro 7 XML (xmeml v5) sequence that
Adobe Premiere Pro imports as a fully editable timeline (File > Import).

Run from this folder:  python3 make_xml.py   ->  pkg/SchoolMiles.xml
Media paths are relative to the XML (media/...).
"""
import os
import subprocess
from xml.sax.saxutils import escape

FPS = 30
W, H = 1080, 1920
SEQ_FRAMES = 804  # 26.8s
HERE = os.path.dirname(os.path.abspath(__file__))
PKG = os.path.join(HERE, "pkg")


def frames(path):
    out = subprocess.check_output(
        ["ffprobe", "-v", "error", "-count_frames", "-select_streams", "v", "-show_entries",
         "stream=nb_read_frames", "-of", "csv=p=0", os.path.join(PKG, path)], text=True)
    return int(out.strip())


RATE = f"<rate><timebase>{FPS}</timebase><ntsc>FALSE</ntsc></rate>"
_files_written = set()
_uid = [0]


def uid(prefix):
    _uid[0] += 1
    return f"{prefix}-{_uid[0]}"


def file_el(fid, rel, dur, kind):
    if fid in _files_written:
        return f'<file id="{fid}"/>'
    _files_written.add(fid)
    name = escape(os.path.basename(rel))
    media = ""
    if kind in ("video", "still"):
        media = (f"<video><samplecharacteristics>{RATE}<width>{W}</width><height>{H}</height>"
                 f"<pixelaspectratio>square</pixelaspectratio><anamorphic>FALSE</anamorphic>"
                 f"<fielddominance>none</fielddominance></samplecharacteristics></video>")
    if kind == "audio":
        media = ("<audio><samplecharacteristics><depth>16</depth><samplerate>48000</samplerate>"
                 "</samplecharacteristics><channelcount>2</channelcount></audio>")
    return (f'<file id="{fid}"><name>{name}</name><pathurl>{escape(rel)}</pathurl>{RATE}'
            f"<duration>{dur}</duration><media>{media}</media></file>")


def param_kf(pid, name, vmin, vmax, default, kfs):
    k = "".join(f"<keyframe><when>{w}</when><value>{v}</value></keyframe>" for w, v in kfs)
    return (f'<parameter authoringApp="PremierePro"><parameterid>{pid}</parameterid><name>{name}</name>'
            f"<valuemin>{vmin}</valuemin><valuemax>{vmax}</valuemax><value>{default}</value>{k}</parameter>")


def motion(scale_kfs=None, scale=100):
    p = param_kf("scale", "Scale", 0, 1000, scale, scale_kfs or [])
    p += ('<parameter authoringApp="PremierePro"><parameterid>center</parameterid><name>Center</name>'
          "<value><horiz>0</horiz><vert>0</vert></value></parameter>")
    return ("<filter><effect><name>Basic Motion</name><effectid>basic</effectid>"
            "<effectcategory>motion</effectcategory><effecttype>motion</effecttype>"
            f"<mediatype>video</mediatype>{p}</effect></filter>")


def opacity(kfs, default=100):
    p = param_kf("opacity", "opacity", 0, 100, default, kfs)
    return ("<filter><effect><name>Opacity</name><effectid>opacity</effectid>"
            "<effectcategory>motion</effectcategory><effecttype>motion</effecttype>"
            f"<mediatype>video</mediatype>{p}</effect></filter>")


def vclip(name, rel, start, end, kind="video", filters="", in_=0):
    length = end - start
    if kind == "still":
        fdur = max(length + in_, 1)
    else:
        fdur = frames(rel)
        assert in_ + length <= fdur, f"{rel}: needs {in_ + length} frames, has {fdur}"
    fid = "file-" + os.path.basename(rel)
    still = "<stillframe>TRUE</stillframe>" if kind == "still" else ""
    return (f'<clipitem id="{uid("clip")}"><name>{escape(name)}</name><enabled>TRUE</enabled>'
            f"<duration>{fdur}</duration>{RATE}<start>{start}</start><end>{end}</end>"
            f"<in>{in_}</in><out>{in_ + length}</out>{still}{file_el(fid, rel, fdur, kind)}"
            f"<sourcetrack><mediatype>video</mediatype></sourcetrack>{filters}</clipitem>")


def track(items, name):
    return f"<track><enabled>TRUE</enabled><locked>FALSE</locked>{''.join(items)}</track>"


# ---------------- V1: footage (hard cuts on the beat, slow push-ins) ----------------
cuts = [
    ("01 Speaker session", "c01.mp4", 0, 90),
    ("02 Session collage A", "c02.mp4", 90, 150),
    ("03 Session collage B", "c03.mp4", 150, 210),
    ("04 Kit handover 1", "c04.mp4", 210, 249),
    ("05 Kit handover 2", "c05.mp4", 249, 281),
    ("06 Kit handover 3", "c06.mp4", 281, 312),
    ("07 Handover at banner", "c07.mp4", 312, 330),
    ("08 Girls with kits", "c08.mp4", 330, 396),
    ("09 Group photo", "c09.mp4", 396, 480),
    ("10 Classroom collage A", "c10.mp4", 480, 540),
    ("11 Classroom collage B", "c11.mp4", 540, 600),
]
v1 = []
for i, (n, f, s, e) in enumerate(cuts):
    a, b = (102, 107) if i % 2 == 0 else (107, 102)
    v1.append(vclip(n, f"media/{f}", s, e, filters=motion([(0, a), (e - s, b)])))

# ---------------- V2: campaign banner (blur baked in), dissolves in over V1 ----------------
v2 = [vclip("12 Banner (blurred)", "media/c12_banner_blur.mp4", 588, 690,
            filters=motion([(0, 112), (102, 120)]) + opacity([(0, 0), (12, 100)]))]

# ---------------- V3: legibility scrim ----------------
v3 = [vclip("Scrim (bottom gradient + vignette)", "media/scrim.png", 0, 681, kind="still",
            filters=opacity([(0, 100), (675, 100), (681, 0)]))]

# ---------------- V4: navy dim behind the closing lockup ----------------
v4 = [vclip("Navy dim (72%)", "media/dim_navy.png", 588, 690, kind="still",
            filters=opacity([(0, 0), (18, 72), (102, 72)], default=72))]

# ---------------- V5: animated titles (transparent) ----------------
titles = [
    ("T1 EVERY GIRL DESERVES", "title_01_every-girl.mov", 0, 90),
    ("T2 KNOWLEDGE", "title_02_knowledge.mov", 90, 210),
    ("T3 SUPPORT", "title_03_support.mov", 210, 330),
    ("T4 CONFIDENCE", "title_04_confidence.mov", 330, 480),
    ("T5 BECAUSE EVERY SCHOOL DAY", "title_05_school-day.mov", 480, 600),
    ("T6 SCHOOL MILES lockup", "title_06_school-miles.mov", 600, 681),
]
v5 = [vclip(n, f"media/{f}", s, e) for n, f, s, e in titles]

# ---------------- V6: CSR end card, dissolve in, fade to black ----------------
v6 = [vclip("13 CSR end card", "media/c13.mp4", 675, 804,
            filters=opacity([(0, 0), (15, 100), (111, 100), (129, 0)]))]

# ---------------- A1: original score ----------------
score_rel = "media/school-miles-score.wav"
a1 = (f'<clipitem id="{uid("clip")}"><name>School Miles score (stomp + piano)</name><enabled>TRUE</enabled>'
      f"<duration>{SEQ_FRAMES}</duration>{RATE}<start>0</start><end>{SEQ_FRAMES}</end><in>0</in>"
      f"<out>{SEQ_FRAMES}</out>{file_el('file-score', score_rel, SEQ_FRAMES, 'audio')}"
      "<sourcetrack><mediatype>audio</mediatype><trackindex>1</trackindex></sourcetrack></clipitem>")

fmt = (f"<format><samplecharacteristics>{RATE}<width>{W}</width><height>{H}</height>"
       "<pixelaspectratio>square</pixelaspectratio><anamorphic>FALSE</anamorphic>"
       "<fielddominance>none</fielddominance><colordepth>24</colordepth></samplecharacteristics></format>")

xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE xmeml>
<xmeml version="5">
<sequence id="sequence-1">
<name>School Miles - Final Edit</name>
<duration>{SEQ_FRAMES}</duration>
{RATE}
<timecode>{RATE}<string>00:00:00:00</string><frame>0</frame><displayformat>NDF</displayformat></timecode>
<media>
<video>
{fmt}
{track(v1, "V1")}
{track(v2, "V2")}
{track(v3, "V3")}
{track(v4, "V4")}
{track(v5, "V5")}
{track(v6, "V6")}
</video>
<audio>
<numOutputChannels>2</numOutputChannels>
<format><samplecharacteristics><depth>16</depth><samplerate>48000</samplerate></samplecharacteristics></format>
<track><enabled>TRUE</enabled><locked>FALSE</locked>{a1}</track>
</audio>
</media>
</sequence>
</xmeml>
"""
out = os.path.join(PKG, "SchoolMiles.xml")
open(out, "w").write(xml)
print("wrote", out)
