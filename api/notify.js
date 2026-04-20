// MEROFISE WHATSAPP NOTIFICATIONS
// Envía alertas a +34664037407 cuando hay actividad

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, data } = req.body;
    
    // Configuración CallMeBot (gratis para WhatsApp)
    const phone = '34664037407'; // Tu WhatsApp Business
    const apiKey = process.env.CALLMEBOT_KEY;
    
    if (!apiKey) {
      throw new Error('CALLMEBOT_KEY no configurada');
    }

    let mensaje = '';
    const emoji = {
      property: '🏠',
      payment: '💰',
      contact: '📞',
      alert: '⚠️',
      success: '✅'
    };

    switch(type) {
      case 'nueva_propiedad':
        mensaje = `${emoji.property} NUEVA CAPTURADA\n${data.titulo}\n💵 ${data.precio}€ - ${data.ciudad}\n📊 Score IA: ${data.score}/100\n🔗 ${data.enlace?.substring(0, 50)}...`;
        break;
        
      case 'pago_recibido':
        mensaje = `${emoji.payment} PAGO RECIBIDO\n👤 ${data.email}\n🏠 Propiedad: ${data.propertyId}\n💵 ${data.amount}€\n✅ Estado: COMPLETADO\n⏰ ${new Date().toLocaleString('es-ES')}`;
        break;
        
      case 'nuevo_contacto':
        mensaje = `${emoji.contact} NUEVO CLIENTE\n👤 ${data.nombre}\n📱 ${data.telefono}\n🎯 Interés: ${data.interes}\n🔥 Urgente: ${data.urgente ? 'SÍ' : 'No'}`;
        break;
        
      case 'alerta_fraude':
        mensaje = `${emoji.alert} ALERTA DETECTADA\n🏠 ${data.propiedad}\n❌ Razón: ${data.razon}\n🚫 Acción: Bloqueado automático`;
        break;
        
      default:
        mensaje = `${emoji.success} Notificación Merofise\n${JSON.stringify(data, null, 2).substring(0, 200)}`;
    }

    // Enviar via CallMeBot API
    const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(mensaje)}&apikey=${apiKey}`;
    
    const response = await fetch(url, { timeout: 10000 });
    
    if (!response.ok) {
      throw new Error(`CallMeBot error: ${response.status}`);
    }

    res.status(200).json({ 
      success: true, 
      sent: true,
      type: type,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ WhatsApp error:', error);
    // No fallar la petición principal si WhatsApp falla
    res.status(200).json({ 
      success: false, 
      error: error.message,
      fallback: 'Guardado en logs para revisión manual'
    });
  }
}
