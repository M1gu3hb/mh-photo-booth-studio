# PHASE_10_RELEASE.md — Empaque, Branding & Release 1.0

## Objetivo
Convertir la app en software **distribuible e instalable** en una Windows limpia, con
branding configurable, cerrando el release **1.0.0**. Aquí termina el /goal.

## Depende de
Fases 0-9 (producto funcional y auditado). Lee antes: `docs/RELEASE_PACKAGING.md`,
`docs/SECURITY_AND_LICENSE.md`, `docs/DESIGN_SYSTEM.md (branding)`, `docs/TESTING_CHECKLIST.md`.

## En alcance
- **electron-builder**: **instalador Windows** (NSIS) + versión **portable**. Instalar/
  actualizar/desinstalar conservando datos de usuario salvo confirmación.
- Pantalla **"Acerca de"**: nombre, versión, build, fecha de build, ambiente, ruta de datos.
- **Branding configurable** (cumple `DESIGN_SYSTEM.md` y DEC-010): tema **Jardines por
  defecto** + edición de logo, nombre visible, texto de bienvenida, color principal
  (vía tokens/`settings`). Reskin sin tocar componentes.
- **Export/Import** de eventos y de plantillas (`.zip`).
- **Licencia local básica NO bloqueante** (`docs/SECURITY_AND_LICENSE.md`): archivo local
  (nombre instalación/fecha/features); **nunca** bloquear un evento en curso; modo
  emergencia si falla.
- **Migraciones al iniciar** con backup previo + versión de schema.
- **Docs de usuario**: quick-start (instalar, crear evento, plantilla, operar, imprimir,
  reimprimir) — Markdown y/o PDF/DOCX (`docx`/`pdf`).
- **Build checklist** completo de `docs/RELEASE_PACKAGING.md`.
- Versionado **semver 1.0.0**; release notes + `CHANGELOG`.

## Fuera de alcance
Activación online, multi-idioma completo, multi-cliente avanzado (Fase 11+).

## Datos & IPC
`settings`/branding, licencia local. IPC: `app.getInfo`, `branding.get/set`,
`export.event/template`, `import.event/template`, `license.status`.

## Pantallas / Componentes
Acerca de, Branding (en Configuración), Export/Import.

## Notas de diseño
Splash/acerca-de premium con marca Jardines por defecto; branding editor claro; consistencia
con `DESIGN_BRAND.md`.

## Flujo completo (anti-huérfano)
- Cambiar branding **se ve** en toda la UI, splash e impresos.
- Export genera `.zip` real; Import lo restaura (round-trip) y aparece en la app.
- La licencia local nunca bloquea el evento; su estado se ve en "Acerca de".

## Skills
`security-review`, `review`, `docx`/`pdf` (manual de usuario).

## Criterio de salida (checklist)
- [ ] Instalar en una **Windows limpia** y operar **sin** entorno de desarrollo.
- [ ] Rutas de datos correctas; imprimir y trabajar offline funcionan post-instalación.
- [ ] Branding configurable (Jardines default) reflejado en toda la app.
- [ ] Export/Import de eventos y plantillas (round-trip).
- [ ] Migraciones al iniciar con backup; "Acerca de" con versión 1.0.0.
- [ ] **Criterios para 1.0.0** de `docs/RELEASE_PACKAGING.md` cumplidos.
- [ ] `docs/TESTING_CHECKLIST.md` aprobado completo.

## Audit Gate 10 (FINAL → verificación reforzada)
Build checklist completo; instalación limpia probada; testing checklist aprobado;
`security-review` final; release 1.0.0 en `CHANGELOG` y `AUDIT_LOG`. 
**Si todo pasa: el /goal está cumplido.**
