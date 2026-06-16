# Sportverein Dashboard

Ein professionelles Web-Dashboard für Sportvereine zur Verwaltung von Mitgliedern, Prüfungen, Checklisten und Dokumenten.

---

## Features

- **Mitgliederverwaltung** — Profilkarten mit Gürteleinfärbung, Filterung nach Name/Gürtel/Status/Alter
- **Mitgliederprofil** — Detailseite mit Stammdaten, Prüfungshistorie und Checklistenstatus
- **Prüfungsverwaltung** — Übersicht kommender und vergangener Prüfungen
- **Prüfungs-Checklisten** — Editierbare Vorlagen mit Pflichtpunkten und Prüfungsbereitschaftsstatus
- **Dokumentenverwaltung** — Drag & Drop Upload, Vorschau, Download, Ablaufdatum-Tracking
- **Dashboard** — Statistiken, Gürteleinteilung, nächste Prüfungen
- **Rollen & Rechte** — Admin, Trainer, Leser mit Supabase RLS abgesichert
- **Responsive** — Desktop, Tablet und Mobile

---

## Technologie-Stack

| Bereich | Technologie |
|---------|-------------|
| Frontend | Next.js 15 (App Router) |
| Styling | Tailwind CSS |
| Backend/DB | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Dateispeicher | Supabase Storage |
| Hosting | Railway |

---

## Einrichtung

### 1. Repository klonen

```bash
git clone https://github.com/dein-nutzer/sportverein-dashboard
cd sportverein-dashboard
npm install
```

### 2. Supabase Projekt anlegen

1. Gehe zu [supabase.com](https://supabase.com) und erstelle ein neues Projekt
2. Warte bis das Projekt initialisiert ist
3. Gehe zu **Project Settings → API** und kopiere:
   - `Project URL`
   - `anon public key`
   - `service_role key` (geheim, nie öffentlich)

### 3. Umgebungsvariablen

```bash
cp .env.example .env.local
```

Trage deine Werte ein:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_MAX_FILE_SIZE_MB=10
```

### 4. Datenbankschema einrichten

Gehe im Supabase Dashboard zu **SQL Editor** und führe nacheinander aus:

```sql
-- 1. Schema und Tabellen
-- Inhalt von: supabase/migrations/001_initial_schema.sql

-- 2. Row Level Security
-- Inhalt von: supabase/migrations/002_rls_policies.sql

-- 3. Storage Policies
-- Inhalt von: supabase/migrations/003_storage_policies.sql

-- 4. Seed-Daten (optional)
-- Inhalt von: supabase/seed/001_seed_data.sql
```

### 5. Storage Buckets

Die Buckets werden automatisch durch Migration 003 erstellt. Falls nicht, lege sie manuell an:

**Supabase Dashboard → Storage → New Bucket**

| Bucket Name | Public | Max Größe | Typen |
|-------------|--------|-----------|-------|
| `avatars` | ✅ Ja | 5 MB | JPG, PNG, WebP |
| `member-documents` | ❌ Nein | 10 MB | PDF, JPG, PNG, DOCX |

### 6. Ersten Admin-Nutzer anlegen

1. Gehe zu **Supabase → Authentication → Users → Invite User**
2. Trage E-Mail und Passwort ein
3. Nach dem ersten Login: In SQL Editor die Rolle auf Admin setzen:

```sql
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'admin@deinverein.de';
```

### 7. Lokal starten

```bash
npm run dev
```

App läuft unter [http://localhost:3000](http://localhost:3000)

---

## Deployment auf Railway

### Vorbereitung

1. Account bei [railway.app](https://railway.app) anlegen
2. GitHub Repository verbinden
3. New Project → Deploy from GitHub Repo

### Umgebungsvariablen bei Railway

Railway Dashboard → Dein Service → Variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
NEXT_PUBLIC_APP_URL=https://dein-projekt.railway.app
NEXT_PUBLIC_MAX_FILE_SIZE_MB=10
```

### Build-Einstellungen

Railway erkennt Next.js automatisch. Falls nötig:

- **Build Command:** `npm run build`
- **Start Command:** `npm start`

### Eigene Domain

Railway Dashboard → Settings → Domains → Custom Domain hinzufügen.

Danach `NEXT_PUBLIC_APP_URL` auf die neue Domain setzen.

---

## Anpassungen

### Neue Gürtelstufe hinzufügen

Im Supabase SQL Editor:

```sql
INSERT INTO public.graduations (name, color, border_color, rank_order, min_age, min_training_months)
VALUES ('Roter Gürtel', '#fef2f2', '#dc2626', 8, 18, 48);
```

**Bedeutung der Felder:**
- `color` — Hintergrundfarbe der Karte (hex)
- `border_color` — Randfarbe der Mitgliederkarte (hex)
- `rank_order` — Sortierung (niedriger = Anfänger)
- `min_age` — Mindestalter für diese Prüfung
- `min_training_months` — Mindesttrainingszeit in Monaten

### Checklistenpunkte global anpassen

Über die App: **Checklisten** → Vorlage auswählen → Punkte editieren

Oder per SQL:

```sql
-- Punkt zur Standard-Vorlage hinzufügen
INSERT INTO public.checklist_items (template_id, label, is_required, sort_order)
SELECT id, 'Kampfrichterausweis vorhanden', false, 9
FROM public.checklist_templates WHERE is_default = true;

-- Punkt umbenennen
UPDATE public.checklist_items SET label = 'Lizenzkarte vorhanden'
WHERE label = 'Sportlerpass vorhanden';

-- Punkt als Pflicht markieren
UPDATE public.checklist_items SET is_required = true
WHERE label = 'Trainingsstand geprüft';
```

### Neue Dokumenttypen

In `types/index.ts` den `DocumentType` um neue Werte erweitern:

```typescript
export type DocumentType =
  | 'sportlerpass'
  | 'einverstaendnis'
  // ... bestehende Typen
  | 'lizenz'         // Neuer Typ
```

Und in der Datenbank:

```sql
-- Constraint anpassen (Supabase unterstützt keine einfache ALTER CHECK)
ALTER TABLE public.member_documents 
  DROP CONSTRAINT member_documents_document_type_check;

ALTER TABLE public.member_documents
  ADD CONSTRAINT member_documents_document_type_check
  CHECK (document_type IN (
    'sportlerpass', 'einverstaendnis', 'attest',
    'pruefungsanmeldung', 'beitragsnachweis', 'versicherung',
    'lizenz', 'sonstiges'   -- Neuer Typ hier
  ));
```

### Neuen Nutzer einladen

1. **Supabase Dashboard → Authentication → Invite User**
2. E-Mail eingeben und einladen
3. Nach dem ersten Login die Rolle setzen:

```sql
-- Trainer-Rolle vergeben
UPDATE public.profiles SET role = 'trainer'
WHERE email = 'trainer@verein.de';

-- Lese-Zugriff (Standard nach Registrierung)
UPDATE public.profiles SET role = 'reader'
WHERE email = 'vorstand@verein.de';
```

---

## Rollen und Rechte (Übersicht)

| Funktion | Admin | Trainer | Leser |
|----------|-------|---------|-------|
| Mitglieder ansehen | ✅ | ✅ | ✅ |
| Mitglieder anlegen/bearbeiten | ✅ | ✅ | ❌ |
| Mitglieder löschen | ✅ | ❌ | ❌ |
| Prüfungen verwalten | ✅ | ✅ | ❌ |
| Checklisten bearbeiten | ✅ | ✅ | ❌ |
| Dokumente hochladen | ✅ | ✅ | ❌ |
| Dokumente ansehen/herunterladen | ✅ | ✅ | ✅ |
| Dokumente löschen | ✅ | ❌ | ❌ |
| Graduierungen verwalten | ✅ | ❌ | ❌ |
| Nutzer einladen | ✅ | ❌ | ❌ |

---

## Projektstruktur

```
sportverein-dashboard/
├── app/
│   ├── auth/login/        — Login-Seite
│   ├── dashboard/         — Startseite / Übersicht
│   ├── members/           — Mitgliederliste
│   │   └── [id]/          — Mitgliederprofil
│   ├── exams/             — Prüfungsübersicht
│   │   └── [id]/          — Prüfungsdetail
│   ├── checklists/        — Checklisten-Editor
│   └── settings/          — Einstellungen
├── components/
│   ├── layout/            — Sidebar, Header
│   ├── members/           — Mitgliederkarte, Filter
│   ├── dashboard/         — Stats, Charts
│   ├── checklists/        — Checklistenstatus
│   └── documents/         — Upload, Dokumentliste
├── lib/
│   ├── supabase/          — Client, Types
│   └── utils.ts           — Hilfsfunktionen
├── types/
│   └── index.ts           — TypeScript-Typen
├── styles/
│   └── globals.css        — Tailwind + Custom Styles
└── supabase/
    ├── migrations/        — SQL-Migrationsskripte
    └── seed/              — Testdaten
```

---

## Fehlersuche

### Login schlägt fehl
- Prüfe `NEXT_PUBLIC_SUPABASE_URL` und `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`
- Stelle sicher, dass der Nutzer in Supabase Auth existiert

### Dokumente werden nicht gespeichert
- Prüfe ob der `member-documents` Bucket existiert
- Stelle sicher dass Storage Policies korrekt eingerichtet sind
- Prüfe die Dateigröße (max. `NEXT_PUBLIC_MAX_FILE_SIZE_MB` MB)

### RLS-Fehler (permission denied)
- Stelle sicher, dass alle drei Migrations-Dateien ausgeführt wurden
- Prüfe im SQL Editor: `SELECT public.get_my_role()` — gibt deine aktuelle Rolle zurück

---

## Lizenz

Proprietär — nur für den internen Vereinsgebrauch.
