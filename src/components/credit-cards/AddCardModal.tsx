import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { X, CreditCard as CreditCardIcon } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input'; // Corrigido: default import
import Select from '../ui/Select'; // Corrigido: default import
import toast from 'react-hot-toast';
import { SaveableCreditCardData } from '../../types/finances'; // Importar de types/finances

// Interface alinhada com CreditCardData de WalletPage (campos que o modal coleta)
// O ID e currentSpending serão tratados em WalletPage
// export interface SaveableCreditCardData { // Definição removida
//   name: string; 
//   lastFourDigits?: string;
//   limit: number;
//   dueDate: number;
//   closingDate: number;
//   color: string; 
//   brand: 'visa' | 'mastercard' | 'elo' | 'amex'; 
// }

interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveCard: (cardData: SaveableCreditCardData) => void; // Agora usa o tipo importado
}

const predefinedCardsOptions = [
  { name: 'Nubank', color: '#820AD1', brand: 'mastercard' as const },
  { name: 'Inter', color: '#FF7A00', brand: 'mastercard' as const },
  { name: 'Itaú Crédito', color: '#EC7000', brand: 'mastercard' as const },
  { name: 'Bradesco Crédito', color: '#CC092F', brand: 'visa' as const },
  { name: 'Santander Crédito', color: '#EC0000', brand: 'mastercard' as const },
  { name: 'BB Crédito', color: '#0033A0', brand: 'visa' as const }, // Azul para BB, amarelo muito claro para texto
  { name: 'Outro', color: '#6B7280', brand: 'outro' as const } // Alterado de 'other' para 'outro'
];

// Marcas válidas para o select quando "Outro" é escolhido.
// Estas devem ser um subconjunto das marcas em SaveableCreditCardData (excluindo 'outro' que é o gatilho)
const validBrandsForOtherSelection: Array<Exclude<SaveableCreditCardData['brand'], 'outro'> > = [
    'visa', 'mastercard', 'elo', 'amex', 'hipercard', 'diners'
];

export default function AddCardModal({ isOpen, onClose, onSaveCard }: AddCardModalProps) {
  const [selectedPredefinedName, setSelectedPredefinedName] = useState(predefinedCardsOptions[0].name);
  const [customCardName, setCustomCardName] = useState('');
  const [lastFourDigits, setLastFourDigits] = useState('');
  const [limit, setLimit] = useState<number | '' >('');
  const [dueDate, setDueDate] = useState<number | '' >('');
  const [closingDate, setClosingDate] = useState<number | '' >('');
  // Usa o tipo de brand da interface SaveableCreditCardData
  const [selectedBrand, setSelectedBrand] = useState<SaveableCreditCardData['brand']>(predefinedCardsOptions[0].brand);

  useEffect(() => {
    if (!isOpen) {
      setSelectedPredefinedName(predefinedCardsOptions[0].name);
      setCustomCardName('');
      setLastFourDigits('');
      setLimit('');
      setDueDate('');
      setClosingDate('');
      setSelectedBrand(predefinedCardsOptions[0].brand);
    }
  }, [isOpen]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (limit === '' || dueDate === '' || closingDate === '') {
      toast.error('Por favor, preencha o limite, dia de vencimento e dia de fechamento.');
      return;
    }
    const finalCardName = selectedPredefinedName === 'Outro' ? customCardName.trim() : selectedPredefinedName;
    if (!finalCardName) {
      toast.error('Por favor, defina um nome para o cartão.');
      return;
    }

    let brandToSave: SaveableCreditCardData['brand'];

    if (selectedPredefinedName === 'Outro') {
        // Se 'Outro' foi selecionado E selectedBrand ainda é 'outro' (ou não foi mudado para uma marca válida)
        if (selectedBrand === 'outro' || !validBrandsForOtherSelection.includes(selectedBrand as Exclude<SaveableCreditCardData['brand'], 'outro'>)){
            toast.error('Por favor, selecione uma bandeira válida para o cartão "Outro".');
            return;
        }
        brandToSave = selectedBrand;
    } else {
      const predefined = predefinedCardsOptions.find(p => p.name === selectedPredefinedName);
      // predefined.brand aqui pode ser 'mastercard', 'visa', ou 'outro' se for o item "Outro" da lista principal.
      // Contudo, selectedPredefinedName !== 'Outro' garante que não é o caso 'outro' aqui.
      brandToSave = predefined?.brand as SaveableCreditCardData['brand']; // Cast para o tipo mais específico
    }

    const cardDataToSave: SaveableCreditCardData = {
      name: finalCardName,
      lastFourDigits: lastFourDigits || undefined,
      limit: Number(limit),
      dueDate: Number(dueDate),
      closingDate: Number(closingDate),
      color: predefinedCardsOptions.find(p => p.name === selectedPredefinedName)?.color || '#6B7280',
      brand: brandToSave,
    };
    onSaveCard(cardDataToSave);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md relative">
        <button 
          onClick={onClose} 
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <X size={24} />
        </button>
        <h2 className="text-xl font-semibold mb-6 flex items-center text-gray-800 dark:text-white">
          <CreditCardIcon className="mr-2 h-6 w-6 text-primary-500" /> Adicionar Novo Cartão
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="cardType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Banco/Emissor</label>
            <Select 
              id="cardType"
              value={selectedPredefinedName}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                const newSelectedName = e.target.value;
                setSelectedPredefinedName(newSelectedName);
                const cardOption = predefinedCardsOptions.find(p => p.name === newSelectedName);
                // Atualiza selectedBrand com a marca do item predefinido ou 'outro' se for o caso "Outro".
                setSelectedBrand(cardOption?.brand || 'outro'); 
                if (newSelectedName !== 'Outro') setCustomCardName(''); 
              }}
              className="w-full"
            >
              {predefinedCardsOptions.map(card => (
                <option key={card.name} value={card.name}>
                  {card.name}
                </option>
              ))}
            </Select>
          </div>

          {selectedPredefinedName === 'Outro' && (
            <div>
              <label htmlFor="customCardName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do Cartão</label>
              <Input 
                id="customCardName" 
                value={customCardName} 
                onChange={(e: ChangeEvent<HTMLInputElement>) => setCustomCardName(e.target.value)} 
                placeholder="Ex: Cartão XP Visa Infinite"
                required={selectedPredefinedName === 'Outro'}
              />
              <label htmlFor="customCardBrand" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 mt-2">Bandeira</label>
              <Select 
                id="customCardBrand"
                value={selectedBrand === 'outro' ? '' : selectedBrand} 
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedBrand(e.target.value as SaveableCreditCardData['brand'])} 
                required={selectedPredefinedName === 'Outro'}
              >
                <option value="" disabled>Selecione a bandeira</option>
                {/* Usar validBrandsForOtherSelection para popular as opções de bandeira */}
                {validBrandsForOtherSelection.map(brand => (
                    <option key={brand} value={brand}>{brand.charAt(0).toUpperCase() + brand.slice(1)}</option>
                ))}
              </Select>
            </div>
          )}

          <div>
            <label htmlFor="lastFour" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Últimos 4 dígitos (Opcional)</label>
            <Input 
              id="lastFour" 
              value={lastFourDigits} 
              onChange={(e: ChangeEvent<HTMLInputElement>) => setLastFourDigits(e.target.value.replace(/\D/g, '').slice(0,4))} 
              placeholder="1234"
              maxLength={4}
            />
          </div>

          <div>
            <label htmlFor="limit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Limite (R$)</label>
            <Input 
              id="limit" 
              type="number" 
              value={limit} 
              onChange={(e: ChangeEvent<HTMLInputElement>) => setLimit(e.target.value === '' ? '' : parseFloat(e.target.value))} 
              placeholder="Ex: 5000"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vencimento (Dia)</label>
              <Input 
                id="dueDate" 
                type="number" 
                min={1} max={31}
                value={dueDate} 
                onChange={(e: ChangeEvent<HTMLInputElement>) => setDueDate(e.target.value === '' ? '' : parseInt(e.target.value, 10))} 
                placeholder="Ex: 10"
                required
              />
            </div>
            <div>
              <label htmlFor="closingDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fechamento (Dia)</label>
              <Input 
                id="closingDate" 
                type="number" 
                min={1} max={31}
                value={closingDate} 
                onChange={(e: ChangeEvent<HTMLInputElement>) => setClosingDate(e.target.value === '' ? '' : parseInt(e.target.value, 10))} 
                placeholder="Ex: 01"
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit">Salvar Cartão</Button>
          </div>
        </form>
      </div>
    </div>
  );
} 