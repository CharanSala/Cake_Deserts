import { useState } from 'react';
import { Maximize2, Moon, RotateCcw, Sun, ZoomIn, ZoomOut } from 'lucide-react';
import { DessertItem, DESSERTS } from '../data/desserts';
import { DessertModelCanvas } from '../models/DessertModelCanvas';

interface InteractiveShowcaseSectionProps {
  activeDessert: DessertItem;
  onChangeDessert: (dessert: DessertItem) => void;
  onInspectModal: (dessert: DessertItem) => void;
}

export function InteractiveShowcaseSection({
  activeDessert,
  onChangeDessert,
  onInspectModal,
}: InteractiveShowcaseSectionProps) {
  const [zoomDelta, setZoomDelta] = useState(0);
  const [resetSignal, setResetSignal] = useState(0);
  const [lightingMood, setLightingMood] = useState<'ivory' | 'espresso'>('ivory');

  const isEspresso = lightingMood === 'espresso';

  return (
    <section
      id="showcase"
      className="border-t border-gold/25 bg-ivory py-16 sm:py-24"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-editorial text-chocolate">
              3D Tasting Table
            </p>
            <h2 className="mt-2 font-serif text-3xl font-medium text-espresso sm:text-5xl">
              Atelier Studio
            </h2>
          </div>

          <div className="inline-flex rounded-full border border-gold/35 bg-cream p-1">
            <button
              type="button"
              onClick={() => setLightingMood('ivory')}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[10px] font-medium uppercase tracking-luxe transition ${
                !isEspresso ? 'bg-espresso text-cream' : 'text-espresso/75'
              }`}
            >
              <Sun className="h-3.5 w-3.5" />
              <span>Daylight</span>
            </button>
            <button
              type="button"
              onClick={() => setLightingMood('espresso')}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[10px] font-medium uppercase tracking-luxe transition ${
                isEspresso ? 'bg-espresso text-cream' : 'text-espresso/75'
              }`}
            >
              <Moon className="h-3.5 w-3.5 text-gold" />
              <span>Candlelight</span>
            </button>
          </div>
        </div>

        {/* Quick 10-Dessert Pill Selector */}
        <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto pb-2">
          {DESSERTS.map((item) => {
            const active = item.id === activeDessert.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChangeDessert(item)}
                className={`shrink-0 rounded-full border px-4 py-2 text-xs font-medium transition ${
                  active
                    ? 'border-espresso bg-espresso text-cream'
                    : 'border-gold/35 bg-cream text-espresso/85 hover:border-gold'
                }`}
              >
                <span className="mr-1.5 text-[10px] text-gold">{item.number}</span>
                {item.name.split(' ').slice(-2).join(' ')}
              </button>
            );
          })}
        </div>

        {/* Focused 3D Viewport */}
        <div
          className={`mt-4 overflow-hidden rounded-[28px] border p-4 transition-colors duration-500 sm:p-6 ${
            isEspresso
              ? 'border-gold/35 bg-espresso text-ivory'
              : 'border-gold/35 bg-cream text-espresso'
          }`}
        >
          <div className="flex items-center justify-between gap-3 pb-2">
            <div>
              <span className="text-[10px] uppercase tracking-editorial text-gold">
                {activeDessert.number} · {activeDessert.frenchSubtitle}
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl">{activeDessert.name}</h3>
            </div>
            <button
              type="button"
              onClick={() => onInspectModal(activeDessert)}
              aria-label="Open recipe notes"
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition ${
                isEspresso
                  ? 'border-gold/35 bg-ivory/10 text-ivory hover:bg-gold hover:text-espresso'
                  : 'border-espresso/20 bg-ivory text-espresso hover:border-gold'
              }`}
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>

          <div className="h-[310px] w-full sm:h-[430px]">
            <DessertModelCanvas
              dessert={activeDessert}
              interactive
              enableZoom={false}
              autoRotate
              rotateSpeed={0.22}
              scaleMultiplier={1.18}
              lightingMood={lightingMood}
              eager
              keepMounted
              zoomDelta={zoomDelta}
              resetSignal={resetSignal}
            />
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-gold/25 pt-4">
            <span className="text-[10px] uppercase tracking-editorial opacity-70">
              Drag to rotate
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setZoomDelta((z) => z + 1)}
                aria-label="Zoom in"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gold/35 transition hover:border-gold"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoomDelta((z) => z - 1)}
                aria-label="Zoom out"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gold/35 transition hover:border-gold"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setResetSignal((r) => r + 1)}
                aria-label="Reset camera"
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-gold/35 px-3.5 text-[10px] uppercase tracking-luxe transition hover:border-gold"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
