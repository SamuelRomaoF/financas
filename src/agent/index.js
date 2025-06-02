import dotenv from 'dotenv';
import qrcode from 'qrcode-terminal';
import { Client } from 'whatsapp-web.js';
import FinanceAgent from './bot.js';

// Carrega as variáveis de ambiente
dotenv.config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
    process.exit(1);
}

// Instancia o agente
const agent = new FinanceAgent(supabaseUrl, supabaseKey);

// Cria o cliente do WhatsApp
const client = new Client({
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
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
        // Ignora TODAS as mensagens de grupos
        if (msg.from.includes('g.us')) {
            console.log('Mensagem de grupo ignorada:', msg.from);
            return;
        }

        // Remove o @c.us do número
        const phoneNumber = msg.from.replace('@c.us', '');
        
        // Processa a mensagem
        const response = await agent.handleMessage(phoneNumber, msg.body);

        // Envia a resposta apenas se não for grupo
        if (!msg.from.includes('g.us')) {
            await client.sendMessage(msg.from, response);
        }
    } catch (error) {
        console.error('Erro ao processar mensagem:', error);
        try {
            // Envia mensagem de erro apenas se não for grupo
            if (!msg.from.includes('g.us')) {
                await client.sendMessage(msg.from, 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.');
            }
        } catch (sendError) {
            console.error('Erro ao enviar mensagem de erro:', sendError);
        }
    }
});

// Inicia o cliente
console.log('Iniciando cliente WhatsApp...');
client.initialize();

export default FinanceAgent; 