import fs from 'fs';
import path from 'path';
import { supabase } from '@/lib/supabase'; // Lib klasörünü oluşturmuştuk
import SearchableDreamList from '../components/SearchableDreamList'; // Bileşeni import ettik
import AlphabetNav from '../components/AlphabetNav';



// Rüya Listesini Okuyan Fonksiyon (Server tarafında çalışır)
async function getRuyaList() {
  const filePath = path.join(process.cwd(), 'src/data/ruyalar.json');
  if (!fs.existsSync(filePath)) return [];
  const fileContents = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(fileContents);
}

// Cache'i 1 saat tut (ISR) - Veritabanına her saniye gitmesin
export const revalidate = 3600;


export default async function Home() {
  // Sadece gerekli alanları çekiyoruz (Hız için)
  const { data: ruyalar } = await supabase
    .from('ruyalar')
    .select('slug, keyword')
    .eq('is_published', true) // Sadece içeriği hazır olanları göster
    .order('keyword', { ascending: true });

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Hero (Karşılama) Bölümü */}
      <section className="bg-gradient-to-r from-blue-700 to-blue-900 text-white py-24 px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">
          Tabiristan
        </h1>
        <p className="text-xl md:text-2xl text-blue-100 max-w-2xl mx-auto font-light">
          Rüyalarınızın gizli dilini çözün. Yapay zeka destekli, en kapsamlı rüya ansiklopedisi.
        </p>
      </section>

      {/* Arama ve Liste Alanı */}
      <main className="max-w-6xl mx-auto px-4 py-12 -mt-10 relative z-10">
        <div className="bg-white/50 backdrop-blur-sm rounded-3xl p-6 md:p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              Rüya Rehberi
            </h2>
            
            {/* İstemci Bileşenini (Client Component) buraya koyuyoruz */}
            {/* Veriyi prop olarak gönderiyoruz */}
            <SearchableDreamList initialRuyalar={ruyalar || []} />
        </div>
      </main>

      {/* YENİ EKLENEN KISIM: A-Z İNDEKSİ */}
      <section className="bg-gray-50 pb-12">
        <AlphabetNav />
      </section>

      <footer className="bg-gray-800 text-gray-400 py-12 text-center mt-12 border-t border-gray-700">
        <p>© {new Date().getFullYear()} Tabiristan.com</p>
        <p className="text-sm mt-2 text-gray-500">Rüyalarınızın rehberi.</p>
      </footer>
    </div>
  );
}