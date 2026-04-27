const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const http = require('http');

async function connectToWhatsApp() {
    // Railway يفضل المسارات النسبية في الحاويات
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
    
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        browser: ["Fast Bird Gateway", "Chrome", "114.0.5735.199"],
        // إعدادات إضافية لزيادة استقرار الشبكة
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 0,
        keepAliveIntervalMs: 10000
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('--- عامر، امسح الرمز أدناه الآن ---');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const statusCode = (lastDisconnect?.error instanceof Boom)?.output?.statusCode || 500;
            console.log(`❌ انقطع الاتصال. كود الحالة: ${statusCode}`);
            
            // منع إعادة التشغيل اللانهائي في حالات معينة
            if (statusCode !== DisconnectReason.loggedOut) {
                console.log('سيتم إعادة المحاولة بعد 10 ثوانٍ لتجنب حظر السيرفر...');
                setTimeout(() => connectToWhatsApp(), 10000);
            } else {
                console.log('تم تسجيل الخروج. يرجى مسح الرمز مرة أخرى.');
                setTimeout(() => connectToWhatsApp(), 5000);
            }
        } else if (connection === 'open') {
            console.log('✅ تم الربط بنجاح! الطائر السريع جاهز للعمل.');
        }
    });
}

// سيرفر الويب ضروري جداً لـ Railway لتجاوز الـ Health Check
const port = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end("Fast Bird Gateway is Running!");
});

server.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on port ${port}`);
});

connectToWhatsApp().catch(err => console.log("Critical Error: " + err));
