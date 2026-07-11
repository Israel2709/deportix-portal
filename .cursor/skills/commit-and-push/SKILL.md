---
name: commit-and-push
description: >-
  Revisa cambios, crea un commit con mensaje breve en español y hace push al
  remoto. Usar cuando el usuario invoque /commit-and-push, pida commitear y
  pushear, o quiera subir cambios al repositorio actual.
disable-model-invocation: true
---

# Commit and Push

Flujo completo: inspeccionar cambios → commit en español → push. Ejecutar los comandos; no solo describirlos.

## Paso 1: Revisar cambios

Ejecutar en paralelo:

```bash
git status
git diff
git diff --staged
git branch -vv
git log -5 --format='%s'
```

Determinar:
- ¿Hay cambios (staged, unstaged o untracked)?
- Rama actual y remoto de seguimiento
- Estilo reciente de mensajes del repo

**Sin cambios:** informar al usuario y detenerse. No crear commit vacío.

## Paso 2: Redactar mensaje en español

Mensaje de **1–2 líneas**, en **español**, que resuma el *porqué* de los cambios:

- Línea 1: resumen claro (tipo + alcance). Ej.: `feat(american-football): agregar selectores buscables en formularios`
- Línea 2 (opcional): detalle breve si aporta contexto

Verbos útiles: `agregar`, `corregir`, `actualizar`, `refactorizar`, `eliminar`, `mejorar`.

**Antes de commitear:**
- No incluir archivos con secretos (`.env`, credenciales). Advertir si el usuario los pidió.
- Respetar el estilo del repo si usa convenciones distintas.

## Paso 3: Commit

Protocolo de seguridad:

- **NUNCA** modificar `git config`
- **NUNCA** `--no-verify`, `--no-gpg-sign` ni hooks omitidos
- **NUNCA** `push --force` a `main`/`master` (advertir si lo piden)
- Evitar `git commit --amend` salvo que el usuario lo pida explícitamente y el commit no esté pusheado

Secuencia:

```bash
git add <archivos relevantes>
git commit -m "$(cat <<'EOF'
Mensaje en español aquí.

EOF
)"
git status
```

Si el hook de pre-commit modifica archivos, incluirlos en un **nuevo** commit (no amend salvo las reglas anteriores).

## Paso 4: Push

```bash
git push
```

Si la rama no tiene upstream:

```bash
git push -u origin HEAD
```

Requiere permisos de red (`full_network` o `all`).

## Paso 5: Manejo de conflictos y errores

No intentar resolver conflictos automáticamente sin contexto del usuario. Detenerse, explicar en español y pedir que el usuario resuelva.

### Push rechazado (non-fast-forward)

Remoto tiene commits que local no tiene.

**Sugerencia al usuario:**

```bash
git fetch origin
git log HEAD..origin/<rama> --oneline   # ver qué hay en remoto
git pull --rebase origin <rama>         # preferir rebase si el equipo lo usa
# o: git pull origin <rama>             # merge si prefieren merge commits
# resolver conflictos si aparecen
git push
```

### Conflictos de merge/rebase

Indicar archivos en conflicto (`git status`) y pasos:

1. Abrir cada archivo marcado con `<<<<<<<`, `=======`, `>>>>>>>`
2. Elegir el código correcto y eliminar marcadores
3. `git add <archivo>` por cada uno resuelto
4. Continuar:
   - Merge: `git commit` (o `git merge --continue`)
   - Rebase: `git rebase --continue`
5. `git push`

Para abortar: `git merge --abort` o `git rebase --abort`.

### Cambios locales perderían commits del remoto

Explicar opciones sin forzar en main:

- **Integrar remoto:** `git pull --rebase` → resolver → `git push`
- **Revisar divergencia:** `git fetch && git log --oneline --graph --all -15`

Solo sugerir `git push --force-with-lease` si el usuario lo pide explícitamente y **no** es `main`/`master`.

### Otros errores

| Error | Acción |
|-------|--------|
| Sin remoto configurado | `git remote -v`; configurar remoto con el usuario |
| Sin permisos / auth | Verificar SSH o credenciales; no guardar tokens en el commit |
| Hook falla | Corregir el problema del hook; nuevo commit, no amend forzado |

## Respuesta al usuario

Al terminar con éxito, reportar brevemente:
- Rama y remoto
- Mensaje del commit
- Resultado del push

Si hubo bloqueo, dar diagnóstico claro y los comandos sugeridos para que el usuario resuelva.

## Ejemplo de mensaje

Cambios: nuevo `SearchableSelect`, formularios de american-football actualizados, tests.

```
feat(american-football): integrar selectores buscables en formularios de catálogo

Conecta equipos, temporadas y partidos con la API de catálogo y actualiza tests.
```
