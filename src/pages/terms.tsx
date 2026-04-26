import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText } from "lucide-react";
import { ThemeSwitch } from "@/components/ThemeSwitch";

export default function Terms() {
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
                <FileText className="h-5 w-5 text-primary" />
                <h1 className="text-lg font-heading font-bold">Obchodní podmínky</h1>
              </div>
            </div>
            <ThemeSwitch />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-heading font-bold">Obchodní podmínky</h2>
            <p className="text-muted-foreground">
              Platné od 26. dubna 2026
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="font-heading">1. Základní ustanovení</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed">
              <p>
                Tyto obchodní podmínky (dále jen "podmínky") upravují vztah mezi provozovatelem platformy kAIkus 
                (dále jen "poskytovatel") a uživateli služby (dále jen "uživatel").
              </p>
              <p>
                <strong>Poskytovatel:</strong><br />
                kAIkus s.r.o.<br />
                IČO: 12345678<br />
                Sídlo: Praha 1, Česká republika<br />
                Email: info@kaikus.cz
              </p>
              <p>
                Používáním služby kAIkus vyjadřujete souhlas s těmito obchodními podmínkami. 
                Pokud s nimi nesouhlasíte, službu nepoužívejte.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-heading">2. Popis služby</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed">
              <p>
                kAIkus je platforma poskytující přístup k různým AI službám prostřednictvím jednotného rozhraní, včetně:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>AI chatbotů (GPT-4, Claude, Gemini, Mistral a další)</li>
                <li>Generování obrázků (DALL-E, Stable Diffusion, Midjourney)</li>
                <li>Generování videí (RunwayML, Pika Labs)</li>
                <li>Hlasového chatu s AI</li>
                <li>Správy sociálních médií</li>
                <li>AI influencerů</li>
                <li>Generování hudby</li>
                <li>Generování virálních videí</li>
                <li>Vlastních AI asistentů</li>
              </ul>
              <p>
                Poskytovatel si vyhrazuje právo kdykoli změnit, pozastavit nebo ukončit jakoukoliv část služby 
                bez předchozího upozornění.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-heading">3. Registrace a uživatelský účet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed">
              <p>
                Pro použití služby je nutná registrace. Při registraci uživatel poskytuje pravdivé a aktuální údaje.
              </p>
              <p>
                <strong>Uživatel je povinen:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Chránit své přihlašovací údaje před zneužitím</li>
                <li>Neposkytovat přístup k účtu třetím stranám</li>
                <li>Okamžitě informovat poskytovatele o podezření na neoprávněný přístup</li>
                <li>Používat službu v souladu s právními předpisy a těmito podmínkami</li>
              </ul>
              <p>
                Poskytovatel si vyhrazuje právo odmítnout registraci nebo zrušit účet uživatele, 
                který porušuje tyto podmínky.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-heading">4. Kredity a platby</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed">
              <p>
                <strong>4.1 Kreditový systém</strong>
              </p>
              <p>
                Služby kAIkus fungují na kreditovém systému. Každá operace (generování textu, obrázků, videí, atd.) 
                spotřebovává určitý počet kreditů. Ceny za jednotlivé operace jsou zveřejněny na webu.
              </p>
              <p>
                <strong>4.2 Nákup kreditů</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Kredity jsou dostupné v balíčcích (50, 100, 250, 500, 1000 kreditů)</li>
                <li>Kredity nevyprší a jsou trvalé</li>
                <li>Kredity nelze vrátit ani vyměnit za peníze</li>
                <li>Nepoužité kredity zůstávají na účtu i po ukončení předplatného</li>
              </ul>
              <p>
                <strong>4.3 Předplatné</strong>
              </p>
              <p>
                Uživatelé mohou využívat měsíční předplatné (Basic, Pro, Premium, Enterprise) 
                s pravidelným měsíčním dobitím kreditů. Předplatné se automaticky obnovuje, 
                pokud jej uživatel nezruší nejméně 24 hodin před koncem aktuálního období.
              </p>
              <p>
                <strong>4.4 Platební metody</strong>
              </p>
              <p>
                Akceptujeme platby PayPal a bankovní převody (QR kódy). Všechny platby jsou zpracovávány 
                bezpečně prostřednictvím ověřených platebních bran.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-heading">5. Affiliate program</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed">
              <p>
                <strong>5.1 Účast v programu</strong>
              </p>
              <p>
                Každý registrovaný uživatel automaticky získává přístup k affiliate programu a vlastní referral link.
              </p>
              <p>
                <strong>5.2 Provize</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>20% provize z plateb za předplatné referovaných uživatelů</li>
                <li>15% provize z nákupů kreditů referovaných uživatelů</li>
                <li>Provize jsou připsány po úspěšném zaplacení</li>
                <li>Minimální částka pro výběr je 500 Kč</li>
              </ul>
              <p>
                <strong>5.3 Výplaty</strong>
              </p>
              <p>
                Výplaty provizí jsou zpracovávány do 7 pracovních dnů od schválení žádosti. 
                Poskytovatel si vyhrazuje právo pozastavit nebo zrušit účast v affiliate programu 
                při podezření na zneužití.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-heading">6. Práva duševního vlastnictví</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed">
              <p>
                <strong>6.1 Obsah generovaný AI</strong>
              </p>
              <p>
                Veškerý obsah vytvořený prostřednictvím AI služeb (texty, obrázky, videa, hudba) 
                je vlastnictvím uživatele, který jej vygeneroval. Uživatel má právo tento obsah 
                používat, distribuovat a komerčně využívat.
              </p>
              <p>
                <strong>6.2 Omezení odpovědnosti</strong>
              </p>
              <p>
                Poskytovatel nenese odpovědnost za:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Porušení autorských práv třetích stran obsahem generovaným AI</li>
                <li>Kvalitu a přesnost AI generovaného obsahu</li>
                <li>Komerční využitelnost vygenerovaného obsahu</li>
              </ul>
              <p>
                Uživatel je plně odpovědný za kontrolu a zajištění, že generovaný obsah 
                neporušuje práva třetích stran.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-heading">7. Zakázané použití</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed">
              <p>
                Uživatel se zavazuje nepoužívat službu k:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Vytváření nezákonného, hanlivého nebo urážlivého obsahu</li>
                <li>Generování dezinformací nebo fake news</li>
                <li>Porušování práv duševního vlastnictví třetích stran</li>
                <li>Šíření malwaru nebo škodlivého kódu</li>
                <li>Obtěžování, šikany nebo pronásledování</li>
                <li>Vytváření deep fake obsahu bez souhlasu dotčených osob</li>
                <li>Automatizovaného scrapingu nebo nadměrného používání API</li>
              </ul>
              <p>
                Porušení těchto pravidel může vést k okamžitému zrušení účtu bez náhrady.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-heading">8. Omezení odpovědnosti</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed">
              <p>
                <strong>8.1 Dostupnost služby</strong>
              </p>
              <p>
                Poskytovatel se snaží zajistit nepřetržitou dostupnost služby, ale nezaručuje 100% uptime. 
                Služba může být dočasně nedostupná z důvodu údržby, aktualizací nebo technických problémů.
              </p>
              <p>
                <strong>8.2 AI modely třetích stran</strong>
              </p>
              <p>
                kAIkus využívá AI modely třetích stran (OpenAI, Anthropic, Google, atd.). 
                Poskytovatel nenese odpovědnost za:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Výpadky nebo změny v těchto službách</li>
                <li>Změny v cenách nebo dostupnosti modelů</li>
                <li>Kvalitu a přesnost výstupů z AI modelů</li>
              </ul>
              <p>
                <strong>8.3 Ztráta dat</strong>
              </p>
              <p>
                Poskytovatel doporučuje pravidelné zálohování důležitých dat. 
                Nenese odpovědnost za ztrátu dat způsobenou technickým selháním, 
                lidskou chybou nebo kybernetickými útoky.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-heading">9. Ukončení služby</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed">
              <p>
                <strong>9.1 Ukončení uživatelem</strong>
              </p>
              <p>
                Uživatel může kdykoli ukončit svůj účet a předplatné v nastavení účtu. 
                Nepoužité kredity zůstávají k dispozici po dobu 12 měsíců.
              </p>
              <p>
                <strong>9.2 Ukončení poskytovatelem</strong>
              </p>
              <p>
                Poskytovatel si vyhrazuje právo zrušit účet uživatele při porušení těchto podmínek 
                nebo při podezření na zneužití služby. V takovém případě nejsou kredity ani platby vratné.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-heading">10. Změny podmínek</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed">
              <p>
                Poskytovatel si vyhrazuje právo kdykoliv změnit tyto obchodní podmínky. 
                O významných změnách budou uživatelé informováni emailem nebo oznámením na platformě 
                minimálně 14 dní předem.
              </p>
              <p>
                Pokračováním v používání služby po účinnosti změn vyjadřujete souhlas s novými podmínkami.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-heading">11. Řešení sporů</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed">
              <p>
                Tyto podmínky se řídí právním řádem České republiky. Případné spory budou řešeny 
                věcně a místně příslušnými soudy České republiky.
              </p>
              <p>
                Před podáním žaloby se strany zavazují pokusit se vyřešit spor smírnou cestou 
                prostřednictvím emailové komunikace na adrese info@kaikus.cz.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-heading">12. Kontakt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed">
              <p>
                Pro dotazy ohledně těchto obchodních podmínek nás kontaktujte na:
              </p>
              <p>
                <strong>Email:</strong> info@kaikus.cz<br />
                <strong>Telefon:</strong> +420 123 456 789<br />
                <strong>Adresa:</strong> Praha 1, Česká republika
              </p>
            </CardContent>
          </Card>

          <div className="flex gap-4 pt-6">
            <Button variant="outline" asChild className="flex-1">
              <Link href="/privacy-policy">
                Zásady ochrany osobních údajů
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