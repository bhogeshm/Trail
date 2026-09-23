import Reveal from "./Reveal";

const projects = [
  {
    title: "Midnight Runner",
    category: "Music Video · Edit & Color",
    year: "2025",
    gradient: "from-[#2a1a10] via-[#0a0a0b] to-[#0a0a0b]",
  },
  {
    title: "Loop & Line",
    category: "Brand Motion Graphics",
    year: "2025",
    gradient: "from-[#1a2420] via-[#0a0a0b] to-[#0a0a0b]",
  },
  {
    title: "Ghostframe",
    category: "AI-Assisted Short Film",
    year: "2024",
    gradient: "from-[#241a2a] via-[#0a0a0b] to-[#0a0a0b]",
  },
  {
    title: "Signal Reel",
    category: "Product Launch Video",
    year: "2024",
    gradient: "from-[#2a2010] via-[#0a0a0b] to-[#0a0a0b]",
  },
];

export default function Work() {
  return (
    <section id="work" className="relative px-6 md:px-12 py-28 md:py-40">
      <Reveal>
        <span className="text-gold text-xs uppercase tracking-widest2">
          03 — Selected Work
        </span>
      </Reveal>
      <Reveal delay={0.1}>
        <h2 className="font-display text-5xl md:text-6xl mt-4 text-paper mb-16">
          Recent Projects
        </h2>
      </Reveal>

      <div className="grid md:grid-cols-2 gap-6 md:gap-8">
        {projects.map((p, i) => (
          <Reveal key={p.title} delay={0.1 * i}>
            <a
              href="#contact"
              className={`card-glow group relative block aspect-[4/3] rounded-2xl border border-paper/10 bg-gradient-to-br ${p.gradient} p-6 md:p-8 overflow-hidden`}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_50%_50%,rgba(201,161,90,0.15),transparent_70%)]" />
              <div className="relative h-full flex flex-col justify-between">
                <div className="flex justify-between items-start text-paper/40 text-xs uppercase tracking-widest2">
                  <span>{p.category}</span>
                  <span className="mono-num">{p.year}</span>
                </div>
                <div className="flex items-end justify-between">
                  <h3 className="font-display text-4xl md:text-5xl text-paper group-hover:text-gold transition-colors">
                    {p.title}
                  </h3>
                  <span className="text-paper/40 text-2xl group-hover:text-gold group-hover:translate-x-1 group-hover:-translate-y-1 transition-all">
                    ↗
                  </span>
                </div>
              </div>
            </a>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.3}>
        <p className="mt-10 text-paper/40 text-sm">
          Placeholder projects — swap these for your real reel, case studies, or client work.
        </p>
      </Reveal>
    </section>
  );
}
