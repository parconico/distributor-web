import { CondicionIva, EstadoVenta, EstadoRemito, EstadoCompra, ListaPrecio, TipoComprobante, TipoMovimientoCuenta, TipoMovimientoStock } from "@/types";

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCondicionIva(ci: CondicionIva): string {
  const labels: Record<CondicionIva, string> = {
    [CondicionIva.RESPONSABLE_INSCRIPTO]: "Responsable Inscripto",
    [CondicionIva.MONOTRIBUTISTA]: "Monotributista",
    [CondicionIva.EXENTO]: "Exento",
    [CondicionIva.CONSUMIDOR_FINAL]: "Consumidor Final",
  };
  return labels[ci] ?? ci;
}

export function formatListaPrecio(lp: ListaPrecio): string {
  const labels: Record<ListaPrecio, string> = {
    [ListaPrecio.LISTA_1]: "Lista 1",
    [ListaPrecio.LISTA_2]: "Lista 2",
    [ListaPrecio.LISTA_3]: "Lista 3",
  };
  return labels[lp] ?? lp;
}

export function formatEstadoVenta(estado: EstadoVenta): string {
  const labels: Record<EstadoVenta, string> = {
    [EstadoVenta.BORRADOR]: "Borrador",
    [EstadoVenta.CONFIRMADA]: "Confirmada",
    [EstadoVenta.FACTURADA]: "Facturada",
    [EstadoVenta.ANULADA]: "Anulada",
  };
  return labels[estado] ?? estado;
}

export function estadoVentaVariant(estado: EstadoVenta): "default" | "secondary" | "destructive" | "outline" {
  const variants: Record<EstadoVenta, "default" | "secondary" | "destructive" | "outline"> = {
    [EstadoVenta.BORRADOR]: "outline",
    [EstadoVenta.CONFIRMADA]: "default",
    [EstadoVenta.FACTURADA]: "secondary",
    [EstadoVenta.ANULADA]: "destructive",
  };
  return variants[estado] ?? "outline";
}

export function formatTipoMovimiento(tipo: TipoMovimientoStock): string {
  const labels: Record<TipoMovimientoStock, string> = {
    [TipoMovimientoStock.ENTRADA]: "Entrada",
    [TipoMovimientoStock.SALIDA]: "Salida",
    [TipoMovimientoStock.AJUSTE]: "Ajuste",
  };
  return labels[tipo] ?? tipo;
}

export function formatTipoMovimientoCuenta(tipo: TipoMovimientoCuenta): string {
  return tipo === TipoMovimientoCuenta.DEBITO ? "Débito" : "Crédito";
}

export function formatTipoComprobante(tipo: TipoComprobante): string {
  const labels: Record<TipoComprobante, string> = {
    [TipoComprobante.FACTURA_A]: "Factura A",
    [TipoComprobante.FACTURA_B]: "Factura B",
    [TipoComprobante.FACTURA_C]: "Factura C",
    [TipoComprobante.NOTA_CREDITO_A]: "Nota de Crédito A",
    [TipoComprobante.NOTA_CREDITO_B]: "Nota de Crédito B",
    [TipoComprobante.NOTA_CREDITO_C]: "Nota de Crédito C",
    [TipoComprobante.NOTA_DEBITO_A]: "Nota de Débito A",
    [TipoComprobante.NOTA_DEBITO_B]: "Nota de Débito B",
    [TipoComprobante.NOTA_DEBITO_C]: "Nota de Débito C",
  };
  return labels[tipo] ?? tipo;
}

export function formatPuntoVentaNumero(pv: number, num: number): string {
  return `${String(pv).padStart(5, '0')}-${String(num).padStart(8, '0')}`;
}

export function formatEstadoRemito(estado: EstadoRemito): string {
  const labels: Record<EstadoRemito, string> = {
    [EstadoRemito.BORRADOR]: "Borrador",
    [EstadoRemito.CONFIRMADO]: "Confirmado",
    [EstadoRemito.ANULADO]: "Anulado",
  };
  return labels[estado] ?? estado;
}

export function estadoRemitoVariant(estado: EstadoRemito): "default" | "secondary" | "destructive" | "outline" {
  const variants: Record<EstadoRemito, "default" | "secondary" | "destructive" | "outline"> = {
    [EstadoRemito.BORRADOR]: "outline",
    [EstadoRemito.CONFIRMADO]: "default",
    [EstadoRemito.ANULADO]: "destructive",
  };
  return variants[estado] ?? "outline";
}

export function formatEstadoCompra(estado: EstadoCompra): string {
  const labels: Record<EstadoCompra, string> = {
    [EstadoCompra.BORRADOR]: "Borrador",
    [EstadoCompra.CONFIRMADA]: "Confirmada",
    [EstadoCompra.RECIBIDA]: "Recibida",
    [EstadoCompra.ANULADA]: "Anulada",
  };
  return labels[estado] ?? estado;
}

export function estadoCompraVariant(estado: EstadoCompra): "default" | "secondary" | "destructive" | "outline" {
  const variants: Record<EstadoCompra, "default" | "secondary" | "destructive" | "outline"> = {
    [EstadoCompra.BORRADOR]: "outline",
    [EstadoCompra.CONFIRMADA]: "default",
    [EstadoCompra.RECIBIDA]: "secondary",
    [EstadoCompra.ANULADA]: "destructive",
  };
  return variants[estado] ?? "outline";
}
