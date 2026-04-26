---
title: AI Music Generator - generování hudby
status: done
priority: high
type: feature
tags: [frontend, ai-music, audio, admin]
created_by: agent
created_at: 2026-04-26T09:00:00Z
position: 11
---

## Notes
Vytvoření modulu pro generování hudby pomocí AI. Uživatelé mohou vytvořit hudební skladby zadáním textu (prompt), výběrem žánru, nálady a délky. Podpora pro nejlepší AI hudební platformy (Suno AI, MusicGen, Mubert, AIVA, Soundraw). Admin může spravovat API klíče pro tyto poskytovatele.

## Checklist
- [x] Vytvořit tabulku music_generations s prompt, genre, mood, duration, provider, audio_url
- [x] Nastavit Storage bucket pro audio soubory
- [x] Service pro správu generování hudby
- [x] Stránka /music-generate s formulářem pro parametry
- [x] Audio přehrávač pro preview a download
- [x] Galerie vygenerované hudby
- [x] Rozšířit admin o hudební AI poskytovatele (Suno, MusicGen, Mubert, AIVA, Soundraw)
- [x] Přidat kartu Music Generator na dashboard
- [x] Odečítání kreditů (5-15 kreditů podle délky)

## Acceptance
- Uživatel může vygenerovat hudební skladbu pomocí AI
- Výběr žánru, nálady, délky a AI providera
- Vygenerovaná hudba se přehrává a dá se stáhnout
- Galerie všech vygenerovaných skladeb
- Admin může spravovat API klíče pro hudební AI