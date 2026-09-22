const parser = new Parser();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  try {
    // 1. Leggiamo le notizie del Sole 24 Ore
    const feed = await parser.parseURL('https://www.ilsole24ore.com/rss/economia.xml');

    const newsToInsert = feed.items.slice(0, 10).map(item => ({
      title: item.title,
      summary: item.contentSnippet || '',
      content: item.content || item.contentSnippet || '',
      url: item.link,
      source: 'Il Sole 24 Ore',
      category: 'Economia',
      is_edilizia: item.title.toLowerCase().includes('casa') || item.title.toLowerCase().includes('edilizia'),
      timestamp: new Date(item.pubDate).toLocaleString('it-IT')
    }));

    // 2. Salviamo nel database (ignorando i duplicati)
    for (const news of newsToInsert) {
       await supabase.from('notizie').upsert(news, { onConflict: 'url' });
    }

    res.status(200).json({ success: true, message: 'Notizie aggiornate e salvate in Supabase!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Errore durante l\'aggiornamento' });
  }
}
