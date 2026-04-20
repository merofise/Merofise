// MEROFISE BOT CAZADOR v1.0
// Ejecutar cada 5 minutos via Vercel Cron

const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

// CONFIGURACIÓN - Usa tus claves NUEVAS (rotadas)
const SUPABASE_URL = 'https://TU_PROYECTO.supabase.co';
const SUPABASE_KEY = 'TU_NUEVA_CLAVE_SUPABASE'; // sbp_... nueva
const OPENAI_KEY = 'TU_NUEVA_CLAVE_OPENAI'; // sk-... nueva

async function scrapeIdealista() {
  console.log('🤖 Merofise Bot iniciando caza...');
  
  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });
  
  try {
    const page = await browser.newPage();
    
    // Anti-deteción: parece humano
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    await page.setViewport({ width: 1920, height: 1080 });
    
    // 1. Ir a Idealista Madrid alquiler
    await page.goto('https://www.idealista.com/alquiler-viviendas/madrid/', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // 2. Esperar que carguen los anuncios
    await page.waitForSelector('.item', { timeout: 10000 });
    
    // 3. Extraer datos
    const propiedades = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.item')).map(item => {
        const titulo = item.querySelector('.item-link')?.textContent?.trim() || '';
        const precioTexto = item.querySelector('.price')?.textContent?.trim() || '';
        const precio = parseInt(precioTexto.replace(/[^\d]/g, '')) || 0;
        const direccion = item.querySelector('.ellipsis')?.textContent?.trim() || '';
        const enlace = item.querySelector('.item-link')?.href || '';
        const foto = item.querySelector('img')?.src || '';
        const metros = item.querySelector('.item-detail')?.textContent?.match(/\d+/)?.[0] || '';
        const habitaciones = item.querySelectorAll('.item-detail')[1]?.textContent?.match(/\d+/)?.[0] || '';
        
        return {
          fuente: 'idealista',
          titulo,
          precio,
          direccion,
          enlace,
          foto,
          metros: parseInt(metros) || 0,
          habitaciones: parseInt(habitaciones) || 0,
          ciudad: 'Madrid',
          tipo: 'alquiler',
          capturado_en: new Date().toISOString()
        };
      });
    });
    
    console.log(`✅ Capturadas ${propiedades.length} propiedades`);
    
    // 4. Filtrar solo nuevas (no duplicadas)
    const nuevas = await filtrarNuevas(propiedades);
    console.log(`🆕 ${nuevas.length} propiedades nuevas`);
    
    // 5. Guardar en Supabase
    if (nuevas.length > 0) {
      await guardarEnSupabase(nuevas);
      
      // 6. Analizar con IA
      for (const prop of nuevas) {
        await analizarConIA(prop);
      }
    }
    
    return nuevas;
    
  } catch (error) {
    console.error('❌ Error scraping:', error);
    return [];
  } finally {
    await browser.close();
  }
}

// Filtrar propiedades ya existentes
async function filtrarNuevas(propiedades) {
  // Aquí consultarías Supabase para ver cuáles ya existen
  // Por ahora, simulamos que todas son nuevas
  return propiedades.slice(0, 5); // Limitar a 5 para no saturar
}

// Guardar en Supabase
async function guardarEnSupabase(propiedades) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/propiedades`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(propiedades)
    });
    
    if (response.ok) {
      console.log('💾 Guardadas en Supabase');
    } else {
      console.error('❌ Error Supabase:', await response.text());
    }
  } catch (error) {
    console.error('❌ Error conexión Supabase:', error);
  }
}

// Analizar con OpenAI
async function analizarConIA(propiedad) {
  try {
    const prompt = `
    Eres un experto inmobiliario. Analiza esta propiedad:
    Título: ${propiedad.titulo}
    Precio: ${propiedad.precio}€
    Ciudad: ${propiedad.ciudad}
    Metros: ${propiedad.metros}
    Habitaciones: ${propiedad.habitaciones}
    
    Responde SOLO con JSON:
    {
      "oportunidad_score": 0-100,
      "precio_mercado": número estimado,
      "rentabilidad": "alta/media/baja",
      "alertas": ["lista", "de", "problemas"],
      "descripcion_merofise": "texto atractivo para web"
    }
    `;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3
      })
    });
    
    const data = await response.json();
    const analisis = JSON.parse(data.choices[0].message.content);
    
    console.log(`🧠 IA Análisis: ${propiedad.titulo} - Score: ${analisis.oportunidad_score}`);
    
    // TODO: Guardar análisis en Supabase
    
    // Si score > 80, notificar por WhatsApp
    if (analisis.oportunidad_score > 80) {
      await notificarWhatsApp(propiedad, analisis);
    }
    
  } catch (error) {
    console.error('❌ Error IA:', error);
  }
}

// Notificar WhatsApp Business
async function notificarWhatsApp(propiedad, analisis) {
  const mensaje = `🔥 OPORTUNIDAD MEROFISE
${propiedad.titulo}
${propiedad.precio}€ - ${propiedad.metros}m²
Score IA: ${analisis.oportunidad_score}/100
Ver: ${propiedad.enlace}`;
  
  // TODO: Integrar WhatsApp Business API
  console.log('📱 WhatsApp:', mensaje);
}

// Ejecutar si se llama directamente
if (require.main === module) {
  scrapeIdealista();
}

module.exports = { scrapeIdealista };
