require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { createCanvas } = require('canvas');
const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');

// 1. Supabase Bağlantısı
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 2. Cloudflare R2 Bağlantısı
const r2 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

// Ayarlar
const BUCKET_NAME = process.env.R2_BUCKET_NAME;
const COLORS = ['#F3E5F5', '#E3F2FD', '#E8F5E9', '#FFF3E0', '#FBE9E7', '#F5F5F5', '#E0F7FA', '#FFF8E1'];
const TEXT_COLORS = ['#4A148C', '#0D47A1', '#1B5E20', '#E65100', '#BF360C', '#212121', '#006064', '#FF6F00'];

// Word Wrap (Metin Kaydırma)
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
            ctx.fillText(line, x, currentY);
            line = words[n] + ' ';
            currentY += lineHeight;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, x, currentY);
}

// Dosya R2'de var mı kontrol et
async function fileExists(fileName) {
    try {
        await r2.send(new HeadObjectCommand({ Bucket: BUCKET_NAME, Key: fileName }));
        return true;
    } catch (error) {
        return false; // 404 dönerse dosya yok demektir
    }
}

async function generatePins() {
    console.log("☁️  R2 Bulut Fabrikası Başlatılıyor (Sınırsız/Pagination Modu)...");

    const PAGE_SIZE = 1000; // Her seferde kaç veri çekilecek
    let page = 0;
    let hasMore = true;
    let totalProcessed = 0;
    let totalSkipped = 0;

    while (hasMore) {
        // Sayfalama ile veri çekme
        // KRİTİK DÜZELTME: .order() eklendi. Artık veriler sabit bir sırada gelir, atlama yapmaz.
        const { data: ruyalar, error } = await supabase
            .from('ruyalar')
            .select('slug, keyword')
            .eq('is_published', true)
            .order('id', { ascending: true }) // <--- İŞTE EKLENEN PARÇA
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

        if (error) {
            console.error("❌ Veri çekme hatası:", error.message);
            break;
        }

        // Eğer veri gelmediyse bitmiş demektir
        if (!ruyalar || ruyalar.length === 0) {
            hasMore = false;
            console.log("✅ Tüm veritabanı tarandı.");
            break;
        }

        console.log(`\n📦 PAKET ${page + 1}: ${ruyalar.length} adet rüya işleniyor...`);

        for (const ruya of ruyalar) {
            const fileName = `${ruya.slug}.webp`;

            // KONTROL: R2'de var mı?
            const isExist = await fileExists(fileName);
            if (isExist) {
                totalSkipped++;
                continue;
            }

            // --- GÖRSEL ÜRETİMİ ---
            const canvas = createCanvas(1000, 1500);
            const ctx = canvas.getContext('2d');
            const colorIndex = Math.floor(Math.random() * COLORS.length);
            
            // Arka Plan
            ctx.fillStyle = COLORS[colorIndex];
            ctx.fillRect(0, 0, 1000, 1500);
            
            // Çerçeve
            ctx.strokeStyle = "rgba(0,0,0,0.05)";
            ctx.lineWidth = 20;
            ctx.strokeRect(50, 50, 900, 1400);

            // Yazı
            ctx.fillStyle = TEXT_COLORS[colorIndex];
            ctx.font = 'bold 80px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            wrapText(ctx, ruya.keyword, 500, 750 - 100, 800, 100);

            // Marka
            ctx.fillStyle = "rgba(0,0,0,0.5)";
            ctx.font = '40px sans-serif';
            ctx.fillText("Tabiristan.com", 500, 1350);

            // Buffer
            const buffer = canvas.toBuffer('image/jpeg', { quality: 0.8 }); 

            // --- R2'YE YÜKLEME ---
            try {
                await r2.send(new PutObjectCommand({
                    Bucket: BUCKET_NAME,
                    Key: fileName,
                    Body: buffer,
                    ContentType: 'image/webp',
                }));
                
                console.log(`☁️  Yüklendi: ${fileName}`);
                totalProcessed++;
                
                // Rate Limit Koruması
                await new Promise(r => setTimeout(r, 50));

            } catch (err) {
                console.error(`❌ Yükleme Hatası (${fileName}):`, err.message);
            }
        }

        // Bir sonraki sayfaya geç
        page++;
    }
    
    console.log(`\n🎉 BÜYÜK İŞLEM BİTTİ!`);
    console.log(`📊 Toplam Yüklenen: ${totalProcessed}`);
    console.log(`⏭️  Zaten Var Olduğu İçin Atlanan: ${totalSkipped}`);
}

generatePins();