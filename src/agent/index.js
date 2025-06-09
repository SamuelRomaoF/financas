import dotenv from 'dotenv';
import path from 'path';
import qrcode from 'qrcode-terminal';
import { fileURLToPath } from 'url';
import { Client } from 'whatsapp-web.js';
import FinanceAgent from './bot.js';
import { initializeBot } from './handlers.js';

// Obter o diretório atual para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega as variáveis de ambiente com caminho relativo
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Obtém as credenciais do Supabase das variáveis de ambiente
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key disponível:', supabaseKey ? 'Sim' : 'Não');

// Inicializa o agente financeiro
let agentInstance;

try {
    // Inicializa o bot usando os handlers
    console.log('[INDEX] Inicializando bot com handlers...');
    const initialized = initializeBot(supabaseUrl, supabaseKey);
    
    if (!initialized) {
        console.error('[INDEX] Falha ao inicializar bot com handlers, tentando inicialização clássica');
        // Fallback para inicialização clássica
        agentInstance = new FinanceAgent(supabaseUrl, supabaseKey);
    } else {
        console.log('[INDEX] Bot inicializado com handlers com sucesso!');
    }
} catch (error) {
    console.error('Erro ao inicializar o agente:', error);
    throw new Error('Falha ao inicializar o agente financeiro');
}

// Inicializa o cliente WhatsApp
const client = new Client({
    puppeteer: {
        args: ['--no-sandbox'],
    }
});

// Evento de geração do QR code
client.on('qr', (qr) => {
    console.log('QR Code gerado:');
    qrcode.generate(qr, { small: true });
});

// Evento de autenticação
client.on('authenticated', () => {
    console.log('Autenticado com sucesso!');
});

// Evento quando está pronto
client.on('ready', () => {
    console.log('Cliente WhatsApp pronto e conectado!');
});

// Evento de recebimento de mensagem
client.on('message', async (msg) => {
    try {
        const from = msg.from;
        const body = msg.body;
        
        // Rejeita mensagens de grupos (terminam com @g.us) antes de qualquer processamento
        if (from.includes('@g.us')) {
            console.log(`Mensagem de grupo ignorada: ${from}`);
            return; // Sai imediatamente, sem nenhum processamento
        }
        
        console.log('====== NOVA MENSAGEM ======');
        console.log(`De: ${from}`);
        console.log(`Conteúdo: ${body}`);
        
        // Formata o número para remover o sufixo @c.us
        const formattedPhone = from.split('@')[0];
        
        // Verifica as credenciais do Supabase
        console.log(`Verificando credenciais Supabase:`);
        console.log(`URL: ${supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'Não definido'}`);
        console.log(`Key: ${supabaseKey ? 'Definida' : 'Não definida'}`);
        
        if (!supabaseUrl || !supabaseKey) {
            console.error('ERRO: Credenciais do Supabase não encontradas no .env');
            await client.sendMessage(from, 'Erro de configuração. Por favor, entre em contato com o suporte.');
            return;
        }
        
        // Cria instância do bot
        const botInstance = new FinanceAgent(supabaseUrl, supabaseKey);
        
        // Verifica se o usuário já está vinculado
        console.log(`Verificando vínculo para o telefone: ${formattedPhone}`);
        const link = await botInstance.verificarVinculo(formattedPhone);
        console.log(`Resultado da verificação: ${link ? 'Vinculado' : 'Não vinculado'}`);
        
        if (link) {
            console.log(`Usuário vinculado: ${link.user_id}`);
        }
        
        let response = '';
        
        // Processamento de comandos
        if (body.toLowerCase().startsWith('/vincular')) {
            console.log('Comando de vinculação detectado');
            response = await botInstance.handleLinkRequest(formattedPhone);
        } 
        else if (body.toLowerCase().startsWith('/gasto')) {
            console.log('Comando de gasto detectado');
            
            if (!link || !link.is_verified) {
                response = "Você precisa vincular sua conta primeiro. Use /vincular para começar.";
            } else {
                const params = body.substring('/gasto'.length).trim();
                console.log(`Parâmetros de gasto: "${params}"`);
                
                // Extrair valor usando regex
                const valorRegex = /\d+([.,]\d{1,2})?/;
                const valorMatch = params.match(valorRegex);
                
                if (!valorMatch) {
                    response = "Não consegui identificar o valor. Use o formato: /gasto [valor] [categoria]";
                } else {
                    const valor = parseFloat(valorMatch[0].replace(',', '.'));
                    // Extrai a categoria - tudo após o valor
                    const categoriaText = params.substring(params.indexOf(valorMatch[0]) + valorMatch[0].length).trim();
                    
                    console.log(`Processando gasto: valor=${valor}, categoria="${categoriaText}"`);
                    
                    try {
                        response = await botInstance.processDirectTransaction(
                            link.user_id, 
                            'expense', 
                            valor, 
                            categoriaText || 'Outros'
                        );
                    } catch (error) {
                        console.error('Erro ao processar gasto:', error);
                        response = `Erro ao processar gasto: ${error.message}`;
                    }
                }
            }
        }
        else if (body.toLowerCase().startsWith('/receita')) {
            console.log('Comando de receita detectado');
            
            if (!link || !link.is_verified) {
                response = "Você precisa vincular sua conta primeiro. Use /vincular para começar.";
            } else {
                const params = body.substring('/receita'.length).trim();
                console.log(`Parâmetros de receita: "${params}"`);
                
                // Extrair valor usando regex
                const valorRegex = /\d+([.,]\d{1,2})?/;
                const valorMatch = params.match(valorRegex);
                
                if (!valorMatch) {
                    response = "Não consegui identificar o valor. Use o formato: /receita [valor] [categoria]";
                } else {
                    const valor = parseFloat(valorMatch[0].replace(',', '.'));
                    // Extrai a categoria - tudo após o valor
                    const categoriaText = params.substring(params.indexOf(valorMatch[0]) + valorMatch[0].length).trim();
                    
                    console.log(`Processando receita: valor=${valor}, categoria="${categoriaText}"`);
                    
                    try {
                        response = await botInstance.processDirectTransaction(
                            link.user_id, 
                            'income', 
                            valor, 
                            categoriaText || 'Salário'
                        );
                    } catch (error) {
                        console.error('Erro ao processar receita:', error);
                        response = `Erro ao processar receita: ${error.message}`;
                    }
                }
            }
        }
        else if (body.toLowerCase().startsWith('/saldo')) {
            console.log('Comando de saldo detectado');
            
            if (!link || !link.is_verified) {
                response = "Você precisa vincular sua conta primeiro. Use /vincular para começar.";
            } else {
                response = await botInstance.mostrarSaldo(link.user_id);
            }
        }
        else if (body.toLowerCase().startsWith('/categorias')) {
            console.log('Comando de categorias detectado');
            
            if (!link || !link.is_verified) {
                response = "Você precisa vincular sua conta primeiro. Use /vincular para começar.";
            } else {
                response = await botInstance.listarCategorias(link.user_id);
            }
        }
        else if (body.toLowerCase().startsWith('/ajuda')) {
            response = `📱 *Comandos disponíveis:*
/vincular - Vincular seu WhatsApp à conta
/gasto [valor] [categoria] - Registrar um gasto
/receita [valor] [categoria] - Registrar uma receita
/saldo - Consultar seu saldo atual
/categorias - Listar suas categorias
/ajuda - Ver esta mensagem de ajuda`;
        }
        else {
            // Tenta identificar comandos em formato natural
            if (link && link.is_verified) {
                // Usuário já está vinculado, verificar padrões naturais
                const lowerMsg = body.toLowerCase();
                
                // Padrões de gastos: mais variações e expressões comuns
                if (lowerMsg.includes('gastei') || 
                    lowerMsg.includes('gasto') || 
                    lowerMsg.includes('paguei') || 
                    lowerMsg.includes('comprei') || 
                    lowerMsg.includes('usei') || 
                    lowerMsg.includes('desembolsei') ||
                    lowerMsg.includes('pago') ||
                    lowerMsg.includes('conta') ||
                    lowerMsg.includes('despesa') ||
                    lowerMsg.includes('débito') ||
                    lowerMsg.includes('debito') ||
                    lowerMsg.includes('compra') ||
                    lowerMsg.includes('fatura') ||
                    lowerMsg.includes('pagamento')) {
                    
                    console.log('Padrão natural de gasto detectado');
                    
                    // Extrair valor usando regex mais abrangente
                    const valorRegex = /\d+([.,]\d{1,2})?/;
                    const valorMatch = lowerMsg.match(valorRegex);
                    
                    if (valorMatch) {
                        const valor = parseFloat(valorMatch[0].replace(',', '.'));
                        let categoria = '';
                        
                        // Tentar extrair categoria com mais preposições e contexto
                        if (lowerMsg.includes(' com ')) {
                            categoria = lowerMsg.substring(lowerMsg.indexOf(' com ') + 5).trim();
                        } else if (lowerMsg.includes(' em ')) {
                            categoria = lowerMsg.substring(lowerMsg.indexOf(' em ') + 4).trim();
                        } else if (lowerMsg.includes(' no ')) {
                            categoria = lowerMsg.substring(lowerMsg.indexOf(' no ') + 4).trim();
                        } else if (lowerMsg.includes(' na ')) {
                            categoria = lowerMsg.substring(lowerMsg.indexOf(' na ') + 4).trim();
                        } else if (lowerMsg.includes(' de ')) {
                            categoria = lowerMsg.substring(lowerMsg.indexOf(' de ') + 4).trim();
                        } else if (lowerMsg.includes(' para ')) {
                            categoria = lowerMsg.substring(lowerMsg.indexOf(' para ') + 6).trim();
                        } else if (lowerMsg.includes(' do ')) {
                            categoria = lowerMsg.substring(lowerMsg.indexOf(' do ') + 4).trim();
                        } else if (lowerMsg.includes(' da ')) {
                            categoria = lowerMsg.substring(lowerMsg.indexOf(' da ') + 4).trim();
                        }
                        
                        // Se não encontrou categoria por preposição, tenta extrair palavra relevante
                        if (!categoria) {
                            // Remover palavras comuns e analisar o restante
                            const commonWords = ['gastei', 'gasto', 'paguei', 'comprei', 'reais', 'reais', 'pago', 'conta', 'despesa', 'débito', 'debito', 'compra', 'rs', 'r$'];
                            const words = lowerMsg.split(' ');
                            
                            // Remover números e palavras comuns
                            const filtered = words.filter(word => 
                                !commonWords.includes(word) && 
                                !word.match(/^\d+([.,]\d{1,2})?$/) &&
                                word.length > 2
                            );
                            
                            if (filtered.length > 0) {
                                // Usar a primeira palavra relevante como categoria
                                categoria = filtered[0];
                            }
                        }
                        
                        console.log(`Detectado gasto: valor=${valor}, categoria="${categoria}"`);
                        
                        try {
                            response = await botInstance.processDirectTransaction(
                                link.user_id, 
                                'expense', 
                                valor, 
                                categoria
                            );
                        } catch (error) {
                            console.error('Erro ao processar gasto natural:', error);
                            response = `Erro ao registrar gasto: ${error.message}`;
                        }
                    } else {
                        response = "Não consegui identificar o valor. Por favor, especifique o valor do gasto (ex: gastei 50 com restaurante)";
                    }
                }
                // Padrões de receita: mais variações e expressões comuns
                else if (lowerMsg.includes('recebi') || 
                         lowerMsg.includes('receita') || 
                         lowerMsg.includes('ganhei') || 
                         lowerMsg.includes('rendimento') ||
                         lowerMsg.includes('recebimento') ||
                         lowerMsg.includes('entrada') ||
                         lowerMsg.includes('salário') || 
                         lowerMsg.includes('salario') ||
                         lowerMsg.includes('depositou') ||
                         lowerMsg.includes('depositado') ||
                         lowerMsg.includes('depósito') ||
                         lowerMsg.includes('deposito') ||
                         lowerMsg.includes('crédito') ||
                         lowerMsg.includes('credito') ||
                         lowerMsg.includes('pagou') ||
                         lowerMsg.includes('transferiu') ||
                         lowerMsg.includes('transferência') ||
                         lowerMsg.includes('transferencia')) {
                    
                    console.log('Padrão natural de receita detectado');
                    
                    // Extrair valor usando regex
                    const valorRegex = /\d+([.,]\d{1,2})?/;
                    const valorMatch = lowerMsg.match(valorRegex);
                    
                    if (valorMatch) {
                        const valor = parseFloat(valorMatch[0].replace(',', '.'));
                        let categoria = '';
                        
                        // Tentar extrair categoria com mais preposições e contexto
                        if (lowerMsg.includes(' de ')) {
                            categoria = lowerMsg.substring(lowerMsg.indexOf(' de ') + 4).trim();
                        } else if (lowerMsg.includes(' do ')) {
                            categoria = lowerMsg.substring(lowerMsg.indexOf(' do ') + 4).trim();
                        } else if (lowerMsg.includes(' da ')) {
                            categoria = lowerMsg.substring(lowerMsg.indexOf(' da ') + 4).trim();
                        } else if (lowerMsg.includes(' como ')) {
                            categoria = lowerMsg.substring(lowerMsg.indexOf(' como ') + 6).trim();
                        } else if (lowerMsg.includes(' por ')) {
                            categoria = lowerMsg.substring(lowerMsg.indexOf(' por ') + 5).trim();
                        } else if (lowerMsg.includes(' em ')) {
                            categoria = lowerMsg.substring(lowerMsg.indexOf(' em ') + 4).trim();
                        }
                        
                        // Se não encontrou categoria por preposição, tenta extrair palavra relevante
                        if (!categoria) {
                            // Remover palavras comuns e analisar o restante
                            const commonWords = ['recebi', 'receita', 'ganhei', 'rendimento', 'recebimento', 'entrada', 'salário', 'salario', 'depositou', 'depositado', 'depósito', 'deposito', 'reais', 'r$', 'rs'];
                            const words = lowerMsg.split(' ');
                            
                            // Remover números e palavras comuns
                            const filtered = words.filter(word => 
                                !commonWords.includes(word) && 
                                !word.match(/^\d+([.,]\d{1,2})?$/) &&
                                word.length > 2
                            );
                            
                            if (filtered.length > 0) {
                                // Usar a primeira palavra relevante como categoria
                                categoria = filtered[0];
                            }
                        }
                        
                        console.log(`Detectada receita: valor=${valor}, categoria="${categoria}"`);
                        
                        try {
                            response = await botInstance.processDirectTransaction(
                                link.user_id, 
                                'income', 
                                valor, 
                                categoria
                            );
                        } catch (error) {
                            console.error('Erro ao processar receita natural:', error);
                            response = `Erro ao registrar receita: ${error.message}`;
                        }
                    } else {
                        response = "Não consegui identificar o valor. Por favor, especifique o valor da receita (ex: recebi 2000 de salário)";
                    }
                }
                // Comando natural para saldo
                else if (lowerMsg.includes('saldo') || lowerMsg.includes('quanto tenho')) {
                    console.log('Padrão natural de saldo detectado');
                    response = await botInstance.mostrarSaldo(link.user_id);
                }
                // Comando natural para categorias
                else if (lowerMsg.includes('categorias') || lowerMsg.includes('categoria')) {
                    console.log('Padrão natural de categorias detectado');
                    response = await botInstance.listarCategorias(link.user_id);
                }
                else {
                    // Mensagem genérica para usuário vinculado
                    response = `Olá! Por favor, use um dos comandos disponíveis:

/gasto [valor] [categoria] - Registrar gasto
/receita [valor] [categoria] - Registrar receita
/saldo - Ver saldo
/categorias - Ver categorias
/ajuda - Ver todos os comandos

Você também pode usar linguagem natural como:
"Gastei 50 com restaurante" ou "Recebi 2000 de salário"`;
                }
            } else {
                // Usuário não vinculado, instruir a vincular
                response = "Você precisa vincular sua conta primeiro. Use /vincular para começar.";
            }
        }
        
        console.log(`Resposta final: ${response}`);
        await client.sendMessage(from, response);
        console.log('====== FIM DE PROCESSAMENTO ======');
    } catch (error) {
        console.error('ERRO CRÍTICO no processamento da mensagem:', error);
        try {
            await client.sendMessage(msg.from, 'Ocorreu um erro crítico. Por favor, tente novamente.');
        } catch (sendError) {
            console.error('Não foi possível enviar mensagem de erro:', sendError);
        }
    }
});

// Inicializa o cliente WhatsApp
console.log('Iniciando cliente WhatsApp...');
client.initialize();

// Exporta o agente financeiro para uso em outros módulos
export default FinanceAgent; 