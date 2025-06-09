#!/usr/bin/env node

/**
 * Script para facilitar a implantação no Vercel
 */

import { execSync } from 'child_process';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 Assistente de Implantação para Vercel 🚀');
console.log('==========================================\n');

// Verifica se o Vercel CLI está instalado
try {
  execSync('vercel --version', { stdio: 'ignore' });
  console.log('✅ Vercel CLI encontrado');
} catch (error) {
  console.log('❌ Vercel CLI não encontrado. Instalando...');
  try {
    execSync('npm install -g vercel', { stdio: 'inherit' });
    console.log('✅ Vercel CLI instalado com sucesso');
  } catch (installError) {
    console.error('❌ Falha ao instalar Vercel CLI:', installError.message);
    process.exit(1);
  }
}

// Função para executar comandos
function runCommand(command) {
  try {
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`❌ Erro ao executar comando: ${command}`);
    console.error(error.message);
    return false;
  }
}

// Perguntar se é produção ou preview
rl.question('Deseja fazer deploy para produção? (s/N): ', (answer) => {
  const isProd = answer.toLowerCase() === 's';
  
  console.log('\n📦 Construindo o projeto...');
  runCommand('npm run build');
  
  console.log('\n🚀 Iniciando deploy para', isProd ? 'produção' : 'preview');
  
  if (isProd) {
    runCommand('vercel --prod');
  } else {
    runCommand('vercel');
  }
  
  console.log('\n✅ Deploy concluído!');
  console.log('\n⚠️ IMPORTANTE: Não se esqueça de configurar as variáveis de ambiente no dashboard do Vercel:');
  console.log('  - VITE_SUPABASE_URL');
  console.log('  - VITE_SUPABASE_ANON_KEY');
  console.log('  - VITE_SUPABASE_SERVICE_ROLE_KEY (se necessário)');
  
  rl.close();
}); 