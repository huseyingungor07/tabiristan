require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// AYARLAR
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// GÜVENLİ ANAHTAR YÖNETİMİ
let keysString = process.env.GOOGLE_KEYS;
if (!keysString) keysString = process.env.GEMINI_API_KEY;
if (!keysString) { console.error("HATA: API Anahtarı bulunamadı!"); process.exit(1); }
const API_KEYS = keysString.split(',').map(key => key.trim());

// DÜZELTME: "Ğ" harfini alfabeden çıkardık
const ALFABE = "ABCÇDEFGHIİJKLMNOÖPRSŞTUÜVYZ".split(""); 

// Rastgele bir key seçerek başlat
const genAI = new GoogleGenerativeAI(API_KEYS[Math.floor(Math.random() * API_KEYS.length)]);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

function slugify(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-') 
        .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
        .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

async function expandList() {
    console.log("🚀 İmparatorluk genişletiliyor (Doğrudan Veritabanına)...");

    for (const harf of ALFABE) {
        console.log(`\n[${harf}] harfi taranıyor...`);

        try {
            const prompt = `
            Bana rüya tabirleri sitem için '${harf}' harfi ile başlayan, Türkiye'de insanların en çok arattığı en popüler 30 rüyayı listele.
            
            ÖNEMLİ: Sadece JSON Array ver. Asla "Ğ" ile başlayan uydurma kelime yazma.
            Format:
            [
                "Rüyada [rüya konusu] görmek",
                "Rüyada [rüya konusu] yapmak"
            ]
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            let text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
            
            const yeniKelimeler = JSON.parse(text);
            let eklenenSayisi = 0;

            for (const keyword of yeniKelimeler) {
                // Ekstra Güvenlik: Eğer hala Ğ ile başlayan gelirse atla
                if (keyword.toLowerCase().startsWith("rüyada ğ")) {
                    console.log(`   ⚠️ Uydurma veri engellendi: ${keyword}`);
                    continue;
                }

                const slug = slugify(keyword);

                // Veritabanına "Sadece yoksa ekle" (ON CONFLICT DO NOTHING)
                const { error } = await supabase
                    .from('ruyalar')
                    .upsert({ 
                        slug: slug, 
                        keyword: keyword,
                        // created_at ve is_published varsayılan değerlerini alır
                    }, { onConflict: 'slug', ignoreDuplicates: true });

                if (!error) {
                    // Supabase bize 'ignoreDuplicates' durumunda kaç satır eklendiğini doğrudan söylemez
                    // ama hata yoksa denedik demektir.
                    eklenenSayisi++; 
                }
            }

            console.log(`   + ${eklenenSayisi} aday rüya veritabanına gönderildi.`);
            
            // Nezaket beklemesi
            await new Promise(r => setTimeout(r, 2000));

        } catch (error) {
            console.error(`   [HATA] ${harf} işlenirken sorun:`, error.message);
        }
    }

    console.log(`\n=== TARAMA TAMAMLANDI ===`);
}

expandList();