# 📋 Průvodce migrací na vlastní Supabase

## 🎯 Přehled

Tento průvodce ti pomůže přenést tvůj kAIkus projekt z původního Supabase projektu na tvůj vlastní Supabase projekt. Získáš tak plnou kontrolu nad databází a službami.

## 📝 Krok za krokem

### 1️⃣ Vytvoření nového Supabase projektu

1. **Přihlas se na [supabase.com](https://supabase.com)**
2. **Vytvoř nový projekt:**
   - Klikni na "New Project"
   - Název: `kaikus` (nebo podle preferencí)
   - Database Password: **Ulož si ho!** (potřebuješ ho později)
   - Region: Vyber nejbližší (např. Frankfurt pro Evropu)
   - Počkej 2-3 minuty na vytvoření projektu

### 2️⃣ Spuštění migrace databáze

1. **V Supabase Dashboard → SQL Editor**
2. **Zkopíruj celý obsah souboru `supabase/migrations/complete_migration.sql`**
3. **Vlož do SQL editoru a klikni "Run"**
4. **Počkej na dokončení** (může trvat 30-60 sekund)
5. **Ověř vytvoření:**
   - Database → Tables → měl bys vidět všech 33 tabulek

### 3️⃣ Získání nových přihlašovacích údajů

1. **V Supabase Dashboard → Settings → API**
2. **Zkopíruj tyto hodnoty:**

   ```
   Project URL: https://xxxxx.supabase.co
   anon public key: eyJhbGc...
   service_role key: eyJhbGc... (klikni "Reveal" pro zobrazení)
   ```

### 4️⃣ Aktualizace .env.local

1. **Otevři soubor `.env.local` v projektu**
2. **Nahraď hodnoty:**

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://tvuj-projekt.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tvůj-nový-anon-key
   NEXT_PUBLIC_SITE_URL=https://kaikus.cz
   SUPABASE_SERVICE_ROLE_KEY=tvůj-nový-service-role-key
   ```

### 5️⃣ Nastavení autentizace

1. **V Supabase Dashboard → Authentication → URL Configuration**
2. **Nastav redirect URLs:**
   ```
   Site URL: https://kaikus.cz
   
   Redirect URLs:
   https://kaikus.cz/auth/callback
   https://kaikus.cz/**
   ```

3. **V Authentication → Email Templates** (volitelné):
   - Přizpůsob email šablony podle potřeby
   - Confirm signup, Reset password, atd.

### 6️⃣ Vytvoření prvního admin účtu

Po migraci potřebuješ vytvořit svůj admin účet:

1. **Zaregistruj se přes aplikaci** (https://kaikus.cz/auth/register)
2. **Potvrď email** (zkontroluj doručenou poštu)
3. **V Supabase Dashboard → SQL Editor, spusť:**

   ```sql
   -- Nahraď tvuj@email.com svým emailem
   UPDATE profiles 
   SET is_admin = true, 
       credits = 10000 
   WHERE email = 'tvuj@email.com';
   ```

4. **Přihlas se znovu** - měl bys mít admin přístup

### 7️⃣ Nastavení admin API klíčů

1. **Přihlas se jako admin**
2. **Jdi na /admin stránku**
3. **Přidej API klíče pro poskytovatele:**
   - OpenAI
   - Anthropic
   - Google AI
   - Mistral
   - atd.

### 8️⃣ Nastavení platebních metod (volitelné)

Pokud chceš používat platby:

1. **V admin panelu → Payment Settings**
2. **Nastav:**
   - PayPal Client ID a Secret
   - Bankovní údaje pro přímé převody
   - Další platební metody podle potřeby

### 9️⃣ Test funkčnosti

1. **✅ Registrace nového uživatele**
2. **✅ Přihlášení**
3. **✅ Vytvoření konverzace s AI modelem**
4. **✅ Generování obrázku**
5. **✅ Admin panel (pokud jsi admin)**

### 🔟 Deployment na Vercel

1. **V Vercel projektu → Settings → Environment Variables**
2. **Přidej/Aktualizuj tyto proměnné:**
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   NEXT_PUBLIC_SITE_URL
   SUPABASE_SERVICE_ROLE_KEY
   ```

3. **Redeploy aplikaci** - klikni "Redeploy" v Vercel dashboardu

---

## ✅ Checklist dokončení

- [ ] Nový Supabase projekt vytvořen
- [ ] Migrace databáze dokončena (33 tabulek)
- [ ] .env.local aktualizován
- [ ] Redirect URLs nastaveny
- [ ] Admin účet vytvořen
- [ ] Admin API klíče přidány
- [ ] Test funkčnosti proveden
- [ ] Vercel environment variables aktualizovány
- [ ] Aplikace redeployována

---

## 🔧 Řešení problémů

### Migrace selhala

**Problém:** SQL migrace vrací chyby

**Řešení:**
1. Smaž všechny tabulky v Database → Tables
2. Spusť migraci znovu
3. Pokud přetrvává, kontaktuj support

### Nemohu se přihlásit

**Problém:** "Invalid login credentials"

**Řešení:**
1. Zkontroluj `.env.local` - správné URL a klíče?
2. Zkontroluj Supabase → Authentication → URL Configuration
3. Ujisti se, že redirect URLs jsou správně nastaveny
4. Vymaž cookies prohlížeče a zkus znovu

### Admin panel nefunguje

**Problém:** Nemůžu vidět admin panel

**Řešení:**
1. V Supabase SQL Editor zkontroluj:
   ```sql
   SELECT email, is_admin FROM profiles WHERE email = 'tvuj@email.com';
   ```
2. Pokud `is_admin` není `true`, nastav:
   ```sql
   UPDATE profiles SET is_admin = true WHERE email = 'tvuj@email.com';
   ```

### API klíče nefungují

**Problém:** AI modely nereagují

**Řešení:**
1. Zkontroluj admin panel → jsou klíče uložené?
2. Zkontroluj konzoli prohlížeče → nějaké chyby?
3. Otestuj klíč ručně přes API poskytovatel

---

## 📞 Podpora

Pokud narazíš na problémy:
1. Zkontroluj tento guide znovu
2. Podívej se do Supabase Logs (Dashboard → Logs)
3. Zkontroluj browser console pro chyby

---

## 🎉 Gratulujeme!

Tvůj kAIkus projekt je nyní plně nezávislý a běží na tvém vlastním Supabase projektu!

**Co dál?**
- Přizpůsob email šablony
- Nastav billing plány
- Pozvi další uživatele
- Monitoruj využití v Analytics