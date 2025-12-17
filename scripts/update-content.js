require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// AYARLAR
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Anahtarları Çek
const keysString = process.env.GOOGLE_KEYS || "";
const API_KEYS = keysString.split(',').map(k => k.trim()).filter(k => k.length > 0);

if (API_KEYS.length === 0) {
    console.error("❌ HATA: .env.local dosyasında GOOGLE_KEYS bulunamadı!");
    process.exit(1);
}

let currentKeyIndex = 0;

function getGenAI() {
    const key = API_KEYS[currentKeyIndex];
    // Hangi hesabın çalıştığını görmek için log (isteğe bağlı açabilirsin)
    // console.log(`🔑 Hesap: ${currentKeyIndex + 1}/${API_KEYS.length}`);
    return new GoogleGenerativeAI(key);
}

function rotateKey() {
    currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
    console.log(`🔄 Kota Doldu! Sıradaki hesaba geçiliyor -> Hesap ${currentKeyIndex + 1}`);
}

// ZENGİN İÇERİK PROMPTU (%100 Türkçe)
const RICH_PROMPT_TEMPLATE = (keyword) => `
Sen deneyimli bir rüya tabircisi ve Türkçe dil uzmanısın. Konumuz: "${keyword}".

Bana aşağıdaki JSON formatında bir çıktı ver.
Makale SEO uyumlu, zengin ve en az 400-500 kelime olsun.

*** DİL KURALLARI ***
1. %100 Akıcı İstanbul Türkçesi kullan.
2. ASLA İngilizce kelime kullanma. "Literal", "Necessary" gibi kelimeler YASAK.
3. "Yarım gece" deme, "Gece yarısı" de. Deyimleri doğru kullan.
4. Samimi ama bilgi verici bir ton kullan. Okuyucuya "Sen" diye hitap et.

İstenen JSON Formatı:
{
    "title": "İlgi çekici başlık (İçinde '${keyword}' geçsin)",
    "metaDescription": "150 karakteri geçmeyen merak uyandırıcı açıklama.",
    "content": "
      <p>Giriş paragrafı...</p>
      <h2>Rüyada ${keyword} Görmek Ne Anlama Gelir?</h2>
      <p>Genel tabir...</p>
      <h2>Dini ve İslami Yorum</h2>
      <p>İslami kaynaklara göre yorum...</p>
      <h2>Psikolojik Yorum</h2>
      <p>Bilinçaltı analizi...</p>
      <h2>Farklı Durumlar</h2>
      <ul><li>...</li></ul>
      <h2>Sıkça Sorulan Sorular</h2>
      <div class='faq-section'>...</div>
      <h3>Sonuç</h3>
      <p>Kapanış...</p>
    "
}
`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function updateExistingContent() {
    // Listede bulduğumuz modelin TAM ADI:
    const MODEL_NAME = "gemini-2.5-flash-lite";
    
    console.log(`🚀 İçerik Üretimi Başlıyor (Model: ${MODEL_NAME})...`);
    console.log(`ℹ️ Kapasite: ${API_KEYS.length} adet Google Hesabı devrede.`);

    // 1. İşlenecek rüyaları çek
    const { data: ruyalar, error } = await supabase
        .from('ruyalar')
        .select('id, keyword')
        .eq('is_published', true)
        .eq('is_upgraded', false)
        .limit(50); 

    if (error) { console.error("Veri çekme hatası:", error); return; }
    
    if (!ruyalar || ruyalar.length === 0) {
        console.log("🎉 İşlem Tamam! Güncellenecek rüya kalmadı.");
        return;
    }

    for (const ruya of ruyalar) {
        try {
            const genAI = getGenAI();
            const model = genAI.getGenerativeModel({ model: MODEL_NAME });

            console.log(`✍️ [Gemini Lite]: "${ruya.keyword}"...`);

            const result = await model.generateContent(RICH_PROMPT_TEMPLATE(ruya.keyword));
            const response = await result.response;
            let text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
            const jsonContent = JSON.parse(text);

            // Veritabanını GÜNCELLE
            const { error: updateError } = await supabase
                .from('ruyalar')
                .update({
                    title: jsonContent.title,
                    meta_description: jsonContent.metaDescription,
                    content: jsonContent.content,
                    is_upgraded: true
                })
                .eq('id', ruya.id);

            if (updateError) throw updateError;

            console.log(`✅ [OK]: ${ruya.keyword}`);
            await sleep(1500); // Lite hızlıdır ama 1.5 sn ideal

        } catch (err) {
            console.error(`❌ HATA (${ruya.keyword}):`, err.message);
            
            // Eğer Kota (429) hatası alırsan
            if (err.message.includes('429') || err.message.includes('quota') || err.message.includes('exhausted')) {
                console.log("⚠️ Bu hesabın limiti doldu. Diğerine geçiliyor...");
                rotateKey();
            } else {
                // Başka bir hata (örn: Sunucu yoğunluğu 503)
                console.log("⚠️ Beklenmedik hata, 3 saniye bekleniyor...");
            }
            
            await sleep(3000);
        }
    }
}

updateExistingContent();