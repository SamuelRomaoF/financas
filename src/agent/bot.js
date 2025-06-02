import { createClient } from '@supabase/supabase-js';
import { generateVerificationCode } from './utils.js';

class FinanceAgent {
    constructor(supabaseUrl, supabaseKey) {
        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Supabase URL e Key são obrigatórios');
        }
        console.log('Inicializando Supabase com URL:', supabaseUrl);
        this.supabase = createClient(supabaseUrl, supabaseKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
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
            console.log('Buscando vínculo para:', formattedPhone);

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
            console.log('Vínculo inicial encontrado:', initialLink);

            // Se encontrou vínculo verificado, não precisa fazer retry
            if (initialLink && initialLink.is_verified) {
                console.log('Vínculo verificado encontrado - resposta imediata');
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
            console.error('Erro ao processar mensagem:', error);
            return 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.';
        }
    }

    async handleVerifiedUser(userId, message) {
        const msgLower = message.toLowerCase();

        // Responde a saudações
        if (this.isSaudacao(msgLower)) {
            return this.responderSaudacao(msgLower);
        }

        // Processa a mensagem para identificar a intenção
        if (this.isGasto(msgLower)) {
            return this.processarGasto(userId, message);
        }

        if (this.isConsultaSaldo(msgLower)) {
            return this.handleBalance(userId);
        }

        if (this.isConsultaCategorias(msgLower)) {
            return this.handleCategories(userId);
        }

        if (this.isConsultaRelatorio(msgLower)) {
            return this.handleReport(userId);
        }

        if (this.isConsultaVinculo(msgLower)) {
            return this.verificarStatusVinculo(userId);
        }

        // Se chegou aqui, é uma mensagem genérica
        return this.mensagemBoasVindasUsuarioVerificado();
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
               '📝 Registrar gastos (ex: "gastei 20 no uber")\n' +
               '💰 Ver seu saldo (ex: "mostrar saldo")\n' +
               '📊 Gerar relatórios (ex: "relatório do mês")\n' +
               '🏷️ Listar categorias (ex: "ver categorias")\n\n' +
               'Como posso te ajudar hoje?';
    }

    async handleUnverifiedUser(phoneNumber, message, existingLink) {
        // Lista de palavras que indicam intenção de vincular
        const vinculationWords = ['vincular', 'conectar', 'registrar', 'começar', 'iniciar'];
        const hasVinculationIntent = vinculationWords.some(word => message.toLowerCase().includes(word));

        if (message.toLowerCase() === '/vincular' || hasVinculationIntent) {
            try {
                // Busca novamente para garantir dados atualizados
                const { data: currentLink, error: searchError } = await this.supabase
                    .from('whatsapp_links')
                    .select('*')
                    .eq('phone_number', phoneNumber)
                    .maybeSingle();

                if (searchError) throw searchError;

                // Se já existe um link não verificado, retorna o mesmo código
                if (currentLink && !currentLink.is_verified) {
                    return `Você já possui um código de verificação pendente: ${currentLink.verification_code}\n\nPor favor, acesse seu dashboard e insira este código para vincular seu WhatsApp.`;
                }

                // Se o número já está vinculado a outro usuário
                if (currentLink && currentLink.is_verified) {
                    return 'Este número já está vinculado a uma conta. Se você deseja desvincular, acesse seu dashboard.';
                }

                // Se chegou aqui, ou não existe link ou precisa atualizar
                const code = generateVerificationCode();

                if (currentLink) {
                    // Atualiza o link existente
                    const { error: updateError } = await this.supabase
                        .from('whatsapp_links')
                        .update({
                            verification_code: code,
                            is_verified: false,
                            created_at: new Date().toISOString()
                        })
                        .eq('phone_number', phoneNumber);

                    if (updateError) throw updateError;
                } else {
                    // Cria um novo link
                    const { error: insertError } = await this.supabase
                        .from('whatsapp_links')
                        .insert({
                            phone_number: phoneNumber,
                            verification_code: code,
                            is_verified: false,
                            created_at: new Date().toISOString()
                        });

                    if (insertError) throw insertError;
                }

                return `Por favor, acesse seu dashboard e insira o código: ${code}`;
            } catch (error) {
                console.error('Erro ao gerar código de verificação:', error);
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

        return `${saudacao}! 😊 Como posso ajudar você hoje?\n\nVocê pode me contar sobre:\n- Seus gastos (ex: "gastei 20 reais no uber")\n- Consultar seu saldo (ex: "qual meu saldo?")\n- Ver suas categorias (ex: "mostra as categorias")\n- Pedir um relatório (ex: "me mostra o resumo do mês")`;
    }

    isGasto(msg) {
        const gastosIndicators = [
            'gastei', 'paguei', 'comprei', 'fiz um gasto',
            'coloquei na conta', 'débito', 'credito', 'crédito',
            'cartão', 'cartao', 'transferi', 'mandei', 'pix'
        ];
        return gastosIndicators.some(indicator => msg.includes(indicator));
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

        // Identifica o banco/cartão
        const { data: banks } = await this.supabase
            .from('banks')
            .select('id, name')
            .eq('user_id', userId);

        let selectedBank = null;
        if (banks) {
            for (const bank of banks) {
                if (msgLower.includes(bank.name.toLowerCase())) {
                    selectedBank = bank;
                    break;
                }
            }
        }

        // Se não identificou banco específico, usa o primeiro
        if (!selectedBank && banks && banks.length > 0) {
            selectedBank = banks[0];
        }

        if (!selectedBank) {
            return 'Você precisa cadastrar uma conta primeiro no dashboard.';
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

        if (!category) {
            const { data: categories } = await this.supabase
                .from('categories')
                .select('name')
                .eq('user_id', userId)
                .eq('type', 'expense');

            return `Não consegui identificar a categoria do gasto. Por favor, me diga em qual categoria se encaixa:\n${categories.map(c => `- ${c.name}`).join('\n')}\n\nPor exemplo:\n"gastei ${valor} reais em ${categories[0].name}"`;
        }

        // Registra a transação
        await this.supabase
            .from('transactions')
            .insert({
                user_id: userId,
                bank_id: selectedBank.id,
                category_id: category.id,
                type: 'expense',
                amount: valor,
                date: new Date().toISOString().split('T')[0],
                status: 'completed'
            });

        return `✅ Gasto registrado!\nValor: R$ ${valor.toFixed(2)}\nCategoria: ${category.name}\nConta: ${selectedBank.name}`;
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
}

export default FinanceAgent;