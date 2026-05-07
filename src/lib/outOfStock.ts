const OUT_OF_STOCK_NAMES = new Set([
  'GLOW 70MG',
  'KLOW 80MG',
  'HGH 15IU',
  'HGH 24IU',
  'MASTERONE E 2000MG',
]);

export function isOutOfStock(product: { name: string; stock?: number }): boolean {
  if (OUT_OF_STOCK_NAMES.has(product.name.trim().toUpperCase())) return true;
  if (typeof product.stock === 'number' && product.stock <= 0) return true;
  return false;
}
