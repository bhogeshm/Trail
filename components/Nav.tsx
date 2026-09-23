"use client";

import { motion } from "framer-motion";

const links = [
  { href: "#about", label: "About" },
  { href: "#work", label: "Work" },
  { href: "#services", label: "Services" },
  { href: "#contact", label: "Contact" },
];

export default function Nav() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 md:px-12 py-6 mix-blend-difference"
    >
      <a href="#top" className="font-display text-2xl tracking-widest text-paper">
        BHOGESH
      </a>
      <nav className="hidden md:flex items-center gap-10 text-xs uppercase tracking-widest2 text-paper/80">
        {links.map((l) => (
          <a key={l.href} href={l.href} className="hover:text-gold transition-colors">
            {l.label}
          </a>
        ))}
      </nav>
      <a
        href="#contact"
        className="md:hidden text-xs uppercase tracking-widest2 text-paper/80"
      >
        Menu
      </a>
    </motion.header>
  );
}
