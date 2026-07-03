const OUT_OF_STOCK_NAMES = new Set([
  'HGH 15IU',
  '5-AMINO-1MQ 10MG',
  'TB-500 10MG',
]);

export function isOutOfStock(product: { name: string; stock?: number }): boolean {
  if (OUT_OF_STOCK_NAMES.has(product.name.trim().toUpperCase())) return true;
  if (typeof product.stock === 'number' && product.stock <= 0) return true;
  return false;
}
