import { supabase } from '@/lib/supabase';

const BASE_URL = 'https://tabiristan.com';
// DİKKAT: Bu değişkenin Vercel/Sunucu ortam değişkenlerinde tanımlı olduğundan emin ol!
const STORAGE_URL = process.env.NEXT_PUBLIC_R2_URL; 

export async function GET() {
  // Pinterest için son 1000 rüyayı çekiyoruz
  const { data: ruyalar } = await supabase
    .from('ruyalar')
    .select('slug, title, meta_description, created_at')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(1000); 

  if (!ruyalar) {
    return new Response('Veri bulunamadı', { status: 404 });
  }

  // XML Başlangıcı
  // GÜNCELLEME: xmlns:media EKLENDİ (Pinterest'in şart koştuğu standart)
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
    
    <atom:link href="${BASE_URL}/pinterest" rel="self" type="application/rss+xml" />
`;

  ruyalar.forEach((ruya) => {
    // URL'in sonuna slash gelip gelmemesini garantiye alıyoruz
    const safeStorageUrl = STORAGE_URL?.replace(/\/$/, ''); 
    const imageUrl = `${safeStorageUrl}/${ruya.slug}.webp`;
    const pageUrl = `${BASE_URL}/ruya/${ruya.slug}`;
    const pubDate = new Date(ruya.created_at || new Date()).toUTCString();

    xml += `
    <item>
      <title><![CDATA[${ruya.title}]]></title>
      <link>${pageUrl}</link>
      <guid isPermaLink="true">${pageUrl}</guid>
      <description><![CDATA[${ruya.meta_description}]]></description>
      <pubDate>${pubDate}</pubDate>
      
      <enclosure url="${imageUrl}" type="image/webp" length="150000" />
      
      <media:content url="${imageUrl}" type="image/webp" medium="image" width="1000" height="1500">
        <media:title type="html"><![CDATA[${ruya.title}]]></media:title>
        <media:description type="html"><![CDATA[${ruya.meta_description}]]></media:description>
      </media:content>
    </item>`;
  });

  xml += `
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'text/xml; charset=utf-8', // application/xml yerine text/xml bazen daha iyi çalışır
      'Cache-Control': 's-maxage=3600, stale-while-revalidate', // 1 saat cache
    },
  });
}