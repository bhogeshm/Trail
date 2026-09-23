import Reveal from "./Reveal";

const socials = [
  { label: "Instagram", href: "#" },
  { label: "LinkedIn", href: "#" },
  { label: "Behance", href: "#" },
  { label: "Vimeo", href: "#" },
];

export default function Contact() {
  return (
    <section
      id="contact"
      className="relative px-6 md:px-12 py-28 md:py-40 border-t border-paper/10"
    >
      <Reveal>
        <span className="text-gold text-xs uppercase tracking-widest2">
          04 — Get In Touch
        </span>
      </Reveal>

      <Reveal delay={0.1}>
        <h2 className="font-display leading-[0.85] text-[13vw] md:text-[7vw] text-paper mt-6">
          LET'S MAKE
          <br />
          SOMETHING MOVE
        </h2>
      </Reveal>

      <Reveal delay={0.2}>
        <a
          href="mailto:hello@example.com"
          className="inline-block mt-10 text-xl md:text-3xl text-gold border-b border-gold/40 hover:border-gold pb-1 transition-colors"
        >
          hello@example.com
        </a>
      </Reveal>

      <Reveal delay={0.3}>
        <div className="mt-16 flex flex-wrap gap-x-8 gap-y-3">
          {socials.map((s) => (
            <a
              key={s.label}
              href={s.href}
              className="text-paper/50 hover:text-gold text-sm uppercase tracking-widest2 transition-colors"
            >
              {s.label}
            </a>
          ))}
        </div>
      </Reveal>

      <footer className="mt-24 flex flex-col md:flex-row justify-between gap-4 text-paper/30 text-xs uppercase tracking-widest2">
        <span>© {new Date().getFullYear()} Bhogesh. All rights reserved.</span>
        <span>Motion Designer · Video Editor · AI Video Editor</span>
      </footer>
    </section>
  );
}
