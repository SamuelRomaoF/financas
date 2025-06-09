import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Obter o diretório atual para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurar dotenv com caminho relativo
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

class SupabaseManager {
    constructor() {
        try {
            // Carregar valores das variáveis de ambiente
            const supabaseUrl = process.env.VITE_SUPABASE_URL;
            const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
            
            console.log('[DB] Inicializando SupabaseManager...');
            console.log('[DB] URL do Supabase:', supabaseUrl);
            console.log('[DB] Chave disponível:', supabaseKey ? 'Sim' : 'Não');
            
            if (!supabaseUrl || !supabaseKey) {
                console.error('[DB] ERRO: Variáveis de ambiente Supabase não encontradas!');
                throw new Error('Variáveis de ambiente Supabase não encontradas');
            }
            
            // Usar a biblioteca @supabase/supabase-js importada de forma dinâmica
            const { createClient } = require('@supabase/supabase-js');
            
            // Criar cliente Supabase
            this.supabase = createClient(supabaseUrl, supabaseKey);
            
            console.log('[DB] SupabaseManager inicializado com sucesso.');
        } catch (error) {
            console.error('[DB] ERRO ao inicializar SupabaseManager:', error);
            throw error;
        }
    }

    // Método para verificar a conexão com o Supabase
    async testConnection() {
        console.log('[DB] Testando conexão com Supabase...');
        try {
            const { data, error } = await this.supabase.from('users').select('id').limit(1);
            
            if (error) {
                console.error('[DB] ERRO ao testar conexão:', error);
                return { 
                    success: false, 
                    message: `Erro ao conectar ao Supabase: ${error.message}`,
                    error: error
                };
            }
            
            console.log('[DB] Conexão com Supabase funcionando. Dados recebidos:', data);
            return { 
                success: true, 
                message: 'Conexão com Supabase funcionando corretamente.',
                data: data
            };
        } catch (error) {
            console.error('[DB] EXCEÇÃO ao testar conexão:', error);
            return { 
                success: false, 
                message: `Exceção ao conectar ao Supabase: ${error.message}`,
                error: error
            };
        }
    }

    // Método para diagnosticar problemas de banco de dados
    async diagnose() {
        console.log('[DB] Iniciando diagnóstico do banco de dados...');
        try {
            const results = {
                connection: await this.testConnection(),
                tables: {},
                environment: {
                    supabaseUrl: process.env.VITE_SUPABASE_URL ? 'Definido' : 'Não definido',
                    supabaseKey: process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ? 'Definido' : 'Não definido',
                    nodeEnv: process.env.NODE_ENV,
                    version: process.version,
                    platform: process.platform,
                    arch: process.arch
                },
                timestamp: new Date().toISOString()
            };
            
            // Tentar acessar cada tabela importante
            const tables = ['users', 'phone_links', 'whatsapp_links', 'transactions', 'banks', 'categories', 'subscription_plans'];
            for (const table of tables) {
                console.log(`[DB] Testando acesso à tabela: ${table}`);
                try {
                    const { data, error } = await this.supabase.from(table).select('id').limit(1);
                    
                    results.tables[table] = {
                        success: !error,
                        message: error ? `Erro: ${error.message}` : 'OK',
                        count: data ? data.length : 0,
                        error: error ? error.message : null
                    };
                    
                    console.log(`[DB] Tabela ${table}: ${results.tables[table].success ? 'OK' : 'FALHA'}`);
                } catch (error) {
                    console.error(`[DB] EXCEÇÃO ao testar tabela ${table}:`, error);
                    results.tables[table] = {
                        success: false,
                        message: `Exceção: ${error.message}`,
                        error: error.toString()
                    };
                }
            }
            
            // Teste de transação fictícia
            console.log('[DB] Tentando inserir transação fictícia para diagnóstico...');
            try {
                // Buscar um usuário
                const { data: users } = await this.supabase.from('users').select('id').limit(1);
                
                if (users && users.length > 0) {
                    const userId = users[0].id;
                    results.transactionTest = {
                        userId: userId,
                        started: true
                    };
                    
                    // Buscar um banco
                    const { data: banks } = await this.supabase.from('banks').select('id').eq('user_id', userId).limit(1);
                    
                    if (banks && banks.length > 0) {
                        const bankId = banks[0].id;
                        results.transactionTest.bankFound = true;
                        results.transactionTest.bankId = bankId;
                        
                        // Buscar uma categoria
                        const { data: categories } = await this.supabase.from('categories').select('id').eq('user_id', userId).eq('type', 'expense').limit(1);
                        
                        if (categories && categories.length > 0) {
                            const categoryId = categories[0].id;
                            results.transactionTest.categoryFound = true;
                            results.transactionTest.categoryId = categoryId;
                            
                            // Criar transação fictícia
                            const transactionData = {
                                user_id: userId,
                                bank_id: bankId,
                                category_id: categoryId,
                                type: 'expense',
                                amount: 0.01,
                                description: 'Teste de diagnóstico',
                                date: new Date().toISOString().split('T')[0],
                                status: 'completed'
                            };
                            
                            const { data: transaction, error: transactionError } = await this.supabase
                                .from('transactions')
                                .insert(transactionData)
                                .select();
                            
                            if (transactionError) {
                                results.transactionTest.success = false;
                                results.transactionTest.error = transactionError.message;
                            } else {
                                results.transactionTest.success = true;
                                results.transactionTest.transactionId = transaction[0].id;
                                
                                // Limpar a transação de teste
                                await this.supabase.from('transactions').delete().eq('id', transaction[0].id);
                                results.transactionTest.cleanup = 'success';
                            }
                        } else {
                            results.transactionTest.categoryFound = false;
                        }
                    } else {
                        results.transactionTest.bankFound = false;
                    }
                } else {
                    results.transactionTest = {
                        started: false,
                        reason: 'No users found'
                    };
                }
            } catch (testError) {
                console.error('[DB] Erro no teste de transação:', testError);
                results.transactionTest = {
                    success: false,
                    error: testError.message
                };
            }
            
            console.log('[DB] Diagnóstico concluído:', results);
            return results;
        } catch (error) {
            console.error('[DB] Erro durante diagnóstico:', error);
            return {
                success: false,
                error: error.message,
                stack: error.stack
            };
        }
    }
    
    // Resto dos métodos...
}

export default SupabaseManager; 