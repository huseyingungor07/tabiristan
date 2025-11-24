require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { createCanvas, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');

// Supabase Bağlantısı
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Çıktı Klasörü
const OUTPUT_DIR = path.join(__dirname, '../public/pins');
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Renk Paleti
const COLORS = [
    '#F3E5F5', '#E3F2FD', '#E8F5E9', '#FFF3E0', '#FBE9E7', '#F5F5F5', '#E0F7FA', '#FFF8E1'
];

const TEXT_COLORS = [
    '#4A148C', '#0D47A1', '#1B5E20', '#E65100', '#BF360C', '#212121', '#006064', '#FF6F00'
];

// Word Wrap Fonksiyonu
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        
        if (testWidth > maxWidth && n > 0) {
            ctx.fillText(line, x, currentY);
            line = words[n] + ' ';
            currentY += lineHeight;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, x, currentY);
}

async function generatePins() {
    console.log("🎨 Pin Fabrikası Başlatılıyor (Akıllı Mod)...");

    // 1. Veritabanından TÜM yayınlanmış rüyaları çek (Limit kaldırıldı)
    const { data: ruyalar, error } = await supabase
        .from('ruyalar')
        .select('slug, keyword')
        .eq('is_published', true);

    if (error) { console.error(error); return; }

    console.log(`Toplam ${ruyalar.length} rüya kontrol ediliyor...`);

    let uretilenSayisi = 0;

    for (const [index, ruya] of ruyalar.entries()) {
        const fileName = `${ruya.slug}.jpg`;
        const filePath = path.join(OUTPUT_DIR, fileName);

        // --- KRİTİK KONTROL: Dosya varsa atla ---
        if (fs.existsSync(filePath)) {
            // console.log(`⏩ Zaten var: ${fileName}`); 
            continue;
        }

        const canvas = createCanvas(1000, 1500); 
        const ctx = canvas.getContext('2d');

        // Renk Seçimi
        const colorIndex = Math.floor(Math.random() * COLORS.length);
        const bgColor = COLORS[colorIndex];
        const textColor = TEXT_COLORS[colorIndex];

        // Çizim İşlemleri
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, 1000, 1500);

        ctx.strokeStyle = "rgba(0,0,0,0.05)";
        ctx.lineWidth = 20;
        ctx.strokeRect(50, 50, 900, 1400);

        ctx.fillStyle = textColor;
        ctx.font = 'bold 80px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        wrapText(ctx, ruya.keyword, 500, 750 - 100, 800, 100);

        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.font = '40px sans-serif';
        ctx.fillText("Tabiristan.com", 500, 1350);

        // Kaydet
        const buffer = canvas.toBuffer('image/jpeg');
        fs.writeFileSync(filePath, buffer);

        console.log(`🖼️ [${index + 1}/${ruyalar.length}] Üretildi: ${fileName}`);
        uretilenSayisi++;
    }

    console.log(`✅ İşlem Tamamlandı! Toplam ${uretilenSayisi} yeni görsel üretildi.`);
}

generatePins();