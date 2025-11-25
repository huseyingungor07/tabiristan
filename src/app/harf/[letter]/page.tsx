import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Metadata } from 'next';
import AlphabetNav from '@/components/AlphabetNav';
import SearchableDreamList from '@/components/SearchableDreamList'; // Arama bileşenini ekledik

type Props = {
  params: Promise<{ letter: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { letter } = await params;
  const decodedLetter = decodeURIComponent(letter);
  const upperLetter = decodedLetter.toLocaleUpperCase('tr-TR');
  
  return {
    title: `${upperLetter} Harfi ile Başlayan Rüyalar | Tabiristan`,
    description: `${upperLetter} harfi ile başlayan en popüler rüya tabirleri listesi.`,
    alternates: {
        canonical: `https://tabiristan.com/harf/${decodedLetter}`,
    }
  };
}

export const revalidate = 3600; 

export default async function HarfPage({ params }: Props) {
  const { letter } = await params;
  const decodedLetter = decodeURIComponent(letter);
  const upperLetter = decodedLetter.toLocaleUpperCase('tr-TR');
  const lowerLetter = decodedLetter.toLocaleLowerCase('tr-TR');

  // Veritabanından o harfle başlayanları çekiyoruz
  const { data: ruyalar } = await supabase
    .from('ruyalar')
    .select('slug, keyword')
    .eq('is_published', true)
    .or(`keyword.like.Rüyada ${upperLetter}%,keyword.like.Rüyada ${lowerLetter}%`)
    .order('keyword', { ascending: true });

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Header */}
      <header className="bg-white shadow-sm py-8 text-center border-b">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            <span className="text-blue-600">{upperLetter}</span> Harfi ile Başlayan Rüyalar
          </h1>
          
          {/* 1. ALFABE İNDEKSİ (ARTIK ÜSTTE) */}
          <div className="my-6">
             <AlphabetNav />
          </div>

          <div className="mt-4 text-sm text-gray-500">
            <Link href="/" className="text-blue-600 hover:underline">← Ana Sayfaya Dön</Link>
            <span className="mx-2">•</span>
            <span>Toplam {ruyalar?.length || 0} sonuç</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">
        
        {/* 2. ARAMA ÇUBUĞU VE LİSTE */}
        {/* SearchableDreamList'e o harfin listesini 'initial' olarak veriyoruz.
            Kullanıcı arama yaparsa yine tüm veritabanında arayabilecek. 
            Bu hem filtreleme hem global arama görevi görür. */}
        <SearchableDreamList initialRuyalar={ruyalar || []} />
        
      </main>
    </div>
  );
}