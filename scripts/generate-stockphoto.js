require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { createCanvas, loadImage, registerFont } = require('canvas'); // loadImage eklendi
const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const axios = require('axios');

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
const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY;

// Metin Kaydırma Fonksiyonu
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
        return false; 
    }
}

// Pixabay'dan Resim Bul
async function fetchStockImage(query) {
    try {
        // "Rüyada" kelimesini atalım, arama daha isabetli olsun (Örn: "Rüyada Yılan" -> "Yılan")
        const cleanQuery = query.replace(/rüyada/gi, '').trim();
        
        const url = `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(cleanQuery)}&image_type=photo&orientation=vertical&per_page=3&lang=tr`;
        
        const response = await axios.get(url);
        
        if (response.data.hits && response.data.hits.length > 0) {
            // En çok beğenilen ilk 3 resimden rastgele birini seç (Çeşitlilik olsun)
            const randomIndex = Math.floor(Math.random() * Math.min(response.data.hits.length, 3));
            return response.data.hits[randomIndex].largeImageURL; // Yüksek kalite URL
        }
        return null; // Bulamazsa null dön
    } catch (error) {
        console.error("Pixabay Hatası:", error.message);
        return null;
    }
}

async function generatePins() {
    console.log("📸  Stok Fotoğraf Fabrikası Başlatılıyor...");

    const PAGE_SIZE = 50; // Pixabay limitini patlatmamak için 50-50 gidelim
    let page = 0;
    let hasMore = true;

    while (hasMore) {
        // Verileri Çek (Sıralı)
        const { data: ruyalar, error } = await supabase
            .from('ruyalar')
            .select('slug, keyword')
            .eq('is_published', true)
            .order('id', { ascending: true })
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

        if (error || !ruyalar || ruyalar.length === 0) {
            console.log("✅ Tüm veritabanı tarandı veya veri bitti.");
            break;
        }

        console.log(`\n📦 PAKET ${page + 1}: ${ruyalar.length} adet işleniyor...`);

        for (const ruya of ruyalar) {
            const fileName = `${ruya.slug}.webp`;

            // 1. Zaten var mı?
            if (await fileExists(fileName)) {
                process.stdout.write("."); // Hızlı geçiş efekti
                continue;
            }

            console.log(`\n🎨 İşleniyor: ${ruya.keyword}`);

            // 2. Fotoğrafı Bul
            let imageUrl = await fetchStockImage(ruya.keyword);
            
            // Eğer fotoğraf bulamazsa varsayılan "Mistik" bir doğa resmi kullan (Link değişebilir)
            if (!imageUrl) {
                console.log("   ⚠️ Fotoğraf bulunamadı, varsayılan kullanılıyor.");
                imageUrl = "https://cdn.pixabay.com/photo/2018/08/14/13/23/ocean-3605547_1280.jpg"; 
            }

            try {
                // 3. Canvas İşlemleri
                const canvas = createCanvas(1000, 1500);
                const ctx = canvas.getContext('2d');

                // Resmi İndir ve Çiz
                const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
                const img = await loadImage(imageResponse.data);
                
                // Resmi canvas'a sığdır (Cover modu)
                // Basitçe drawImage kullanıyoruz, 1000x1500'e esnetiyoruz (Pinterest oranı)
                ctx.drawImage(img, 0, 0, 1000, 1500);

                // KARANLIK PERDE (Yazı okunsun diye)
                ctx.fillStyle = "rgba(0, 0, 0, 0.5)"; // %50 Siyah
                ctx.fillRect(0, 0, 1000, 1500);

                // Çerçeve (Şıklık katar)
                ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
                ctx.lineWidth = 20;
                ctx.strokeRect(50, 50, 900, 1400);

                // Başlık Yazısı
                ctx.fillStyle = "#FFFFFF"; // Beyaz Yazı
                ctx.font = 'bold 90px sans-serif'; // Fontu büyüttük
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                // Gölge Ekle (Okunabilirliği artırır)
                ctx.shadowColor = "black";
                ctx.shadowBlur = 20;
                
                wrapText(ctx, ruya.keyword, 500, 750, 800, 110);

                // Marka (Footer)
                ctx.font = '40px sans-serif';
                ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
                ctx.fillText("Tabiristan.com", 500, 1350);

                // 4. Kaydet ve Yükle
                const buffer = canvas.toBuffer('image/jpeg', { quality: 0.85 });

                await r2.send(new PutObjectCommand({
                    Bucket: BUCKET_NAME,
                    Key: fileName,
                    Body: buffer,
                    ContentType: 'image/webp',
                }));

                console.log(`   ✅ Yüklendi!`);

            } catch (err) {
                console.error(`   ❌ Hata: ${err.message}`);
            }
        }
        page++;
    }
    console.log("🎉 Bitti!");
}

generatePins();