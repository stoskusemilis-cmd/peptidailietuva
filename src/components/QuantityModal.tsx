import { X, ShoppingCart, Plus, Minus, Clock } from 'lucide-react';
import { Product } from '../lib/supabase';
import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { isOutOfStock } from '../lib/outOfStock';

interface QuantityModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onViewDetails: (product: Product) => void;
}

export function QuantityModal({ product, onClose, onAddToCart, onViewDetails }: QuantityModalProps) {
  const { t, lang } = useLanguage();
  const outOfStock = isOutOfStock(product);
  const hasTiers = product.price_tiers && product.price_tiers.length > 0;
  const [selectedTier, setSelectedTier] = useState(hasTiers ? product.price_tiers![0] : null);
  const [quantity, setQuantity] = useState(1);

  const getDescription = () => {
    if (lang === 'en' && product.description_en) return product.description_en;
    if (lang === 'ru' && product.description_ru) return product.description_ru;
    return product.description;
  };

  const handleAdd = () => {
    if (outOfStock) return;
    const qty = hasTiers ? selectedTier!.quantity : quantity;
    onAddToCart(product, qty);
    onClose();
  };

  const handleViewDetails = () => {
    onClose();
    onViewDetails(product);
  };

  const currentPrice = hasTiers
    ? selectedTier!.price
    : product.price * quantity;

  return (
    <div
      className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="glass-card border-cyan-500/30 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm animate-slide-in">
        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-b border-cyan-500/20 px-4 py-3.5 flex items-center justify-between rounded-t-3xl sm:rounded-t-3xl">
          <div className="min-w-0 pr-2">
            <h3 className="text-sm font-bold text-white truncate">{product.name}</h3>
            <p className="text-xs text-white/50 truncate mt-0.5">{getDescription()}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-cyan-500/20 rounded-xl transition-all duration-200 border border-transparent hover:border-cyan-500/40 flex-shrink-0"
          >
            <X className="w-4 h-4 text-cyan-400" />
          </button>
        </div>

        <div className="p-4">
          {hasTiers ? (
            <div className="space-y-2 mb-4">
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">{t('selectQty')}</p>
              {product.price_tiers!.map((tier) => (
                <button
                  key={tier.id}
                  onClick={() => setSelectedTier(tier)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                    selectedTier?.id === tier.id
                      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-400 shadow-lg shadow-cyan-500/20'
                      : 'bg-white/5 border-cyan-500/20 hover:border-cyan-500/40 hover:bg-white/8'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      selectedTier?.id === tier.id ? 'border-cyan-400 bg-cyan-400' : 'border-white/30'
                    }`}>
                      {selectedTier?.id === tier.id && (
                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                      )}
                    </div>
                    <span className="text-base font-semibold text-white">{tier.quantity} {t('cartQty')}</span>
                  </div>
                  <span className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    {tier.price.toFixed(2)}€
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="mb-4">
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">{t('selectQty')}</p>
              <div className="flex items-center justify-between bg-white/5 rounded-xl border border-cyan-500/20 p-1">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="p-2.5 hover:bg-cyan-500/20 disabled:opacity-30 rounded-lg transition-all"
                >
                  <Minus className="w-4 h-4 text-cyan-400" />
                </button>
                <span className="text-xl font-bold text-white min-w-[3rem] text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => Math.min(product.stock || 99, q + 1))}
                  disabled={quantity >= (product.stock || 99)}
                  className="p-2.5 hover:bg-cyan-500/20 disabled:opacity-30 rounded-lg transition-all"
                >
                  <Plus className="w-4 h-4 text-cyan-400" />
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-4 px-1">
            <span className="text-sm text-white/50">{t('total')}</span>
            <span className="text-2xl font-black bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              {currentPrice.toFixed(2)}€
            </span>
          </div>

          <button
            onClick={handleAdd}
            disabled={outOfStock}
            className={`w-full font-bold py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 mb-2 ${
              outOfStock
                ? 'bg-white/10 text-white/50 cursor-not-allowed border border-white/10'
                : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 active:from-cyan-600 active:to-blue-600 text-white shadow-lg shadow-cyan-500/30'
            }`}
          >
            {outOfStock ? (
              <>
                <Clock className="w-4 h-4" />
                <span>{t('comingSoon')}</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                <span>{t('addToCartBtn')}</span>
              </>
            )}
          </button>

          <button
            onClick={handleViewDetails}
            className="w-full bg-white/5 hover:bg-white/10 active:bg-white/15 text-white/70 hover:text-white font-medium py-2.5 rounded-xl transition-all duration-200 text-sm border border-white/10 hover:border-cyan-500/30"
          >
            {t('details')}
          </button>
        </div>
      </div>
    </div>
  );
}
