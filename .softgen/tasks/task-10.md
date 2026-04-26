---
title: Generování a plánování příspěvků na sociální sítě
status: done
priority: high
type: feature
tags: [frontend, social-media, ai-generation, scheduling]
created_by: agent
created_at: 2026-04-26T08:25:00Z
position: 9
---

## Notes
Vytvoření modulu pro generování příspěvků na sociální sítě pomocí AI a jejich plánování. Uživatelé mohou vytvořit příspěvek s AI pomocí, vidět náhled jak bude vypadat na různých platformách (Facebook, Instagram, LinkedIn, Twitter/X, YouTube, TikTok) a naplánovat publikování. V nastavení nová sekce pro připojení sociálních sítí.

## Checklist
- [x] Vytvořit tabulku social_posts s platform, content, scheduled_time, status
- [x] Vytvořit tabulku social_accounts pro připojené účty
- [x] Vytvořit service pro správu příspěvků a účtů
- [x] Vytvořit stránku /social-posts pro generování a plánování
- [x] AI generování textu příspěvku podle tématu a platformy (1 kredit)
- [x] Komponenta SocialPreview pro náhledy (Facebook, Instagram, LinkedIn, Twitter, YouTube, TikTok)
- [x] Kalendář/seznam naplánovaných příspěvků
- [x] Přidat sekci Social Networks do /settings
- [x] Formulář pro připojení účtů sociálních sítí
- [x] Přidat kartu Social Media na dashboard
- [x] Rozšířit o YouTube a TikTok podporu

## Acceptance
- Uživatel může vygenerovat text příspěvku pomocí AI
- Náhledy zobrazují jak bude příspěvek vypadat na všech 6 platformách
- Příspěvky lze naplánovat na konkrétní datum a čas
- V nastavení lze spravovat připojené sociální účty
- YouTube a TikTok plně integrované s vlastními náhledy a šablonami