/**
 * Utilitário para sanitizar entradas de texto e prevenir XSS
 */

/**
 * Sanitiza uma string para prevenir XSS
 * @param input String a ser sanitizada
 * @returns String sanitizada
 */
export function sanitizeString(input: string): string {
  if (!input) return '';
  
  // Converte caracteres especiais para entidades HTML
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitiza um objeto inteiro, processando todas as strings
 * @param data Objeto com dados a serem sanitizados
 * @returns Objeto com dados sanitizados
 */
export function sanitizeObject<T extends Record<string, any>>(data: T): T {
  const result: Record<string, any> = {};
  
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = data[key];
      
      if (typeof value === 'string') {
        result[key] = sanitizeString(value);
      } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = sanitizeObject(value);
      } else if (Array.isArray(value)) {
        result[key] = value.map((item: any) => 
          typeof item === 'string' 
            ? sanitizeString(item) 
            : (typeof item === 'object' && item !== null)
              ? sanitizeObject(item)
              : item
        );
      } else {
        result[key] = value;
      }
    }
  }
  
  return result as T;
}

/**
 * Sanitiza um valor de URL para prevenir ataques de redirecionamento
 * @param url URL a ser sanitizada
 * @param allowedDomains Lista de domínios permitidos
 * @returns URL sanitizada ou URL padrão
 */
export function sanitizeUrl(url: string, allowedDomains: string[] = [], defaultUrl: string = '/'): string {
  if (!url) return defaultUrl;
  
  try {
    // Tentar criar um objeto URL para validar
    const urlObj = new URL(url, window.location.origin);
    
    // Se for URL relativa (mesmo domínio), é segura
    if (urlObj.origin === window.location.origin) {
      return url;
    }
    
    // Verificar se o domínio está na lista de permitidos
    if (allowedDomains.some(domain => urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`))) {
      return url;
    }
    
    // Se não for segura, retornar URL padrão
    return defaultUrl;
  } catch (e) {
    // Se não for uma URL válida, assumir que é um caminho relativo
    if (url.startsWith('/')) {
      return url;
    }
    
    return defaultUrl;
  }
} 