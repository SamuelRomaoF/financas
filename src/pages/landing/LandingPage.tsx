import {
    ArrowRight,
    Bell,
    BrainCircuit,
    Check,
    MessageSquare,
    PieChart,
    Star,
    X
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navbar from '../../components/layout/Navbar';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { useAuth } from '../../hooks/useAuth';
import { useSubscription } from '../../hooks/useSubscription';

export default function LandingPage() {
  const { user } = useAuth();
  const { createTrialSubscription } = useSubscription();
  const navigate = useNavigate();

  // Estados para o modal
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStartTrial = async () => {
    if (!user) {
      navigate('/register');
      return;
    }
    setIsConfirmationModalOpen(true);
  };

  const handleConfirmSubscription = async () => {
    if (!user) return;
    setIsProcessing(true);
    try {
      const { error } = await createTrialSubscription(user);
      if (error) {
        throw error;
      }
      toast.success('Plano de teste iniciado! Bem-vindo(a)!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Erro ao criar assinatura trial:', error);
      toast.error(error.message || 'Erro ao criar assinatura trial. Tente novamente.');
    } finally {
      setIsProcessing(false);
      setIsConfirmationModalOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar variant="public" />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-500 to-secondary-600 text-white py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center">
            <div className="lg:w-1/2 lg:pr-12 mb-10 lg:mb-0">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-6 animate-fade-in">
                Gerencie suas finanças pelo WhatsApp
              </h1>
              <p className="text-lg sm:text-xl opacity-90 mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                Controle despesas, receba alertas e veja relatórios financeiros de forma simplificada, 
                tudo começando com mensagens direto pelo WhatsApp.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <button 
                  onClick={handleStartTrial}
                  className="btn inline-flex items-center justify-center px-6 py-3 bg-white text-primary-600 hover:bg-neutral-100 font-medium rounded-lg shadow-md transition-colors"
                >
                  Começar agora
                  <ArrowRight size={18} className="ml-2" />
                </button>
                <a 
                  href="#como-funciona" 
                  className="btn inline-flex items-center justify-center px-6 py-3 border border-white/30 text-white hover:bg-white/10 font-medium rounded-lg transition-colors"
                >
                  Saiba como funciona
                </a>
              </div>
            </div>
            <div className="lg:w-1/2 lg:pl-12 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 shadow-xl">
                <img 
                  src="https://images.pexels.com/photos/3943716/pexels-photo-3943716.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" 
                  alt="Finanças Simplificadas App" 
                  className="rounded-xl w-full shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="recursos" className="py-16 sm:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
              Simplificando suas finanças
            </h2>
            <p className="text-lg text-neutral-600">
              Organize suas finanças pessoais com recursos intuitivos que facilitam o controle do seu dinheiro.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="card card-hover p-6 transition-all">
              <div className="bg-primary-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <MessageSquare size={22} className="text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">Integração com WhatsApp</h3>
              <p className="text-neutral-600">
                Envie suas despesas e receitas diretamente pelo WhatsApp. Nosso sistema processa automaticamente suas mensagens.
              </p>
            </div>
            
            <div className="card card-hover p-6 transition-all">
              <div className="bg-secondary-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <PieChart size={22} className="text-secondary-600" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">Categorização Automática</h3>
              <p className="text-neutral-600">
                O sistema identifica e categoriza automaticamente suas despesas, economizando seu tempo.
              </p>
            </div>
            
            <div className="card card-hover p-6 transition-all">
              <div className="bg-warning-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Bell size={22} className="text-warning-600" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">Alertas de Vencimento</h3>
              <p className="text-neutral-600">
                Receba lembretes de contas a pagar e nunca mais pague juros por atraso em pagamentos.
              </p>
            </div>
            
            <div className="card card-hover p-6 transition-all">
              <div className="bg-success-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Star size={22} className="text-success-600" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">Metas Financeiras</h3>
              <p className="text-neutral-600">
                Defina metas de economia e acompanhe seu progresso com visualizações claras e motivadoras.
              </p>
            </div>
            
            <div className="card card-hover p-6 transition-all">
              <div className="bg-danger-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <PieChart size={22} className="text-danger-600" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">Relatórios Detalhados</h3>
              <p className="text-neutral-600">
                Visualize gráficos e relatórios que mostram para onde seu dinheiro está indo todos os meses.
              </p>
            </div>
            
            <div className="card card-hover p-6 transition-all">
              <div className="bg-neutral-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <BrainCircuit size={22} className="text-neutral-600" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">Assistente Virtual</h3>
              <p className="text-neutral-600">
                Interaja com nosso assistente virtual para obter insights sobre suas finanças e dicas personalizadas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="como-funciona" className="py-16 sm:py-24 bg-neutral-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
              Como funciona
            </h2>
            <p className="text-lg text-neutral-600">
              Em apenas três passos simples, você já estará no controle das suas finanças.
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row space-y-8 md:space-y-0 md:space-x-8">
            <div className="md:w-1/3 flex flex-col items-center text-center">
              <div className="bg-primary-500 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mb-6">
                1
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-3">Crie sua conta</h3>
              <p className="text-neutral-600">
                Registre-se gratuitamente e configure seu perfil em menos de 2 minutos.
              </p>
            </div>
            
            <div className="md:w-1/3 flex flex-col items-center text-center">
              <div className="bg-primary-500 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mb-6">
                2
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-3">Conecte seu WhatsApp</h3>
              <p className="text-neutral-600">
                Vincule seu número do WhatsApp para começar a enviar suas transações.
              </p>
            </div>
            
            <div className="md:w-1/3 flex flex-col items-center text-center">
              <div className="bg-primary-500 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mb-6">
                3
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-3">Comece a usar</h3>
              <p className="text-neutral-600">
                Envie suas despesas e receitas via mensagem e veja a mágica acontecer.
              </p>
            </div>
          </div>
          
          <div className="mt-16 text-center">
            <button onClick={handleStartTrial} className="btn-primary inline-flex items-center px-6 py-3">
              Começar agora
              <ArrowRight size={18} className="ml-2" />
            </button>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="planos" className="py-16 sm:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
              Planos que cabem no seu bolso
            </h2>
            <p className="text-lg text-neutral-600">
              Escolha o plano que melhor atende às suas necessidades financeiras.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Free Plan */}
            <div className="card p-6 border border-neutral-200">
              <h3 className="text-xl font-bold text-neutral-900 mb-2">Gratuito</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold text-neutral-900">R$0</span>
                <span className="text-neutral-600">/7 dias</span>
              </div>
              <p className="text-neutral-600 mb-6">
                Perfeito para quem está começando a organizar suas finanças.
              </p>
              
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <Check size={18} className="text-primary-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span className="text-neutral-700">Integração com WhatsApp</span>
                </li>
                <li className="flex items-start">
                  <Check size={18} className="text-primary-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span className="text-neutral-700">Categorização básica</span>
                </li>
                <li className="flex items-start">
                  <Check size={18} className="text-primary-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span className="text-neutral-700">Relatório semanal</span>
                </li>
                <li className="flex items-start">
                  <Check size={18} className="text-primary-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span className="text-neutral-700">Limite de 50 transações</span>
                </li>
              </ul>
              
              <button 
                onClick={handleStartTrial}
                className="btn-outline w-full"
              >
                Experimente grátis
              </button>
            </div>
            
            {/* Basic Plan */}
            <div className="card p-6 border-2 border-primary-500 relative transform scale-105 shadow-lg">
              <div className="absolute -top-4 left-0 right-0 flex justify-center">
                <span className="bg-primary-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  MAIS POPULAR
                </span>
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">Básico</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold text-neutral-900">R$39,90</span>
                <span className="text-neutral-600">/mês</span>
              </div>
              <p className="text-neutral-600 mb-6">
                Ideal para uso pessoal com recursos avançados.
              </p>
              
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <Check size={18} className="text-primary-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span className="text-neutral-700">Integração com WhatsApp</span>
                </li>
                <li className="flex items-start">
                  <Check size={18} className="text-primary-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span className="text-neutral-700">Categorização automática</span>
                </li>
                <li className="flex items-start">
                  <Check size={18} className="text-primary-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span className="text-neutral-700">Metas financeiras</span>
                </li>
                <li className="flex items-start">
                  <Check size={18} className="text-primary-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span className="text-neutral-700">Limite de 100 transações/mês</span>
                </li>
              </ul>
              
              <button 
                onClick={handleStartTrial}
                className="btn-primary w-full justify-center"
              >
                Escolher plano
              </button>
            </div>
            
            {/* Premium Plan */}
            <div className="card p-6 border border-neutral-200">
              <h3 className="text-xl font-bold text-neutral-900 mb-2">Premium</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold text-neutral-900">R$69,90</span>
                <span className="text-neutral-600">/mês</span>
              </div>
              <p className="text-neutral-600 mb-6">
                Para quem quer o máximo em controle financeiro.
              </p>
              
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <Check size={18} className="text-primary-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span className="text-neutral-700">Todos os recursos do Básico</span>
                </li>
                <li className="flex items-start">
                  <Check size={18} className="text-primary-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span className="text-neutral-700">Transações ilimitadas</span>
                </li>
                <li className="flex items-start">
                  <Check size={18} className="text-primary-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span className="text-neutral-700">Múltiplas contas</span>
                </li>
                <li className="flex items-start">
                  <Check size={18} className="text-primary-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span className="text-neutral-700">Análise de investimentos</span>
                </li>
                <li className="flex items-start">
                  <Check size={18} className="text-primary-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span className="text-neutral-700">Insiders de economia</span>
                </li>
                <li className="flex items-start">
                  <Check size={18} className="text-primary-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span className="text-neutral-700">Suporte prioritário</span>
                </li>
              </ul>
              
              <button 
                onClick={handleStartTrial}
                className="btn-outline w-full justify-center"
              >
                Escolher plano
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="perguntas" className="py-16 sm:py-24 bg-neutral-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Perguntas frequentes
            </h2>
            <p className="text-lg text-gray-600">
              Tire suas dúvidas sobre o Finanças Simplificadas.
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Como funciona a integração com o WhatsApp?</h3>
              <p className="text-gray-600">
                Após se cadastrar, você conecta seu número do WhatsApp à nossa plataforma. Então, basta enviar mensagens como "Gastei R$50 no mercado" e nosso sistema automaticamente registra e categoriza essa transação.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Meus dados financeiros estão seguros?</h3>
              <p className="text-gray-600">
                Sim! Utilizamos criptografia de ponta a ponta e seguimos os mais rigorosos padrões de segurança para proteger seus dados. Nunca compartilhamos suas informações financeiras com terceiros.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Posso mudar de plano depois?</h3>
              <p className="text-gray-600">
                Absolutamente! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. As mudanças entram em vigor no próximo ciclo de cobrança.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Como funciona o período de teste?</h3>
              <p className="text-gray-600">
                Oferecemos 14 dias de teste gratuito nos planos pagos. Você pode experimentar todos os recursos premium sem compromisso e decidir se deseja continuar após esse período.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Preciso instalar algum aplicativo?</h3>
              <p className="text-gray-600">
                Não é necessário instalar nada. O Finanças Simplificadas é um web app que funciona direto do navegador e se integra ao WhatsApp que você já usa.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 bg-gradient-to-br from-primary-500 to-secondary-600 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Comece a simplificar suas finanças hoje
            </h2>
            <p className="text-xl opacity-90 mb-8">
              Junte-se a milhares de pessoas que já transformaram sua relação com o dinheiro.
            </p>
            <button onClick={handleStartTrial} className="btn inline-flex items-center justify-center px-8 py-3 bg-white text-primary-600 hover:bg-neutral-100 text-lg font-medium rounded-lg shadow-md transition-colors">
              Criar conta gratuitamente
              <ArrowRight size={20} className="ml-2" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 text-white py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <BrainCircuit size={28} className="text-primary-400" />
                <span className="ml-2 text-lg font-bold">Finanças Simplificadas</span>
              </div>
              <p className="text-neutral-400 mb-4">
                Transformando a maneira como você gerencia seu dinheiro.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-neutral-400 hover:text-white">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd"></path>
                  </svg>
                </a>
                <a href="#" className="text-neutral-400 hover:text-white">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                  </svg>
                </a>
                <a href="#" className="text-neutral-400 hover:text-white">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd"></path>
                  </svg>
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Produto</h3>
              <ul className="space-y-2">
                <li><a href="#recursos" className="text-neutral-400 hover:text-white">Recursos</a></li>
                <li><a href="#planos" className="text-neutral-400 hover:text-white">Planos</a></li>
                <li><a href="#" className="text-neutral-400 hover:text-white">Avaliações</a></li>
                <li><a href="#" className="text-neutral-400 hover:text-white">Novidades</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Suporte</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-neutral-400 hover:text-white">Central de Ajuda</a></li>
                <li><a href="#perguntas" className="text-neutral-400 hover:text-white">FAQ</a></li>
                <li><a href="#" className="text-neutral-400 hover:text-white">Contato</a></li>
                <li><a href="#" className="text-neutral-400 hover:text-white">Tutoriais</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-neutral-400 hover:text-white">Termos de Serviço</a></li>
                <li><a href="#" className="text-neutral-400 hover:text-white">Política de Privacidade</a></li>
                <li><a href="#" className="text-neutral-400 hover:text-white">Política de Cookies</a></li>
                <li><a href="#" className="text-neutral-400 hover:text-white">Segurança</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-neutral-800 text-neutral-400 text-sm text-center">
            <p>© {new Date().getFullYear()} Finanças Simplificadas. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>

      {/* Modal de Confirmação do Trial */}
      <ConfirmationModal
        isOpen={isConfirmationModalOpen}
        onClose={() => setIsConfirmationModalOpen(false)}
        onConfirm={handleConfirmSubscription}
        title="Confirmar Início do Teste Gratuito"
        message="Você está prestes a iniciar seu período de teste no plano Gratuito por 7 dias. Deseja continuar?"
        confirmButtonText={isProcessing ? "Iniciando..." : "Sim, Iniciar Teste"}
        cancelButtonText="Cancelar"
        isConfirmDisabled={isProcessing}
      />
    </div>
  );
} 