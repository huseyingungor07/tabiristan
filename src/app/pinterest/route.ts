import { supabase } from '@/lib/supabase';

// BU SATIR ÇOK ÖNEMLİ: Sayfanın statik olmasını engeller
export const dynamic = 'force-dynamic'; 

const BASE_URL = 'https://tabiristan.com';
const STORAGE_URL = process.env.NEXT_PUBLIC_R2_URL; 

export async function GET() {
  console.log("RSS İsteği Geldi - Taze Veri Çekiliyor..."); // Loglara bakalım

  // Pinterest için son 50 rüyayı çek (Sayıyı düşürdük ki hızlı açılsın, test edelim)
  const { data: ruyalar } = await supabase
    .from('ruyalar')
    .select('slug, title, meta_description, created_at')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(50); 

  if (!ruyalar) {
    return new Response('Veri bulunamadı', { status: 404 });
  }

  // XML Başlangıcı
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:content="http://purl.org/rss/1.0/modules/content/" 
     xmlns:wfw="http://wellformedweb.org/CommentAPI/"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>Tabiristan - En Son Rüyalar</title>
    <link>${BASE_URL}</link>
    <description>Yapay zeka destekli rüya tabirleri ansiklopedisi.</description>
    <language>tr</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${BASE_URL}/pinterest" rel="self" type="application/rss+xml" />
`;

  ruyalar.forEach((ruya) => {
    // URL güvenliği
    const safeStorageUrl = STORAGE_URL?.replace(/\/$/, ''); 
    
    // CACHE BUSTING: Resim linkinin sonuna versiyon ekledik
    const imageUrl = `${safeStorageUrl}/${ruya.slug}.webp?v=2`;
    
    const pageUrl = `${BASE_URL}/ruya/${ruya.slug}`;
    const pubDate = new Date(ruya.created_at || new Date()).toUTCString();

    xml += `
    <item>
      <title><![CDATA[${ruya.title}]]></title>
      <link>${pageUrl}</link>
      <guid isPermaLink="true">${pageUrl}</guid>
      <description><![CDATA[${ruya.meta_description}]]></description>
      <pubDate>${pubDate}</pubDate>
      
      <enclosure url="${imageUrl}" type="image/webp" length="153600" />
      
      <media:content url="${imageUrl}" type="image/webp" fileSize="153600" medium="image" width="1000" height="1500">
        <media:title type="plain"><![CDATA[${ruya.title}]]></media:title>
        <media:description type="plain"><![CDATA[${ruya.meta_description}]]></media:description>
      </media:content>
    </item>`;
  });

  xml += `
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      // CACHE'İ KAPATMA KOMUTLARI:
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}