export function calcularLineaVenta(
  precioUnitario: number,
  cantidad: number,
  alicuotaIva: number,
  conIva: boolean,
): { subtotal: number; montoIva: number; total: number } {
  const tasa = alicuotaIva / 100;
  if (conIva) {
    const subtotal = round2(precioUnitario * cantidad);
    const montoIva = round2(subtotal * tasa);
    const total = round2(subtotal + montoIva);
    return { subtotal, montoIva, total };
  } else {
    const totalConIva = round2(precioUnitario * cantidad);
    const subtotal = round2(totalConIva / (1 + tasa));
    const montoIva = round2(totalConIva - subtotal);
    return { subtotal, montoIva, total: totalConIva };
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
