import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { ProductCard } from './components/ProductCard';
import { ProductDetail } from './components/ProductDetail';
import { QuantityModal } from './components/QuantityModal';
import { Cart } from './components/Cart';
import { Checkout } from './components/Checkout';
import { Toast } from './components/Toast';
import { useCart } from './contexts/CartContext';
import { useLanguage } from './contexts/LanguageContext';
import { supabase, Product } from './lib/supabase';
import { isOutOfStock } from './lib/outOfStock';
import { Loader, Mail, Send, Facebook, Instagram, Clock, CheckCircle, Lock, Zap, Truck, Shield, ChevronDown, ChevronUp } from 'lucide-react';

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quickAddProduct, setQuickAddProduct] = useState<Product | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const { addToCart } = useCart();
  const { t } = useLanguage();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const [productsResult, tiersResult] = await Promise.all([
        supabase.from('products').select('*').eq('is_active', true).order('display_order'),
        supabase.from('product_price_tiers').select('*').order('quantity'),
      ]);

      if (productsResult.error) throw productsResult.error;
      if (tiersResult.error) throw tiersResult.error;

      const tiersByProduct = new Map<string, typeof tiersResult.data>();
      for (const tier of tiersResult.data ?? []) {
        const arr = tiersByProduct.get(tier.product_id) ?? [];
        arr.push(tier);
        tiersByProduct.set(tier.product_id, arr);
      }

      const productsWithTiers = (productsResult.data ?? []).map(product => ({
        ...product,
        price_tiers: tiersByProduct.get(product.id) ?? [],
      }));

      setProducts(productsWithTiers);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseToast = useCallback(() => setShowToast(false), []);

  const handleAddToCart = (product: Product, quantity = 1) => {
    if (isOutOfStock(product)) return;
    addToCart(product, quantity);
    setToastMessage(`${product.name} ${t('addedToCart')}`);
    setShowToast(true);
  };

  const handleCheckout = () => {
    setShowCart(false);
    setShowCheckout(true);
  };

  const handleCheckoutClose = () => {
    setShowCheckout(false);
  };

  const [openPayment, setOpenPayment] = useState<number | null>(null);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const togglePayment = (idx: number) => {
    setOpenPayment(prev => prev === idx ? null : idx);
  };

  return (
    <div className="min-h-screen bg-[#070f1a] relative">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/8 rounded-full" style={{ filter: 'blur(80px)' }}></div>
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-blue-500/6 rounded-full" style={{ filter: 'blur(80px)' }}></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-cyan-400/5 rounded-full" style={{ filter: 'blur(80px)' }}></div>
      </div>

      <Header onCartClick={() => setShowCart(true)} onLogoClick={scrollToTop} />

      <div className="relative z-10 w-full px-3 sm:px-6 md:px-10 pt-2">
        <img
          src="https://ghupwlhgageynpdegxkf.supabase.co/storage/v1/object/public/produktunuotraukos/pradziaatidarymas1.jpeg"
          alt="Peptidai Lietuva"
          className="w-full h-auto block rounded-xl sm:rounded-2xl"
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
      </div>

      <main className="container mx-auto px-4 py-8 sm:py-12 relative z-10">

        <div className="text-center mb-8 sm:mb-12">
          <p className="text-sm sm:text-base md:text-lg font-semibold text-white max-w-xl mx-auto leading-relaxed mb-6 sm:mb-8 px-2">
            {t('heroSubtitle')}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm">
            <div className="flex items-center gap-1.5 text-white/60">
              <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
              <span>{t('heroStat1')}</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/60">
              <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
              <span>{t('heroStat2')}</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/60">
              <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
              <span>{t('heroStat3')}</span>
            </div>
          </div>
        </div>

        <div className="text-left mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight">
            {t('productsTitle')}
          </h2>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Loader className="w-8 h-8 text-cyan-400 animate-spin" />
            <p className="text-white/40 text-sm">{t('loading')}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  onViewDetails={setSelectedProduct}
                  onQuickAdd={setQuickAddProduct}
                />
              ))}
            </div>
          </>
        )}

        <div className="mt-10 sm:mt-16 glass-card rounded-2xl sm:rounded-3xl overflow-hidden max-w-4xl mx-auto border border-cyan-500/20 shadow-2xl shadow-cyan-500/5">
          <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-b border-cyan-500/15 px-4 sm:px-8 py-4 sm:py-6">
            <h3 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent text-center">{t('aboutTitle')}</h3>
            <p className="text-white/50 text-center text-xs sm:text-sm mt-1">{t('aboutSubtitle')}</p>
          </div>
          <div className="p-4 sm:p-8 space-y-4 sm:space-y-6 text-white/80 text-center">
            <p className="text-base sm:text-xl font-semibold text-white leading-relaxed">
              {t('aboutText1')}
            </p>
            <p className="text-sm leading-relaxed text-white/60 max-w-2xl mx-auto">
              {t('aboutText2')}
            </p>
            <p className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              {t('aboutSlogan')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-4 sm:mt-8">
              {[
                { icon: Clock, title: t('stat1Title'), desc: t('stat1Desc') },
                { icon: Truck, title: t('stat2Title'), desc: t('stat2Desc') },
                { icon: Lock, title: t('stat3Title'), desc: t('stat3Desc') },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="bg-gradient-to-br from-cyan-500/8 to-blue-500/8 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-cyan-500/15 hover:border-cyan-500/35 transition-all duration-300 group">
                  <div className="w-9 h-9 mx-auto mb-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                  </div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="text-xs text-white/40 mt-1">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 sm:mt-8 max-w-4xl mx-auto">
          <div className="glass-card rounded-2xl sm:rounded-3xl overflow-hidden border border-cyan-500/20 shadow-2xl shadow-cyan-500/5 mb-3">
            <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-b border-cyan-500/15 px-4 sm:px-8 py-4 sm:py-6">
              <h3 className="text-base sm:text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent text-center">{t('paymentTitle')}</h3>
              <p className="text-white/50 text-center text-xs sm:text-sm mt-1">{t('paymentSubtitle')}</p>
            </div>

            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
                {[
                  { icon: Lock, label: t('payBadge1'), sub: t('payBadge1Sub') },
                  { icon: Shield, label: t('payBadge2'), sub: t('payBadge2Sub') },
                  { icon: Zap, label: t('payBadge3'), sub: t('payBadge3Sub') },
                  { icon: CheckCircle, label: t('payBadge4'), sub: t('payBadge4Sub') },
                ].map(({ icon: Icon, label, sub }) => (
                  <div key={label} className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl p-3 sm:p-4 border border-green-400/20 text-center">
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 mx-auto mb-1.5" />
                    <p className="text-white font-semibold text-xs sm:text-sm">{label}</p>
                    <p className="text-white/40 text-xs mt-0.5 hidden sm:block">{sub}</p>
                  </div>
                ))}
              </div>

              <p className="text-sm sm:text-base font-semibold text-center text-white mb-4">
                {t('choosePayment')}
              </p>

              <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                {[
                  {
                    id: 0,
                    label: 'Swaps.app',
                    badge: t('swapsBadge'),
                    badgeColor: 'bg-cyan-500 text-white',
                    border: 'border-cyan-500/30',
                    activeBorder: 'border-cyan-400/60',
                    color: 'from-cyan-500/10 to-blue-500/10',
                    icon: (
                      <svg viewBox="0 0 128 128" className="w-8 h-8 shrink-0" fill="none">
                        <rect width="128" height="128" rx="26" fill="#0B1426"/>
                        <circle cx="64" cy="64" r="36" stroke="#00D2FF" strokeWidth="7" fill="none"/>
                        <path d="M64 28 A36 36 0 0 1 100 64" stroke="#00D2FF" strokeWidth="7" strokeLinecap="round" fill="none"/>
                        <path d="M82 50 L100 64 L82 78" stroke="#00D2FF" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                        <path d="M64 100 A36 36 0 0 1 28 64" stroke="#ffffff" strokeWidth="7" strokeLinecap="round" fill="none" opacity="0.5"/>
                        <path d="M46 78 L28 64 L46 50" stroke="#ffffff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.5"/>
                      </svg>
                    ),
                  },
                  {
                    id: 1,
                    label: 'Phantom Wallet',
                    badge: t('phantomBadge'),
                    badgeColor: 'bg-green-500 text-white',
                    border: 'border-green-500/30',
                    activeBorder: 'border-green-400/60',
                    color: 'from-green-500/10 to-emerald-500/10',
                    icon: (
                      <svg viewBox="0 0 128 128" className="w-8 h-8 shrink-0" fill="none">
                        <rect width="128" height="128" rx="26" fill="#534BB1"/>
                        <path d="M64 18C42.5 18 25 35.5 25 57C25 67.5 29 77 35.5 84L30 110H44L49 95C53.5 97.5 58.6 99 64 99C69.4 99 74.5 97.5 79 95L84 110H98L92.5 84C99 77 103 67.5 103 57C103 35.5 85.5 18 64 18Z" fill="white"/>
                        <circle cx="50" cy="57" r="7" fill="#534BB1"/>
                        <circle cx="78" cy="57" r="7" fill="#534BB1"/>
                        <circle cx="48" cy="55" r="2.5" fill="white"/>
                        <circle cx="76" cy="55" r="2.5" fill="white"/>
                      </svg>
                    ),
                  },
                  {
                    id: 2,
                    label: 'Trust Wallet',
                    badge: t('trustBadge'),
                    badgeColor: 'bg-blue-500 text-white',
                    border: 'border-blue-500/20',
                    activeBorder: 'border-blue-400/60',
                    color: 'from-blue-500/10 to-cyan-500/10',
                    icon: (
                      <svg viewBox="0 0 128 128" className="w-8 h-8 shrink-0" fill="none">
                        <rect width="128" height="128" rx="26" fill="#fff"/>
                        <defs>
                          <linearGradient id="twGrad1" x1="64" y1="14" x2="64" y2="114" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#0500FF"/>
                            <stop offset="100%" stopColor="#1FC7D4"/>
                          </linearGradient>
                        </defs>
                        <path d="M64 14L18 32V62C18 85.5 38.5 107 64 114C89.5 107 110 85.5 110 62V32L64 14Z" fill="url(#twGrad1)"/>
                        <path d="M64 26L30 42V62C30 80.2 45.2 98.5 64 104C82.8 98.5 98 80.2 98 62V42L64 26Z" fill="white" fillOpacity="0.15"/>
                        <path d="M50 64L44 58L41 61L50 70L87 33L84 30L50 64Z" fill="white"/>
                      </svg>
                    ),
                  },
                  {
                    id: 3,
                    label: 'Revolut',
                    badge: t('revolutBadge'),
                    badgeColor: 'bg-slate-600 text-white',
                    border: 'border-slate-500/20',
                    activeBorder: 'border-slate-400/50',
                    color: 'from-slate-500/10 to-gray-500/10',
                    icon: (
                      <svg viewBox="0 0 128 128" className="w-8 h-8 shrink-0" fill="none">
                        <rect width="128" height="128" rx="26" fill="#0666EB"/>
                        <path d="M36 24H70C84.4 24 96 35.6 96 50C96 59.8 90.6 68.3 82.5 72.8L96 104H78L65.5 74H54V104H36V24ZM54 40V58H70C74.4 58 78 54.4 78 50C78 45.6 74.4 42 70 42L54 40Z" fill="white"/>
                      </svg>
                    ),
                  },
                ].map(({ id, label, badge, badgeColor, border, activeBorder, color, icon }) => (
                  <div key={id} className={`rounded-xl border-2 transition-all bg-gradient-to-br ${color} ${openPayment === id ? activeBorder : border}`}>
                    <button
                      onClick={() => togglePayment(id)}
                      className="w-full flex items-center gap-3 px-4 py-3.5"
                    >
                      {icon}
                      <span className="font-semibold text-white text-base flex-1 text-left">{label}</span>
                      {badge && (
                        <span className={`shrink-0 text-xs font-bold px-2.5 py-0.5 rounded-full ${badgeColor}`}>{badge}</span>
                      )}
                      <span className="text-blue-300/70 text-xs shrink-0">{t('howTo')}</span>
                      {openPayment === id
                        ? <ChevronUp className="w-4 h-4 text-white/50 shrink-0" />
                        : <ChevronDown className="w-4 h-4 text-white/40 shrink-0" />
                      }
                    </button>

                    {openPayment === id && (
                      <div className="border-t border-white/10 p-4 space-y-3">
                        {id === 0 && (
                          <>
                            <div className="bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border border-cyan-400/30 rounded-xl p-3 text-center">
                              <p className="text-white font-bold text-sm">{t('guideSwapsFastest')}</p>
                              <p className="text-white/60 text-xs mt-0.5">{t('guideSwapsFastestDesc')}</p>
                            </div>
                            {[
                              { n: 1, title: t('swapsStep1T'), d: t('swapsStep1D'), ok: t('swapsStep1Ok') },
                              { n: 2, title: t('swapsStep2T'), d: t('swapsStep2D') },
                              { n: 3, title: t('swapsStep3T'), d: t('swapsStep3D'), ok: t('swapsStep3Ok') },
                            ].map(({ n, title, d, ok }) => (
                              <div key={n} className="flex items-start gap-3 bg-white/5 rounded-xl p-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center text-white font-bold text-xs">{n}</span>
                                <div>
                                  <p className="font-semibold text-white text-sm">{title}</p>
                                  <p className="text-xs text-white/60 leading-relaxed mt-0.5">{d}</p>
                                  {ok && <p className="text-xs text-green-400 font-medium mt-1">{ok}</p>}
                                </div>
                              </div>
                            ))}
                          </>
                        )}
                        {id === 1 && (
                          <>
                            <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-400/30 rounded-xl p-3 text-center">
                              <p className="text-white font-bold text-sm">{t('guideSolanaTitle')}</p>
                              <p className="text-white/60 text-xs mt-0.5">{t('guideSolanaDesc')}</p>
                            </div>
                            {[
                              { n: 1, title: t('phantomStep1T'), d: t('phantomStep1D') },
                              { n: 2, title: t('phantomStep2T'), d: t('phantomStep2D'), warn: t('phantomStep2W') },
                              { n: 3, title: t('phantomStep3T'), d: t('phantomStep3D'), ok: t('phantomStep3Ok') },
                              { n: 4, title: t('phantomStep4T'), d: t('phantomStep4D'), ok: t('phantomStep4Ok') },
                            ].map(({ n, title, d, warn, ok }) => (
                              <div key={n} className="flex items-start gap-3 bg-white/5 rounded-xl p-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xs">{n}</span>
                                <div>
                                  <p className="font-semibold text-white text-sm">{title}</p>
                                  <p className="text-xs text-white/60 leading-relaxed mt-0.5">{d}</p>
                                  {warn && <p className="text-xs text-yellow-300/80 font-medium mt-1">{warn}</p>}
                                  {ok && <p className="text-xs text-green-400 font-medium mt-1">{ok}</p>}
                                </div>
                              </div>
                            ))}
                          </>
                        )}
                        {id === 2 && (
                          <>
                            <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-400/30 rounded-xl p-3 text-center">
                              <p className="text-white font-bold text-sm">{t('guideTrustTitle')}</p>
                              <p className="text-white/60 text-xs mt-0.5">{t('guideTrustDesc')}</p>
                            </div>
                            {[
                              { n: 1, title: t('trustStep1T'), d: t('trustStep1D') },
                              { n: 2, title: t('trustStep2T'), d: t('trustStep2D'), warn: t('trustStep2W') },
                              { n: 3, title: t('trustStep3T'), d: t('trustStep3D'), ok: t('trustStep3Ok') },
                              { n: 4, title: t('trustStep4T'), d: t('trustStep4D'), ok: t('trustStep4Ok') },
                            ].map(({ n, title, d, warn, ok }) => (
                              <div key={n} className="flex items-start gap-3 bg-white/5 rounded-xl p-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xs">{n}</span>
                                <div>
                                  <p className="font-semibold text-white text-sm">{title}</p>
                                  <p className="text-xs text-white/60 leading-relaxed mt-0.5">{d}</p>
                                  {warn && <p className="text-xs text-yellow-300/80 font-medium mt-1">{warn}</p>}
                                  {ok && <p className="text-xs text-green-400 font-medium mt-1">{ok}</p>}
                                </div>
                              </div>
                            ))}
                          </>
                        )}
                        {id === 3 && (
                          <>
                            {[
                              { n: 1, title: t('revolutStep1T'), d: t('revolutStep1D') },
                              { n: 2, title: t('revolutStep2T'), d: t('revolutStep2D') },
                              { n: 3, title: t('revolutStep3T'), d: t('revolutStep3D'), warn: t('revolutStep3W') },
                              { n: 4, title: t('revolutStep4T'), d: t('revolutStep4D'), ok: t('revolutStep4Ok') },
                            ].map(({ n, title, d, warn, ok }) => (
                              <div key={n} className="flex items-start gap-3 bg-white/5 rounded-xl p-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-500 flex items-center justify-center text-white font-bold text-xs">{n}</span>
                                <div>
                                  <p className="font-semibold text-white text-sm">{title}</p>
                                  <p className="text-xs text-white/60 leading-relaxed mt-0.5">{d}</p>
                                  {warn && <p className="text-xs text-yellow-300/80 font-medium mt-1">{warn}</p>}
                                  {ok && <p className="text-xs text-green-400 font-medium mt-1">{ok}</p>}
                                </div>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="bg-red-500/15 border-2 border-red-400/50 rounded-xl p-4 mb-4">
                <p className="text-red-200 text-sm font-bold text-center">{t('exactSolWarning')}</p>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl border border-cyan-400/25 shadow-xl shadow-cyan-500/5 overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-500/15 to-blue-500/15 px-4 sm:px-8 py-4 sm:py-6 text-center">
              <p className="text-white font-bold text-base sm:text-lg mb-1">{t('ctaQuestion')}</p>
              <a
                href="https://t.me/Peptidai"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold text-sm sm:text-base px-5 sm:px-6 py-3 rounded-xl transition-all duration-300 shadow-lg shadow-cyan-500/30 hover:scale-105 active:scale-95"
              >
                <Send className="w-4 h-4" />
                {t('ctaTelegram')}
              </a>
            </div>
          </div>
        </div>
      </main>

      <footer className="glass-card border-t border-cyan-500/20 text-white py-10 sm:py-14 mt-10 sm:mt-16 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-cyan-500/3 pointer-events-none"></div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-6 sm:mb-10">
              <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-4 sm:mb-6">{t('footerContact')}</h3>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                <a
                  href="mailto:peptidailietuva@gmail.com"
                  className="flex items-center gap-3 bg-gradient-to-r from-cyan-500/15 to-blue-500/15 hover:from-cyan-500/25 hover:to-blue-500/25 px-5 py-3 rounded-xl transition-all duration-300 border border-cyan-500/25 hover:border-cyan-500/50 w-full sm:w-auto justify-center group"
                >
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 group-hover:text-cyan-300 transition-colors flex-shrink-0" />
                  <span className="text-white/80 font-medium text-sm group-hover:text-white transition-colors">peptidailietuva@gmail.com</span>
                </a>

                <a
                  href="https://t.me/Peptidai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-gradient-to-r from-cyan-500/15 to-blue-500/15 hover:from-cyan-500/25 hover:to-blue-500/25 px-5 py-3 rounded-xl transition-all duration-300 border border-cyan-500/25 hover:border-cyan-500/50 w-full sm:w-auto justify-center group"
                >
                  <Send className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 group-hover:text-cyan-300 transition-colors flex-shrink-0" />
                  <span className="text-white/80 font-medium text-sm group-hover:text-white transition-colors">@Peptidai</span>
                </a>
              </div>

              <div className="flex items-center justify-center gap-3">
                <a
                  href="https://www.facebook.com/profile.php?id=61580680508751"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/5 hover:bg-cyan-500/15 p-3.5 rounded-xl transition-all duration-300 border border-white/10 hover:border-cyan-500/40 group hover:scale-110"
                  aria-label="Facebook"
                >
                  <Facebook className="w-5 h-5 text-white/50 group-hover:text-cyan-300 transition-colors" />
                </a>
                <a
                  href="https://www.instagram.com/peptidai_lietuva/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/5 hover:bg-cyan-500/15 p-3.5 rounded-xl transition-all duration-300 border border-white/10 hover:border-cyan-500/40 group hover:scale-110"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5 text-white/50 group-hover:text-cyan-300 transition-colors" />
                </a>
                <a
                  href="https://www.tiktok.com/@peptidai?lang=lt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/5 hover:bg-cyan-500/15 p-3.5 rounded-xl transition-all duration-300 border border-white/10 hover:border-cyan-500/40 group hover:scale-110"
                  aria-label="TikTok"
                >
                  <svg className="w-5 h-5 text-white/50 group-hover:text-cyan-300 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                </a>
              </div>
            </div>

            <div className="border-t border-white/8 pt-5 text-center">
              <p className="text-white/30 text-xs sm:text-sm">
                {t('footerCopy')}
              </p>
            </div>
          </div>
        </div>
      </footer>

      {quickAddProduct && (
        <QuantityModal
          product={quickAddProduct}
          onClose={() => setQuickAddProduct(null)}
          onAddToCart={handleAddToCart}
          onViewDetails={(p) => { setQuickAddProduct(null); setSelectedProduct(p); }}
        />
      )}

      {selectedProduct && (
        <ProductDetail
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      {showCart && (
        <Cart onClose={() => setShowCart(false)} onCheckout={handleCheckout} />
      )}

      {showCheckout && <Checkout onClose={handleCheckoutClose} />}

      {showToast && (
        <Toast
          message={toastMessage}
          onClose={handleCloseToast}
        />
      )}

    </div>
  );
}

export default App;
