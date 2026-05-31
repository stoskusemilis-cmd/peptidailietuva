const OUT_OF_STOCK_NAMES = new Set([
  'GLOW 70MG',
  'HGH 15IU',
  'MASTERONE E 2000MG',
  'SEMAX 10MG',
  '5-AMINO-1MQ 10MG',
  'SS-31 50MG',
  'BPC-157 10MG',
  'TB-500 10MG',
  'BPC-157 10MG + TB-500 10MG',
  'MELANOTAN 1 10MG',
  'PT-141 10MG',
  'AOD-9604 10MG',
  'TESAMORELIN 20MG',
  'TIRZEPATIDE 30MG',
  'DSIP 5MG',
  'EPITALON 50MG',
]);

export function isOutOfStock(product: { name: string; stock?: number }): boolean {
  if (OUT_OF_STOCK_NAMES.has(product.name.trim().toUpperCase())) return true;
  if (typeof product.stock === 'number' && product.stock <= 0) return true;
  return false;
}
