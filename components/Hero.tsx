"use client";

import { motion } from "framer-motion";

const roles = ["Motion Designer", "Video Editor", "AI Video Editor"];

export default function Hero() {
  return (
    <section
      id="top"
      className="relative min-h-[100svh] flex flex-col justify-center px-6 md:px-12 overflow-hidden"
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_20%,rgba(201,161,90,0.12),transparent_60%)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,#0a0a0b,rgba(10,10,11,0.6)_40%,#0a0a0b)]"
      />

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="text-gold text-xs md:text-sm uppercase tracking-widest2 mb-6"
      >
        Frame by frame, story by story
      </motion.p>

      <h1 className="font-display leading-[0.82] text-[16vw] md:text-[9vw] tracking-tight">
        <motion.span
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="block text-paper"
        >
          BHOGESH
        </motion.span>
        <motion.span
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="block text-outline"
        >
          MOLAGAVALLI
        </motion.span>
      </h1>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.6 }}
        className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 text-paper/70 text-sm md:text-base"
      >
        {roles.map((r, i) => (
          <span key={r} className="flex items-center gap-3">
            <span>{r}</span>
            {i < roles.length - 1 && <span className="text-gold">/</span>}
          </span>
        ))}
      </motion.div>

      <motion.a
        href="#about"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        className="absolute bottom-10 left-6 md:left-12 flex items-center gap-3 text-paper/60 text-xs uppercase tracking-widest2 group"
      >
        <span className="h-10 w-px bg-paper/30 group-hover:bg-gold transition-colors" />
        Scroll
      </motion.a>

      <div className="absolute bottom-10 right-6 md:right-12 text-right text-paper/40 text-xs uppercase tracking-widest2 mono-num">
        Based in India
        <br />
        Available worldwide
      </div>
    </section>
  );
}
