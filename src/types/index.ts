export enum Role {
  ADMIN = "ADMIN",
  VENDEDOR = "VENDEDOR",
  DEPOSITO = "DEPOSITO",
  CONTADOR = "CONTADOR",
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export enum CondicionIva {
  RESPONSABLE_INSCRIPTO = 'RESPONSABLE_INSCRIPTO',
  MONOTRIBUTISTA = 'MONOTRIBUTISTA',
  EXENTO = 'EXENTO',
  CONSUMIDOR_FINAL = 'CONSUMIDOR_FINAL',
}

export enum UnidadMedida {
  UNIDAD = 'UNIDAD',
  KILOGRAMO = 'KILOGRAMO',
  LITRO = 'LITRO',
  METRO = 'METRO',
  CAJA = 'CAJA',
  PACK = 'PACK',
}

export enum ListaPrecio {
  LISTA_1 = 'LISTA_1',
  LISTA_2 = 'LISTA_2',
  LISTA_3 = 'LISTA_3',
}

export interface Proveedor {
  id: string;
  razonSocial: string;
  cuit: string;
  condicionIva: CondicionIva;
  direccion?: string;
  telefono?: string;
  email?: string;
  contacto?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Cliente {
  id: string;
  razonSocial: string;
  tipoDocumento: string;
  numeroDocumento: string;
  condicionIva: CondicionIva;
  direccion?: string;
  telefono?: string;
  email?: string;
  listaPrecio: ListaPrecio;
  limiteCredito: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Familia {
  id: string;
  nombre: string;
  isActive: boolean;
  subfamilias?: Subfamilia[];
}

export interface Subfamilia {
  id: string;
  nombre: string;
  familiaId: string;
  familia?: Familia;
  isActive: boolean;
}

export interface Producto {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  subfamiliaId: string;
  subfamilia?: Subfamilia;
  proveedorId?: string;
  proveedor?: Proveedor;
  unidadMedida: UnidadMedida;
  alicuotaIva: number;
  stockActual: number;
  stockMinimo: number;
  isActive: boolean;
  precios?: PrecioProducto[];
}

export interface PrecioProducto {
  id: string;
  productoId: string;
  listaPrecio: ListaPrecio;
  precioNeto: number;
}

export enum EstadoVenta {
  BORRADOR = 'BORRADOR',
  CONFIRMADA = 'CONFIRMADA',
  FACTURADA = 'FACTURADA',
  ANULADA = 'ANULADA',
}

export enum TipoVenta {
  EN_BLANCO = 'EN_BLANCO',
  EN_NEGRO = 'EN_NEGRO',
}

export enum MetodoPago {
  EFECTIVO = 'EFECTIVO',
  TRANSFERENCIA = 'TRANSFERENCIA',
  CUENTA_CORRIENTE = 'CUENTA_CORRIENTE',
}

export enum EstadoRemito {
  BORRADOR = 'BORRADOR',
  CONFIRMADO = 'CONFIRMADO',
  ANULADO = 'ANULADO',
}

export enum EstadoCompra {
  BORRADOR = 'BORRADOR',
  CONFIRMADA = 'CONFIRMADA',
  RECIBIDA = 'RECIBIDA',
  ANULADA = 'ANULADA',
}

export enum TipoMovimientoStock {
  ENTRADA = 'ENTRADA',
  SALIDA = 'SALIDA',
  AJUSTE = 'AJUSTE',
}

export interface VentaPago {
  id: string;
  ventaId: string;
  metodoPago: MetodoPago;
  monto: number;
}

export interface Venta {
  id: string;
  numero: number;
  clienteId: string;
  cliente?: Cliente;
  vendedorId: string;
  vendedor?: User;
  listaPrecio: ListaPrecio;
  tipoVenta: TipoVenta;
  conIva: boolean;
  descuentoTotal: number;
  subtotal: number;
  totalIva: number;
  totalDescuento: number;
  total: number;
  estado: EstadoVenta;
  pagos: VentaPago[];
  diasCredito?: number;
  fechaVencimiento?: string;
  observaciones?: string;
  createdAt: string;
  updatedAt: string;
  items?: VentaItem[];
  ticketInterno?: TicketInterno;
  comprobantes?: Comprobante[];
}

export interface VentaItem {
  id: string;
  ventaId: string;
  productoId: string;
  producto?: Producto;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  alicuotaIva: number;
  subtotal: number;
  montoIva: number;
  total: number;
}

export interface TicketInterno {
  id: string;
  ventaId: string;
  numero: number;
  importeTotal: number;
  createdAt: string;
}

export interface MovimientoStock {
  id: string;
  productoId: string;
  producto?: Producto;
  tipo: TipoMovimientoStock;
  cantidad: number;
  stockPrevio: number;
  stockPosterior: number;
  motivo: string;
  referenciaId?: string;
  referenciaTipo?: string;
  createdAt: string;
  usuarioId: string;
  usuario?: User;
}

export enum TipoMovimientoCuenta {
  DEBITO = 'DEBITO',
  CREDITO = 'CREDITO',
}

export interface MovimientoCuentaCorriente {
  id: string;
  clienteId: string;
  cliente?: Cliente;
  fecha: string;
  tipo: TipoMovimientoCuenta;
  monto: number;
  saldo: number;
  descripcion: string;
  metodoPago?: MetodoPago;
  referenciaId?: string;
  referenciaTipo?: string;
  createdAt: string;
}

export interface Deudor {
  cliente: Cliente;
  saldo: number;
}

export enum TipoComprobante {
  FACTURA_A = 'FACTURA_A',
  FACTURA_B = 'FACTURA_B',
  FACTURA_C = 'FACTURA_C',
  NOTA_CREDITO_A = 'NOTA_CREDITO_A',
  NOTA_CREDITO_B = 'NOTA_CREDITO_B',
  NOTA_CREDITO_C = 'NOTA_CREDITO_C',
  NOTA_DEBITO_A = 'NOTA_DEBITO_A',
  NOTA_DEBITO_B = 'NOTA_DEBITO_B',
  NOTA_DEBITO_C = 'NOTA_DEBITO_C',
}

export interface Comprobante {
  id: string;
  ventaId: string;
  venta?: Venta;
  tipoComprobante: TipoComprobante;
  puntoVenta: number;
  numero: number;
  cae?: string;
  caeFechaVenc?: string;
  importeTotal: number;
  importeNeto: number;
  importeIva: number;
  resultado?: string;
  createdAt: string;
  ivas?: ComprobanteIva[];
}

export interface ComprobanteIva {
  id: string;
  alicuotaId: number;
  baseImponible: number;
  importe: number;
}

export interface Remito {
  id: string;
  numero: number;
  clienteId: string;
  cliente?: Cliente;
  ventaId?: string;
  venta?: Venta;
  estado: EstadoRemito;
  observaciones?: string;
  afectaStock: boolean;
  createdAt: string;
  updatedAt: string;
  items?: RemitoItem[];
}

export interface RemitoItem {
  id: string;
  remitoId: string;
  productoId: string;
  producto?: Producto;
  cantidad: number;
}

export interface Compra {
  id: string;
  numero: number;
  proveedorId: string;
  proveedor?: Proveedor;
  subtotal: number;
  totalIva: number;
  total: number;
  estado: EstadoCompra;
  observaciones?: string;
  createdAt: string;
  updatedAt: string;
  items?: CompraItem[];
}

export interface CompraItem {
  id: string;
  compraId: string;
  productoId: string;
  producto?: Producto;
  cantidad: number;
  precioUnitario: number;
  alicuotaIva: number;
  subtotal: number;
  montoIva: number;
  total: number;
}

export interface ArcaConfig {
  id: string;
  cuit: string;
  puntoVenta: number;
  environment: string;
}

export interface ContribuyenteArca {
  cuit: string;
  razonSocial: string;
  tipoPersona: 'FISICA' | 'JURIDICA';
  condicionIva: string;
  estadoClave: string;
  direccion?: string;
  localidad?: string;
  codigoPostal?: string;
  provincia?: string;
  actividades: string[];
}

export interface DashboardKpis {
  ventasHoy: { count: number; total: number };
  ventasMes: { count: number; total: number };
  comprasVsVentas: {
    compras: { cantidad: number; total: number };
    ventas: { cantidad: number; total: number };
    margen: { bruto: number; porcentaje: number };
  };
  deudaTotal: number;
  productosBajoStock: number;
  ultimasVentas: Venta[];
}
