import {
    ArrowRight,
    Bot,
    Check,
    MessageCircle,
    Phone,
    X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import Button from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

const WhatsAppConfigPage = () => {
    const { user } = useAuth();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [inputCode, setInputCode] = useState('');
    const [isVerified, setIsVerified] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentCode, setCurrentCode] = useState<string | null>(null);

    // Carrega o status da vinculação e o código atual
    useEffect(() => {
        loadWhatsAppLink();
        loadCurrentCode();
    }, [user]);

    const loadWhatsAppLink = async () => {
        try {
            if (!user?.id) {
                throw new Error('Usuário não autenticado');
            }

            const { data: link, error } = await supabase
                .from('whatsapp_links')
                .select()
                .eq('user_id', user.id)
                .maybeSingle();

            if (error) {
                console.error('Erro ao carregar vinculação:', error);
                throw error;
            }

            if (link) {
                setPhoneNumber(link.phone_number);
                setVerificationCode(link.verification_code || '');
                setIsVerified(link.is_verified);
            }
        } catch (error) {
            console.error('Erro ao carregar vinculação:', error);
            toast.error('Erro ao carregar configuração do WhatsApp');
        } finally {
            setIsLoading(false);
        }
    };

    const loadCurrentCode = async () => {
        try {
            const { data, error } = await supabase
                .from('whatsapp_links')
                .select()
                .eq('phone_number', '+5511978165942')
                .eq('is_verified', false)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error) throw error;

            if (data) {
                setCurrentCode(data.verification_code);
            }
        } catch (error) {
            console.error('Erro ao carregar código atual:', error);
        }
    };

    const handleVerify = async () => {
        if (!inputCode) {
            toast.error('Por favor, insira o código de verificação');
            return;
        }

        if (!user?.id) {
            toast.error('Usuário não autenticado');
            return;
        }

        setIsSubmitting(true);
        try {
            // Primeiro, verifica se existe uma vinculação com este código
            const { data: link, error: findError } = await supabase
                .from('whatsapp_links')
                .select()
                .eq('verification_code', inputCode)
                .single();

            if (findError) {
                if (findError.code === 'PGRST116') {
                    toast.error('Código de verificação inválido');
                    return;
                }
                throw findError;
            }

            if (!link) {
                toast.error('Código de verificação inválido');
                return;
            }

            // Atualiza o user_id e o status de verificação
            const { error: updateError } = await supabase
                .from('whatsapp_links')
                .update({
                    user_id: user.id,
                    is_verified: true,
                    verified_at: new Date().toISOString()
                })
                .eq('verification_code', inputCode)
                .eq('is_verified', false); // Garante que o código não foi usado

            if (updateError) {
                if (updateError.code === 'PGRST116') {
                    toast.error('Este código já foi utilizado');
                    return;
                }
                throw updateError;
            }

            setIsVerified(true);
            setPhoneNumber(link.phone_number);
            toast.success('WhatsApp vinculado com sucesso!');
            await loadWhatsAppLink();
        } catch (error) {
            console.error('Erro ao verificar código:', error);
            toast.error('Erro ao verificar código. Tente novamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUnlink = async () => {
        if (!user?.id) {
            toast.error('Usuário não autenticado');
            return;
        }

        try {
            const { error } = await supabase
                .from('whatsapp_links')
                .delete()
                .eq('user_id', user.id);

            if (error) throw error;

            setPhoneNumber('');
            setVerificationCode('');
            setIsVerified(false);
            setInputCode('');
            toast.success('WhatsApp desvinculado com sucesso!');
        } catch (error) {
            console.error('Erro ao desvincular:', error);
            toast.error('Erro ao desvincular WhatsApp');
        }
    };

    const examples = [
        "gastei 20 reais com ifood no almoço",
        "paguei 50 reais de uber para ir ao trabalho",
        "recebi 2500 reais de salário",
        "transferi 800 reais pro aluguel"
    ];

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                Configuração do WhatsApp
            </h1>

            <div className="space-y-6">
                {/* Status da Vinculação */}
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden transition-colors duration-200">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                                <Phone className="h-6 w-6 text-primary-500" />
                                <h2 className="ml-3 text-lg font-medium text-gray-900 dark:text-white">
                                    Status da Vinculação
                                </h2>
                            </div>
                            {isVerified && (
                                <Button
                                    variant="danger"
                                    onClick={handleUnlink}
                                    className="flex items-center"
                                >
                                    <X className="h-4 w-4 mr-2" />
                                    Desvincular
                                </Button>
                            )}
                        </div>

                        {isLoading ? (
                            <div className="animate-pulse flex space-x-4">
                                <div className="flex-1 space-y-4 py-1">
                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            </div>
                        ) : isVerified ? (
                            <div className="space-y-4">
                                <div className="flex items-center text-green-500">
                                    <Check className="h-5 w-5 mr-2" />
                                    <span>WhatsApp vinculado com sucesso!</span>
                                </div>
                                <p className="text-sm text-gray-500">
                                    Número vinculado: {phoneNumber}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="max-w-md">
                                    <label htmlFor="botNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Número do Bot WhatsApp
                                    </label>
                                    <div className="mt-1 relative rounded-md shadow-sm">
                                        <input
                                            type="tel"
                                            id="botNumber"
                                            className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                            value="+55 11 97816-5942"
                                            readOnly
                                        />
                                    </div>
                                    <p className="mt-2 text-sm text-gray-500">
                                        1. Envie a mensagem <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">/vincular</span> para este número no WhatsApp
                                    </p>
                                    {currentCode && (
                                        <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                                            <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                                Código atual pendente: <span className="font-mono font-bold">{currentCode}</span>
                                            </p>
                                            <p className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">
                                                Use este código ou envie /vincular novamente para gerar um novo
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="max-w-md mt-6">
                                    <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        2. Digite o código de verificação recebido
                                    </label>
                                    <div className="mt-1 flex space-x-2">
                                        <input
                                            type="text"
                                            id="verificationCode"
                                            className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                            placeholder="Digite o código aqui"
                                            value={inputCode}
                                            onChange={(e) => setInputCode(e.target.value)}
                                        />
                                        <Button
                                            onClick={handleVerify}
                                            isLoading={isSubmitting}
                                            disabled={!inputCode}
                                        >
                                            Verificar
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Assistente Virtual */}
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden transition-colors duration-200">
                    <div className="p-6">
                        <div className="flex items-center mb-4">
                            <Bot className="h-6 w-6 text-primary-500" />
                            <h2 className="ml-3 text-lg font-medium text-gray-900 dark:text-white">
                                Assistente Virtual Inteligente
                            </h2>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                    Exemplos de mensagens que você pode enviar:
                                </p>

                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-3">
                                    {examples.map((example, index) => (
                                        <div key={index} className="flex items-start space-x-2">
                                            <MessageCircle className="h-4 w-4 text-primary-500 mt-0.5 flex-shrink-0" />
                                            <p className="text-sm font-mono text-gray-600 dark:text-gray-300">
                                                {example}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4">
                                <h3 className="text-sm font-medium text-primary-900 dark:text-primary-300 mb-2 flex items-center">
                                    <Bot className="h-4 w-4 mr-2" />
                                    Recursos do Assistente
                                </h3>
                                <ul className="space-y-2 text-sm text-primary-800 dark:text-primary-200">
                                    <li className="flex items-start">
                                        <ArrowRight className="h-4 w-4 mr-2 mt-0.5" />
                                        Entende linguagem natural
                                    </li>
                                    <li className="flex items-start">
                                        <ArrowRight className="h-4 w-4 mr-2 mt-0.5" />
                                        Categoriza automaticamente suas despesas
                                    </li>
                                    <li className="flex items-start">
                                        <ArrowRight className="h-4 w-4 mr-2 mt-0.5" />
                                        Responde a perguntas sobre suas finanças
                                    </li>
                                    <li className="flex items-start">
                                        <ArrowRight className="h-4 w-4 mr-2 mt-0.5" />
                                        Gera relatórios e insights personalizados
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WhatsAppConfigPage; 