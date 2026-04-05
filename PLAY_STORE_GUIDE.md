# 📱 Guía: Publicar Ococa Enganchado en Google Play Store

## Resumen del proceso

```
PWA desplegada en la web → Bubblewrap genera AAB → Subir a Google Play Console
```

Tiempo estimado: ~2-3 horas (sin contar la revisión de Google, que tarda 1-7 días).

---

## PASO 1: Desplegar la PWA en un dominio con HTTPS

TWA **requiere** que la PWA esté en un dominio real con HTTPS.
La opción más fácil y gratuita es **Vercel**:

1. Subí el proyecto a GitHub (ya lo tenés listo)
2. Andá a [vercel.com](https://vercel.com) → "Import Project" → seleccioná el repo
3. Framework preset: **Vite** → Deploy
4. Vercel te da una URL tipo `ococa-enganchado.vercel.app` con HTTPS incluido
5. (Opcional) Conectá un dominio personalizado si tenés uno

**Verificá que la PWA funcione:** abrí la URL en Chrome Android y confirmá que aparece el botón "Instalar" o "Agregar a pantalla de inicio".

---

## PASO 2: Crear cuenta de Google Play Developer

1. Andá a [play.google.com/console](https://play.google.com/console)
2. Pagá los **$25 USD** (pago único, de por vida)
3. Completá la verificación de identidad (puede tardar 1-2 días)

---

## PASO 3: Instalar herramientas necesarias

En tu computadora necesitás:

```bash
# Instalar Node.js (si no lo tenés)
# https://nodejs.org

# Instalar Bubblewrap (empaqueta la PWA como app Android)
npm install -g @anthropic-anthropic/anthropic@anthropic
npm install -g @nicolo-ribaudo/bubblewrap

# Instalar Java JDK 17+ (requerido por Android SDK)
# https://adoptium.net/

# Bubblewrap descarga Android SDK automáticamente en el primer uso
```

> **Nota**: Si tenés problemas con Bubblewrap, la alternativa es [PWABuilder.com](https://www.pwabuilder.com) que genera el paquete Android desde el navegador sin instalar nada.

---

## PASO 4A: Generar el AAB con Bubblewrap (opción línea de comandos)

```bash
# Crear carpeta para el proyecto Android
mkdir ococa-twa && cd ococa-twa

# Inicializar el TWA (reemplazá la URL con tu dominio real)
bubblewrap init --manifest="https://TU-DOMINIO.vercel.app/manifest.json"
```

Bubblewrap te va a pedir:

| Campo | Valor |
|-------|-------|
| App name | Ococa Enganchado |
| Short name | Enganchado |
| Package ID | `cr.ococa.enganchado` |
| Starting URL | `https://TU-DOMINIO.vercel.app/` |
| Theme color | `#3D8B7A` |
| Background color | `#f5f2ed` |
| Signing key | Crear nueva (¡GUARDÁ EL KEYSTORE Y LA CONTRASEÑA!) |

```bash
# Compilar el AAB (Android App Bundle)
bubblewrap build
```

Esto genera `app-release-bundle.aab` — el archivo que subís a Google Play.

---

## PASO 4B: Generar con PWABuilder (opción sin instalar nada)

1. Andá a [pwabuilder.com](https://www.pwabuilder.com)
2. Ingresá la URL de tu PWA desplegada
3. Click en "Package for stores" → "Android"
4. Seleccioná "Google Play" → configurá el Package ID como `cr.ococa.enganchado`
5. Descargá el ZIP con el AAB listo

---

## PASO 5: Configurar Digital Asset Links

Para que Google verifique que la app y el sitio web son del mismo dueño:

1. Bubblewrap te muestra un **SHA-256 fingerprint** al crear el keystore
2. Creá el archivo `public/.well-known/assetlinks.json`:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "cr.ococa.enganchado",
      "sha256_cert_fingerprints": [
        "TU_SHA256_FINGERPRINT_ACÁ"
      ]
    }
  }
]
```

3. Hacé redeploy del sitio web con este archivo
4. Verificá en: `https://TU-DOMINIO.vercel.app/.well-known/assetlinks.json`

**Esto es crítico** — sin esto, la app abre Chrome en vez de mostrarse como app nativa.

---

## PASO 6: Subir a Google Play Console

1. Abrí [Google Play Console](https://play.google.com/console)
2. "Crear aplicación" → Nombre: **Ococa Enganchado**
3. Completá la ficha de Play Store:

| Campo | Valor sugerido |
|-------|---------------|
| Título | Ococa Enganchado – Economía Circular |
| Descripción corta | Marketplace comunitario de reutilización en Ococa, Acosta 🇨🇷 |
| Categoría | Compras |
| Clasificación de contenido | Para todos |
| País | Costa Rica |

4. Subí screenshots (tomá capturas de la app en Chrome DevTools modo móvil)
5. **Producción** → "Crear nueva versión" → Subí el archivo `.aab`
6. Enviá para revisión

---

## PASO 7: Esperar aprobación

Google revisa la app en **1-7 días** (primera vez puede tardar más).

---

## Notas importantes

- **El keystore es IRREEMPLAZABLE** — si lo perdés, no podés actualizar la app nunca más. Guardalo en un lugar seguro con la contraseña.
- **Digital Asset Links** debe estar correctamente configurado antes de subir la app, sino aparece la barra de Chrome arriba.
- **Actualizaciones** son instantáneas: como es una TWA, solo actualizás el sitio web y la app se actualiza sola. No necesitás subir nuevo AAB a menos que cambies algo del manifiesto.
- **Costo total**: $25 USD (cuenta de developer) + hosting gratuito en Vercel = **$25 USD total**.

---

## Checklist final

- [ ] PWA desplegada con HTTPS
- [ ] Manifest.json accesible
- [ ] Service Worker registrado
- [ ] Íconos en todos los tamaños
- [ ] Cuenta Google Play Developer activa ($25)
- [ ] AAB generado con Bubblewrap o PWABuilder
- [ ] Digital Asset Links configurado
- [ ] Ficha de Play Store completa (screenshots, descripción)
- [ ] AAB subido a Play Console
- [ ] Aprobación recibida 🎉

---

Hecho con 💚 para la comunidad de Ococa
