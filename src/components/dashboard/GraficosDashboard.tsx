import {
    Bar,
    BarChart,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { formatCurrency } from '../../utils/formatCurrency';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

interface TransactionDataPoint {
  name: string;
  value: number;
  color: string;
}

interface MonthlyDataPoint {
  name: string;
  receitas: number;
  despesas: number;
}

interface GraficosDashboardProps {
  transactionData: TransactionDataPoint[];
  monthlyData: MonthlyDataPoint[];
  showPieChart?: boolean;
  showBarChart?: boolean;
}

// Função para renderizar os rótulos do gráfico de forma mais inteligente
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, value }: any) => {
  // Se o valor for zero ou muito pequeno, não exibe o rótulo
  if (value === 0 || percent < 0.05) return null;

  const RADIAN = Math.PI / 180;
  // Calcular posição do texto para evitar sobreposição
  const radius = innerRadius + (outerRadius - innerRadius) * 1.1;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="#333"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize="12"
    >
      {`${name} ${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// Função personalizada para renderizar a legenda com as cores corretas
const renderColorfulLegendText = (value: string, entry: any) => {
  const { color } = entry;
  return <span style={{ color }}>{value}</span>;
};

export default function GraficosDashboard({
  transactionData,
  monthlyData,
  showPieChart = true,
  showBarChart = true,
}: GraficosDashboardProps) {
  // Filtrar dados para remover categorias com valor zero
  const filteredTransactionData = transactionData.filter(item => item.value > 0);
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {showPieChart && (
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle>Despesas por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredTransactionData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={filteredTransactionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={renderCustomizedLabel}
                    >
                      {filteredTransactionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => formatCurrency(value as number)}
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        padding: '8px'
                      }}
                      itemStyle={{ color: '#333' }}
                    />
                    <Legend 
                      formatter={renderColorfulLegendText}
                      iconType="circle"
                      layout="vertical"
                      verticalAlign="middle"
                      align="right"
                      wrapperStyle={{
                        paddingLeft: '10px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500 dark:text-gray-400">
                Nenhuma despesa registrada nas categorias
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {showBarChart && (
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle>Receitas vs Despesas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                  <Bar dataKey="receitas" name="Receitas" fill="#2E7D32" />
                  <Bar dataKey="despesas" name="Despesas" fill="#D32F2F" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 