# 🏡 Portal del Sol — Sistema Web Inmobiliario
### ADSO-19 | Gestión de Venta de Lotes de Terreno

---

## 📋 Descripción

Sistema web completo para la comercialización de lotes habitacionales. Permite a los clientes registrarse, consultar lotes disponibles, gestionar pagos por cuotas, seguimiento de su estado de cuenta y envío de PQRS.

---

## 🛠️ Tecnologías

| Capa | Tecnología |
|------|-----------|
| Backend | Node.js + Express |
| Base de datos | PostgreSQL |
| Frontend | HTML5 + CSS3 + JavaScript Vanilla |
| Autenticación | express-session + bcryptjs |
| Email | Nodemailer |
| Archivos | Multer |

---

## ⚡ Inicio Rápido (Windows)

### Prerequisitos
- [Node.js](https://nodejs.org) v18+
- [PostgreSQL](https://www.postgresql.org/download/windows/) instalado y corriendo

### Pasos

```bash
# 1. Entra a la carpeta del proyecto
cd inmobiliaria

# 2. Copia el archivo de configuración
copy .env.example .env

# 3. Edita .env con tu contraseña de PostgreSQL
# Abre .env y cambia DB_PASSWORD=TU_PASSWORD

# 4. Instala dependencias
npm install

# 5. Crea la base de datos y datos iniciales
npm run setup

# 6. Inicia el servidor
npm start
```

Abre tu navegador en: **http://localhost:3000**

---

## 🔑 Credenciales

| Rol | Email | Contraseña |
|-----|-------|-----------|
| Admin | admin@inmobiliaria.com | Admin2024* |

---

## 📁 Estructura del Proyecto

```
inmobiliaria/
├── server.js              ← Punto de entrada
├── setup.js               ← Script de configuración inicial
├── database.sql           ← Script SQL puro (para Supabase)
├── package.json
├── .env.example
├── config/
│   ├── db.js              ← Conexión PostgreSQL
│   └── email.js           ← Configuración email
├── middleware/
│   └── auth.js            ← Autenticación y roles
├── routes/
│   ├── auth.js            ← Login, registro, reset
│   ├── lotes.js           ← CRUD de lotes
│   ├── pagos.js           ← Pagos y compras
│   ├── pqrs.js            ← PQRS
│   └── proyecto.js        ← Info proyecto y estadísticas
└── public/
    ├── index.html         ← Landing page
    ├── css/style.css      ← Estilos globales
    ├── js/app.js          ← JS compartido
    ├── pages/             ← Páginas de la aplicación
    └── uploads/           ← Comprobantes de pago
```

---

## 🗄️ Diagrama Entidad-Relación

```
┌─────────────┐       ┌─────────────┐       ┌────────────┐
│   USUARIOS  │       │   COMPRAS   │       │   LOTES    │
├─────────────┤       ├─────────────┤       ├────────────┤
│ id (PK)     │──┐    │ id (PK)     │──┐    │ id (PK)    │
│ nombre      │  └───▶│ usuario_id  │  └───▶│ etapa_id   │
│ apellido    │       │ lote_id ────┼──────▶│ codigo     │
│ email       │       │ cuotas_acdas│       │ area_m2    │
│ cedula      │       │ fecha_inicio│       │ precio     │
│ telefono    │       │ notas       │       │ ubicacion  │
│ password    │       │ created_at  │       │ descripcion│
│ rol         │       └──────┬──────┘       │ estado     │
│ email_verif │              │              │ created_at │
│ created_at  │              ▼              └─────┬──────┘
└──────┬──────┘       ┌─────────────┐             │
       │              │    PAGOS    │      ┌───────┘
       │              ├─────────────┤      ▼
       │              │ id (PK)     │  ┌─────────────┐
       │              │ compra_id   │  │   ETAPAS    │
       │              │ monto       │  ├─────────────┤
       │              │ tipo_pago   │  │ id (PK)     │
       │              │ comprobante │  │ proyecto_id │
       │              │ notas       │  │ nombre      │
       │              │ estado      │  │ descripcion │
       │              │ fecha_pago  │  │ orden       │
       │              └─────────────┘  │ estado      │
       │                               └──────┬──────┘
       │                                      │
       │                              ┌───────┘
       │                              ▼
       │                      ┌─────────────┐
       │                      │  PROYECTOS  │
       │                      ├─────────────┤
       │                      │ id (PK)     │
       │                      │ nombre      │
       │                      │ descripcion │
       │                      │ ubicacion   │
       │                      │ area_total  │
       │                      │ created_at  │
       │                      └─────────────┘
       │
       ▼
┌─────────────┐
│    PQRS     │
├─────────────┤
│ id (PK)     │
│ usuario_id  │
│ tipo        │
│ asunto      │
│ descripcion │
│ estado      │
│ respuesta   │
│ fecha_resp  │
│ created_at  │
└─────────────┘
```

**Relaciones:**
- Un `USUARIO` puede tener muchas `COMPRAS`
- Un `USUARIO` puede enviar muchas `PQRS`
- Una `COMPRA` pertenece a un `USUARIO` y un `LOTE`
- Una `COMPRA` puede tener muchos `PAGOS`
- Un `LOTE` pertenece a una `ETAPA`
- Una `ETAPA` pertenece a un `PROYECTO`

---

## 📡 API Endpoints

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | /api/auth/login | Iniciar sesión | — |
| POST | /api/auth/registro | Registro | — |
| POST | /api/auth/logout | Cerrar sesión | ✅ |
| GET | /api/me | Usuario actual | — |
| GET | /api/lotes | Catálogo lotes | — |
| GET | /api/lotes/:id | Detalle lote | — |
| POST | /api/lotes | Crear lote | Admin |
| PUT | /api/lotes/:id | Editar lote | Admin |
| GET | /api/lotes/cliente/mis-lotes | Mis lotes | Cliente |
| GET | /api/pagos/mis-pagos | Mis pagos | Cliente |
| POST | /api/pagos | Registrar pago | Cliente |
| GET | /api/pagos/todos | Todos los pagos | Admin |
| PUT | /api/pagos/:id/estado | Aprobar/rechazar | Admin |
| POST | /api/pagos/compra | Registrar compra | Admin |
| GET | /api/pqrs/mis-pqrs | Mis PQRS | Cliente |
| POST | /api/pqrs | Enviar PQRS | Cliente |
| GET | /api/pqrs/todas | Todas las PQRS | Admin |
| PUT | /api/pqrs/:id/responder | Responder PQRS | Admin |
| GET | /api/proyecto | Info proyecto | — |
| GET | /api/proyecto/estadisticas | Estadísticas | — |
| GET | /api/proyecto/usuarios | Lista usuarios | Admin |

---

## 🌐 Despliegue en Producción (Supabase + Vercel)

### Paso 1: Subir código a GitHub

```bash
# En la carpeta inmobiliaria:
git init
git add .
git commit -m "Portal del Sol - Sistema inmobiliario"

# Crear repositorio en github.com (sin README)
git remote add origin https://github.com/TUUSUARIO/inmobiliaria.git
git branch -M main
git push -u origin main
```

### Paso 2: Base de datos en Supabase (gratuito)

1. Ve a [supabase.com](https://supabase.com) → Crear cuenta → **New Project**
2. Nombre: `portal-del-sol`, elige una región cercana
3. Copia la contraseña del proyecto (guárdala bien)
4. Ve a **SQL Editor** → Pega el contenido de `database.sql` → **Run**
5. Ve a **Settings → Database** → copia:
   - Host: `db.XXXX.supabase.co`
   - Puerto: `5432`
   - Usuario: `postgres`
   - Password: la que creaste
   - Database: `postgres`
6. Ve a **Settings → Database → Connection pooling** → copia la **Connection string** (modo Transaction)

### Paso 3: Desplegar en Vercel

1. Ve a [vercel.com](https://vercel.com) → Login con GitHub
2. **Add New Project** → importa tu repositorio
3. **Framework Preset:** `Other`
4. **Build Command:** (vacío)
5. **Output Directory:** (vacío)
6. En **Environment Variables** agrega:

| Variable | Valor |
|----------|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Connection string de Supabase |
| `SESSION_SECRET` | Una cadena aleatoria larga |
| `APP_URL` | https://tu-proyecto.vercel.app |

7. Click **Deploy** ✅

> **Nota:** `DATABASE_URL` tiene prioridad sobre las variables individuales de BD cuando `NODE_ENV=production`.

### Paso 4: Ejecutar setup en Supabase
Después del despliegue, el setup.js ya no es necesario porque ejecutaste el `database.sql` directamente en Supabase. Los datos se crean desde ahí.

---

## 📧 Configurar Email (Opcional)

Para enviar correos reales con Gmail:
1. Habilita verificación en 2 pasos en tu cuenta Gmail
2. Ve a [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Genera una contraseña de aplicación
4. Agrega en `.env` o Vercel:
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tucorreo@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx
EMAIL_FROM=Portal del Sol <tucorreo@gmail.com>
```

> Sin esto configurado, el sistema funciona normalmente sin enviar correos.

---

## 🔒 Seguridad

- Contraseñas cifradas con `bcrypt` (salt rounds: 12)
- Sesiones con `express-session`
- Roles: `admin` y `cliente`
- Validación de sesión en cada ruta protegida
- Archivos subidos con límite de 5MB

---

## 📋 Casos de Uso Cubiertos

| CU | Descripción | Estado |
|----|-------------|--------|
| CU-01 | Registro de Usuario | ✅ |
| CU-02 | Inicio/Cierre de Sesión | ✅ |
| CU-03 | Compra de Lote (admin) | ✅ |
| CU-04 | Registro de Pago y Comprobante | ✅ |
| CU-05 | Consulta Historial de Pagos | ✅ |
| CU-06 | Registro y Seguimiento PQRS | ✅ |

---

*Proyecto ADSO-19 — Sistema Web Inmobiliario*
