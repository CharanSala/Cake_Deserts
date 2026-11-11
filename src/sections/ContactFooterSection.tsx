import { ArrowUp, Clock, Instagram, MapPin, MessageCircle, Phone } from 'lucide-react';

const ATELIER_PILLARS = [
  { label: '01 · Origin', value: 'Single-Estate Valrhona & Tahitian Vanilla' },
  { label: '02 · Craft', value: '72-Hour Cold Butter Lamination' },
  { label: '03 · Finish', value: 'Hand-Tempered Glaze & 24k Gold Leaf' },
];

export function ContactFooterSection() {
  return (
    <footer
      id="contact"
      className="atelier-grain border-t border-gold/25 bg-[#0B0706] text-ivory"
    >
      <div className="mx-auto max-w-5xl px-5 py-20 text-center sm:px-8 sm:py-24">
        <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-gold">
          ÉCLAT · Maison de Pâtisserie
        </p>
        <h2 className="mt-3 font-serif text-3xl font-medium leading-tight sm:text-5xl">
          Not Just Desserts. Little Pieces of Happiness.
        </h2>

        {/* Minimal Three-Pillar Craft Strip */}
        <div className="mx-auto mt-10 grid max-w-3xl gap-3 border-y border-gold/20 py-6 text-left sm:grid-cols-3 sm:gap-6">
          {ATELIER_PILLARS.map((pillar) => (
            <div key={pillar.label} className="text-center sm:text-left">
              <p className="text-[10px] font-semibold uppercase tracking-editorial text-gold">
                {pillar.label}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-ivory/75">
                {pillar.value}
              </p>
            </div>
          ))}
        </div>

        {/* Exhibition Salon Actions */}
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#home"
            className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3.5 text-[11px] font-semibold uppercase tracking-luxe text-espresso transition-colors hover:bg-ivory"
          >
            <ArrowUp className="h-3.5 w-3.5" />
            <span>Return to Top</span>
          </a>

          <a
            href="https://wa.me/919820012340?text=Bonjour%20%C3%89CLAT%20Salon"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-[#170F0C] px-6 py-3.5 text-[11px] font-medium uppercase tracking-luxe text-ivory transition-colors hover:border-gold hover:text-gold"
          >
            <MessageCircle className="h-3.5 w-3.5 text-gold" />
            <span>WhatsApp Salon Concierge</span>
          </a>
        </div>

        {/* Minimal Salon Details */}
        <div className="mt-12 grid gap-4 border-t border-gold/20 pt-8 text-xs text-ivory/75 sm:grid-cols-4">
          <span className="inline-flex items-center justify-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-gold" />
            Kala Ghoda, Mumbai
          </span>
          <span className="inline-flex items-center justify-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-gold" />
            Tue–Sun · 11 AM–9 PM
          </span>
          <span className="inline-flex items-center justify-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-gold" />
            +91 22 4890 2400
          </span>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 transition-colors hover:text-gold"
          >
            <Instagram className="h-3.5 w-3.5 text-gold" />
            @eclat.patisserie
          </a>
        </div>

        <p className="mt-8 font-serif text-lg tracking-wide text-gold">
          ÉCLAT – Crafted with Love, Served with Elegance.
        </p>
      </div>
    </footer>
  );
}
