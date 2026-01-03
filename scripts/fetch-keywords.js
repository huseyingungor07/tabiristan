require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// AYARLAR
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// LOKAL MODEL AYARLARI (OLLAMA)
const LOCAL_MODEL_NAME = "gemma2:27b"; // Senin indirdiğin model
const OLLAMA_API_URL = "http://localhost:11434/api/chat";

// ALFABE (Dosyadaki gibi "Ğ" harfi çıkarılmış hali)
const ALFABE = "ABCÇDEFGHIİJKLMNOÖPRSŞTUÜVYZ".split(""); 

// YARDIMCI: Türkçe Slug Yapıcı (Aynı mantık korundu)
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

// YARDIMCI: JSON Temizleyici (Lokal modeller bazen markdown ekler)
function aggressiveCleanJSON(rawText) {
    let clean = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const firstOpen = clean.indexOf('[');
    const lastClose = clean.lastIndexOf(']');
    
    if (firstOpen !== -1 && lastClose !== -1) {
        clean = clean.substring(firstOpen, lastClose + 1);
    }
    
    // Satır sonlarını boşlukla değiştir ki JSON bozulmasın
    clean = clean.replace(/[\r\n]+/g, " ");
    return JSON.parse(clean);
}

// OLLAMA İLE KONUŞMA FONKSİYONU
async function generateWithLocalLLM(prompt) {
    try {
        const response = await fetch(OLLAMA_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: LOCAL_MODEL_NAME,
                messages: [
                    { 
                        role: "system", 
                        content: "You are a SEO expert. Output ONLY a valid JSON Array of strings. No markdown, no explanations." 
                    },
                    { role: "user", content: prompt }
                ],
                stream: false,
                options: {
                    temperature: 0.7,
                    num_ctx: 4096
                }
            })
        });

        if (!response.ok) throw new Error(`Ollama Hatası: ${response.statusText}`);
        const data = await response.json();
        return data.message.content;

    } catch (error) {
        throw error;
    }
}

async function expandList() {
    console.log(`🚀 İmparatorluk genişletiliyor (Lokal Model: ${LOCAL_MODEL_NAME})...`);

    for (const harf of ALFABE) {
        console.log(`\n[${harf}] harfi taranıyor...`);

        try {
            // ORİJİNAL PROMPT (Dosyadaki ile birebir aynı)
            // Not: Dosyada "en popüler 3 rüyayı" yazıyordu, test için öyle kalmış olabilir.
            // İstersen "3" sayısını "50" veya "100" yapabilirsin.
            const prompt = `
            Bana rüya tabirleri sitem için '${harf}' harfi ile başlayan, Türkiye'de insanların en çok arattığı en popüler 3 rüyayı listele.
            
            ÖNEMLİ: Sadece JSON Array ver. Asla "Ğ" ile başlayan uydurma kelime yazma.
            Format:
            [
                "Rüyada [rüya konusu] görmek",
                "Rüyada [rüya konusu] yapmak"
            ]
            `;

            // 1. Lokalde Üret
            const rawText = await generateWithLocalLLM(prompt);
            
            // 2. Temizle ve Parse et
            let yeniKelimeler = [];
            try {
                yeniKelimeler = aggressiveCleanJSON(rawText);
            } catch (parseError) {
                console.error(`   ⚠️ JSON Hatası (${harf}): Veri okunamadı.`);
                continue; // Bu harfi atla
            }

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
                    eklenenSayisi++; 
                }
            }

            console.log(`   + ${eklenenSayisi} aday rüya veritabanına gönderildi.`);
            
            // Lokal model hızlıdır ama bilgisayarı kilitlememek için minik mola
            await new Promise(r => setTimeout(r, 1000));

        } catch (error) {
            console.error(`   [HATA] ${harf} işlenirken sorun:`, error.message);
        }
    }

    console.log(`\n=== TARAMA TAMAMLANDI ===`);
}

expandList();