import AOS from 'aos';
import 'aos/dist/aos.css';
import {
  AlertCircle,
  ArrowRight,
  Bell,
  BrainCircuit,
  Check,
  Clock,
  MessageSquare,
  PieChart,
  Star,
  TrendingUp
} from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { useAuth } from '../../hooks/useAuth';
import { useSubscription } from '../../hooks/useSubscription';

// Estilo personalizado para animações adicionais
const customStyles = `
  @keyframes bounce-slow {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }
  .animate-bounce-slow {
    animation: bounce-slow 3s infinite ease-in-out;
  }
`;

export default function LandingPage() {
  const { user } = useAuth();
  const { createTrialSubscription } = useSubscription();
  const navigate = useNavigate();

  // Estados para o modal
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [countdownDays, setCountdownDays] = useState(7);
  
  // Contador de usuários fictício para criar sensação de popularidade
  const [userCount, setUserCount] = useState(0);
  
  useEffect(() => {
    // Inicializar AOS
    AOS.init({
      duration: 800,
      easing: 'ease-out',
      once: false,
      mirror: true, // Animar elementos ao rolar para cima também
      offset: 120
    });

    // Simular contagem crescente de usuários para criar sensação de popularidade
    const startCount = 234;
    const targetCount = 247;
    let current = startCount;
    
    const interval = setInterval(() => {
      if (current < targetCount) {
        setUserCount(current);
        current += 1;
      } else {
        clearInterval(interval);
      }
    }, 3000);
    
    return () => {
      clearInterval(interval);
      // Atualizar AOS quando componentes são atualizados/redimensionados
      window.addEventListener('resize', () => {
        AOS.refresh();
      });
    };
  }, []);

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
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      <Navbar variant="public" />

      {/* Hero Section - Otimizado para conversão e com animações */}
      <section className="bg-gradient-to-br from-primary-500 to-secondary-600 text-white py-16 sm:py-24 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center">
            <div className="lg:w-1/2 lg:pr-12 mb-10 lg:mb-0" data-aos="fade-right" data-aos-delay="100">
              <div className="bg-white/10 inline-block px-3 py-1 rounded-full text-sm font-medium mb-4 animate-pulse">
                🚀 Lançamento em breve - Vagas limitadas!
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-4">
                Controle financeiro direto pelo WhatsApp
              </h1>
              <p className="text-lg sm:text-xl opacity-90 mb-4">
                <strong>Sem planilhas complicadas. Sem apps complexos.</strong> Basta enviar uma mensagem e pronto!
              </p>
              <div className="bg-white/10 backdrop-blur p-4 rounded-lg mb-6" data-aos="fade-up" data-aos-delay="200">
                <div className="flex items-center mb-2">
                  <Clock size={18} className="mr-2 text-yellow-300" />
                  <span className="font-medium">Economize 5+ horas por mês</span>
                </div>
                <div className="flex items-center mb-2">
                  <AlertCircle size={18} className="mr-2 text-yellow-300" />
                  <span className="font-medium">Nunca mais esqueça de pagar uma conta</span>
                </div>
                <div className="flex items-center">
                  <TrendingUp size={18} className="mr-2 text-yellow-300" />
                  <span className="font-medium">Reduza gastos desnecessários em até 25%</span>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4" data-aos="fade-up" data-aos-delay="300">
                <button 
                  onClick={handleStartTrial}
                  className="btn inline-flex items-center justify-center px-6 py-3 bg-white text-primary-600 hover:bg-neutral-100 font-medium rounded-lg shadow-md transition-all hover:scale-105 duration-300"
                >
                  Garantir acesso antecipado
                  <ArrowRight size={18} className="ml-2" />
                </button>
                <a 
                  href="#como-funciona" 
                  className="btn inline-flex items-center justify-center px-6 py-3 border border-white/30 text-white hover:bg-white/10 font-medium rounded-lg transition-all hover:scale-105 duration-300"
                >
                  Saiba como funciona
                </a>
              </div>
              
              {userCount > 0 && (
                <div className="mt-6 text-sm bg-white/10 inline-block px-3 py-2 rounded-lg" data-aos="fade-up" data-aos-delay="400">
                  <span className="font-medium">{userCount}+ pessoas</span> já garantiram acesso na pré-venda
                </div>
              )}
              
              <div className="mt-4 flex items-center text-sm" data-aos="fade-up" data-aos-delay="500">
                <div className="flex -space-x-2 mr-2">
                  <div className="w-6 h-6 rounded-full bg-blue-400 border border-white"></div>
                  <div className="w-6 h-6 rounded-full bg-green-400 border border-white"></div>
                  <div className="w-6 h-6 rounded-full bg-yellow-400 border border-white"></div>
                </div>
                <p>Oferta por tempo limitado: <span className="font-bold">apenas {countdownDays} dias</span></p>
              </div>
            </div>
            <div className="lg:w-1/2 lg:pl-12" data-aos="fade-left" data-aos-delay="300">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 shadow-xl relative hover:transform hover:scale-105 transition-transform duration-500">
                <img 
                  src="https://images.pexels.com/photos/3943716/pexels-photo-3943716.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" 
                  alt="Finanças Simplificadas App" 
                  className="rounded-xl w-full shadow-lg"
                />
                <div className="absolute -left-4 -bottom-4 bg-white text-primary-600 p-3 rounded-lg shadow-lg max-w-xs animate-bounce-slow">
                  <div className="flex items-start">
                    <MessageSquare size={18} className="mr-2 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-medium text-sm">Gastei R$50 no mercado hoje</p>
                      <p className="text-xs text-gray-500 mt-1">✓ Despesa registrada na categoria "Alimentação"</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Trust Indicators */}
      <div className="bg-white py-6 border-b border-gray-200 relative z-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-8 text-sm text-gray-600">
            <div className="flex items-center" data-aos="fade-up" data-aos-delay="100">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-2">
                <Check size={16} className="text-green-500" />
              </div>
              <span>Tecnologia segura</span>
            </div>
            <div className="flex items-center" data-aos="fade-up" data-aos-delay="200">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-2">
                <Check size={16} className="text-green-500" />
              </div>
              <span>Suporte ágil</span>
            </div>
            <div className="flex items-center" data-aos="fade-up" data-aos-delay="300">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-2">
                <Check size={16} className="text-green-500" />
              </div>
              <span>7 dias de garantia</span>
            </div>
            <div className="flex items-center" data-aos="fade-up" data-aos-delay="400">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-2">
                <Check size={16} className="text-green-500" />
              </div>
              <span>Satisfação ou dinheiro de volta</span>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section - Otimizado para conversão */}
      <section id="recursos" className="py-16 sm:py-24 bg-white overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16" data-aos="fade-up">
            <div className="inline-block px-3 py-1 bg-primary-100 text-primary-600 rounded-full text-sm font-medium mb-4">
              EXCLUSIVO
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
              Diga adeus às planilhas complicadas
            </h2>
            <p className="text-lg text-neutral-600">
              Você já tentou outros apps de finanças e desistiu? Nosso sistema resolve os problemas que nenhum outro resolveu.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="card card-hover p-6 transition-all border border-transparent hover:border-primary-200 hover:shadow-lg" data-aos="zoom-in" data-aos-delay="100">
              <div className="bg-primary-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <MessageSquare size={22} className="text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">Use apenas o WhatsApp</h3>
              <p className="text-neutral-600">
                <strong className="text-primary-600">Problema:</strong> Apps financeiros exigem instalação e login constante.
              </p>
              <p className="text-neutral-600 mt-2">
                <strong className="text-success-600">Solução:</strong> Envie mensagens pelo WhatsApp que você já usa todos os dias.
              </p>
            </div>
            
            <div className="card card-hover p-6 transition-all border border-transparent hover:border-primary-200 hover:shadow-lg" data-aos="zoom-in" data-aos-delay="200">
              <div className="bg-secondary-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <PieChart size={22} className="text-secondary-600" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">Categorização Inteligente</h3>
              <p className="text-neutral-600">
                <strong className="text-primary-600">Problema:</strong> Categorizar gastos manualmente é trabalhoso e cansativo.
              </p>
              <p className="text-neutral-600 mt-2">
                <strong className="text-success-600">Solução:</strong> Nossa IA identifica e organiza suas despesas automaticamente.
              </p>
            </div>
            
            <div className="card card-hover p-6 transition-all border border-transparent hover:border-primary-200 hover:shadow-lg" data-aos="zoom-in" data-aos-delay="300">
              <div className="bg-warning-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Bell size={22} className="text-warning-600" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">Alertas que funcionam</h3>
              <p className="text-neutral-600">
                <strong className="text-primary-600">Problema:</strong> Contas esquecidas geram juros e afetam seu score de crédito.
              </p>
              <p className="text-neutral-600 mt-2">
                <strong className="text-success-600">Solução:</strong> Alertas via WhatsApp que você realmente verá e não ignorará.
              </p>
            </div>
            
            <div className="card card-hover p-6 transition-all border border-transparent hover:border-primary-200 hover:shadow-lg" data-aos="zoom-in" data-aos-delay="100">
              <div className="bg-success-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Star size={22} className="text-success-600" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">Metas alcançáveis</h3>
              <p className="text-neutral-600">
                <strong className="text-primary-600">Problema:</strong> Você define metas financeiras mas nunca consegue cumpri-las.
              </p>
              <p className="text-neutral-600 mt-2">
                <strong className="text-success-600">Solução:</strong> Sistema de micro-metas com lembretes e comemorações a cada conquista.
              </p>
            </div>
            
            <div className="card card-hover p-6 transition-all border border-transparent hover:border-primary-200 hover:shadow-lg" data-aos="zoom-in" data-aos-delay="200">
              <div className="bg-danger-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <PieChart size={22} className="text-danger-600" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">Relatórios que fazem sentido</h3>
              <p className="text-neutral-600">
                <strong className="text-primary-600">Problema:</strong> Gráficos complicados que você não entende ou não usa.
              </p>
              <p className="text-neutral-600 mt-2">
                <strong className="text-success-600">Solução:</strong> Visualizações simples e claras com insights acionáveis.
              </p>
            </div>
            
            <div className="card card-hover p-6 transition-all border border-transparent hover:border-primary-200 hover:shadow-lg" data-aos="zoom-in" data-aos-delay="300">
              <div className="bg-neutral-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <MessageSquare size={22} className="text-neutral-600" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">Linguagem Natural</h3>
              <p className="text-neutral-600">
                <strong className="text-primary-600">Problema:</strong> Interfaces complexas e formulários demorados para registrar transações.
              </p>
              <p className="text-neutral-600 mt-2">
                <strong className="text-success-600">Solução:</strong> Escreva normalmente como falaria (ex: "gastei 50 no mercado") e o sistema entende.
              </p>
            </div>
          </div>
          
          <div className="mt-12 text-center" data-aos="fade-up" data-aos-delay="400">
            <button 
              onClick={handleStartTrial}
              className="btn-primary inline-flex items-center px-8 py-3 rounded-lg text-lg transition-all hover:scale-105 duration-300"
            >
              Quero resolver meus problemas financeiros
              <ArrowRight size={18} className="ml-2" />
            </button>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="como-funciona" className="py-16 sm:py-24 bg-neutral-50 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16" data-aos="fade-up">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
              Como funciona
            </h2>
            <p className="text-lg text-neutral-600">
              Em apenas três passos simples, você já estará no controle das suas finanças.
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row space-y-8 md:space-y-0 md:space-x-8">
            <div className="md:w-1/3 flex flex-col items-center text-center" data-aos="fade-up" data-aos-delay="100">
              <div className="bg-primary-500 text-white w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold mb-6 shadow-lg transform transition-transform duration-300 hover:scale-110">
                1
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-3">Crie sua conta</h3>
              <p className="text-neutral-600">
                Registre-se gratuitamente e configure seu perfil em menos de 2 minutos.
              </p>
            </div>
            
            <div className="md:w-1/3 flex flex-col items-center text-center" data-aos="fade-up" data-aos-delay="200">
              <div className="bg-primary-500 text-white w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold mb-6 shadow-lg transform transition-transform duration-300 hover:scale-110">
                2
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-3">Conecte seu WhatsApp</h3>
              <p className="text-neutral-600">
                Vincule seu número do WhatsApp para começar a enviar suas transações.
              </p>
            </div>
            
            <div className="md:w-1/3 flex flex-col items-center text-center" data-aos="fade-up" data-aos-delay="300">
              <div className="bg-primary-500 text-white w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold mb-6 shadow-lg transform transition-transform duration-300 hover:scale-110">
                3
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-3">Comece a usar</h3>
              <p className="text-neutral-600">
                Envie suas despesas e receitas via mensagem e veja a mágica acontecer.
              </p>
            </div>
          </div>
          
          <div className="mt-16 text-center" data-aos="zoom-in" data-aos-delay="400">
            <button 
              onClick={handleStartTrial} 
              className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg inline-flex items-center transition-all duration-300 hover:scale-105 font-medium"
            >
              Começar agora
              <ArrowRight size={18} className="ml-2 transform group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Pricing - Otimizado para conversão */}
      <section id="planos" className="py-16 sm:py-24 bg-white overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16" data-aos="fade-up">
            <div className="inline-block px-3 py-1 bg-primary-100 text-primary-600 rounded-full text-sm font-medium mb-4 animate-pulse">
              OFERTA ESPECIAL DE LANÇAMENTO
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
              Invista em você mesmo, não em taxas
            </h2>
            <p className="text-lg text-neutral-600">
              Quanto você já perdeu com juros, multas e gastos desnecessários? Nossos planos são um investimento, não um custo.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Free Plan */}
            <div className="card p-6 border border-neutral-200 relative hover:shadow-lg transition-all" data-aos="fade-up" data-aos-delay="100">
              <div className="absolute -top-2 -right-2 bg-green-100 text-green-700 text-xs px-2 py-1 rounded font-medium">
                TESTE GRÁTIS
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">Gratuito</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold text-neutral-900">R$0</span>
                <span className="text-neutral-600">/7 dias</span>
              </div>
              <p className="text-neutral-600 mb-6">
                <strong>Economize:</strong> até R$100 em multas e juros evitados
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
                className="btn-outline w-full group"
              >
                Começar gratuitamente
                <ArrowRight size={16} className="ml-2 transform group-hover:translate-x-1 transition-transform" />
              </button>
              
              <p className="text-xs text-center text-neutral-500 mt-4">
                Sem necessidade de cartão de crédito
              </p>
            </div>
            
            {/* Basic Plan */}
            <div className="card p-6 border-2 border-primary-500 relative transform scale-105 shadow-lg" data-aos="fade-up" data-aos-delay="200">
              <div className="absolute -top-4 left-0 right-0 flex justify-center">
                <span className="bg-primary-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                  MAIS POPULAR • VAGAS LIMITADAS
                </span>
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">Básico</h3>
              <div className="mb-1">
                <span className="text-3xl font-bold text-neutral-900">R$39,90</span>
                <span className="text-neutral-600">/mês</span>
              </div>
              <p className="text-xs text-green-600 font-medium mb-2">
                Apenas R$1,33 por dia!
              </p>
              <p className="text-neutral-600 mb-2">
                <strong>Economize:</strong> até R$350/mês em gastos desnecessários identificados
              </p>
              <div className="bg-primary-50 p-2 rounded-md text-primary-700 text-sm mb-6 font-medium">
                🔥 50% de desconto nos primeiros 3 meses
              </div>
              
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <Check size={18} className="text-primary-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span className="text-neutral-700"><strong>Tudo do plano Gratuito</strong></span>
                </li>
                <li className="flex items-start">
                  <Check size={18} className="text-primary-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span className="text-neutral-700">Categorização automática avançada</span>
                </li>
                <li className="flex items-start">
                  <Check size={18} className="text-primary-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span className="text-neutral-700">Metas financeiras inteligentes</span>
                </li>
                <li className="flex items-start">
                  <Check size={18} className="text-primary-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span className="text-neutral-700">Limite de 100 transações/mês</span>
                </li>
              </ul>
              
              <button 
                onClick={handleStartTrial}
                className="btn-primary w-full justify-center group"
              >
                Garantir desconto de 50%
                <ArrowRight size={16} className="ml-2 transform group-hover:translate-x-1 transition-transform" />
              </button>
              
              <p className="text-xs text-center mt-4">
                <span className="text-green-600 font-medium">Garantia de 7 dias</span> ou seu dinheiro de volta
              </p>
            </div>
            
            {/* Premium Plan */}
            <div className="card p-6 border border-neutral-200 hover:border-primary-200 hover:shadow-lg transition-all" data-aos="fade-up" data-aos-delay="300">
              <h3 className="text-xl font-bold text-neutral-900 mb-2">Premium</h3>
              <div className="mb-1">
                <span className="text-3xl font-bold text-neutral-900">R$69,90</span>
                <span className="text-neutral-600">/mês</span>
              </div>
              <p className="text-xs text-green-600 font-medium mb-2">
                Menos de R$2,33 por dia!
              </p>
              <p className="text-neutral-600 mb-6">
                <strong>Economize:</strong> até R$800/mês com estratégias financeiras avançadas
              </p>
              
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <Check size={18} className="text-primary-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span className="text-neutral-700"><strong>Tudo do plano Básico</strong></span>
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
                className="btn-outline w-full justify-center group"
              >
                Escolher plano Premium
                <ArrowRight size={16} className="ml-2 transform group-hover:translate-x-1 transition-transform" />
              </button>
              
              <p className="text-xs text-center mt-4">
                <span className="text-green-600 font-medium">Garantia de 7 dias</span> ou seu dinheiro de volta
              </p>
            </div>
          </div>
          
          <div className="max-w-2xl mx-auto mt-12 bg-neutral-50 p-4 rounded-lg border border-neutral-200" data-aos="zoom-in" data-aos-delay="400">
            <div className="flex items-start">
              <div className="bg-primary-100 p-2 rounded-full mr-4 flex-shrink-0 animate-pulse">
                <AlertCircle size={20} className="text-primary-600" />
              </div>
              <div>
                <h4 className="font-medium text-neutral-900 mb-1">Vagas limitadas para o lançamento</h4>
                <p className="text-neutral-600 text-sm">
                  Para garantir um serviço de qualidade, estamos limitando o número de novos usuários nesta fase inicial. Garanta sua vaga agora.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="perguntas" className="py-16 sm:py-24 bg-neutral-50 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16" data-aos="fade-up">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Perguntas frequentes
            </h2>
            <p className="text-lg text-gray-600">
              Tire suas dúvidas sobre o Finanças Simplificadas.
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-all duration-300" data-aos="fade-up" data-aos-delay="100">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Como funciona a integração com o WhatsApp?</h3>
              <p className="text-gray-600">
                Após se cadastrar, você conecta seu número do WhatsApp à nossa plataforma. Então, basta enviar mensagens como "Gastei R$50 no mercado" e nosso sistema automaticamente registra e categoriza essa transação.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-all duration-300" data-aos="fade-up" data-aos-delay="200">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Meus dados financeiros estão seguros?</h3>
              <p className="text-gray-600">
                Sim! Utilizamos criptografia de ponta a ponta e seguimos os mais rigorosos padrões de segurança para proteger seus dados. Nunca compartilhamos suas informações financeiras com terceiros.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-all duration-300" data-aos="fade-up" data-aos-delay="300">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Posso mudar de plano depois?</h3>
              <p className="text-gray-600">
                Absolutamente! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. As mudanças entram em vigor no próximo ciclo de cobrança.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-all duration-300" data-aos="fade-up" data-aos-delay="400">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Como funciona o período de teste?</h3>
              <p className="text-gray-600">
                Oferecemos 14 dias de teste gratuito nos planos pagos. Você pode experimentar todos os recursos premium sem compromisso e decidir se deseja continuar após esse período.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-all duration-300" data-aos="fade-up" data-aos-delay="500">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Preciso instalar algum aplicativo?</h3>
              <p className="text-gray-600">
                Não é necessário instalar nada. O Finanças Simplificadas é um web app que funciona direto do navegador e se integra ao WhatsApp que você já usa.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA - Otimizado para conversão */}
      <section className="py-16 sm:py-24 bg-gradient-to-br from-primary-500 to-secondary-600 text-white overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-block px-4 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-bold mb-6 animate-pulse" data-aos="fade-down">
              VAGAS LIMITADAS • ÚLTIMAS 48 HORAS DE PRÉ-VENDA
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6" data-aos="fade-up">
              Pare de perder dinheiro com contas esquecidas
            </h2>
            <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-sm p-6 rounded-xl mb-8" data-aos="zoom-in" data-aos-delay="200">
              <p className="text-xl mb-4">
                Em média, brasileiros pagam <strong className="text-yellow-300">R$583 por ano</strong> em juros desnecessários por contas atrasadas.
              </p>
              <p className="text-lg mb-0">
                Quanto você está deixando escapar por falta de organização financeira?
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-8" data-aos="fade-up" data-aos-delay="300">
              <button 
                onClick={handleStartTrial} 
                className="btn inline-flex items-center justify-center px-8 py-4 bg-white text-primary-600 hover:bg-neutral-100 text-lg font-medium rounded-lg shadow-md transition-all hover:scale-105 duration-300 group"
              >
                Começar agora sem pagar nada
                <ArrowRight size={20} className="ml-2 transform group-hover:translate-x-1 transition-transform" />
              </button>
              <a 
                href="#planos"
                className="btn inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white hover:bg-white/10 text-lg font-medium rounded-lg transition-all hover:scale-105 duration-300"
              >
                Ver planos completos
              </a>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm" data-aos="fade-up" data-aos-delay="400">
              <div className="flex items-center">
                <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center mr-2">
                  <Check size={14} className="text-green-300" />
                </div>
                <span>Comece em 2 minutos</span>
              </div>
              <div className="flex items-center">
                <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center mr-2">
                  <Check size={14} className="text-green-300" />
                </div>
                <span>Garantia de 7 dias</span>
              </div>
              <div className="flex items-center">
                <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center mr-2">
                  <Check size={14} className="text-green-300" />
                </div>
                <span>Cancele quando quiser</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 text-white py-12 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div data-aos="fade-right">
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
            
            <div data-aos="fade-up" data-aos-delay="100">
              <h3 className="text-lg font-semibold mb-4">Produto</h3>
              <ul className="space-y-2">
                <li><a href="#recursos" className="text-neutral-400 hover:text-white transition-colors duration-300">Recursos</a></li>
                <li><a href="#planos" className="text-neutral-400 hover:text-white transition-colors duration-300">Planos</a></li>
                <li><a href="#" className="text-neutral-400 hover:text-white transition-colors duration-300">Avaliações</a></li>
                <li><a href="#" className="text-neutral-400 hover:text-white transition-colors duration-300">Novidades</a></li>
              </ul>
            </div>
            
            <div data-aos="fade-up" data-aos-delay="200">
              <h3 className="text-lg font-semibold mb-4">Suporte</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-neutral-400 hover:text-white transition-colors duration-300">Central de Ajuda</a></li>
                <li><a href="#perguntas" className="text-neutral-400 hover:text-white transition-colors duration-300">FAQ</a></li>
                <li><a href="#" className="text-neutral-400 hover:text-white transition-colors duration-300">Contato</a></li>
                <li><a href="#" className="text-neutral-400 hover:text-white transition-colors duration-300">Tutoriais</a></li>
              </ul>
            </div>
            
            <div data-aos="fade-up" data-aos-delay="300">
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-neutral-400 hover:text-white transition-colors duration-300">Termos de Serviço</a></li>
                <li><a href="#" className="text-neutral-400 hover:text-white transition-colors duration-300">Política de Privacidade</a></li>
                <li><a href="#" className="text-neutral-400 hover:text-white transition-colors duration-300">Política de Cookies</a></li>
                <li><a href="#" className="text-neutral-400 hover:text-white transition-colors duration-300">Segurança</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-neutral-800 text-neutral-400 text-sm text-center" data-aos="fade-up" data-aos-delay="400">
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