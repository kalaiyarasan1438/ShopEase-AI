import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Check, MapPin, CreditCard, ClipboardList, CheckCircle2 } from 'lucide-react';
import { selectCartItems, selectCartTotal, clearCart } from '@store/slices/cartSlice';
import { placeOrder } from '@store/slices/orderSlice';
import { formatCurrency } from '@utils/formatters';
import { SHIPPING_OPTIONS, PAYMENT_METHODS } from '@utils/constants';
import { addressRules, zipRules, cardNumberRules, cvvRules, expiryRules } from '@utils/validators';

const STEPS = [
  { label: 'Shipping', icon: MapPin },
  { label: 'Payment',  icon: CreditCard },
  { label: 'Review',   icon: ClipboardList },
  { label: 'Confirm',  icon: CheckCircle2 },
];

const inputCls = 'w-full bg-dark-surface2 border border-dark-border rounded-xl px-4 py-2.5 text-sm text-[var(--text)] placeholder-[var(--text3)] outline-none focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/10 transition-all';
const labelCls = 'block text-xs font-semibold text-[var(--text2)] uppercase tracking-wider mb-1.5';

function StepIndicator({ current }) {
  return (
    <div className="flex items-center mb-8">
      {STEPS.map(({ label, icon: Icon }, i) => (
        <React.Fragment key={label}>
          <div className="flex flex-col items-center">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
              i < current  ? 'bg-green-500 border-green-500 text-white' :
              i === current ? 'bg-brand-500 border-brand-500 text-white shadow-md shadow-brand-500/30' :
                             'bg-dark-surface2 border-dark-border text-[var(--text3)]'
            }`}>
              {i < current ? <Check size={14} /> : <Icon size={14} />}
            </div>
            <span className={`text-xs mt-1.5 font-medium ${i === current ? 'text-[var(--text)]' : 'text-[var(--text3)]'}`}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mx-3 mb-4 transition-colors duration-300 ${i < current ? 'bg-green-400' : 'bg-dark-border'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function Checkout() {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const items      = useSelector(selectCartItems);
  const subtotal   = useSelector(selectCartTotal);
  const [step,     setStep]    = useState(0);
  const [shipping, setShipping] = useState('STANDARD');
  const [payment,  setPayment]  = useState('CARD');
  const [placedOrder, setPlacedOrder] = useState(null);

  const shippingCost = SHIPPING_OPTIONS.find(s => s.id === shipping)?.price ?? 0;
  const tax   = subtotal * 0.08;
  const total = subtotal + shippingCost + tax;

  const { register, handleSubmit, formState: { errors }, getValues } = useForm({
    defaultValues: {
      shippingName: 'Alex Morgan',
      shippingAddressLine1: '123 Main Street',
      shippingCity: 'New York',
      shippingState: 'NY',
      shippingZip: '10001',
      shippingCountry: 'United States',
    }
  });

  const onSubmit = async (data) => {
    if (step < 2) { setStep(s => s + 1); return; }
    const result = await dispatch(placeOrder({
      ...data,
      paymentMethod: payment,
      shippingOption: shipping,
      items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
    }));
    if (placeOrder.fulfilled.match(result)) {
      setPlacedOrder(result.payload);
      dispatch(clearCart());
      setStep(3);
    }
  };

  if (items.length === 0 && step < 3) { navigate('/cart'); return null; }

  return (
    <div className="page-enter max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">Checkout</h1>
        <p className="text-[var(--text3)] text-sm mt-1">Complete your purchase securely</p>
      </div>

      <StepIndicator current={step} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: Steps ──────────────────────────────────────────────── */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">

            {/* STEP 0: Shipping */}
            {step === 0 && (
              <motion.div key="shipping" initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:20 }}>
                <div className="bg-dark-surface1 border border-dark-border rounded-2xl p-6 mb-4 shadow-sm">
                  <h2 className="font-semibold text-sm mb-5 text-[var(--text)] flex items-center gap-2">
                    <MapPin size={16} className="text-brand-500" /> Shipping Address
                  </h2>
                  <form id="checkout-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                      <label className={labelCls}>Full Name</label>
                      <input {...register('shippingName', { required: 'Name is required' })} className={inputCls} />
                      {errors.shippingName && <p className="text-red-500 text-xs mt-1">{errors.shippingName.message}</p>}
                    </div>
                    <div>
                      <label className={labelCls}>Address Line 1</label>
                      <input {...register('shippingAddressLine1', addressRules)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Address Line 2 (Optional)</label>
                      <input {...register('shippingAddressLine2')} placeholder="Apt, suite, unit..." className={inputCls} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>City</label>
                        <input {...register('shippingCity', { required: 'City is required' })} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>ZIP Code</label>
                        <input {...register('shippingZip', zipRules)} className={inputCls} />
                        {errors.shippingZip && <p className="text-red-500 text-xs mt-1">{errors.shippingZip.message}</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>State</label>
                        <input {...register('shippingState')} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Country</label>
                        <input {...register('shippingCountry')} className={inputCls} />
                      </div>
                    </div>
                  </form>
                </div>

                {/* Shipping options */}
                <div className="bg-dark-surface1 border border-dark-border rounded-2xl p-6 shadow-sm">
                  <h2 className="font-semibold text-sm mb-4 text-[var(--text)] flex items-center gap-2">
                    🚚 Delivery Method
                  </h2>
                  <div className="space-y-3">
                    {SHIPPING_OPTIONS.map(opt => (
                      <div
                        key={opt.id}
                        onClick={() => setShipping(opt.id)}
                        className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${
                          shipping === opt.id
                            ? 'border-brand-500 bg-brand-500/8 shadow-sm'
                            : 'border-dark-border bg-dark-surface2 hover:border-dark-border2'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${shipping === opt.id ? 'border-brand-500' : 'border-dark-border2'}`}>
                            {shipping === opt.id && <div className="w-2 h-2 rounded-full bg-brand-500" />}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-[var(--text)]">{opt.label} Shipping</p>
                            <p className="text-xs text-[var(--text3)]">{opt.desc}</p>
                          </div>
                        </div>
                        <span className={`font-semibold text-sm ${opt.price === 0 ? 'text-green-600' : 'text-[var(--text)]'}`}>
                          {opt.price === 0 ? 'Free' : formatCurrency(opt.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 1: Payment */}
            {step === 1 && (
              <motion.div key="payment" initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:20 }}>
                <div className="bg-dark-surface1 border border-dark-border rounded-2xl p-6 shadow-sm">
                  <h2 className="font-semibold text-sm mb-5 text-[var(--text)] flex items-center gap-2">
                    <CreditCard size={16} className="text-brand-500" /> Payment Method
                  </h2>
                  <div className="flex gap-2 mb-6">
                    {PAYMENT_METHODS.map(m => (
                      <button key={m.id} onClick={() => setPayment(m.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm border transition-all ${
                          payment === m.id
                            ? 'bg-brand-500/10 border-brand-500/40 text-brand-500 font-semibold'
                            : 'bg-dark-surface2 border-dark-border text-[var(--text2)] hover:border-dark-border2'
                        }`}>
                        {m.icon} {m.label}
                      </button>
                    ))}
                  </div>
                  {payment === 'CARD' && (
                    <div className="space-y-4">
                      <div>
                        <label className={labelCls}>Card Number</label>
                        <input {...register('cardNumber', cardNumberRules)} placeholder="4242 4242 4242 4242" className={inputCls} />
                        {errors.cardNumber && <p className="text-red-500 text-xs mt-1">{errors.cardNumber.message}</p>}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelCls}>Expiry (MM/YY)</label>
                          <input {...register('cardExpiry', expiryRules)} placeholder="12/26" className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>CVV</label>
                          <input {...register('cardCvv', cvvRules)} type="password" placeholder="•••" className={inputCls} />
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}>Cardholder Name</label>
                        <input {...register('cardName')} placeholder="Alex Morgan" className={inputCls} />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[var(--text3)] mt-2 p-3 bg-green-50 border border-green-200 rounded-xl">
                        🔒 Your card details are encrypted with 256-bit SSL
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* STEP 2: Review */}
            {step === 2 && (
              <motion.div key="review" initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:20 }}>
                <div className="bg-dark-surface1 border border-dark-border rounded-2xl overflow-hidden mb-4 shadow-sm">
                  <div className="px-6 py-4 border-b border-dark-border bg-dark-surface2">
                    <h2 className="font-semibold text-sm text-[var(--text)] flex items-center gap-2">
                      <ClipboardList size={15} className="text-brand-500" /> Review Your Order
                    </h2>
                  </div>
                  {items.map(item => (
                    <div key={item.productId} className="flex items-center gap-4 px-6 py-4 border-b border-dark-border last:border-none hover:bg-dark-surface2 transition-colors">
                      <div className="w-12 h-12 bg-dark-surface2 border border-dark-border rounded-xl flex items-center justify-center text-2xl">{item.emoji || '📦'}</div>
                      <div className="flex-1">
                        <p className="font-medium text-sm text-[var(--text)]">{item.name}</p>
                        <p className="text-xs text-[var(--text3)] mt-0.5">Qty: {item.quantity}</p>
                      </div>
                      <span className="font-bold text-sm text-[var(--text)]">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
                  ✅ Orders placed before 3:00 PM are processed same day
                </div>
              </motion.div>
            )}

            {/* STEP 3: Confirm */}
            {step === 3 && (
              <motion.div key="confirm" initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
                className="text-center py-14 bg-dark-surface1 border border-dark-border rounded-2xl shadow-sm">
                <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ type:'spring', delay:0.2 }}
                  className="text-7xl mb-5">🎉</motion.div>
                <h2 className="text-2xl font-bold tracking-tight mb-2 text-[var(--text)]">Order Placed!</h2>
                <p className="text-[var(--text2)] mb-1">Your order has been confirmed</p>
                <p className="text-brand-500 font-semibold mb-1">#ORD-{Math.floor(Math.random()*1000)+8000}</p>
                <p className="text-xs text-[var(--text3)] mb-8">Estimated delivery: Jan 18–20, 2024</p>
                <div className="flex gap-3 justify-center">
                  <button onClick={() => navigate('/orders/1/tracking')}
                    className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl text-sm transition-colors">
                    📍 Track Order
                  </button>
                  <button onClick={() => navigate('/')}
                    className="px-5 py-2.5 bg-dark-surface2 hover:bg-dark-surface3 border border-dark-border text-[var(--text2)] rounded-xl text-sm transition-all">
                    Continue Shopping
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Nav buttons */}
          {step < 3 && (
            <div className="flex justify-between mt-5">
              {step > 0 ? (
                <button onClick={() => setStep(s => s - 1)}
                  className="px-5 py-2.5 bg-dark-surface2 hover:bg-dark-surface3 border border-dark-border text-[var(--text2)] rounded-xl text-sm transition-all">
                  ← Back
                </button>
              ) : <div />}
              <button form="checkout-form" type="submit" onClick={step > 0 ? handleSubmit(onSubmit) : undefined}
                className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl text-sm transition-colors shadow-md shadow-brand-500/20">
                {step === 2 ? '✓ Place Order' : 'Continue →'}
              </button>
            </div>
          )}
        </div>

        {/* ── Right: Summary ────────────────────────────────────────────── */}
        {step < 3 && (
          <div className="bg-dark-surface1 border border-dark-border rounded-2xl p-5 h-fit sticky top-4 shadow-sm">
            <h3 className="font-bold text-sm mb-4 text-[var(--text)]">Order Summary</h3>
            <div className="space-y-3 mb-4">
              {items.map(item => (
                <div key={item.productId} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-dark-surface2 border border-dark-border rounded-lg flex items-center justify-center text-xl flex-shrink-0">
                    {item.emoji || '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate text-[var(--text)]">{item.name}</p>
                    <p className="text-xs text-[var(--text3)]">×{item.quantity}</p>
                  </div>
                  <span className="text-xs font-semibold text-[var(--text)]">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-dark-border pt-3 space-y-2 text-sm">
              <div className="flex justify-between text-[var(--text2)]"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between text-[var(--text2)]">
                <span>Shipping</span>
                <span className={shippingCost === 0 ? 'text-green-600' : ''}>{shippingCost === 0 ? 'Free' : formatCurrency(shippingCost)}</span>
              </div>
              <div className="flex justify-between text-[var(--text2)]"><span>Tax (8%)</span><span>{formatCurrency(tax)}</span></div>
              <div className="flex justify-between font-bold pt-2 border-t border-dark-border text-[var(--text)]">
                <span>Total</span><span className="text-brand-500">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
