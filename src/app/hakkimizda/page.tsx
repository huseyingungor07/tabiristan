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
          Rüyalar, insanlık tarihi boyunca merak konusu olmuştur. Bizim amacımız, İslami kaynaklardan (İbn-i Sirin, Nablusi gibi alimlerin yorumları) ve modern psikolojiden (Carl Jung, Freud yaklaşıımları) harmanladığımız bilgileri, en anlaşılır ve erişilebilir şekilde sizlere sunmaktır.
        </p>

        <h3>Teknoloji ve Güven</h3>
        <p>
          Veritabanımızda binlerce rüya sembolü bulunmaktadır. İçeriklerimiz, editörlerimiz ve gelişmiş yapay zeka teknolojileri tarafından titizlikle hazırlanmakta, sürekli güncellenmekte ve zenginleştirilmektedir.
        </p>

        <p>
          Bize güvendiğiniz ve rüyalarınızı bizimle keşfettiğiniz için teşekkür ederiz.
        </p>
      </div>
    </main>
  );
}