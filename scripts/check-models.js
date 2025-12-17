require('dotenv').config({ path: '.env.local' });

// .env'den ilk anahtarı alalım
const keysString = process.env.GOOGLE_KEYS || "";
const API_KEY = keysString.split(',')[0].trim(); // İlk anahtarı kullanır

if (!API_KEY) {
    console.error("❌ HATA: API anahtarı bulunamadı!");
    process.exit(1);
}

async function listMyModels() {
    console.log("🔍 Google Hesabındaki Modeller Taranıyor...");
    console.log(`🔑 Denenen Anahtar: ...${API_KEY.slice(-4)}`);

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            console.error("❌ API HATASI:", data.error.message);
            return;
        }

        if (!data.models) {
            console.log("⚠️ Hiçbir model bulunamadı.");
            return;
        }

        console.log("\n✅ SENİN HESABINDA AKTİF OLAN MODELLER:");
        console.log("=========================================");
        
        // Sadece içerik üretebilenleri (generateContent) filtrele
        const usableModels = data.models.filter(m => 
            m.supportedGenerationMethods && 
            m.supportedGenerationMethods.includes("generateContent")
        );

        usableModels.forEach(m => {
            console.log(`📌 Model Adı: ${m.name}`); // Bunu kopyalamamız gerekecek
            console.log(`   Görünen Ad: ${m.displayName}`);
            console.log(`   Açıklama: ${m.description.slice(0, 60)}...`);
            console.log("-----------------------------------------");
        });

        console.log(`\n💡 TOPLAM: ${usableModels.length} adet kullanılabilir model bulundu.`);

    } catch (error) {
        console.error("KRİTİK HATA:", error.message);
    }
}

listMyModels();