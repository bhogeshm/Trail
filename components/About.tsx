import Reveal from "./Reveal";

const stats = [
  { value: "3+", label: "Years crafting motion" },
  { value: "50+", label: "Projects delivered" },
  { value: "∞", label: "Frames rendered" },
];

export default function About() {
  return (
    <section id="about" className="relative px-6 md:px-12 py-28 md:py-40">
      <div className="grid md:grid-cols-12 gap-10 md:gap-16">
        <div className="md:col-span-4">
          <Reveal>
            <span className="text-gold text-xs uppercase tracking-widest2">
              01 — About
            </span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="font-display text-5xl md:text-6xl mt-4 text-paper">
              The Story
            </h2>
          </Reveal>
        </div>

        <div className="md:col-span-8">
          <Reveal delay={0.15}>
            <p className="text-2xl md:text-4xl leading-tight text-paper/90 font-light">
              I'm Bhogesh — I shape raw footage and ideas into motion that
              moves people. Between the timeline and the render queue, I
              blend traditional editing craft with AI-powered tools to
              tell stories faster, sharper, and more cinematically.
            </p>
          </Reveal>

          <Reveal delay={0.25}>
            <p className="mt-8 text-paper/60 text-base md:text-lg leading-relaxed max-w-2xl">
              From color grading and sound design to motion graphics and
              AI-assisted editing pipelines, I work across the full post
              production process — turning a brief into a finished piece
              that holds attention from the first frame to the last.
            </p>
          </Reveal>

          <Reveal delay={0.35}>
            <div className="mt-14 grid grid-cols-3 gap-6 border-t border-paper/10 pt-8">
              {stats.map((s) => (
                <div key={s.label}>
                  <div className="font-display text-4xl md:text-5xl text-gold mono-num">
                    {s.value}
                  </div>
                  <div className="text-paper/50 text-xs md:text-sm uppercase tracking-wide mt-2">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
