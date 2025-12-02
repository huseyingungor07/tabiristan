import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  // Sitenin ana adresi
  const baseUrl = 'https://tabiristan.com';

  return {
    rules: {
      userAgent: '*', // Tüm botlara (Google, Bing, Yandex...) hitap et
      allow: '/',     // Sitenin her yerine girmelerine izin ver
      // disallow: '/private/', // Yasaklamak istediğin yer olursa burayı açarsın
    },
    sitemap: `${baseUrl}/sitemap.xml`, // KRİTİK: Haritanın yerini göster
  }
}
