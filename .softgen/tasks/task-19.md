---
title: AI Image Editor Module
status: in_progress
priority: high
type: feature
tags: [ai, image-editing, editor]
created_by: agent
created_at: 2026-04-28T06:07:00Z
position: 19
---

## Notes
Profesionální modul pro editaci AI vygenerovaných obrázků s podporou inpainting, outpainting, variací a object removal.

**Požadavky:**
- AI modely: OpenAI DALL-E 2 Edit, Stability AI Inpainting
- Funkce: Inpainting, Outpainting, Variace, Object Removal, Upscale
- Canvas-based editor s brush/mask nástroji
- Propojení s existujícími vygenerovanými obrázky
- Historie editací
- Cena: 3 kredity/editace

## Checklist
- [x] Vytvořit tabulku `image_edits` (id, user_id, original_image_id, edited_image_url, edit_type, prompt, mask_data, created_at)
- [x] RLS policies pro `image_edits`
- [x] Service `imageEditService.ts`
- [x] API endpoint `/api/edit-image`
- [ ] Stránka `/image-editor` s canvas editorem
- [ ] Propojení s gallery - tlačítko "Edit"
- [ ] Aktualizovat dashboard - karta "Editor obrázků"

## Acceptance
- Uživatel může otevřít vygenerovaný obrázek v editoru
- Funkce inpainting, variace fungují
- Kredity se správně odečítají (3 kredity/editace)