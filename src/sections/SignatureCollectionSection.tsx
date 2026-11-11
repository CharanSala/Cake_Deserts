import { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowUpRight, Rotate3d } from 'lucide-react';
import { DessertCategory, DessertItem, DESSERTS, formatINR } from '../data/desserts';
import { DessertModelCanvas } from '../models/DessertModelCanvas';
import { useReducedMotion } from '../hooks/useReducedMotion';

gsap.registerPlugin(ScrollTrigger);

interface SignatureCollectionSectionProps {
  onSelectDessert: (dessert: DessertItem) => void;
}

const CATEGORIES: { id: DessertCategory; label: string }[] = [
  { id: 'all', label: 'All · 10' },
  { id: 'pastries', label: 'Cakes & Pastries' },
  { id: 'chocolates', label: 'Chocolates' },
  { id: 'verrines', label: 'Verrines & Tea' },
];

type VitrineShape = 'arch' | 'halo' | 'petal' | 'capsule';

const SHAPE_SEQUENCE: VitrineShape[] = ['arch', 'halo', 'petal', 'capsule'];

function getShapeClasses(shape: VitrineShape): string {
  switch (shape) {
    case 'arch':
      return 'rounded-t-[999px] rounded-b-[28px] h-[275px] sm:h-[330px]';
    case 'halo':
      return 'rounded-full aspect-square max-w-[275px] sm:max-w-[315px] mx-auto';
    case 'petal':
      return 'rounded-tl-[84px] rounded-br-[84px] rounded-tr-[20px] rounded-bl-[20px] h-[265px] sm:h-[310px]';
    case 'capsule':
      return 'rounded-[999px] h-[275px] sm:h-[330px] max-w-[290px] sm:max-w-[325px] mx-auto';
  }
}

interface SculpturalNodeProps {
  dessert: DessertItem;
  index: number;
  onSelectDessert: (dessert: DessertItem) => void;
}

function SculpturalDessertNode({
  dessert,
  index,
  onSelectDessert,
}: SculpturalNodeProps) {
  const rowRef = useRef<HTMLElement>(null);
  const watermarkRef = useRef<HTMLSpanElement>(null);
  const itemScrollRef = useRef(0);
  const tapStartRef = useRef<{ x: number; y: number } | null>(null);
  const prefersReduced = useReducedMotion();

  const isRightSide = index % 2 === 1;
  const shape = SHAPE_SEQUENCE[index % SHAPE_SEQUENCE.length];
  const shapeClass = getShapeClasses(shape);
  const maxBoxPrice = dessert.variants[dessert.variants.length - 1]?.price ?? dessert.price;

  useEffect(() => {
    if (!rowRef.current) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: rowRef.current,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
        onUpdate: (self) => {
          itemScrollRef.current = self.progress;
        },
      });

      if (prefersReduced) return;

      gsap.from(rowRef.current, {
        y: 44,
        opacity: 0,
        duration: 0.85,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
        scrollTrigger: {
          trigger: rowRef.current,
          start: 'top 86%',
          once: true,
        },
      });

      if (watermarkRef.current) {
        gsap.fromTo(
          watermarkRef.current,
          { y: 28 },
          {
            y: -28,
            ease: 'none',
            scrollTrigger: {
              trigger: rowRef.current,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          },
        );
      }
    }, rowRef);

    return () => ctx.revert();
  }, [prefersReduced]);

  return (
    <article
      ref={rowRef}
      className={`relative grid items-center gap-6 pl-9 sm:pl-12 lg:grid-cols-12 lg:gap-10 lg:pl-0 ${
        index > 0 ? 'lg:-mt-6' : ''
      }`}
    >
      {/* Numbered Golden Node Pin on Vertical Spine */}
      <div
        aria-hidden="true"
        className="absolute left-[11px] top-8 z-20 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full border border-gold bg-[#0E0807] text-[9px] font-semibold tracking-wider text-gold shadow-[0_0_18px_rgba(198,164,108,0.45)] lg:left-1/2 lg:top-1/2 lg:-translate-y-1/2"
      >
        {dessert.number}
      </div>

      {/* Sculptural 3D Vitrine Column */}
      <div
        className={`relative lg:col-span-5 ${
          isRightSide ? 'lg:col-start-8 lg:order-2' : 'lg:col-start-1 lg:order-1'
        }`}
      >
        {/* Parallax Oversized Piece Number */}
        <span
          ref={watermarkRef}
          aria-hidden="true"
          className={`pointer-events-none absolute -top-7 z-0 font-serif text-[88px] font-light leading-none text-gold/10 sm:text-[124px] ${
            isRightSide ? 'right-2 lg:-left-10 lg:right-auto' : 'right-2'
          }`}
        >
          {dessert.number}
        </span>

        {/* Unique Architectural Silhouette Cloche */}
        <div
          onPointerDown={(e) => {
            tapStartRef.current = { x: e.clientX, y: e.clientY };
          }}
          onPointerUp={(e) => {
            if (!tapStartRef.current) return;
            const dist = Math.hypot(
              e.clientX - tapStartRef.current.x,
              e.clientY - tapStartRef.current.y,
            );
            tapStartRef.current = null;
            if (dist < 8) onSelectDessert(dessert);
          }}
          onPointerCancel={() => {
            tapStartRef.current = null;
          }}
          style={{ touchAction: 'pan-y' }}
          className={`group relative z-10 w-full cursor-pointer overflow-hidden border border-gold/30 bg-[radial-gradient(circle_at_50%_42%,#271712_0%,#140C09_68%,#0D0806_100%)] shadow-[0_26px_65px_rgba(0,0,0,0.65)] transition-all duration-500 hover:border-gold/70 ${shapeClass}`}
        >
          {/* Delicate Inner Framing Halo */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-2.5 rounded-[inherit] border border-gold/15"
          />

          <DessertModelCanvas
            dessert={dessert}
            interactive={false}
            enableZoom={false}
            autoRotate
            rotateSpeed={0.2}
            scaleMultiplier={1.18}
            lightingMood="espresso"
            scrollProgressRef={itemScrollRef}
            scrollSpinTurns={0.85}
          />

          {/* Subtle Interactive Hint Chip */}
          <div className="pointer-events-none absolute bottom-3.5 left-1/2 z-20 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-gold/25 bg-[#0E0807]/85 px-3 py-1 text-[9px] uppercase tracking-editorial text-gold/90 backdrop-blur-sm">
            <Rotate3d className="h-3 w-3" />
            <span>Tap for 360°</span>
          </div>
        </div>
      </div>

      {/* Minimal Editorial Plaque (Exhibition Display Only) */}
      <div
        className={`lg:col-span-4 ${
          isRightSide
            ? 'lg:col-start-2 lg:order-1 lg:text-right'
            : 'lg:col-start-8 lg:order-2 lg:text-left'
        }`}
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold">
          {dessert.number} · {dessert.frenchSubtitle}
        </p>

        <h3 className="mt-1.5 font-serif text-3xl font-medium leading-tight text-ivory sm:text-4xl">
          {dessert.name}
        </h3>

        {/* Display Menu Pricing in Rupees */}
        <div
          className={`mt-3 flex flex-wrap items-baseline gap-2.5 ${
            isRightSide ? 'lg:justify-end' : 'lg:justify-start'
          }`}
        >
          <span className="font-serif text-2xl font-medium text-gold sm:text-[28px]">
            {formatINR(dessert.price)}
          </span>
          {maxBoxPrice > dessert.price && (
            <span className="text-[11px] uppercase tracking-luxe text-ivory/55">
              • Box up to {formatINR(maxBoxPrice)}
            </span>
          )}
        </div>

        <p className="mt-2.5 text-xs leading-relaxed text-ivory/70 sm:text-sm">
          {dessert.shortDescription}
        </p>

        {/* Tasting Chips */}
        <div
          className={`mt-3.5 flex flex-wrap gap-1.5 ${
            isRightSide ? 'lg:justify-end' : 'lg:justify-start'
          }`}
        >
          {dessert.flavorNotes.map((note) => (
            <span
              key={note}
              className="rounded-full border border-rose/25 bg-rose/10 px-2.5 py-0.5 text-[10px] uppercase tracking-luxe text-rose"
            >
              {note}
            </span>
          ))}
        </div>

        {/* Single Exhibition Inspection Button */}
        <div
          className={`mt-5 flex items-center ${
            isRightSide ? 'lg:justify-end' : 'lg:justify-start'
          }`}
        >
          <button
            type="button"
            onClick={() => onSelectDessert(dessert)}
            className="group inline-flex items-center gap-2 rounded-full border border-gold/40 bg-[#1B110E] px-5 py-2.5 text-[10px] font-semibold uppercase tracking-luxe text-ivory transition-all hover:border-gold hover:bg-gold hover:text-espresso"
          >
            <span>3D Study & Notes</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-gold transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-espresso" />
          </button>
        </div>
      </div>
    </article>
  );
}

export function SignatureCollectionSection({
  onSelectDessert,
}: SignatureCollectionSectionProps) {
  const [category, setCategory] = useState<DessertCategory>('all');

  const filteredDesserts = useMemo(() => {
    if (category === 'all') return DESSERTS;
    return DESSERTS.filter((d) => d.category === category);
  }, [category]);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });
    return () => window.cancelAnimationFrame(id);
  }, [category]);

  return (
    <section
      id="collections"
      className="atelier-grain relative overflow-x-clip border-t border-gold/25 bg-[#0E0807] py-20 text-ivory sm:py-28"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-10">
        {/* Centered Header + Wrapped Category Filters */}
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-gold">
            La Galerie ÉCLAT • Interactive 3D Exhibition
          </p>
          <h2 className="mt-2 font-serif text-3xl font-medium text-ivory sm:text-5xl">
            Ten Artisan Creations
          </h2>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {CATEGORIES.map((cat) => {
              const active = cat.id === category;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`rounded-full border px-4 py-2 text-[10px] font-medium uppercase tracking-luxe transition sm:text-[11px] ${
                    active
                      ? 'border-gold bg-gold text-espresso shadow-[0_8px_22px_rgba(198,164,108,0.28)]'
                      : 'border-gold/30 bg-[#170F0C] text-ivory/75 hover:border-gold hover:text-ivory'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Continuous Vertical Champagne-Gold Spine Runway */}
        <div className="relative mt-14 space-y-14 sm:mt-20 sm:space-y-20 lg:space-y-24">
          {/* Vertical Spine Line */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-8 left-[11px] top-8 w-px bg-gradient-to-b from-transparent via-gold/45 to-transparent lg:left-1/2"
          />

          {filteredDesserts.map((dessert, index) => (
            <SculpturalDessertNode
              key={dessert.id}
              dessert={dessert}
              index={index}
              onSelectDessert={onSelectDessert}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
