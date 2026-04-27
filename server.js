const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const http = require('http');

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        browser: ["Fast Bird", "Chrome", "114.0.5735.199"]
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('--- عامر، امسح الرمز أدناه الآن ---');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const statusCode = (lastDisconnect.error instanceof Boom)?.output?.statusCode;
            console.log(`❌ انقطع الاتصال. كود الحالة: ${statusCode}`);
            
            // إعادة المحاولة بذكاء بعد 5 ثوانٍ لمنع الانهيار
            if (statusCode !== DisconnectReason.loggedOut) {
                console.log('إعادة المحاولة بعد قليل...');
                setTimeout(() => connectToWhatsApp(), 5000);
            }
        } else if (connection === 'open') {
            console.log('✅ تم الربط بنجاح يا عامر!');
        }
    });
}

const port = process.env.PORT || 3000;
http.createServer((req, res) => { res.end("Fast Bird Gateway Active"); }).listen(port);

connectToWhatsApp().catch(err => console.log("خطأ حرج: " + err));
