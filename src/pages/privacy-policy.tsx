import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield } from "lucide-react";
import { ThemeSwitch } from "@/components/ThemeSwitch";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <h1 className="text-lg font-heading font-bold">Ochrana osobních údajů</h1>
              </div>
            </div>
            <ThemeSwitch />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-heading font-bold">Zásady ochrany osobních údajů</h2>
            <p className="text-muted-foreground">
              Platné od 26. dubna 2026 | GDPR Compliant
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="font-heading">1. Správce osobních údajů</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed">
              <p>
                Správcem vašich osobních údajů je:
              </p>
              <p>
                <strong>kAIkus s.r.o.</strong><br />
                IČO: 12345678<br />
                Sídlo: Praha 1, Česká republika<br />
                Email: privacy@kaikus.cz<br />
                Telefon: +420 123 456 789
              </p>
              <p>
                Tato zásada popisuje, jak shromažďujeme, používáme a chráníme vaše osobní údaje 
                v souladu s Nařízením EU 2016/679 (GDPR).
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-heading">2. Jaké údaje sbíráme</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed">
              <p>
                <strong>2.1 Údaje poskytnuté přímo vámi:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Registrační údaje:</strong> Email, heslo (hashované)</li>
                <li><strong>Profilové údaje:</strong> Jméno, avatar (volitelné)</li>
                <li><strong>Platební údaje:</strong> Fakturační adresa, platební metoda (PayPal, číslo účtu)</li>
                <li><strong>API klíče:</strong> Klíče pro AI poskytovatele (šifrované)</li>
              </ul>
              <p>
                <strong>2.2 Údaje shromážděné automaticky:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Technické údaje:</strong> IP adresa, typ zařízení, prohlížeč, OS</li>
                <li><strong>Údaje o používání:</strong> Počet kreditů, historie generování, čas stráven v aplikaci</li>
                <li><strong>Cookies:</strong> Soubory cookies pro autentizaci a preferenci (dark mode, jazyk)</li>
              </ul>
              <p>
                <strong>2.3 Obsah vytvořený AI:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Prompty a instrukce zadané do AI</li>
                <li>Vygenerovaný obsah (texty, obrázky, videa, hudba)</li>
                <li>Historie konverzací s chatboty a asistenty</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-heading">3. Účel zpracování údajů</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed">
              <p>
                Vaše osobní údaje zpracováváme za těmito účely:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Poskytování služby:</strong> Správa účtu, autentizace, ukládání nastavení</li>
                <li><strong>Zpracování plateb:</strong> Fakturace, nákup kreditů, předplatné, affiliate výplaty</li>
                <li><strong>Komunikace:</strong> Notifikace, technická podpora, marketingové zprávy (s vaším souhlasem)</li>
                <li><strong>Zlepšování služby:</strong> Analytika používání, opravy chyb, vývoj nových funkcí</li>
                <li><strong>Bezpečnost:</strong> Ochrana před zneužitím, detekce podvodů, dodržování právních předpisů</li>
                <li><strong>Affiliate program:</strong> Tracking referrálů, výpočet provizí, zpracování výplat</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-heading">4. Právní základ zpracování</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed">
              <p>
                Zpracováváme vaše osobní údaje na základě:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Plnění smlouvy (čl. 6 odst. 1 písm. b GDPR):</strong> Poskytování služby, zpracování plateb</li>
                <li><strong>Oprávněný zájem (čl. 6 odst. 1 písm. f GDPR):</strong> Bezpečnost, analytika, zlepšování služby</li>
                <li><strong>Souhlas (čl. 6 odst. 1 písm. a GDPR):</strong> Marketingové komunikace, cookies třetích stran</li>
                <li><strong>Právní povinnost (čl. 6 odst. 1 písm. c GDPR):</strong> Účetnictví, daňové povinnosti</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-heading">5. Sdílení údajů s třetími stranami</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed">
              <p>
                Vaše údaje sdílíme pouze s ověřenými třetími stranami:
              </p>
              <p>
                <strong>5.1 AI poskytovatelé:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>OpenAI, Anthropic, Google, Mistral, Cohere - pro zpracování AI requestů</li>
                <li>Stability AI, Midjourney - pro generování obrázků</li>
                <li>RunwayML, Pika Labs - pro generování videí</li>
                <li>Suno, MusicGen - pro generování hudby</li>
              </ul>
              <p>
                <strong>5.2 Technické služby:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Supabase:</strong> Databáze, autentizace, úložiště (EU servery)</li>
                <li><strong>Vercel:</strong> Hosting aplikace (EU region)</li>
              </ul>
              <p>
                <strong>5.3 Platební brány:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>PayPal:</strong> Zpracování plateb</li>
                <li>Platební údaje nikdy neukládáme přímo v naší databázi</li>
              </ul>
              <p>
                Všichni zpracovatelé jsou vázáni smlouvou o zpracování osobních údajů (DPA) 
                a dodržují standardy GDPR.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-heading">6. Doba uchovávání údajů</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed">
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Aktivní účet:</strong> Po dobu existence účtu + 12 měsíců po zrušení</li>
                <li><strong>Platební údaje:</strong> 10 let (daňová povinnost)</li>
                <li><strong>Vygenerovaný obsah:</strong> Do doby smazání účtu nebo manuálního smazání</li>
                <li><strong>Logy a analytika:</strong> 24 měsíců</li>
                <li><strong>Marketing souhlas:</strong> Do odvolání souhlasu</li>
              </ul>
              <p>
                Po uplynutí doby uchovávání údaje bezpečně smažeme nebo anonymizujeme.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-heading">7. Zabezpečení údajů</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed">
              <p>
                Bezpečnost vašich údajů bereme velmi vážně. Používáme:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Šifrování:</strong> SSL/TLS pro přenos dat, AES-256 pro uložená data</li>
                <li><strong>Hashování hesel:</strong> bcrypt s vysokým počtem iterací</li>
                <li><strong>Šifrování API klíčů:</strong> Symetrické šifrování v databázi</li>
                <li><strong>Pravidelné zálohy:</strong> Automatické zálohování dat</li>
                <li><strong>Přístupová kontrola:</strong> Role-based access control (RBAC)</li>
                <li><strong>Monitoring:</strong> 24/7 sledování bezpečnostních incidentů</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-heading">8. Vaše práva podle GDPR</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed">
              <p>
                Máte následující práva:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Právo na přístup (čl. 15):</strong> Zjistit, jaké údaje o vás zpracováváme</li>
                <li><strong>Právo na opravu (čl. 16):</strong> Opravit nepřesné nebo neúplné údaje</li>
                <li><strong>Právo na výmaz (čl. 17):</strong> "Právo být zapomenut" - smazání vašich údajů</li>
                <li><strong>Právo na omezení (čl. 18):</strong> Omezit zpracování vašich údajů</li>
                <li><strong>Právo na přenositelnost (čl. 20):</strong> Získat vaše data ve strukturovaném formátu</li>
                <li><strong>Právo vznést námitku (čl. 21):</strong> Nesouhlasit se zpracováním</li>
                <li><strong>Právo odvolat souhlas (čl. 7):</strong> Kdykoli odvolat souhlas s marketingem</li>
              </ul>
              <p>
                Pro uplatnění těchto práv nás kontaktujte na <strong>privacy@kaikus.cz</strong>. 
                Odpovíme do 30 dnů.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-heading">9. Soubory cookies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed">
              <p>
                <strong>9.1 Nezbytné cookies (vždy aktivní):</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Autentizace:</strong> Uchovávání přihlášení</li>
                <li><strong>Bezpečnost:</strong> CSRF ochrana</li>
                <li><strong>Preferenční:</strong> Dark mode, jazyk</li>
              </ul>
              <p>
                <strong>9.2 Analytické cookies (s vaším souhlasem):</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Google Analytics - sledování používání, demografické údaje</li>
                <li>Hotjar - heatmapy, záznam relací (anonymizované)</li>
              </ul>
              <p>
                <strong>9.3 Marketingové cookies (s vaším souhlasem):</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Facebook Pixel - remarketing, měření konverzí</li>
                <li>Google Ads - cílená reklama</li>
              </ul>
              <p>
                Svůj souhlas s cookies můžete kdykoli změnit v nastavení účtu.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-heading">10. Přenos údajů mimo EU</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed">
              <p>
                Některé AI služby mohou zpracovávat data na serverech mimo EU (OpenAI - USA, atd.). 
                V těchto případech zajišťujeme:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Standardní smluvní doložky (SCC) schválené EU</li>
                <li>Certifikace EU-US Data Privacy Framework</li>
                <li>Minimalizaci přenášených osobních údajů</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-heading">11. Děti a ochrana nezletilých</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed">
              <p>
                Naše služba není určena osobám mladším 16 let. 
                Pokud zjistíme, že jsme získali údaje od dítěte mladšího 16 let bez souhlasu rodičů, 
                tyto údaje neprodleně smažeme.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-heading">12. Změny těchto zásad</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed">
              <p>
                Tyto zásady můžeme aktualizovat z důvodu změn v legislativě nebo našich praktikách. 
                O významných změnách vás budeme informovat emailem nebo oznámením na platformě 
                minimálně 14 dní předem.
              </p>
              <p>
                Aktuální verze je vždy dostupná na této stránce s datem účinnosti.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-heading">13. Kontakt a stížnosti</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed">
              <p>
                <strong>Pro dotazy ohledně ochrany osobních údajů:</strong>
              </p>
              <p>
                Email: <strong>privacy@kaikus.cz</strong><br />
                Telefon: +420 123 456 789<br />
                Adresa: Praha 1, Česká republika
              </p>
              <p>
                <strong>Podání stížnosti u dozorového úřadu:</strong>
              </p>
              <p>
                Úřad pro ochranu osobních údajů<br />
                Pplk. Sochora 27<br />
                170 00 Praha 7<br />
                Web: www.uoou.cz
              </p>
            </CardContent>
          </Card>

          <div className="flex gap-4 pt-6">
            <Button variant="outline" asChild className="flex-1">
              <Link href="/terms">
                Obchodní podmínky
              </Link>
            </Button>
            <Button asChild className="flex-1">
              <Link href="/">
                Zpět na hlavní stránku
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}