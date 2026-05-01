import { X, ShoppingCart, Minus, Plus, Clock } from 'lucide-react';
import { Product } from '../lib/supabase';
import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { isOutOfStock } from '../lib/outOfStock';

interface ProductDetailProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

export function ProductDetail({ product, onClose, onAddToCart }: ProductDetailProps) {
  const hasTiers = product.price_tiers && product.price_tiers.length > 0;
  const [selectedTier, setSelectedTier] = useState(hasTiers ? product.price_tiers![0] : null);
  const [quantity, setQuantity] = useState(1);
  const { t, lang } = useLanguage();
  const outOfStock = isOutOfStock(product);

  const getFullDescription = () => {
    if (lang === 'en' && product.full_description_en) return product.full_description_en;
    if (lang === 'ru' && product.full_description_ru) return product.full_description_ru;
    return product.full_description;
  };

  const imageSrc = product.image_url || null;

  const handleAddToCart = () => {
    if (outOfStock) return;
    const tierQuantity = selectedTier?.quantity || quantity;
    onAddToCart(product, tierQuantity);
    onClose();
  };

  const increaseQuantity = () => {
    if (quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const getCurrentPrice = () => {
    if (selectedTier) {
      return selectedTier.price;
    }
    return product.price * quantity;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-fade-in">
      <div className="glass-card border-cyan-500/30 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto animate-slide-in">
        <div className="sticky top-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 backdrop-blur-xl border-b border-cyan-500/20 px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between rounded-t-3xl">
          <h2 className="text-base sm:text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent leading-tight pr-2">{product.name}</h2>
          <button
            onClick={onClose}
            className="p-2.5 hover:bg-cyan-500/20 active:bg-cyan-500/30 rounded-xl transition-all duration-300 border border-transparent hover:border-cyan-500/50 flex-shrink-0"
          >
            <X className="w-5 h-5 text-cyan-400" />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          <div className="rounded-xl mb-4 sm:mb-6 overflow-hidden relative" style={{ aspectRatio: '555/832', maxHeight: '70vw' }}>
            {imageSrc ? (
              <img
                src={imageSrc}
                alt={product.name}
                className={`w-full h-full object-contain ${outOfStock ? 'grayscale opacity-50' : ''}`}
              />
            ) : (
              <div className={`absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 flex items-center justify-center ${outOfStock ? 'grayscale opacity-50' : ''}`}>
                <div className="text-center">
                  <div className="text-6xl sm:text-8xl font-bold text-white mb-3">
                    {product.name.match(/\d+/)?.[0] || ''}
                    <span className="text-2xl sm:text-3xl text-white/70">
                      {product.name.match(/mg|iu/i)?.[0] || ''}
                    </span>
                  </div>
                  <div className="text-sm sm:text-lg text-white/80 font-medium">
                    {product.name.split(/\d+/)[0].trim()}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-2">{t('description')}</h3>
            <p className="text-sm sm:text-base text-white/80 leading-relaxed whitespace-pre-line">
              {getFullDescription()}
            </p>
          </div>

          {hasTiers ? (
            <div className="mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-3">{t('selectQty')}</h3>
              <div className="space-y-2 sm:space-y-3">
                {product.price_tiers!.map((tier) => (
                  <button
                    key={tier.id}
                    onClick={() => setSelectedTier(tier)}
                    className={`w-full flex items-center justify-between px-4 py-3.5 sm:p-5 rounded-xl border-2 transition-all duration-300 ${
                      selectedTier?.id === tier.id
                        ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-400 shadow-lg shadow-cyan-500/20'
                        : 'bg-white/5 border-cyan-500/20 hover:border-cyan-500/40 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedTier?.id === tier.id ? 'border-cyan-400 bg-cyan-400' : 'border-white/30'
                      }`}>
                        {selectedTier?.id === tier.id && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      <span className="text-base sm:text-xl font-semibold text-white">{tier.quantity} {t('cartQty')}</span>
                    </div>
                    <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                      {tier.price.toFixed(2)}€
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 border border-cyan-500/20">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs sm:text-sm text-cyan-400/80 mb-1">{t('price')}</p>
                  <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">{product.price.toFixed(2)}€</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-cyan-400/80 mb-1">{t('delivery')}</p>
                  <p className="text-base sm:text-xl font-bold text-white">{t('deliveryTime')}</p>
                </div>
              </div>
            </div>
          )}

          {!hasTiers && (
            <div className="flex items-center space-x-4 mb-4 sm:mb-6">
              <div className="flex items-center border-2 border-cyan-500/30 rounded-xl bg-cyan-500/5">
                <button
                  onClick={decreaseQuantity}
                  className="p-3 hover:bg-cyan-500/20 active:bg-cyan-500/30 transition-all duration-300 rounded-l-xl"
                  disabled={quantity <= 1}
                >
                  <Minus className="w-5 h-5 text-cyan-400" />
                </button>
                <div className="px-5 py-3 font-bold text-base text-white min-w-[50px] text-center">
                  {quantity}
                </div>
                <button
                  onClick={increaseQuantity}
                  className="p-3 hover:bg-cyan-500/20 active:bg-cyan-500/30 transition-all duration-300 rounded-r-xl"
                  disabled={quantity >= product.stock}
                >
                  <Plus className="w-5 h-5 text-cyan-400" />
                </button>
              </div>
            </div>
          )}

          <button
            onClick={handleAddToCart}
            disabled={outOfStock}
            className={`w-full font-bold py-3.5 sm:py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 mb-3 ${
              outOfStock
                ? 'bg-white/10 text-white/50 cursor-not-allowed border border-white/10'
                : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 active:from-cyan-600 active:to-blue-600 text-white shadow-lg shadow-cyan-500/30'
            }`}
          >
            {outOfStock ? (
              <>
                <Clock className="w-5 h-5" />
                <span>{t('comingSoon')}</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-5 h-5" />
                <span>{t('addToCartBtn')}</span>
              </>
            )}
          </button>

          <div className="text-center text-base font-semibold">
            <span className="text-white/80">{t('total')} </span>
            <span className="text-xl bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">{getCurrentPrice().toFixed(2)}€</span>
          </div>
        </div>
      </div>
    </div>
  );
}
