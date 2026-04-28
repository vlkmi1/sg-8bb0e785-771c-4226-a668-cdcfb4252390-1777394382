import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

// Stripe Webhook Handler for automatic payment confirmation
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  try {
    // V produkci by se zde validoval podpis Stripe:
    // const sig = req.headers['stripe-signature'];
    // const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    const event = req.body;

    // Sledujeme úspěšné dokončení platby
    if (event.type === 'checkout.session.completed' || event.type === 'payment_intent.succeeded') {
      const session = event.data.object;
      
      // Získáme ID platby z metadat (které jsme tam vložili při vytváření)
      const paymentId = session.metadata?.payment_id || session.client_reference_id;

      if (paymentId) {
        // Nejprve zkontrolujeme, zda platba existuje a je pending
        const { data: payment } = await supabase
          .from("payments")
          .select("*")
          .eq("id", paymentId)
          .single();

        if (payment && payment.status === 'pending') {
          // Zde by ideálně mělo proběhnout to samé co v adminService.approvePayment
          // Pomocí Supabase Service Role klíče pro bypass RLS
          
          // Prozatím jen změníme status na completed
          await supabase
            .from("payments")
            .update({ 
              status: "completed",
              processed_at: new Date().toISOString() 
            })
            .eq("id", paymentId);
            
          // Poznámka: Kompletní připsání kreditů by vyžadovalo admin API s právy k zápisu do profiles/subscriptions
        }
      }
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error("Webhook Error:", error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }
}