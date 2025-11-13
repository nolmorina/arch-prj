'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const navLinks = [
  { href: "#projects", label: "Projects" },
  { href: "#studio", label: "Studio" },
  { href: "#contact", label: "Contact" }
];

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 16);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
      className="fixed inset-x-0 top-0 z-50 flex justify-center"
    >
      <nav
        className={`mt-6 w-full max-w-6xl rounded-full border border-transparent px-6 py-4 transition-all duration-300 ${
          isScrolled
            ? "border-brand-secondary bg-white/85 shadow-sm backdrop-blur-md"
            : "bg-transparent"
        }`}
      >
        <div className="flex items-center justify-between gap-6 text-xs uppercase tracking-wider">
          <Link href="#" className="font-condensed text-sm tracking-wider">
            Atelier Forma
          </Link>
          <div className="hidden items-center gap-10 md:flex">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="font-condensed text-[0.75rem] tracking-[0.24em] text-text-muted transition hover:text-text"
              >
                {label}
              </Link>
            ))}
          </div>
          <button
            type="button"
            className="rounded-full border border-text px-6 py-2 text-[0.7rem] font-condensed uppercase tracking-[0.24em] transition hover:bg-brand-secondary hover:text-text"
          >
            Enquire
          </button>
        </div>
      </nav>
    </motion.header>
  );
};

export default Navbar;

