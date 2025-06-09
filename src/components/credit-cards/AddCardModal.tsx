import { CreditCard as CreditCardIcon, X } from 'lucide-react';
import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CreditCardData, SaveableCreditCardData } from '../../types/finances';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';

interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveCard: (cardData: SaveableCreditCardData) => void;
  cardToEdit: CreditCardData | null;
}

const predefinedCardsOptions = [
  { name: 'Nubank', color: '#820AD1', brand: 'mastercard' as const },
  { name: 'Inter', color: '#FF7A00', brand: 'mastercard' as const },
  { name: 'Itaú Crédito', color: '#EC7000', brand: 'mastercard' as const },
  { name: 'Bradesco Crédito', color: '#CC092F', brand: 'visa' as const },
  { name: 'Santander Crédito', color: '#EC0000', brand: 'mastercard' as const },
  { name: 'BB Crédito', color: '#0033A0', brand: 'visa' as const },
  { name: 'Outro', color: '#6B7280', brand: 'outro' as const }
];

// Cores predefinidas para seleção quando "Outro" é escolhido
const predefinedColors = [
  '#820AD1', // Roxo (Nubank)
  '#FF7A00', // Laranja (Inter)
  '#EC7000', // Laranja (Itaú)
  '#CC092F', // Vermelho (Bradesco)
  '#EC0000', // Vermelho (Santander)
  '#0033A0', // Azul (BB)
  '#00A868', // Verde
  '#00B2FF', // Azul claro
  '#FFD700', // Dourado
  '#4B0082', // Índigo
  '#000000', // Preto
  '#6B7280', // Cinza
];

// Marcas válidas para o select quando "Outro" é escolhido.
const validBrandsForOtherSelection: Array<Exclude<SaveableCreditCardData['brand'], 'outro'> > = [
    'visa', 'mastercard', 'elo', 'amex', 'hipercard', 'diners'
];

export default function AddCardModal({ isOpen, onClose, onSaveCard, cardToEdit }: AddCardModalProps) {
  const [selectedPredefinedName, setSelectedPredefinedName] = useState(predefinedCardsOptions[0].name);
  const [customCardName, setCustomCardName] = useState('');
  const [lastFourDigits, setLastFourDigits] = useState('');
  const [limit, setLimit] = useState<number | '' >('');
  const [dueDate, setDueDate] = useState<number | '' >('');
  const [closingDate, setClosingDate] = useState<number | '' >('');
  const [selectedBrand, setSelectedBrand] = useState<SaveableCreditCardData['brand']>(predefinedCardsOptions[0].brand);
  const [customColor, setCustomColor] = useState('#6B7280');

  // Preencher o formulário com os dados do cartão a ser editado
  useEffect(() => {
    if (cardToEdit) {
      // Verificar se o cartão corresponde a um dos predefinidos
      const predefinedCard = predefinedCardsOptions.find(
        option => option.name === cardToEdit.name && option.brand === cardToEdit.brand
      );
      
      if (predefinedCard) {
        setSelectedPredefinedName(predefinedCard.name);
      } else {
        setSelectedPredefinedName('Outro');
        setCustomCardName(cardToEdit.name);
        setCustomColor(cardToEdit.color);
      }
      
      setLastFourDigits(cardToEdit.lastFourDigits || '');
      setLimit(cardToEdit.limit);
      setDueDate(cardToEdit.dueDate);
      setClosingDate(cardToEdit.closingDate);
      setSelectedBrand(cardToEdit.brand);
    } else if (!isOpen) {
      // Resetar formulário quando modal é fechado
      setSelectedPredefinedName(predefinedCardsOptions[0].name);
      setCustomCardName('');
      setLastFourDigits('');
      setLimit('');
      setDueDate('');
      setClosingDate('');
      setSelectedBrand(predefinedCardsOptions[0].brand);
      setCustomColor('#6B7280');
    }
  }, [cardToEdit, isOpen]);

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
      brandToSave = predefined?.brand as SaveableCreditCardData['brand'];
    }

    const cardDataToSave: SaveableCreditCardData = {
      name: finalCardName,
      lastFourDigits: lastFourDigits || undefined,
      limit: Number(limit),
      dueDate: Number(dueDate),
      closingDate: Number(closingDate),
      color: selectedPredefinedName === 'Outro' ? customColor : predefinedCardsOptions.find(p => p.name === selectedPredefinedName)?.color || '#6B7280',
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
          <CreditCardIcon className="mr-2 h-6 w-6 text-primary-500" />
          {cardToEdit ? 'Editar Cartão' : 'Adicionar Novo Cartão'}
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
            <>
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
                  {validBrandsForOtherSelection.map(brand => (
                      <option key={brand} value={brand}>{brand.charAt(0).toUpperCase() + brand.slice(1)}</option>
                  ))}
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cor do Cartão</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {predefinedColors.map(color => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 ${customColor === color ? 'border-blue-500' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setCustomColor(color)}
                      aria-label={`Selecionar cor ${color}`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="customColorInput" className="text-xs text-gray-500 dark:text-gray-400">
                    Ou digite um código hexadecimal:
                  </label>
                  <input
                    id="customColorInput"
                    type="color"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    className="w-8 h-8 p-0 border-0 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={customColor}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^#([0-9A-F]{3}){1,2}$/i.test(value)) {
                        setCustomColor(value);
                      }
                    }}
                    className="w-24 px-2 py-1 text-sm border rounded"
                    placeholder="#RRGGBB"
                  />
                </div>
                <div className="mt-2 p-4 rounded-lg" style={{ backgroundColor: customColor + '20', borderLeft: `4px solid ${customColor}` }}>
                  <div className="flex items-center">
                    <div className="w-10 h-6 rounded-md" style={{ backgroundColor: customColor }}></div>
                    <span className="ml-2 text-sm font-medium">Prévia da cor selecionada</span>
                  </div>
                </div>
              </div>
            </>
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
              value={limit} 
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                const value = e.target.value.replace(/\D/g, '');
                setLimit(value === '' ? '' : Number(value));
              }} 
              placeholder="Ex: 5000"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vencimento (Dia)</label>
              <Input 
                id="dueDate" 
                value={dueDate} 
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  const value = e.target.value.replace(/\D/g, '');
                  if (value === '') {
                    setDueDate('');
                  } else {
                    const numValue = parseInt(value, 10);
                    setDueDate(numValue > 31 ? 31 : numValue);
                  }
                }} 
                placeholder="Ex: 10"
                required
              />
            </div>
            <div>
              <label htmlFor="closingDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fechamento (Dia)</label>
              <Input 
                id="closingDate" 
                value={closingDate} 
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  const value = e.target.value.replace(/\D/g, '');
                  if (value === '') {
                    setClosingDate('');
                  } else {
                    const numValue = parseInt(value, 10);
                    setClosingDate(numValue > 31 ? 31 : numValue);
                  }
                }} 
                placeholder="Ex: 01"
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit">{cardToEdit ? 'Salvar Alterações' : 'Salvar Cartão'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
} 