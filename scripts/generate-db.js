require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// --- AYARLAR ---
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// LOKAL MODEL AYARI (OLLAMA)
const LOCAL_MODEL_NAME = "gemma3:4b"; 
const OLLAMA_API_URL = "http://localhost:11434/api/chat";

// ÜRETİM AYARLARI
const BATCH_SIZE = 200;      // Her çalıştırmada kaç rüya işlensin?
const DELAY_MS = 15000;     // Her rüya arası bekleme süresi (ms) - M4 Pro'yu dinlendirmek için

// ORİJİNAL PROMPT (HİÇ DOKUNULMADI)
const RICH_PROMPT_TEMPLATE = (keyword) => `
Sen deneyimli bir rüya tabircisi ve Türkçe dil uzmanısın. Konumuz: "${keyword}".

Bana aşağıdaki JSON formatında bir çıktı ver.
Makale SEO uyumlu, zengin ve en az 800 kelime olsun.

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
      <h2>${keyword} Ne Anlama Gelir?</h2>
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

// --- YARDIMCI FONKSİYONLAR ---

// JSON Temizleme (Dokunulmadı)
function aggressiveCleanJSON(rawText) {
    let clean = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const firstOpen = clean.indexOf('{');
    const lastClose = clean.lastIndexOf('}');
    
    if (firstOpen !== -1 && lastClose !== -1) {
        clean = clean.substring(firstOpen, lastClose + 1);
    }
    
    clean = clean.replace(/[\r\n]+/g, " ");
    return JSON.parse(clean);
}

// Bekleme Fonksiyonu (Yenilik)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// --- OLLAMA İLE KONUŞMA ---
async function generateWithLocalLLM(prompt) {
    try {
        const response = await fetch(OLLAMA_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: LOCAL_MODEL_NAME,
                messages: [
                    { role: "system", content: "You are an ancient dream interpreter and a master of Turkish literature. You analyze symbols with depth, using a mystical yet accessible tone. Your mission is to interpret dreams for the 'Tabiristan' platform, blending Islamic traditions with modern psychology. CRITICAL INSTRUCTION: Output ONLY valid, minified JSON. Do not write any introduction or explanation outside the JSON. Ensure the JSON format is strictly followed. No markdown formatting (like \`\`\`json). No English words. No line breaks." },
                    { role: "user", content: prompt }
                ],
                stream: false,
                options: {
                    temperature: 0.7,
                    num_ctx: 4096, // Context window
                    num_predict: 2500
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

// --- ANA İŞLEM DÖNGÜSÜ ---
async function startBatchGeneration() {
    console.log(`🚀 M4 PRO MOTORU ÇALIŞTIRILIYOR (Batch Modu - Model: ${LOCAL_MODEL_NAME})...`);
    console.log(`🎯 Hedef: ${BATCH_SIZE} adet rüya işlenecek.`);

    // 1. Veritabanından sıradaki işlenmemiş kayıtları çek
    const { data: ruyalar, error } = await supabase
        .from('ruyalar')
        .select('id, keyword')
        .is('content', null) // İçeriği boş olanlar
        .limit(BATCH_SIZE);  // Toplu işlem limiti

    if (error) { console.error("Veri çekme hatası:", error); return; }
    if (!ruyalar || ruyalar.length === 0) { console.log("🎉 İşlenecek rüya kalmadı! Hepsi tamam."); return; }

    console.log(`📋 Bulunan Kayıt Sayısı: ${ruyalar.length}`);
    console.log("--------------------------------------------------");

    // 2. Döngüye gir ve sırayla işle
    for (const [index, ruya] of ruyalar.entries()) {
        const startTime = Date.now();
        console.log(`\n[${index + 1}/${ruyalar.length}] İşleniyor: "${ruya.keyword}"`);
        
        try {
            // A. Üret
            console.log("   ⏳ Gemma düşünüyor...");
            const rawText = await generateWithLocalLLM(RICH_PROMPT_TEMPLATE(ruya.keyword));
            
            // B. Temizle
            const jsonContent = aggressiveCleanJSON(rawText);

            // C. Kaydet
            const { error: updateError } = await supabase
                .from('ruyalar')
                .update({
                    title: jsonContent.title,
                    meta_description: jsonContent.metaDescription,
                    content: jsonContent.content,
                    is_published: true,
                    is_upgraded: true
                })
                .eq('id', ruya.id);

            if (updateError) throw updateError;

            const duration = ((Date.now() - startTime) / 1000).toFixed(1);
            console.log(`   ✅ BAŞARILI: "${ruya.keyword}" (${duration} sn)`);

        } catch (err) {
            console.error(`   ❌ HATA ("${ruya.keyword}"):`, err.message);
            // Hata olsa bile döngü devam eder, script patlamaz.
        }

        // D. Dinlen (Son eleman değilse bekle)
        if (index < ruyalar.length - 1) {
            console.log(`   💤 Soğuma süresi (${DELAY_MS}ms)...`);
            await sleep(DELAY_MS);
        }
    }

    console.log("\n🏁 BATCH İŞLEMİ TAMAMLANDI.");
}

// Başlat
startBatchGeneration();