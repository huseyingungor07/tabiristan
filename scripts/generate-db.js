require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// AYARLAR
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Keyleri virgülle ayırıp array yapıyoruz
const API_KEYS = process.env.GOOGLE_KEYS.split(',');
let currentKeyIndex = 0;

function getGenAI() {
    const key = API_KEYS[currentKeyIndex];
    console.log(`🔑 Kullanılan Anahtar: ...${key.slice(-4)} (Index: ${currentKeyIndex})`);
    return new GoogleGenerativeAI(key);
}

// Key patlarsa diğerine geç
function rotateKey() {
    currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
    console.log(`🔄 Anahtar değiştiriliyor -> Yeni Index: ${currentKeyIndex}`);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function generate() {
    console.log("Veritabanından işlenmemiş rüyalar çekiliyor...");

    // Sadece içeriği olmayan (null) rüyaları çek
    const { data: ruyalar, error } = await supabase
        .from('ruyalar')
        .select('*')
        .is('content', null) // İçeriği henüz olmayanlar
        .limit(500); // Tek seferde 500 tane işlemeye çalış

    if (error) { console.error(error); return; }
    console.log(`${ruyalar.length} adet boş rüya bulundu.`);

    for (const ruya of ruyalar) {
        try {
            const genAI = getGenAI();
            
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

            const prompt = `
            Sen uzman bir rüya tabircisi ve SEO uzmanısın. Konumuz: "${ruya.keyword}".
            
            Bana aşağıdaki JSON formatında bir çıktı ver. Sadece JSON ver, markdown blokları koyma.
            
            İstenen JSON Formatı:
            {
                "title": "İlgi çekici, tıklanabilir bir başlık (İçinde '${ruya.keyword}' geçsin)",
                "metaDescription": "150 karakteri geçmeyen, merak uyandıran meta açıklaması.",
                "content": "Buraya makalenin HTML içeriği gelecek (body tagleri olmadan). H2 ve H3 etiketleri kullan. Paragraflar <p> etiketiyle olsun. İçerikte şunlara değin: 1. Genel anlamı. 2. İslami/Dini yorumu (İbn-i Sirin tarzı). 3. Psikolojik yorumu. 4. Farklı durumlara göre anlamı (Örn: Rüyada büyük ${ruya.keyword} görmek vs.). Dil akıcı ve samimi olsun."
            }
            `;

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
            await sleep(2000); // Rate limit koruması

        } catch (err) {
            console.error(`❌ HATA (${ruya.keyword}):`, err.message);
            if (err.message.includes('429') || err.message.includes('quota')) {
                console.log("⚠️ Kota doldu, anahtar değiştiriliyor...");
                rotateKey();
            }
            await sleep(5000);
        }
    }
}

generate();