---
title: Uživatelské menu nastavení
status: done
priority: medium
type: feature
tags: [frontend, settings, ui]
created_by: agent
created_at: 2026-04-26T08:20:00Z
position: 8
---

## Notes
Vytvoření uživatelského menu nastavení s různými sekcemi. První sekce je API konfigurace, kam se přesunula správa osobních API klíčů z hlavního dashboardu.

## Checklist
- [x] Vytvořit stránku /settings s layout a navigací
- [x] Přidat sekci API Settings s formulářem pro správu klíčů
- [x] Přesunout logiku API klíčů z index.tsx do settings
- [x] Přidat odkaz na Settings do hlavní navigace
- [x] Vytvořit sidebar menu pro různé sekce nastavení
- [x] Přidat další sekce (Profil, Preference) jako placeholdery

## Acceptance
- Uživatel může otevřít Settings z hlavní navigace
- API klíče lze spravovat v sekci API Settings
- Menu nastavení má přehlednou navigaci mezi sekcemi