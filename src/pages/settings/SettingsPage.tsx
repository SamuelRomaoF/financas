import { 
  User, 
  HelpCircle,
  ChevronRight
} from 'lucide-react';

const SettingsPage = () => {
  const sections = [
    {
      title: 'Perfil',
      icon: User,
      items: [
        {
          title: 'Meu Número WhatsApp',
          description: 'Alterar ou confirmar seu número para o assistente virtual',
          href: '/app/configuracoes/whatsapp'
        }
      ]
    },
    {
      title: 'Suporte',
      icon: HelpCircle,
      items: [
        {
          title: 'Central de Ajuda',
          description: 'Tutoriais e perguntas frequentes',
          href: '/app/configuracoes/ajuda'
        },
        {
          title: 'Fale Conosco',
          description: 'WhatsApp: (XX) XXXXX-XXXX',
          href: 'https://wa.me/SEUNUMERO'
        }
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 transition-colors duration-200">
        Configurações
      </h1>

      <div className="space-y-6">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <div 
              key={section.title}
              className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden transition-colors duration-200"
            >
              <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
                <div className="flex items-center">
                  <Icon className="h-6 w-6 text-primary-500 transition-colors duration-200" />
                  <h2 className="ml-3 text-lg font-medium text-gray-900 dark:text-white transition-colors duration-200">
                    {section.title}
                  </h2>
                </div>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700 transition-colors duration-200">
                {section.items.map((item) => (
                  <a
                    key={item.title}
                    href={item.href}
                    className="block hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                  >
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <p className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-200">
                            {item.title}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-200">
                            {item.description}
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400 transition-colors duration-200" />
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SettingsPage; 