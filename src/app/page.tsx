import { supabase } from '@/lib/supabase';
import SearchableDreamList from '../components/SearchableDreamList';
import AlphabetNav from '../components/AlphabetNav';

export const revalidate = 3600; 

export default async function Home() {
  // Son 100 rüyayı çekiyoruz
  const { data: ruyalar } = await supabase
    .from('ruyalar')
    .select('slug, keyword')
    .eq('is_published', true)
    .order('created_at', { ascending: false }) 
    .limit(99);

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Hero Bölümü */}
      <section className="bg-gradient-to-r from-blue-700 to-blue-900 text-white pt-20 pb-24 px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">
          Tabiristan
        </h1>
        <p className="text-xl md:text-2xl text-blue-100 max-w-2xl mx-auto font-light">
          Rüyalarınızın gizli dilini çözün.
        </p>
      </section>

      <main className="max-w-6xl mx-auto px-4 py-12 -mt-16 relative z-10">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 md:p-10 shadow-xl border border-white/20">
            
            {/* 1. ÖNCE HARF FİLTRESİ (Minimal Haliyle) */}
            <div className="mb-8 text-center">
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-3 font-semibold">
                    Alfabetik İndeks
                </p>
                <AlphabetNav />
            </div>

            <hr className="border-gray-100 mb-8" />
            
            {/* 2. SONRA ARAMA VE LİSTE */}
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              Son Eklenen Rüyalar
            </h2>
            
            <SearchableDreamList initialRuyalar={ruyalar || []} />

        </div>
      </main>

  
    </div>
  );
}