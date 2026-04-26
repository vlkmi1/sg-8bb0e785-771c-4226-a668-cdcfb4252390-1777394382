---
title: Kreditní systém pro generování
status: done
priority: high
type: feature
tags: [backend, credits, ui]
created_by: agent
created_at: 2026-04-26T07:36:15Z
position: 5
---

## Notes
Implementace jednoduchého kreditního systému pro sledování zbývajících generací. Uživatelé mají určitý počet kreditů, které se odečítají při každém volání AI (chat zprávy, generování obrázků).

## Checklist
- [x] Přidat pole credits (integer) do tabulky profiles s defaultní hodnotou
- [x] Vytvořit službu pro správu kreditů (kontrola, odečet, přidání)
- [x] Zobrazit zbývající kredity v hlavičce aplikace
- [x] Upravit chat službu aby odečítala kredity při posílání zprávy
- [x] Upravit image generation službu aby odečítala kredity
- [x] Přidat admin rozhraní pro přidávání kreditů uživatelům
- [x] Zobrazit varování když kredity dojdou

## Acceptance
- Uživatel vidí své zbývající kredity v hlavičce
- Kredity se automaticky odečítají při generování
- Admin může přidat kredity uživatelům
