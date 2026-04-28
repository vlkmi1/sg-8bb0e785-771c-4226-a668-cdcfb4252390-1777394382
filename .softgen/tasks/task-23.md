---
title: PWA Setup - Progressive Web App
status: done
priority: high
type: feature
tags: [pwa, offline, mobile, install, service-worker]
created_by: agent
created_at: 2026-04-28T11:32:00Z
position: 23
---

## Notes
Kompletní PWA implementace pro kAIkus. Umožní uživatelům instalovat aplikaci na mobil/tablet jako nativní app. Offline podpora pro základní funkce (view cached conversations, credits overview). Service worker s intelligent caching strategy - network-first pro API calls, cache-first pro statické assety.

## Checklist
- [x] Vytvořit manifest.json s kAIkus themingem a ikonami
- [x] Vytvořit service worker s caching strategiemi
- [x] Přidat PWA meta tagy do _document.tsx
- [x] Vytvořit InstallPWA komponentu s install prompt
- [x] Vytvořit offline fallback stránku
- [x] Přidat PWA ikony (512x512, 192x192, maskable)
- [x] Registrovat service worker v _app.tsx
- [x] Optimalizovat cache strategie (stale-while-revalidate pro API)
- [x] Přidat update notifikaci když je nová verze SW

## Acceptance
- Aplikace lze nainstalovat na mobil/tablet přes "Add to Home Screen"
- Offline mode zobrazuje cached data a offline fallback
- Install prompt se zobrazuje Android/Chrome uživatelům
- Service worker se automaticky updatuje při nové verzi