const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const http = require('http');

// ... (الأكواد السابقة في الأعلى تبقى كما هي)

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        // إضافة تعريف المتصفح لتجنب الحظر أو قطع الاتصال
        browser: ["Fast Bird Gateway", "Chrome", "114.0.5735.199"],
        connectTimeoutMs: 60000, // زيادة وقت انتظار الاتصال لـ 60 ثانية
        defaultQueryTimeoutMs: 0,
        keepAliveIntervalMs: 10000 // الحفاظ على النبض كل 10 ثوانٍ
    });

// ... (بقية الكود المستمع للاتصال)
    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, qr } = update;

        // هنا "المصيدة": إذا وصل الرمز QR، نقوم برسمه في التيرمينال
        if (qr) {
            console.log('--- عامر، امسح الرمز أدناه الآن ---');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            console.log('انقطع الاتصال، جاري المحاولة مرة أخرى...');
            connectToWhatsApp();
        } else if (connection === 'open') {
            console.log('✅ تم الربط بنجاح! الطائر السريع جاهز الآن.');
        }
    });
}

// سيرفر ويب بسيط للبقاء متصلاً على Railway
const port = process.env.PORT || 3000;
http.createServer((req, res) => {
    res.end("Fast Bird Gateway Active");
}).listen(port);

connectToWhatsApp();
