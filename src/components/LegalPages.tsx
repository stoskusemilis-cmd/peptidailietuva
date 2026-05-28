import { X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface LegalModalProps {
  type: 'privacy' | 'terms';
  onClose: () => void;
}

export function LegalModal({ type, onClose }: LegalModalProps) {
  const { t } = useLanguage();

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] overflow-y-auto">
      <div className="min-h-full flex items-start justify-center p-4">
        <div className="bg-[#0a1929] border border-white/20 rounded-2xl max-w-3xl w-full p-6 sm:p-8 my-8 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {type === 'privacy' ? (
            <div className="prose prose-invert max-w-none">
              <h1 className="text-2xl font-bold text-white mb-6">{t('privacyTitle')}</h1>
              <p className="text-white/50 text-sm mb-6">{t('privacyLastUpdated')}</p>

              <h2 className="text-lg font-semibold text-white mt-6 mb-3">{t('privacySection1Title')}</h2>
              <p className="text-white/70 text-sm leading-relaxed mb-4">{t('privacySection1Text')}</p>

              <h2 className="text-lg font-semibold text-white mt-6 mb-3">{t('privacySection2Title')}</h2>
              <p className="text-white/70 text-sm leading-relaxed mb-4">{t('privacySection2Text')}</p>

              <h2 className="text-lg font-semibold text-white mt-6 mb-3">{t('privacySection3Title')}</h2>
              <p className="text-white/70 text-sm leading-relaxed mb-4">{t('privacySection3Text')}</p>

              <h2 className="text-lg font-semibold text-white mt-6 mb-3">{t('privacySection4Title')}</h2>
              <p className="text-white/70 text-sm leading-relaxed mb-4">{t('privacySection4Text')}</p>

              <h2 className="text-lg font-semibold text-white mt-6 mb-3">{t('privacySection5Title')}</h2>
              <p className="text-white/70 text-sm leading-relaxed mb-4">{t('privacySection5Text')}</p>

              <h2 className="text-lg font-semibold text-white mt-6 mb-3">{t('privacySection6Title')}</h2>
              <p className="text-white/70 text-sm leading-relaxed mb-4">{t('privacySection6Text')}</p>
            </div>
          ) : (
            <div className="prose prose-invert max-w-none">
              <h1 className="text-2xl font-bold text-white mb-6">{t('termsTitle')}</h1>
              <p className="text-white/50 text-sm mb-6">{t('termsLastUpdated')}</p>

              <h2 className="text-lg font-semibold text-white mt-6 mb-3">{t('termsSection1Title')}</h2>
              <p className="text-white/70 text-sm leading-relaxed mb-4">{t('termsSection1Text')}</p>

              <h2 className="text-lg font-semibold text-white mt-6 mb-3">{t('termsSection2Title')}</h2>
              <p className="text-white/70 text-sm leading-relaxed mb-4">{t('termsSection2Text')}</p>

              <h2 className="text-lg font-semibold text-white mt-6 mb-3">{t('termsSection3Title')}</h2>
              <p className="text-white/70 text-sm leading-relaxed mb-4">{t('termsSection3Text')}</p>

              <h2 className="text-lg font-semibold text-white mt-6 mb-3">{t('termsSection4Title')}</h2>
              <p className="text-white/70 text-sm leading-relaxed mb-4">{t('termsSection4Text')}</p>

              <h2 className="text-lg font-semibold text-white mt-6 mb-3">{t('termsSection5Title')}</h2>
              <p className="text-white/70 text-sm leading-relaxed mb-4">{t('termsSection5Text')}</p>

              <h2 className="text-lg font-semibold text-white mt-6 mb-3">{t('termsSection6Title')}</h2>
              <p className="text-white/70 text-sm leading-relaxed mb-4">{t('termsSection6Text')}</p>

              <h2 className="text-lg font-semibold text-white mt-6 mb-3">{t('termsSection7Title')}</h2>
              <p className="text-white/70 text-sm leading-relaxed mb-4">{t('termsSection7Text')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
