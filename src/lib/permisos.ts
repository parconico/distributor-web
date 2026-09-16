import { Role } from "@/types";

// Que secciones ve cada rol. Es la unica fuente: de aca sale el menu y el
// bloqueo de rutas del layout, asi que no pueden quedar desalineados.
export const SECCIONES: { href: string; roles: Role[] }[] = [
  { href: "/dashboard", roles: [Role.ADMIN, Role.DEPOSITO, Role.CONTADOR] },
  { href: "/proveedores", roles: [Role.ADMIN, Role.DEPOSITO, Role.CONTADOR] },
  { href: "/compras", roles: [Role.ADMIN, Role.DEPOSITO, Role.CONTADOR] },
  { href: "/clientes", roles: [Role.ADMIN, Role.VENDEDOR, Role.CONTADOR] },
  { href: "/productos", roles: [Role.ADMIN, Role.DEPOSITO, Role.CONTADOR] },
  { href: "/precios", roles: [Role.ADMIN, Role.CONTADOR] },
  { href: "/ventas", roles: [Role.ADMIN, Role.VENDEDOR, Role.CONTADOR] },
  { href: "/remitos", roles: [Role.ADMIN, Role.DEPOSITO, Role.CONTADOR] },
  { href: "/stock", roles: [Role.ADMIN, Role.VENDEDOR, Role.DEPOSITO] },
  { href: "/cuentas-corrientes", roles: [Role.ADMIN, Role.CONTADOR] },
  { href: "/consultar-contribuyente", roles: [Role.ADMIN, Role.CONTADOR] },
  { href: "/facturacion", roles: [Role.ADMIN, Role.CONTADOR] },
  { href: "/reportes", roles: [Role.ADMIN, Role.CONTADOR] },
  { href: "/usuarios", roles: [Role.ADMIN] },
];

// Pantallas dentro de una seccion permitida que el rol igual no puede abrir.
// El vendedor consulta el stock pero no lo mueve.
const SUBRUTAS_BLOQUEADAS: Partial<Record<Role, RegExp[]>> = {
  [Role.VENDEDOR]: [/^\/stock\/.+/],
};

// Pantallas fuera del menu del rol a las que se llega desde una que si ve. El
// detalle de una venta enlaza a sus remitos.
const RUTAS_EXTRA: Partial<Record<Role, RegExp[]>> = {
  [Role.VENDEDOR]: [/^\/remitos\/(?!nuevo$)[^/]+$/],
};

function enSeccion(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export function puedeVerSeccion(role: Role, href: string): boolean {
  return SECCIONES.some((s) => s.href === href && s.roles.includes(role));
}

export function puedeVerRuta(role: Role, pathname: string): boolean {
  if ((RUTAS_EXTRA[role] ?? []).some((r) => r.test(pathname))) return true;
  if ((SUBRUTAS_BLOQUEADAS[role] ?? []).some((r) => r.test(pathname))) {
    return false;
  }
  return SECCIONES.some(
    (s) => s.roles.includes(role) && enSeccion(pathname, s.href)
  );
}

// Donde entra cada rol al iniciar sesion. El vendedor no tiene dashboard y su
// trabajo es cargar ventas.
const INICIO: Partial<Record<Role, string>> = {
  [Role.VENDEDOR]: "/ventas",
};

export function inicioPara(role: Role): string {
  return (
    INICIO[role] ??
    SECCIONES.find((s) => s.roles.includes(role))?.href ??
    "/login"
  );
}
