# 🔐 Záloha aktuální konfigurace Supabase

**Datum zálohy:** 30. dubna 2026

---

## 📊 Admin API Klíče

V aktuálním systému máš nastavené tyto poskytovatele (API klíče jsou šifrované v DB):

| Provider | Model Name | Status |
|----------|-----------|--------|
| OpenAI | - | ✅ Active |
| Anthropic | - | ✅ Active |
| Google | - | ✅ Active |
| Mistral | mistral-large-latest | ✅ Active |
| X AI | - | ✅ Active |
| Stability AI | - | ✅ Active |
| Stability Video | - | ✅ Active |
| Fal.ai | - | ✅ Active |
| HeyGen | - | ✅ Active |
| D-ID | - | ✅ Active |
| Suno | - | ✅ Active |

**⚠️ PO MIGRACI:** Všechny API klíče musíš zadat znovu přes admin panel na nové instanci.

---

## 💳 Subscription Plány

| Tier | Název | Cena | Kredity | Features |
|------|-------|------|---------|----------|
| Free | Free | 0 Kč | 50 | Základní modely, 7 dní historie |
| Basic | Basic | 149 Kč | 500 | Všechny modely, 30 dní historie, email podpora |
| Pro | Pro | 499 Kč | 2000 | + API přístup, export dat, prioritní podpora |
| Business | Business | 999 Kč | 5000 | + Týmové účty (5), custom integrace |
| Enterprise | Enterprise | 2999 Kč | 20000 | + SLA, neomezené týmy, account manager |

✅ Tyto plány jsou součástí `seed_data.sql` a budou automaticky vytvořeny.

---

## 🎁 Credit Balíčky

| Balíček | Kredity | Cena | Bonus |
|---------|---------|------|-------|
| Starter Pack | 200 | 100 Kč | 0 |
| Popular Pack | 500 | 199 Kč | 0 |
| Pro Pack | 2000 | 699 Kč | 0 |
| Business Pack | 5000 | 1499 Kč | 0 |

✅ Tyto balíčky jsou součástí `seed_data.sql` a budou automaticky vytvořeny.

---

## 💰 Affiliate Nastavení

| Typ platby | Provize | Min. výplata |
|------------|---------|--------------|
| Subscription | 20% | 500 Kč |
| Credits | 15% | 500 Kč |

✅ Toto nastavení je součástí `seed_data.sql` a bude automaticky vytvořeno.

---

## 💳 Platební Nastavení

### PayPal
- **Client ID:** `AZ2D7HIJwkLqCj0o7Sj3c8XNiLae0_ks3hyWAvIT_aEc6vJKz-qpITcDA-hXVrYwuja6R09VVVk3akc4`
- **Secret:** `EIdyG1oVMgFrtnPtqmeL_XzlHLf_hVl_VR_CG4eY1NaJHP3K0UfIpPwsAVbVxJexnPOyBRhc2r9Olp4M`

### Bankovní převod
- **Účet (QR):** `123456789/0100`
- **Účet (platby):** `1852931010/3030`
- **Banka:** Fio banka

### Povolené metody
- ✅ PayPal
- ✅ Bank Transfer

⚠️ **BEZPEČNOST:** PayPal credentials jsou v `seed_data.sql` v plaintext. Po migraci zvažte:
1. Rotaci PayPal credentials
2. Nastavení přes admin panel místo SQL
3. Použití environment variables pro citlivé údaje

---

## 📁 Soubory připravené k migraci

1. **`supabase/migrations/complete_migration.sql`**
   - ✅ Všech 33 tabulek
   - ✅ RLS politiky
   - ✅ Triggery a funkce

2. **`supabase/migrations/seed_data.sql`**
   - ✅ Subscription plány
   - ✅ Credit balíčky
   - ✅ Affiliate nastavení
   - ✅ Platební konfigurace

3. **`MIGRATION_GUIDE.md`**
   - ✅ Krok za krokem návod
   - ✅ Řešení problémů

---

## ✅ Můžeš začít měnit!

Máš vše zálohované a připravené k migraci. Postupuj podle `MIGRATION_GUIDE.md`.

**Doporučené pořadí:**
1. Vytvoř nový Supabase projekt
2. Spusť `complete_migration.sql`
3. Spusť `seed_data.sql`
4. Aktualizuj `.env.local`
5. Vytvoř admin účet
6. Znovu zadej admin API klíče
7. Otestuj a redeploy

**⚠️ DŮLEŽITÉ:**
- Starý Supabase projekt nemaž, dokud neověříš že nový funguje 100%
- Máš možnost rollback kdykoliv