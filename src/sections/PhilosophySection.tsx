import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SectionHeader } from '../components/SectionHeader';
import { useReducedMotion } from '../hooks/useReducedMotion';

gsap.registerPlugin(ScrollTrigger);

const PHILOSOPHY_PILLARS = [
  { label: '01 / Purity', title: 'Quality Ingredients', body: 'Single-origin chocolate and cultured butter.' },
  { label: '02 / Rhythm', title: 'Fresh Preparation', body: 'Whipped and assembled in daily micro-batches.' },
  { label: '03 / Devotion', title: 'Handmade Craft', body: 'Tempered and glazed by artisan hands.' },
  { label: '04 / Precision', title: 'Attention to Detail', body: 'Balanced sweetness, crunch, and aroma.' },
  { label: '05 / Poise', title: 'Presentation', body: 'Sculptural restraint from kitchen to table.' },
];

export function PhilosophySection() {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (prefersReduced || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from('.philosophy-pillar', {
        y: 24,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power2.out',
        clearProps: 'transform,opacity',
        scrollTrigger: {
          trigger: '.philosophy-grid',
          start: 'top 82%',
          once: true,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [prefersReduced]);

  return (
    <section
      id="story"
      ref={sectionRef}
      className="border-t border-gold/25 bg-cream py-20 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <SectionHeader
              eyebrow="Our Philosophy"
              title="Not Just Desserts. Little Pieces of Happiness."
            />
            <p className="mt-6 max-w-xl font-serif text-xl italic leading-relaxed text-chocolate sm:text-2xl">
              “A truly memorable pastry lingers long after the plate is cleared—in warmth, conversation, and quiet wonder.”
            </p>
          </div>
          <div className="lg:col-span-5">
            <div className="overflow-hidden rounded-3xl border border-gold/30 bg-ivory p-4 shadow-card">
              <img
                src="/images/craftsmanship-atelier.svg"
                alt="Artisan patisserie tools, whisk, piping bag, cocoa beans, and vanilla pod illustration"
                className="h-48 w-full object-contain sm:h-56"
                loading="lazy"
              />
            </div>
          </div>
        </div>

        {/* Five Pillars */}
        <div className="philosophy-grid mt-12 grid gap-5 sm:grid-cols-2 lg:mt-16 lg:grid-cols-5 lg:gap-6">
          {PHILOSOPHY_PILLARS.map((pillar) => (
            <div
              key={pillar.label}
              className="philosophy-pillar flex flex-col justify-between rounded-3xl border border-gold/30 bg-ivory/75 p-6 transition-colors duration-300 hover:bg-ivory"
            >
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-editorial text-gold">
                  {pillar.label}
                </span>
                <h3 className="mt-3 font-serif text-2xl font-medium text-espresso">
                  {pillar.title}
                </h3>
                <div className="my-3.5 h-px w-10 bg-gold/50" />
                <p className="text-sm leading-relaxed text-espresso/80">
                  {pillar.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
