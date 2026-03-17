# Manual de Usuario — Distribuidora FON

## Índice

1. [Ingreso al Sistema](#1-ingreso-al-sistema)
2. [Panel Principal (Dashboard)](#2-panel-principal-dashboard)
3. [Configuración de ARCA (Facturación Electrónica)](#3-configuración-de-arca-facturación-electrónica)
4. [Consultar Contribuyente en ARCA](#4-consultar-contribuyente-en-arca)
5. [Gestión de Productos](#5-gestión-de-productos)
6. [Listas de Precios](#6-listas-de-precios)
7. [Gestión de Clientes](#7-gestión-de-clientes)
8. [Gestión de Proveedores](#8-gestión-de-proveedores)
9. [Ventas](#9-ventas)
10. [Facturación Electrónica](#10-facturación-electrónica)
11. [Remitos](#11-remitos)
12. [Compras](#12-compras)
13. [Stock](#13-stock)
14. [Cuentas Corrientes](#14-cuentas-corrientes)
15. [Reportes](#15-reportes)

---

## 1. Ingreso al Sistema

1. Abrí el navegador y accedé a la dirección del sistema.
2. Ingresá tu **Email** y **Contraseña**.
3. Hacé click en **Iniciar sesión**.
4. El sistema te redirige al Panel Principal.

> Si olvidaste tu contraseña, contactá al administrador del sistema.

---

## 2. Panel Principal (Dashboard)

Al ingresar, se muestra un resumen general con indicadores clave:

- **Ventas Hoy**: total facturado en el día.
- **Ventas del Mes**: acumulado del mes actual.
- **Deuda Total**: suma de saldos pendientes de clientes.
- **Productos Bajo Stock**: cantidad de productos por debajo del stock mínimo.

También se muestra una tabla con las **últimas ventas** realizadas.

---

## 3. Configuración de ARCA (Facturación Electrónica)

Antes de poder facturar, es necesario configurar la conexión con ARCA (ex AFIP).

### Pasos para configurar ARCA

1. Ir a **Facturación** en el menú lateral.
2. Click en **Configuración ARCA** (botón con ícono de engranaje).
3. Elegir el método de configuración:

### Configuración Automática (recomendada)

Esta opción se encarga de todo automáticamente:

1. Completar los campos:
   - **CUIT**: tu número de CUIT (ej: 20-12345678-9).
   - **Contraseña de Clave Fiscal**: la misma que usás para ingresar a ARCA/AFIP.
   - **Alias**: un nombre identificador (ej: "distribuidorafon").
   - **Punto de Venta**: número del punto de venta habilitado en ARCA (ej: 1).
2. Click en **Configurar**.
3. El sistema automáticamente:
   - Crea el certificado digital.
   - Autoriza los web services necesarios (facturación y padrón).
   - Guarda la configuración.

### Configuración Manual

Si ya tenés certificado digital propio:

1. Completar:
   - **CUIT**: tu número de CUIT.
   - **Punto de Venta**: número del punto de venta.
   - **Entorno**: Producción o Testing.
   - **Certificado PEM**: pegar el contenido del archivo `.pem` del certificado.
   - **Clave Privada PEM**: pegar el contenido del archivo `.key`.
2. Click en **Guardar configuración**.

### Verificar la conexión

Una vez configurado, podés hacer click en **Test de conexión** para verificar que todo funcione correctamente.

### Eliminar configuración

Si necesitás cambiar de CUIT o reconfigurar, usá el botón **Eliminar configuración** (rojo) para borrar los datos actuales y empezar de nuevo.

---

## 4. Consultar Contribuyente en ARCA

Permite buscar datos fiscales de cualquier persona o empresa por su CUIT, CUIL o DNI.

1. Ir a **Consultar ARCA** en el menú lateral.
2. Ingresar el número de documento (CUIT/CUIL/DNI).
3. Click en **Buscar**.
4. El sistema muestra:
   - Razón social / Nombre completo.
   - Condición frente al IVA.
   - Domicilio fiscal.
   - Actividades económicas.
5. Desde los resultados, podés crear directamente un **Cliente** o **Proveedor** con los datos ya completos haciendo click en los botones correspondientes.

---

## 5. Gestión de Productos

### Ver productos

1. Ir a **Productos** en el menú lateral.
2. Se muestra la lista con: código, nombre, subfamilia, proveedor, unidad, stock actual y alícuota de IVA.
3. Los productos con stock bajo se marcan con un indicador visual.

### Crear un producto

1. Click en **Nuevo Producto**.
2. Completar los campos:
   - **Código**: código interno del producto.
   - **Nombre**: nombre descriptivo.
   - **Subfamilia**: categoría del producto (seleccionar de la lista).
   - **Proveedor**: proveedor asociado (opcional).
   - **Unidad de Medida**: unidad, kg, litro, etc.
   - **Alícuota IVA**: porcentaje de IVA (0%, 10.5%, 21%, 27%).
   - **Stock Actual**: cantidad inicial en stock.
   - **Stock Mínimo**: cantidad mínima antes de la alerta.
   - **Descripción**: información adicional (opcional).
3. Click en **Guardar**.

### Importar productos desde Excel

Si tenés muchos productos, podés cargarlos masivamente:

1. Click en **Importar Excel**.
2. Seleccionar un archivo `.xlsx` con el formato:
   - Columnas: CODIGO, FAMILIA, TIPO (subfamilia), NOMBRE, Valor con IVA, LISTA 1, LISTA 2, LISTA 3.
3. El sistema crea automáticamente las familias, subfamilias, productos y precios.

### Gestionar Familias y Subfamilias

1. Desde la lista de productos, click en **Familias**.
2. Se pueden crear, editar y eliminar familias.
3. Dentro de cada familia, se gestionan las subfamilias.

---

## 6. Listas de Precios

El sistema maneja 3 listas de precios. Cada cliente se asigna a una lista.

1. Ir a **Precios** en el menú lateral.
2. Seleccionar la pestaña de la lista que querés modificar (Lista 1, Lista 2 o Lista 3).

### Editar precio individual

- Hacer click en el campo de precio del producto y modificarlo.

### Actualización masiva

1. Ingresar el **porcentaje** de aumento o descuento.
2. Opcionalmente, seleccionar una **familia** para aplicar solo a esos productos.
3. Click en **Aplicar** para actualizar todos los precios de esa lista.

---

## 7. Gestión de Clientes

### Ver clientes

1. Ir a **Clientes** en el menú lateral.
2. Se muestra la lista con razón social, documento, condición IVA, lista de precio asignada y límite de crédito.

### Crear un cliente

1. Click en **Nuevo Cliente**.
2. Completar:
   - **Tipo de Documento**: CUIT, DNI o CUIL.
   - **Número de Documento**: se puede buscar en ARCA para autocompletar.
   - **Razón Social**: nombre del cliente o empresa.
   - **Condición IVA**: Responsable Inscripto, Monotributista, Consumidor Final, etc.
   - **Lista de Precios**: Lista 1, 2 o 3.
   - **Límite de Crédito**: monto máximo de deuda permitida.
   - **Email, Teléfono, Dirección** (opcionales).
3. Click en **Guardar**.

> **Tip**: Si primero consultás el contribuyente en ARCA y hacés click en "Crear como Cliente", los datos se completan automáticamente.

---

## 8. Gestión de Proveedores

### Ver proveedores

1. Ir a **Proveedores** en el menú lateral.
2. Se muestra la lista con razón social, CUIT, condición IVA, teléfono y email.

### Crear un proveedor

1. Click en **Nuevo Proveedor**.
2. Completar: CUIT, Razón Social, Condición IVA, Dirección, Teléfono, Email, Contacto.
3. Click en **Guardar**.

> **Tip**: Igual que con clientes, podés crear proveedores desde la consulta de ARCA con datos prellenados.

---

## 9. Ventas

### Tipos de venta

El sistema permite dos tipos de venta:

- **En Blanco**: venta fiscal registrada ante ARCA. Genera factura electrónica con CAE. Incluye IVA.
- **En Negro**: venta no registrada ante ARCA. Genera un ticket interno. Sin IVA.

Ambos tipos descuentan stock automáticamente al confirmar.

### Crear una venta

1. Ir a **Ventas** → **Nueva Venta**.
2. Seleccionar:
   - **Cliente**: elegir de la lista.
   - **Lista de Precio**: se carga automáticamente según el cliente.
   - **Tipo de Venta**: En Blanco o En Negro.
   - **Discriminar IVA**: si corresponde.
   - **Descuento General %**: descuento aplicado al total (opcional).
   - **Observaciones** (opcional).
3. **Agregar productos**:
   - Buscar el producto.
   - Indicar la **cantidad**.
   - Opcionalmente, aplicar un **descuento %** por producto.
4. Click en **Guardar** para crear la venta como borrador.

### Flujo completo de una venta

1. **Borrador**: se pueden agregar, quitar o modificar productos.
2. **Confirmar**: click en **Confirmar Venta**. Se descuenta el stock y se registra el movimiento en cuenta corriente.
3. **Facturar** (solo ventas En Blanco): click en **Facturar** para generar la factura electrónica en ARCA.
4. **Ticket Interno** (solo ventas En Negro): se genera automáticamente al confirmar. Se puede descargar desde el detalle.

### Anular una venta

Desde el detalle de la venta, click en **Anular**. Se devuelve el stock y se revierte el movimiento de cuenta corriente.

---

## 10. Facturación Electrónica

### Ver comprobantes

1. Ir a **Facturación** en el menú lateral.
2. Se muestra la lista de comprobantes emitidos con: fecha, tipo (Factura A/B/C), número, cliente, CAE e importe.

### Descargar factura en PDF

1. Click en un comprobante para ver su detalle.
2. Click en **Descargar PDF**.
3. El PDF incluye el formato fiscal argentino completo: datos del emisor y receptor, detalle de productos, desglose de IVA, CAE, fecha de vencimiento y código QR de ARCA.

---

## 11. Remitos

Los remitos documentan la entrega de mercadería al cliente.

### Crear un remito

1. Ir a **Remitos** → **Nuevo Remito**.
2. Seleccionar:
   - **Cliente**: elegir de la lista.
   - **Venta asociada** (opcional): si se vincula a una venta confirmada, el remito NO descuenta stock (porque la venta ya lo hizo).
   - **Observaciones** (opcional).
3. Agregar productos y cantidades.
4. Click en **Guardar**.

### Flujo del remito

1. **Borrador**: se pueden agregar o quitar productos.
2. **Confirmar**: click en **Confirmar Remito**. Si no tiene venta asociada, descuenta stock.
3. **Descargar PDF**: una vez confirmado, se puede descargar el remito en PDF.

### Anular un remito

Desde el detalle, click en **Anular**. Si había descontado stock, se devuelve.

---

## 12. Compras

Las compras registran las adquisiciones a proveedores.

### Crear una compra

1. Ir a **Compras** → **Nueva Compra**.
2. Seleccionar:
   - **Proveedor**: elegir de la lista.
   - **Observaciones** (opcional).
3. Agregar productos:
   - Seleccionar producto.
   - Indicar **cantidad** y **precio de compra** (unitario).
   - El IVA se calcula automáticamente según la alícuota del producto.
4. Click en **Guardar**.

### Flujo completo de una compra

1. **Borrador**: se pueden agregar, quitar o modificar productos y precios.
2. **Confirmar**: click en **Confirmar Compra**.
3. **Recibir**: click en **Recibir Mercadería**. Se ingresa el stock automáticamente.

### Anular una compra

Desde el detalle, click en **Anular**. Si la mercadería ya fue recibida, se revierte el ingreso de stock.

---

## 13. Stock

### Ver stock actual

1. Ir a **Stock** en el menú lateral.
2. Se muestra cada producto con: código, nombre, stock actual, stock mínimo, unidad y estado (OK o Bajo Stock).

### Ingreso manual de stock

Para ajustes, devoluciones u otros ingresos que no son compras:

1. Click en **Ingreso de Stock**.
2. Seleccionar el **producto**.
3. Indicar la **cantidad** a ingresar.
4. Indicar el **motivo** (ej: "Ajuste de inventario", "Devolución").
5. Click en **Registrar**.

### Ver movimientos de stock

1. Click en **Movimientos**.
2. Se muestra el historial completo: fecha, producto, tipo (ENTRADA/SALIDA/AJUSTE), cantidad, stock anterior, stock posterior, motivo y usuario.
3. Se puede filtrar por producto y tipo de movimiento.

> **Nota**: Las ventas confirmadas generan salidas de stock automáticamente. Las compras recibidas generan entradas automáticamente.

---

## 14. Cuentas Corrientes

### Ver resumen de cuentas corrientes

1. Ir a **Cuentas Corrientes** en el menú lateral.
2. Se muestra la **deuda total** del sistema y una tabla con cada cliente deudor, su documento y saldo.

### Ver detalle de un cliente

1. Click en el cliente para ver su cuenta corriente.
2. Se muestra:
   - **Saldo actual** (positivo = el cliente debe, negativo = tiene saldo a favor).
   - **Historial de movimientos**: fecha, tipo, monto, saldo resultante y descripción.

### Registrar un pago

1. Desde el detalle del cliente, click en **Registrar Pago**.
2. Ingresar:
   - **Monto**: importe del pago.
   - **Descripción** (opcional): ej: "Pago en efectivo", "Transferencia bancaria".
3. Click en **Registrar**. El saldo se actualiza automáticamente.

---

## 15. Reportes

Ir a **Reportes** en el menú lateral para acceder a los siguientes informes:

### Reporte de Ventas

- **Filtros**: fecha desde/hasta, cliente, vendedor.
- **Muestra**: cantidad de ventas, subtotal, IVA y total.
- **Exportar**: CSV o Excel.

### IVA Ventas

- **Filtros**: fecha desde/hasta.
- **Muestra**: detalle por alícuota con base imponible e importe de IVA.
- **Exportar**: Excel.

### Stock Valorizado

- **Muestra**: cada producto con stock actual, precio unitario (Lista 1) y valor total del inventario.

### Productos Más Vendidos

- **Filtros**: fecha desde/hasta, cantidad de productos a mostrar.
- **Muestra**: ranking de productos por cantidad vendida y monto total.

### Compras vs Ventas

- **Filtros**: fecha desde/hasta.
- **Muestra**: total de ventas, total de compras, margen bruto en pesos y porcentaje de rentabilidad.

---

## Soporte

Ante cualquier duda o inconveniente técnico, contactar al administrador del sistema.
