import { useState, useRef } from 'react';
import { X, Upload, Check, AlertCircle, Image, Loader } from 'lucide-react';
import { supabase, Product } from '../lib/supabase';

interface AdminImageUploadProps {
  products: Product[];
  onClose: () => void;
  onImageUpdated: () => void;
}

export function AdminImageUpload({ products, onClose, onImageUpdated }: AdminImageUploadProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setStatus(null);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedProduct || !selectedFile) return;

    setUploading(true);
    setStatus(null);

    try {
      const ext = selectedFile.name.split('.').pop()?.toLowerCase() || 'png';
      const fileName = `${selectedProduct.slug}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, selectedFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('products')
        .update({ image_url: urlData.publicUrl })
        .eq('id', selectedProduct.id);

      if (updateError) throw updateError;

      setStatus({ type: 'success', message: 'Nuotrauka sėkmingai įkelta!' });
      onImageUpdated();
      setPreview(null);
      setSelectedFile(null);
      setSelectedProduct(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'Įvyko klaida. Bandykite dar kartą.' });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setSelectedFile(file);
    setStatus(null);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-fade-in">
      <div className="glass-card border-cyan-500/30 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-2xl max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 backdrop-blur-xl border-b border-cyan-500/20 px-4 sm:px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">Nuotraukų valdymas</h2>
            <p className="text-xs text-white/50 mt-0.5">Rekomenduojamas formatas: 555 x 832 px</p>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 hover:bg-cyan-500/20 rounded-xl transition-all duration-300 border border-transparent hover:border-cyan-500/50"
          >
            <X className="w-5 h-5 text-cyan-400" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-white/80 mb-2">Pasirinkite produktą</label>
            <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-1">
              {products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => { setSelectedProduct(product); setPreview(null); setSelectedFile(null); setStatus(null); }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all duration-200 ${
                    selectedProduct?.id === product.id
                      ? 'border-cyan-400 bg-cyan-500/15'
                      : 'border-white/10 bg-white/5 hover:border-cyan-500/40 hover:bg-white/10'
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center flex-shrink-0">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <Image className="w-5 h-5 text-white/30" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{product.name}</p>
                    <p className="text-xs text-white/40 truncate">{product.image_url ? 'Nuotrauka yra' : 'Nėra nuotraukos'}</p>
                  </div>
                  {selectedProduct?.id === product.id && (
                    <Check className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {selectedProduct && (
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-2">
                Įkelti nuotrauką — {selectedProduct.name}
              </label>

              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-cyan-500/30 hover:border-cyan-400/60 rounded-2xl transition-all duration-300 cursor-pointer bg-white/3 hover:bg-cyan-500/5"
              >
                {preview ? (
                  <div className="relative">
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full rounded-2xl object-contain"
                      style={{ aspectRatio: '555/832', maxHeight: '400px', objectFit: 'contain' }}
                    />
                    <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                      <p className="text-white text-sm font-medium">Pakeisti nuotrauką</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center mb-4">
                      <Upload className="w-7 h-7 text-cyan-400" />
                    </div>
                    <p className="text-white font-semibold mb-1">Vilkite nuotrauką čia</p>
                    <p className="text-white/40 text-sm mb-2">arba spauskite norėdami pasirinkti</p>
                    <p className="text-white/30 text-xs">PNG, JPG, WEBP — iki 10MB</p>
                    <p className="text-cyan-400/60 text-xs mt-1">Rekomenduojama: 555 × 832 px</p>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {selectedFile && (
                <div className="mt-3 flex items-center gap-2 text-sm text-white/60 bg-white/5 rounded-xl px-4 py-2.5">
                  <Image className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span className="truncate flex-1">{selectedFile.name}</span>
                  <span className="text-white/30 flex-shrink-0">{(selectedFile.size / 1024).toFixed(0)} KB</span>
                </div>
              )}

              {status && (
                <div className={`mt-3 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
                  status.type === 'success'
                    ? 'bg-green-500/15 border border-green-500/30 text-green-300'
                    : 'bg-red-500/15 border border-red-500/30 text-red-300'
                }`}>
                  {status.type === 'success' ? (
                    <Check className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  )}
                  {status.message}
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="mt-4 w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:from-white/10 disabled:to-white/10 disabled:text-white/30 text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:shadow-none"
              >
                {uploading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Įkeliama...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    <span>Įkelti nuotrauką</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
