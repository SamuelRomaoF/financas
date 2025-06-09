// Função para gerar código de verificação de 6 dígitos
export function generateVerificationCode() {
    // Gera um código de 6 dígitos
    return Math.floor(100000 + Math.random() * 900000).toString();
} 