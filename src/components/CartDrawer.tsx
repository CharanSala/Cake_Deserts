import { FormEvent, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle2,
  MessageCircle,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react';
import { CartItem } from '../hooks/useCart';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  subtotal: number;
  onUpdateQuantity: (key: string, delta: number) => void;
  onRemoveItem: (key: string) => void;
  onClearCart: () => void;
}

interface ConfirmedReceipt {
  orderId: string;
  customerName: string;
  fulfillment: 'pickup' | 'delivery';
  total: number;
  itemCount: number;
  timeSlot: string;
}

export function CartDrawer({
  open,
  onClose,
  items,
  subtotal,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}: CartDrawerProps) {
  const prefersReduced = useReducedMotion();
  const [fulfillment, setFulfillment] = useState<'pickup' | 'delivery'>('pickup');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [timeSlot, setTimeSlot] = useState('Today · 4:00 PM – 6:00 PM');
  const [giftNote, setGiftNote] = useState('');
  const [receipt, setReceipt] = useState<ConfirmedReceipt | null>(null);

  const deliveryFee = fulfillment === 'delivery' && items.length > 0 ? 8 : 0;
  const total = subtotal + deliveryFee;

  useEffect(() => {
    if (!open) return;
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
  }, [open, onClose]);

  const buildOrderSummaryText = () => {
    const lines = items.map(
      (i) =>
        `• ${i.quantity}x ${i.name} (${i.variantLabel}) — $${(
          i.unitPrice * i.quantity
        ).toFixed(2)}`,
    );
    return [
      `Bonjour ÉCLAT Boutique Order`,
      `Name: ${customerName || 'Guest'}`,
      customerPhone ? `Phone: ${customerPhone}` : null,
      `Fulfillment: ${
        fulfillment === 'pickup'
          ? 'Boutique Salon Pickup (Free)'
          : 'Chilled Courier Delivery ($8.00)'
      }`,
      `Window: ${timeSlot}`,
      giftNote ? `Gift Note: "${giftNote}"` : null,
      ``,
      `Items:`,
      ...lines,
      ``,
      `Total: $${total.toFixed(2)}`,
    ]
      .filter(Boolean)
      .join('\n');
  };

  const handleConfirmOrder = (e: FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    const orderId = `ECL-${Math.floor(100000 + Math.random() * 900000)}`;
    const count = items.reduce((s, i) => s + i.quantity, 0);

    setReceipt({
      orderId,
      customerName: customerName.trim() || 'Valued Guest',
      fulfillment,
      total,
      itemCount: count,
      timeSlot,
    });
    onClearCart();
  };

  const handleWhatsAppCheckout = () => {
    const encoded = encodeURIComponent(buildOrderSummaryText());
    window.open(`https://wa.me/15550192840?text=${encoded}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Shopping Bag"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReduced ? 0.05 : 0.25 }}
          className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.aside
            initial={prefersReduced ? { x: 0 } : { x: '100%' }}
            animate={{ x: 0 }}
            exit={prefersReduced ? { x: 0 } : { x: '100%' }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="flex h-full w-full max-w-md flex-col border-l border-gold/30 bg-[#1B110E] text-ivory shadow-editorial"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gold/25 px-6 py-5">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="h-5 w-5 text-gold" />
                <div>
                  <h2 className="font-serif text-2xl font-medium text-ivory">
                    Your ÉCLAT Bag
                  </h2>
                  <p className="text-[10px] uppercase tracking-editorial text-gold">
                    Complimentary Gold-Foil Packaging
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setReceipt(null);
                  onClose();
                }}
                aria-label="Close shopping bag"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gold/30 bg-[#261814] text-ivory hover:border-gold"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {receipt ? (
                <div className="rounded-3xl border border-gold/40 bg-[#231612] p-6 text-center">
                  <CheckCircle2 className="mx-auto h-11 w-11 text-gold" />
                  <p className="mt-3 text-[10px] font-semibold uppercase tracking-editorial text-gold">
                    Boutique Order Reserved
                  </p>
                  <h3 className="mt-1 font-serif text-3xl text-ivory">
                    Merci, {receipt.customerName}
                  </h3>
                  <p className="mt-2 text-xs text-ivory/75">
                    Reference <span className="font-semibold text-gold">{receipt.orderId}</span>
                  </p>

                  <div className="mt-5 space-y-2 border-y border-gold/20 py-4 text-xs text-ivory/80">
                    <div className="flex justify-between">
                      <span>Pieces</span>
                      <span>{receipt.itemCount} items</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fulfillment</span>
                      <span className="capitalize">{receipt.fulfillment}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Window</span>
                      <span>{receipt.timeSlot}</span>
                    </div>
                    <div className="flex justify-between pt-1 font-serif text-lg text-gold">
                      <span>Total</span>
                      <span>${receipt.total.toFixed(2)}</span>
                    </div>
                  </div>

                  <p className="mt-4 text-[11px] leading-relaxed text-ivory/65">
                    This is a static frontend reservation preview. Pay at the salon counter or confirm via WhatsApp.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setReceipt(null);
                      onClose();
                    }}
                    className="mt-5 w-full rounded-full bg-gold py-3 text-xs font-semibold uppercase tracking-luxe text-espresso hover:bg-ivory"
                  >
                    Continue Browsing
                  </button>
                </div>
              ) : items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center py-14 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-gold/30 bg-[#231612]">
                    <ShoppingBag className="h-7 w-7 text-gold/75" />
                  </div>
                  <h3 className="mt-4 font-serif text-2xl text-ivory">
                    Your bag is empty
                  </h3>
                  <p className="mt-1.5 max-w-xs text-xs text-ivory/65">
                    Select any handcrafted pastry, chocolate box, or the Signature Layer Cake from our boutique.
                  </p>
                  <a
                    href="#collections"
                    onClick={onClose}
                    className="mt-6 rounded-full bg-gold px-6 py-3 text-[11px] font-semibold uppercase tracking-luxe text-espresso hover:bg-ivory"
                  >
                    Explore Menu
                  </a>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Line Items */}
                  <ul className="space-y-3.5">
                    {items.map((item) => (
                      <li
                        key={item.key}
                        className="flex items-center gap-3.5 rounded-2xl border border-gold/25 bg-[#231612] p-3"
                      >
                        <img
                          src={item.fallbackImage}
                          alt={item.name}
                          className="h-16 w-16 shrink-0 rounded-xl border border-gold/20 bg-[#180F0C] object-contain p-1"
                        />

                        <div className="min-w-0 flex-1">
                          <h4 className="truncate font-serif text-lg text-ivory">
                            {item.name}
                          </h4>
                          <p className="text-[11px] text-gold">{item.variantLabel}</p>
                          <div className="mt-2 flex items-center justify-between">
                            <div className="inline-flex items-center rounded-full border border-gold/30 bg-[#160E0B]">
                              <button
                                type="button"
                                onClick={() => onUpdateQuantity(item.key, -1)}
                                aria-label={`Decrease quantity of ${item.name}`}
                                className="p-1.5 text-ivory/80 hover:text-gold"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="px-2.5 text-xs font-medium text-ivory">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => onUpdateQuantity(item.key, 1)}
                                aria-label={`Increase quantity of ${item.name}`}
                                className="p-1.5 text-ivory/80 hover:text-gold"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>

                            <span className="font-serif text-lg text-ivory">
                              ${(item.unitPrice * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.key)}
                          aria-label={`Remove ${item.name}`}
                          className="self-start p-1 text-ivory/45 transition-colors hover:text-rose"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>

                  {/* Fulfillment & Order Form */}
                  <form id="boutique-order-form" onSubmit={handleConfirmOrder} className="space-y-4 border-t border-gold/20 pt-5">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-editorial text-gold">
                        Fulfillment
                      </span>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setFulfillment('pickup')}
                          className={`rounded-xl border px-3 py-2.5 text-xs font-medium transition ${
                            fulfillment === 'pickup'
                              ? 'border-gold bg-gold/20 text-gold'
                              : 'border-gold/25 bg-[#231612] text-ivory/75'
                          }`}
                        >
                          Salon Pickup · Free
                        </button>
                        <button
                          type="button"
                          onClick={() => setFulfillment('delivery')}
                          className={`rounded-xl border px-3 py-2.5 text-xs font-medium transition ${
                            fulfillment === 'delivery'
                              ? 'border-gold bg-gold/20 text-gold'
                              : 'border-gold/25 bg-[#231612] text-ivory/75'
                          }`}
                        >
                          Chilled Delivery · $8
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-3">
                      <input
                        type="text"
                        required
                        placeholder="Your Name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full rounded-xl border border-gold/25 bg-[#231612] px-3.5 py-2.5 text-xs text-ivory placeholder:text-ivory/40 focus:border-gold focus:outline-none"
                      />
                      <input
                        type="tel"
                        placeholder="Phone / WhatsApp Number"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full rounded-xl border border-gold/25 bg-[#231612] px-3.5 py-2.5 text-xs text-ivory placeholder:text-ivory/40 focus:border-gold focus:outline-none"
                      />
                      <select
                        value={timeSlot}
                        onChange={(e) => setTimeSlot(e.target.value)}
                        aria-label="Preferred pickup or delivery window"
                        className="w-full rounded-xl border border-gold/25 bg-[#231612] px-3.5 py-2.5 text-xs text-ivory focus:border-gold focus:outline-none"
                      >
                        <option>Today · 4:00 PM – 6:00 PM</option>
                        <option>Today · 6:00 PM – 8:00 PM</option>
                        <option>Tomorrow · 11:00 AM – 1:00 PM</option>
                        <option>Tomorrow · 3:00 PM – 5:00 PM</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Optional complimentary gift card message"
                        value={giftNote}
                        onChange={(e) => setGiftNote(e.target.value)}
                        className="w-full rounded-xl border border-gold/25 bg-[#231612] px-3.5 py-2.5 text-xs text-ivory placeholder:text-ivory/40 focus:border-gold focus:outline-none"
                      />
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Footer Totals & Checkout CTAs */}
            {items.length > 0 && !receipt && (
              <div className="border-t border-gold/25 bg-[#160E0B] px-6 py-5">
                <div className="space-y-1.5 text-xs text-ivory/75">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{fulfillment === 'pickup' ? 'Salon Pickup' : 'Chilled Courier'}</span>
                    <span>{deliveryFee === 0 ? 'Complimentary' : `$${deliveryFee.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between border-t border-gold/20 pt-2 font-serif text-xl text-ivory">
                    <span>Total</span>
                    <span className="text-gold">${total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="mt-4 grid gap-2.5">
                  <button
                    type="submit"
                    form="boutique-order-form"
                    className="w-full rounded-full bg-gold py-3.5 text-xs font-semibold uppercase tracking-luxe text-espresso transition-colors hover:bg-ivory"
                  >
                    Confirm Boutique Order
                  </button>
                  <button
                    type="button"
                    onClick={handleWhatsAppCheckout}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-gold/40 bg-[#231612] py-3 text-[11px] font-medium uppercase tracking-luxe text-ivory transition-colors hover:border-gold"
                  >
                    <MessageCircle className="h-3.5 w-3.5 text-gold" />
                    <span>Send Order via WhatsApp</span>
                  </button>
                </div>
              </div>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
