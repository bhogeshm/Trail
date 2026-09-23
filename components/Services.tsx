import Reveal from "./Reveal";

const services = [
  {
    n: "01",
    title: "Motion Design",
    desc: "Kinetic typography, animated logos, and motion graphics that give brands rhythm and life on screen.",
  },
  {
    n: "02",
    title: "Video Editing",
    desc: "Narrative-driven edits, pacing, color, and sound design across commercials, reels, and long-form content.",
  },
  {
    n: "03",
    title: "AI Video Editing",
    desc: "AI-assisted rotoscoping, generative b-roll, upscaling, and rapid-turnaround edits powered by modern tools.",
  },
];

const tools = [
  "Premiere Pro",
  "After Effects",
  "DaVinci Resolve",
  "Runway",
  "Photoshop",
  "Cinema 4D",
  "Midjourney",
  "Figma",
];

export default function Services() {
  return (
    <section id="services" className="relative px-6 md:px-12 py-28 md:py-40 bg-noise-fade">
      <Reveal>
        <span className="text-gold text-xs uppercase tracking-widest2">
          02 — What I Do
        </span>
      </Reveal>
      <Reveal delay={0.1}>
        <h2 className="font-display text-5xl md:text-6xl mt-4 text-paper mb-16">
          Services
        </h2>
      </Reveal>

      <div className="divide-y divide-paper/10 border-y border-paper/10">
        {services.map((s, i) => (
          <Reveal key={s.n} delay={0.1 * i}>
            <div className="group grid md:grid-cols-12 gap-4 md:gap-8 py-8 md:py-10 items-start md:items-center transition-colors hover:bg-paper/[0.03] px-2 -mx-2">
              <span className="md:col-span-1 font-display text-2xl text-mist">
                {s.n}
              </span>
              <h3 className="md:col-span-3 font-display text-3xl md:text-4xl text-paper group-hover:text-gold transition-colors">
                {s.title}
              </h3>
              <p className="md:col-span-8 text-paper/55 text-base md:text-lg leading-relaxed">
                {s.desc}
              </p>
            </div>
          </Reveal>
        ))}
      </div>

      <div className="mt-20 overflow-hidden select-none">
        <div className="flex w-max marquee-track">
          {[...tools, ...tools].map((t, i) => (
            <span
              key={`${t}-${i}`}
              className="font-display text-3xl md:text-5xl text-paper/15 mx-6 md:mx-10 whitespace-nowrap"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
