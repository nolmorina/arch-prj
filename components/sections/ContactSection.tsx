'use client';

import { motion } from "framer-motion";
import Container from "@/components/Container";

const ContactSection = () => (
  <section
    id="contact"
    className="bg-background py-24 md:py-32"
  >
    <Container>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.8 }}
        className="mb-16 flex flex-col gap-6 text-left md:flex-row md:items-end md:justify-between"
      >
        <div className="max-w-xl space-y-4">
          <span className="rounded-full border border-brand-secondary px-5 py-2 font-condensed text-xs uppercase tracking-[0.28em] text-text-muted">
            Contact
          </span>
          <h2 className="text-[1.75rem] font-medium uppercase tracking-tightest text-text leading-tight md:text-[2.75rem]">
            Let’s shape your next space together.
          </h2>
        </div>
        <p className="max-w-md text-base leading-relaxed text-text-muted md:text-lg">
          Share your vision, timelines, and references. We respond to new
          enquiries within two business days.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-12 md:grid-cols-[1.1fr_0.9fr] md:gap-16">
        <motion.form
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
          className="space-y-6"
        >
          <FormField label="Name" htmlFor="name">
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Your name"
              className="w-full border border-brand-secondary bg-transparent px-4 py-3 text-xs uppercase tracking-[0.15em] text-text outline-none transition focus:border-text md:text-sm"
            />
          </FormField>
          <FormField label="Email" htmlFor="email">
            <input
              id="email"
              name="email"
              type="email"
              placeholder="studio@email.com"
              className="w-full border border-brand-secondary bg-transparent px-4 py-3 text-xs uppercase tracking-[0.15em] text-text outline-none transition focus:border-text md:text-sm"
            />
          </FormField>
          <FormField label="Project Type" htmlFor="projectType">
            <input
              id="projectType"
              name="projectType"
              type="text"
              placeholder="Residence, gallery, hospitality..."
              className="w-full border border-brand-secondary bg-transparent px-4 py-3 text-xs uppercase tracking-[0.15em] text-text outline-none transition focus:border-text md:text-sm"
            />
          </FormField>
          <FormField label="Message" htmlFor="message">
            <textarea
              id="message"
              name="message"
              rows={4}
              placeholder="Share project scope, timelines, or inspiration."
              className="w-full border border-brand-secondary bg-transparent px-4 py-3 text-xs uppercase tracking-[0.15em] text-text outline-none transition focus:border-text md:text-sm"
            />
          </FormField>
          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center justify-center rounded-full border border-text px-12 py-3 font-condensed text-[0.65rem] uppercase tracking-[0.28em] transition hover:bg-brand-secondary md:text-xs"
          >
            Send enquiry
          </motion.button>
        </motion.form>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.9, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
          className="flex flex-col gap-8 border border-brand-secondary px-6 py-10 sm:px-8 md:gap-10 md:px-10 md:py-12"
        >
          <div>
            <h3 className="font-condensed text-xs uppercase tracking-[0.32em] text-text-muted">
              Studios
            </h3>
            <p className="mt-3 text-lg text-text">
              Lisbon<br />
              Rua do Prior 48
            </p>
            <p className="mt-6 text-lg text-text">
              Montréal<br />
              234 Rue Saint-Paul Ouest
            </p>
          </div>
          <div>
            <h3 className="font-condensed text-xs uppercase tracking-[0.32em] text-text-muted">
              Contact
            </h3>
            <p className="mt-3 text-lg text-text">
              <a href="tel:+351210000567" className="hover:underline">
                +351 210 000 567
              </a>
              <br />
              <a
                href="mailto:studio@atelierforma.com"
                className="hover:underline"
              >
                studio@atelierforma.com
              </a>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 font-condensed text-[0.65rem] uppercase tracking-[0.24em] text-text-muted md:gap-4 md:text-xs">
            <a href="#" className="transition hover:text-text">
              Instagram
            </a>
            <span>—</span>
            <a href="#" className="transition hover:text-text">
              Behance
            </a>
            <span>—</span>
            <a href="#" className="transition hover:text-text">
              LinkedIn
            </a>
          </div>
        </motion.div>
      </div>
    </Container>
  </section>
);

type FormFieldProps = {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
};

const FormField = ({ label, htmlFor, children }: FormFieldProps) => (
  <label htmlFor={htmlFor} className="block space-y-3">
    <span className="font-condensed text-[0.6rem] uppercase tracking-[0.32em] text-text-muted md:text-[0.7rem]">
      {label}
    </span>
    {children}
  </label>
);

export default ContactSection;

