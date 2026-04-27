const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const pino = require('pino');
const http = require('http');

async function connectToWhatsApp() {
    // Railway يدعم حفظ الملفات في مجلد الجلسة
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true, // سيطبع الرمز في سجلات Railway
        logger: pino({ level: 'silent' })
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, qr } = update;
        if (connection === 'open') {
            console.log('✅ تم الربط بنجاح يا عامر!');
        }
    });
}

// سيرفر ويب بسيط لمتطلبات Railway لفتح المنفذ (Port)
const port = process.env.PORT || 3000;
http.createServer((req, res) => {
    res.end("Fast Bird Gateway is active on Railway!");
}).listen(port);

connectToWhatsApp();
