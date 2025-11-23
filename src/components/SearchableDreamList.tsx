"use client"; // Bu satır zorunlu! Çünkü kullanıcı etkileşimi (yazma) var.

import { useState } from 'react';
import Link from 'next/link';

type Ruya = {
  id?: number;
  slug: string;
  keyword: string;
};

export default function SearchableDreamList({ initialRuyalar }: { initialRuyalar: Ruya[] }) {
  const [searchTerm, setSearchTerm] = useState("");

  // Arama terimine göre filtreleme yapıyoruz
  // Türkçe karakter duyarlılığı için localeCompare veya basit lowercase kullanabiliriz
  const filteredRuyalar = initialRuyalar.filter((ruya) =>
    ruya.keyword.toLocaleLowerCase('tr-TR').includes(searchTerm.toLocaleLowerCase('tr-TR'))
  );

  return (
    <div className="w-full">
      {/* Arama Kutusu */}
      <div className="relative max-w-xl mx-auto mb-10">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>
        <input
          type="text"
          className="block w-full p-4 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all"
          placeholder="Rüyanızda ne gördünüz? (Örn: Elma, Yılan...)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Sonuç Listesi */}
      {filteredRuyalar.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRuyalar.map((ruya) => (
            <Link
              key={ruya.slug}
              href={`/ruya/${ruya.slug}`}
              className="group bg-white p-5 rounded-lg shadow-sm hover:shadow-md border border-gray-100 transition-all hover:border-blue-300 flex items-center justify-between"
            >
              <span className="font-medium text-gray-700 group-hover:text-blue-700 transition-colors">
                {ruya.keyword}
              </span>
              <span className="text-gray-400 group-hover:text-blue-500">→</span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 text-gray-500">
          <p>Aradığınız rüya bulunamadı. Başka bir kelime deneyin.</p>
        </div>
      )}
    </div>
  );
}