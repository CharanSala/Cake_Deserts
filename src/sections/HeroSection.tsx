import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ArrowDown, Layers } from 'lucide-react';
import { RecipeCakeCanvas } from '../models/RecipeCakeCanvas';
import { useReducedMotion } from '../hooks/useReducedMotion';

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (prefersReduced || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from('.hero-name-reveal', {
        y: 26,
        opacity: 0,
        duration: 1.0,
        stagger: 0.11,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [prefersReduced]);

  return (
    <section
      id="home"
      ref={sectionRef}
      className="atelier-grain relative flex min-h-[100svh] flex-col items-center justify-center overflow-x-clip bg-[radial-gradient(ellipse_at_top,#21130E_0%,#0E0807_58%,#0B0706_100%)] px-5 pb-10 pt-20 text-center sm:pt-24"
    >
      {/* Orbital Champagne Astrolabe Rings */}
      <div
        aria-hidden="true"
        className="animate-orbit-slow pointer-events-none absolute left-1/2 top-1/2 h-[350px] w-[350px] rounded-full border border-dashed border-gold/20 sm:h-[560px] sm:w-[560px] lg:h-[680px] lg:w-[680px]"
      >
        <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-gold/65 shadow-[0_0_12px_rgba(198,164,108,0.85)]" />
        <span className="absolute -bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-rose/60" />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[290px] w-[290px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold/25 bg-[radial-gradient(circle,rgba(198,164,108,0.12)_0%,rgba(11,7,6,0)_72%)] sm:h-[460px] sm:w-[460px] lg:h-[540px] lg:w-[540px]"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center">
        {/* Haute Patisserie Crest Label */}
        <div className="hero-name-reveal inline-flex items-center gap-2.5 rounded-full border border-gold/25 bg-[#170F0C]/80 px-4 py-1.5 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-gold" />
          <p className="text-[9px] font-semibold uppercase tracking-[0.34em] text-gold sm:text-[10px]">
            Maison de Pâtisserie • 3D Exhibition
          </p>
        </div>

        {/* Iconic Brand Name Highlight */}
        <div className="hero-name-reveal mt-4 flex w-full items-center justify-center gap-4 sm:mt-5 sm:gap-9">
          <span className="h-px w-8 bg-gradient-to-r from-transparent via-gold/65 to-gold sm:w-24" />
          <h1 className="bg-gradient-to-b from-[#FFFDF9] via-[#F7EBDA] to-[#C6A46C] bg-clip-text font-serif text-[64px] font-medium leading-none tracking-[0.22em] text-transparent drop-shadow-[0_12px_32px_rgba(0,0,0,0.65)] sm:text-[112px] lg:text-[142px]">
            ÉCLAT
          </h1>
          <span className="h-px w-8 bg-gradient-to-l from-transparent via-gold/65 to-gold sm:w-24" />
        </div>

        <p className="hero-name-reveal mt-1.5 font-serif text-xl italic tracking-wide text-rose sm:text-3xl">
          The Art of Desserts
        </p>

        {/* Sculpted Open-Stage 3D Cake Preview */}
        <div className="hero-name-reveal relative mt-4 w-full max-w-[300px] sm:mt-6 sm:max-w-[360px]">
          <div className="h-[210px] w-full sm:h-[260px]">
            <RecipeCakeCanvas
              fixedProgress={1}
              activeStepIdx={4}
              stepTitle="ÉCLAT Signature Cake"
            />
          </div>
          {/* Minimalist Plinth Reflection Line */}
          <div
            aria-hidden="true"
            className="mx-auto -mt-2 h-px w-48 bg-gradient-to-r from-transparent via-gold/55 to-transparent"
          />
        </div>

        {/* Exhibition Action Controls */}
        <div className="hero-name-reveal mt-6 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#craftsmanship"
            className="group inline-flex items-center gap-2.5 rounded-full bg-gold px-6 py-3 text-[10px] font-semibold uppercase tracking-editorial text-espresso shadow-[0_14px_32px_rgba(198,164,108,0.22)] transition-all hover:bg-ivory sm:px-7 sm:py-3.5 sm:text-[11px]"
          >
            <span>Scroll to Craft Cake</span>
            <ArrowDown className="h-3.5 w-3.5 animate-bounce text-espresso" />
          </a>

          <a
            href="#collections"
            className="inline-flex items-center gap-2 rounded-full border border-gold/35 bg-[#1B110E]/85 px-5 py-3 text-[10px] font-medium uppercase tracking-editorial text-ivory backdrop-blur-sm transition-colors hover:border-gold hover:text-gold sm:px-6 sm:py-3.5 sm:text-[11px]"
          >
            <Layers className="h-3.5 w-3.5 text-gold" />
            <span>10 3D Creations</span>
          </a>
        </div>
      </div>
    </section>
  );
}
