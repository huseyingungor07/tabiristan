// scripts/generate.js
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Ayarlar
const DATA_FILE = path.join(__dirname, '../src/data/ruyalar.json');
const OUTPUT_DIR = path.join(__dirname, '../src/content');
const API_KEY = process.env.GEMINI_API_KEY;

// Klasör yoksa oluştur
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Gemini Başlat
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Bekleme Fonksiyonu (Rate Limit yememek için)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function generateContent() {
    const ruyalar = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    
    console.log(`Toplam ${ruyalar.length} rüya işlenecek...`);

    for (const [index, ruya] of ruyalar.entries()) {
        const filePath = path.join(OUTPUT_DIR, `${ruya.slug}.json`);

        // Eğer dosya zaten varsa atla (Maliyet ve zaman tasarrufu)
        if (fs.existsSync(filePath)) {
            console.log(`[ATLANDI] ${ruya.keyword} zaten var.`);
            continue;
        }

        console.log(`[İŞLENİYOR] (${index + 1}/${ruyalar.length}): ${ruya.keyword}...`);

        try {
            // PROMPT MÜHENDİSLİĞİ (En kritik kısım burası)
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
            let text = response.text();

            // Gemini bazen JSON'ı ```json ... ``` içine alır, onu temizleyelim
            text = text.replace(/```json/g, '').replace(/```/g, '').trim();

            // Dosyayı kaydet
            fs.writeFileSync(filePath, text);
            
            console.log(`[BAŞARILI] ${ruya.keyword} kaydedildi.`);

            // API Limitine takılmamak için 4 saniye bekle (Gemini Free Tier limiti dakikada 15 request)
            await sleep(4000); 

        } catch (error) {
            console.error(`[HATA] ${ruya.keyword} oluşturulamadı:`, error.message);
            // Hata olsa bile döngüyü kırma, sonrakine geç
            await sleep(10000); // Hatadan sonra biraz daha uzun bekle
        }
    }
}

generateContent();