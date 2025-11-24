require('dotenv').config({ path: '.env.local' });
const { google } = require('googleapis');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Dosya yolunu belirle
const KEY_PATH = path.join(__dirname, '../service_account.json');

console.log("🔑 Anahtar Dosyası Yolu:", KEY_PATH);

// Dosya var mı kontrolü
if (!fs.existsSync(KEY_PATH)) {
    console.error("❌ HATA: service_account.json dosyası bulunamadı!");
    process.exit(1);
}

// Supabase Bağlantısı
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL, 
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function indexPages() {
    console.log("🔍 Google Yetkilendirmesi Başlatılıyor...");

    // YÖNTEM DEĞİŞİKLİĞİ: Dosya yolunu doğrudan veriyoruz
    const auth = new google.auth.GoogleAuth({
        keyFile: KEY_PATH,
        scopes: ['https://www.googleapis.com/auth/indexing'],
    });

    try {
        // İstemciyi (Client) oluştur
        const authClient = await auth.getClient();
        console.log("✅ Google Yetkilendirmesi Başarılı!");

        // İndekslenmemiş sayfaları çek
        console.log("🔍 İndekslenecek rüyalar veritabanından çekiliyor...");
        
        const { data: ruyalar, error } = await supabase
            .from('ruyalar')
            .select('slug')
            .eq('is_published', true)
            .order('created_at', { ascending: false }) 
            .limit(100);

        if (error) throw error;

        if (!ruyalar || ruyalar.length === 0) {
            console.log("⚠️ İşlenecek rüya bulunamadı.");
            return;
        }

        console.log(`🚀 ${ruyalar.length} adet URL Google'a gönderilecek...`);

        // Gönderim Döngüsü
        for (const r of ruyalar) {
            const url = `https://tabiristan.com/ruya/${r.slug}`;
            
            try {
                await google.indexing('v3').urlNotifications.publish({
                    auth: authClient,
                    requestBody: {
                        url: url,
                        type: 'URL_UPDATED'
                    }
                });
                console.log(`📡 Gönderildi: ${url}`);
            } catch (apiError) {
                console.error(`❌ API Hatası (${url}):`, apiError.message);
                if (apiError.message.includes('403')) {
                    console.error("   İPUCU: Botun email adresini Search Console'da 'Sahip' (Owner) yaptın mı?");
                }
            }

            // Nezaket beklemesi (API'yi boğmamak için)
            await new Promise(r => setTimeout(r, 600)); 
        }

        console.log("✅ Tüm işlemler tamamlandı!");

    } catch (err) {
        console.error("KRİTİK HATA:", err.message);
    }
}

indexPages();