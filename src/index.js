const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const FinanceAgent = require('./agent');

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Instancia o agente
const agent = new FinanceAgent(supabaseUrl, supabaseKey);

// Cria o cliente do WhatsApp
const client = new Client({
    puppeteer: {
        args: ['--no-sandbox']
    }
});

// Evento quando o QR Code é recebido
client.on('qr', (qr) => {
    console.log('QR Code recebido, escaneie-o com seu WhatsApp:');
    qrcode.generate(qr, { small: true });
});

// Evento quando o cliente está pronto
client.on('ready', () => {
    console.log('Cliente WhatsApp conectado e pronto!');
});

// Evento quando uma mensagem é recebida
client.on('message', async msg => {
    try {
        // Remove o @c.us do número
        const phoneNumber = msg.from.replace('@c.us', '');
        
        // Processa a mensagem
        const response = await agent.handleMessage(phoneNumber, msg.body);

        // Envia a resposta
        await msg.reply(response);
    } catch (error) {
        console.error('Erro ao processar mensagem:', error);
        await msg.reply('Desculpe, ocorreu um erro ao processar sua mensagem.');
    }
});

// Inicia o cliente
client.initialize(); 