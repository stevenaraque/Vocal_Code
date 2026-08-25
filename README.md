# VocalCode - Editor de Código por Voz

Editor de código accesible controlado por voz para personas con discapacidad motriz.
**Stack:** Django 5.0.14 + React 19.2.8 + PostgreSQL (Supabase) + CodeMirror 6 + Web Speech API

> Grupo 8 - Yesid Armando Amaya Cañaveral / Steven Alejandro Araque Castro - ADSO 3171062 - SENA CIMM

---

## Estructura

```
Vocal_code/
├── Backend/                 # Django 5.0.14
│   ├── vocalcode_backend/   # settings, urls, asgi, wsgi
│   ├── apps/
│   │   ├── users/           # Auth JWT (register, login, logout, me)
│   │   ├── projects/        # CRUD Proyectos (python/javascript/csharp)
│   │   ├── voice_commands/  # Catálogo comandos + historial
│   │   └── executions/      # Sandbox ejecución Python/JS
│   ├── requirements.txt
│   ├── .env                 # DATABASE_URL Supabase + REDIS_URL (opcional)
│   └── manage.py
├── frontend/                # React 19.2.8 + Vite 5.4.21
│   ├── src/
│   │   ├── context/         # AuthContext, ProjectContext
│   │   ├── pages/           # Login, Register, Dashboard, Editor
│   │   ├── components/      # Layout, PrivateRoute
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## Requisitos

- Python 3.14.7
- Node.js v24.19.0 / npm 11.17.0
- PostgreSQL: Supabase (Session Pooler)

---

## Backend - Instalación

```bash
cd Backend
python -m venv venv
# Windows
.\venv\Scripts\activate
# macOS/Linux
# source venv/bin/activate

pip install -r requirements.txt

# Configurar .env
# Copiar .env.example a .env y completar DATABASE_URL de Supabase
# DATABASE_URL=postgresql://postgres.skvtlwhrabkuuknhietf:3171062_grupo8@aws-0-us-east-1.pooler.supabase.com:5432/postgres

python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
# http://localhost:8000/api/docs/  (Swagger)
# http://localhost:8000/admin/
```

## Frontend - Instalación

```bash
cd frontend
npm install
npm run dev
# http://localhost:5173
```

El frontend proxea `/api` y `/ws` a `http://localhost:8000` (ver `vite.config.js`).

---

## Variables de entorno

**Backend/.env**
```
DEBUG=1
SECRET_KEY=dev-secret-key-change-in-prod
DATABASE_URL=postgresql://postgres.skvtlwhrabkuuknhietf:3171062_grupo8@aws-0-us-east-1.pooler.supabase.com:5432/postgres
REDIS_URL=redis://redis:6379/0  # opcional, comentado en settings si no se usa
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173
GEMINI_API_KEY=
```

---

## API principal

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | /api/auth/register/ | Registro |
| POST | /api/auth/login/ | Login JWT |
| POST | /api/auth/logout/ | Logout |
| GET | /api/auth/me/ | Usuario actual |
| GET/POST | /api/projects/ | Listar / Crear |
| GET/PATCH/DELETE | /api/projects/<id>/ | Detalle / Editar / Eliminar (soft) |
| GET | /api/voice/commands/ | Catálogo comandos |
| GET | /api/voice/history/ | Historial |

---

## Git - Subir a repositorio

```bash
cd Vocal_code
git init
git add .
git commit -m "feat: VocalCode Django + React inicial"
git branch -M main
git remote add origin https://github.com/<usuario>/vocalcode.git
git push -u origin main
```

> `.gitignore` ya excluye `venv/`, `node_modules/`, `.env`, `__pycache__/`, `db.sqlite3`

---

## Notas

- Web Speech API requiere **HTTPS** o `localhost`.
- WebSockets / Celery / Redis están deshabilitados por defecto (`settings.py` y `asgi.py` comentados). Para activarlos: descomentar `channels` en `INSTALLED_APPS`, `CHANNEL_LAYERS` y `CELERY_*`, y restaurar `asgi.py` con Channels.
- Supabase usa **Session Pooler** (IPv4, puerto 5432) → `sslmode=require`
