---
title: Ad Generator Module
status: todo
priority: high
type: feature
tags: [ai, ads, marketing, social-media]
created_by: agent
created_at: 2026-04-27T20:10:00Z
position: 18
---

## Notes
Modul pro generování kompletních reklamních kampaní pro sociální sítě. AI vygeneruje headline, popis, CTA, hashtags podle zadaného produktu/služby a cílové platformy.

**Požadavky:**
- Input: popis produktu/služby, cílová skupina, platforma
- Platformy: Facebook, Instagram, LinkedIn, Google Ads, TikTok
- AI modely: GPT-4, Claude (copywriting focused)
- Output: headline, popis, CTA, hashtags, doporučení pro obrázek
- Různé formáty: carousel, single image, video, story
- Historie vygenerovaných reklam
- Export do JSON/CSV
- Cena: 3 kredity/reklama

## Checklist
- [ ] Vytvořit tabulku `ad_generations` (id, user_id, product_description, target_audience, platform, ad_format, headline, description, cta, hashtags, model_used, created_at)
- [ ] RLS policies pro `ad_generations` (T1 - private user data)
- [ ] Service `adGeneratorService.ts` s metodami: create, getAll, delete
- [ ] API endpoint `/api/generate-ad` pro volání AI modelů
- [ ] Stránka `/ad-generator` s formulářem pro zadání parametrů
- [ ] Select pro platformu, formát, AI model
- [ ] Zobrazení vygenerované reklamy v preview formátu
- [ ] Galerie historie reklam s filtry
- [ ] Export možnosti
- [ ] Aktualizovat dashboard - přidat kartu "Generátor reklam"

## Acceptance
- Uživatel zadá produkt a parametry a dostane kompletní reklamní copy
- Reklamy se ukládají do historie
- Kredity se správně odečítají (3 kredity/reklama)