require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// AYARLAR
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// LOKAL MODEL AYARI (OLLAMA)
const LOCAL_MODEL_NAME = "gemma2:27b"; 
const OLLAMA_API_URL = "http://localhost:11434/api/chat";

// ORİJİNAL PROMPT (HİÇ DOKUNULMADI)
const RICH_PROMPT_TEMPLATE = (keyword) => `
Sen deneyimli bir rüya tabircisi ve Türkçe dil uzmanısın. Konumuz: "${keyword}".

Bana aşağıdaki JSON formatında bir çıktı ver.
Makale SEO uyumlu, zengin ve en az 600 kelime olsun.

*** DİL KURALLARI ***
1. %100 Akıcı İstanbul Türkçesi kullan.
2. ASLA İngilizce kelime kullanma. "Literal", "Necessary" gibi kelimeler YASAK.
3. Deyimleri doğru kullan.
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

// --- ÜTÜLEME VE TEMİZLEME ---
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

// --- OLLAMA İLE KONUŞMA ---
async function generateWithLocalLLM(prompt) {
    try {
        const response = await fetch(OLLAMA_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: LOCAL_MODEL_NAME,
                messages: [
                    { role: "system", content: "You output ONLY minified valid JSON. No English words. No line breaks." },
                    { role: "user", content: prompt }
                ],
                stream: false,
                options: {
                    temperature: 0.7,
                    num_ctx: 8192
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

async function updateExistingContent() {
    console.log(`🚀 M4 PRO UPDATE OPERASYONU (Model: ${LOCAL_MODEL_NAME})...`);

    // GÜNCELLENMEMİŞ OLANLARI ÇEK
    const { data: ruyalar, error } = await supabase
        .from('ruyalar')
        .select('id, keyword')
        .eq('is_published', true)
        .eq('is_upgraded', false) // Sadece eskiler
        .limit(50); // M4 Pro hızlıdır, 50-50 gidebilirsin.

    if (error) { console.error("Veri çekme hatası:", error); return; }
    
    if (!ruyalar || ruyalar.length === 0) {
        console.log("🎉 TEBRİKLER! Güncellenecek içerik kalmadı.");
        return;
    }

    console.log(`📋 Bu partide ${ruyalar.length} rüya işlenecek.`);

    for (const ruya of ruyalar) {
        try {
            console.log(`✍️ [Gemma 27B]: "${ruya.keyword}"...`);
            
            const startTime = Date.now();

            // İçerik üret
            const rawText = await generateWithLocalLLM(RICH_PROMPT_TEMPLATE(ruya.keyword));
            const jsonContent = aggressiveCleanJSON(rawText);

            // Veritabanına yaz
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

            const duration = ((Date.now() - startTime) / 1000).toFixed(1);
            console.log(`✅ [GÜNCELLENDİ]: ${ruya.keyword} (${duration}sn)`);
            
            // Cihazı aşırı yormamak için kısa bekleme
            await sleep(500);

        } catch (err) {
            console.error(`❌ HATA (${ruya.keyword}):`, err.message);
            // Hata sonrası biraz bekle
            await sleep(1000);
        }
    }
}

updateExistingContent();