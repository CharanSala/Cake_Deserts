import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDownRight, Menu, Sparkles, X } from 'lucide-react';
import { useReducedMotion } from '../hooks/useReducedMotion';

const NAV_LINKS = [
  { label: 'Showroom', href: '#home' },
  { label: 'The Recipe', href: '#craftsmanship' },
  { label: 'Collection', href: '#collections' },
  { label: 'Atelier', href: '#contact' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 36);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? 'px-3 pt-2.5 sm:px-6 sm:pt-3' : 'px-4 pt-3 sm:px-8 sm:pt-5'
      }`}
    >
      <div
        className={`mx-auto flex max-w-5xl items-center justify-between transition-all duration-500 ${
          scrolled
            ? 'rounded-full border border-gold/30 bg-[#120B09]/85 px-4 py-2.5 shadow-[0_14px_45px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:px-6'
            : 'rounded-full border border-transparent bg-transparent px-2 py-1.5 sm:px-3'
        }`}
      >
        <a
          href="#home"
          className="inline-flex items-center gap-2 font-serif text-xl font-semibold tracking-[0.26em] text-ivory transition-colors hover:text-gold sm:text-2xl"
          aria-label="ÉCLAT Home"
        >
          <Sparkles className="h-3.5 w-3.5 text-gold/85" />
          <span>ÉCLAT</span>
        </a>

        <nav className="hidden items-center gap-8 sm:flex" aria-label="Primary Navigation">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="relative py-1 text-[10px] font-medium uppercase tracking-editorial text-ivory/75 transition-colors hover:text-gold after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-0 after:bg-gold after:transition-all after:duration-300 hover:after:w-full"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="#collections"
            className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-[#1F1410]/90 px-4 py-2 text-[10px] font-semibold uppercase tracking-luxe text-gold transition-all hover:border-gold hover:bg-gold hover:text-espresso sm:px-5 sm:text-[11px]"
          >
            <span>3D Gallery</span>
            <ArrowDownRight className="h-3.5 w-3.5" />
          </a>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gold/30 bg-[#1B110E] text-ivory transition-colors hover:border-gold sm:hidden"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -12 }}
            transition={{ duration: 0.24 }}
            className="mx-auto mt-2 max-w-5xl overflow-hidden rounded-3xl border border-gold/30 bg-[#120B09]/95 px-6 pb-6 pt-5 shadow-[0_24px_60px_rgba(0,0,0,0.65)] backdrop-blur-xl sm:hidden"
          >
            <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-gold/80">
              Maison ÉCLAT • Exhibition Menu
            </p>
            <nav className="mt-3 flex flex-col gap-3" aria-label="Mobile Navigation">
              {NAV_LINKS.map((link, idx) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-baseline justify-between border-b border-gold/15 pb-2.5 font-serif text-2xl text-ivory transition-colors hover:text-gold"
                >
                  <span>{link.label}</span>
                  <span className="text-xs font-sans tracking-widest text-gold/70">
                    0{idx + 1}
                  </span>
                </a>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
