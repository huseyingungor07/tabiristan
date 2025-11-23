require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Dosya yolları
const DATA_FILE = path.join(__dirname, '../src/data/ruyalar.json');
const CONTENT_DIR = path.join(__dirname, '../src/content');

async function migrate() {
    console.log("Migration başlıyor...");
    
    // 1. Keyword Listesini Oku
    const ruyalar = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    console.log(`${ruyalar.length} adet rüya başlığı bulundu.`);

    // Batch (Toplu) işlem yapalım, tek tek çok sürer
    const batchSize = 100;
    for (let i = 0; i < ruyalar.length; i += batchSize) {
        const batch = ruyalar.slice(i, i + batchSize);
        const rowsToInsert = [];

        for (const ruya of batch) {
            // İçerik dosyası var mı kontrol et
            const contentPath = path.join(CONTENT_DIR, `${ruya.slug}.json`);
            let contentData = null;
            let isPublished = false;

            if (fs.existsSync(contentPath)) {
                try {
                    contentData = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
                    isPublished = true;
                } catch (e) {
                    console.log(`JSON hatası: ${ruya.slug}`);
                }
            }

            rowsToInsert.push({
                slug: ruya.slug,
                keyword: ruya.keyword,
                title: contentData ? contentData.title : null,
                meta_description: contentData ? contentData.metaDescription : null,
                content: contentData ? contentData.content : null,
                is_published: isPublished
            });
        }

        // Veritabanına Bas (Upsert: Varsa güncelle, yoksa ekle)
        const { error } = await supabase.from('ruyalar').upsert(rowsToInsert, { onConflict: 'slug' });

        if (error) console.error('Hata:', error);
        else console.log(`${i + batchSize} satır işlendi...`);
    }

    console.log("MIGRATION TAMAMLANDI! 🚀");
}

migrate();