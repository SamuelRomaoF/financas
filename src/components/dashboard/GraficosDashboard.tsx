import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  XAxis,
  YAxis,
  Bar,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { formatCurrency } from '../../utils/formatCurrency';

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

export default function GraficosDashboard({
  transactionData,
  monthlyData,
  showPieChart = true,
  showBarChart = true,
}: GraficosDashboardProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {showPieChart && (
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle>Despesas por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={transactionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {transactionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
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