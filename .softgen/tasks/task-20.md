---
title: Favorite Prompts Module
status: done
priority: high
type: feature
tags: [prompts, favorites, productivity]
created_by: agent
created_at: 2026-04-28T06:15:00Z
position: 20
---

## Notes
Modul pro ukládání a správu oblíbených AI promptů. Uživatelé si mohou ukládat úspěšné prompty z různých modulů a rychle je znovu používat.

**Požadavky:**
- CRUD pro prompty (create, read, update, delete)
- Kategorie: chat, image, video, voice, ad, summary, general
- Tagy pro lepší organizaci
- Statistiky použití (kolikrát byl prompt použit)
- Hvězdičky/oblíbené
- Vyhledávání a filtrování
- Rychlé kopírování do schránky
- Integrace do existujících modulů - tlačítko "Save" + dropdown "Load from favorites"

## Checklist
- [x] Vytvořit tabulku `favorite_prompts` (id, user_id, title, prompt_text, category, tags, is_favorite, use_count, created_at, updated_at)
- [x] RLS policies pro `favorite_prompts` (T1 - private user data)
- [x] Service `favoritePromptsService.ts`
- [x] Stránka `/favorite-prompts` s CRUD UI
- [x] Komponenta `PromptSelector` pro rychlý výběr
- [x] Integrovat do Chat modulu
- [x] Integrovat do Generate Images
- [x] Integrovat do Ad Generator
- [x] Integrovat do Document Summary
- [x] Aktualizovat dashboard - karta "Oblíbené prompty"

## Acceptance
- Uživatel může ukládat prompty z libovolného modulu
- Prompty lze filtrovat podle kategorie a tagů
- Rychlý výběr promptu v modulech funguje
- Statistiky použití se aktualizují