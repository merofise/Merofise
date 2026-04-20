// MEROFISE PAYMENT API - Stripe Checkout
// Endpoint: tu-dominio.com/api/payment

const Stripe = require('stripe');

// Inicializar Stripe con clave secreta (del servidor, no pública)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-04-10'
});

export default async function handler(req, res) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Usa POST para crear pagos'
    });
  }

  try {
    const { propertyId, userEmail, type, propertyTitle } = req.body;
    
    // Validar datos mínimos
    if (!propertyId || !type) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'Falta propertyId o type'
      });
    }

    // Configurar producto según tipo
    let productName, productDescription, unitAmount;
    
    if (type === 'unlock') {
      productName = '🔓 Desbloquear contacto propietario';
      productDescription = `Acceso verificado 100% seguro - ${propertyTitle || 'Propiedad seleccionada'}. Sin estafas, contacto directo validado por Merofise.`;
      unitAmount = 499; // 4.99€ en céntimos
    } 
    else if (type === 'premium') {
      productName = '⭐ Acceso Premium Merofise';
      productDescription = 'Desbloquea TODAS las propiedades durante 30 días. Incluye verificación anti-fraude y soporte prioritario.';
      unitAmount = 2999; // 29.99€ en céntimos
    }
    else {
      return res.status(400).json({
        error: 'Tipo inválido',
        message: 'Usa "unlock" o "premium"'
      });
    }

    // Crear sesión de checkout en Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: productName,
              description: productDescription,
              images: ['https://merofise.es/logo-og.png'], // Opcional: tu logo
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_URL || 'https://merofise.es'}/success?session_id={CHECKOUT_SESSION_ID}&property=${propertyId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL || 'https://merofise.es'}/cancel?property=${propertyId}`,
      customer_email: userEmail || undefined,
      metadata: {
        propertyId: propertyId,
        type: type,
        source: 'merofise-web',
        timestamp: new Date().toISOString()
      },
      // Configuración adicional para seguridad
      payment_intent_data: {
        metadata: {
          propertyId: propertyId,
          type: type
        }
      },
      // Idioma español
      locale: 'es',
    });

    // Log para debugging (aparece en Vercel logs)
    console.log(`✅ Pago creado: ${session.id} | Tipo: ${type} | Propiedad: ${propertyId}`);

    // Responder con URL de checkout
    res.status(200).json({ 
      success: true,
      sessionId: session.id, 
      url: session.url,
      amount: unitAmount / 100,
      currency: 'EUR'
    });
    
  } catch (error) {
    console.error('❌ Error Stripe:', error.message);
    res.status(500).json({ 
      error: 'Error creando pago',
      message: error.message 
    });
  }
}
