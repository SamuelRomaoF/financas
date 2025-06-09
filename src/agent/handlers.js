import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import FinanceAgent from './bot.js';

// Obter o diretório atual para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurar dotenv com caminho relativo
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Objeto para armazenar a instância do bot
let botInstance = null;

// Inicializa o bot com as credenciais do Supabase
function initializeBot(supabaseUrl, supabaseKey) {
    console.log('[HANDLERS] Inicializando bot com URL:', supabaseUrl);
    try {
        botInstance = new FinanceAgent(supabaseUrl, supabaseKey);
        console.log('[HANDLERS] Bot inicializado com sucesso');
        return true;
    } catch (error) {
        console.error('[HANDLERS] Erro ao inicializar bot:', error);
        return false;
    }
}

// Manipulador principal de mensagens
async function handleMessage(phone, message) {
    console.log('[HANDLERS] Recebida mensagem:', message);
    
    // Ignora mensagens de grupos (terminam com @g.us)
    if (phone.includes('@g.us')) {
        console.log('[HANDLERS] Mensagem de grupo ignorada:', phone);
        return 'Mensagem de grupo ignorada';
    }
    
    if (!botInstance) {
        console.error('[HANDLERS] Bot não inicializado');
        return 'Erro: Sistema não inicializado corretamente. Por favor, entre em contato com o suporte.';
    }
    
    // Verificar se é um comando direto
    if (message.startsWith('/')) {
        return handleDirectCommand(phone, message);
    }
    
    // Verificar se é um comando de teste
    if (message.toLowerCase().startsWith('teste:')) {
        return handleTestCommand(phone, message);
    }
    
    // Passar para o processamento normal do bot
    return botInstance.handleMessage(phone, message);
}

// Manipulador de comandos diretos
async function handleDirectCommand(phone, message) {
    console.log('[HANDLERS] Processando comando direto:', message);
    
    const command = message.split(' ')[0].toLowerCase();
    const params = message.substring(command.length).trim();
    
    // Caso especial para comando /vincular
    if (command === '/vincular') {
        console.log('[HANDLERS] Solicitação de vinculação detectada');
        return botInstance.handleMessage(phone, '/vincular');
    }
    
    // Verificar vínculo do usuário
    const formattedPhone = botInstance.formatPhoneNumber(phone);
    console.log('[HANDLERS] Buscando vínculo para:', formattedPhone);
    
    const { data: links, error } = await botInstance.supabase
        .from('whatsapp_links')
        .select('*')
        .eq('phone_number', formattedPhone);
        
    if (error) {
        console.error('[HANDLERS] Erro ao buscar vínculo:', error);
        return 'Erro ao verificar seu vínculo. Por favor, tente novamente.';
    }
    
    const link = links.find(l => l.phone_number === formattedPhone && l.is_verified);
    if (!link) {
        console.log('[HANDLERS] Vínculo não encontrado ou não verificado');
        return 'Você precisa vincular seu WhatsApp primeiro. Use o comando /vincular para começar.';
    }
    
    const userId = link.user_id;
    console.log('[HANDLERS] Vínculo encontrado para usuário:', userId);
    
    // Processar comando
    switch (command) {
        case '/help':
        case '/ajuda':
            return botInstance.getDebugCommands();
            
        case '/diagnostico':
        case '/diagnóstico':
        case '/db':
        case '/debug':
            return botInstance.testDatabase(userId);
            
        case '/testegasto':
            return botInstance.testTransactionInsertion(userId, 'gasto');
            
        case '/testereceita':
            return botInstance.testTransactionInsertion(userId, 'receita');
            
        case '/gasto':
            return handleDirectTransactionCommand(userId, 'expense', params);
            
        case '/receita':
            return handleDirectTransactionCommand(userId, 'income', params);
            
        case '/saldo':
            return botInstance.handleBalance(userId);
            
        case '/categorias':
            return botInstance.handleCategories(userId);
            
        default:
            return 'Comando não reconhecido. Use /help para ver a lista de comandos disponíveis.';
    }
}

// Manipulador de comandos de teste
async function handleTestCommand(phone, message) {
    console.log('[HANDLERS] Processando comando de teste:', message);
    
    // Extrair a mensagem após o "teste:"
    const testMessage = message.substring(message.indexOf(':') + 1).trim();
    console.log('[HANDLERS] Mensagem de teste extraída:', testMessage);
    
    try {
        // Verificar vínculo do usuário
        const formattedPhone = botInstance.formatPhoneNumber(phone);
        const { data: links, error } = await botInstance.supabase
            .from('whatsapp_links')
            .select('*')
            .eq('phone_number', formattedPhone);
            
        if (error) {
            console.error('[HANDLERS] Erro ao buscar vínculo para teste:', error);
            return 'Erro ao verificar seu vínculo. Por favor, tente novamente.';
        }
        
        const link = links.find(l => l.phone_number === formattedPhone && l.is_verified);
        console.log('[HANDLERS] Link encontrado para teste:', link);
        
        if (!link) {
            const detectionResult = await botInstance.testMessageDetection(testMessage);
            console.log('[HANDLERS] Resultado do teste sem vínculo:', detectionResult);
            return detectionResult + '\n\n⚠️ Você ainda não está vinculado. Use /vincular para começar.';
        }
        
        const detectionResult = await botInstance.testMessageDetection(testMessage);
        console.log('[HANDLERS] Resultado do teste com vínculo:', detectionResult);
        return detectionResult;
    } catch (error) {
        console.error('[HANDLERS] Erro ao processar comando de teste:', error);
        return `Erro ao processar comando de teste: ${error.message}`;
    }
}

// Manipulador de comandos diretos de transação
async function handleDirectTransactionCommand(userId, type, params) {
    console.log('[HANDLERS] Processando comando direto de transação:', type, params);
    
    // Verificar se os parâmetros estão presentes
    if (!params || params.trim() === '') {
        return `Formato incorreto. Use: /${type === 'expense' ? 'gasto' : 'receita'} [valor] [descrição]`;
    }
    
    // Extrair valor e descrição
    const parts = params.trim().split(' ');
    const valueStr = parts[0];
    const description = parts.slice(1).join(' ');
    
    // Validar valor
    const value = parseFloat(valueStr.replace(',', '.'));
    if (isNaN(value) || value <= 0) {
        return 'Valor inválido. Por favor, informe um número positivo.';
    }
    
    console.log(`[HANDLERS] Enviando transação: userId=${userId}, type=${type}, value=${value}, description=${description}`);
    
    try {
        // Processar transação usando a função existente no bot
        const result = await botInstance.processDirectTransaction(userId, type, value, description);
        console.log(`[HANDLERS] Resultado da transação: ${result}`);
        return result;
    } catch (error) {
        console.error(`[HANDLERS] Erro ao processar transação ${type}:`, error);
        return `Erro ao processar transação: ${error.message}`;
    }
}

// Exportação usando formato ES6
export {
    handleDirectCommand, handleMessage, handleTestCommand, initializeBot
};

