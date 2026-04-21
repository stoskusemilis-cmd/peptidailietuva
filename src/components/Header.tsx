import { ShoppingCart, Send, Facebook, Instagram } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { logoImage } from '../assets/images';
import { useLanguage, Language } from '../contexts/LanguageContext';

interface HeaderProps {
  onCartClick: () => void;
  onLogoClick: () => void;
}

const LANG_OPTIONS: { value: Language; label: string }[] = [
  { value: 'lt', label: 'LT' },
  { value: 'en', label: 'EN' },
  { value: 'ru', label: 'RU' },
];

const ANNOUNCEMENT_MESSAGES = [
  'NEMOKAMAS PRISTATYMAS + NEMOKAMAS BAC WATER KIEKVIENAM PEPTIDUI',
  'FREE SHIPPING + FREE BAC WATER FOR EACH PEPTIDE',
  'БЕСПЛАТНАЯ ДОСТАВКА + БЕСПЛАТНАЯ BAC WATER ДЛЯ КАЖДОГО ПЕПТИДА',
];

function AnnouncementTicker() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const row = (
    <>
      {ANNOUNCEMENT_MESSAGES.map((msg, i) => (
        <span key={i} className="flex-shrink-0 flex items-center gap-2 mx-10 text-xs sm:text-sm font-semibold tracking-wider">
          <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full inline-block flex-shrink-0"></span>
          {msg}
        </span>
      ))}
    </>
  );

  return (
    <div className="bg-black text-white py-2 overflow-hidden">
      <div className={`ticker-track ${isMobile ? 'ticker-mobile' : 'ticker-desktop'}`}>
        <div className="ticker-set">{row}</div>
        <div className="ticker-set" aria-hidden="true">{row}</div>
      </div>
    </div>
  );
}

export function Header({ onCartClick, onLogoClick }: HeaderProps) {
  const { getTotalItems } = useCart();
  const totalItems = getTotalItems();
  const { lang, setLang, t } = useLanguage();

  return (
    <div className="sticky top-0 z-50">
      <AnnouncementTicker />
    <header className="bg-[#070f1a]/95 text-white shadow-2xl border-b border-cyan-500/20" style={{ transform: 'translateZ(0)' }}>
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-blue-500/5 pointer-events-none"></div>
      <div className="container mx-auto px-4 py-3 relative">
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={onLogoClick}
            className="flex items-center space-x-3 hover:opacity-90 transition-all duration-300 group"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500/30 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <img
                src={logoImage}
                alt="Peptidai Lietuva"
                className="h-14 w-auto sm:h-16 sm:w-auto rounded-xl object-contain relative border border-white/40 group-hover:border-white/80 transition-all duration-300"
              />
            </div>
            <div className="text-center">
              <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-white leading-none">PEPTIDAI</h1>
              <p className="text-[10px] sm:text-xs font-semibold tracking-widest text-white uppercase">LIETUVA</p>
            </div>
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1 bg-white/5 rounded-xl border border-white/10 p-1">
              {LANG_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setLang(opt.value)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all duration-200 ${lang === opt.value ? 'bg-cyan-500 text-white shadow-sm' : 'text-white/50 hover:text-white/80'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-2">
              <a
                href="https://t.me/Peptidai"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-white/5 hover:bg-cyan-500/20 rounded-xl transition-all duration-300 border border-white/10 hover:border-cyan-500/50 group"
                aria-label="Telegram"
              >
                <Send className="w-5 h-5 text-cyan-400/80 group-hover:text-cyan-300 transition-colors" />
              </a>

              <a
                href="https://www.facebook.com/profile.php?id=61580680508751"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-white/5 hover:bg-cyan-500/20 rounded-xl transition-all duration-300 border border-white/10 hover:border-cyan-500/50 group"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5 text-cyan-400/80 group-hover:text-cyan-300 transition-colors" />
              </a>

              <a
                href="https://www.instagram.com/peptidai_lietuva/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-white/5 hover:bg-cyan-500/20 rounded-xl transition-all duration-300 border border-white/10 hover:border-cyan-500/50 group"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5 text-cyan-400/80 group-hover:text-cyan-300 transition-colors" />
              </a>

              <a
                href="https://www.tiktok.com/@peptidai?lang=lt"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-white/5 hover:bg-cyan-500/20 rounded-xl transition-all duration-300 border border-white/10 hover:border-cyan-500/50 group"
                aria-label="TikTok"
              >
                <svg className="w-5 h-5 text-cyan-400/80 group-hover:text-cyan-300 transition-colors" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
            </div>

            <button
              onClick={onCartClick}
              className="relative flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 px-4 sm:px-5 py-2.5 rounded-xl transition-all duration-300 font-semibold shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-105"
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="hidden sm:inline">{t('cart')}</span>
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg shadow-red-500/50">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
    </div>
  );
}
