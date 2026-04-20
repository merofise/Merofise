// MEROFISE BOT RUNNER
// Ejecutado cada 5 min por Vercel Cron

export default async function handler(req, res) {
  // Seguridad: verificar secreto de cron
  const cronSecret = req.headers['x-cron-secret'] || req.query.secret;
  
  if (cronSecret !== process.env.CRON_SECRET) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Invalid or missing cron secret'
    });
  }

  try {
    // Aquí iría la llamada al scraper
    // Por ahora, simulamos actividad
    const mockResult = {
      timestamp: new Date().toISOString(),
      status: 'running',
      message: 'Bot configurado. Próximamente: scraping activo.',
      next_run: '5 minutos'
    };

    // TODO: import { scrapeIdealista } from '../bot-scraper';
    // const nuevas = await scrapeIdealista();
    
    res.status(200).json({
      success: true,
      ...mockResult
    });
    
  } catch (error) {
    console.error('Bot error:', error);
    res.status(500).json({ 
      error: 'Bot execution failed',
      message: error.message 
    });
  }
}
