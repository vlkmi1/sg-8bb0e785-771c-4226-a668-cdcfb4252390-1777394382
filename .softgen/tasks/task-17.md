---
title: Document Summary Module
status: todo
priority: high
type: feature
tags: [ai, summary, documents]
created_by: agent
created_at: 2026-04-27T20:10:00Z
position: 17
---

## Notes
Modul pro shrnutí obsahu - uživatel vloží text nebo nahraje dokument (PDF, DOCX, TXT) a AI vygeneruje shrnutí v různých úrovních detailu.

**Požadavky:**
- Input: textarea pro text NEBO file upload (PDF, DOCX, TXT)
- AI modely: GPT-4, Claude, Gemini Pro
- Úrovně shrnutí: krátké (1-2 odstavce), střední (5-7 odstavců), detailní (s bullet points)
- Historie shrnutí s možností smazání
- Zobrazení původního textu vs shrnutí
- Export shrnutí (TXT, PDF)
- Cena: 2 kredity/shrnutí

## Checklist
- [ ] Vytvořit tabulku `document_summaries` (id, user_id, original_text, summary_text, summary_level, model_used, created_at)
- [ ] RLS policies pro `document_summaries` (T1 - private user data)
- [ ] Service `documentSummaryService.ts` s metodami: create, getAll, delete
- [ ] API endpoint `/api/summarize` pro volání AI modelů
- [ ] Stránka `/document-summary` s file upload a textarea
- [ ] Select pro výběr AI modelu a úrovně shrnutí
- [ ] Zobrazení historie shrnutí
- [ ] Aktualizovat dashboard - přidat kartu "Shrnutí dokumentů"

## Acceptance
- Uživatel může vložit text nebo nahrát dokument a získat AI shrnutí
- Historie shrnutí se ukládá a zobrazuje
- Kredity se správně odečítají (2 kredity/shrnutí)