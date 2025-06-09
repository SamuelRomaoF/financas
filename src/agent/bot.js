import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateVerificationCode } from './utils.js';

// Obter o diretório atual para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurar dotenv com caminho relativo
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export default class FinanceAgent {
    constructor(supabaseUrl, supabaseKey) {
        console.log('[BOT] Inicializando Supabase com URL:', supabaseUrl);
        console.log('[BOT] Chave do Supabase disponível:', supabaseKey ? 'Sim' : 'Não');
        
        if (!supabaseUrl || !supabaseKey) {
            console.error('[BOT] ERRO: Credenciais do Supabase não fornecidas');
            throw new Error('Credenciais do Supabase não fornecidas');
        }
        
        try {
            // Criar cliente Supabase
            this.supabase = createClient(supabaseUrl, supabaseKey);
            this.supabaseUrl = supabaseUrl;
            this.supabaseKey = supabaseKey;
            
            // Verificar se o cliente foi criado corretamente
            if (!this.supabase) {
                throw new Error('Cliente Supabase não foi inicializado corretamente');
            }
            
            console.log('[BOT] Cliente Supabase inicializado com sucesso');
        } catch (error) {
            console.error('[BOT] Erro ao inicializar cliente Supabase:', error);
            throw new Error(`Falha ao inicializar Supabase: ${error.message}`);
        }
    }

    // Método para testar a conexão com o Supabase
    async testConnection() {
        try {
            console.log('[BOT] Testando conexão com o Supabase...');
            const { data, error } = await this.supabase
                .from('categories')
                .select('count')
                .limit(1);
                
            if (error) {
                console.error('[BOT] Erro no teste de conexão:', error);
                return false;
            }
            
            console.log('[BOT] Conexão com Supabase testada com sucesso');
            return true;
        } catch (error) {
            console.error('[BOT] Exceção no teste de conexão:', error);
            return false;
        }
    }

    // Função auxiliar para formatar número de telefone
    formatPhoneNumber(phoneNumber) {
        // Remove todos os caracteres não numéricos
        let numbers = phoneNumber.replace(/\D/g, '');
        
        // Remove o prefixo '@c.us' que o WhatsApp adiciona
        numbers = numbers.replace('@c.us', '');

        // Se começar com +55, remove o +
        if (numbers.startsWith('+55')) {
            numbers = numbers.substring(1);
        }
        
        // Se não começar com 55, adiciona
        if (!numbers.startsWith('55')) {
            numbers = `55${numbers}`;
        }

        console.log('Número original:', phoneNumber);
        console.log('Número formatado:', numbers);
        
        return numbers;
    }

    async handleMessage(phoneNumber, message) {
        try {
            // Formata o número antes de verificar
            const formattedPhone = this.formatPhoneNumber(phoneNumber);
            console.log('[DEBUG PRINCIPAL] Recebida mensagem:', message, 'de:', formattedPhone);

            // Verifica se é um comando de status
            const isStatusCheck = message.toLowerCase().includes('status') || 
                                this.isConsultaVinculo(message.toLowerCase());

            // Primeira verificação rápida
            const { data: initialLinks, error: initialError } = await this.supabase
                .from('whatsapp_links')
                .select('*');

            if (initialError) {
                console.error('Erro na verificação inicial:', initialError);
                throw initialError;
            }

            // Encontra o vínculo inicial
            const initialLink = initialLinks.find(l => l.phone_number === formattedPhone);
            console.log('[DEBUG PRINCIPAL] Vínculo encontrado:', initialLink);

            // Se encontrou vínculo verificado, não precisa fazer retry
            if (initialLink && initialLink.is_verified) {
                console.log('[DEBUG PRINCIPAL] Vínculo verificado encontrado - chamando handleVerifiedUser com:', initialLink.user_id, message);
                return this.handleVerifiedUser(initialLink.user_id, message);
            }

            // Se não é comando de status, responde rápido
            if (!isStatusCheck) {
                console.log('Não é comando de status - resposta rápida');
                return this.handleUnverifiedUser(formattedPhone, message, initialLink);
            }

            // Se é comando de status, faz verificação com retry
            const fetchLinks = async (attempt = 1, maxAttempts = 5) => {
                console.log(`Tentativa ${attempt} de ${maxAttempts} para confirmar status...`);
                const { data: links, error: searchError } = await this.supabase
                    .from('whatsapp_links')
                    .select('*');

                if (searchError) {
                    console.error(`Erro na tentativa ${attempt}:`, searchError);
                    if (attempt < maxAttempts) {
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        return fetchLinks(attempt + 1, maxAttempts);
                    }
                    throw searchError;
                }

                const link = links.find(l => l.phone_number === formattedPhone);
                console.log(`Status do vínculo na tentativa ${attempt}:`, link);

                // Se encontrou vínculo verificado, retorna imediatamente
                if (link && link.is_verified) {
                    console.log('Vínculo verificado encontrado!');
                    return links;
                }

                // Se não encontrou e ainda tem tentativas, continua
                if (attempt < maxAttempts) {
                    console.log('Aguardando confirmação de vínculo...');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    return fetchLinks(attempt + 1, maxAttempts);
                }

                return links;
            };

            // Faz a verificação com retry apenas para comando de status
            const links = await fetchLinks();
            console.log('Resposta final do Supabase:', links);

            const link = links.find(l => l.phone_number === formattedPhone);
            console.log('Link final encontrado:', link);

            if (!link || !link.is_verified) {
                return this.handleUnverifiedUser(formattedPhone, message, link);
            }

            return this.handleVerifiedUser(link.user_id, message);
        } catch (error) {
            console.error('[DEBUG PRINCIPAL] Erro crítico no handleMessage:', error);
            return 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.';
        }
    }

    async handleVerifiedUser(userId, message) {
        try {
            const msgLower = message.toLowerCase().trim();
            const userPlan = await this.getUserPlan(userId);
            
            console.log('[DEBUG] handleVerifiedUser - mensagem:', message, 'plano:', userPlan);
            
            // Comandos de diagnóstico (começam com '/')
            if (msgLower === '/diagnostico' || msgLower === '/diagnóstico' || 
                msgLower === 'diagnostico' || msgLower === 'diagnóstico' ||
                msgLower === '/db' || msgLower === '/test' || msgLower === '/teste' ||
                msgLower === 'debug' || msgLower === '/debug') {
                console.log('[DEBUG] Comando de diagnóstico de banco de dados detectado:', msgLower);
                return this.testDatabase(userId);
            }
            
            // Comandos de teste de mensagem
            if (msgLower.startsWith('teste:') || msgLower.startsWith('test:')) {
                const testMessage = message.substring(message.indexOf(':') + 1).trim();
                console.log('[DEBUG] Comando de teste de mensagem detectado:', testMessage);
                return this.testMessageDetection(testMessage);
            }
            
            // Funcionalidades básicas (disponíveis para todos)
        if (this.isGasto(msgLower)) {
                console.log('[DEBUG] Detectou gasto');
            return this.processarGasto(userId, message);
        }

        if (this.isConsultaSaldo(msgLower)) {
                console.log('[DEBUG] Detectou consulta de saldo');
            return this.handleBalance(userId);
        }

        if (this.isConsultaCategorias(msgLower)) {
                console.log('[DEBUG] Detectou consulta de categorias');
            return this.handleCategories(userId);
        }

            if (this.isConsultaVinculo(msgLower)) {
                console.log('[DEBUG] Detectou consulta de vínculo');
                return this.verificarStatusVinculo(userId);
            }
            
            // Permitir adicionar receitas para todos os planos
            if (this.isAdicionarReceita(msgLower)) {
                console.log('[DEBUG] Detectou adição de receita');
                return this.processarReceita(userId, message);
            }
            
            // Verificar se é um pedido de upgrade
            if (this.isUpgradeRequest(msgLower)) {
                console.log('[DEBUG] Detectou pedido de upgrade');
                return this.handleUpgradeRequest(userPlan);
            }

            // Funcionalidades do plano básico
            if (userPlan === 'basic' || userPlan === 'premium') {
        if (this.isConsultaRelatorio(msgLower)) {
                    console.log('[DEBUG] Detectou consulta de relatório');
            return this.handleReport(userId);
                }
            }

            // Funcionalidades exclusivas do plano premium
            if (userPlan === 'premium') {
                if (this.isConsultaInvestimentos(msgLower)) {
                    console.log('[DEBUG] Detectou consulta de investimentos');
                    return this.handleInvestments(userId);
                }
                
                if (this.isConsultaCartaoCredito(msgLower)) {
                    console.log('[DEBUG] Detectou consulta de cartão de crédito');
                    return this.handleCreditCards(userId);
                }

                if (this.isConsultaMetas(msgLower)) {
                    console.log('[DEBUG] Detectou consulta de metas');
                    return this.handleGoals(userId, message);
                }
        }

        // Se chegou aqui, é uma mensagem genérica
            console.log('[DEBUG] Mensagem genérica, retornando boas-vindas');
            return this.getWelcomeMessage(userId);
        } catch (error) {
            console.error('[DEBUG] Erro no handleVerifiedUser:', error);
            return 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.';
        }
    }

    async getWelcomeMessage(userId) {
        const userPlan = await this.getUserPlan(userId);
        
        let welcomeMessage = `Boa tarde! 👋 Bem-vindo(a) ao seu assistente financeiro!\n\nPosso te ajudar com:\n`;
        
        // Funcionalidades básicas (disponíveis para todos)
        welcomeMessage += `📝 Registrar gastos (ex: "gastei 20 no uber")\n`;
        welcomeMessage += `💰 Ver seu saldo (ex: "mostrar saldo")\n`;
        welcomeMessage += `📋 Listar categorias (ex: "ver categorias")\n`;
        welcomeMessage += `💸 Registrar receitas (ex: "recebi 2000 de salário")\n`;
        
        if (userPlan === 'free') {
            welcomeMessage += `\nVocê está no plano FREE. Para acessar mais recursos, digite "upgrade".`;
        } else if (userPlan === 'basic') {
            welcomeMessage += `\n📊 Pedir um relatório (ex: "me mostra o resumo do mês")\n`;
            welcomeMessage += `\nVocê está no plano BASIC. Para acessar recursos premium, digite "upgrade".`;
        } else if (userPlan === 'premium') {
            welcomeMessage += `\n📊 Pedir um relatório (ex: "me mostra o resumo do mês")\n`;
            welcomeMessage += `📈 Consultar investimentos (ex: "mostrar investimentos")\n`;
            welcomeMessage += `💳 Ver cartões de crédito (ex: "mostrar cartões")\n`;
            welcomeMessage += `🎯 Gerenciar metas (ex: "minhas metas")\n`;
            welcomeMessage += `\nVocê está no plano PREMIUM. Aproveite todos os recursos!`;
        }
        
        return welcomeMessage;
    }

    getPlanInfoMessage(userPlan) {
        let planMessage = '';
        
        if (userPlan === 'free') {
            planMessage = `No plano FREE você pode:\n` +
                `✅ Registrar gastos\n` +
                `✅ Consultar seu saldo\n` +
                `✅ Listar categorias\n` +
                `✅ Registrar receitas\n\n` +
                `Para ter acesso a relatórios e mais funcionalidades, faça upgrade para o plano BASIC ou PREMIUM.`;
        } else if (userPlan === 'basic') {
            planMessage = `No plano BASIC você pode:\n` +
                `✅ Registrar gastos e receitas\n` +
                `✅ Consultar seu saldo\n` +
                `✅ Listar categorias\n` +
                `✅ Gerar relatórios detalhados\n\n` +
                `Para ter acesso a investimentos, cartões de crédito e metas, faça upgrade para o plano PREMIUM.`;
        } else if (userPlan === 'premium') {
            planMessage = `No plano PREMIUM você tem acesso a todas as funcionalidades:\n` +
                `✅ Registrar gastos e receitas\n` +
                `✅ Consultar seu saldo\n` +
                `✅ Listar categorias\n` +
                `✅ Gerar relatórios detalhados\n` +
                `✅ Gerenciar investimentos\n` +
                `✅ Controlar cartões de crédito\n` +
                `✅ Definir e acompanhar metas financeiras`;
        }
        
        return planMessage;
    }

    mensagemBoasVindasUsuarioVerificado() {
        const hora = new Date().getHours();
        let saudacao = '';

        if (hora >= 5 && hora < 12) {
            saudacao = 'Bom dia';
        } else if (hora >= 12 && hora < 18) {
            saudacao = 'Boa tarde';
        } else {
            saudacao = 'Boa noite';
        }

        return `${saudacao}! 👋 Bem-vindo(a) novamente ao seu assistente financeiro!\n\nPosso te ajudar com:\n\n` +
               '📝 Registrar gastos (ex: "gastei 20 reais no uber")\n' +
               '💰 Ver seu saldo (ex: "mostrar saldo")\n' +
               '📊 Gerar relatórios (ex: "relatório do mês")\n' +
               '🏷️ Listar categorias (ex: "ver categorias")\n\n' +
               'Como posso te ajudar hoje?';
    }

    mensagemBoasVindasUsuarioVerificadoPorPlano(plano) {
        const hora = new Date().getHours();
        let saudacao = '';

        if (hora >= 5 && hora < 12) {
            saudacao = 'Bom dia';
        } else if (hora >= 12 && hora < 18) {
            saudacao = 'Boa tarde';
        } else {
            saudacao = 'Boa noite';
        }

        let mensagem = `${saudacao}! 👋 Bem-vindo(a) ao seu assistente financeiro!\n\nPosso te ajudar com:\n\n` +
                    '📝 Registrar gastos (ex: "gastei 20 no uber")\n' +
                    '💰 Ver seu saldo (ex: "mostrar saldo")\n' +
                    '🏷️ Listar categorias (ex: "ver categorias")\n' +
                    '💸 Registrar receitas (ex: "recebi 2000 de salário")\n';

        if (plano === 'basic' || plano === 'premium') {
            mensagem += '📊 Gerar relatórios (ex: "relatório do mês")\n';
        }

        if (plano === 'premium') {
            mensagem += '📈 Consultar investimentos (ex: "meus investimentos")\n' +
                        '💳 Gerenciar cartões (ex: "fatura do cartão")\n' +
                        '🎯 Acompanhar metas (ex: "minhas metas")\n';
        }

        mensagem += `\nVocê está no plano ${plano.toUpperCase()}. `;
        
        if (plano !== 'premium') {
            mensagem += 'Para acessar mais recursos, digite "upgrade".';
        }

        return mensagem;
    }

    mensagemRecursoPremium(recurso, planoNecessario) {
        return `⭐ Este recurso é exclusivo para assinantes do plano ${planoNecessario.toUpperCase()}.\n\n` +
            `Para acessar ${recurso} e outras funcionalidades, faça upgrade do seu plano em:\n` +
            `app.financas.com/planos\n\n` +
            `Ou digite "upgrade" para conhecer os benefícios de cada plano.`;
    }

    async handleUnverifiedUser(phoneNumber, message, existingLink) {
        console.log('[BOT] Tratando usuário não verificado:', phoneNumber);
        console.log('[BOT] Mensagem recebida:', message);
        console.log('[BOT] Link existente:', existingLink);
        
        // Lista de palavras que indicam intenção de vincular
        const vinculationWords = ['vincular', 'conectar', 'registrar', 'começar', 'iniciar'];
        const hasVinculationIntent = vinculationWords.some(word => message.toLowerCase().includes(word));
        const isVinculationCommand = message.toLowerCase() === '/vincular';

        if (isVinculationCommand || hasVinculationIntent) {
            try {
                console.log('[BOT] Detectada intenção de vincular');
                // Busca novamente para garantir dados atualizados
                const { data: currentLink, error: searchError } = await this.supabase
                    .from('whatsapp_links')
                    .select('*')
                    .eq('phone_number', phoneNumber)
                    .maybeSingle();

                if (searchError) {
                    console.error('[BOT] Erro ao buscar link:', searchError);
                    throw searchError;
                }

                // Se já existe um link não verificado, retorna o mesmo código
                if (currentLink && !currentLink.is_verified) {
                    console.log('[BOT] Link pendente encontrado:', currentLink);
                    return `Você já possui um código de verificação pendente: ${currentLink.verification_code}\n\nPor favor, acesse seu dashboard e insira este código para vincular seu WhatsApp.`;
                }

                // Se o número já está vinculado a outro usuário
                if (currentLink && currentLink.is_verified) {
                    console.log('[BOT] Número já vinculado:', currentLink);
                    return 'Este número já está vinculado a uma conta. Se você deseja desvincular, acesse seu dashboard.';
                }

                // Se chegou aqui, ou não existe link ou precisa atualizar
                const code = generateVerificationCode();
                console.log('[BOT] Gerando novo código:', code);

                if (currentLink) {
                    // Atualiza o link existente
                    console.log('[BOT] Atualizando link existente');
                    const { error: updateError } = await this.supabase
                        .from('whatsapp_links')
                        .update({
                            verification_code: code,
                            is_verified: false,
                            created_at: new Date().toISOString()
                        })
                        .eq('phone_number', phoneNumber);

                    if (updateError) {
                        console.error('[BOT] Erro ao atualizar link:', updateError);
                        throw updateError;
                    }
                } else {
                    // Cria um novo link
                    console.log('[BOT] Criando novo link');
                    const { error: insertError } = await this.supabase
                        .from('whatsapp_links')
                        .insert({
                            phone_number: phoneNumber,
                            verification_code: code,
                            is_verified: false,
                            created_at: new Date().toISOString()
                        });

                    if (insertError) {
                        console.error('[BOT] Erro ao inserir link:', insertError);
                        throw insertError;
                    }
                }

                return `Por favor, acesse seu dashboard e insira o código: ${code}`;
            } catch (error) {
                console.error('[BOT] Erro ao gerar código de verificação:', error);
                return 'Desculpe, ocorreu um erro ao gerar o código de verificação. Tente novamente.';
            }
        }

        return 'Olá! Para começar a usar o assistente financeiro, me diga que quer vincular sua conta ou use o comando /vincular';
    }

    isSaudacao(msg) {
        const saudacoes = ['oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'hey', 'ei'];
        return saudacoes.some(s => msg.includes(s));
    }

    responderSaudacao(msg) {
        const hora = new Date().getHours();
        let saudacao = '';

        if (hora >= 5 && hora < 12) {
            saudacao = 'Bom dia';
        } else if (hora >= 12 && hora < 18) {
            saudacao = 'Boa tarde';
        } else {
            saudacao = 'Boa noite';
        }

        return `${saudacao}! 😊 Como posso ajudar você hoje?\n\nVocê pode me contar sobre:\n- Seus gastos (ex: "gastei 20 reais no uber")\n- Suas receitas (ex: "recebi 2000 de salário")\n- Consultar seu saldo (ex: "qual meu saldo?")\n- Ver suas categorias (ex: "mostra as categorias")\n- Pedir um relatório (ex: "me mostra o resumo do mês")`;
    }

    isGasto(msg) {
        // Verificação simplificada focada em casos comuns
        if (msg.includes('gastei') && /\d+/.test(msg)) {
            console.log('[DEBUG] isGasto - Detectou padrão "gastei + número"');
            return true;
        }
        
        if (msg.includes('gasto') && /\d+/.test(msg)) {
            console.log('[DEBUG] isGasto - Detectou padrão "gasto + número"');
            return true;
        }
        
        if (msg.includes('paguei') && /\d+/.test(msg)) {
            console.log('[DEBUG] isGasto - Detectou padrão "paguei + número"');
            return true;
        }
        
        console.log('[DEBUG] isGasto - Nenhum padrão de gasto detectado');
        return false;
    }

    isConsultaSaldo(msg) {
        const saldoIndicators = [
            'saldo', 'quanto tenho', 'quanto tem', 'disponível',
            'disponivel', 'conta', 'extrato', 'mostrar saldo',
            'ver saldo', 'qual o saldo', 'quanto sobrou'
        ];
        return saldoIndicators.some(indicator => msg.includes(indicator));
    }

    isConsultaCategorias(msg) {
        const categoriasIndicators = [
            'categoria', 'categorias', 'tipos de gasto',
            'tipos de despesa', 'onde posso gastar', 'quais categorias',
            'lista de categorias'
        ];
        return categoriasIndicators.some(indicator => msg.includes(indicator));
    }

    isConsultaRelatorio(msg) {
        const relatorioIndicators = [
            'relatório', 'relatorio', 'resumo', 'balanço',
            'balanco', 'gastos do mês', 'gastos do mes',
            'quanto gastei', 'resumo mensal', 'extrato mensal'
        ];
        return relatorioIndicators.some(indicator => msg.includes(indicator));
    }

    isConsultaVinculo(msg) {
        const vinculoIndicators = [
            'estou vinculado',
            'está vinculado',
            'tá vinculado',
            'ta vinculado',
            'foi vinculado',
            'deu certo',
            'funcionou',
            'status',
            'verificar vínculo',
            'verificar vinculo'
        ];
        return vinculoIndicators.some(indicator => msg.includes(indicator));
    }

    isAdicionarReceita(msg) {
        // Verificação simplificada focada em casos comuns
        if (msg.includes('recebi') && /\d+/.test(msg)) {
            console.log('[DEBUG] isAdicionarReceita - Detectou padrão "recebi + número"');
            return true;
        }
        
        if (msg.includes('salário') && /\d+/.test(msg)) {
            console.log('[DEBUG] isAdicionarReceita - Detectou padrão "salário + número"');
            return true;
        }
        
        if (msg.includes('salario') && /\d+/.test(msg)) {
            console.log('[DEBUG] isAdicionarReceita - Detectou padrão "salario + número"');
            return true;
        }
        
        console.log('[DEBUG] isAdicionarReceita - Nenhum padrão de receita detectado');
        return false;
    }

    isConsultaInvestimentos(msg) {
        const investimentosIndicators = [
            'investimento', 'investimentos', 'aplicação', 'aplicacoes',
            'rendimento', 'rendimentos', 'carteira', 'ações', 'acoes',
            'renda fixa', 'tesouro', 'cdb', 'lci', 'lca'
        ];
        return investimentosIndicators.some(indicator => msg.includes(indicator));
    }

    isConsultaCartaoCredito(msg) {
        const cartaoIndicators = [
            'cartão', 'cartao', 'crédito', 'credito', 'fatura',
            'limite', 'compra', 'parcelamento', 'parcela'
        ];
        return cartaoIndicators.some(indicator => msg.includes(indicator));
    }

    isGerenciarMetas(msg) {
        const metasIndicators = [
            'meta', 'metas', 'objetivo', 'objetivos', 'economizar',
            'guardar', 'poupar', 'poupança', 'poupanca', 'reserva'
        ];
        return metasIndicators.some(indicator => msg.includes(indicator));
    }

    isUpgrade(msg) {
        return msg.toLowerCase().includes('upgrade') || 
               msg.toLowerCase().includes('plano') || 
               msg.toLowerCase().includes('assinar') ||
               msg.toLowerCase().includes('assinatura');
    }

    async verificarStatusVinculo(phoneNumber) {
        try {
            const formattedPhone = this.formatPhoneNumber(phoneNumber);
            const { data: link, error } = await this.supabase
                .from('whatsapp_links')
                .select('*')
                .eq('phone_number', formattedPhone)
                .maybeSingle();

            if (error) {
                console.error('Erro ao verificar vínculo:', error);
                return 'Desculpe, ocorreu um erro ao verificar seu status de vinculação.';
            }

            if (!link) {
                return 'Seu número ainda não está vinculado. Use o comando /vincular para começar!';
            }

            if (!link.is_verified) {
                return `Seu número está em processo de vinculação.\nCódigo pendente: ${link.verification_code}\nPor favor, acesse seu dashboard e insira este código para completar a vinculação.`;
            }

            return '✅ Seu número está vinculado e pronto para usar! Você pode:\n\n' +
                   '- Registrar gastos (ex: "gastei 20 reais no uber")\n' +
                   '- Consultar saldo (ex: "qual meu saldo?")\n' +
                   '- Ver categorias (ex: "mostra as categorias")\n' +
                   '- Pedir relatório (ex: "me mostra o resumo do mês")';
        } catch (error) {
            console.error('Erro ao verificar status:', error);
            return 'Desculpe, ocorreu um erro ao verificar seu status de vinculação.';
        }
    }

    async processarGasto(userId, message) {
        const msgLower = message.toLowerCase();
        
        // Extrai o valor
        const valorRegex = /\d+([.,]\d{1,2})?/;
        const valorMatch = msgLower.match(valorRegex);
        if (!valorMatch) {
            return 'Não consegui identificar o valor. Por favor, me diga quanto você gastou (ex: "gastei 20 reais")';
        }
        const valor = parseFloat(valorMatch[0].replace(',', '.'));

        try {
            // Verificar o plano do usuário
            const userPlan = await this.getUserPlan(userId);
            console.log('[GASTO] Plano do usuário:', userPlan);
            
            // Para plano free, usamos um fluxo simplificado sem contas bancárias
            if (userPlan === 'free') {
                console.log('[GASTO] Usando fluxo simplificado para plano free');
                
                // Identificar categoria
                let category;
                const words = msgLower.split(' ');
                const commonWords = ['reais', 'gastei', 'paguei', 'comprei', 'no', 'na', 'em', 'com', 'de', 'do', 'da'];
                const possibleCategories = words.filter(word => !commonWords.includes(word) && !word.match(/\d+/));
                
                console.log('[GASTO] Categorias possíveis:', possibleCategories);
                
                // Verificar categorias existentes
                const { data: categories } = await this.supabase
                    .from('categories')
                    .select('*')
                    .eq('user_id', userId)
                    .eq('type', 'expense');
                
                if (categories && categories.length > 0) {
                    console.log('[GASTO] Categorias existentes:', categories);
                    
                    // Tentar encontrar categoria pelo nome
                    for (const word of possibleCategories) {
                        const matchingCategory = categories.find(c => 
                            c.name.toLowerCase().includes(word) || 
                            word.includes(c.name.toLowerCase())
                        );
                        
                        if (matchingCategory) {
                            category = matchingCategory;
                            console.log('[GASTO] Categoria encontrada:', category);
                            break;
                        }
                    }
                    
                    // Se não encontrou, usa a primeira
                    if (!category) {
                        category = categories[0];
                        console.log('[GASTO] Usando primeira categoria:', category);
                    }
                } else {
                    // Criar categoria padrão
                    console.log('[GASTO] Criando categoria padrão');
                    const { data: newCategory, error: categoryError } = await this.supabase
                        .from('categories')
                        .insert({
                            user_id: userId,
                            name: 'Outros',
                            type: 'expense'
                        })
                        .select()
                        .single();
                    
                    if (categoryError) {
                        console.error('[GASTO] Erro ao criar categoria:', categoryError);
                        return `❌ Erro ao criar categoria: ${categoryError.message}`;
                    }
                    
                    category = newCategory;
                }
                
                // Inserir transação diretamente sem banco
                const transactionData = {
                    user_id: userId,
                    // Deixamos bank_id como null para plano free
                    category_id: category.id,
                    type: 'expense',
                    amount: valor,
                    description: possibleCategories.length > 0 ? possibleCategories[0] : 'Gasto',
                    date: new Date().toISOString().split('T')[0],
                    status: 'completed'
                };
                
                console.log('[GASTO] Inserindo transação sem banco:', transactionData);
                
                const { data: transaction, error: transactionError } = await this.supabase
                    .from('transactions')
                    .insert(transactionData)
                    .select();
                
                if (transactionError) {
                    console.error('[GASTO] Erro ao inserir transação:', transactionError);
                    return `❌ Erro ao registrar transação: ${transactionError.message}`;
                }
                
                console.log('[GASTO] Transação registrada com sucesso:', transaction);
                
                return `✅ Gasto registrado!
Valor: R$ ${valor.toFixed(2)}
Categoria: ${category.name}
Data: ${new Date().toLocaleDateString('pt-BR')}`;
            }
            
            // Para outros planos, usa o fluxo normal com contas bancárias
            // Identificar o banco/cartão
            const { data: banks } = await this.supabase
                .from('banks')
                .select('id, name')
                .eq('user_id', userId);

            let selectedBank = null;
            if (banks && banks.length > 0) {
                for (const bank of banks) {
                    if (msgLower.includes(bank.name.toLowerCase())) {
                        selectedBank = bank;
                        break;
                    }
                }

                // Se não identificou banco específico, usa o primeiro
                if (!selectedBank) {
                    selectedBank = banks[0];
                }
            } else {
                // Se não tem nenhuma conta bancária cadastrada, cria uma conta padrão
                try {
                    const { data, error } = await this.supabase
                        .from('banks')
                        .insert({
                            user_id: userId,
                            name: 'Conta Principal',
                            balance: 0,
                            type: 'corrente',
                            color: '#3498db'
                        })
                        .select()
                        .single();
                    
                    if (error) throw error;
                    selectedBank = data;
                } catch (error) {
                    console.error('Erro ao criar conta bancária padrão:', error);
                    return 'Não consegui criar uma conta bancária para você. Por favor, adicione uma conta no dashboard.';
                }
            }

            // Identifica a categoria
            const words = msgLower.split(' ');
            const commonWords = [
                'reais', 'gastei', 'paguei', 'comprei', 'no', 'na', 'em', 'com', 'de', 'do', 'da',
                'cartão', 'cartao', 'débito', 'debito', 'crédito', 'credito', 'pix', 'dinheiro',
                'transferi', 'mandei', 'coloquei', 'conta'
            ];
            const possibleCategories = words.filter(word => !commonWords.includes(word) && !word.match(/\d+/));
            
            let category = null;
            if (possibleCategories.length > 0) {
                for (const word of possibleCategories) {
                    const { data: categoryData } = await this.supabase
                        .from('categories')
                        .select('id, name')
                        .eq('user_id', userId)
                        .eq('type', 'expense')
                        .ilike('name', `%${word}%`)
                        .single();

                    if (categoryData) {
                        category = categoryData;
                        break;
                    }
                }
            }

            // Se não encontrou categoria, verifica se existem categorias de despesa
            if (!category) {
                const { data: categories } = await this.supabase
                    .from('categories')
                    .select('id, name')
                    .eq('user_id', userId)
                    .eq('type', 'expense');

                if (!categories || categories.length === 0) {
                    // Se não tem categorias, cria categorias básicas
                    try {
                        const basicCategories = [
                            { name: 'Alimentação', type: 'expense' },
                            { name: 'Transporte', type: 'expense' },
                            { name: 'Lazer', type: 'expense' },
                            { name: 'Moradia', type: 'expense' },
                            { name: 'Saúde', type: 'expense' },
                            { name: 'Educação', type: 'expense' },
                            { name: 'Outros', type: 'expense' }
                        ];
                        
                        // Primeiro, cria todas as categorias básicas
                        for (const cat of basicCategories) {
                            await this.supabase
                                .from('categories')
                                .insert({
                                    user_id: userId,
                                    name: cat.name,
                                    type: cat.type
                                });
                        }
                        
                        // Depois, tenta identificar a categoria novamente
                        let matchedCategory = 'Outros'; // categoria padrão
                        
                        // Tenta associar palavras da mensagem com categorias criadas
                        if (msgLower.includes('comida') || msgLower.includes('almoço') || msgLower.includes('jantar') || 
                            msgLower.includes('restaurante') || msgLower.includes('lanche')) {
                            matchedCategory = 'Alimentação';
                        } else if (msgLower.includes('uber') || msgLower.includes('ônibus') || msgLower.includes('trem') || 
                                   msgLower.includes('metrô') || msgLower.includes('táxi') || msgLower.includes('transporte')) {
                            matchedCategory = 'Transporte';
                        } else if (msgLower.includes('cinema') || msgLower.includes('festa') || msgLower.includes('show') || 
                                   msgLower.includes('viagem')) {
                            matchedCategory = 'Lazer';
                        } else if (msgLower.includes('aluguel') || msgLower.includes('condomínio') || msgLower.includes('água') || 
                                   msgLower.includes('luz') || msgLower.includes('gás')) {
                            matchedCategory = 'Moradia';
                        } else if (msgLower.includes('remédio') || msgLower.includes('médico') || msgLower.includes('hospital') || 
                                   msgLower.includes('farmácia')) {
                            matchedCategory = 'Saúde';
                        } else if (msgLower.includes('curso') || msgLower.includes('livro') || msgLower.includes('faculdade') || 
                                   msgLower.includes('escola')) {
                            matchedCategory = 'Educação';
                        }
                        
                        // Busca a categoria criada para associar à transação
                        const { data: newCategory } = await this.supabase
                            .from('categories')
                            .select('id, name')
                            .eq('user_id', userId)
                            .eq('name', matchedCategory)
                            .single();
                        
                        category = newCategory;
                    } catch (error) {
                        console.error('Erro ao criar categorias básicas:', error);
                        return 'Ocorreu um erro ao configurar categorias. Por favor, configure categorias no dashboard.';
                    }
                } else {
                    // Se tem categorias mas não identificou, sugere as existentes
                return `Não consegui identificar a categoria do gasto. Por favor, me diga em qual categoria se encaixa:\n${categories.map(c => `- ${c.name}`).join('\n')}\n\nPor exemplo:\n"gastei ${valor} reais em ${categories[0].name}"`;
                }
            }

            // Registra a transação
            try {
                const transactionData = {
                    user_id: userId,
                    bank_id: selectedBank.id,
                    category_id: category.id,
                    type: 'expense',
                    amount: valor,
                    date: new Date().toISOString().split('T')[0],
                    status: 'completed'
                };
                
                console.log('[DEBUG] Registrando gasto:', JSON.stringify(transactionData));
                
                const { data, error } = await this.supabase
                    .from('transactions')
                    .insert(transactionData)
                    .select();

                if (error) {
                    console.error('[DEBUG] Erro ao registrar gasto:', error);
                    throw error;
                }
                
                console.log('[DEBUG] Gasto registrado com sucesso:', data);

            return `✅ Gasto registrado!\nValor: R$ ${valor.toFixed(2)}\nCategoria: ${category.name}\nConta: ${selectedBank.name}`;
            } catch (error) {
                console.error('Erro ao registrar transação:', error);
                return 'Ocorreu um erro ao registrar sua transação. Por favor, tente novamente.';
            }
        } catch (error) {
            console.error('Erro ao processar gasto:', error);
            return 'Desculpe, ocorreu um erro ao processar seu gasto. Tente novamente.';
        }
    }

    async handleBalance(userId) {
        const { data: banks } = await this.supabase
            .from('banks')
            .select('name, balance')
            .eq('user_id', userId);

        if (!banks || banks.length === 0) {
            return 'Você não tem nenhuma conta cadastrada.';
        }

        let response = '💰 Saldo das suas contas:\n\n';
        let total = 0;

        for (const bank of banks) {
            response += `${bank.name}: R$ ${bank.balance.toFixed(2)}\n`;
            total += parseFloat(bank.balance);
        }

        response += `\nTotal: R$ ${total.toFixed(2)}`;
        return response;
    }

    async handleCategories(userId) {
        const { data: categories } = await this.supabase
            .from('categories')
            .select('name, type')
            .eq('user_id', userId);

        if (!categories || categories.length === 0) {
            return 'Você não tem nenhuma categoria cadastrada.';
        }

        const expenses = categories.filter(c => c.type === 'expense');
        const income = categories.filter(c => c.type === 'income');

        let response = '📋 Suas categorias:\n\n';
        
        if (expenses.length > 0) {
            response += '🔴 Despesas:\n';
            expenses.forEach(c => response += `- ${c.name}\n`);
            response += '\n';
        }

        if (income.length > 0) {
            response += '🟢 Receitas:\n';
            income.forEach(c => response += `- ${c.name}\n`);
        }

        return response;
    }

    async handleReport(userId) {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        const { data: transactions } = await this.supabase
            .from('transactions')
            .select(`
                amount,
                type,
                categories (name)
            `)
            .eq('user_id', userId)
            .gte('date', firstDay.toISOString().split('T')[0])
            .lte('date', lastDay.toISOString().split('T')[0]);

        if (!transactions || transactions.length === 0) {
            return 'Nenhuma transação encontrada este mês.';
        }

        let totalExpenses = 0;
        let totalIncome = 0;
        const categories = {};

        for (const tx of transactions) {
            if (tx.type === 'expense') {
                totalExpenses += parseFloat(tx.amount);
                categories[tx.categories.name] = (categories[tx.categories.name] || 0) + parseFloat(tx.amount);
            } else {
                totalIncome += parseFloat(tx.amount);
            }
        }

        let response = `📊 Relatório de ${today.toLocaleString('pt-BR', { month: 'long' })}:\n\n`;
        response += `📥 Receitas: R$ ${totalIncome.toFixed(2)}\n`;
        response += `📤 Despesas: R$ ${totalExpenses.toFixed(2)}\n`;
        response += `💰 Saldo: R$ ${(totalIncome - totalExpenses).toFixed(2)}\n\n`;
        
        response += '🔍 Principais gastos:\n';
        Object.entries(categories)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .forEach(([category, amount]) => {
                const percentage = ((amount / totalExpenses) * 100).toFixed(1);
                response += `${category}: R$ ${amount.toFixed(2)} (${percentage}%)\n`;
            });

        return response;
    }

    showAjuda() {
        return `Não entendi exatamente o que você quer. Aqui está o que eu posso fazer:

1️⃣ Registrar gastos
   Ex: "gastei 20 reais no uber"
   Ex: "paguei 50 no cartão nubank"
   Ex: "comprei lanche por 15 reais"

2️⃣ Mostrar seu saldo
   Ex: "qual meu saldo?"
   Ex: "quanto tenho na conta?"
   Ex: "mostra o saldo"

3️⃣ Listar categorias
   Ex: "quais são as categorias?"
   Ex: "mostra as categorias"
   Ex: "lista de categorias"

4️⃣ Gerar relatório
   Ex: "me mostra o relatório"
   Ex: "quanto gastei este mês?"
   Ex: "resumo do mês"

Me diga como posso te ajudar! 😊`;
    }

    async getUserPlan(userId) {
        try {
            console.log(`[PLANO] Buscando plano para usuário: ${userId}`);
            
            // Primeiro, tentar buscar na tabela de perfis
            const { data, error } = await this.supabase
                .from('profiles')
                .select('subscription_plan')
                .eq('id', userId)
                .single();

            if (error) {
                console.error(`[PLANO] Erro ao buscar plano do usuário em profiles: ${error.message}`);
                
                // Tentar buscar na tabela de assinaturas como fallback
                const { data: subscription, error: subError } = await this.supabase
                    .from('subscriptions')
                    .select('plan')
                    .eq('user_id', userId)
                    .single();
                    
                if (subError) {
                    console.error(`[PLANO] Erro ao buscar plano em subscriptions: ${subError.message}`);
                    // Por segurança, retorna 'free' em caso de erro
                    return 'free';
                }
                
                console.log(`[PLANO] Plano encontrado em subscriptions: ${subscription?.plan || 'free'}`);
                return subscription?.plan || 'free';
            }

            console.log(`[PLANO] Plano encontrado em profiles: ${data?.subscription_plan || 'free'}`);
            return data?.subscription_plan || 'free';
        } catch (error) {
            console.error(`[PLANO] Erro inesperado ao buscar plano: ${error.message}`);
            return 'free';
        }
    }

    mostrarPlanos() {
        return `🌟 *Conheça nossos planos* 🌟\n\n` +
               `*PLANO GRATUITO*\n` +
               `✓ Registro básico de gastos\n` +
               `✓ Consulta de saldo\n` +
               `✓ Categorias básicas\n` +
               `✓ Acesso pelo WhatsApp\n\n` +
               
               `*PLANO BÁSICO - R$ 39,90/mês*\n` +
               `✓ Tudo do plano gratuito\n` +
               `✓ Relatórios detalhados\n` +
               `✓ Registro de receitas\n` +
               `✓ Categorias personalizadas\n` +
               `✓ Dashboard completo\n\n` +
               
               `*PLANO PREMIUM - R$ 69,90/mês*\n` +
               `✓ Tudo do plano básico\n` +
               `✓ Gestão de investimentos\n` +
               `✓ Controle de cartões de crédito\n` +
               `✓ Metas financeiras\n` +
               `✓ Alertas personalizados\n` +
               `✓ Suporte prioritário\n\n` +
               
               `Para fazer upgrade, acesse:\n` +
               `app.financas.com/planos`;
    }

    async processarReceita(userId, message) {
        const msgLower = message.toLowerCase();
        
        // Extrai o valor
        const valorRegex = /\d+([.,]\d{1,2})?/;
        const valorMatch = msgLower.match(valorRegex);
        if (!valorMatch) {
            return 'Não consegui identificar o valor. Por favor, me diga quanto você recebeu (ex: "recebi 2000 de salário")';
        }
        const valor = parseFloat(valorMatch[0].replace(',', '.'));

        try {
            // Verificar o plano do usuário
            const userPlan = await this.getUserPlan(userId);
            console.log('[RECEITA] Plano do usuário:', userPlan);
            
            // Para plano free, usamos um fluxo simplificado sem contas bancárias
            if (userPlan === 'free') {
                console.log('[RECEITA] Usando fluxo simplificado para plano free');
                
                // Identificar categoria
                let category;
                const words = msgLower.split(' ');
                const commonWords = ['reais', 'recebi', 'recebimento', 'receita', 'pagamento', 'no', 'na', 'em', 'de', 'do', 'da'];
                const possibleCategories = words.filter(word => !commonWords.includes(word) && !word.match(/\d+/));
                
                console.log('[RECEITA] Categorias possíveis:', possibleCategories);
                
                // Verificar categorias existentes
                const { data: categories } = await this.supabase
                    .from('categories')
                    .select('*')
                    .eq('user_id', userId)
                    .eq('type', 'income');
                
                if (categories && categories.length > 0) {
                    console.log('[RECEITA] Categorias existentes:', categories);
                    
                    // Tentar encontrar categoria pelo nome
                    for (const word of possibleCategories) {
                        const matchingCategory = categories.find(c => 
                            c.name.toLowerCase().includes(word) || 
                            word.includes(c.name.toLowerCase())
                        );
                        
                        if (matchingCategory) {
                            category = matchingCategory;
                            console.log('[RECEITA] Categoria encontrada:', category);
                            break;
                        }
                    }
                    
                    // Se não encontrou, usa a primeira
                    if (!category) {
                        category = categories[0];
                        console.log('[RECEITA] Usando primeira categoria:', category);
                    }
                } else {
                    // Criar categoria padrão
                    console.log('[RECEITA] Criando categoria padrão');
                    const { data: newCategory, error: categoryError } = await this.supabase
                        .from('categories')
                        .insert({
                            user_id: userId,
                            name: 'Salário',
                            type: 'income'
                        })
                        .select()
                        .single();
                    
                    if (categoryError) {
                        console.error('[RECEITA] Erro ao criar categoria:', categoryError);
                        return `❌ Erro ao criar categoria: ${categoryError.message}`;
                    }
                    
                    category = newCategory;
                }
                
                // Inserir transação diretamente sem banco
                const transactionData = {
                    user_id: userId,
                    // Deixamos bank_id como null para plano free
                    category_id: category.id,
                    type: 'income',
                    amount: valor,
                    description: possibleCategories.length > 0 ? possibleCategories[0] : 'Receita',
                    date: new Date().toISOString().split('T')[0],
                    status: 'completed'
                };
                
                console.log('[RECEITA] Inserindo transação sem banco:', transactionData);
                
                const { data: transaction, error: transactionError } = await this.supabase
                    .from('transactions')
                    .insert(transactionData)
                    .select();
                
                if (transactionError) {
                    console.error('[RECEITA] Erro ao inserir transação:', transactionError);
                    return `❌ Erro ao registrar transação: ${transactionError.message}`;
                }
                
                console.log('[RECEITA] Transação registrada com sucesso:', transaction);
                
                return `✅ Receita registrada!
Valor: R$ ${valor.toFixed(2)}
Categoria: ${category.name}
Data: ${new Date().toLocaleDateString('pt-BR')}`;
            }
            
            // Para outros planos, usa o fluxo normal com contas bancárias
            // Identifica o banco
            const { data: banks } = await this.supabase
                .from('banks')
                .select('id, name')
                .eq('user_id', userId);

            let selectedBank = null;
            if (banks && banks.length > 0) {
                for (const bank of banks) {
                    if (msgLower.includes(bank.name.toLowerCase())) {
                        selectedBank = bank;
                        break;
                    }
                }

                // Se não identificou banco específico, usa o primeiro
                if (!selectedBank) {
                    selectedBank = banks[0];
                }
            } else {
                // Se não tem nenhuma conta bancária cadastrada, cria uma conta padrão
                try {
                    const { data, error } = await this.supabase
                        .from('banks')
                        .insert({
                            user_id: userId,
                            name: 'Conta Principal',
                            balance: 0,
                            type: 'corrente',
                            color: '#3498db'
                        })
                        .select()
                        .single();
                    
                    if (error) throw error;
                    selectedBank = data;
                } catch (error) {
                    console.error('Erro ao criar conta bancária padrão:', error);
                    return 'Não consegui criar uma conta bancária para você. Por favor, adicione uma conta no dashboard.';
                }
            }

            // Identifica a categoria
            const words = msgLower.split(' ');
            const commonWords = [
                'reais', 'recebi', 'recebimento', 'receita', 'pagamento', 'no', 'na', 'em', 'de', 'do', 'da',
                'cartão', 'cartao', 'débito', 'debito', 'crédito', 'credito', 'pix', 'dinheiro',
                'transferência', 'transferi', 'depositei', 'depósito', 'conta'
            ];
            const possibleCategories = words.filter(word => !commonWords.includes(word) && !word.match(/\d+/));
            
            let category = null;
            if (possibleCategories.length > 0) {
                for (const word of possibleCategories) {
                    const { data: categoryData } = await this.supabase
                        .from('categories')
                        .select('id, name')
                        .eq('user_id', userId)
                        .eq('type', 'income')
                        .ilike('name', `%${word}%`)
                        .single();

                    if (categoryData) {
                        category = categoryData;
                        break;
                    }
                }
            }

            // Se não encontrou categoria, verifica se existem categorias de receita
            if (!category) {
                const { data: categories } = await this.supabase
                    .from('categories')
                    .select('id, name')
                    .eq('user_id', userId)
                    .eq('type', 'income');

                if (!categories || categories.length === 0) {
                    // Se não tem categorias, cria categorias básicas de receita
                    try {
                        const basicCategories = [
                            { name: 'Salário', type: 'income' },
                            { name: 'Freelance', type: 'income' },
                            { name: 'Investimentos', type: 'income' },
                            { name: 'Presente', type: 'income' },
                            { name: 'Reembolso', type: 'income' },
                            { name: 'Outros', type: 'income' }
                        ];
                        
                        // Primeiro, cria todas as categorias básicas
                        for (const cat of basicCategories) {
                            await this.supabase
                                .from('categories')
                                .insert({
                                    user_id: userId,
                                    name: cat.name,
                                    type: cat.type
                                });
                        }
                        
                        // Depois, tenta identificar a categoria novamente
                        let matchedCategory = 'Outros'; // categoria padrão
                        
                        // Tenta associar palavras da mensagem com categorias criadas
                        if (msgLower.includes('salário') || msgLower.includes('salario') || 
                            msgLower.includes('pagamento') || msgLower.includes('trabalho')) {
                            matchedCategory = 'Salário';
                        } else if (msgLower.includes('freela') || msgLower.includes('freelance') || 
                                  msgLower.includes('bico') || msgLower.includes('projeto')) {
                            matchedCategory = 'Freelance';
                        } else if (msgLower.includes('investimento') || msgLower.includes('dividendo') || 
                                  msgLower.includes('juros') || msgLower.includes('ação') || msgLower.includes('rendimento')) {
                            matchedCategory = 'Investimentos';
                        } else if (msgLower.includes('presente') || msgLower.includes('doação') || 
                                  msgLower.includes('presente') || msgLower.includes('prêmio')) {
                            matchedCategory = 'Presente';
                        } else if (msgLower.includes('reembolso') || msgLower.includes('devolução') || 
                                  msgLower.includes('estorno')) {
                            matchedCategory = 'Reembolso';
                        }
                        
                        // Busca a categoria criada para associar à transação
                        const { data: newCategory } = await this.supabase
                            .from('categories')
                            .select('id, name')
                            .eq('user_id', userId)
                            .eq('name', matchedCategory)
                            .single();
                        
                        category = newCategory;
                    } catch (error) {
                        console.error('Erro ao criar categorias básicas de receita:', error);
                        return 'Ocorreu um erro ao configurar categorias. Por favor, configure categorias no dashboard.';
                    }
                } else {
                    // Se tem categorias mas não identificou, sugere as existentes
                    return `Não consegui identificar a categoria da receita. Por favor, me diga em qual categoria se encaixa:\n${categories.map(c => `- ${c.name}`).join('\n')}\n\nPor exemplo:\n"recebi ${valor} reais de ${categories[0].name}"`;
                }
            }

            // Registra a transação
            try {
                const transactionData = {
                    user_id: userId,
                    bank_id: selectedBank.id,
                    category_id: category.id,
                    type: 'income',
                    amount: valor,
                    date: new Date().toISOString().split('T')[0],
                    status: 'completed'
                };
                
                console.log('[RECEITA] Registrando receita:', JSON.stringify(transactionData));
                
                const { data, error } = await this.supabase
                    .from('transactions')
                    .insert(transactionData)
                    .select();

                if (error) {
                    console.error('[RECEITA] Erro ao registrar receita:', error);
                    throw error;
                }
                
                console.log('[RECEITA] Receita registrada com sucesso:', data);
                
                return `✅ Receita registrada!
Valor: R$ ${valor.toFixed(2)}
Categoria: ${category.name}
Conta: ${selectedBank.name}`;
            } catch (error) {
                console.error('Erro ao registrar receita:', error);
                return 'Ocorreu um erro ao registrar sua receita. Por favor, tente novamente.';
            }
        } catch (error) {
            console.error('Erro ao processar receita:', error);
            return 'Desculpe, ocorreu um erro ao processar sua receita. Tente novamente.';
        }
    }

    async handleInvestments(userId) {
        try {
            const { data: investments, error } = await this.supabase
                .from('investments')
                .select(`
                    *,
                    banks (
                        id,
                        name,
                        color
                    )
                `)
                .eq('user_id', userId)
                .order('name');

            if (error) throw error;

            if (!investments || investments.length === 0) {
                return 'Você ainda não possui investimentos cadastrados. Use o dashboard para adicionar seus investimentos.';
            }

            // Agrupar por tipo
            const rendaFixa = investments.filter(inv => inv.type === 'renda-fixa');
            const rendaVariavel = investments.filter(inv => inv.type === 'renda-variavel');
            const cripto = investments.filter(inv => inv.type === 'cripto');

            // Calcular valores totais
            const rendaFixaAmount = rendaFixa.reduce((sum, inv) => sum + inv.amount, 0);
            const rendaVariavelAmount = rendaVariavel.reduce((sum, inv) => sum + inv.amount, 0);
            const criptoAmount = cripto.reduce((sum, inv) => sum + inv.amount, 0);
            const totalAmount = rendaFixaAmount + rendaVariavelAmount + criptoAmount;

            let response = '📈 *Seus Investimentos* 📈\n\n';
            response += `💰 *Patrimônio Total: R$ ${totalAmount.toFixed(2)}*\n\n`;

            if (rendaFixa.length > 0) {
                response += `*Renda Fixa (${((rendaFixaAmount / totalAmount) * 100).toFixed(1)}%):*\n`;
                rendaFixa.forEach(inv => {
                    response += `- ${inv.name}: R$ ${inv.amount.toFixed(2)}`;
                    if (inv.expected_return) {
                        response += ` (${inv.expected_return}% a.a.)`;
                    }
                    response += '\n';
                });
                response += '\n';
            }

            if (rendaVariavel.length > 0) {
                response += `*Renda Variável (${((rendaVariavelAmount / totalAmount) * 100).toFixed(1)}%):*\n`;
                rendaVariavel.forEach(inv => {
                    response += `- ${inv.name}: R$ ${inv.amount.toFixed(2)}`;
                    if (inv.current_return) {
                        const signal = inv.current_return > 0 ? '+' : '';
                        response += ` (${signal}${inv.current_return}%)`;
                    }
                    response += '\n';
                });
                response += '\n';
            }

            if (cripto.length > 0) {
                response += `*Criptomoedas (${((criptoAmount / totalAmount) * 100).toFixed(1)}%):*\n`;
                cripto.forEach(inv => {
                    response += `- ${inv.name}: R$ ${inv.amount.toFixed(2)}`;
                    if (inv.current_return) {
                        const signal = inv.current_return > 0 ? '+' : '';
                        response += ` (${signal}${inv.current_return}%)`;
                    }
                    response += '\n';
                });
            }

            return response;
        } catch (error) {
            console.error('Erro ao consultar investimentos:', error);
            return 'Desculpe, ocorreu um erro ao consultar seus investimentos. Tente novamente.';
        }
    }

    async handleCreditCards(userId) {
        try {
            const { data: cards, error } = await this.supabase
                .from('credit_cards')
                .select('*')
                .eq('user_id', userId);

            if (error) throw error;

            if (!cards || cards.length === 0) {
                return 'Você ainda não possui cartões de crédito cadastrados. Use o dashboard para adicionar seus cartões.';
            }

            let response = '💳 *Seus Cartões de Crédito* 💳\n\n';

            cards.forEach(card => {
                response += `*${card.name}*\n`;
                response += `Limite: R$ ${card.limit.toFixed(2)}\n`;
                
                const availableLimit = card.limit - (card.current_invoice || 0);
                response += `Disponível: R$ ${availableLimit.toFixed(2)}\n`;
                
                if (card.current_invoice) {
                    response += `Fatura atual: R$ ${card.current_invoice.toFixed(2)}\n`;
                }
                
                if (card.next_invoice) {
                    response += `Próxima fatura: R$ ${card.next_invoice.toFixed(2)}\n`;
                }
                
                response += `Vencimento: dia ${card.due_date}\n`;
                response += `Fechamento: dia ${card.closing_date}\n\n`;
            });

            response += 'Para ver detalhes de um cartão específico, digite "fatura do [nome do cartão]"';

            return response;
        } catch (error) {
            console.error('Erro ao consultar cartões de crédito:', error);
            return 'Desculpe, ocorreu um erro ao consultar seus cartões de crédito. Tente novamente.';
        }
    }

    async handleGoals(userId, message) {
        try {
            const msgLower = message.toLowerCase();
            
            // Verifica se é uma consulta simples de metas
            const isSimpleQuery = ['metas', 'objetivos', 'ver metas', 'minhas metas', 'mostrar metas'].some(q => msgLower.includes(q));
            
            if (isSimpleQuery) {
                return this.showGoals(userId);
            }
            
            // Verifica se é uma solicitação para adicionar progresso a uma meta
            if (msgLower.includes('adicionar') || msgLower.includes('guardar') || msgLower.includes('depositar')) {
                // Extrai o valor
                const valorRegex = /\d+([.,]\d{1,2})?/;
                const valorMatch = msgLower.match(valorRegex);
                if (!valorMatch) {
                    return 'Não consegui identificar o valor. Por favor, me diga quanto você quer adicionar à meta (ex: "adicionar 100 reais na meta de férias")';
                }
                const valor = parseFloat(valorMatch[0].replace(',', '.'));
                
                // Extrai o nome da meta
                const { data: goals } = await this.supabase
                    .from('goals')
                    .select('id, name, target_amount, current_amount')
                    .eq('user_id', userId);
                
                if (!goals || goals.length === 0) {
                    return 'Você ainda não possui metas cadastradas. Use o dashboard para criar suas metas financeiras.';
                }
                
                let selectedGoal = null;
                for (const goal of goals) {
                    if (msgLower.includes(goal.name.toLowerCase())) {
                        selectedGoal = goal;
                        break;
                    }
                }
                
                if (!selectedGoal) {
                    return `Não consegui identificar qual meta você quer atualizar. Suas metas são:\n${goals.map(g => `- ${g.name}`).join('\n')}\n\nPor favor, especifique a meta (ex: "adicionar 100 reais na meta de ${goals[0].name}")`;
                }
                
                // Atualiza a meta
                const newAmount = selectedGoal.current_amount + valor;
                const { error: updateError } = await this.supabase
                    .from('goals')
                    .update({ current_amount: newAmount })
                    .eq('id', selectedGoal.id);
                
                if (updateError) throw updateError;
                
                const progress = (newAmount / selectedGoal.target_amount) * 100;
                const isCompleted = newAmount >= selectedGoal.target_amount;
                
                let response = `✅ Adicionado R$ ${valor.toFixed(2)} à meta "${selectedGoal.name}"!\n\n`;
                response += `Progresso atual: R$ ${newAmount.toFixed(2)} de R$ ${selectedGoal.target_amount.toFixed(2)} (${progress.toFixed(1)}%)\n`;
                
                if (isCompleted) {
                    response += '\n🎉 Parabéns! Você atingiu sua meta!';
                } else {
                    const remaining = selectedGoal.target_amount - newAmount;
                    response += `\nFalta: R$ ${remaining.toFixed(2)}`;
                }
                
                return response;
            }
            
            return 'Para gerenciar suas metas, você pode:\n- Ver suas metas (ex: "mostrar metas")\n- Adicionar progresso (ex: "adicionar 100 na meta de férias")\n\nPara criar novas metas, use o dashboard.';
        } catch (error) {
            console.error('Erro ao gerenciar metas:', error);
            return 'Desculpe, ocorreu um erro ao gerenciar suas metas. Tente novamente.';
        }
    }
    
    async showGoals(userId) {
        try {
            const { data: goals, error } = await this.supabase
                .from('goals')
                .select('*')
                .eq('user_id', userId);
            
            if (error) throw error;
            
            if (!goals || goals.length === 0) {
                return 'Você ainda não possui metas cadastradas. Use o dashboard para criar suas metas financeiras.';
            }
            
            let response = '🎯 *Suas Metas Financeiras* 🎯\n\n';
            
            goals.forEach(goal => {
                const progress = (goal.current_amount / goal.target_amount) * 100;
                const remaining = goal.target_amount - goal.current_amount;
                const deadline = goal.deadline ? new Date(goal.deadline).toLocaleDateString('pt-BR') : 'Sem prazo';
                
                response += `*${goal.name}*\n`;
                response += `Meta: R$ ${goal.target_amount.toFixed(2)}\n`;
                response += `Atual: R$ ${goal.current_amount.toFixed(2)} (${progress.toFixed(1)}%)\n`;
                response += `Falta: R$ ${remaining.toFixed(2)}\n`;
                
                if (goal.deadline) {
                    response += `Prazo: ${deadline}\n`;
                }
                
                response += '\n';
            });
            
            response += 'Para adicionar progresso a uma meta, digite "adicionar [valor] na meta de [nome da meta]"';
            
            return response;
        } catch (error) {
            console.error('Erro ao consultar metas:', error);
            return 'Desculpe, ocorreu um erro ao consultar suas metas. Tente novamente.';
        }
    }

    isUpgradeRequest(message) {
        const upgradeKeywords = ['upgrade', 'atualizar plano', 'mudar plano', 'plano premium', 'plano básico', 'plano basic'];
        return upgradeKeywords.some(keyword => message.includes(keyword));
    }
    
    handleUpgradeRequest(userPlan) {
        let message = '';
        
        if (userPlan === 'free') {
            message = `🚀 Quer fazer upgrade do seu plano? Ótima escolha!\n\n` +
                      `Com o plano BASIC (R$ 9,90/mês), você desbloqueia:\n` +
                      `✅ Relatórios detalhados de gastos\n` +
                      `✅ Exportação de dados\n` +
                      `✅ Suporte prioritário\n\n` +
                      
                      `Com o plano PREMIUM (R$ 19,90/mês), você tem acesso a tudo:\n` +
                      `✅ Tudo do plano BASIC\n` +
                      `✅ Gestão de investimentos\n` +
                      `✅ Controle de cartões de crédito\n` +
                      `✅ Metas financeiras personalizadas\n` +
                      `✅ Alertas inteligentes\n\n` +
                      
                      `Para fazer upgrade, acesse: https://financas.app/planos\n` +
                      `Ou use os códigos promocionais:\n` +
                      `BASIC10 - 10% de desconto no plano BASIC\n` +
                      `PREMIUM20 - 20% de desconto no plano PREMIUM`;
        } else if (userPlan === 'basic') {
            message = `🚀 Quer acessar todos os recursos premium? Excelente decisão!\n\n` +
                      `Com o plano PREMIUM (R$ 19,90/mês), você desbloqueia:\n` +
                      `✅ Tudo do seu plano BASIC atual\n` +
                      `✅ Gestão de investimentos\n` +
                      `✅ Controle de cartões de crédito\n` +
                      `✅ Metas financeiras personalizadas\n` +
                      `✅ Alertas inteligentes\n\n` +
                      
                      `Para fazer upgrade, acesse: https://financas.app/planos\n` +
                      `Use o código promocional UPGRADE15 para 15% de desconto no primeiro ano!`;
        } else if (userPlan === 'premium') {
            message = `✨ Você já está no plano PREMIUM! Aproveite todos os recursos disponíveis:\n\n` +
                      `✅ Relatórios detalhados\n` +
                      `✅ Gestão de investimentos\n` +
                      `✅ Controle de cartões de crédito\n` +
                      `✅ Metas financeiras personalizadas\n` +
                      `✅ Alertas inteligentes\n` +
                      `✅ Suporte prioritário\n\n` +
                      
                      `Obrigado por ser um assinante premium! Se precisar de ajuda com qualquer recurso, é só perguntar.`;
        }
        
        return message;
    }

    isConsultaMetas(message) {
        const metasKeywords = ['metas', 'objetivos', 'minhas metas', 'meus objetivos', 'ver metas', 'mostrar metas'];
        return metasKeywords.some(keyword => message.includes(keyword));
    }

    async testMessageDetection(message) {
        console.log('\n[TESTE DE DETECÇÃO] Analisando mensagem:', message);
        const msgLower = message.toLowerCase().trim();
        
        const isGastoResult = this.isGasto(msgLower);
        const isReceitaResult = this.isAdicionarReceita(msgLower);
        const isSaldoResult = this.isConsultaSaldo(msgLower);
        const isCategoriasResult = this.isConsultaCategorias(msgLower);
        
        console.log('[TESTE DE DETECÇÃO] Resultados:');
        console.log('- É gasto?', isGastoResult);
        console.log('- É receita?', isReceitaResult);
        console.log('- É consulta de saldo?', isSaldoResult);
        console.log('- É consulta de categorias?', isCategoriasResult);
        
        return `Detecção de comando: ${message}
- Gasto: ${isGastoResult ? '✅' : '❌'}
- Receita: ${isReceitaResult ? '✅' : '❌'}
- Saldo: ${isSaldoResult ? '✅' : '❌'}
- Categorias: ${isCategoriasResult ? '✅' : '❌'}`;
    }

    async testDatabase(userId) {
        console.log('[TESTE DATABASE] Iniciando teste de banco de dados para usuário:', userId);
        try {
            // Teste 1: Verificar acesso ao banco
            console.log('[TESTE DATABASE] Testando conexão com o Supabase');
            const { data: healthCheck, error: healthError } = await this.supabase.rpc('pg_stat_activity').select();
            
            if (healthError) {
                console.error('[TESTE DATABASE] Erro de conexão:', healthError);
                return `❌ Erro de conexão com o banco de dados: ${healthError.message}`;
            }
            
            console.log('[TESTE DATABASE] Conexão com Supabase OK');
            
            // Teste 2: Verificar usuário
            console.log('[TESTE DATABASE] Verificando usuário');
            const { data: user, error: userError } = await this.supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();
                
            if (userError) {
                console.error('[TESTE DATABASE] Erro ao buscar usuário:', userError);
                return `❌ Erro ao buscar usuário: ${userError.message}`;
            }
            
            if (!user) {
                console.error('[TESTE DATABASE] Usuário não encontrado');
                return '❌ Usuário não encontrado no banco de dados.';
            }
            
            console.log('[TESTE DATABASE] Usuário encontrado:', user);
            
            // Teste 3: Verificar conta bancária
            console.log('[TESTE DATABASE] Verificando contas bancárias');
            const { data: banks, error: banksError } = await this.supabase
                .from('banks')
                .select('*')
                .eq('user_id', userId);
                
            if (banksError) {
                console.error('[TESTE DATABASE] Erro ao buscar contas:', banksError);
                return `❌ Erro ao buscar contas bancárias: ${banksError.message}`;
            }
            
            // Teste 4: Verificar categorias
            console.log('[TESTE DATABASE] Verificando categorias');
            const { data: categories, error: categoriesError } = await this.supabase
                .from('categories')
                .select('*')
                .eq('user_id', userId);
                
            if (categoriesError) {
                console.error('[TESTE DATABASE] Erro ao buscar categorias:', categoriesError);
                return `❌ Erro ao buscar categorias: ${categoriesError.message}`;
            }
            
            // Teste 5: Tentar inserir uma transação fictícia
            if (banks && banks.length > 0 && categories && categories.length > 0) {
                console.log('[TESTE DATABASE] Tentando inserir transação de teste');
                
                // Encontra uma categoria de despesa
                const expenseCategory = categories.find(c => c.type === 'expense');
                
                if (expenseCategory) {
                    // Dados da transação de teste
                    const testTransaction = {
                        user_id: userId,
                        bank_id: banks[0].id,
                        category_id: expenseCategory.id,
                        type: 'expense',
                        amount: 0.01, // valor mínimo para teste
                        description: 'Transação de teste - ignore',
                        date: new Date().toISOString().split('T')[0],
                        status: 'completed'
                    };
                    
                    console.log('[TESTE DATABASE] Dados da transação de teste:', testTransaction);
                    
                    const { data: inserted, error: insertError } = await this.supabase
                        .from('transactions')
                        .insert(testTransaction)
                        .select();
                        
                    if (insertError) {
                        console.error('[TESTE DATABASE] Erro ao inserir transação de teste:', insertError);
                        return `❌ Erro ao inserir transação: ${insertError.message}`;
                    }
                    
                    console.log('[TESTE DATABASE] Transação de teste inserida com sucesso:', inserted);
                    
                    // Apaga a transação de teste
                    const { error: deleteError } = await this.supabase
                        .from('transactions')
                        .delete()
                        .eq('id', inserted[0].id);
                        
                    if (deleteError) {
                        console.warn('[TESTE DATABASE] Aviso: Não foi possível excluir a transação de teste:', deleteError);
                    } else {
                        console.log('[TESTE DATABASE] Transação de teste excluída com sucesso');
                    }
                }
            }
            
            // Resultados do teste
            return `✅ Diagnóstico do banco de dados concluído:
- Conexão: OK
- Usuário: ${user ? '✅ Encontrado' : '❌ Não encontrado'}
- Contas bancárias: ${banks ? `✅ ${banks.length} encontradas` : '❌ Nenhuma'}
- Categorias: ${categories ? `✅ ${categories.length} encontradas` : '❌ Nenhuma'}
- Operações de banco: ✅ Funcionando corretamente

O banco de dados parece estar em bom estado.`;
            
        } catch (error) {
            console.error('[TESTE DATABASE] Erro crítico durante o teste:', error);
            return `❌ Erro crítico durante o diagnóstico: ${error.message}`;
        }
    }

    async testTransactionInsertion(userId, type) {
        console.log('[TESTE TRANSAÇÃO] Iniciando teste de inserção de transação', type, 'para usuário:', userId);
        try {
            // Verificar se o usuário existe
            const { data: user, error: userError } = await this.supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();
                
            if (userError || !user) {
                console.error('[TESTE TRANSAÇÃO] Erro ou usuário não encontrado:', userError);
                return '❌ Usuário não encontrado. Não é possível testar transação.';
            }
            
            console.log('[TESTE TRANSAÇÃO] Usuário encontrado:', user.id);
            
            // Verificar/criar banco
            let bank;
            const { data: banks } = await this.supabase
                .from('banks')
                .select('*')
                .eq('user_id', userId);
                
            if (!banks || banks.length === 0) {
                console.log('[TESTE TRANSAÇÃO] Nenhuma conta bancária encontrada. Criando uma...');
                const { data: newBank, error: bankError } = await this.supabase
                    .from('banks')
                    .insert({
                        user_id: userId,
                        name: 'Conta de Teste',
                        balance: 1000,
                        type: 'corrente',
                        color: '#3498db'
                    })
                    .select()
                    .single();
                    
                if (bankError) {
                    console.error('[TESTE TRANSAÇÃO] Erro ao criar conta bancária:', bankError);
                    return '❌ Não foi possível criar uma conta bancária para teste.';
                }
                
                bank = newBank;
                console.log('[TESTE TRANSAÇÃO] Conta bancária criada:', bank.id);
            } else {
                bank = banks[0];
                console.log('[TESTE TRANSAÇÃO] Conta bancária encontrada:', bank.id);
            }
            
            // Verificar/criar categoria
            let category;
            const categoryType = type === 'gasto' ? 'expense' : 'income';
            const { data: categories } = await this.supabase
                .from('categories')
                .select('*')
                .eq('user_id', userId)
                .eq('type', categoryType);
                
            if (!categories || categories.length === 0) {
                console.log('[TESTE TRANSAÇÃO] Nenhuma categoria encontrada. Criando uma...');
                const categoryName = type === 'gasto' ? 'Teste (Despesa)' : 'Teste (Receita)';
                const { data: newCategory, error: categoryError } = await this.supabase
                    .from('categories')
                    .insert({
                        user_id: userId,
                        name: categoryName,
                        type: categoryType
                    })
                    .select()
                    .single();
                    
                if (categoryError) {
                    console.error('[TESTE TRANSAÇÃO] Erro ao criar categoria:', categoryError);
                    return '❌ Não foi possível criar uma categoria para teste.';
                }
                
                category = newCategory;
                console.log('[TESTE TRANSAÇÃO] Categoria criada:', category.id);
            } else {
                category = categories[0];
                console.log('[TESTE TRANSAÇÃO] Categoria encontrada:', category.id);
            }
            
            // Inserir transação
            const transactionData = {
                user_id: userId,
                bank_id: bank.id,
                category_id: category.id,
                type: type === 'gasto' ? 'expense' : 'income',
                amount: 1.99,
                description: 'Transação de teste',
                date: new Date().toISOString().split('T')[0],
                status: 'completed'
            };
            
            console.log('[TESTE TRANSAÇÃO] Dados da transação:', JSON.stringify(transactionData));
            
            const { data: transaction, error: transactionError } = await this.supabase
                .from('transactions')
                .insert(transactionData)
                .select();
                
            if (transactionError) {
                console.error('[TESTE TRANSAÇÃO] Erro ao inserir transação:', transactionError);
                return `❌ Erro ao inserir transação: ${transactionError.message}
                
Dados da transação: 
${JSON.stringify(transactionData, null, 2)}`;
            }
            
            console.log('[TESTE TRANSAÇÃO] Transação inserida com sucesso:', transaction);
            
            return `✅ Teste de ${type} concluído com sucesso!
            
Transação inserida:
- Valor: R$ 1,99
- Categoria: ${category.name}
- Conta: ${bank.name}
- Tipo: ${type === 'gasto' ? 'Despesa' : 'Receita'}
- Data: ${transactionData.date}
- ID: ${transaction[0].id}

O banco de dados está funcionando corretamente para inserção de transações.`;
            
        } catch (error) {
            console.error('[TESTE TRANSAÇÃO] Erro crítico:', error);
            return `❌ Erro crítico durante o teste: ${error.message}`;
        }
    }

    getDebugCommands() {
        return `🛠️ Comandos de diagnóstico e atalhos disponíveis:

1️⃣ Diagnóstico geral:
   - /diagnostico ou /db

2️⃣ Teste de detecção de comandos:
   - teste: [sua mensagem] (ex: "teste: recebi 2000 de salário")
   - /teste [mensagem] (ex: "/teste recebi 2000 de salário")

3️⃣ Testes de inserção direta:
   - /testegasto - Testa inserção de despesa
   - /testereceita - Testa inserção de receita

4️⃣ Comandos rápidos para transações:
   - /gasto [valor] [descrição] (ex: "/gasto 20 uber")
   - /receita [valor] [descrição] (ex: "/receita 2000 salário")

Use estes comandos se tiver problemas com o processamento normal de mensagens.`;
    }

    async processDirectTransaction(userId, type, amount, description) {
        console.log(`[TRANSACTION] Processando transação direta: tipo=${type}, valor=${amount}, descrição="${description}"`);
        console.log(`[TRANSACTION] URL do Supabase: ${this.supabase.supabaseUrl}`);
        console.log(`[TRANSACTION] Chave do Supabase disponível: ${this.supabase.supabaseKey ? 'Sim' : 'Não'}`);
        
        try {
            // Verificar se userId é válido
            if (!userId) {
                console.error('[TRANSACTION] ERRO: userId é nulo ou indefinido');
                return '❌ Erro: ID de usuário inválido';
            }
            
            console.log(`[TRANSACTION] ID do usuário: ${userId}`);
            
            // Verificar se amount é válido
            if (isNaN(amount) || amount <= 0) {
                console.error(`[TRANSACTION] ERRO: valor inválido: ${amount}`);
                return '❌ Erro: Valor inválido. Use um número positivo.';
            }
            
            // Verificar o plano do usuário
            const userPlan = await this.getUserPlan(userId);
            console.log(`[TRANSACTION] Plano do usuário: ${userPlan}`);
            
            // Determinar o tipo de categoria
            const categoryType = type === 'expense' ? 'expense' : 'income';
            
            console.log(`[TRANSACTION] Buscando categorias do tipo: ${categoryType}`);
            
            // Testar conexão com o Supabase com uma query simples
            try {
                const { data: testData, error: testError } = await this.supabase
                    .from('categories')
                    .select('count')
                    .limit(1);
                
                if (testError) {
                    console.error(`[TRANSACTION] TESTE DE CONEXÃO FALHOU: ${testError.message}`);
                    return `❌ Erro na conexão com o Supabase: ${testError.message}`;
                }
                
                console.log('[TRANSACTION] Teste de conexão com Supabase bem-sucedido');
            } catch (testErr) {
                console.error(`[TRANSACTION] EXCEÇÃO NO TESTE DE CONEXÃO: ${testErr.message}`);
                return `❌ Erro crítico na conexão: ${testErr.message}`;
            }
            
            // Buscar ou criar categoria apropriada
            let categoryId;
            
            // Buscar categoria que melhor se encaixa com a descrição
            console.log(`[TRANSACTION] Consultando categorias para usuário ${userId} do tipo ${categoryType}`);
            
            let categoriesResponse;
            try {
                categoriesResponse = await this.supabase
                    .from('categories')
                    .select('*')
                    .eq('user_id', userId)
                    .eq('type', categoryType);
            } catch (queryErr) {
                console.error(`[TRANSACTION] EXCEÇÃO NA CONSULTA DE CATEGORIAS: ${queryErr.message}`);
                return `❌ Exceção ao consultar categorias: ${queryErr.message}`;
            }
            
            const { data: categories, error: categoriesError } = categoriesResponse;
                     
            if (categoriesError) {
                console.error(`[TRANSACTION] Erro ao buscar categorias: ${categoriesError.message}`);
                return `❌ Erro ao buscar categorias: ${categoriesError.message}`;
            }
            
            console.log(`[TRANSACTION] Categorias encontradas: ${categories ? categories.length : 0}`);
            
            if (categories && categories.length > 0) {
                console.log(`[TRANSACTION] Categorias existentes: ${JSON.stringify(categories.map(c => c.name))}`);
                
                // Tentar encontrar uma categoria que corresponda à descrição
                let bestCategory = null;
                
                if (description && description.trim() !== '') {
                    const descLower = description.toLowerCase();
                    
                    // Primeira tentativa: correspondência exata
                    bestCategory = categories.find(c => 
                        c.name.toLowerCase() === descLower
                    );
                    
                    // Segunda tentativa: correspondência parcial
                    if (!bestCategory) {
                        bestCategory = categories.find(c => 
                            descLower.includes(c.name.toLowerCase()) || 
                            c.name.toLowerCase().includes(descLower)
                        );
                    }
                }
                
                // Se não encontrou uma correspondência, use a primeira categoria
                if (!bestCategory) {
                    bestCategory = categories[0];
                    console.log(`[TRANSACTION] Nenhuma categoria correspondente encontrada, usando primeira: ${bestCategory.name}`);
                } else {
                    console.log(`[TRANSACTION] Categoria correspondente encontrada: ${bestCategory.name}`);
                }
                
                categoryId = bestCategory.id;
            } else {
                // Criar categoria padrão
                console.log(`[TRANSACTION] Nenhuma categoria encontrada. Criando categoria padrão para ${categoryType}`);
                const defaultName = categoryType === 'expense' ? 'Outros' : 'Salário';
                
                let newCategoryResponse;
                try {
                    newCategoryResponse = await this.supabase
                        .from('categories')
                        .insert({
                            user_id: userId,
                            name: defaultName,
                            type: categoryType
                        })
                        .select()
                        .single();
                } catch (insertErr) {
                    console.error(`[TRANSACTION] EXCEÇÃO AO CRIAR CATEGORIA: ${insertErr.message}`);
                    return `❌ Exceção ao criar categoria: ${insertErr.message}`;
                }
                
                const { data: newCategory, error: categoryError } = newCategoryResponse;
                
                if (categoryError) {
                    console.error(`[TRANSACTION] Erro ao criar categoria: ${categoryError.message}`);
                    return `❌ Erro ao criar categoria: ${categoryError.message}`;
                }
                
                console.log(`[TRANSACTION] Nova categoria criada: ${newCategory.name} (${newCategory.id})`);
                categoryId = newCategory.id;
            }
            
            // Verificar se categoryId foi definido
            if (!categoryId) {
                console.error('[TRANSACTION] ERRO: categoryId não foi definido');
                return '❌ Erro: Categoria inválida';
            }
            
            // Preparar dados da transação para plano free (sem bank_id)
            const transactionData = {
                user_id: userId,
                category_id: categoryId,
                type: categoryType,
                amount: parseFloat(amount),
                description: description || (categoryType === 'expense' ? 'Gasto' : 'Receita'),
                date: new Date().toISOString().split('T')[0],
                status: 'completed'
            };
            
            // Usar bank_id apenas para planos pagos
            if (userPlan !== 'free') {
                // Para planos pagos, buscar conta bancária
                const { data: banks } = await this.supabase
                    .from('banks')
                    .select('id, name')
                    .eq('user_id', userId);
                
                if (banks && banks.length > 0) {
                    console.log(`[TRANSACTION] Banco selecionado: ${banks[0].name}`);
                    transactionData.bank_id = banks[0].id;
                }
            }
            
            console.log(`[TRANSACTION] Inserindo transação: ${JSON.stringify(transactionData)}`);
            
            // Inserir transação com tratamento detalhado de erro
            let transactionResponse;
            try {
                transactionResponse = await this.supabase
                    .from('transactions')
                    .insert(transactionData)
                    .select();
                
                console.log(`[TRANSACTION] Resposta da inserção: ${JSON.stringify(transactionResponse)}`);
            } catch (insertErr) {
                console.error(`[TRANSACTION] EXCEÇÃO AO INSERIR TRANSAÇÃO: ${insertErr.message}`);
                console.error(`[TRANSACTION] Detalhes do erro:`, insertErr);
                return `❌ Exceção ao inserir transação: ${insertErr.message}`;
            }
            
            const { data: transaction, error: transactionError } = transactionResponse;
            
            if (transactionError) {
                console.error(`[TRANSACTION] Erro ao inserir transação: ${transactionError.message}`);
                console.error(`[TRANSACTION] Detalhes do erro:`, transactionError);
                
                // Verificar se é um erro de restrição de plano
                if (transactionError.message.includes('limite') || transactionError.message.includes('limit')) {
                    return `❌ Erro: ${transactionError.message}\n\nVocê atingiu o limite do seu plano. Faça upgrade para continuar.`;
                }
                
                return `❌ Erro ao registrar transação: ${transactionError.message}`;
            }
            
            if (!transaction || transaction.length === 0) {
                console.warn('[TRANSACTION] Transação criada, mas nenhum dado retornado');
                return '✅ Transação registrada com sucesso!';
            }
            
            console.log(`[TRANSACTION] Transação registrada com sucesso: ID=${transaction[0].id}`);
            
            // Formatar resposta
            return `✅ ${categoryType === 'expense' ? 'Gasto' : 'Receita'} registrado!
Valor: R$ ${parseFloat(amount).toFixed(2)}
Descrição: ${description || (categoryType === 'expense' ? 'Gasto' : 'Receita')}
Categoria: ${categories.find(c => c.id === categoryId)?.name || 'Outros'}
Data: ${new Date().toLocaleDateString('pt-BR')}`;
        } catch (error) {
            console.error(`[TRANSACTION] Erro crítico ao processar transação:`, error);
            return `❌ Erro crítico ao processar transação: ${error.message}`;
        }
    }

    async handleLinkRequest(phone) {
        console.log(`[LINK] Processando solicitação de vinculação para: ${phone}`);
        
        try {
            // Verificar se já existe um vínculo
            const { data: existingLinks, error: linkError } = await this.supabase
                .from('whatsapp_links')
                .select('*')
                .eq('phone_number', phone);
                
            if (linkError) {
                console.error(`[LINK] Erro ao verificar vínculos existentes: ${linkError.message}`);
                return `❌ Erro ao verificar vínculos: ${linkError.message}`;
            }
            
            const activeLink = existingLinks?.find(link => link.is_verified);
            
            // Se já existe um vínculo verificado, informa o usuário
            if (activeLink) {
                console.log(`[LINK] Vínculo já existe para ${phone}: ${activeLink.user_id}`);
                return 'Seu WhatsApp já está vinculado a uma conta. Use os comandos disponíveis para gerenciar suas finanças.';
            }
            
            // Gerar código de verificação (6 dígitos)
            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
            console.log(`[LINK] Código gerado: ${verificationCode}`);
            
            // Inserir ou atualizar o vínculo
            let upsertOperation;
            
            if (existingLinks && existingLinks.length > 0) {
                // Atualizar vínculo existente
                console.log(`[LINK] Atualizando vínculo existente para ${phone}`);
                upsertOperation = this.supabase
                    .from('whatsapp_links')
                    .update({
                        verification_code: verificationCode,
                        is_verified: false,
                        updated_at: new Date().toISOString()
                    })
                    .eq('phone_number', phone);
            } else {
                // Criar novo vínculo
                console.log(`[LINK] Criando novo vínculo para ${phone}`);
                upsertOperation = this.supabase
                    .from('whatsapp_links')
                    .insert({
                        phone_number: phone,
                        verification_code: verificationCode,
                        is_verified: false
                    });
            }
            
            const { error: upsertError } = await upsertOperation;
            
            if (upsertError) {
                console.error(`[LINK] Erro ao criar/atualizar vínculo: ${upsertError.message}`);
                return `❌ Erro ao criar vínculo: ${upsertError.message}`;
            }
            
            console.log(`[LINK] Vínculo criado/atualizado com sucesso para ${phone}`);
            return `Por favor, acesse seu dashboard e insira o código: ${verificationCode}`;
        } catch (error) {
            console.error(`[LINK] Erro ao processar solicitação de vínculo: ${error}`);
            return `❌ Erro ao processar solicitação: ${error.message}`;
        }
    }

    async verificarVinculo(phone) {
        console.log(`[VINCULO] Verificando vínculo para telefone: ${phone}`);
        
        try {
            // Consultar link no Supabase
            const { data: links, error } = await this.supabase
                .from('whatsapp_links')
                .select('*')
                .eq('phone_number', phone);
                
            if (error) {
                console.error(`[VINCULO] Erro ao consultar vínculo: ${error.message}`);
                return null;
            }
            
            if (!links || links.length === 0) {
                console.log(`[VINCULO] Nenhum vínculo encontrado para ${phone}`);
                return null;
            }
            
            // Procurar um vínculo verificado
            const verifiedLink = links.find(link => link.is_verified);
            
            if (verifiedLink) {
                console.log(`[VINCULO] Vínculo verificado encontrado: ${verifiedLink.user_id}`);
                return verifiedLink;
            } else {
                console.log(`[VINCULO] Apenas vínculos não verificados encontrados para ${phone}`);
                return links[0]; // Retorna o primeiro vínculo não verificado
            }
        } catch (error) {
            console.error(`[VINCULO] Erro ao verificar vínculo: ${error.message}`);
            return null;
        }
    }

    async mostrarSaldo(userId) {
        try {
            // Verificar o plano do usuário
            const userPlan = await this.getUserPlan(userId);
            console.log('[SALDO] Plano do usuário:', userPlan);
            
            // Para plano free, calculamos saldo a partir de transações sem considerar contas
            if (userPlan === 'free') {
                console.log('[SALDO] Calculando saldo para plano free');
                
                // Buscar todas as transações do usuário
                const { data: transactions, error } = await this.supabase
                    .from('transactions')
                    .select('*')
                    .eq('user_id', userId);
                
                if (error) {
                    console.error('[SALDO] Erro ao buscar transações:', error);
                    return `❌ Erro ao buscar transações: ${error.message}`;
                }
                
                // Calcular saldo
                let saldo = 0;
                let totalReceitas = 0;
                let totalDespesas = 0;
                
                for (const transaction of transactions) {
                    if (transaction.type === 'income') {
                        saldo += transaction.amount;
                        totalReceitas += transaction.amount;
                    } else if (transaction.type === 'expense') {
                        saldo -= transaction.amount;
                        totalDespesas += transaction.amount;
                    }
                }
                
                // Formatar mensagem
                return `💰 *Seu saldo atual:* R$ ${saldo.toFixed(2)}
                
📥 *Total de receitas:* R$ ${totalReceitas.toFixed(2)}
📤 *Total de despesas:* R$ ${totalDespesas.toFixed(2)}

Você está no plano FREE. Para separar por contas bancárias, faça upgrade para um plano pago.`;
            }
            
            // Para planos pagos, buscar saldo por conta bancária
            const { data: banks, error } = await this.supabase
                .from('banks')
                .select('*')
                .eq('user_id', userId);
            
            if (error) {
                console.error('[SALDO] Erro ao buscar contas bancárias:', error);
                return `❌ Erro ao buscar contas bancárias: ${error.message}`;
            }
            
            if (!banks || banks.length === 0) {
                return 'Você ainda não tem nenhuma conta bancária cadastrada. Adicione uma conta no dashboard.';
            }
            
            // Calcular saldo total e formatar mensagem
            let saldoTotal = 0;
            let mensagem = '💰 *Seu saldo:*\n\n';
            
            for (const bank of banks) {
                mensagem += `🏦 *${bank.name}*: R$ ${bank.balance.toFixed(2)}\n`;
                saldoTotal += bank.balance;
            }
            
            mensagem += `\n💵 *Saldo total:* R$ ${saldoTotal.toFixed(2)}`;
            
            return mensagem;
        } catch (error) {
            console.error('[SALDO] Erro ao mostrar saldo:', error);
            return `❌ Erro ao consultar saldo: ${error.message}`;
        }
    }

    /**
     * Lista as categorias do usuário
     */
    async listarCategorias(userId) {
        console.log(`[CATEGORIAS] Buscando categorias para usuário: ${userId}`);
        
        try {
            // Buscar categorias de despesa
            const { data: despesas, error: despesasError } = await this.supabase
                .from('categories')
                .select('*')
                .eq('user_id', userId)
                .eq('type', 'expense');
                
            if (despesasError) {
                console.error(`[CATEGORIAS] Erro ao buscar despesas: ${despesasError.message}`);
                return `❌ Erro ao buscar categorias de despesa: ${despesasError.message}`;
            }
            
            // Buscar categorias de receita
            const { data: receitas, error: receitasError } = await this.supabase
                .from('categories')
                .select('*')
                .eq('user_id', userId)
                .eq('type', 'income');
                
            if (receitasError) {
                console.error(`[CATEGORIAS] Erro ao buscar receitas: ${receitasError.message}`);
                return `❌ Erro ao buscar categorias de receita: ${receitasError.message}`;
            }
            
            // Formatar resposta
            let resposta = '📋 Suas categorias:\n\n';
            
            // Categorias de despesa
            resposta += '🔴 Despesas:\n';
            if (despesas && despesas.length > 0) {
                despesas.forEach(categoria => {
                    resposta += `- ${categoria.name}\n`;
                });
            } else {
                resposta += '- Nenhuma categoria de despesa encontrada\n';
            }
            
            resposta += '\n🟢 Receitas:\n';
            if (receitas && receitas.length > 0) {
                receitas.forEach(categoria => {
                    resposta += `- ${categoria.name}\n`;
                });
            } else {
                resposta += '- Nenhuma categoria de receita encontrada\n';
            }
            
            return resposta;
        } catch (error) {
            console.error(`[CATEGORIAS] Erro ao listar categorias: ${error}`);
            return `❌ Erro ao listar categorias: ${error.message}`;
        }
    }
}

