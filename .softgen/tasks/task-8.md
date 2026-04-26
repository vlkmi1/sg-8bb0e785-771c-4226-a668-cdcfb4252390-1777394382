---
title: Hlasový chat a user dashboard
status: done
priority: high
type: feature
tags: [frontend, voice, dashboard, ui]
created_by: agent
created_at: 2026-04-26T08:10:00Z
position: 7
---

## Notes
Přidání hlasového chatu pro konverzace s AI pomocí řeči a vytvoření centrálního user dashboardu s přehledem aktivit a rychlým přístupem ke všem modulům.

## Checklist
- [x] Vytvořit tabulku voice_conversations s audio_url, transcript, provider
- [x] Nastavit Supabase Storage bucket pro audio soubory
- [x] Vytvořit stránku /voice-chat s nahráváním/přehráváním audio
- [x] Přidat výběr AI modelu pro hlasové zpracování
- [x] Service pro ukládání a načítání hlasových konverzací
- [x] Vytvořit user dashboard /dashboard s přehledem statistik
- [x] Přidat karty pro všechny moduly (Chat, Images, Videos, Voice)
- [x] Zobrazit aktuální kredity a poslední aktivity
- [x] Integrovat hlasový chat do navigace

## Acceptance
- Uživatel může nahrát/namluvit hlasovou zprávu a AI odpoví
- Historie hlasových konverzací se ukládá a zobrazuje
- Dashboard zobrazuje všechny dostupné moduly na jednom místě
- Uživatel vidí své statistiky použití platformy