import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hakkımızda | Tabiristan',
  description: 'Tabiristan projesi ve misyonumuz hakkında bilgi edinin.',
};

export default function AboutPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Hakkımızda</h1>
      
      <div className="prose prose-lg prose-slate text-gray-700">
        <p>
          Hoş geldiniz! <strong>Tabiristan.com</strong>, rüyaların gizemli dünyasını aydınlatmak, bilinçaltınızın mesajlarını çözmek ve hem geleneksel hem de modern yorumları bir araya getirmek amacıyla kurulmuş kapsamlı bir rüya tabirleri platformudur.
        </p>
        
        <h3>Misyonumuz</h3>
        <p>
          Rüyalar, insanlık tarihi boyunca merak konusu olmuştur. Bizim amacımız, İslami kaynaklardan ve modern psikolojiden harmanladığımız bilgileri, en anlaşılır ve erişilebilir şekilde sizlere sunmaktır.
        </p>

        <h3>Teknoloji ve Güven</h3>
        <p>
          Veritabanımızda binlerce rüya sembolü bulunmaktadır. Veritabanımızda binlerce rüya sembolü bulunmaktadır. İçeriklerimiz; İslami kaynaklar ve modern psikoloji literatürü taranarak, uzman editör ekibimiz tarafından titizlikle derlenmekte ve dijital teknolojiler yardımıyla zenginleştirilerek sizlere sunulmaktadır.
        </p>

        <p>
          Bize güvendiğiniz ve rüyalarınızı bizimle keşfettiğiniz için teşekkür ederiz.
        </p>
      </div>
    </main>
  );
}