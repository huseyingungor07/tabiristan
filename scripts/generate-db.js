require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// AYARLAR
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// .env dosyasından anahtarları çekip listeye çeviriyoruz
// Hata almamak için kontrol ekledik
const keysString = process.env.GOOGLE_KEYS || "";
const API_KEYS = keysString.split(',').map(k => k.trim()).filter(k => k.length > 0);

if (API_KEYS.length === 0) {
    console.error("❌ HATA: .env.local dosyasında GOOGLE_KEYS bulunamadı!");
    process.exit(1);
}

let currentKeyIndex = 0;

// Şu anki anahtarla AI motorunu başlatan fonksiyon
function getGenAI() {
    const key = API_KEYS[currentKeyIndex];
    // Güvenlik için anahtarın sadece son 4 hanesini gösteriyoruz
    console.log(`🔑 [Aktif Anahtar] ...${key.slice(-4)} (Hesap ${currentKeyIndex + 1}/${API_KEYS.length})`);
    return new GoogleGenerativeAI(key);
}

// Anahtar patladığında diğerine geçen fonksiyon
function rotateKey() {
    currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
    console.log(`🔄 Kota Doldu! Sıradaki anahtara geçiliyor -> Hesap ${currentKeyIndex + 1}`);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function generate() {
    console.log(`🚀 Gemini Üretim Motoru Başlatılıyor... (${API_KEYS.length} adet anahtar yüklendi)`);

    // Sadece içeriği olmayan (null) rüyaları çek
    const { data: ruyalar, error } = await supabase
        .from('ruyalar')
        .select('*')
        .is('content', null)
        .limit(100); // 5 hesap x 20 limit = 100 işlem kapasitesi

    if (error) { console.error(error); return; }
    
    if (!ruyalar || ruyalar.length === 0) {
        console.log("🎉 İşlenecek boş rüya kalmadı.");
        return;
    }

    console.log(`${ruyalar.length} adet boş rüya işlenecek.`);

    // Döngü Başlıyor
    for (const ruya of ruyalar) {
        try {
            const genAI = getGenAI();
            
            // NOT: Google'ın en stabil modeli "gemini-1.5-flash"tır. 
            // "2.5" henüz API'de kararlı olmayabilir, hata alırsan burayı "gemini-1.5-flash" yap.
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

            const prompt = `
            Sen uzman bir rüya tabircisi, psikolog ve SEO uzmanısın. Konumuz: "${ruya.keyword}".

            Bana aşağıdaki JSON formatında bir çıktı ver.
            LÜTFEN MAKALEYİ DETAYLI VE UZUN TUT (En az 600 kelime).

            İstenen JSON Formatı:
            {
                "title": "İlgi çekici başlık (İçinde '${ruya.keyword}' geçsin)",
                "metaDescription": "150 karakteri geçmeyen merak uyandırıcı açıklama.",
                "content": "
                <p>Giriş paragrafı: Okuyucuyu yakalayan, gizemli bir giriş.</p>
                
                <h2>${ruya.keyword} Görmenin Genel Anlamı</h2>
                <p>Detaylı genel açıklama...</p>
                
                <h2>Dini ve İslami Yorum (İbn-i Sirin ve Alimler)</h2>
                <p>İslami kaynaklara göre yorumlar...</p>
                
                <h2>Psikolojik Olarak Ne Anlama Gelir? (Freud/Jung)</h2>
                <p>Bilinçaltı analizi...</p>
                
                <h2>Farklı Durumlara Göre Yorumlar</h2>
                <ul>
                    <li><strong>Durum 1:</strong> Açıklama...</li>
                    <li><strong>Durum 2:</strong> Açıklama...</li>
                </ul>
                
                <h2>Sıkça Sorulan Sorular (SSS)</h2>
                <div class='faq-section'>
                    <h3>Bu rüya hayırlı mıdır?</h3>
                    <p>Cevap...</p>
                    <h3>Gerçek hayatta neye işaret eder?</h3>
                    <p>Cevap...</p>
                </div>
                
                <h3>Sonuç ve Tavsiye</h3>
                <p>Toparlayıcı kapanış.</p>
                "
            }
            `;

            console.log(`✍️ (Gemini) Yazılıyor: "${ruya.keyword}"...`);

            const result = await model.generateContent(prompt);
            const response = await result.response;
            let text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
            const jsonContent = JSON.parse(text);

            // Veritabanını Güncelle
            const { error: updateError } = await supabase
                .from('ruyalar')
                .update({
                    title: jsonContent.title,
                    meta_description: jsonContent.metaDescription,
                    content: jsonContent.content,
                    is_published: true
                })
                .eq('id', ruya.id);

            if (updateError) throw updateError;

            console.log(`✅ [DB] Kaydedildi: ${ruya.keyword}`);
            
            // Nezaket beklemesi (2 saniye)
            await sleep(2000); 

        } catch (err) {
            console.error(`❌ HATA (${ruya.keyword}):`, err.message);
            
            // Eğer Hata "Kota" veya "Rate Limit" ise
            if (err.message.includes('429') || err.message.includes('quota') || err.message.includes('Resource has been exhausted')) {
                console.log("⚠️ Bu anahtarın limiti bitti.");
                rotateKey(); // Diğer anahtara geç
                
                // Anahtar değiştirdikten sonra hemen tekrar denemek yerine
                // bu rüyayı atlayıp bir sonrakine geçeriz (Loop devam eder)
                // veya aynı rüyayı tekrar denemek için i-- yapılabilir ama
                // şimdilik atlamak daha güvenli, script bir sonraki çalışmada halleder.
            }
            
            // Hata sonrası biraz uzun bekle
            await sleep(5000);
        }
    }
}

generate();