import { Role } from "@/types";

export function formatRole(role: Role | string): string {
  const etiquetas: Record<string, string> = {
    ADMIN: "Administrador",
    VENDEDOR: "Vendedor",
    DEPOSITO: "Depósito",
    CONTADOR: "Contador",
  };
  return etiquetas[role] ?? role;
}

// Lo que cada rol puede hacer, para que quien da de alta un usuario no tenga
// que adivinarlo. Sale de los permisos que declara cada pantalla.
export const DESCRIPCION_ROL: Record<string, string> = {
  ADMIN: "Acceso total, incluida la configuración de facturación y los usuarios.",
  VENDEDOR: "Carga ventas, maneja clientes y consulta el stock. No ve precios, remitos, cuentas corrientes ni reportes.",
  DEPOSITO: "Maneja stock, remitos, compras y proveedores. No vende ni factura.",
  CONTADOR: "Consulta ventas, compras, cuentas corrientes, facturación y reportes.",
};
