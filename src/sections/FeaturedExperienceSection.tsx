import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowUpRight } from 'lucide-react';
import { FEATURED_DESSERT } from '../data/desserts';
import { DessertModelCanvas } from '../models/DessertModelCanvas';

gsap.registerPlugin(ScrollTrigger);

interface FeaturedExperienceSectionProps {
  onInspectFeatured: () => void;
}

const LAYERS = ['Raw Cocoa Veil', 'Mascarpone Cloud', 'Espresso Savoiardi'];

export function FeaturedExperienceSection({
  onInspectFeatured,
}: FeaturedExperienceSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const tiramisuScrollRef = useRef(0);

  useEffect(() => {
    if (!sectionRef.current) return;
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
        onUpdate: (self) => {
          tiramisuScrollRef.current = self.progress;
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="story"
      ref={sectionRef}
      className="relative overflow-hidden bg-espresso py-20 text-ivory sm:py-28"
    >
      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 px-5 sm:px-6 lg:grid-cols-12 lg:px-10">
        {/* Oversized 3D Tiramisu */}
        <div className="lg:col-span-7">
          <div className="rounded-[28px] border border-gold/30 bg-[#271813] p-4 shadow-editorial sm:p-6">
            <div className="h-[300px] w-full sm:h-[440px]">
              <DessertModelCanvas
                dessert={FEATURED_DESSERT}
                interactive
                enableZoom={false}
                autoRotate
                rotateSpeed={0.18}
                scaleMultiplier={1.22}
                lightingMood="espresso"
                scrollProgressRef={tiramisuScrollRef}
                scrollSpinTurns={1.1}
              />
            </div>
          </div>
        </div>

        {/* Ultra-Concise Editorial Philosophy + Featured Study */}
        <div className="lg:col-span-5">
          <p className="text-[10px] font-semibold uppercase tracking-editorial text-gold">
            Our Philosophy
          </p>
          <h2 className="mt-3 font-serif text-4xl font-medium leading-[1.08] text-ivory sm:text-5xl">
            Not Just Desserts. Little Pieces of Happiness.
          </h2>

          <div className="mt-7 flex flex-wrap gap-2">
            {LAYERS.map((layer) => (
              <span
                key={layer}
                className="rounded-full border border-gold/35 bg-ivory/5 px-3.5 py-1.5 text-[11px] uppercase tracking-luxe text-gold"
              >
                {layer}
              </span>
            ))}
          </div>

          <button
            type="button"
            onClick={onInspectFeatured}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3.5 text-xs font-semibold uppercase tracking-luxe text-espresso transition-colors hover:bg-ivory"
          >
            <span>Inspect Tiramisu</span>
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
