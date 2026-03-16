/**
 * Script de importación de productos desde Excel (Sheet3)
 *
 * Uso:
 *   1. Levantar el backend (npm run start:dev en distributor-api)
 *   2. Asegurarse de que exista un usuario admin y estar logueado, o usar este script
 *      que hace login automático
 *   3. Ejecutar: node scripts/import-productos.mjs
 *
 * El script:
 *   - Lee productos.xlsx Sheet3
 *   - Crea familias (DULCE, SALADO)
 *   - Crea subfamilias (ALMOHADITA, ARITOS, etc.)
 *   - Crea productos con código, nombre, alícuota IVA 21%
 *   - Carga precios netos (sin IVA) para las 3 listas
 */

import XLSX from "xlsx";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const API_BASE = "http://localhost:3001";
const ADMIN_EMAIL = "admin@distribuidora.com";
const ADMIN_PASSWORD = "Admin123!";

let cookies = "";

async function api(method, path, body) {
  const opts = {
    method,
    headers: {
      "Content-Type": "application/json",
      Cookie: cookies,
    },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${path}`, opts);

  // Capturar cookies de respuesta
  const setCookies = res.headers.getSetCookie?.() ?? [];
  if (setCookies.length > 0) {
    cookies = setCookies.map((c) => c.split(";")[0]).join("; ");
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${path} -> ${res.status}: ${text}`);
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return res.json();
  }
  return null;
}

async function login() {
  console.log("Iniciando sesión como admin...");
  await api("POST", "/auth/login", {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  console.log("  Sesión iniciada correctamente\n");
}

function readExcel() {
  const filePath = join(__dirname, "..", "productos.xlsx");
  const wb = XLSX.readFile(filePath);
  const sheetName = wb.SheetNames[2]; // Sheet3
  const sheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  // Row 0: metadata (IVA multiplier in col 6 = 1.21)
  // Row 1: headers -> CODIGO, FAMILIA, TIPO, NOMBRE, Valor con iva, (empty), LISTA 1, LISTA 2, LISTA 3
  // Row 2+: data

  const productos = [];
  for (let i = 2; i < rows.length; i++) {
    const row = rows[i];
    const codigo = row[0];
    if (codigo == null || codigo === "") continue;

    productos.push({
      codigo: String(codigo),
      familia: (row[1] ?? "").toString().trim(),
      subfamilia: (row[2] ?? "").toString().trim(),
      nombre: (row[3] ?? "").toString().trim(),
      valorConIva: parseFloat(row[4]) || 0,
      precioLista1: parseFloat(row[6]) || 0,
      precioLista2: parseFloat(row[7]) || 0,
      precioLista3: parseFloat(row[8]) || 0,
    });
  }

  console.log(`Leídos ${productos.length} productos del Excel\n`);
  return productos;
}

async function createFamilias(productosExcel) {
  const familiasUnicas = [...new Set(productosExcel.map((p) => p.familia))];
  const familiasMap = {};

  console.log(`Creando ${familiasUnicas.length} familias...`);
  for (const nombre of familiasUnicas) {
    try {
      const familia = await api("POST", "/familias", { nombre });
      familiasMap[nombre] = familia.id;
      console.log(`  + Familia: ${nombre} (${familia.id})`);
    } catch (e) {
      // Puede que ya exista, intentar buscar
      if (e.message.includes("409") || e.message.includes("already") || e.message.includes("existe")) {
        const response = await api("GET", "/familias");
        const list = response.data ?? response;
        const existing = list.find((f) => f.nombre === nombre);
        if (existing) {
          familiasMap[nombre] = existing.id;
          console.log(`  = Familia existente: ${nombre} (${existing.id})`);
        }
      } else {
        throw e;
      }
    }
  }
  console.log("");
  return familiasMap;
}

async function createSubfamilias(productosExcel, familiasMap) {
  const subfamiliasUnicas = [
    ...new Set(productosExcel.map((p) => `${p.familia}|${p.subfamilia}`)),
  ];
  const subfamiliasMap = {};

  console.log(`Creando ${subfamiliasUnicas.length} subfamilias...`);
  for (const key of subfamiliasUnicas) {
    const [familia, subfamilia] = key.split("|");
    const familiaId = familiasMap[familia];

    try {
      const sub = await api("POST", "/subfamilias", {
        nombre: subfamilia,
        familiaId,
      });
      subfamiliasMap[key] = sub.id;
      console.log(`  + Subfamilia: ${familia} > ${subfamilia} (${sub.id})`);
    } catch (e) {
      if (e.message.includes("409") || e.message.includes("already") || e.message.includes("existe")) {
        // Buscar entre las existentes
        const response = await api("GET", "/familias");
        const list = response.data ?? response;
        const fam = list.find((f) => f.id === familiaId);
        if (fam?.subfamilias) {
          const existing = fam.subfamilias.find((s) => s.nombre === subfamilia);
          if (existing) {
            subfamiliasMap[key] = existing.id;
            console.log(
              `  = Subfamilia existente: ${familia} > ${subfamilia} (${existing.id})`
            );
          }
        }
      } else {
        throw e;
      }
    }
  }
  console.log("");
  return subfamiliasMap;
}

async function createProductos(productosExcel, subfamiliasMap) {
  const createdProducts = [];

  console.log(`Creando ${productosExcel.length} productos...`);
  for (const p of productosExcel) {
    const subfamiliaKey = `${p.familia}|${p.subfamilia}`;
    const subfamiliaId = subfamiliasMap[subfamiliaKey];

    if (!subfamiliaId) {
      console.log(`  ! Subfamilia no encontrada para: ${p.nombre} (${subfamiliaKey})`);
      continue;
    }

    try {
      const producto = await api("POST", "/productos", {
        codigo: p.codigo,
        nombre: p.nombre,
        subfamiliaId,
        unidadMedida: "UNIDAD",
        alicuotaIva: 21,
        stockMinimo: 0,
      });
      createdProducts.push({ ...p, productoId: producto.id });
      console.log(`  + Producto: [${p.codigo}] ${p.nombre}`);
    } catch (e) {
      if (e.message.includes("409") || e.message.includes("already") || e.message.includes("existe") || e.message.includes("Unique")) {
        // Buscar producto existente
        try {
          const response = await api("GET", `/productos?search=${encodeURIComponent(p.codigo)}&limit=100`);
          const list = response.data ?? response;
          const existing = list.find((prod) => prod.codigo === p.codigo);
          if (existing) {
            createdProducts.push({ ...p, productoId: existing.id });
            console.log(`  = Producto existente: [${p.codigo}] ${p.nombre}`);
          }
        } catch {
          console.log(`  ! Error buscando producto existente: [${p.codigo}] ${p.nombre}`);
        }
      } else {
        console.log(`  ! Error creando [${p.codigo}] ${p.nombre}: ${e.message}`);
      }
    }
  }
  console.log("");
  return createdProducts;
}

async function setPrecios(createdProducts) {
  const listas = ["LISTA_1", "LISTA_2", "LISTA_3"];
  const precioKeys = ["precioLista1", "precioLista2", "precioLista3"];
  let count = 0;

  console.log("Cargando precios (neto sin IVA) para las 3 listas...");
  let reqCount = 0;
  for (const product of createdProducts) {
    for (let i = 0; i < 3; i++) {
      // Throttle: pausar cada 80 requests para no superar el rate limit
      if (++reqCount % 80 === 0) {
        console.log("  (esperando 61s por rate limit...)");
        await new Promise((r) => setTimeout(r, 61000));
      }
      const precioConIva = product[precioKeys[i]];
      if (!precioConIva || precioConIva <= 0) continue;

      // Los precios del Excel incluyen IVA, extraer neto
      const precioNeto = Math.round((precioConIva / 1.21) * 100) / 100;

      try {
        await api("POST", "/precios", {
          productoId: product.productoId,
          listaPrecio: listas[i],
          precioNeto,
        });
        count++;
      } catch (e) {
        console.log(
          `  ! Error precio [${product.codigo}] ${listas[i]}: ${e.message}`
        );
      }
    }
  }
  console.log(`  ${count} precios cargados\n`);
}

async function main() {
  console.log("=== Importación de Productos desde Excel ===\n");

  try {
    await login();
    const productosExcel = readExcel();
    const familiasMap = await createFamilias(productosExcel);
    const subfamiliasMap = await createSubfamilias(productosExcel, familiasMap);
    const createdProducts = await createProductos(productosExcel, subfamiliasMap);
    await setPrecios(createdProducts);

    console.log("=== Importación completada ===");
    console.log(`  Productos importados: ${createdProducts.length}`);
    console.log(`  Familias: ${Object.keys(familiasMap).length}`);
    console.log(`  Subfamilias: ${Object.keys(subfamiliasMap).length}`);
  } catch (e) {
    console.error("\nError fatal:", e.message);
    process.exit(1);
  }
}

main();
