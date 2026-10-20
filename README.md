# Cuaderno de biofísica — seguimiento del TFG

Web estática para seguir el TFG de biofísica de adhesión celular en capilares. Incluye dashboard, mapa de temas, tareas, bibliografía y fichas de simulación. Los datos se sincronizan entre dispositivos con una cuenta de Supabase.

## Qué incluye

- **Dashboard:** avance calculado a partir de las tareas completadas, tareas abiertas, temas consolidados y modelos registrados.
- **Mapa científico:** temas agrupados en medio fluido, biología/mecánica celular, adhesión molecular, modelización y análisis.
- **Tareas:** fase, tema asociado, estado, fecha objetivo y criterio de cierre.
- **Bibliografía:** autoría, año, DOI/URL, tema, estado de lectura y notas.
- **Simulaciones:** pregunta física, hipótesis, variables, resultados, interpretación y enlace a código.
- **Acceso privado:** Supabase Auth y Row Level Security (RLS).

## Publicación paso a paso

### 1. Crear el proyecto de Supabase

1. Crea un proyecto en [Supabase](https://supabase.com/).
2. En el panel del proyecto, localiza la **Project URL** y la clave pública **anon / publishable** (según la interfaz).
3. En **SQL Editor**, crea una consulta nueva, copia todo el contenido de `supabase-schema.sql` y ejecútala.
4. En **Authentication → URL Configuration**, añade la URL de tu GitHub Pages a `Site URL` y a los `Redirect URLs` permitidos. Para un repositorio llamado `tfg-biofisica`, normalmente será `https://TU-USUARIO.github.io/tfg-biofisica/`.
5. Decide si quieres exigir confirmación por correo en **Authentication → Providers → Email**. Si la confirmación está activada, al registrarte revisa el correo antes de iniciar sesión.

### 2. Configurar la web

1. Abre `config.js`.
2. Sustituye `PEGA_AQUI_LA_URL_DE_TU_PROYECTO` por la Project URL.
3. Sustituye `PEGA_AQUI_TU_CLAVE_ANON_O_PUBLISHABLE` por la clave pública anon/publishable.
4. No uses nunca la `service_role` key ni una clave secreta en el navegador. La URL y la clave pública son visibles para los visitantes; la privacidad depende de Auth y de las políticas RLS incluidas en el SQL.

### 3. Subir a GitHub

1. Crea un repositorio, por ejemplo `tfg-biofisica`.
2. Sube `index.html`, `styles.css`, `app.js`, `config.js`, `supabase-schema.sql` y `README.md` a la raíz del repositorio.
3. En GitHub, abre **Settings → Pages**.
4. En **Build and deployment**, selecciona **Deploy from a branch**, elige `main` y la carpeta `/ (root)`, y guarda.
5. Espera a que GitHub Pages publique el sitio. Abre la URL generada.
6. Añade esa URL a los `Redirect URLs` de Supabase si aún no lo has hecho.

### 4. Primer uso

1. Abre la web y crea tu cuenta.
2. Si se requiere confirmación, confirma el correo y entra.
3. La primera sesión crea una lista inicial de tareas y el mapa de temas para tu usuario.
4. Edita las tareas de ejemplo y añade tus referencias, modelos e hitos reales.
5. Entra desde móvil, tablet u ordenador con la misma cuenta: los datos se recuperan de Supabase.

## Seguridad y copias de respaldo

- Las tablas usan RLS y las políticas limitan cada operación a filas cuyo `user_id` coincide con `auth.uid()`.
- No desactives RLS ni publiques una clave `service_role`.
- Si el proyecto o el repositorio es público, `config.js` puede verse. Esto es esperado para la clave pública; nunca debe contener secretos.
- GitHub Pages publica el código, no los datos de la base de datos. Tus registros viven en Supabase.
- Para una copia de seguridad periódica, usa las herramientas de exportación de datos de Supabase o añade más adelante una función de exportación CSV/JSON a la aplicación.
- El avance general es el porcentaje de tareas marcadas como completadas, no una evaluación automática de la calidad científica.

## Personalización

- Los bloques temáticos y las tareas iniciales están definidos al principio de `app.js` (`TOPIC_GROUPS` y `SEED_TASKS`).
- Las fases están definidas en `PHASES`.
- Los estados de tema distinguen entre explorar, comprender y consolidar.
- Los estados de simulación distinguen entre idea, desarrollo, ejecución, análisis y validación.

## Limitaciones de esta primera versión

- No incluye adjuntos de PDF ni lectura automática de bibliografía.
- No incluye una agenda/calendario visual ni exportación de memoria.
- Los registros de bibliografía son fichas de seguimiento, no un gestor bibliográfico completo.
- El enlace de una simulación apunta a tu repositorio o notebook; el código de simulación no se ejecuta dentro de la web.
- Para datos privados, mantén las tablas y políticas RLS como están y no compartas las credenciales de tu cuenta.

## Diagnóstico rápido

**No puedo crear cuenta / no entra:** revisa proveedor Email y confirmación en Supabase, correo/contraseña y URLs permitidas.

**Error al cargar datos:** confirma que ejecutaste `supabase-schema.sql` completo y que las tablas existen en `public`.

**Error de permisos:** comprueba que RLS está habilitado, que las políticas existen y que estás conectado con una cuenta autenticada.

**Los cambios no aparecen en otro dispositivo:** asegúrate de iniciar sesión con la misma cuenta y revisa la conectividad y el estado de sincronización.
