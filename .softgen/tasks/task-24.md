---
title: Performance Optimization - Lazy Loading & Images
status: done
priority: high
type: chore
tags: [performance, lazy-loading, optimization, images]
created_by: agent
created_at: 2026-04-28T11:40:00Z
position: 24
---

## Notes
Optimalizace výkonu aplikace pomocí lazy loading dashboard widgetů a optimalizace obrázků. Widgety se načítají pouze když jsou viditelné (Intersection Observer). Obrázky používají Next.js Image s blur placeholder a responsive sizes. Code splitting snižuje initial bundle size.

## Checklist
- [x] Vytvořit WidgetSkeleton komponenty pro loading states
- [x] Implementovat lazy loading pro MobileWidgets (React.lazy + Suspense)
- [x] Implementovat lazy loading pro TabletWidgets
- [x] Přidat Intersection Observer pro progressive loading při scrollování
- [x] Optimalizovat všechny obrázky v projektu (Next.js Image)
- [x] Přidat blur placeholder pro obrázky
- [x] Implementovat responsive image sizes
- [x] Přidat preload pro critical widgety (Credits)

## Acceptance
- Dashboard widgety se načítají postupně při scrollování
- Skeleton loading states se zobrazují před načtením dat
- Initial bundle size je menší díky code splitting
- Obrázky se načítají lazy s blur efektem
