# Imperio Shop — Verificación de cuentas de Discord

Página única donde un usuario pulsa un botón, autoriza la app de Discord y recibe automáticamente
el rol **Verificado**. Antes de entregarlo, el sistema comprueba que no sea una multicuenta,
que no use VPN/proxy y que la cuenta no sea desechable.

- **Frontend:** React 19 + Tailwind 4 + shadcn/ui + tRPC
- **Backend:** Express + tRPC 11 (todo en `server/`)
- **Base de datos:** MySQL/TiDB con Drizzle ORM
- **Integración:** Discord Developer Portal (OAuth2) + API de Discord

---

## Cómo funciona

1. El usuario pulsa **«Verificarme con Discord»**.
2. Se le envía a Discord, que devuelve a la web con un `code`.
3. El servidor canjea el `code` (con el client secret) y obtiene los **metadatos** de la cuenta:
   ID, nombre, correo verificado y fecha de creación (calculada del ID snowflake).
4. Analiza la **conexión**: VPN, proxy, Tor y centros de datos.
5. Analiza el **dispositivo**: firma del navegador para detectar varias cuentas del mismo equipo.
6. Suma el **historial**: cuántas cuentas distintas pasaron por esa IP o equipo en 30 días.
7. Decide:
   - **Aprobado** → lo une al servidor y le asigna el rol de verificado.
   - **Bloqueado** → muestra los motivos exactos y no entrega el rol.

### Reglas de decisión

| Señal | Efecto | Puntaje |
| --- | --- | --- |
| VPN, proxy o Tor | Bloqueo directo | 100 |
| Centro de datos (VPS/hosting) | Bloqueo directo | 100 |
| Cuenta más nueva que el mínimo | Bloqueo directo | 100 |
| Dispositivo ya usado por otra cuenta | Bloqueo directo | 100 |
| Conexión ya usada por otras cuentas | Bloqueo directo | 100 |
| Zona horaria incoherente con la IP | Suma riesgo | 30 |
| Correo de Discord sin verificar | Suma riesgo | 25 |
| Sin firma de dispositivo | Suma riesgo | 15 |
| Cuenta con poca antigüedad | Suma riesgo | 10 |

Se bloquea si **cualquier señal marcada como directa** aparece, o si la suma de riesgo alcanza el
umbral. Los umbrales se configuran con variables de entorno (ver abajo).

---

## Variables de entorno

> **Importante:** el archivo `.project-config.json` de la carpeta contiene tus credenciales.
> **No lo subas a GitHub.** Ya está excluido en `.gitignore`.

Crea estas variables en tu servicio de hosting (Vercel, Railway, Render, VPS…):

| Variable | Obligatoria | Descripción |
| --- | --- | --- |
| `DATABASE_URL` | Sí | Cadena de conexión MySQL/TiDB. |
| `JWT_SECRET` | Sí | Secreto para firmar la sesión. |
| `DISCORD_CLIENT_ID` | Sí | OAuth2 → Client ID de tu app. |
| `DISCORD_CLIENT_SECRET` | Sí | OAuth2 → Client Secret. |
| `DISCORD_BOT_TOKEN` | Sí | Pestaña Bot → Token del bot. |
| `DISCORD_GUILD_ID` | Recomendada | ID del servidor. Si falta o es inválido, se detecta solo. |
| `DISCORD_VERIFIED_ROLE_ID` | Recomendada | ID del rol de verificado. Si falta, busca uno llamado «Verificado». |
| `DISCORD_REDIRECT_URI` | Opcional | Fuerza la URL de retorno si usas un dominio fijo. |
| `VERIFY_MIN_ACCOUNT_DAYS` | Opcional | Antigüedad mínima de la cuenta (por defecto `30`). |
| `VERIFY_MAX_ACCOUNTS_PER_IP` | Opcional | Cuentas por conexión (por defecto `2`). |
| `VERIFY_MAX_ACCOUNTS_PER_DEVICE` | Opcional | Cuentas por dispositivo (por defecto `2`). |
| `VERIFY_MAX_RISK` | Opcional | Riesgo máximo permitido (por defecto `40`). |
| `IPQUALITYSCORE_API_KEY` | Opcional | Mejora mucho la detección de VPN residencial. |

### Valores reales de este proyecto

- **DISCORD_CLIENT_ID:** `1550563568510967948`
- **DISCORD_GUILD_ID correcto:** `1550271990852624477` (servidor *Imperio Shop*)
- **DISCORD_VERIFIED_ROLE_ID:** `1553212899659481168` (rol *Verificado*)

> El `DISCORD_GUILD_ID` que se guardó por error contenía el token del bot, no el ID del servidor.
> Corrígelo al desplegar; aun así el sistema lo detecta automáticamente, así que funciona igual.

---

## Configuración en Discord Developer Portal

1. **OAuth2 → Redirects:** añade la URL exacta donde estará la web terminada en `/`.
   Ejemplo: `https://tu-dominio.com/`
   - Cada URL nueva hay que añadirla aquí, o Discord rechazará la vuelta.
   - Sin barra al final distinta, sin `www` que no use el usuario: debe coincidir carácter por carácter.
2. **Bot:** activa **Server Members Intent** y guarda.
3. **Permisos del bot:** necesita **Manage Roles** (Gestionar roles).
4. **Jerarquía:** arrastra el rol del bot **por encima** del rol *Verificado*, o no podrá asignarlo.
5. **Invitación del bot:** scopes `bot` + `applications.commands`, con permiso *Gestionar roles*.

---

## Instalación y arranque

```bash
# 1. Instalar dependencias
pnpm install

# 2. Crear las tablas en la base de datos
pnpm drizzle-kit generate
pnpm db:push

# 3. Desarrollo
pnpm dev            # http://localhost:3000

# 4. Producción
pnpm build
pnpm start
```

### Comprobar que todo está bien conectado

```bash
pnpm test
```

Ejecuta 22 pruebas: 15 del motor antifraude (VPN, multicuentas, antigüedad, IDs de Discord) y 6 que
**validan tus credenciales contra la API real de Discord** (token del bot, servidor, rol existente y
jerarquía correcta). Si algo está mal configurado, te dice exactamente qué.

---

## Estructura

```
client/
  index.html                     Metadatos, fuentes y favicons
  src/
    pages/Verify.tsx             Página de verificación (la principal)
    pages/Panel.tsx              Panel de control con métricas y registros
    lib/fingerprint.ts           Firma del dispositivo
    lib/content.ts               Recursos y textos
    App.tsx                      Rutas
server/
  discordVerify.ts               Motor: OAuth, metadatos, VPN, antifraude
  verifyRouter.ts                Procedimientos tRPC
  db.ts                          Consultas a la base de datos
  secrets.test.ts                Validación de credenciales contra Discord
  discordVerify.test.ts          Pruebas del motor antifraude
drizzle/
  schema.ts                      Tablas: users, verifications, verification_events
```

---

## Preguntas frecuentes

**¿Qué ve el usuario si usa VPN?**
Una pantalla clara: «Verificación rechazada», con el motivo («Se detectó VPN, proxy o red Tor…»),
su nivel de riesgo y un botón para volver a intentarlo.

**¿Dónde veo quién intentó entrar?**
En `/panel`. Muestra totales, verificados, bloqueados, VPN detectadas y los últimos 25 intentos con
nombre, ID, país, proveedor de internet, riesgo y motivo. Se actualiza solo cada 8 segundos.

**¿Se guardan datos personales?**
Solo lo necesario para auditar: ID de Discord, nombre, correo, IP, país, proveedor, zona horaria,
navegador y un hash del dispositivo (no el dato original). No se guarda ninguna contraseña.

**¿Puede alguien colarse sin el rol?**
No. El rol lo asigna el servidor con el token del bot; el navegador nunca puede pedirlo por su cuenta.

**¿Y si alguien bloqueado es legítimo?**
Revisa su caso en `/panel`. De momento el desbloqueo es manual: desde Discord o subiendo
`VERIFY_MAX_ACCOUNTS_PER_IP` / desactivando la regla correspondiente.