import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'İletişim | Tabiristan',
  description: 'Bizimle iletişime geçin.',
};

export default function ContactPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-20 text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-6">İletişim</h1>
      <p className="text-lg text-gray-600 mb-10">
        Önerileriniz, reklam talepleriniz veya hata bildirimleriniz için bize her zaman ulaşabilirsiniz.
      </p>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <p className="text-gray-500 mb-4">E-posta Adresimiz:</p>
        <a 
          href="mailto:iletisim@tabiristan.com" 
          className="text-2xl md:text-3xl font-bold text-blue-600 hover:text-blue-800 transition-colors"
        >
            iletisim@tabiristan.com
        </a>
        <p className="text-sm text-gray-400 mt-6">
          Genellikle 24 saat içinde dönüş yapıyoruz.
        </p>
      </div>
    </main>
  );
}