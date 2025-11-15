import Link from "next/link";
import Container from "@/components/Container";

const Footer = () => (
  <footer className="border-t border-brand-secondary bg-background py-16">
    <Container className="grid gap-12 md:grid-cols-[1.2fr_1fr]">
      <div className="space-y-6">
        <h3 className="font-condensed text-sm uppercase tracking-[0.32em] text-text-muted">
          MOR Architecture
        </h3>
        <p className="max-w-md text-text-muted">
          Architecture studio crafting poised experiences through light, sound,
          and material. Based in Pristina, Kosovo.
        </p>
      </div>
      <div className="grid gap-10 sm:grid-cols-2">
        <div className="space-y-3">
          <h4 className="font-condensed text-xs uppercase tracking-[0.32em] text-text-muted">
            Visit
          </h4>
          <p className="text-text">
            Rruga Garibaldi 12<br />
            Pristina, Kosovo
          </p>
        </div>
        <div className="space-y-3">
          <h4 className="font-condensed text-xs uppercase tracking-[0.32em] text-text-muted">
            Connect
          </h4>
          <ul className="space-y-2 text-text">
            <li>
              <Link href="mailto:studio@morarchitecture.com" className="hover:underline">
                studio@morarchitecture.com
              </Link>
            </li>
            <li>
              <Link href="tel:+38349860923" className="hover:underline">
                +383 49 860 923
              </Link>
            </li>
            <li>
              <Link
                href="https://www.instagram.com/morstudio.ks?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
                className="hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Instagram
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </Container>
    <Container className="mt-16 flex flex-col gap-4 text-sm text-text-muted md:flex-row md:items-center md:justify-between">
      <span>© {new Date().getFullYear()} MOR Architecture. All rights reserved.</span>
      <div className="flex gap-6 font-condensed text-xs uppercase tracking-[0.32em]">
        <Link href="#" className="hover:text-text">
          Privacy
        </Link>
        <Link href="/admin/sign-in" className="hover:text-text">
          Terms
        </Link>
        <Link href="#" className="hover:text-text">
          Credits
        </Link>
      </div>
    </Container>
  </footer>
);

export default Footer;

