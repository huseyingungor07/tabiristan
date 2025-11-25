import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kullanım Şartları | Tabiristan',
  robots: { index: false },
};

export default function TermsPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Kullanım Şartları</h1>
      
      <div className="prose prose-sm prose-slate max-w-none text-gray-600">
        <p>Son Güncelleme: {new Date().toLocaleDateString('tr-TR')}</p>
        
        <h3>1. Kabul</h3>
        <p>Tabiristan.com web sitesini ziyaret ederek bu kullanım şartlarını kabul etmiş sayılırsınız.</p>

        <h3>2. İçerik Kullanımı</h3>
        <p>Sitedeki rüya tabirleri ve içerikler sadece bilgilendirme ve eğlence amaçlıdır. Kesin yargı veya tıbbi tavsiye niteliği taşımaz. İçeriklerimiz izinsiz kopyalanamaz.</p>

        <h3>3. Sorumluluk Reddi</h3>
        <p>Tabiristan.com, sitedeki bilgilerin doğruluğu veya bu bilgilerin kullanımından doğacak sonuçlar konusunda garanti vermez. Rüyaların yorumlanması kişiseldir.</p>

        <h3>4. Değişiklikler</h3>
        <p>Site yönetimi, dilediği zaman bu şartları değiştirme hakkını saklı tutar.</p>
      </div>
    </main>
  );
}