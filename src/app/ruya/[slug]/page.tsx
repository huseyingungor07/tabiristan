import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';

type Props = {
  params: Promise<{ slug: string }>;
};

type RuyaContent = {
  title: string;
  metaDescription: string;
  content: string;
};

// Yardımcı Fonksiyon: Tüm listeyi okur
async function getAllRuyalar() {
  const filePath = path.join(process.cwd(), 'src/data/ruyalar.json');
  if (!fs.existsSync(filePath)) return [];
  const fileContents = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(fileContents);
}

// Yardımcı Fonksiyon: Rastgele X eleman seçer
function getRandomRuyalar(allRuyalar: any[], currentSlug: string, count: number) {
  // Şu anki rüyayı listeden çıkar
  const filtered = allRuyalar.filter(r => r.slug !== currentSlug);
  // Listeyi karıştır
  const shuffled = filtered.sort(() => 0.5 - Math.random());
  // İlk X taneyi al
  return shuffled.slice(0, count);
}

// ... generateMetadata ve getRuyaData fonksiyonları AYNI KALSIN ...
// (Buraya yukarıdaki kodun aynısını veya önceki cevaptaki fonksiyonları koymalısın)
// Ben yer kaplamasın diye tekrar yazmıyorum, sen önceki halini koru.
// Sadece getRuyaData ve generateMetadata fonksiyonları kalsın.

export const revalidate = 3600; // Sayfayı önbelleğe al

// --- ÖNEMLİ: Bu fonksiyonu silme, yukarıda tanımlı varsayıyorum ---
async function getRuyaData(slug: string) {
  const { data } = await supabase
    .from('ruyalar')
    .select('*')
    .eq('slug', slug)
    .single();
  
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const data = await getRuyaData(slug);
    if (!data) return { title: 'Rüya Bulunamadı' };
    return {
      title: `${data.title} | Tabiristan`,
      description: data.metaDescription,
      alternates: { canonical: `https://tabiristan.com/ruya/${slug}` },
    };
  }
// ------------------------------------------------------------------


export default async function RuyaDetail({ params }: Props) {
  const { slug } = await params;
  const data = await getRuyaData(slug);
  
  // YENİ: Benzer rüyaları çekiyoruz
  const allRuyalar = await getAllRuyalar();
  const relatedRuyalar = getRandomRuyalar(allRuyalar, slug, 6); // 6 tane rastgele

  if (!data) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b py-4 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 text-sm text-gray-500">
          <Link href="/" className="hover:text-blue-600 font-medium">Ana Sayfa</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">Rüya Tabirleri</span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* SOL KOLON: Ana Makale (2 birim genişlik) */}
        <article className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 md:p-10 border border-gray-100 h-fit">
          <header className="mb-8 border-b pb-6">
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 leading-tight">
              {data.title}
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              {data.metaDescription}
            </p>
          </header>

          <div 
            className="prose prose-lg prose-slate max-w-none 
            prose-headings:font-bold prose-headings:text-gray-900 
            prose-p:text-gray-700 prose-a:text-blue-600 hover:prose-a:text-blue-800"
            dangerouslySetInnerHTML={{ __html: data.content }}
          />

          {/* AdSense Alanı */}
          <div className="mt-12 p-6 bg-gray-50 rounded-lg border border-gray-200 text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Reklam</p>
            <div className="h-32 bg-gray-200 rounded w-full flex items-center justify-center text-gray-400">
              Google AdSense Gelecek
            </div>
          </div>
        </article>

        {/* SAĞ KOLON: Sidebar & Bunları da Gördünüz mü? (1 birim genişlik) */}
        <aside className="lg:col-span-1 space-y-6">
          
          {/* Benzer Rüyalar Kartı */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 sticky top-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4 border-l-4 border-blue-500 pl-3">
              Bunları da Gördünüz mü?
            </h3>
            <ul className="space-y-3">
              {relatedRuyalar.map((ruya: any) => (
                <li key={ruya.slug}>
                  <Link 
                    href={`/ruya/${ruya.slug}`}
                    className="block p-3 rounded-lg hover:bg-blue-50 transition-colors text-gray-700 hover:text-blue-700 text-sm font-medium border border-transparent hover:border-blue-100"
                  >
                    {ruya.keyword}
                  </Link>
                </li>
              ))}
            </ul>
             <div className="mt-6 pt-6 border-t text-center">
                <Link href="/" className="text-blue-600 hover:underline text-sm font-semibold">
                    Tüm Rüyaları Gör →
                </Link>
             </div>
          </div>

        </aside>

      </main>
    </div>
  );
}