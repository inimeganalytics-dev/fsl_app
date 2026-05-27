# FSL App — Federación de Simracing Latinoamericana

Aplicación web completa para la FSL. Panel público para pilotos + panel de administración.

## Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Supabase (Auth + PostgreSQL)
- **Deploy**: Vercel

## Cómo hacer deploy en Vercel (5 pasos)

### 1. Subir a GitHub
```bash
cd fsl-app
git init
git add .
git commit -m "FSL App v1.0"
# Crear repo en GitHub y hacer push
git remote add origin https://github.com/TU_USUARIO/fsl-app.git
git push -u origin main
```

### 2. Conectar en Vercel
1. Ir a [vercel.com](https://vercel.com)
2. Hacer click en **"Add New Project"**
3. Importar el repo de GitHub
4. Vercel detecta Next.js automáticamente

### 3. Variables de entorno en Vercel
En la pantalla de configuración antes de deploy, agregar:
```
```

### 4. Deploy
Click en **"Deploy"** — Vercel buildea y despliega automáticamente.

### 5. Crear admin en Supabase
1. Ir al dashboard de Supabase → **Authentication → Users**
2. Click **"Add User"** 
3. Ingresar tu email y contraseña
4. ¡Listo! Podés loguearte en 

## URLs de la app

| Página | Descripción |
|--------|-------------|
| `/` | Landing page con campeonatos y próximos eventos |
| `/campeonatos` | Lista de todos los campeonatos por serie |
| `/campeonatos/[id]` | Clasificación, calendario y sanciones del campeonato |
| `/eventos` | Calendario completo de eventos |
| `/inscribirse` | Formulario público de inscripción |
| `/denuncia` | Formulario público de denuncia |
| `/admin` | Login del panel de administración |
| `/admin/dashboard` | Panel de control con estadísticas |
| `/admin/campeonatos` | Gestión de campeonatos |
| `/admin/eventos` | Gestión de fechas/eventos |
| `/admin/pilotos` | Gestión de pilotos y LP |
| `/admin/resultados` | Carga de resultados por evento |
| `/admin/sanciones` | Gestión de sanciones |
| `/admin/inscripciones` | Revisión de inscripciones |
| `/admin/denuncias` | Revisión de denuncias |

## Base de datos

Proyecto Supabase: **FSL APP** (pfjplocmvtsujzxtlzsz)

Tablas principales:
- `series` — FSL-M, FSL-E
- `categories` — F1/F2/F3/F4/TCR/GT3/GT4/LMP2/Hypercar
- `championships` — Campeonatos por temporada
- `events` — Fechas del calendario
- `pilots` + `users` — Pilotos registrados
- `race_results` — Resultados por evento
- `sanctions` — Sanciones emitidas
- `public_registrations` — Inscripciones públicas (sin login)
- `public_complaints` — Denuncias públicas (sin login)
