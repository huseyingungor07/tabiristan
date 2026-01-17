require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// AYARLAR
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// LOKAL MODEL AYARI (OLLAMA)
// Terminalde indirdiğin modelin adı:
const LOCAL_MODEL_NAME = "gemma3:4b"; 
const OLLAMA_API_URL = "http://localhost:11434/api/chat";

// ORİJİNAL PROMPT (HİÇ DOKUNULMADI)
const RICH_PROMPT_TEMPLATE = (keyword) => `
Sen deneyimli bir rüya tabircisi ve Türkçe dil uzmanısın. Konumuz: "${keyword}".

Bana aşağıdaki JSON formatında bir çıktı ver.
Makale SEO uyumlu, zengin ve en az 600 kelime olsun.

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
                    { role: "system", content: "You are an ancient dream interpreter and a master of Turkish literature. You analyze symbols with depth, using a mystical yet accessible tone. Your mission is to interpret dreams for the 'Tabiristan' platform, blending Islamic traditions with modern psychology. CRITICAL INSTRUCTION: Output ONLY valid, minified JSON. Do not write any introduction or explanation outside the JSON. Ensure the JSON format is strictly followed. No markdown formatting (like \`\`\`json). No English words. No line breaks." },
                    { role: "user", content: prompt }
                ],
                stream: false,
                options: {
                    temperature: 0.7,
                    num_ctx: 16384 // Gemma 27B için hafızayı geniş tuttuk
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

async function generateTestRun() {
    console.log(`🚀 M4 PRO MOTORU ÇALIŞTIRILIYOR (Generate DB - Model: ${LOCAL_MODEL_NAME})...`);

    // SADECE 1 TANE ÇEKİYORUZ (TEST İÇİN)
    const { data: ruyalar, error } = await supabase
        .from('ruyalar')
        .select('id, keyword')
        .is('content', null) // Sadece boş olanlar
        .limit(1); // <--- İSTEDİĞİN GİBİ LİMİT 1

    if (error) { console.error("Veri hatası:", error); return; }
    if (!ruyalar || ruyalar.length === 0) { console.log("İşlenecek veri yok."); return; }

    const ruya = ruyalar[0];
    console.log(`🧪 Test Edilen Rüya: "${ruya.keyword}"`);
    console.log("⏳ Gemma düşünüyor (Lütfen bekleyin)...");

    const startTime = Date.now();

    try {
        // 1. Üret
        const rawText = await generateWithLocalLLM(RICH_PROMPT_TEMPLATE(ruya.keyword));
        
        // 2. Temizle
        const jsonContent = aggressiveCleanJSON(rawText);

        // generate-db.js satır 37 civarı (aggressiveCleanJSON fonksiyonundan sonra bir yere ekle)
        const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

        // 3. Yaz (Veritabanı)
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
        console.log(`✅ OLUŞTURULDU! "${ruya.keyword}" (${duration} saniye)`);

    } catch (err) {
        console.error("❌ HATA:", err.message);
    }
}

generateTestRun();