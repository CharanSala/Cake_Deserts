import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { AnimatePresence, motion } from 'framer-motion';
import { Eye } from 'lucide-react';
import { RECIPE_STAGES } from '../data/craftsmanship';
import { DessertItem, formatINR, SIGNATURE_CAKE_PRODUCT } from '../data/desserts';
import { RecipeCakeCanvas } from '../models/RecipeCakeCanvas';
import { useReducedMotion } from '../hooks/useReducedMotion';

gsap.registerPlugin(ScrollTrigger);

interface CraftsmanshipSectionProps {
  onInspectCake: (dessert: DessertItem) => void;
}

export function CraftsmanshipSection({ onInspectCake }: CraftsmanshipSectionProps) {
  const trackRef = useRef<HTMLElement>(null);
  const scrollProgressRef = useRef(0);
  const [activeIdx, setActiveIdx] = useState(0);
  const [progressPct, setProgressPct] = useState(0);
  const prefersReduced = useReducedMotion();

  const stage = RECIPE_STAGES[activeIdx];

  useEffect(() => {
    if (!trackRef.current) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: trackRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: (self) => {
          const p = self.progress;
          scrollProgressRef.current = p;
          setProgressPct(Math.round(p * 100));

          if (p < 0.20) setActiveIdx(0);
          else if (p < 0.42) setActiveIdx(1);
          else if (p < 0.65) setActiveIdx(2);
          else if (p < 0.84) setActiveIdx(3);
          else setActiveIdx(4);
        },
      });
    }, trackRef);

    return () => ctx.revert();
  }, []);

  const jumpToStage = (idx: number) => {
    const el = trackRef.current;
    if (!el) return;
    const fractions = [0.06, 0.30, 0.52, 0.73, 0.96];
    const top = window.scrollY + el.getBoundingClientRect().top;
    const scrollable = Math.max(0, el.offsetHeight - window.innerHeight);
    window.scrollTo({
      top: top + scrollable * (fractions[idx] ?? 0),
      behavior: 'smooth',
    });
  };

  return (
    <section
      id="craftsmanship"
      ref={trackRef}
      className="relative h-[420svh] overflow-x-clip border-t border-gold/20 bg-[#0B0706]"
    >
      {/* Full-Viewport Dark Sticky 3D Cake-Making Theater */}
      <div className="sticky top-0 flex h-[100svh] flex-col justify-between px-4 pb-5 pt-16 sm:px-8 sm:pb-7 sm:pt-20 lg:px-12">
        {/* Top Minimal Step Header + Display Price Study Trigger */}
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={stage.step}
              initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
              className="min-w-0"
            >
              <span className="text-[10px] font-semibold uppercase tracking-editorial text-gold sm:text-[11px]">
                {stage.step} / 05 · {stage.action}
              </span>
              <h2 className="truncate font-serif text-2xl font-medium text-ivory sm:text-4xl">
                {stage.title}
              </h2>
            </motion.div>
          </AnimatePresence>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => onInspectCake(SIGNATURE_CAKE_PRODUCT)}
              className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-[#1B110E] px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-luxe text-gold transition hover:border-gold hover:bg-gold hover:text-espresso sm:px-4 sm:py-2"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Showpiece · {formatINR(SIGNATURE_CAKE_PRODUCT.price)}</span>
            </button>
            <span className="hidden rounded-full border border-gold/25 bg-[#150E0B] px-3.5 py-1.5 font-serif text-base text-gold sm:inline-block">
              {progressPct}%
            </span>
          </div>
        </div>

        {/* Center: Obsidian Exhibition Dome with Brass Registration Corners */}
        <div className="relative mx-auto my-2 flex min-h-0 w-full max-w-5xl flex-1 items-center justify-center overflow-hidden rounded-[28px] border border-gold/25 bg-[radial-gradient(ellipse_at_center,#251611_0%,#130B08_62%,#0B0706_100%)] shadow-[0_28px_80px_rgba(0,0,0,0.65)] sm:rounded-[36px]">
          {/* Museum Corner Marks */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-4 h-4 w-4 border-l border-t border-gold/50 sm:left-6 sm:top-6"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-4 top-4 h-4 w-4 border-r border-t border-gold/50 sm:right-6 sm:top-6"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-4 left-4 h-4 w-4 border-b border-l border-gold/50 sm:bottom-6 sm:left-6"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-4 right-4 h-4 w-4 border-b border-r border-gold/50 sm:bottom-6 sm:right-6"
          />

          <RecipeCakeCanvas
            scrollProgressRef={scrollProgressRef}
            activeStepIdx={activeIdx}
            stepTitle={stage.title}
          />
        </div>

        {/* Bottom: 1-Line Caption + 5-Stage Scrub Pills */}
        <div className="mx-auto w-full max-w-5xl space-y-2.5 pt-1">
          <AnimatePresence mode="wait">
            <motion.p
              key={stage.step}
              initial={prefersReduced ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-center text-xs text-ivory/75 sm:text-sm"
            >
              {stage.caption}
            </motion.p>
          </AnimatePresence>

          <div className="h-1 w-full overflow-hidden rounded-full bg-ivory/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-chocolate via-gold to-rose transition-all duration-100"
              style={{ width: `${Math.max(6, progressPct)}%` }}
            />
          </div>

          <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5">
            {RECIPE_STAGES.map((item, idx) => {
              const active = idx === activeIdx;
              const completed = idx < activeIdx;
              return (
                <button
                  key={item.step}
                  type="button"
                  onClick={() => jumpToStage(idx)}
                  className={`rounded-full py-2 text-[10px] font-semibold uppercase tracking-luxe transition sm:py-2.5 sm:text-[11px] ${
                    active
                      ? 'bg-gold text-espresso shadow-[0_6px_18px_rgba(198,164,108,0.3)]'
                      : completed
                      ? 'border border-gold/30 bg-gold/15 text-ivory'
                      : 'border border-gold/15 bg-[#170F0C] text-ivory/65 hover:border-gold/35 hover:text-ivory'
                  }`}
                >
                  {item.action}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
