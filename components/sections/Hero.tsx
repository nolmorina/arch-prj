'use client';

import Image from "next/image";
import { motion } from "framer-motion";
import Container from "@/components/Container";
import heroImage from "@/img/hero.jpg";

const textVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }
  }
};

const Hero = () => (
  <section
    id="hero"
    className="relative flex min-h-screen items-center justify-center overflow-hidden pb-14 pt-32 md:pb-20"
  >
    <Container className="relative z-10 grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={textVariants}
        className="space-y-8 text-center lg:text-left"
      >
        <p className="inline-flex items-center gap-3 rounded-full border border-brand-secondary px-4 py-2 font-condensed text-xs uppercase tracking-[0.32em] text-text-muted">
          Contemporary Architecture
        </p>
        <div className="relative inline-block">
          <div
            className="pointer-events-none absolute inset-0 -z-10 hidden lg:block"
            aria-hidden
          >
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 0.08, y: 0 }}
              transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
              className="absolute left-0 top-[6.25rem] flex w-full justify-center gap-14 text-text"
            >
              <span className="text-[11rem] font-condensed uppercase leading-none tracking-[0.08em]">
                M
              </span>
              <span className="text-[11rem] font-condensed uppercase leading-none tracking-[0.08em]">
                O
              </span>
              <span className="text-[11rem] font-condensed uppercase leading-none tracking-[0.08em]">
                R
              </span>
            </motion.div>
          </div>
          <h1 className="relative text-4xl font-medium uppercase tracking-tightest text-text md:text-6xl lg:text-[4.5rem]">
            Architecture that breathes in light, shadow and proportion.
          </h1>
        </div>
        <p className="mx-auto max-w-xl text-text-muted md:text-lg lg:mx-0">
          Atelier Forma is a multidisciplinary studio crafting serene habitats
          and adaptive spaces across the globe. Our work translates landscapes
          into homes, galleries, and retreats with uncompromising attention to
          detail.
        </p>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-start">
          <motion.a
            href="#projects"
            className="inline-flex items-center justify-center rounded-full border border-text px-10 py-3 font-condensed text-xs uppercase tracking-[0.32em] transition duration-200 hover:-translate-y-1 hover:bg-brand-secondary"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            View Portfolio
          </motion.a>
          <motion.a
            href="#studio"
            className="inline-flex items-center justify-center rounded-full border border-transparent px-10 py-3 font-condensed text-xs uppercase tracking-[0.32em] text-text-muted transition duration-200 hover:text-text"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Meet the studio
          </motion.a>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative flex h-[60vh] min-h-[24rem] w-full justify-end lg:h-[70vh]"
      >
        <div className="absolute -left-10 top-12 hidden h-32 w-32 border border-brand-secondary/60 lg:block" />
        <div className="absolute -right-6 bottom-10 hidden h-16 w-16 border border-brand-secondary/60 lg:block" />
        <div className="relative h-full w-full overflow-hidden">
          <Image
            src={heroImage}
            alt="Minimalist architectural living space"
            fill
            priority
            sizes="(max-width: 768px) 80vw, (max-width: 1200px) 40vw, 540px"
            className="object-cover"
          />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.9 }}
          className="absolute -bottom-10 left-8 flex max-w-xs flex-col gap-3 bg-background px-6 py-5"
        >
          <span className="font-condensed text-xs uppercase tracking-[0.32em] text-text-muted">
            Signature
          </span>
          <span className="text-sm uppercase tracking-[0.1em] text-text">
            Harmon Harbour Residence — 2025, Portugal
          </span>
        </motion.div>
      </motion.div>
    </Container>
  </section>
);

export default Hero;

