import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12 border-t border-gray-800 mt-auto">
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
        
        {/* Marka */}
        <div>
          <h3 className="text-white text-lg font-bold mb-4">Tabiristan</h3>
          <p className="text-sm text-gray-500">
            Türkiye'nin en kapsamlı ve güvenilir rüya tabirleri ansiklopedisi.
          </p>
        </div>

        {/* Hızlı Linkler */}
        <div>
          <h3 className="text-white text-lg font-bold mb-4">Hızlı Erişim</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/" className="hover:text-white transition-colors">Ana Sayfa</Link></li>
            <li><Link href="/hakkimizda" className="hover:text-white transition-colors">Hakkımızda</Link></li>
            <li><Link href="/iletisim" className="hover:text-white transition-colors">İletişim</Link></li>
          </ul>
        </div>

        {/* Yasal */}
        <div>
          <h3 className="text-white text-lg font-bold mb-4">Yasal</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/gizlilik-politikasi" className="hover:text-white transition-colors">Gizlilik Politikası</Link></li>
            <li><Link href="/kullanim-sartlari" className="hover:text-white transition-colors">Kullanım Şartları</Link></li>          </ul>
        </div>
      </div>

      <div className="text-center text-xs text-gray-600 mt-12 pt-8 border-t border-gray-800">
        &copy; {new Date().getFullYear()} Tabiristan.com - Tüm Hakları Saklıdır.
      </div>
    </footer>
  );
}