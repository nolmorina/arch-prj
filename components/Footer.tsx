import Link from "next/link";

const Footer = () => (
  <footer className="border-t border-brand-secondary bg-background px-6 py-16 md:px-20">
    <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[1.2fr_1fr]">
      <div className="space-y-6">
        <h3 className="font-condensed text-sm uppercase tracking-[0.32em] text-text-muted">
          Atelier Forma
        </h3>
        <p className="max-w-md text-text-muted">
          Architecture studio crafting serene experiences through light, sound,
          and material. Lisbon & Montréal.
        </p>
      </div>
      <div className="grid gap-10 sm:grid-cols-2">
        <div className="space-y-3">
          <h4 className="font-condensed text-xs uppercase tracking-[0.32em] text-text-muted">
            Visit
          </h4>
          <p className="text-text">
            Rua do Prior 48<br />
            1200-329 Lisbon
          </p>
          <p className="text-text">
            234 Rue Saint-Paul Ouest<br />
            Montréal, QC H2Y 1Z9
          </p>
        </div>
        <div className="space-y-3">
          <h4 className="font-condensed text-xs uppercase tracking-[0.32em] text-text-muted">
            Connect
          </h4>
          <ul className="space-y-2 text-text">
            <li>
              <Link href="mailto:studio@atelierforma.com" className="hover:underline">
                studio@atelierforma.com
              </Link>
            </li>
            <li>
              <Link href="tel:+351210000567" className="hover:underline">
                +351 210 000 567
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:underline">
                Instagram
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:underline">
                LinkedIn
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
    <div className="mx-auto mt-16 flex max-w-6xl flex-col gap-4 text-sm text-text-muted md:flex-row md:items-center md:justify-between">
      <span>© {new Date().getFullYear()} Atelier Forma. All rights reserved.</span>
      <div className="flex gap-6 font-condensed text-xs uppercase tracking-[0.32em]">
        <Link href="#" className="hover:text-text">
          Privacy
        </Link>
        <Link href="#" className="hover:text-text">
          Credits
        </Link>
      </div>
    </div>
  </footer>
);

export default Footer;

