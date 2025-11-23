import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import AlphabetNav from '@/components/AlphabetNav';

// Next.js 16 için params tipi
type Props = {
  params: Promise<{ letter: string }>;
};

// Dinamik Metadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { letter } = await params;
  
  // DÜZELTME 1: Decode işlemi eklendi
  const decodedLetter = decodeURIComponent(letter);
  const upperLetter = decodedLetter.toLocaleUpperCase('tr-TR');
  
  return {
    title: `${upperLetter} Harfi ile Başlayan Rüyalar | Tabiristan`,
    description: `${upperLetter} harfi ile başlayan en popüler rüya tabirleri listesi.`,
    alternates: {
        canonical: `https://tabiristan.com/harf/${decodedLetter}`, // Canonical'da da düzgün görünsün
    }
  };
}

export const revalidate = 3600; // 1 saatte bir güncelle

export default async function HarfPage({ params }: Props) {
  const { letter } = await params;
  
  // DÜZELTME 2: Decode işlemi eklendi
  const decodedLetter = decodeURIComponent(letter);
  const upperLetter = decodedLetter.toLocaleUpperCase('tr-TR');

  // Supabase Sorgusu
  const { data: ruyalar } = await supabase
    .from('ruyalar')
    .select('slug, keyword')
    .eq('is_published', true)
    .ilike('keyword', `Rüyada ${upperLetter}%`) 
    .order('keyword', { ascending: true });

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Header */}
      <header className="bg-white shadow-sm py-10 text-center border-b">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900">
            <span className="text-blue-600">{upperLetter}</span> Harfi ile Başlayan Rüyalar
          </h1>
          <p className="text-gray-500 mt-2">Toplam {ruyalar?.length || 0} sonuç bulundu.</p>
          <div className="mt-6">
            <Link href="/" className="text-sm text-blue-600 hover:underline">← Ana Sayfaya Dön</Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        
        {ruyalar && ruyalar.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ruyalar.map((ruya) => (
              <Link 
                key={ruya.slug} 
                href={`/ruya/${ruya.slug}`}
                className="block bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all group"
              >
                <span className="text-gray-700 font-medium group-hover:text-blue-700">
                  {ruya.keyword}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500 text-lg">Bu harfle başlayan rüya henüz eklenmemiş.</p>
            <p className="text-sm text-gray-400 mt-2">Yapay zeka motorumuz çalışmaya devam ediyor...</p>
          </div>
        )}

        <AlphabetNav />
        
      </main>
    </div>
  );
}