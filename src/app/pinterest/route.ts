import { supabase } from '@/lib/supabase';

const BASE_URL = 'https://tabiristan.com';
// R2 URL'sini .env dosyasından alıyoruz
const STORAGE_URL = process.env.NEXT_PUBLIC_R2_URL; 

export async function GET() {
  // Son 50 rüyayı çek
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
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:wfw="http://wellformedweb.org/CommentAPI/">
  <channel>
    <title>Tabiristan - En Son Rüyalar</title>
    <link>${BASE_URL}</link>
    <description>Yapay zeka destekli rüya tabirleri ansiklopedisi.</description>
    <language>tr</language>
`;

  ruyalar.forEach((ruya) => {
    // DÜZELTME BURADA: Artık R2 adresini ve webp uzantısını kullanıyoruz
    const imageUrl = `${STORAGE_URL}/${ruya.slug}.webp`;
    const pageUrl = `${BASE_URL}/ruya/${ruya.slug}`;
    const pubDate = new Date(ruya.created_at || new Date()).toUTCString();

    xml += `
    <item>
      <title><![CDATA[${ruya.title}]]></title>
      <link>${pageUrl}</link>
      <guid isPermaLink="true">${pageUrl}</guid>
      <description><![CDATA[${ruya.meta_description}]]></description>
      <pubDate>${pubDate}</pubDate>
      <enclosure url="${imageUrl}" type="image/webp" />
    </item>`;
  });

  xml += `
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}