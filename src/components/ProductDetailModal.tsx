import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  RotateCcw,
  RotateCw,
  Sparkles,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { DessertItem, DESSERTS, formatINR } from '../data/desserts';
import { DessertModelCanvas } from '../models/DessertModelCanvas';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface ProductDetailModalProps {
  dessert: DessertItem | null;
  onClose: () => void;
  onSelectDessert: (dessert: DessertItem) => void;
}

export function ProductDetailModal({
  dessert,
  onClose,
  onSelectDessert,
}: ProductDetailModalProps) {
  const prefersReduced = useReducedMotion();
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [zoomDelta, setZoomDelta] = useState(0);
  const [resetSignal, setResetSignal] = useState(0);

  useEffect(() => {
    setSelectedVariantIdx(0);
    setZoomDelta(0);
    setResetSignal((s) => s + 1);
  }, [dessert?.id]);

  useEffect(() => {
    if (!dessert) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [dessert, onClose]);

  const currentIdx = dessert ? DESSERTS.findIndex((d) => d.id === dessert.id) : -1;
  const handleStep = (delta: number) => {
    if (currentIdx < 0) return;
    const nextIdx = (currentIdx + delta + DESSERTS.length) % DESSERTS.length;
    onSelectDessert(DESSERTS[nextIdx]);
  };

  const activeVariant =
    dessert?.variants[selectedVariantIdx] ?? dessert?.variants[0];

  return (
    <AnimatePresence>
      {dessert && activeVariant && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-dessert-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReduced ? 0.05 : 0.28 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md sm:p-6 lg:p-10"
          onClick={onClose}
        >
          <motion.div
            initial={prefersReduced ? { opacity: 1 } : { opacity: 0, scale: 0.96, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 10 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative grid max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-gold/35 bg-[#160E0B] text-ivory shadow-[0_32px_90px_rgba(0,0,0,0.75)] lg:grid-cols-12 lg:overflow-hidden"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dessert details"
              className="absolute right-4 top-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-gold/35 bg-[#0E0807]/90 text-ivory transition-colors hover:border-gold hover:text-gold"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Left Obsidian 3D Inspection Studio */}
            <div className="relative flex min-h-[300px] flex-col justify-between bg-[radial-gradient(circle_at_50%_45%,#261712_0%,#110A08_70%,#0B0706_100%)] p-5 sm:min-h-[380px] lg:col-span-7 lg:min-h-[540px] lg:p-7">
              <div className="flex items-center justify-between gap-2 pr-12 lg:pr-0">
                <span className="text-[10px] font-medium uppercase tracking-editorial text-gold">
                  No. {dessert.number} — 3D Studio Study
                </span>

                {/* Interactive Camera Zoom & Reset Toolbar */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setZoomDelta((z) => z - 1)}
                    aria-label="Zoom out 3D model"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gold/30 bg-[#1B110E]/90 text-ivory transition hover:border-gold hover:text-gold"
                  >
                    <ZoomOut className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomDelta((z) => z + 1)}
                    aria-label="Zoom in 3D model"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gold/30 bg-[#1B110E]/90 text-ivory transition hover:border-gold hover:text-gold"
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setResetSignal((s) => s + 1)}
                    aria-label="Reset camera view"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gold/30 bg-[#1B110E]/90 text-ivory transition hover:border-gold hover:text-gold"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="relative my-2 h-[260px] w-full sm:h-[340px] lg:h-[420px]">
                <DessertModelCanvas
                  dessert={dessert}
                  interactive
                  enableZoom
                  autoRotate
                  rotateSpeed={0.22}
                  scaleMultiplier={1.15}
                  lightingMood="espresso"
                  zoomDelta={zoomDelta}
                  resetSignal={resetSignal}
                  eager
                />
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-gold/20 pt-3 text-[10px] uppercase tracking-luxe text-ivory/70">
                <span className="inline-flex items-center gap-1.5">
                  <RotateCw className="h-3.5 w-3.5 text-gold" />
                  Drag to orbit · Scroll or +/− to zoom
                </span>
                {currentIdx >= 0 && (
                  <div className="flex items-center gap-2">
                    <span className="mr-1 font-serif text-xs text-gold/80">
                      {dessert.number} / 10
                    </span>
                    <button
                      type="button"
                      onClick={() => handleStep(-1)}
                      aria-label="Previous dessert"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gold/30 bg-[#1B110E] text-ivory hover:border-gold hover:text-gold"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStep(1)}
                      aria-label="Next dessert"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gold/30 bg-[#1B110E] text-ivory hover:border-gold hover:text-gold"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Editorial Monograph & Menu Display */}
            <div className="flex flex-col justify-between p-6 sm:p-8 lg:col-span-5 lg:overflow-y-auto">
              <div>
                <p className="text-[10px] uppercase tracking-editorial text-gold">
                  {dessert.frenchSubtitle}
                </p>
                <div className="mt-1.5 flex items-baseline justify-between gap-3">
                  <h3
                    id="modal-dessert-title"
                    className="font-serif text-3xl font-medium leading-tight text-ivory"
                  >
                    {dessert.name}
                  </h3>
                  <span className="shrink-0 font-serif text-2xl text-gold">
                    {formatINR(activeVariant.price)}
                  </span>
                </div>

                <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-gold/25 bg-gold/10 px-3 py-1 text-[10px] uppercase tracking-luxe text-gold">
                  <Sparkles className="h-3 w-3" />
                  <span>{dessert.craftDetail}</span>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-ivory/75">
                  {dessert.fullDescription}
                </p>

                {/* Presentation Menu Guide (Display Only) */}
                <div className="mt-6">
                  <p className="text-[10px] font-semibold uppercase tracking-editorial text-gold">
                    Menu Presentations
                  </p>
                  <div className="mt-2.5 grid gap-2">
                    {dessert.variants.map((variant, idx) => {
                      const active = idx === selectedVariantIdx;
                      return (
                        <button
                          key={variant.label}
                          type="button"
                          onClick={() => setSelectedVariantIdx(idx)}
                          className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-xs transition ${
                            active
                              ? 'border-gold bg-gold/15 text-ivory'
                              : 'border-gold/25 bg-[#110A08] text-ivory/75 hover:border-gold/55'
                          }`}
                        >
                          <span>{variant.label}</span>
                          <span className="font-semibold text-gold">
                            {formatINR(variant.price)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tasting Notes & Ingredients */}
                <div className="mt-6">
                  <p className="text-[10px] font-semibold uppercase tracking-editorial text-gold">
                    Tasting & Composition
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {dessert.flavorNotes.map((note) => (
                      <span
                        key={note}
                        className="rounded-full border border-rose/35 bg-rose/10 px-3 py-1 text-[11px] text-rose"
                      >
                        {note}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-ivory/65">
                    {dessert.ingredients.join(' · ')}
                  </p>
                </div>
              </div>

              {/* Clean Salon Concierge / Close Footer (No Bag) */}
              <div className="mt-7 flex items-center gap-3 border-t border-gold/20 pt-5">
                <a
                  href={`https://wa.me/919820012340?text=${encodeURIComponent(
                    `Bonjour ÉCLAT — Inquiry about ${dessert.name} (${activeVariant.label} · ${formatINR(
                      activeVariant.price,
                    )})`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-gold/40 bg-[#1B110E] py-3 text-[11px] font-semibold uppercase tracking-luxe text-gold transition-colors hover:border-gold hover:bg-gold hover:text-espresso"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>Salon Inquiry</span>
                </a>

                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-gold/20 px-5 py-3 text-[11px] font-medium uppercase tracking-luxe text-ivory/75 transition-colors hover:border-gold/50 hover:text-ivory"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
