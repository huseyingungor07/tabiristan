// scripts/fetch-keywords.js
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Ayarlar
const DATA_FILE = path.join(__dirname, '../src/data/ruyalar.json');
const API_KEY = process.env.GEMINI_API_KEY;
const ALFABE = "ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ".split(""); // Türk Alfabesi

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Yardımcı: Türkçe Slug Yapıcı
function slugify(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Boşlukları tire yap
        .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
        .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
        .replace(/[^\w\-]+/g, '')       // Alfanümerik olmayanları sil
        .replace(/\-\-+/g, '-')         // Çift tireleri tek yap
        .replace(/^-+/, '')             // Baştaki tireyi sil
        .replace(/-+$/, '');            // Sondaki tireyi sil
}

async function expandList() {
    // Mevcut listeyi oku
    let ruyalar = [];
    if (fs.existsSync(DATA_FILE)) {
        ruyalar = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
    
    console.log(`Mevcut rüya sayısı: ${ruyalar.length}`);
    console.log("İmparatorluk genişletiliyor...");

    for (const harf of ALFABE) {
        console.log(`\n[${harf}] harfi taranıyor...`);

        try {
            const prompt = `
            Bana rüya tabirleri sitem için '${harf}' harfi ile başlayan, Türkiye'de insanların en çok arattığı en popüler 300 rüyayı listele.
            
            Sadece şu formatta saf bir JSON Array ver (Markdown yok, açıklama yok):
            [
                "Rüyada [rüya konusu] görmek",
                "Rüyada [rüya konusu] yapmak"
            ]
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            let text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
            
            // Bazen AI virgül hatası yapabilir, try-catch ile koruyalım
            const yeniKelimeler = JSON.parse(text);

            let eklenenSayisi = 0;

            yeniKelimeler.forEach(keyword => {
                // Slug oluştur
                const slug = slugify(keyword);

                // Zaten var mı kontrol et (Duplicate önleme)
                const varMi = ruyalar.find(r => r.slug === slug);

                if (!varMi) {
                    ruyalar.push({ slug, keyword });
                    eklenenSayisi++;
                }
            });

            console.log(`   + ${eklenenSayisi} yeni rüya eklendi.`);

            // Her harften sonra dosyayı kaydet (Veri kaybını önlemek için)
            fs.writeFileSync(DATA_FILE, JSON.stringify(ruyalar, null, 2));

            // API Limiti için bekleme (Flash modeli hızlıdır ama nezaketen bekleyelim)
            await new Promise(r => setTimeout(r, 2000));

        } catch (error) {
            console.error(`   [HATA] ${harf} harfi işlenirken sorun oldu:`, error.message);
        }
    }

    console.log(`\n=== TAMAMLANDI ===`);
    console.log(`Yeni Toplam Rüya Sayısı: ${ruyalar.length}`);
}

expandList();