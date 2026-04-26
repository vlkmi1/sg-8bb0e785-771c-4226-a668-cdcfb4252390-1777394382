---
title: AI Influencer - generování videí s virtuální postavou
status: done
priority: high
type: feature
tags: [frontend, ai-video, influencer, admin]
created_by: agent
created_at: 2026-04-26T08:45:00Z
position: 10
---

## Notes
Vytvoření modulu pro generování videí s AI influencerem. Uživatelé si vytvoří vlastního virtuálního influencera (jméno, hlas, osobnost), který pak vytváří video obsah podle jejich scénářů. Admin dashboard rozšířen o nastavení API klíčů pro AI video poskytovatele (HeyGen, D-ID, Synthesia, Runway).

## Checklist
- [x] Vytvořit tabulku ai_influencers s name, avatar_url, voice_type, personality
- [x] Vytvořit tabulku influencer_videos s influencer_id, script, video_url
- [x] Nastavit Storage bucket pro influencer videa
- [x] Service pro správu influencerů a jejich videí
- [x] Stránka /ai-influencer pro vytváření influencerů a generování videí
- [x] Galerie vygenerovaných videí s influencerem
- [x] Rozšířit admin dashboard o AI video poskytovatele
- [x] Přidat kartu AI Influencer na dashboard
- [x] Odečítání kreditů (10 kreditů za video s influencerem)

## Acceptance
- Uživatel může vytvořit vlastního AI influencera s jedinečnou osobností
- AI influencer vytváří videa podle uživatelských scénářů
- Videa jsou uložená a dostupná v galerii
- Admin může nastavit API klíče pro AI video poskytovatele