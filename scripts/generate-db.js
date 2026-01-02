require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// AYARLAR
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// 1. KAYNAK: Google API Anahtarları
const GOOGLE_KEYS = (process.env.GOOGLE_KEYS || "").split(',').map(k => k.trim()).filter(k => k.length > 0);

// 2. KAYNAK: OpenRouter Anahtarı
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// MODELLER (Update scripti ile aynı standartta)
const GOOGLE_DIRECT_MODEL = "gemini-2.5-flash-lite"; 
const OPENROUTER_MODEL = "google/gemini-2.0-flash-exp:free";

// DURUM DEĞİŞKENLERİ
let googleKeyIndex = 0; 
let useOpenRouter = false; 

// KONTROLLER
if (GOOGLE_KEYS.length === 0) {
    console.error("❌ HATA: .env.local içinde GOOGLE_KEYS bulunamadı!");
    process.exit(1);
}
if (!OPENROUTER_API_KEY) {
    console.error("❌ HATA: .env.local içinde OPENROUTER_API_KEY bulunamadı!");
    process.exit(1);
}

// ZENGİN İÇERİK PROMPTU (Update scripti ile BİREBİR AYNI)
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

// --- 1. YÖNTEM: GOOGLE DIRECT API ---
async function tryGoogleDirect(prompt) {
    const currentKey = GOOGLE_KEYS[googleKeyIndex];
    
    const genAI = new GoogleGenerativeAI(currentKey);
    const model = genAI.getGenerativeModel({ 
        model: GOOGLE_DIRECT_MODEL,
        generationConfig: { responseMimeType: "application/json" }
    });

    try {
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        if (error.message.includes('429') || error.message.includes('quota') || error.message.includes('exhausted')) {
            console.warn(`⚠️ Google Anahtar #${googleKeyIndex + 1} kotası doldu.`);
            googleKeyIndex++;
            
            if (googleKeyIndex >= GOOGLE_KEYS.length) {
                console.warn("🛑 TÜM GOOGLE ANAHTARLARI TÜKENDİ! OpenRouter'a geçiliyor...");
                useOpenRouter = true; 
                throw new Error("SWITCH_TO_OPENROUTER");
            } else {
                console.log(`🔄 Sıradaki Google hesabına geçiliyor (#${googleKeyIndex + 1})...`);
                return tryGoogleDirect(prompt);
            }
        }
        throw error;
    }
}

// --- 2. YÖNTEM: OPENROUTER API ---
async function tryOpenRouter(prompt) {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://tabiristan.com", 
        },
        body: JSON.stringify({
            model: OPENROUTER_MODEL,
            messages: [
                { role: "system", content: "You output ONLY minified valid JSON. No line breaks." },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
        })
    });

    if (!response.ok) {
        if (response.status === 429) {
            throw new Error("OPENROUTER_BUSY");
        }
        const errText = await response.text();
        throw new Error(`OpenRouter Error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

// --- ANA YÖNETİCİ ---
async function generateContentWrapper(prompt) {
    if (useOpenRouter) {
        return await tryOpenRouter(prompt);
    }
    try {
        return await tryGoogleDirect(prompt);
    } catch (error) {
        if (error.message === "SWITCH_TO_OPENROUTER") {
            return await tryOpenRouter(prompt);
        }
        throw error;
    }
}

async function generateNewContent() {
    console.log("🚀 YENİ İÇERİK ÜRETİMİ (GENERATE-DB) BAŞLIYOR...");
    console.log(`ℹ️ Strateji: 5 Google Hesabı -> OpenRouter Yedekli`);

    // SADECE İÇERİĞİ BOŞ OLANLARI ÇEK
    const { data: ruyalar, error } = await supabase
        .from('ruyalar')
        .select('id, keyword')
        .is('content', null) // <--- KRİTİK FİLTRE: Sadece boşlar
        .limit(50); 

    if (error) { console.error("Veri çekme hatası:", error); return; }
    
    if (!ruyalar || ruyalar.length === 0) {
        console.log("🎉 TEBRİKLER! Tüm içerikler tamamlanmış (Boş veri yok).");
        return;
    }

    console.log(`📋 ${ruyalar.length} adet yeni rüya yazılacak.`);

    for (const ruya of ruyalar) {
        let success = false;
        let retryCount = 0;
        const maxRetries = 10; 

        while (!success && retryCount < maxRetries) {
            try {
                const sourceName = useOpenRouter ? "OpenRouter" : `Google Hesap #${googleKeyIndex + 1}`;
                console.log(`✍️ [${sourceName}]: "${ruya.keyword}"...`);

                // İçerik üret
                const rawText = await generateContentWrapper(RICH_PROMPT_TEMPLATE(ruya.keyword));
                const jsonContent = aggressiveCleanJSON(rawText);

                // Veritabanına YENİ Kayıt
                const { error: updateError } = await supabase
                    .from('ruyalar')
                    .update({
                        title: jsonContent.title,
                        meta_description: jsonContent.metaDescription,
                        content: jsonContent.content,
                        is_published: true,
                        is_upgraded: true // <--- İŞTE İSTEDİĞİN ÖZELLİK: Diğer script bunu pas geçecek.
                    })
                    .eq('id', ruya.id);

                if (updateError) throw updateError;

                console.log(`✅ [OLUŞTURULDU]: ${ruya.keyword}`);
                success = true;
                
                const waitTime = useOpenRouter ? 5000 : 2000; 
                await sleep(waitTime);

            } catch (err) {
                if (err.message === "OPENROUTER_BUSY") {
                    retryCount++;
                    console.log(`⏳ OpenRouter yoğun, 10sn bekleniyor... (Deneme ${retryCount})`);
                    await sleep(10000);
                } else {
                    console.error(`❌ HATA (${ruya.keyword}):`, err.message);
                    break;
                }
            }
        }
    }
}

generateNewContent();