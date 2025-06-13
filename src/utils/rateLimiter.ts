/**
 * Implementação simples de rate limiting para proteger contra tentativas excessivas de login
 */

interface RateLimitEntry {
  count: number;
  timestamp: number;
}

// Armazenamento em memória para limites de taxa (em produção, use Redis ou similar)
const rateLimits: Record<string, RateLimitEntry> = {};

// Configurações
const MAX_ATTEMPTS = 5;          // Máximo de tentativas
const WINDOW_MS = 15 * 60 * 1000; // Janela de 15 minutos
const BLOCK_MS = 30 * 60 * 1000;  // Bloqueio por 30 minutos

/**
 * Verifica se um identificador (email, IP) excedeu o limite de tentativas
 * @param identifier Identificador único (email, IP)
 * @returns Objeto indicando se está bloqueado e quanto tempo resta
 */
export function checkRateLimit(identifier: string): { 
  blocked: boolean; 
  remainingMs: number;
  attemptsLeft: number;
} {
  const now = Date.now();
  const entry = rateLimits[identifier];
  
  // Se não houver entrada ou a entrada for antiga, resetar
  if (!entry || (now - entry.timestamp) > WINDOW_MS) {
    rateLimits[identifier] = { count: 0, timestamp: now };
    return { blocked: false, remainingMs: 0, attemptsLeft: MAX_ATTEMPTS };
  }
  
  // Se excedeu o limite, verificar se ainda está no período de bloqueio
  if (entry.count >= MAX_ATTEMPTS) {
    const blockEndTime = entry.timestamp + BLOCK_MS;
    if (now < blockEndTime) {
      return { 
        blocked: true, 
        remainingMs: blockEndTime - now,
        attemptsLeft: 0
      };
    } else {
      // Reset após o período de bloqueio
      rateLimits[identifier] = { count: 0, timestamp: now };
      return { blocked: false, remainingMs: 0, attemptsLeft: MAX_ATTEMPTS };
    }
  }
  
  return { 
    blocked: false, 
    remainingMs: 0,
    attemptsLeft: MAX_ATTEMPTS - entry.count
  };
}

/**
 * Incrementa o contador de tentativas para um identificador
 * @param identifier Identificador único (email, IP)
 */
export function incrementRateLimit(identifier: string): void {
  const now = Date.now();
  const entry = rateLimits[identifier] || { count: 0, timestamp: now };
  
  // Se a entrada for antiga, resetar
  if ((now - entry.timestamp) > WINDOW_MS) {
    rateLimits[identifier] = { count: 1, timestamp: now };
    return;
  }
  
  // Incrementar contador
  entry.count += 1;
  rateLimits[identifier] = entry;
}

/**
 * Limpa o rate limit para um identificador (usar após login bem-sucedido)
 * @param identifier Identificador único (email, IP)
 */
export function clearRateLimit(identifier: string): void {
  delete rateLimits[identifier];
}

/**
 * Formata o tempo restante de bloqueio em formato legível
 * @param ms Milissegundos restantes
 * @returns Texto formatado (ex: "12 minutos e 30 segundos")
 */
export function formatRemainingTime(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  
  if (minutes > 0) {
    return `${minutes} minuto${minutes !== 1 ? 's' : ''} e ${seconds} segundo${seconds !== 1 ? 's' : ''}`;
  } else {
    return `${seconds} segundo${seconds !== 1 ? 's' : ''}`;
  }
} 