'use client';

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const navLinks = [
  { href: "/#projects", label: "Projects" },
  { href: "/#studio", label: "Studio" },
  { href: "/#contact", label: "Contact" }
];

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const handleMenuToggle = () => setMenuOpen((prev) => !prev);
  const handleLinkClick = () => setMenuOpen(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      setIsScrolled(currentScroll > 16);

      if (menuOpen) {
        lastScrollY.current = currentScroll;
        setIsHidden(false);
        return;
      }

      if (currentScroll > lastScrollY.current && currentScroll > 80) {
        setIsHidden(true);
      } else {
        setIsHidden(false);
      }

      lastScrollY.current = currentScroll;
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [menuOpen]);

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: isHidden ? 0 : 1, y: isHidden ? -30 : 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className="fixed inset-x-0 top-0 z-50 flex justify-center"
    >
      <nav
        className={`mt-3 w-[min(88vw,32rem)] rounded-full border px-4 py-2 transition-all duration-300 backdrop-blur-2xl md:w-full md:max-w-5xl ${
          isScrolled
            ? "border-zinc-300/80 bg-zinc-100/80 shadow-xl"
            : "border-white/30 bg-zinc-50/30 shadow-md"
        }`}
      >
        <div className="flex flex-col gap-4 text-xs uppercase tracking-wider md:flex-row md:items-center md:justify-between">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="font-condensed text-sm tracking-wider">
              <span className="md:hidden">MOR ARCH. STUDIO</span>
              <span className="hidden md:inline">MOR ARCHITECTURE STUDIO</span>
            </Link>
            <div className="relative md:hidden" ref={menuRef}>
              <button
                type="button"
                onClick={handleMenuToggle}
                className="flex h-8 w-8 flex-col items-center justify-center gap-1 transition hover:opacity-80"
                aria-label="Toggle navigation menu"
                aria-expanded={menuOpen}
              >
                <span
                  className={`h-0.5 w-4 rounded-full bg-text transition-all duration-300 ${
                    menuOpen ? "translate-y-[5px] rotate-45" : ""
                  }`}
                />
                <span
                  className={`h-0.5 w-4 rounded-full bg-text transition-all duration-200 ${
                    menuOpen ? "opacity-0" : "opacity-100"
                  }`}
                />
                <span
                  className={`h-0.5 w-4 rounded-full bg-text transition-all duration-300 ${
                    menuOpen ? "-translate-y-[5px] -rotate-45" : ""
                  }`}
                />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full z-20 mt-2 w-40 rounded-2xl border border-text/10 bg-white/95 px-3 py-3 shadow-xl backdrop-blur-sm">
                  <div className="flex flex-col gap-2 text-[0.7rem] tracking-[0.24em] text-text-muted transition">
                    {navLinks.map(({ href, label }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={handleLinkClick}
                        className="rounded-xl px-3 py-2 text-text transition hover:bg-brand-secondary/20 hover:text-text"
                      >
                        {label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

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
            className="hidden rounded-full border border-text px-6 py-2 text-[0.7rem] font-condensed uppercase tracking-[0.24em] transition hover:bg-brand-secondary hover:text-text md:inline-flex"
          >
            Enquire
          </button>
        </div>
      </nav>
    </motion.header>
  );
};

export default Navbar;

