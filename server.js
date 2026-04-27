const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const qrcode = require('qrcode-terminal'); // المكتبة التي سترسم الرمز
const pino = require('pino');
const http = require('http');

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' })
        // تم حذف printQRInTerminal لأنها لم تعد تعمل
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, qr } = update;

        // رسم الرمز يدوياً في السجلات عند استلامه
        if (qr) {
            console.log('--- امسح الرمز أدناه يا عامر ---');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'open') {
            console.log('✅ تم الاتصال بنجاح!');
        }
    });
}

const port = process.env.PORT || 3000;
http.createServer((req, res) => { res.end("Fast Bird Gateway Active"); }).listen(port);

connectToWhatsApp();
