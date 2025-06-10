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

            if (this.isCriarCategoria(msgLower)) {
                console.log('[DEBUG] Detectou criação de categoria');
                return this.criarCategoria(userId, message);
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
                
                // Novas funcionalidades premium para criar cartões e contas
                if (this.isCriarCartao(msgLower)) {
                    console.log('[DEBUG] Detectou criação de cartão de crédito');
                    return this.criarCartao(userId, message);
                }
                
                if (this.isCriarContaBancaria(msgLower)) {
                    console.log('[DEBUG] Detectou criação de conta bancária');
                    return this.criarContaBancaria(userId, message);
                }
            } else if (this.isCriarCartao(msgLower) || this.isCriarContaBancaria(msgLower)) {
                // Se não é premium mas tentou criar cartão ou conta
                return `Esta funcionalidade está disponível apenas para usuários do plano Premium. 

Para fazer upgrade do seu plano e poder criar cartões e contas bancárias pelo WhatsApp, digite "upgrade".`;
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
        welcomeMessage += `➕ Criar categorias (ex: "criar categoria Restaurantes")\n`;
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
            welcomeMessage += `💳 Criar cartão de crédito (ex: "criar cartão Nubank")\n`;
            welcomeMessage += `🏦 Criar conta bancária (ex: "criar conta Itaú")\n`;
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
                `✅ Criar categorias\n` +
                `✅ Registrar receitas\n\n` +
                `Para ter acesso a relatórios e mais funcionalidades, faça upgrade para o plano BASIC ou PREMIUM.`;
        } else if (userPlan === 'basic') {
            planMessage = `No plano BASIC você pode:\n` +
                `✅ Registrar gastos e receitas\n` +
                `✅ Consultar seu saldo\n` +
                `✅ Listar e criar categorias\n` +
                `✅ Gerar relatórios detalhados\n\n` +
                `Para ter acesso a investimentos, cartões de crédito e metas, faça upgrade para o plano PREMIUM.`;
        } else if (userPlan === 'premium') {
            planMessage = `No plano PREMIUM você tem acesso a todas as funcionalidades:\n` +
                `✅ Registrar gastos e receitas\n` +
                `✅ Consultar seu saldo\n` +
                `✅ Listar e criar categorias\n` +
                `✅ Gerar relatórios detalhados\n` +
                `✅ Gerenciar investimentos\n` +
                `✅ Controlar cartões de crédito\n` +
                `✅ Criar cartões de crédito pelo WhatsApp\n` +
                `✅ Criar contas bancárias pelo WhatsApp\n` +
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
                    '➕ Criar categorias (ex: "criar categoria Restaurantes")\n' +
                    '💸 Registrar receitas (ex: "recebi 2000 de salário")\n';

        if (plano === 'basic' || plano === 'premium') {
            mensagem += '📊 Gerar relatórios (ex: "relatório do mês")\n';
        }

        if (plano === 'premium') {
            mensagem += '📈 Consultar investimentos (ex: "meus investimentos")\n' +
                        '💳 Gerenciar cartões (ex: "fatura do cartão")\n' +
                        '💳 Criar cartão de crédito (ex: "criar cartão Nubank")\n' +
                        '🏦 Criar conta bancária (ex: "criar conta Itaú")\n' +
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
        // Padrões para detecção de gastos
        const gastoPatterns = [
            // Padrões com "gastei"
            { pattern: /gastei\s+\d+/, description: 'gastei + número' },
            { pattern: /gastei\s+r?\$?\s*\d+/, description: 'gastei + R$ + número' },
            
            // Padrões com "gasto"
            { pattern: /gasto\s+\d+/, description: 'gasto + número' },
            { pattern: /gasto\s+de\s+\d+/, description: 'gasto de + número' },
            
            // Padrões com "paguei"
            { pattern: /paguei\s+\d+/, description: 'paguei + número' },
            { pattern: /paguei\s+r?\$?\s*\d+/, description: 'paguei + R$ + número' },
            
            // Padrões com "comprei"
            { pattern: /comprei\s+\w+\s+por\s+\d+/, description: 'comprei algo por + número' },
            { pattern: /comprei\s+\w+\s+de\s+\d+/, description: 'comprei algo de + número' },
            { pattern: /comprei\s+\d+/, description: 'comprei + número' },
            
            // Padrões com "fiz"
            { pattern: /fiz\s+uma\s+compra\s+de\s+\d+/, description: 'fiz uma compra de + número' },
            { pattern: /fiz\s+um\s+gasto\s+de\s+\d+/, description: 'fiz um gasto de + número' },
            
            // Padrões com "usei"
            { pattern: /usei\s+\d+/, description: 'usei + número' },
            { pattern: /usei\s+o\s+cartão\s+\w+\s+\d+/, description: 'usei o cartão + número' },
            { pattern: /usei\s+r?\$?\s*\d+/, description: 'usei + R$ + número' },
            
            // Padrões com verbos alternativos
            { pattern: /desembolsei\s+\d+/, description: 'desembolsei + número' },
            { pattern: /investi\s+\d+/, description: 'investi + número' },
            { pattern: /torrei\s+\d+/, description: 'torrei + número' },
            { pattern: /coloquei\s+\d+/, description: 'coloquei + número' },
            { pattern: /passei\s+\d+\s+no\s+cartão/, description: 'passei + número + no cartão' },
            { pattern: /passei\s+no\s+cartão\s+\d+/, description: 'passei no cartão + número' },
            
            // Padrões com "foi"
            { pattern: /foi\s+\d+\s+reais/, description: 'foi + número + reais' },
            { pattern: /foram\s+\d+\s+reais/, description: 'foram + número + reais' },
            
            // Padrões com "saiu"
            { pattern: /saiu\s+\d+/, description: 'saiu + número' },
            { pattern: /saiu\s+por\s+\d+/, description: 'saiu por + número' },
            
            // Padrões com "custou"
            { pattern: /custou\s+\d+/, description: 'custou + número' },
            { pattern: /custou\s+r?\$?\s*\d+/, description: 'custou + R$ + número' },
            
            // Padrões com "conta"
            { pattern: /conta\s+de\s+\d+/, description: 'conta de + número' },
            { pattern: /conta\s+foi\s+\d+/, description: 'conta foi + número' },
            
            // Padrões com "valor"
            { pattern: /valor\s+de\s+\d+/, description: 'valor de + número' },
            { pattern: /valor\s+foi\s+\d+/, description: 'valor foi + número' },
            
            // Padrões com "R$"
            { pattern: /r\$\s*\d+/, description: 'R$ + número' }
        ];
        
        // Verificar se a mensagem contém algum dos padrões de gasto
        for (const { pattern, description } of gastoPatterns) {
            if (pattern.test(msg)) {
                console.log(`[DEBUG] isGasto - Detectou padrão "${description}"`);
                return true;
            }
        }
        
        // Verificar palavras-chave específicas
        const gastoKeywords = [
            'despesa', 'débito', 'debito', 'boleto', 'fatura',
            'pagamento', 'compra', 'gastar', 'gasto', 'gastei', 
            'paguei', 'comprei', 'conta', 'mercado', 'supermercado',
            'farmácia', 'farmacia', 'restaurante', 'lanche', 'combustível',
            'combustivel', 'uber', '99', 'táxi', 'taxi', 'transporte',
            'academia', 'mensalidade', 'assinatura', 'netflix', 'spotify',
            'amazon', 'ifood', 'rappi', 'delivery'
        ];
        
        // Se contém uma palavra-chave de gasto E um número, provavelmente é um gasto
        if (gastoKeywords.some(keyword => msg.includes(keyword)) && /\d+/.test(msg)) {
            console.log('[DEBUG] isGasto - Detectou palavra-chave de gasto + número');
            return true;
        }
        
        console.log('[DEBUG] isGasto - Nenhum padrão de gasto detectado');
        return false;
    }

    isConsultaSaldo(msg) {
        const saldoIndicators = [
            'saldo', 'quanto tenho', 'quanto tem', 'disponível', 'disponivel',
            'conta', 'extrato', 'mostrar saldo', 'ver saldo', 'qual o saldo',
            'quanto sobrou', 'quanto há', 'quanto há na conta', 'quanto tem na conta',
            'dinheiro', 'grana', 'bufunfa', 'quanto eu tenho', 'meu saldo',
            'minha conta', 'nas contas', 'na conta', 'no banco', 'meu dinheiro',
            'minha grana', 'quanto ainda tenho', 'sobrou quanto', 'restou quanto',
            'balanço atual', 'balanco atual', 'situação atual', 'situacao atual',
            'como estou de grana', 'como estou de dinheiro', 'posição atual', 'posicao atual',
            'quanto está disponível', 'quanto esta disponivel', 'total disponível', 'total disponivel'
        ];
        return saldoIndicators.some(indicator => msg.includes(indicator));
    }

    isConsultaCategorias(msg) {
        const categoriasIndicators = [
            'categoria', 'categorias', 'tipos de gasto', 'tipos de despesa',
            'onde posso gastar', 'quais categorias', 'lista de categorias',
            'mostrar categorias', 'ver categorias', 'listar categorias',
            'quais são as categorias', 'quais sao as categorias', 'categorias disponíveis',
            'categorias disponiveis', 'me mostra as categorias', 'categorias de gasto',
            'categorias de despesa', 'categorias cadastradas', 'minhas categorias',
            'categorias existentes', 'tipos de despesa', 'tipos de gasto',
            'classificação', 'classificacao', 'tipos de transação', 'tipos de transacao'
        ];
        return categoriasIndicators.some(indicator => msg.includes(indicator));
    }

    isCriarCategoria(msg) {
        // Padrões para detecção de solicitação de criação de categoria
        const criarCategoriaPatterns = [
            // Padrões com "criar"
            { pattern: /cri[ae]r\s+(uma\s+)?(nova\s+)?categoria/i, description: 'criar categoria' },
            { pattern: /cri[ae]r\s+(uma\s+)?(nova\s+)?categoria\s+(\w+)/i, description: 'criar categoria nome' },
            { pattern: /cri[ae]r\s+(uma\s+)?(nova\s+)?categoria\s+de\s+(\w+)/i, description: 'criar categoria de nome' },
            
            // Padrões com "adicionar"
            { pattern: /adicionar\s+(uma\s+)?(nova\s+)?categoria/i, description: 'adicionar categoria' },
            { pattern: /adicionar\s+(uma\s+)?(nova\s+)?categoria\s+(\w+)/i, description: 'adicionar categoria nome' },
            { pattern: /adicionar\s+(uma\s+)?(nova\s+)?categoria\s+de\s+(\w+)/i, description: 'adicionar categoria de nome' },
            
            // Padrões com "nova"
            { pattern: /nova\s+categoria\s+(\w+)/i, description: 'nova categoria nome' },
            { pattern: /nova\s+categoria\s+de\s+(\w+)/i, description: 'nova categoria de nome' },
            
            // Padrões com "cadastrar"
            { pattern: /cadastrar\s+(uma\s+)?(nova\s+)?categoria/i, description: 'cadastrar categoria' },
            { pattern: /cadastrar\s+(uma\s+)?(nova\s+)?categoria\s+(\w+)/i, description: 'cadastrar categoria nome' },
            { pattern: /cadastrar\s+(uma\s+)?(nova\s+)?categoria\s+de\s+(\w+)/i, description: 'cadastrar categoria de nome' },
            
            // Padrões com "incluir"
            { pattern: /incluir\s+(uma\s+)?(nova\s+)?categoria/i, description: 'incluir categoria' },
            { pattern: /incluir\s+(uma\s+)?(nova\s+)?categoria\s+(\w+)/i, description: 'incluir categoria nome' },
            { pattern: /incluir\s+(uma\s+)?(nova\s+)?categoria\s+de\s+(\w+)/i, description: 'incluir categoria de nome' }
        ];
        
        // Verificar se a mensagem contém algum dos padrões de criação de categoria
        for (const { pattern, description } of criarCategoriaPatterns) {
            if (pattern.test(msg)) {
                console.log(`[DEBUG] isCriarCategoria - Detectou padrão "${description}"`);
                return true;
            }
        }
        
        // Verificar palavras-chave específicas em conjunto
        if ((msg.includes('categoria') || msg.includes('categorias')) && 
            (msg.includes('criar') || msg.includes('nova') || msg.includes('adicionar') || 
             msg.includes('cadastrar') || msg.includes('incluir'))) {
            console.log('[DEBUG] isCriarCategoria - Detectou palavras-chave de criação de categoria');
            return true;
        }
        
        return false;
    }

    isCriarCartao(msg) {
        // Padrões para detecção de solicitação de criação de cartão de crédito
        const criarCartaoPatterns = [
            // Padrões com "criar"
            { pattern: /cri[ae]r\s+(um\s+)?(novo\s+)?cart[ãa]o/i, description: 'criar cartão' },
            { pattern: /cri[ae]r\s+(um\s+)?(novo\s+)?cart[ãa]o\s+(\w+)/i, description: 'criar cartão nome' },
            { pattern: /cri[ae]r\s+(um\s+)?(novo\s+)?cart[ãa]o\s+de\s+cr[ée]dito/i, description: 'criar cartão de crédito' },
            { pattern: /cri[ae]r\s+(um\s+)?(novo\s+)?cart[ãa]o\s+de\s+cr[ée]dito\s+(\w+)/i, description: 'criar cartão de crédito nome' },
            
            // Padrões com "adicionar"
            { pattern: /adicionar\s+(um\s+)?(novo\s+)?cart[ãa]o/i, description: 'adicionar cartão' },
            { pattern: /adicionar\s+(um\s+)?(novo\s+)?cart[ãa]o\s+(\w+)/i, description: 'adicionar cartão nome' },
            { pattern: /adicionar\s+(um\s+)?(novo\s+)?cart[ãa]o\s+de\s+cr[ée]dito/i, description: 'adicionar cartão de crédito' },
            { pattern: /adicionar\s+(um\s+)?(novo\s+)?cart[ãa]o\s+de\s+cr[ée]dito\s+(\w+)/i, description: 'adicionar cartão de crédito nome' },
            
            // Padrões com "novo"
            { pattern: /novo\s+cart[ãa]o/i, description: 'novo cartão' },
            { pattern: /novo\s+cart[ãa]o\s+(\w+)/i, description: 'novo cartão nome' },
            { pattern: /novo\s+cart[ãa]o\s+de\s+cr[ée]dito/i, description: 'novo cartão de crédito' },
            { pattern: /novo\s+cart[ãa]o\s+de\s+cr[ée]dito\s+(\w+)/i, description: 'novo cartão de crédito nome' },
            
            // Padrões com "cadastrar"
            { pattern: /cadastrar\s+(um\s+)?(novo\s+)?cart[ãa]o/i, description: 'cadastrar cartão' },
            { pattern: /cadastrar\s+(um\s+)?(novo\s+)?cart[ãa]o\s+(\w+)/i, description: 'cadastrar cartão nome' },
            { pattern: /cadastrar\s+(um\s+)?(novo\s+)?cart[ãa]o\s+de\s+cr[ée]dito/i, description: 'cadastrar cartão de crédito' },
            { pattern: /cadastrar\s+(um\s+)?(novo\s+)?cart[ãa]o\s+de\s+cr[ée]dito\s+(\w+)/i, description: 'cadastrar cartão de crédito nome' }
        ];
        
        // Verificar se a mensagem contém algum dos padrões de criação de cartão
        for (const { pattern, description } of criarCartaoPatterns) {
            if (pattern.test(msg)) {
                console.log(`[DEBUG] isCriarCartao - Detectou padrão "${description}"`);
                return true;
            }
        }
        
        // Verificar palavras-chave específicas em conjunto
        if ((msg.includes('cartão') || msg.includes('cartao')) && 
            (msg.includes('criar') || msg.includes('novo') || msg.includes('adicionar') || 
             msg.includes('cadastrar'))) {
            console.log('[DEBUG] isCriarCartao - Detectou palavras-chave de criação de cartão');
            return true;
        }
        
        return false;
    }

    isCriarContaBancaria(msg) {
        // Padrões para detecção de solicitação de criação de conta bancária
        const criarContaPatterns = [
            // Padrões com "criar"
            { pattern: /cri[ae]r\s+(uma\s+)?(nova\s+)?conta/i, description: 'criar conta' },
            { pattern: /cri[ae]r\s+(uma\s+)?(nova\s+)?conta\s+(\w+)/i, description: 'criar conta nome' },
            { pattern: /cri[ae]r\s+(uma\s+)?(nova\s+)?conta\s+banc[áa]ria/i, description: 'criar conta bancária' },
            { pattern: /cri[ae]r\s+(uma\s+)?(nova\s+)?conta\s+banc[áa]ria\s+(\w+)/i, description: 'criar conta bancária nome' },
            { pattern: /cri[ae]r\s+(um\s+)?(novo\s+)?banco/i, description: 'criar banco' },
            { pattern: /cri[ae]r\s+(um\s+)?(novo\s+)?banco\s+(\w+)/i, description: 'criar banco nome' },
            
            // Padrões com "adicionar"
            { pattern: /adicionar\s+(uma\s+)?(nova\s+)?conta/i, description: 'adicionar conta' },
            { pattern: /adicionar\s+(uma\s+)?(nova\s+)?conta\s+(\w+)/i, description: 'adicionar conta nome' },
            { pattern: /adicionar\s+(uma\s+)?(nova\s+)?conta\s+banc[áa]ria/i, description: 'adicionar conta bancária' },
            { pattern: /adicionar\s+(uma\s+)?(nova\s+)?conta\s+banc[áa]ria\s+(\w+)/i, description: 'adicionar conta bancária nome' },
            { pattern: /adicionar\s+(um\s+)?(novo\s+)?banco/i, description: 'adicionar banco' },
            { pattern: /adicionar\s+(um\s+)?(novo\s+)?banco\s+(\w+)/i, description: 'adicionar banco nome' },
            
            // Padrões com "nova"
            { pattern: /nova\s+conta/i, description: 'nova conta' },
            { pattern: /nova\s+conta\s+(\w+)/i, description: 'nova conta nome' },
            { pattern: /nova\s+conta\s+banc[áa]ria/i, description: 'nova conta bancária' },
            { pattern: /nova\s+conta\s+banc[áa]ria\s+(\w+)/i, description: 'nova conta bancária nome' },
            { pattern: /novo\s+banco/i, description: 'novo banco' },
            { pattern: /novo\s+banco\s+(\w+)/i, description: 'novo banco nome' },
            
            // Padrões com "cadastrar"
            { pattern: /cadastrar\s+(uma\s+)?(nova\s+)?conta/i, description: 'cadastrar conta' },
            { pattern: /cadastrar\s+(uma\s+)?(nova\s+)?conta\s+(\w+)/i, description: 'cadastrar conta nome' },
            { pattern: /cadastrar\s+(uma\s+)?(nova\s+)?conta\s+banc[áa]ria/i, description: 'cadastrar conta bancária' },
            { pattern: /cadastrar\s+(uma\s+)?(nova\s+)?conta\s+banc[áa]ria\s+(\w+)/i, description: 'cadastrar conta bancária nome' },
            { pattern: /cadastrar\s+(um\s+)?(novo\s+)?banco/i, description: 'cadastrar banco' },
            { pattern: /cadastrar\s+(um\s+)?(novo\s+)?banco\s+(\w+)/i, description: 'cadastrar banco nome' }
        ];
        
        // Verificar se a mensagem contém algum dos padrões de criação de conta
        for (const { pattern, description } of criarContaPatterns) {
            if (pattern.test(msg)) {
                console.log(`[DEBUG] isCriarContaBancaria - Detectou padrão "${description}"`);
                return true;
            }
        }
        
        // Verificar palavras-chave específicas em conjunto
        if ((msg.includes('conta') || msg.includes('banco')) && 
            (msg.includes('criar') || msg.includes('nova') || msg.includes('novo') || 
             msg.includes('adicionar') || msg.includes('cadastrar'))) {
            console.log('[DEBUG] isCriarContaBancaria - Detectou palavras-chave de criação de conta');
            return true;
        }
        
        return false;
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
        // Padrões para detecção de receitas
        const receitaPatterns = [
            // Padrões com "recebi"
            { pattern: /recebi\s+\d+/, description: 'recebi + número' },
            { pattern: /recebi\s+r?\$?\s*\d+/, description: 'recebi + R$ + número' },
            { pattern: /recebi\s+\w+\s+de\s+\d+/, description: 'recebi algo de + número' },
            
            // Padrões com "ganhei"
            { pattern: /ganhei\s+\d+/, description: 'ganhei + número' },
            { pattern: /ganhei\s+r?\$?\s*\d+/, description: 'ganhei + R$ + número' },
            
            // Padrões com "salário"
            { pattern: /sal[aá]rio\s+de\s+\d+/, description: 'salário de + número' },
            { pattern: /sal[aá]rio\s+\d+/, description: 'salário + número' },
            { pattern: /meu\s+sal[aá]rio\s+[ée]\s+\d+/, description: 'meu salário é + número' },
            { pattern: /meu\s+sal[aá]rio\s+foi\s+\d+/, description: 'meu salário foi + número' },
            
            // Padrões com "entrou"
            { pattern: /entrou\s+\d+/, description: 'entrou + número' },
            { pattern: /entrou\s+r?\$?\s*\d+/, description: 'entrou + R$ + número' },
            { pattern: /entrou\s+\d+\s+na\s+conta/, description: 'entrou + número + na conta' },
            { pattern: /entrou\s+\d+\s+no\s+banco/, description: 'entrou + número + no banco' },
            
            // Padrões com "depositaram"
            { pattern: /depositaram\s+\d+/, description: 'depositaram + número' },
            { pattern: /depositaram\s+r?\$?\s*\d+/, description: 'depositaram + R$ + número' },
            
            // Padrões com "depósito"
            { pattern: /dep[óo]sito\s+de\s+\d+/, description: 'depósito de + número' },
            { pattern: /dep[óo]sito\s+\d+/, description: 'depósito + número' },
            
            // Padrões com "transferência"
            { pattern: /transfer[êe]ncia\s+de\s+\d+/, description: 'transferência de + número' },
            { pattern: /transfer[êe]ncia\s+\d+/, description: 'transferência + número' },
            { pattern: /transferiram\s+\d+/, description: 'transferiram + número' },
            
            // Padrões com "pix"
            { pattern: /pix\s+de\s+\d+/, description: 'pix de + número' },
            { pattern: /pix\s+\d+/, description: 'pix + número' },
            { pattern: /recebi\s+um\s+pix\s+de\s+\d+/, description: 'recebi um pix de + número' },
            
            // Padrões com "pagamento"
            { pattern: /pagamento\s+de\s+\d+/, description: 'pagamento de + número' },
            { pattern: /pagamento\s+\d+/, description: 'pagamento + número' },
            { pattern: /me\s+pagaram\s+\d+/, description: 'me pagaram + número' },
            
            // Padrões com "rendimento"
            { pattern: /rendimento\s+de\s+\d+/, description: 'rendimento de + número' },
            { pattern: /rendimento\s+\d+/, description: 'rendimento + número' },
            { pattern: /rendeu\s+\d+/, description: 'rendeu + número' },
            
            // Padrões com "valor"
            { pattern: /valor\s+de\s+\d+\s+recebido/, description: 'valor de + número + recebido' },
            
            // Padrões com "caiu"
            { pattern: /caiu\s+\d+\s+na\s+conta/, description: 'caiu + número + na conta' },
            { pattern: /caiu\s+\d+/, description: 'caiu + número' },
            
            // Padrões com "receita"
            { pattern: /receita\s+de\s+\d+/, description: 'receita de + número' },
            { pattern: /receita\s+\d+/, description: 'receita + número' },
            
            // Padrões com "faturei"
            { pattern: /faturei\s+\d+/, description: 'faturei + número' },
            { pattern: /faturei\s+r?\$?\s*\d+/, description: 'faturei + R$ + número' },
            
            // Padrões com "vendi"
            { pattern: /vendi\s+\w+\s+por\s+\d+/, description: 'vendi algo por + número' },
            { pattern: /vendi\s+por\s+\d+/, description: 'vendi por + número' },
            
            // Padrões com "lucro"
            { pattern: /lucro\s+de\s+\d+/, description: 'lucro de + número' },
            { pattern: /lucro\s+\d+/, description: 'lucro + número' },
            { pattern: /lucrei\s+\d+/, description: 'lucrei + número' }
        ];
        
        // Verificar se a mensagem contém algum dos padrões de receita
        for (const { pattern, description } of receitaPatterns) {
            if (pattern.test(msg)) {
                console.log(`[DEBUG] isAdicionarReceita - Detectou padrão "${description}"`);
                return true;
            }
        }
        
        // Verificar palavras-chave específicas
        const receitaKeywords = [
            'recebi', 'ganhei', 'salário', 'salario', 'pagamento', 
            'depósito', 'deposito', 'transferência', 'transferencia', 
            'pix', 'entrada', 'receita', 'rendimento', 'dividendo',
            'freelance', 'freela', 'comissão', 'comissao', 'bônus',
            'bonus', 'prêmio', 'premio', 'restituição', 'restituicao',
            'aluguel', 'pensão', 'pensao', 'aposentadoria', 'benefício',
            'beneficio', 'bolsa', 'estágio', 'estagio', 'mesada',
            'vendi', 'faturei', 'lucrei', 'receita'
        ];
        
        // Se contém uma palavra-chave de receita E um número, provavelmente é uma receita
        if (receitaKeywords.some(keyword => msg.includes(keyword)) && /\d+/.test(msg)) {
            console.log('[DEBUG] isAdicionarReceita - Detectou palavra-chave de receita + número');
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
            return 'Eita! Não consegui identificar quanto você gastou 😅 Me fala o valor certinho (ex: "gastei 20 reais")';
        }
        const valor = parseFloat(valorMatch[0].replace(',', '.'));

        try {
            // Verificar o plano do usuário
            const userPlan = await this.getUserPlan(userId);
            console.log('[GASTO] Plano do usuário:', userPlan);
            
            // Verificar se é uma transação com cartão de crédito
            const isCartaoCredito = msgLower.includes('cartão') || msgLower.includes('cartao') || 
                                   msgLower.includes('crédito') || msgLower.includes('credito');
            
            let creditCardId = null;
            let selectedBank = null;
            
            // Se for cartão de crédito, buscar o cartão mencionado
            if (isCartaoCredito) {
                console.log('[GASTO] Detectado uso de cartão de crédito');
                
                // Buscar cartões de crédito do usuário
                const { data: creditCards } = await this.supabase
                    .from('credit_cards')
                    .select('id, name')
                    .eq('user_id', userId);
                
                console.log('[GASTO] Cartões disponíveis:', creditCards);
                
                // Verificar se algum cartão foi mencionado na mensagem
                if (creditCards && creditCards.length > 0) {
                    for (const card of creditCards) {
                        if (msgLower.includes(card.name.toLowerCase())) {
                            creditCardId = card.id;
                            console.log('[GASTO] Cartão encontrado:', card.name, card.id);
                            break;
                        }
                    }
                    
                    // Se não identificou cartão específico, usa o primeiro
                    if (!creditCardId) {
                        creditCardId = creditCards[0].id;
                        console.log('[GASTO] Usando primeiro cartão disponível:', creditCards[0].name, creditCardId);
                    }
                }
            }
            
            // Para plano free, usamos um fluxo simplificado sem contas bancárias
            if (userPlan === 'free') {
                console.log('[GASTO] Usando fluxo simplificado para plano free');
                
                // Identificar categoria
                let category;
                const words = msgLower.split(' ');
                const commonWords = ['reais', 'gastei', 'paguei', 'comprei', 'no', 'na', 'em', 'com', 'de', 'do', 'da', 
                                    'cartão', 'cartao', 'crédito', 'credito'];
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
                        return `Ops! Deu ruim ao criar a categoria 😬 Erro: ${categoryError.message}`;
                    }
                    
                    category = newCategory;
                }
                
                // Inserir transação diretamente
                const transactionData = {
                    user_id: userId,
                    category_id: category.id,
                    type: 'expense',
                    amount: valor,
                    description: possibleCategories.length > 0 ? possibleCategories[0] : 'Gasto',
                    date: new Date().toISOString().split('T')[0],
                    status: 'completed',
                    credit_card_id: creditCardId // Adicionamos o ID do cartão, se houver
                };
                
                console.log('[GASTO] Inserindo transação:', transactionData);
                
                const { data: transaction, error: transactionError } = await this.supabase
                    .from('transactions')
                    .insert(transactionData)
                    .select();
                
                if (transactionError) {
                    console.error('[GASTO] Erro ao inserir transação:', transactionError);
                    return `Eita! Algo deu errado ao registrar seu gasto 😅 ${transactionError.message}`;
                }
                
                console.log('[GASTO] Transação registrada com sucesso:', transaction);
                
                const cartaoInfo = creditCardId ? ' no cartão' : '';
                
                return `🎯 Gasto anotado${cartaoInfo}! 💸

💰 Valor: R$ ${valor.toFixed(2)}
📝 Categoria: ${category.name}
📅 Data: ${new Date().toLocaleDateString('pt-BR')}

Tá tudo certo por aqui! 👌`;
            }
            
            // Para outros planos, usa o fluxo normal com contas bancárias
            // Identificar o banco/cartão
            const { data: banks } = await this.supabase
                .from('banks')
                .select('id, name')
                .eq('user_id', userId);

            if (!creditCardId) {
                // Se não for cartão de crédito, procura um banco
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
                        return 'Hmm, não consegui criar uma conta bancária pra você 🤔 Dá uma olhada no app e adiciona uma conta lá, beleza?';
                    }
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
                        
                        // Depois busca novamente
                        const { data: newCategories } = await this.supabase
                            .from('categories')
                            .select('id, name')
                            .eq('user_id', userId)
                            .eq('type', 'expense');
                            
                        if (newCategories && newCategories.length > 0) {
                            category = newCategories[0];
                        }
                    } catch (error) {
                        console.error('Erro ao criar categorias básicas:', error);
                        return 'Opa! Não consegui criar categorias pra você 😅 Dá um pulinho no app e cria algumas categorias lá, pode ser?';
                    }
                } else {
                    // Usa a primeira categoria disponível
                    category = categories[0];
                }
            }

            // Agora que temos banco/cartão e categoria, inserimos a transação
            const transactionData = {
                user_id: userId,
                bank_id: selectedBank?.id || null,
                category_id: category.id,
                type: 'expense',
                amount: valor,
                description: possibleCategories.length > 0 ? possibleCategories[0] : 'Gasto',
                date: new Date().toISOString().split('T')[0],
                status: 'completed',
                credit_card_id: creditCardId
            };
            
            console.log('[GASTO] Inserindo transação:', transactionData);
            
            const { data: transaction, error: transactionError } = await this.supabase
                .from('transactions')
                .insert(transactionData)
                .select();
            
            if (transactionError) {
                console.error('[GASTO] Erro ao inserir transação:', transactionError);
                return `Opa! Algo deu errado ao salvar seu gasto 😬 ${transactionError.message}`;
            }
            
            console.log('[GASTO] Transação registrada com sucesso:', transaction);
            
            const meioPagamento = creditCardId ? 'cartão de crédito' : selectedBank.name;
            
            return `🎯 Gasto anotado! 💸

💰 Valor: R$ ${valor.toFixed(2)}
📝 Descrição: ${transactionData.description}
🏷️ Categoria: ${category.name}
💳 Meio: ${meioPagamento}
📅 Data: ${new Date().toLocaleDateString('pt-BR')}

Tá tudo certo por aqui! 👌`;
        } catch (error) {
            console.error('[GASTO] Erro ao processar gasto:', error);
            return `Eita! Deu um probleminha aqui 😅 ${error.message}`;
        }
    }

    async handleBalance(userId) {
        try {
            const { data: banks, error } = await this.supabase
                .from('banks')
                .select('name, balance')
                .eq('user_id', userId);
                
            if (error) throw error;
            
            if (!banks || banks.length === 0) {
                return 'Você ainda não tem nenhuma conta bancária cadastrada. Adicione uma no dashboard!';
            }
            
            // Calcular saldo total
            const totalBalance = banks.reduce((total, bank) => total + (bank.balance || 0), 0);
            
            // Formatar mensagem
            const bankDetails = banks.map(bank => 
                `${bank.name}: ${formatCurrency(bank.balance || 0)}`
            ).join('\n');
            
            return `💰 Seu saldo atual:

${bankDetails}

🏦 Total: ${formatCurrency(totalBalance)}

Tá querendo economizar mais? Me conta como posso te ajudar! 😉`;
        } catch (error) {
            console.error('Erro ao consultar saldo:', error);
            return 'Opa! Tive um probleminha pra ver seu saldo. Tenta de novo daqui a pouco, beleza? 😅';
        }
    }

    async handleCategories(userId) {
        try {
            const { data: categories, error } = await this.supabase
                .from('categories')
                .select('name, type')
                .eq('user_id', userId);
                
            if (error) throw error;
            
            if (!categories || categories.length === 0) {
                return 'Você ainda não tem categorias cadastradas. Adicione algumas no dashboard!';
            }
            
            // Separar categorias por tipo
            const expenseCategories = categories
                .filter(cat => cat.type === 'expense')
                .map(cat => cat.name);
                
            const incomeCategories = categories
                .filter(cat => cat.type === 'income')
                .map(cat => cat.name);
                
            return `📋 Suas categorias:

🔴 Despesas:
${expenseCategories.map(cat => `- ${cat}`).join('\n') || '- Nenhuma categoria de despesa'}

🟢 Receitas:
${incomeCategories.map(cat => `- ${cat}`).join('\n') || '- Nenhuma categoria de receita'}`;
        } catch (error) {
            console.error('Erro ao listar categorias:', error);
            return 'Eita! Deu um probleminha ao buscar suas categorias 😅 Tenta de novo mais tarde, ok?';
        }
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
            return 'Hmm, não consegui identificar o valor 🤔 Me fala quanto você recebeu (ex: "recebi 1000 reais")';
        }
        const valor = parseFloat(valorMatch[0].replace(',', '.'));
        
        try {
            // Verificar o plano do usuário
            const userPlan = await this.getUserPlan(userId);
            
            // Para plano free, usamos um fluxo simplificado sem contas bancárias
            if (userPlan === 'free') {
                // Identificar categoria
                let category;
                const words = msgLower.split(' ');
                const commonWords = ['reais', 'recebi', 'ganhei', 'entrou', 'no', 'na', 'em', 'com', 'de', 'do', 'da'];
                const possibleCategories = words.filter(word => !commonWords.includes(word) && !word.match(/\d+/));
                
                // Verificar categorias existentes
                const { data: categories } = await this.supabase
                    .from('categories')
                    .select('*')
                    .eq('user_id', userId)
                    .eq('type', 'income');
                
                if (categories && categories.length > 0) {
                    // Tentar encontrar categoria pelo nome
                    for (const word of possibleCategories) {
                        const matchingCategory = categories.find(c => 
                            c.name.toLowerCase().includes(word) || 
                            word.includes(c.name.toLowerCase())
                        );
                        
                        if (matchingCategory) {
                            category = matchingCategory;
                            break;
                        }
                    }
                    
                    // Se não encontrou, usa a primeira
                    if (!category) {
                        category = categories[0];
                    }
                } else {
                    // Criar categoria padrão
                    const { data: newCategory, error: categoryError } = await this.supabase
                        .from('categories')
                        .insert({
                            user_id: userId,
                            name: 'Outros',
                            type: 'income'
                        })
                        .select()
                        .single();
                    
                    if (categoryError) {
                        console.error('Erro ao criar categoria:', categoryError);
                        return `Opa! Deu um erro ao criar uma categoria 😬 ${categoryError.message}`;
                    }
                    
                    category = newCategory;
                }
                
                // Inserir transação diretamente sem banco
                const transactionData = {
                    user_id: userId,
                    category_id: category.id,
                    type: 'income',
                    amount: valor,
                    description: possibleCategories.length > 0 ? possibleCategories[0] : 'Receita',
                    date: new Date().toISOString().split('T')[0],
                    status: 'completed'
                };
                
                const { data: transaction, error: transactionError } = await this.supabase
                    .from('transactions')
                    .insert(transactionData)
                    .select();
                
                if (transactionError) {
                    console.error('Erro ao inserir transação:', transactionError);
                    return `Eita! Algo deu errado ao registrar sua receita 😅 ${transactionError.message}`;
                }
                
                return `🎉 Receita registrada! 💰

💵 Valor: R$ ${valor.toFixed(2)}
📝 Categoria: ${category.name}
📅 Data: ${new Date().toLocaleDateString('pt-BR')}

Boa! Seu dinheirinho tá guardado na conta! 💪`;
            }
            
            // Para outros planos, usa o fluxo normal com contas bancárias
            // Identificar o banco
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
                    return 'Hmm, não consegui criar uma conta bancária pra você 🤔 Dá uma olhada no app e adiciona uma conta lá, beleza?';
                }
            }

            // Identifica a categoria
            const words = msgLower.split(' ');
            const commonWords = [
                'reais', 'recebi', 'ganhei', 'entrou', 'no', 'na', 'em', 'com', 'de', 'do', 'da',
                'pix', 'transferência', 'transferencia', 'depósito', 'deposito', 'salário', 'salario'
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
                    // Se não tem categorias, cria categorias básicas
                    try {
                        const basicCategories = [
                            { name: 'Salário', type: 'income' },
                            { name: 'Freelance', type: 'income' },
                            { name: 'Investimentos', type: 'income' },
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
                        
                        // Depois busca novamente
                        const { data: newCategories } = await this.supabase
                            .from('categories')
                            .select('id, name')
                            .eq('user_id', userId)
                            .eq('type', 'income');
                            
                        if (newCategories && newCategories.length > 0) {
                            category = newCategories[0];
                        }
                    } catch (error) {
                        console.error('Erro ao criar categorias básicas:', error);
                        return 'Opa! Não consegui criar categorias pra você 😅 Dá um pulinho no app e cria algumas categorias lá, pode ser?';
                    }
                } else {
                    // Usa a primeira categoria disponível
                    category = categories[0];
                }
            }

            // Agora que temos banco e categoria, inserimos a transação
            const transactionData = {
                user_id: userId,
                bank_id: selectedBank.id,
                category_id: category.id,
                type: 'income',
                amount: valor,
                description: possibleCategories.length > 0 ? possibleCategories[0] : 'Receita',
                date: new Date().toISOString().split('T')[0],
                status: 'completed'
            };
            
            const { data: transaction, error: transactionError } = await this.supabase
                .from('transactions')
                .insert(transactionData)
                .select();
            
            if (transactionError) {
                console.error('Erro ao inserir transação:', transactionError);
                return `Eita! Algo deu errado ao registrar sua receita 😅 ${transactionError.message}`;
            }
            
            return `🎉 Receita registrada! 💰

💵 Valor: R$ ${valor.toFixed(2)}
📝 Descrição: ${transactionData.description}
🏷️ Categoria: ${category.name}
🏦 Conta: ${selectedBank.name}
📅 Data: ${new Date().toLocaleDateString('pt-BR')}

Boa! Seu dinheirinho tá guardado na conta! 💪`;
        } catch (error) {
            console.error('Erro ao processar receita:', error);
            return `Eita! Deu um probleminha aqui 😅 ${error.message}`;
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

    async criarCategoria(userId, message) {
        console.log('[CATEGORIA] Processando criação de categoria para usuário:', userId);
        console.log('[CATEGORIA] Mensagem original:', message);
        
        try {
            // Extrair o nome da categoria da mensagem
            let categoryName = '';
            let categoryType = '';
            
            const msgLower = message.toLowerCase();
            
            // Padrões para extrair o nome da categoria
            const namePatterns = [
                // Padrões para extrair nome após "categoria"
                /categoria\s+(?:de\s+)?([a-zà-úA-ZÀ-Ú\s]+)(?:\s+(?:como|tipo|de)\s+)?/i,
                /categoria\s+(?:para|de)\s+([a-zà-úA-ZÀ-Ú\s]+)(?:\s+(?:como|tipo|de)\s+)?/i,
                
                // Padrões para extrair nome após verbos
                /cri[ae]r\s+(?:uma\s+)?(?:nova\s+)?categoria\s+(?:de\s+)?([a-zà-úA-ZÀ-Ú\s]+)(?:\s+(?:como|tipo|de)\s+)?/i,
                /adicionar\s+(?:uma\s+)?(?:nova\s+)?categoria\s+(?:de\s+)?([a-zà-úA-ZÀ-Ú\s]+)(?:\s+(?:como|tipo|de)\s+)?/i,
                /cadastrar\s+(?:uma\s+)?(?:nova\s+)?categoria\s+(?:de\s+)?([a-zà-úA-ZÀ-Ú\s]+)(?:\s+(?:como|tipo|de)\s+)?/i,
                /incluir\s+(?:uma\s+)?(?:nova\s+)?categoria\s+(?:de\s+)?([a-zà-úA-ZÀ-Ú\s]+)(?:\s+(?:como|tipo|de)\s+)?/i,
                
                // Padrão genérico para pegar qualquer palavra após "categoria"
                /categoria\s+([a-zà-úA-ZÀ-Ú\s]+)/i
            ];
            
            // Tentar extrair o nome da categoria
            for (const pattern of namePatterns) {
                const match = msgLower.match(pattern);
                if (match && match[1]) {
                    categoryName = match[1].trim();
                    // Remover palavras-chave que possam ter sido capturadas erroneamente
                    categoryName = categoryName
                        .replace(/\s+como\s+(?:despesa|receita|gasto|entrada).*$/i, '')
                        .replace(/\s+tipo\s+(?:despesa|receita|gasto|entrada).*$/i, '')
                        .replace(/\s+de\s+(?:despesa|receita|gasto|entrada).*$/i, '')
                        .trim();
                    break;
                }
            }
            
            // Se não conseguiu extrair o nome, pede ao usuário
            if (!categoryName) {
                return 'Por favor, me diga qual o nome da categoria que você quer criar. Por exemplo: "criar categoria Restaurantes" ou "nova categoria Salário".';
            }
            
            // Capitalizar a primeira letra de cada palavra
            categoryName = categoryName.split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            
            console.log('[CATEGORIA] Nome da categoria extraído:', categoryName);
            
            // Determinar o tipo da categoria (despesa ou receita)
            if (msgLower.includes('despesa') || 
                msgLower.includes('gasto') || 
                msgLower.includes('saída') || 
                msgLower.includes('saida') || 
                msgLower.includes('pagamento')) {
                categoryType = 'expense';
            } else if (msgLower.includes('receita') || 
                      msgLower.includes('entrada') || 
                      msgLower.includes('ganho') || 
                      msgLower.includes('recebimento') || 
                      msgLower.includes('salário') || 
                      msgLower.includes('salario')) {
                categoryType = 'income';
            } else {
                // Se não especificou o tipo, verifica se o nome sugere um tipo
                const expenseKeywords = ['mercado', 'supermercado', 'farmácia', 'farmacia', 
                                        'restaurante', 'lanche', 'combustível', 'combustivel', 
                                        'uber', 'táxi', 'taxi', 'transporte', 'academia', 
                                        'mensalidade', 'assinatura', 'netflix', 'spotify', 
                                        'amazon', 'ifood', 'delivery', 'conta', 'aluguel', 
                                        'escola', 'faculdade', 'médico', 'medico', 'dentista',
                                        'hospital', 'remédio', 'remedio', 'roupas', 'calçados',
                                        'calcados'];
                                        
                const incomeKeywords = ['salário', 'salario', 'freelance', 'freela', 
                                       'investimento', 'dividendo', 'aluguel', 'comissão', 
                                       'comissao', 'bônus', 'bonus', 'prêmio', 'premio', 
                                       'restituição', 'restituicao', 'pensão', 'pensao', 
                                       'aposentadoria', 'benefício', 'beneficio', 'bolsa', 
                                       'estágio', 'estagio', 'mesada', 'venda'];
                
                // Verificar se o nome da categoria contém alguma palavra-chave
                const nameLower = categoryName.toLowerCase();
                if (expenseKeywords.some(keyword => nameLower.includes(keyword))) {
                    categoryType = 'expense';
                } else if (incomeKeywords.some(keyword => nameLower.includes(keyword))) {
                    categoryType = 'income';
                } else {
                    // Se ainda não conseguiu determinar, pergunta ao usuário
                    return `Que tipo de categoria é "${categoryName}"? Responda com "despesa" ou "receita".`;
                }
            }
            
            console.log('[CATEGORIA] Tipo da categoria determinado:', categoryType);
            
            // Verificar se a categoria já existe
            const { data: existingCategories } = await this.supabase
                .from('categories')
                .select('name')
                .eq('user_id', userId)
                .eq('type', categoryType)
                .ilike('name', categoryName);
                
            if (existingCategories && existingCategories.length > 0) {
                return `A categoria "${categoryName}" já existe como ${categoryType === 'expense' ? 'despesa' : 'receita'}. Você pode usá-la normalmente!`;
            }
            
            // Criar a nova categoria
            const { data: newCategory, error } = await this.supabase
                .from('categories')
                .insert({
                    user_id: userId,
                    name: categoryName,
                    type: categoryType
                })
                .select()
                .single();
                
            if (error) {
                console.error('[CATEGORIA] Erro ao criar categoria:', error);
                return `Eita! Deu um probleminha ao criar a categoria 😅 ${error.message}`;
            }
            
            console.log('[CATEGORIA] Categoria criada com sucesso:', newCategory);
            
            // Resposta com emoji apropriado para o tipo
            const emoji = categoryType === 'expense' ? '🔴' : '🟢';
            const tipoTexto = categoryType === 'expense' ? 'despesa' : 'receita';
            
            return `✅ Categoria criada com sucesso!

${emoji} Nome: ${categoryName}
📝 Tipo: ${tipoTexto}

Agora você pode usar essa categoria nos seus registros. Por exemplo:
${categoryType === 'expense' 
    ? `"Gastei 50 reais em ${categoryName}"`
    : `"Recebi 100 reais de ${categoryName}"`}`;
        } catch (error) {
            console.error('[CATEGORIA] Erro ao processar criação de categoria:', error);
            return `Eita! Deu um probleminha ao criar a categoria 😅 ${error.message}`;
        }
    }

    async criarCartao(userId, message) {
        console.log('[CARTAO] Processando criação de cartão para usuário:', userId);
        console.log('[CARTAO] Mensagem original:', message);
        
        try {
            // Extrair o nome do cartão da mensagem
            let cardName = '';
            let cardLimit = 0;
            let dueDate = 0;
            let closingDate = 0;
            
            const msgLower = message.toLowerCase();
            
            // Padrões para extrair o nome do cartão
            const namePatterns = [
                // Padrões para extrair nome após "cartão"
                /cart[ãa]o\s+(?:de\s+)?([a-zà-úA-ZÀ-Ú\s]+)(?:\s+(?:com|limite|vencimento)\s+)?/i,
                
                // Padrões para extrair nome após verbos
                /cri[ae]r\s+(?:um\s+)?(?:novo\s+)?cart[ãa]o\s+(?:de\s+cr[ée]dito\s+)?(?:d[eo]\s+)?([a-zà-úA-ZÀ-Ú\s]+)(?:\s+(?:com|limite|vencimento)\s+)?/i,
                /adicionar\s+(?:um\s+)?(?:novo\s+)?cart[ãa]o\s+(?:de\s+cr[ée]dito\s+)?(?:d[eo]\s+)?([a-zà-úA-ZÀ-Ú\s]+)(?:\s+(?:com|limite|vencimento)\s+)?/i,
                /cadastrar\s+(?:um\s+)?(?:novo\s+)?cart[ãa]o\s+(?:de\s+cr[ée]dito\s+)?(?:d[eo]\s+)?([a-zà-úA-ZÀ-Ú\s]+)(?:\s+(?:com|limite|vencimento)\s+)?/i,
                
                // Padrão genérico para pegar qualquer palavra após "cartão"
                /cart[ãa]o\s+([a-zà-úA-ZÀ-Ú\s]+)/i
            ];
            
            // Tentar extrair o nome do cartão
            for (const pattern of namePatterns) {
                const match = msgLower.match(pattern);
                if (match && match[1]) {
                    cardName = match[1].trim();
                    // Remover palavras-chave que possam ter sido capturadas erroneamente
                    cardName = cardName
                        .replace(/\s+com\s+limite\s+(?:de\s+)?.*$/i, '')
                        .replace(/\s+com\s+vencimento\s+(?:dia\s+)?.*$/i, '')
                        .replace(/\s+vencimento\s+(?:dia\s+)?.*$/i, '')
                        .replace(/\s+fechamento\s+(?:dia\s+)?.*$/i, '')
                        .replace(/\s+de\s+cr[ée]dito.*$/i, '')
                        .trim();
                    break;
                }
            }
            
            // Se não conseguiu extrair o nome, pede ao usuário
            if (!cardName) {
                return 'Por favor, me diga qual o nome do cartão que você quer criar. Por exemplo: "criar cartão Nubank" ou "novo cartão Itaú".';
            }
            
            // Capitalizar a primeira letra de cada palavra
            cardName = cardName.split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            
            console.log('[CARTAO] Nome do cartão extraído:', cardName);
            
            // Extrair o limite do cartão
            const limitPatterns = [
                /limite\s+(?:de\s+)?r?\$?\s*(\d+[\.,]?\d*)/i,
                /r?\$?\s*(\d+[\.,]?\d*)\s+de\s+limite/i
            ];
            
            for (const pattern of limitPatterns) {
                const match = msgLower.match(pattern);
                if (match && match[1]) {
                    cardLimit = parseFloat(match[1].replace(',', '.'));
                    break;
                }
            }
            
            // Se não conseguiu extrair o limite, usa um valor padrão
            if (!cardLimit) {
                cardLimit = 1000; // Valor padrão
            }
            
            console.log('[CARTAO] Limite do cartão extraído:', cardLimit);
            
            // Extrair o dia de vencimento
            const dueDatePatterns = [
                /vencimento\s+(?:dia\s+)?(\d{1,2})/i,
                /vence\s+(?:dia\s+)?(\d{1,2})/i,
                /dia\s+(\d{1,2})\s+(?:de\s+)?vencimento/i
            ];
            
            for (const pattern of dueDatePatterns) {
                const match = msgLower.match(pattern);
                if (match && match[1]) {
                    dueDate = parseInt(match[1]);
                    // Validar o dia de vencimento (entre 1 e 31)
                    if (dueDate < 1 || dueDate > 31) {
                        dueDate = 10; // Valor padrão
                    }
                    break;
                }
            }
            
            // Se não conseguiu extrair o dia de vencimento, usa um valor padrão
            if (!dueDate) {
                dueDate = 10; // Valor padrão
            }
            
            console.log('[CARTAO] Dia de vencimento extraído:', dueDate);
            
            // Extrair o dia de fechamento
            const closingDatePatterns = [
                /fechamento\s+(?:dia\s+)?(\d{1,2})/i,
                /fecha\s+(?:dia\s+)?(\d{1,2})/i,
                /dia\s+(\d{1,2})\s+(?:de\s+)?fechamento/i
            ];
            
            for (const pattern of closingDatePatterns) {
                const match = msgLower.match(pattern);
                if (match && match[1]) {
                    closingDate = parseInt(match[1]);
                    // Validar o dia de fechamento (entre 1 e 31)
                    if (closingDate < 1 || closingDate > 31) {
                        closingDate = dueDate - 7; // Valor padrão baseado no vencimento
                        if (closingDate < 1) closingDate += 30; // Ajuste para valores negativos
                    }
                    break;
                }
            }
            
            // Se não conseguiu extrair o dia de fechamento, usa um valor padrão
            if (!closingDate) {
                closingDate = dueDate - 7; // Valor padrão baseado no vencimento
                if (closingDate < 1) closingDate += 30; // Ajuste para valores negativos
            }
            
            console.log('[CARTAO] Dia de fechamento extraído:', closingDate);
            
            // Verificar se o cartão já existe
            const { data: existingCards } = await this.supabase
                .from('credit_cards')
                .select('name')
                .eq('user_id', userId)
                .ilike('name', cardName);
                
            if (existingCards && existingCards.length > 0) {
                return `O cartão "${cardName}" já existe. Você pode usá-lo normalmente!`;
            }
            
            // Gerar uma cor aleatória
            const colors = ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c', '#d35400', '#34495e'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            
            // Criar o novo cartão
            const { data: newCard, error } = await this.supabase
                .from('credit_cards')
                .insert({
                    user_id: userId,
                    name: cardName,
                    limit: cardLimit,
                    due_date: dueDate,
                    closing_date: closingDate,
                    color: randomColor,
                    current_invoice: 0,
                    next_invoice: 0
                })
                .select()
                .single();
                
            if (error) {
                console.error('[CARTAO] Erro ao criar cartão:', error);
                return `Eita! Deu um probleminha ao criar o cartão 😅 ${error.message}`;
            }
            
            console.log('[CARTAO] Cartão criado com sucesso:', newCard);
            
            return `✅ Cartão criado com sucesso!

💳 Nome: ${cardName}
💰 Limite: R$ ${cardLimit.toFixed(2)}
📅 Vencimento: dia ${dueDate}
📆 Fechamento: dia ${closingDate}

Agora você pode usar esse cartão nos seus registros. Por exemplo:
"Gastei 50 reais no cartão ${cardName}"`;
        } catch (error) {
            console.error('[CARTAO] Erro ao processar criação de cartão:', error);
            return `Eita! Deu um probleminha ao criar o cartão 😅 ${error.message}`;
        }
    }

    async criarContaBancaria(userId, message) {
        console.log('[CONTA] Processando criação de conta bancária para usuário:', userId);
        console.log('[CONTA] Mensagem original:', message);
        
        try {
            // Extrair o nome da conta da mensagem
            let accountName = '';
            let initialBalance = 0;
            let accountType = 'corrente'; // Valor padrão
            
            const msgLower = message.toLowerCase();
            
            // Padrões para extrair o nome da conta
            const namePatterns = [
                // Padrões para extrair nome após "conta"
                /conta\s+(?:do\s+)?(?:banco\s+)?([a-zà-úA-ZÀ-Ú\s]+)(?:\s+(?:com|saldo|tipo)\s+)?/i,
                
                // Padrões para extrair nome após verbos
                /cri[ae]r\s+(?:uma\s+)?(?:nova\s+)?conta\s+(?:banc[áa]ria\s+)?(?:d[eo]\s+)?([a-zà-úA-ZÀ-Ú\s]+)(?:\s+(?:com|saldo|tipo)\s+)?/i,
                /adicionar\s+(?:uma\s+)?(?:nova\s+)?conta\s+(?:banc[áa]ria\s+)?(?:d[eo]\s+)?([a-zà-úA-ZÀ-Ú\s]+)(?:\s+(?:com|saldo|tipo)\s+)?/i,
                /cadastrar\s+(?:uma\s+)?(?:nova\s+)?conta\s+(?:banc[áa]ria\s+)?(?:d[eo]\s+)?([a-zà-úA-ZÀ-Ú\s]+)(?:\s+(?:com|saldo|tipo)\s+)?/i,
                
                // Padrões para extrair nome após "banco"
                /banco\s+([a-zà-úA-ZÀ-Ú\s]+)(?:\s+(?:com|saldo|tipo)\s+)?/i,
                /cri[ae]r\s+(?:um\s+)?(?:novo\s+)?banco\s+([a-zà-úA-ZÀ-Ú\s]+)(?:\s+(?:com|saldo|tipo)\s+)?/i,
                
                // Padrão genérico para pegar qualquer palavra após "conta" ou "banco"
                /conta\s+([a-zà-úA-ZÀ-Ú\s]+)/i,
                /banco\s+([a-zà-úA-ZÀ-Ú\s]+)/i
            ];
            
            // Tentar extrair o nome da conta
            for (const pattern of namePatterns) {
                const match = msgLower.match(pattern);
                if (match && match[1]) {
                    accountName = match[1].trim();
                    // Remover palavras-chave que possam ter sido capturadas erroneamente
                    accountName = accountName
                        .replace(/\s+com\s+saldo\s+(?:de\s+)?.*$/i, '')
                        .replace(/\s+tipo\s+(?:de\s+)?.*$/i, '')
                        .replace(/\s+banc[áa]ria.*$/i, '')
                        .trim();
                    break;
                }
            }
            
            // Se não conseguiu extrair o nome, pede ao usuário
            if (!accountName) {
                return 'Por favor, me diga qual o nome da conta ou banco que você quer criar. Por exemplo: "criar conta Nubank" ou "nova conta Itaú".';
            }
            
            // Capitalizar a primeira letra de cada palavra
            accountName = accountName.split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            
            console.log('[CONTA] Nome da conta extraído:', accountName);
            
            // Extrair o saldo inicial da conta
            const balancePatterns = [
                /saldo\s+(?:de\s+)?(?:inicial\s+)?r?\$?\s*(\d+[\.,]?\d*)/i,
                /r?\$?\s*(\d+[\.,]?\d*)\s+de\s+saldo/i,
                /com\s+r?\$?\s*(\d+[\.,]?\d*)/i
            ];
            
            for (const pattern of balancePatterns) {
                const match = msgLower.match(pattern);
                if (match && match[1]) {
                    initialBalance = parseFloat(match[1].replace(',', '.'));
                    break;
                }
            }
            
            console.log('[CONTA] Saldo inicial extraído:', initialBalance);
            
            // Determinar o tipo da conta
            if (msgLower.includes('poupança') || msgLower.includes('poupanca')) {
                accountType = 'poupanca';
            } else if (msgLower.includes('investimento')) {
                accountType = 'investimento';
            } else if (msgLower.includes('corrente')) {
                accountType = 'corrente';
            } else if (msgLower.includes('salário') || msgLower.includes('salario')) {
                accountType = 'salario';
            } else {
                // Padrão é conta corrente
                accountType = 'corrente';
            }
            
            console.log('[CONTA] Tipo da conta determinado:', accountType);
            
            // Verificar se a conta já existe
            const { data: existingAccounts } = await this.supabase
                .from('banks')
                .select('name')
                .eq('user_id', userId)
                .ilike('name', accountName);
                
            if (existingAccounts && existingAccounts.length > 0) {
                return `A conta "${accountName}" já existe. Você pode usá-la normalmente!`;
            }
            
            // Gerar uma cor aleatória
            const colors = ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c', '#d35400', '#34495e'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            
            // Criar a nova conta
            const { data: newAccount, error } = await this.supabase
                .from('banks')
                .insert({
                    user_id: userId,
                    name: accountName,
                    balance: initialBalance,
                    type: accountType,
                    color: randomColor
                })
                .select()
                .single();
                
            if (error) {
                console.error('[CONTA] Erro ao criar conta:', error);
                return `Eita! Deu um probleminha ao criar a conta 😅 ${error.message}`;
            }
            
            console.log('[CONTA] Conta criada com sucesso:', newAccount);
            
            // Mapear o tipo da conta para texto amigável
            const tipoTexto = {
                'corrente': 'Conta Corrente',
                'poupanca': 'Conta Poupança',
                'investimento': 'Conta de Investimento',
                'salario': 'Conta Salário'
            }[accountType];
            
            return `✅ Conta bancária criada com sucesso!

🏦 Nome: ${accountName}
💰 Saldo inicial: R$ ${initialBalance.toFixed(2)}
📝 Tipo: ${tipoTexto}

Agora você pode usar essa conta nos seus registros. Por exemplo:
"Gastei 50 reais da conta ${accountName}" ou "Recebi 1000 reais na conta ${accountName}"`;
        } catch (error) {
            console.error('[CONTA] Erro ao processar criação de conta:', error);
            return `Eita! Deu um probleminha ao criar a conta bancária 😅 ${error.message}`;
        }
    }
}

