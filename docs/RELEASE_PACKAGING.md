# RELEASE_PACKAGING.md — Empaquetado y Distribución

## Objetivo

Preparar la app para instalarse y usarse en Windows fuera del entorno de desarrollo.

---

## Tipos de release

### Portable

Carpeta o ejecutable que puede abrirse sin instalador.

Útil para pruebas y eventos rápidos.

### Instalador

Instalador Windows para uso más profesional.

Útil para distribución comercial.

---

## Versionado

Usar semver:

```txt
0.1.0
0.2.0
1.0.0
```

### Reglas

- `0.x`: desarrollo.
- `1.0.0`: primer release estable para evento real.
- Patch: bugs.
- Minor: funciones.
- Major: cambios incompatibles.

---

## Información visible

La app debe mostrar:

- nombre,
- versión,
- build,
- fecha de build,
- ambiente,
- ruta de datos.

---

## Build checklist

- [ ] Typecheck.
- [ ] Lint.
- [ ] Tests.
- [ ] Build renderer.
- [ ] Build Electron.
- [ ] Probar app empaquetada.
- [ ] Probar rutas de datos.
- [ ] Probar cámara.
- [ ] Probar impresión.
- [ ] Probar offline.
- [ ] Actualizar changelog.

---

## Instalador

Opciones futuras:

- electron-builder,
- NSIS,
- MSI si se requiere.

Debe permitir:

- instalar,
- actualizar,
- desinstalar,
- mantener datos de usuario salvo confirmación.

---

## Migraciones

Si cambia la base de datos:

- correr migraciones al iniciar,
- hacer backup previo,
- registrar versión de schema,
- no romper datos existentes.

---

## Exportación para soporte

La app debe permitir exportar diagnóstico:

```txt
diagnostics_<date>.zip
```

Incluye:

- logs,
- versión,
- configuración,
- estado de hardware,
- últimos errores.

No incluir fotos salvo que el usuario lo elija.

---

## Release notes

Cada release debe documentar:

- cambios,
- bugs corregidos,
- funciones nuevas,
- riesgos conocidos,
- pasos de actualización.

---

## Criterios para 1.0.0

- Flujo completo de evento.
- Captura estable.
- Composición estable.
- Impresión estable.
- Reimpresión.
- Historial.
- Offline.
- Instalador o portable probado.
- Documentación básica.
- Checklist de evento real aprobado.
