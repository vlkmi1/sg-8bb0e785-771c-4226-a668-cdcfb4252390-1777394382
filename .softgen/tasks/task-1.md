---
title: Databázové schéma a autentizace
status: done
priority: urgent
type: feature
tags: [backend, auth, database]
created_by: agent
created_at: 2026-04-26T07:14:45Z
position: 0
---

## Notes
Vytvoření databázového schématu pro uživatele, profily, API klíče a konverzace. Nastavení autentizace s email/heslem.

## Checklist
- [x] Vytvořit tabulku profiles s user_id, full_name, avatar_url
- [x] Vytvořit tabulku api_keys s provider, encrypted_key, user_id
- [x] Vytvořit tabulku conversations s title, model_provider, user_id
- [x] Vytvořit tabulku messages s conversation_id, role, content
- [x] Nastavit RLS policies pro všechny tabulky
- [x] Vytvořit auth službu pro přihlášení/registraci

## Acceptance
- Uživatel se může registrovat a přihlásit
- Každý uživatel má svůj profil v databázi
- API klíče jsou bezpečně uloženy a přístupné pouze vlastníkovi