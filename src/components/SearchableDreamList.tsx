"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Ruya = {
  slug: string;
  keyword: string;
};

export default function SearchableDreamList({ initialRuyalar }: { initialRuyalar: Ruya[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<Ruya[]>(initialRuyalar);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    // Arama kutusu boşsa ana sayfadaki limitli listeyi göster
    if (!searchTerm.trim()) {
      setResults(initialRuyalar);
      setIsSearching(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      
      // 1. TÜRKÇE VARYASYONLARI HAZIRLA
      // "ı" sorunu için hem küçüğünü hem büyüğünü ayrı ayrı aratacağız.
      const lower = searchTerm.toLocaleLowerCase('tr-TR'); // örn: rüyada ı
      const upper = searchTerm.toLocaleUpperCase('tr-TR'); // örn: RÜYADA I
      
      // 2. SORGUYU GÜÇLENDİR
      // .or() kullanarak: "Ya küçük haliyle eşleşenleri, Ya da büyük haliyle eşleşenleri getir" diyoruz.
      // Bu sayede veritabanı ayarı ne olursa olsun "I" ve "ı" kaçmaz.
      const { data, error } = await supabase
        .from('ruyalar')
        .select('slug, keyword')
        .eq('is_published', true)
        .or(`keyword.ilike.%${lower}%,keyword.ilike.%${upper}%`) // İkisini de dene
        .limit(1000); // <-- LİMİTİ ARTIRDIK (96 sorununu çözer)

      if (!error && data) {
        // 3. SON TEMİZLİK (JavaScript Filtresi)
        // Veritabanı yine de "i" ile "ı"yı karıştırmış olabilir (İngilizce mantığıyla).
        // Burada son bir kez Türkçe kurallarına göre süzgeçten geçiriyoruz.
        const turkishSearchTerm = searchTerm.toLocaleLowerCase('tr-TR');

        const filteredResults = data.filter(ruya => 
          ruya.keyword.toLocaleLowerCase('tr-TR').includes(turkishSearchTerm)
        );

        setResults(filteredResults);
      } else {
        console.error("Arama Hatası:", error);
      }
      
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, initialRuyalar]);

  return (
    <div className="w-full">
      {/* Arama Kutusu */}
      <div className="relative max-w-xl mx-auto mb-8">
        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
          {isSearching ? (
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          )}
        </div>
        <input
          type="text"
          className="block w-full p-4 pl-12 text-base text-gray-900 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white shadow-sm transition-all outline-none"
          placeholder="Rüyanızda ne gördünüz? (Örn: Yılan, Ağaç...)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Sonuç Listesi */}
      {results.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((ruya) => (
            <Link
              key={ruya.slug}
              href={`/ruya/${ruya.slug}`}
              className="group bg-white p-4 rounded-xl shadow-sm hover:shadow-md border border-gray-100 transition-all hover:border-blue-300 flex items-center justify-between"
            >
              <span className="font-medium text-gray-700 group-hover:text-blue-700 transition-colors line-clamp-1">
                {ruya.keyword}
              </span>
              <span className="text-gray-300 group-hover:text-blue-500">→</span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <p className="text-gray-500">"{searchTerm}" ile ilgili bir rüya bulunamadı.</p>
          <p className="text-sm text-gray-400 mt-1">Farklı bir kelime deneyebilir veya yukarıdaki harf indeksini kullanabilirsiniz.</p>
        </div>
      )}
    </div>
  );
}