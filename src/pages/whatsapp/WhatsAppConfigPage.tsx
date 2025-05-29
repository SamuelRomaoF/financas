import { useState } from 'react';
import { 
  Phone, 
  Bot, 
  Check,
  AlertCircle,
  MessageCircle,
  ArrowRight
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const WhatsAppConfigPage = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleVerifyNumber = () => {
    setIsConnecting(true);
    // Simulação do processo de verificação
    setTimeout(() => {
      setIsVerified(true);
      setIsConnecting(false);
    }, 2000);
  };

  const examples = [
    "gastei 20 reais com ifood no almoço",
    "paguei 50 reais de uber para ir ao trabalho",
    "recebi 2500 reais de salário",
    "transferi 800 reais pro aluguel"
  ];

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-200">
          Configuração do WhatsApp
        </h1>
        <div className="flex items-center">
          {isVerified ? (
            <span className="flex items-center text-sm text-success-600 dark:text-success-400">
              <Check className="h-5 w-5 mr-1" />
              Conectado
            </span>
          ) : (
            <span className="flex items-center text-sm text-warning-600 dark:text-warning-400">
              <AlertCircle className="h-5 w-5 mr-1" />
              Não conectado
            </span>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Conexão do WhatsApp */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden transition-colors duration-200">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <Phone className="h-6 w-6 text-primary-500" />
              <h2 className="ml-3 text-lg font-medium text-gray-900 dark:text-white">
                Conectar WhatsApp
              </h2>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Digite seu número de WhatsApp para conectar com o assistente virtual inteligente.
              </p>
              
              <div className="flex space-x-4">
                <div className="flex-1">
                  <Input
                    type="tel"
                    placeholder="(00) 00000-0000"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={isVerified}
                  />
                </div>
                <Button
                  onClick={handleVerifyNumber}
                  disabled={!phoneNumber || isVerified}
                  isLoading={isConnecting}
                >
                  {isVerified ? 'Conectado' : 'Conectar'}
                </Button>
              </div>
            </div>
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
                  Envie mensagens para o número <span className="font-medium">+55 (XX) XXXXX-XXXX</span> usando linguagem natural:
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
                    Entende linguagem natural e contexto
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