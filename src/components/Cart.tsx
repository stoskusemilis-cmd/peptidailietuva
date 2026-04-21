import { X, Trash2, Shield, Truck, Lock } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useState, useEffect } from 'react';
import { resolveProductImage } from '../assets/images';

interface CartProps {
  onClose: () => void;
  onCheckout: () => void;
}

export function Cart({ onClose, onCheckout }: CartProps) {
  const { cart, removeFromCart, getTotalPrice } = useCart();
  const { t, lang } = useLanguage();
  const [solPrice, setSolPrice] = useState<number>(150);
  const [priceLoading, setPriceLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const SHIPPING_FEE_EUR = 3.5;
  const FREE_SHIPPING_THRESHOLD = 50;
  const totalEur = getTotalPrice();
  const shippingFee = totalEur >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE_EUR;
  const totalWithShipping = totalEur + shippingFee;
  const solAmount = (totalWithShipping / solPrice).toFixed(4);

  useEffect(() => {
    setPriceLoading(true);
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=eur')
      .then(res => res.json())
      .then(data => {
        if (data.solana?.eur) {
          setSolPrice(data.solana.eur);
          setLastUpdated(new Date());
        }
      })
      .catch(() => {})
      .finally(() => setPriceLoading(false));
  }, []);

  if (cart.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-fade-in">
        <div className="glass-card border-cyan-500/30 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md p-5 sm:p-6 animate-slide-in">
          <div className="flex items-center justify-between mb-5 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">{t('cartTitle')}</h2>
            <button
              onClick={onClose}
              className="p-2.5 hover:bg-cyan-500/20 active:bg-cyan-500/30 rounded-xl transition-all duration-300 border border-transparent hover:border-cyan-500/50"
            >
              <X className="w-5 h-5 text-cyan-400" />
            </button>
          </div>
          <div className="text-center py-10 sm:py-12">
            <p className="text-white/80 text-base sm:text-lg mb-4">{t('cartEmpty')}</p>
            <button
              onClick={onClose}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 active:from-cyan-600 active:to-blue-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg shadow-cyan-500/30"
            >
              {t('cartContinue')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-fade-in">
      <div className="glass-card border-cyan-500/30 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[90vh] overflow-hidden flex flex-col animate-slide-in">
        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-b border-cyan-500/20 px-4 sm:px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">{t('cartTitle')}</h2>
          <button
            onClick={onClose}
            className="p-2.5 hover:bg-cyan-500/20 active:bg-cyan-500/30 rounded-xl transition-all duration-300 border border-transparent hover:border-cyan-500/50"
          >
            <X className="w-5 h-5 text-cyan-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-6">
          <div className="space-y-4">
            {cart.map((item) => (
              <div
                key={item.product.id}
                className="bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-2xl border border-cyan-500/20 overflow-hidden hover:border-cyan-500/40 transition-all duration-300"
              >
                <div className="flex flex-col sm:flex-row gap-4 p-4">
                  <div className="flex-shrink-0 w-full sm:w-32">
                    <img
                      src={resolveProductImage(item.product.slug, item.product.image_url) || undefined}
                      alt={item.product.name}
                      className="w-full h-32 sm:h-32 object-contain rounded-lg bg-white/5"
                    />
                  </div>

                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <h3 className="font-bold text-white text-base sm:text-lg leading-tight">
                          {item.product.name}
                        </h3>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="p-2 hover:bg-red-500/20 rounded-lg transition-colors flex-shrink-0"
                        >
                          <Trash2 className="w-5 h-5 text-red-400" />
                        </button>
                      </div>
                      <p className="text-white/80 font-semibold text-base sm:text-lg mb-3">
                        {item.quantity} {t('cartQty')}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="text-left">
                        <div className="text-sm text-white/60 mb-1">{t('cartPrice')}</div>
                        <div className="font-bold text-white text-2xl">
                          {(() => {
                            if (item.product.price_tiers && item.product.price_tiers.length > 0) {
                              const tier = item.product.price_tiers.find(t => t.quantity === item.quantity);
                              if (tier) {
                                return `${tier.price.toFixed(2)}€`;
                              }
                            }
                            return `${(item.product.price * item.quantity).toFixed(2)}€`;
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-cyan-500/20 bg-gradient-to-b from-transparent to-cyan-500/5 px-3 sm:px-6 py-3 sm:py-6 flex-shrink-0">
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-white/70">
              <span className="text-sm">{t('cartProducts')}</span>
              <span className="font-semibold text-white">{totalEur.toFixed(2)}€</span>
            </div>
            <div className="flex items-center justify-between text-white/70">
              <span className="text-sm">{t('cartShipping')}</span>
              <span className={`font-semibold ${shippingFee === 0 ? 'text-green-400' : 'text-white'}`}>
                {shippingFee > 0 ? `${shippingFee.toFixed(2)}€` : t('cartFree')}
              </span>
            </div>

            {totalEur >= FREE_SHIPPING_THRESHOLD && (
              <div className="flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-green-500/15 to-emerald-500/15 rounded-xl border border-green-400/25">
                <Truck className="w-3.5 h-3.5 text-green-400" />
                <span className="text-xs text-green-400 font-semibold">{t('cartFreeMsg')}</span>
              </div>
            )}
            {totalEur > 0 && totalEur < FREE_SHIPPING_THRESHOLD && (
              <div className="flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-yellow-500/15 to-amber-500/15 rounded-xl border border-yellow-400/25">
                <Truck className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-xs text-yellow-400 font-semibold">
                  {t('cartFreeUntil').replace('{amount}', (FREE_SHIPPING_THRESHOLD - totalEur).toFixed(2))}
                </span>
              </div>
            )}

            <div className="border-t border-cyan-500/20 pt-3 mt-2">
              <div className="flex items-center justify-between mb-3">
                <span className="text-base sm:text-lg font-bold text-white">{t('cartTotal')}</span>
                <span className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  {totalWithShipping.toFixed(2)}€
                </span>
              </div>

              <div className="bg-gradient-to-r from-blue-600/15 to-cyan-600/15 border border-blue-400/25 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-white/50 text-xs mb-0.5">{t('cartPaySol')}</p>
                    <p className={`text-white font-bold text-xl font-mono transition-opacity duration-300 ${priceLoading ? 'opacity-40' : 'opacity-100'}`}>
                      {priceLoading ? '...' : `${solAmount} SOL`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/50 text-xs mb-0.5">{t('cartRate')}</p>
                    <p className={`text-white/70 text-sm font-mono transition-opacity duration-300 ${priceLoading ? 'opacity-40' : 'opacity-100'}`}>
                      1 SOL ≈ {solPrice.toFixed(0)}€
                    </p>
                  </div>
                </div>
                <div className="pt-2 border-t border-blue-400/15">
                  <p className="text-white/30 text-xs">
                    {priceLoading ? t('cartLoadingRate') : lastUpdated ? `${t('cartUpdated')} ${lastUpdated.toLocaleTimeString(lang === 'ru' ? 'ru-RU' : lang === 'en' ? 'en-GB' : 'lt-LT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : ''}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={onCheckout}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold py-3.5 sm:py-4 px-6 rounded-xl transition-all duration-300 text-base sm:text-lg shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-[1.02] active:scale-[0.98]"
          >
            {t('cartCheckout')}
          </button>

          <div className="flex items-center justify-center gap-4 mt-3">
            <div className="flex items-center gap-1.5 text-white/30 text-xs">
              <Shield className="w-3 h-3" />
              <span>{t('cartSecure')}</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/30 text-xs">
              <Lock className="w-3 h-3" />
              <span>{t('cartAnon')}</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/30 text-xs">
              <Truck className="w-3 h-3" />
              <span>{t('cartDays')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
