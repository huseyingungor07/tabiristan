import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

const BASE_URL = 'https://tabiristan.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 1. Supabase'den yayınlanmış tüm rüyaların slug'larını çek
  // (Limit koymuyoruz ama 50.000 olunca buraya limit/pagination eklemek gerekir)
  const { data: ruyalar } = await supabase
    .from('ruyalar')
    .select('slug, created_at')
    .eq('is_published', true);

  if (!ruyalar) {
    return [];
  }

  // 2. Rüyaları sitemap formatına çevir
  const ruyaEntries: MetadataRoute.Sitemap = ruyalar.map((ruya) => ({
    url: `${BASE_URL}/ruya/${ruya.slug}`,
    lastModified: new Date(ruya.created_at || new Date()),
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  // 3. Statik sayfaları ekle (Ana sayfa vb.)
  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...ruyaEntries,
  ];
}