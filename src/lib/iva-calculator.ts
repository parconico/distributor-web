// Espejo de src/common/utils/iva-calculator.ts en la API: el descuento en pesos
// y el porcentual son excluyentes y operan sobre la misma base, asi que el IVA
// queda proporcional en los dos casos.
export function aplicarDescuento(
  base: number,
  descuento = 0,
  descuentoMonto = 0,
): number {
  if (descuentoMonto > 0) {
    // Nunca dejamos la linea en negativo: el tope es el total de la base.
    return Math.max(0, base - descuentoMonto);
  }
  return base * (1 - descuento / 100);
}

export function calcularLineaVenta(
  precioUnitario: number,
  cantidad: number,
  alicuotaIva: number,
  conIva: boolean,
  descuento = 0,
  descuentoMonto = 0,
): { subtotal: number; montoIva: number; total: number } {
  const tasa = alicuotaIva / 100;
  const base = aplicarDescuento(
    precioUnitario * cantidad,
    descuento,
    descuentoMonto
  );

  if (conIva) {
    const subtotal = round2(base);
    const montoIva = round2(subtotal * tasa);
    const total = round2(subtotal + montoIva);
    return { subtotal, montoIva, total };
  } else {
    const totalConIva = round2(base);
    const subtotal = round2(totalConIva / (1 + tasa));
    const montoIva = round2(totalConIva - subtotal);
    return { subtotal, montoIva, total: totalConIva };
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
