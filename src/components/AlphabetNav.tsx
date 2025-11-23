import Link from 'next/link';

const ALFABE = "ABCÇDEFGHIİJKLMNOÖPRSŞTUÜVYZ".split("");

export default function AlphabetNav() {
  return (
    <div className="w-full bg-white border-y border-gray-200 py-8 my-12">
      <div className="max-w-6xl mx-auto px-4">
        <h3 className="text-center text-gray-500 text-sm font-semibold uppercase tracking-wider mb-6">
          Rüya İndeksi (A'dan Z'ye)
        </h3>
        
        <div className="flex flex-wrap justify-center gap-3">
          {ALFABE.map((harf) => (
            <Link
              key={harf}
              href={`/harf/${harf.toLowerCase()}`}
              className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 
                         text-gray-600 hover:text-white hover:bg-blue-600 hover:border-blue-600 
                         font-bold transition-all shadow-sm hover:shadow-md"
            >
              {harf}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}