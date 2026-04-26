---
title: Modul pro generování videí
status: in_progress
priority: high
type: feature
tags: [frontend, video-generation, storage, admin]
created_by: agent
created_at: 2026-04-26T07:47:00Z
position: 6
---

## Notes
Přidání modulu pro generování videí pomocí AI (RunwayML, Pika Labs, Stability AI Video). Uživatelé zadají textový prompt a AI vygeneruje video. Admin dashboard rozšířen o nastavení API klíčů pro video poskytovatele.

## Checklist
- [ ] Vytvořit tabulku generated_videos s prompt, video_url, provider, duration, user_id
- [ ] Nastavit Supabase Storage bucket pro videa
- [ ] Vytvořit stránku /video-generate s formulářem pro prompt
- [ ] Přidat výběr poskytovatele pro generování (RunwayML, Pika, Stability Video)
- [ ] Galerie vygenerovaných videí s možností stažení
- [ ] Service pro ukládání a načítání videí
- [ ] Přidat video poskytovatele do admin dashboardu
- [ ] Integrace s kartou "Video Generation" na dashboardu
- [ ] Odečítání kreditů (5 kreditů za video)

## Acceptance
- Uživatel může zadat prompt a vybrat AI model pro generování videa
- Vygenerovaná videa se zobrazují v galerii
- Videa jsou uložená a dostupná v historii
- Admin může nastavit API klíče pro video poskytovatele