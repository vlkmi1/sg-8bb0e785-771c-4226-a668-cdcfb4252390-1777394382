---
title: Tablet Dashboard - Grid Widget Layout
status: done
priority: high
type: feature
tags: [tablet, dashboard, responsive, grid, widgets]
created_by: agent
created_at: 2026-04-28T11:26:45Z
position: 22
---

## Notes
Tablet dashboard s 2-column grid layoutem pro využití horizontálního prostoru. Drag & drop pro přeuspořádání widgetů, side panel pro detailní informace místo bottom sheetu. Větší touch targets, ale kompaktnější než mobil - využití prostoru 768px-1024px šířky.

## Checklist
- [x] Vytvořit TabletDashboard komponentu s 2-column CSS grid
- [x] Implementovat stejné widgety jako mobil ale s tablet-optimized layoutem
- [x] CreditsWidget - 2 sloupce (kredity + graf větší)
- [x] QuickActionsWidget - 3x2 grid místo vertical stacku
- [x] RecentActivityWidget - table view s více sloupci (time, action, model, status)
- [x] StatsCardsWidget - 2x2 grid místo vertical stacku
- [x] Přidat drag & drop reorder funkcionalitu mezi widgety
- [x] Implementovat side panel pro detaily místo bottom sheetu
- [x] Responsive grid: 2 columns 768px+, collapse to 1 column < 768px
- [x] Persist widget order v local storage nebo user preferences

## Acceptance
- Dashboard využívá celou šířku na tabletech (768px-1024px)
- Widgety lze přeuspořádat drag & drop a změny se persistují
- Side panel zobrazuje detaily bez překrývání hlavního obsahu