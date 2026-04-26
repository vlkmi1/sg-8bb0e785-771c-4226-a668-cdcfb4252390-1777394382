---
title: Modul pro generování obrázků
status: in_progress
priority: high
type: feature
tags: [frontend, image-generation, storage]
created_by: agent
created_at: 2026-04-26T07:22:51Z
position: 3
---

## Notes
Přidání modulu pro generování obrázků pomocí AI (DALL-E, Stable Diffusion, Midjourney). Uživatelé zadají textový prompt a AI vygeneruje obrázek.

## Checklist
- [ ] Vytvořit tabulku generated_images s prompt, image_url, provider, user_id
- [ ] Nastavit Supabase Storage bucket pro obrázky
- [ ] Vytvořit stránku /generate s formulářem pro prompt
- [ ] Přidat výběr poskytovatele pro generování (OpenAI DALL-E, Stability AI)
- [ ] Galerie vygenerovaných obrázků s možností stažení
- [ ] Service pro ukládání a načítání obrázků
- [ ] Integrace s kartou "Image Generation" na dashboardu

## Acceptance
- Uživatel může zadat prompt a vybrat AI model pro generování
- Vygenerované obrázky se zobrazují v galerii
- Obrázky jsou uložené a dostupné v historii