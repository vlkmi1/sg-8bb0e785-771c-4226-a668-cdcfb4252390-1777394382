---
title: Admin dashboard s centrálními API klíči
status: in_progress
priority: high
type: feature
tags: [admin, backend, api-keys]
created_by: agent
created_at: 2026-04-26T07:29:19Z
position: 4
---

## Notes
Vytvoření admin dashboardu pro správu centrálních API klíčů. Administrátor může nastavit API klíče pro všechny AI poskytovatele a uživatelé budou používat tyto centrální klíče místo vlastních.

## Checklist
- [ ] Vytvořit tabulku admin_settings pro centrální API klíče
- [ ] Přidat admin pole do profiles (is_admin boolean)
- [ ] Vytvořit stránku /admin s přehledem API klíčů
- [ ] Formulář pro správu každého API klíče (přidání/editace)
- [ ] AdminGuard komponenta pro ochranu admin stránek
- [ ] Service pro správu centrálních API klíčů
- [ ] Upravit stávající služby aby preferovaly centrální API

## Acceptance
- Admin může přidat/upravit centrální API klíče pro všechny poskytovatele
- Uživatelé vidí stav připojení podle centrálních klíčů
- Pouze admin má přístup k /admin stránce