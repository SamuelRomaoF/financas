import dotenv from 'dotenv';
import path from 'path';
import qrcode from 'qrcode-terminal';
import { fileURLToPath } from 'url';
import { Client } from 'whatsapp-web.js';
import FinanceAgent from './agent/bot.js';

// Obter o diretório atual para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurar dotenv com caminho relativo
dotenv.config({ path: path.resolve(__dirname, '../.env') });

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