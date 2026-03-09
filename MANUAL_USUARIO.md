# 📖 MANUAL DE USUARIO — Portal del Sol
## Sistema Web de Gestión de Venta de Lotes

---

## 1. INTRODUCCIÓN

Portal del Sol es una plataforma digital que permite a los clientes gestionar la compra de lotes de terreno de forma sencilla y segura. Este manual explica paso a paso cómo usar el sistema.

**URL del sistema:** http://localhost:3000 (local) o tu URL de Vercel

---

## 2. ACCESO AL SISTEMA

### 2.1 Crear una cuenta nueva

1. En la página de inicio, haz clic en **"Registrarse"**
2. Completa el formulario:
   - Nombre y Apellido *(obligatorio)*
   - Correo electrónico *(obligatorio)*
   - Cédula y Teléfono *(opcional)*
   - Contraseña *(mínimo 8 caracteres)*
3. Haz clic en **"Crear Cuenta"**
4. Serás redirigido automáticamente a tu Dashboard

> 💡 El indicador de seguridad de contraseña te muestra si es débil o fuerte

### 2.2 Iniciar sesión

1. Haz clic en **"Iniciar Sesión"**
2. Ingresa tu correo y contraseña
3. Haz clic en **"Ingresar"**
4. El sistema te llevará a:
   - **Panel Admin** si eres administrador
   - **Dashboard** si eres cliente

### 2.3 Recuperar contraseña

1. En la página de login, haz clic en la pestaña **"Recuperar Acceso"**
2. Ingresa tu correo registrado
3. Recibirás un correo con un enlace para restablecer tu contraseña
4. Haz clic en el enlace del correo y escribe tu nueva contraseña

---

## 3. MÓDULOS DEL CLIENTE

### 3.1 Dashboard (Inicio)

Al ingresar verás un resumen de tu cuenta con:
- **Mis Lotes:** número de lotes que tienes
- **Total Pagado:** suma de todos tus pagos aprobados
- **Saldo Pendiente:** lo que te falta por pagar
- **PQRS Enviadas:** cantidad de solicitudes enviadas

También verás:
- Estado de cada uno de tus lotes con barra de progreso de pago
- Últimos 5 pagos registrados
- Últimas 3 PQRS enviadas

---

### 3.2 Catálogo de Lotes

**Acceso:** Menú → *Lotes*

Puedes explorar todos los lotes del proyecto:

**Filtros disponibles:**
- 🔍 Búsqueda por código (Ej: "A-01") o manzana
- Estado: Disponible / Reservado / Vendido
- Etapa del proyecto

**Ver detalle de un lote:**
- Haz clic en **"Ver Detalle"** en cualquier lote
- Verás: área en m², precio, estado, etapa y ubicación

---

### 3.3 Mis Pagos

**Acceso:** Menú → *Mis Pagos*

#### Estado de cuenta
Para cada lote comprado verás:
- Precio total del lote
- Monto ya pagado (verde)
- Saldo pendiente (naranja)
- Porcentaje completado con barra visual

#### Registrar un nuevo pago

1. Haz clic en **"+ Registrar Pago"**
2. Selecciona el lote para el cual pagas
3. Ingresa el **monto** del pago
4. Selecciona el **tipo de pago**:
   - Transferencia bancaria
   - Efectivo
   - Consignación
   - Cheque
5. Sube el **comprobante** de pago (PDF, JPG, PNG — máx 5MB) *(recomendado)*
6. Agrega notas adicionales como referencia del banco
7. Haz clic en **"Registrar"**

> ⚠️ El pago quedará en estado **"Pendiente"** hasta que el administrador lo apruebe.
> 
> ✅ Al registrar el pago, recibirás un correo de confirmación (si el email está configurado).

---

### 3.4 PQRS

**Acceso:** Menú → *PQRS*

#### Enviar una solicitud

1. Haz clic en **"+ Nueva PQRS"**
2. Selecciona el tipo:
   - 📋 **Petición:** Para solicitar información o servicios
   - 😤 **Queja:** Para manifestar inconformidad
   - ⚠️ **Reclamo:** Para exigir solución a un problema
   - 💡 **Sugerencia:** Para proponer mejoras
3. Escribe el **asunto** (resumen breve)
4. Escribe la **descripción** detallada
5. Haz clic en **"Enviar"**

#### Estados de una PQRS
| Estado | Significado |
|--------|------------|
| 🟡 Pendiente | Recibida, aún sin respuesta |
| 🔵 En proceso | Siendo atendida |
| ✅ Respondida | Ya tiene respuesta |
| ⚫ Cerrada | Finalizada |

#### Ver respuesta
- Haz clic en cualquier PQRS para ver los detalles y la respuesta del equipo

---

### 3.5 El Proyecto

**Acceso:** Menú → *El Proyecto*

Aquí encontrarás:
- Información general del proyecto Portal del Sol
- Ubicación y área total
- **Línea de tiempo de etapas:**
  - ✅ Completada
  - 🔵 Activa (en curso)
  - ⏳ Pendiente
- Beneficios: planos gratuitos, pago por cuotas, gestión digital

---

## 4. MÓDULOS DEL ADMINISTRADOR

### 4.1 Acceso al Panel Admin

Ingresa con:
- **Email:** admin@inmobiliaria.com
- **Contraseña:** Admin2024*

### 4.2 Dashboard Admin

Muestra en tiempo real:
- Total de lotes en el sistema
- Lotes disponibles
- Lotes vendidos
- Total de clientes registrados

---

### 4.3 Gestión de Lotes

**Crear nuevo lote:**
1. Haz clic en **"+ Nuevo Lote"**
2. Completa: Código, Etapa, Área m², Precio, Ubicación
3. Haz clic en **"Crear Lote"**

**Editar lote existente:**
1. Haz clic en **"✏️ Editar"** junto al lote
2. Puedes cambiar: Estado, Precio, Descripción
3. Haz clic en **"Guardar"**

> Los estados posibles son: **Disponible**, **Reservado**, **Vendido**

---

### 4.4 Registrar Compra

1. Ve a la pestaña **"Compras"**
2. Haz clic en **"+ Registrar Compra"**
3. Selecciona el **cliente** de la lista
4. Selecciona el **lote disponible**
5. Define el número de **cuotas acordadas**
6. Establece la **fecha de inicio**
7. Haz clic en **"Registrar"**

> Al registrar la compra, el lote cambia automáticamente a estado **"Vendido"**

---

### 4.5 Gestión de Pagos

En la pestaña **"Pagos"** verás todos los pagos del sistema.

**Para cada pago pendiente puedes:**
- ✅ **Aprobar:** El pago se suma al estado de cuenta del cliente
- ❌ **Rechazar:** El pago se marca como rechazado (no suma al saldo)

---

### 4.6 Gestión de PQRS

En la pestaña **"PQRS"** verás todas las solicitudes de clientes.

**Responder una PQRS:**
1. Haz clic en **"Responder"** junto a la solicitud
2. Lee el detalle de la solicitud
3. Escribe tu respuesta en el campo de texto
4. Haz clic en **"Enviar Respuesta"**

> La PQRS cambia automáticamente a estado **"Respondida"**

---

### 4.7 Usuarios

Consulta la lista completa de clientes registrados con:
- Nombre, correo, cédula, teléfono
- Rol asignado
- Fecha de registro

---

## 5. NAVEGACIÓN

### Barra lateral (Sidebar)
- En **escritorio:** siempre visible a la izquierda
- En **móvil:** presiona el botón ☰ (arriba a la izquierda) para abrirla

### Protección de sesión
- Al iniciar sesión, el botón "atrás" del navegador NO te llevará al login
- Para salir del sistema usa siempre la opción **"Cerrar Sesión"** del menú

---

## 6. NOTIFICACIONES

El sistema muestra notificaciones en la esquina superior derecha:
- ✅ Verde: operación exitosa
- ❌ Rojo: error
- ⚠️ Amarillo: advertencia
- ℹ️ Azul: información

---

## 7. PREGUNTAS FRECUENTES

**¿Mi pago fue registrado pero no se refleja en el saldo?**
Los pagos quedan en estado "Pendiente" hasta que el administrador los apruebe. Una vez aprobados, se reflejarán en tu estado de cuenta.

**¿Puedo registrar pagos sin comprobante?**
Sí, el comprobante es opcional. Sin embargo, es recomendable siempre adjuntarlo para facilitar la verificación.

**¿Puedo comprar más de un lote?**
Sí. El sistema permite tener múltiples lotes por cliente, cada uno con su propio historial de pagos.

**¿Cómo sé si mi PQRS fue respondida?**
En la lista de PQRS verás el estado actualizado. Si está en "Respondida", haz clic para ver la respuesta del equipo.

**¿Qué formatos acepta el comprobante de pago?**
PDF, JPG, JPEG y PNG. Tamaño máximo: 5MB.

---

*Manual de Usuario v1.0 — Portal del Sol*
*Sistema Web Inmobiliario ADSO-19*
