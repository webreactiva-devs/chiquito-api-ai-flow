# Plan de Migración: TypeScript + SQLite + Fastify

## Fase 1: Configuración Base TypeScript

### 1.1 Instalación de dependencias
- [x] Instalar TypeScript y herramientas de desarrollo
  ```bash
  npm install -D typescript tsx @types/node
  ```

### 1.2 Configuración TypeScript
- [x] Crear `tsconfig.json` con ES modules y strict mode
- [x] Actualizar `package.json`:
  - Cambiar scripts para usar `tsx`
  - Añadir script `build` para compilación

### 1.3 Migración de archivos
- [x] Renombrar `src/server.js` → `src/server.ts`
- [x] Renombrar `src/app.js` → `src/app.ts`
- [x] Añadir tipos a variables y funciones existentes
- [x] Crear `src/types/index.ts` con interfaces (Joke, Category, etc.)

### 1.4 Verificación
- [x] Ejecutar `npm run dev` y verificar que el servidor arranca
- [x] Ejecutar `npm test` y verificar que todos los tests pasan
- [x] Probar manualmente: `curl http://localhost:3000/api/jokes`

### 1.5 Documentación
- [x] Actualizar `CLAUDE.md` con nuevos comandos TypeScript
- [x] Actualizar `docs/openapi.yml` si hay cambios en responses

---

## Fase 2: Testing Trophy - Estructura Base

### 2.1 Configuración de Vitest
- [x] Instalar Vitest
  ```bash
  npm install -D vitest @vitest/coverage-v8
  ```
- [x] Crear `vitest.config.ts`

### 2.2 Estructura de directorios
- [x] Crear estructura de tests:
  ```
  tests/
  ├── unit/
  ├── integration/
  └── e2e/
  ```
- [x] Mover `tests/app.test.js` → `tests/integration/jokes.test.ts`
- [x] Adaptar tests existentes a Vitest y TypeScript

### 2.3 Scripts de testing
- [x] Añadir scripts en `package.json`:
  - `test:unit` - tests unitarios
  - `test:integration` - tests de integración
  - `test:e2e` - tests end-to-end
  - `test` - ejecuta todos en orden

### 2.4 Verificación
- [x] Ejecutar `npm run test:integration` y verificar que pasan los tests migrados
- [x] Ejecutar `npm test` completo

### 2.5 Documentación
- [x] Actualizar `CLAUDE.md` con nuevos comandos de testing

---

## Fase 3: Migración a Fastify

### 3.1 Instalación de dependencias
- [x] Instalar Fastify y plugins
  ```bash
  npm install fastify @fastify/cors
  npm uninstall express
  npm install -D @types/node
  ```

### 3.2 Reescritura del servidor
- [x] Reescribir `src/app.ts` con Fastify:
  - Configurar CORS
  - Definir schemas JSON para validación
  - Migrar todas las rutas existentes
- [x] Actualizar `src/server.ts` para inicialización Fastify

### 3.3 Actualización de tests
- [x] Actualizar `tests/integration/jokes.test.ts` para Fastify
  - Usar `app.inject()` en lugar de Supertest
- [x] Eliminar dependencia de Supertest
  ```bash
  npm uninstall supertest
  ```

### 3.4 Verificación
- [x] Ejecutar `npm run dev` y verificar servidor
- [x] Ejecutar `npm run test:integration` y verificar todos los tests
- [x] Probar manualmente todos los endpoints:
  - `GET /health`
  - `GET /api/jokes`
  - `GET /api/jokes?category=clásico`
  - `GET /api/jokes/random`
  - `GET /api/jokes/1`
  - `GET /api/categories`

### 3.5 Documentación
- [x] Actualizar `CLAUDE.md` con cambios de Fastify
- [x] Actualizar `docs/openapi.yml` con schemas de validación

---

## Fase 4: Migración a SQLite

### 4.1 Instalación de dependencias
- [x] Instalar better-sqlite3
  ```bash
  npm install better-sqlite3
  npm install -D @types/better-sqlite3
  ```

### 4.2 Estructura de base de datos
- [x] Crear `src/db/connection.ts` - singleton de conexión
- [x] Crear `src/db/schema.ts` - definición de tablas:
  ```sql
  CREATE TABLE jokes (
    id INTEGER PRIMARY KEY,
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL
  );
  ```
- [x] Crear `src/db/init.ts` - script de inicialización y seed
- [x] Crear `src/db/queries.ts` - funciones de consulta tipadas

### 4.3 Script de inicialización
- [x] Añadir script `db:init` en `package.json`
- [x] Migrar datos de `data/chiquito.json` a SQLite
- [x] Añadir `data/chiquito.db` a `.gitignore`

### 4.4 Migración de rutas
- [x] Actualizar `src/app.ts` para usar queries SQL
- [x] Eliminar lectura de JSON file

### 4.5 Tests unitarios de BD
- [x] Crear `tests/unit/db.test.ts` con tests de queries
- [x] Usar BD en memoria para tests: `:memory:`

### 4.6 Verificación
- [x] Ejecutar `npm run db:init` y verificar creación de BD
- [x] Ejecutar `npm run test:unit` y verificar tests de BD
- [x] Ejecutar `npm run test:integration` y verificar todos los tests
- [x] Ejecutar `npm test` completo
- [x] Probar manualmente todos los endpoints

### 4.7 Documentación
- [x] Actualizar `CLAUDE.md` con comandos de BD
- [x] Documentar estructura de tablas

---

## Fase 5: Sistema de Votaciones

### 5.1 Esquema de base de datos
- [x] Añadir tabla `votes` en `src/db/schema.ts`:
  ```sql
  CREATE TABLE votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    joke_id INTEGER NOT NULL,
    vote_type TEXT CHECK(vote_type IN ('up', 'down')) NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (joke_id) REFERENCES jokes(id)
  );
  ```
- [x] Añadir queries de votación en `src/db/queries.ts`

### 5.2 Nuevos endpoints
- [x] `POST /api/jokes/:id/vote` - registrar voto
  - Body: `{ "type": "up" | "down" }`
  - Response: `{ "upvotes": number, "downvotes": number, "score": number }`
- [x] `GET /api/jokes/:id/votes` - obtener conteo de votos

### 5.3 Modificar respuestas existentes
- [x] Añadir campo `score` en respuestas de jokes individuales
- [x] Añadir campo `votes` en `GET /api/jokes/:id`

### 5.4 Tests
- [x] Crear `tests/unit/votes.test.ts` - tests de queries de votos
- [x] Crear `tests/integration/votes.test.ts` - tests de endpoints
- [x] Actualizar `tests/integration/jokes.test.ts` con nuevos campos

### 5.5 Verificación
- [x] Ejecutar `npm run db:init` para recrear BD con nueva tabla
- [x] Ejecutar `npm run test:unit`
- [x] Ejecutar `npm run test:integration`
- [x] Ejecutar `npm test` completo
- [x] Probar manualmente:
  ```bash
  curl -X POST http://localhost:3000/api/jokes/1/vote -H "Content-Type: application/json" -d '{"type":"up"}'
  curl http://localhost:3000/api/jokes/1/votes
  ```

### 5.6 Documentación
- [x] Actualizar `docs/openapi.yml` con nuevos endpoints de votación
- [x] Actualizar `CLAUDE.md` con información del sistema de votos

---

## Fase 6: Sistema de Estadísticas

### 6.1 Esquema de base de datos
- [x] Añadir tabla `stats` en `src/db/schema.ts`:
  ```sql
  CREATE TABLE stats (
    joke_id INTEGER PRIMARY KEY,
    views INTEGER DEFAULT 0,
    last_viewed TEXT,
    FOREIGN KEY (joke_id) REFERENCES jokes(id)
  );
  ```
- [x] Añadir queries de estadísticas en `src/db/queries.ts`

### 6.2 Tracking de vistas
- [x] Crear hook/middleware para incrementar vistas en:
  - `GET /api/jokes/:id`
  - `GET /api/jokes/random`

### 6.3 Nuevos endpoints
- [x] `GET /api/stats` - estadísticas globales
  - Response: `{ "totalJokes": number, "totalVotes": number, "totalViews": number }`
- [x] `GET /api/stats/top` - ranking de jokes
  - Query params: `?by=views|votes&limit=10`
  - Response: array de jokes con stats

### 6.4 Modificar respuestas existentes
- [x] Añadir campo `views` en `GET /api/jokes/:id`

### 6.5 Tests
- [x] Crear `tests/unit/stats.test.ts` - tests de queries de stats
- [x] Crear `tests/integration/stats.test.ts` - tests de endpoints
- [x] Actualizar tests existentes con nuevos campos

### 6.6 Verificación
- [x] Ejecutar `npm run db:init` para recrear BD
- [x] Ejecutar `npm run test:unit`
- [x] Ejecutar `npm run test:integration`
- [x] Ejecutar `npm test` completo
- [x] Probar manualmente:
  ```bash
  curl http://localhost:3000/api/stats
  curl http://localhost:3000/api/stats/top?by=views&limit=5
  ```

### 6.7 Documentación
- [x] Actualizar `docs/openapi.yml` con endpoints de estadísticas
- [x] Actualizar `CLAUDE.md` con información del sistema de stats

---

## Fase 7: Tests E2E y Finalización

### 7.1 Tests End-to-End
- [ ] Crear `tests/e2e/flows.test.ts` con flujos completos:
  - Flujo de usuario viendo jokes y votando
  - Verificar que stats se actualizan correctamente
  - Verificar rankings

### 7.2 Análisis estático con Biome
- [ ] Instalar Biome
  ```bash
  npm install -D @biomejs/biome
  ```
- [ ] Inicializar configuración
  ```bash
  npx @biomejs/biome init
  ```
- [ ] Configurar `biome.json` para TypeScript
- [ ] Añadir scripts en `package.json`:
  - `lint` - linting con Biome
  - `format` - formateo con Biome
  - `check` - linting + formateo
- [ ] Añadir script `test:types` para verificación de tipos

### 7.3 Scripts finales
- [ ] Verificar que `package.json` tiene todos los scripts:
  ```json
  {
    "scripts": {
      "dev": "tsx watch src/server.ts",
      "start": "tsx src/server.ts",
      "build": "tsc",
      "db:init": "tsx src/db/init.ts",
      "lint": "biome lint src tests",
      "format": "biome format --write src tests",
      "check": "biome check src tests",
      "test:types": "tsc --noEmit",
      "test:unit": "vitest run tests/unit",
      "test:integration": "vitest run tests/integration",
      "test:e2e": "vitest run tests/e2e",
      "test": "npm run test:types && npm run check && npm run test:unit && npm run test:integration && npm run test:e2e"
    }
  }
  ```

### 7.4 Verificación final
- [ ] Ejecutar `npm run check` sin errores (lint + format)
- [ ] Ejecutar `npm run test:types` sin errores
- [ ] Ejecutar `npm test` completo - todos los tests pasan
- [ ] Verificar cobertura de tests

### 7.5 Documentación final
- [ ] Actualizar `CLAUDE.md` con:
  - Todos los comandos finales
  - Arquitectura actualizada
  - Estructura de BD
  - Testing trophy
- [ ] Actualizar `docs/openapi.yml` con especificación completa
- [ ] Actualizar `README.md` con nueva documentación

---

## Estructura Final del Proyecto

```
├── src/
│   ├── app.ts              # Fastify app con rutas
│   ├── server.ts           # Inicialización del servidor
│   ├── types/
│   │   └── index.ts        # Interfaces TypeScript
│   └── db/
│       ├── connection.ts   # Conexión SQLite
│       ├── schema.ts       # Definición de tablas
│       ├── init.ts         # Script de inicialización
│       └── queries.ts      # Funciones de consulta
├── data/
│   ├── chiquito.json       # Datos seed
│   └── chiquito.db         # Base de datos SQLite
├── tests/
│   ├── unit/
│   │   ├── db.test.ts
│   │   ├── votes.test.ts
│   │   └── stats.test.ts
│   ├── integration/
│   │   ├── jokes.test.ts
│   │   ├── votes.test.ts
│   │   └── stats.test.ts
│   └── e2e/
│       └── flows.test.ts
├── docs/
│   ├── openapi.yml
│   └── migration-plan.md
├── tsconfig.json
├── vitest.config.ts
├── biome.json
├── CLAUDE.md
└── package.json
```

---

## Dependencias Finales

```json
{
  "dependencies": {
    "fastify": "^5.x",
    "@fastify/cors": "^10.x",
    "better-sqlite3": "^11.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "tsx": "^4.x",
    "@types/node": "^22.x",
    "@types/better-sqlite3": "^7.x",
    "vitest": "^2.x",
    "@vitest/coverage-v8": "^2.x",
    "@biomejs/biome": "^1.x"
  }
}
```
