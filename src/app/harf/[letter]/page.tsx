import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Metadata } from 'next';
import AlphabetNav from '@/components/AlphabetNav';
import SearchableDreamList from '@/components/SearchableDreamList';

// Next.js 16 için sayfa parametre tipi (Promise olarak geliyor)
type Props = {
  params: Promise<{ letter: string }>;
};

// Sayfanın SEO Başlığını ve Açıklamasını Oluşturan Fonksiyon
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { letter } = await params;
  
  // URL'deki kodlanmış karakteri çözüyoruz (Örn: %C5%9F -> ş)
  const decodedLetter = decodeURIComponent(letter);
  
  // Harfi Türkçe kurallarına göre büyütüyoruz (i -> İ, ş -> Ş)
  const upperLetter = decodedLetter.toLocaleUpperCase('tr-TR');
  
  return {
    title: `${upperLetter} Harfi ile Başlayan Rüyalar | Tabiristan`,
    description: `${upperLetter} harfi ile başlayan en popüler rüya tabirleri listesi.`,
    alternates: {
        canonical: `https://tabiristan.com/harf/${decodedLetter}`,
    }
  };
}

// Sayfayı her istekte tekrar oluşturmak yerine 1 saat önbellekte tutuyoruz (Performans için)
export const revalidate = 3600; 

// ANA SAYFA BİLEŞENİ
export default async function HarfPage({ params }: Props) {
  const { letter } = await params;
  
  const decodedLetter = decodeURIComponent(letter);
  const upperLetter = decodedLetter.toLocaleUpperCase('tr-TR');
  const lowerLetter = decodedLetter.toLocaleLowerCase('tr-TR');

  // --- 1. VERİ ÇEKME MANTIĞI (PAGINATION / DÖNGÜ) BAŞLANGICI ---
  
  // Tüm sonuçları toplayacağımız boş bir havuz oluşturuyoruz
  let allRuyalar: any[] = [];
  
  // Hangi sayfada olduğumuzu takip eden sayaç (0'dan başlar)
  let page = 0;
  
  // Supabase'in tek seferde vereceği maksimum satır sayısı
  const PAGE_SIZE = 1000;
  
  // Döngünün devam edip etmeyeceğini kontrol eden bayrak
  let hasMore = true;

  // Veriler bitene kadar çalışacak döngü
  while (hasMore) {
    const { data, error } = await supabase
      .from('ruyalar')
      .select('slug, keyword')
      .eq('is_published', true) // Sadece yayınlanmış olanları al
      // Filtreleme: Türkçe karakter uyumlu (İ ve i ayrımı için)
      // "Rüyada İ..." VEYA "Rüyada i..." ile başlayanları getir
      .or(`keyword.like.Rüyada ${upperLetter}%,keyword.like.Rüyada ${lowerLetter}%`)
      .order('keyword', { ascending: true }) // Alfabetik sırala
      // KRİTİK KISIM: range() fonksiyonu ile parça parça istiyoruz.
      // 1. Tur: 0 - 999
      // 2. Tur: 1000 - 1999 ... diye gider.
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (error) {
      console.error('Veri çekme hatası:', error);
      break; // Hata varsa döngüyü kır, sonsuz döngüye girmesin
    }

    if (data) {
      // Gelen 1000'lik paketi ana havuzumuza ekliyoruz (... operatörü ile birleştirme)
      allRuyalar = [...allRuyalar, ...data];
      
      // KONTROL: Eğer gelen veri paketi 1000'den azsa (örneğin 623 tane geldiyse),
      // demek ki veritabanındaki tüm veriler bitti, son sayfadayız.
      if (data.length < PAGE_SIZE) {
        hasMore = false; // Döngüyü durdur
      } else {
        page++; // Sonraki sayfaya (1000-1999 aralığına) geçmek için sayacı artır
      }
    } else {
      hasMore = false; // Veri hiç gelmediyse durdur
    }
  }
  // --- VERİ ÇEKME MANTIĞI BİTİŞİ ---

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Üst Kısım (Header) */}
      <header className="bg-white shadow-sm py-8 text-center border-b">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            <span className="text-blue-600">{upperLetter}</span> Harfi ile Başlayan Rüyalar
          </h1>
          
          {/* Alfabe İndeksini kolay ulaşım için üstte tutuyoruz */}
          <div className="my-6">
             <AlphabetNav />
          </div>

          <div className="mt-4 text-sm text-gray-500">
            <Link href="/" className="text-blue-600 hover:underline">← Ana Sayfaya Dön</Link>
            <span className="mx-2">•</span>
            {/* Artık allRuyalar.length bize gerçek toplam sayıyı (örn: 1623) verecek */}
            <span>Toplam {allRuyalar.length} sonuç</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">
        
        {/* Topladığımız tüm veriyi (allRuyalar) listeleme bileşenine gönderiyoruz */}
        <SearchableDreamList initialRuyalar={allRuyalar} />
        
      </main>
    </div>
  );
}