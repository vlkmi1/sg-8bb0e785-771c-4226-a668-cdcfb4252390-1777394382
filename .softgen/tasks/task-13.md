---
title: Systém předplatného a dobíjení kreditů
status: done
priority: high
type: feature
tags: [frontend, backend, payments, subscriptions, admin]
created_by: agent
created_at: 2026-04-26T09:30:00Z
position: 12
---

## Notes
Vytvoření kompletního systému předplatného s různými plány (Free, Basic, Pro, Enterprise), které ovlivňují dostupnost modulů. Modul pro dobíjení kreditů s podporou QR kódu pro bankovní převod a PayPal platební bránou. Admin může nastavovat ceny plánů, dostupné moduly a balíčky kreditů.

## Checklist
- [x] Vytvořit tabulku subscription_plans s tier, price, features
- [x] Vytvořit tabulku user_subscriptions s plan_id, status, expires_at
- [x] Vytvořit tabulku credit_packages s amount, price, bonus
- [x] Vytvořit tabulku payments s amount, method, status
- [x] Service pro správu předplatných a plateb
- [x] Stránka /pricing pro výběr předplatného
- [x] Stránka /credits pro dobíjení kreditů
- [x] PayPal integrace pro platby
- [x] QR kód generování pro bankovní převod
- [x] Admin panel - správa plánů předplatného
- [x] Admin panel - správa balíčků kreditů
- [x] Admin panel - správa platebních metod
- [x] Kontrola přístupu k modulům podle předplatného

## Acceptance
- Uživatel může vybrat předplatné (Free/Basic/Pro/Enterprise)
- Dostupnost modulů závisí na předplatném
- Kredity lze dobít PayPalem nebo bankovním převodem
- Admin může spravovat plány, ceny a dostupné moduly
- QR kód obsahuje údaje pro bankovní převod