---
title: Ad Generator Module
status: done
priority: high
type: feature
tags: [ai, ads, marketing]
created_by: agent
created_at: 2026-04-27T20:10:00Z
position: 18
---

## Notes
Modul pro generování kompletních reklamních kampaní pro sociální sítě - AI vytvoří headline, popis, CTA, hashtags a návrhy vizuálů.

**Požadavky:**
- Input: popis produktu/služby, cílová skupina (optional)
- Podporované platformy: Facebook, Instagram, LinkedIn, Google Ads, TikTok
- Formáty: carousel, single image, video, story
- AI modely: GPT-4, Claude
- Output: headline, description, CTA, hashtags, image suggestions
- Historie reklam s možností kopírování textu
- Cena: 3 kredity/reklama

## Checklist
- [x] Vytvořit tabulku `ad_generations` (id, user_id, product_description, target_audience, platform, ad_format, headline, description, cta, hashtags, image_suggestions, created_at)
- [x] RLS policies pro `ad_generations` (T1 - private user data)
- [x] Service `adGeneratorService.ts` s metodami: create, getAll, delete
- [x] API endpoint `/api/generate-ad` s platform-specific specifications
- [x] Stránka `/ad-generator` s formulářem
- [x] Select pro platformu, formát a AI model
- [x] Zobrazení historie s copy-to-clipboard funkcionalitou
- [x] Aktualizovat dashboard - přidat kartu "Generátor reklam"

## Acceptance
- Uživatel může vytvořit kompletní reklamní copy
- Reklamy se ukládají do historie
- Kredity se správně odečítají (3 kredity/reklama)