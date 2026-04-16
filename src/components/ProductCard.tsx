import { ShoppingCart } from 'lucide-react';
import { Product } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onViewDetails: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
}

export function ProductCard({ product, onViewDetails, onQuickAdd }: ProductCardProps) {
  const imageSrc = product.image_url || null;
  const { t, lang } = useLanguage();

  const getDescription = () => {
    if (lang === 'en' && product.description_en) return product.description_en;
    if (lang === 'ru' && product.description_ru) return product.description_ru;
    return product.description;
  };

  return (
    <div className="glass-card glass-card-hover rounded-2xl overflow-hidden transition-transform duration-300 active:scale-[0.98] hover:scale-[1.02] group">
      <div className="relative overflow-hidden border-b border-white/10" style={{ aspectRatio: '16/9' }}>
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 to-blue-500/10"></div>
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={product.name}
            className="w-full h-full object-contain relative z-10 group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center relative z-10">
              <div className="text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-2 text-glow">
                {product.name.match(/\d+/)?.[0] || ''}
                <span className="text-2xl sm:text-3xl text-cyan-400/90">
                  {product.name.match(/mg|iu/i)?.[0] || ''}
                </span>
              </div>
              <div className="text-sm text-cyan-400/80 font-medium">
                {product.name.split(/\d+/)[0].trim()}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 sm:p-5 bg-gradient-to-b from-transparent to-cyan-500/5">
        <h3 className="text-lg sm:text-xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors leading-tight">{product.name}</h3>
        <p className="text-sm text-white/70 mb-4 line-clamp-2 leading-relaxed">{getDescription()}</p>

        <div className="mb-4">
          {product.price_tiers && product.price_tiers.length > 0 ? (
            <div className="space-y-2">
              {product.price_tiers.map((tier) => (
                <div key={tier.id} className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-2.5 border border-cyan-500/20">
                  <span className="text-sm text-white/90 font-medium">{tier.quantity} {t('cartQty')}</span>
                  <span className="text-base font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    {tier.price.toFixed(2)}€
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              {product.price.toFixed(2)}€
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onViewDetails(product)}
            className="flex-1 bg-white/5 hover:bg-white/10 active:bg-white/15 text-white font-medium text-sm py-3 px-3 rounded-xl transition-all duration-300 border border-white/10 hover:border-cyan-500/50"
          >
            {t('details')}
          </button>
          <button
            onClick={() => onQuickAdd(product)}
            className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 active:from-cyan-600 active:to-blue-600 text-white font-semibold text-sm py-3 px-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/30"
          >
            <ShoppingCart className="w-4 h-4 flex-shrink-0" />
            <span>{t('addToCart')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
