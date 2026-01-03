import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gizlilik Politikası | Tabiristan',
  robots: { index: false }, // Google bu sayfayı indekslemesin, gereksiza
};

export default function PrivacyPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Gizlilik Politikası</h1>
      
      <div className="prose prose-sm prose-slate max-w-none text-gray-600">
        <p>Son Güncelleme: {new Date().toLocaleDateString('tr-TR')}</p>
        
        <h3>1. Giriş</h3>
        <p>Tabiristan.com ("Web Sitesi") olarak gizliliğinize önem veriyoruz. Bu Gizlilik Politikası, web sitemizi ziyaret ettiğinizde bilgilerinizin nasıl toplandığını, kullanıldığını ve korunduğunu açıklar.</p>

        <h3>2. Toplanan Bilgiler</h3>
        <p>Sitemizi ziyaret ettiğinizde, IP adresi, tarayıcı türü, ziyaret süreleri gibi kişisel olmayan veriler otomatik olarak toplanabilir. Bu veriler site performansını artırmak için kullanılır.</p>

        <h3>3. Çerezler (Cookies) ve Google AdSense</h3>
        <p>Web sitemiz, kullanıcı deneyimini geliştirmek ve reklam hizmetleri sunmak için çerezleri kullanır.</p>
        <ul>
            <li><strong>Google AdSense:</strong> Sitemizde reklam yayınlamak için Google AdSense kullanmaktayız. Google, reklamları kullanıcılara sunmak için çerezleri (DoubleClick çerezi dahil) kullanır.</li>
            <li>Google ve iş ortakları, kullanıcıların sitemize veya internetteki diğer sitelere yaptıkları ziyaretlere dayalı olarak reklam sunabilir.</li>
            <li>Kullanıcılar, <a href="https://myadcenter.google.com/" target="_blank" rel="nofollow" className="text-blue-600 underline">Google Reklam Ayarları</a> sayfasını ziyareterek kişiselleştirilmiş reklamcılığı devre dışı bırakabilirler.</li>
        </ul>

        <h3>4. Dış Bağlantılar</h3>
        <p>Sitemiz, diğer web sitelerine bağlantılar içerebilir. Bu sitelerin gizlilik uygulamalarından Tabiristan.com sorumlu değildir.</p>

        <h3>5. İletişim</h3>
        <p>Bu politika hakkında sorularınız varsa, bizimle <a href="/iletisim" className="text-blue-600 underline">iletişim</a> sayfasından irtibata geçebilirsiniz.</p>
      </div>
    </main>
  );
}