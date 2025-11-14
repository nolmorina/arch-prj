'use client';

import { motion } from "framer-motion";
import Container from "@/components/Container";

const AboutSection = () => (
  <section
    id="studio"
    className="relative bg-background-alternate py-24 md:py-32"
  >
    <Container className="flex flex-col items-center gap-10 text-center lg:max-w-4xl">
      <motion.span
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.8 }}
        className="rounded-full border border-brand-secondary px-5 py-2 font-condensed text-xs uppercase tracking-[0.28em] text-text-muted"
      >
        About
      </motion.span>
      <motion.h2
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
        className="text-3xl font-medium uppercase tracking-tightest text-text md:text-[2.75rem]"
      >
        We choreograph space through light, material, and sound.
      </motion.h2>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
        className="w-full rounded-none border border-brand-secondary bg-white px-8 py-12 text-left md:px-12 md:py-16"
      >
        <p className="text-lg text-text-muted">
          Atelier Forma is led by principal architect Lea Fournier with studios
          in Lisbon and Montréal. From coastal retreats to cultural institutions,
          we deliver architecture that is precise yet warm—anchoring each
          project in its landscape while embracing adaptive, sustainable
          systems.
        </p>
        <p className="mt-8 text-lg text-text-muted">
          Our team collaborates across disciplines to explore tactile
          materials, filtered daylight, and controlled acoustics. The result is
          a quiet intensity—spaces that invite instinctive movement and
          considered living.
        </p>
      </motion.div>
    </Container>
  </section>
);

export default AboutSection;

