import Link from 'next/link';

const ALFABE = "ABCÇDEFGHIİJKLMNOÖPRSŞTUÜVYZ".split("");

export default function AlphabetNav() {
  return (
    <div className="w-full overflow-x-auto pb-2"> {/* Mobilde taşarsa kaydırılsın */}
      <div className="flex flex-wrap justify-center gap-2">
        {ALFABE.map((harf) => (
          <Link
            key={harf}
            href={`/harf/${harf.toLocaleLowerCase('tr-TR')}`}
            className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 
                       bg-white text-gray-600 text-xs font-bold
                       hover:bg-blue-600 hover:text-white hover:border-blue-600 
                       transition-all shadow-sm"
          >
            {harf}
          </Link>
        ))}
      </div>
    </div>
  );
}