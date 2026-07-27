# Branching-Konzept — NOURA-App

Repo: `niclasjakob/NOURA-App` · Stand: 2026-07-27

Das Repo hat zwei aktive Mitwirkende (Niclas, Robert) und ist noch im
Prototypen-Stadium. Das Modell ist deshalb bewusst schlank gehalten: ein
dauerhafter Branch, kurzlebige Arbeitsbranches, Zusammenführung per Pull
Request.

---

## Die Branches

### `main` — der geschützte Hauptstand

`main` ist der einzige dauerhafte Branch. Er soll jederzeit baubar sein
(`npm run build` läuft fehlerfrei durch) und den vorzeigbaren Stand
enthalten.

**Nie direkt auf `main` committen.** Jede Änderung läuft über einen
Arbeitsbranch und einen Pull Request. Das gilt auch für kleine Fixes — der
Aufwand ist minimal und es hält die Historie nachvollziehbar.

### Arbeitsbranches — kurzlebig, ein Thema pro Branch

Ein Branch = ein abgeschlossenes Thema. Er wird von `main` abgezweigt, lebt
idealerweise wenige Tage und wird nach dem Merge gelöscht. Lange laufende
Branches driften von `main` weg und erzeugen Konflikte — das ist der
häufigste vermeidbare Schmerz.

---

## Namensschema

```
<typ>/<kurzbeschreibung-in-bindestrichen>
```

Kleinschreibung, Englisch, keine Umlaute. Der Typ sagt auf einen Blick,
worum es geht:

| Typ | Wofür | Beispiel |
|---|---|---|
| `feat/` | Neue Funktionalität | `feat/click-prototype` |
| `fix/` | Fehlerbehebung | `fix/font-mismatch` |
| `design/` | Reine Gestaltung, Tokens, Styling | `design/glass-card-tokens` |
| `proto/` | Experiment, bewusst wegwerfbar | `proto/alt-onboarding` |
| `chore/` | Werkzeug, Konfiguration, Aufräumen | `chore/add-eslint` |
| `docs/` | Nur Dokumentation | `docs/branching` |

`proto/`-Branches dürfen unfertig sein und müssen nicht zwingend nach `main`
zurück — sie sind für Richtungsentscheidungen gedacht.

---

## Der Ablauf

**1. Aktuellen Stand holen und abzweigen**

```bash
git checkout main
git pull
git checkout -b feat/mein-thema
```

**2. Arbeiten und committen**

Commits im Conventional-Commits-Format (siehe unten). Lieber mehrere kleine,
verständliche Commits als ein großer Sammel-Commit.

**3. Hochladen**

```bash
git push -u origin feat/mein-thema
```

**4. Pull Request öffnen**

```bash
gh pr create --base main --fill
```

Der PR beschreibt, *was* sich ändert und *warum*. Bei visuellen Änderungen
gehören Screenshots dazu — das ist bei einer Design-getriebenen App der
schnellste Weg zu einer Rückmeldung.

**5. Nach dem Merge aufräumen**

```bash
git checkout main && git pull
git branch -d feat/mein-thema
```

---

## Commit-Nachrichten

```
<typ>(<bereich>): <was sich ändert>
```

Typen: `feat`, `fix`, `refactor`, `docs`, `style`, `chore`, `perf`, `test`

Beispiele:

```
feat(clip): Clip-Feed-Screen mit Swipe-Navigation
fix(fonts): General Sans statt Plus Jakarta Sans laden
docs(branching): Branching-Konzept ergänzt
```

Die Beschreibung ist auf Deutsch, im Präsens, ohne Punkt am Ende.

---

## Zusammenarbeit mit Niclas

Beide Seiten arbeiten auf demselben Repo (Robert als Collaborator, GitHub-
Account `mellow-rob`). Damit sich niemand in die Quere kommt:

- **Vor jedem neuen Branch `git pull` auf `main`** — sonst zweigt man von
  einem veralteten Stand ab.
- **Läuft ein Branch länger, regelmäßig `main` nachziehen:**
  ```bash
  git checkout feat/mein-thema
  git merge main
  ```
  Konflikte früh und in kleinen Portionen lösen ist deutlich einfacher, als
  sie am Ende gesammelt aufzuarbeiten.
- **Kein `push --force` auf `main`** und nicht auf Branches, an denen jemand
  anderes arbeitet. Das überschreibt fremde Arbeit unwiderruflich.

---

## Was noch fehlt (bewusst offen)

Diese Punkte sind für den aktuellen Prototypen-Stand nicht nötig, werden
aber relevant, sobald NOURA Richtung Produkt geht:

- **Branch-Schutz auf `main`** (Einstellung im Repo durch Niclas als
  Eigentümer): PR-Pflicht und mindestens eine Freigabe erzwingen.
- **Automatische Prüfung per GitHub Action**: `npm run build` bei jedem PR —
  fängt Fehler ab, bevor sie auf `main` landen.
- **Ein `develop`-Branch oder Release-Tags**: erst sinnvoll, wenn es echte
  Veröffentlichungen im App Store gibt. Vorher wäre es unnötiger Aufwand.
