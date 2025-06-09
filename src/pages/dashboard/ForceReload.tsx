import { useEffect, useState } from "react";

interface ForceReloadProps {
  targetPlan: string;
  delayMs?: number;
}

/**
 * Componente que força o recarregamento da página após um certo tempo
 * Útil para resolver problemas de cache ou estado inconsistente
 */
export default function ForceReload({ targetPlan, delayMs = 3000 }: ForceReloadProps) {
  const [reloading, setReloading] = useState(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    let countdownTimer: NodeJS.Timeout;

    setReloading(true);
    console.log(`Plano inconsistente detectado! Recarregando página em ${countdown} segundos...`);

    // Iniciar contagem regressiva
    countdownTimer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Configurar o timer para recarregar
    timer = setTimeout(() => {
      console.log(`Recarregando para aplicar plano: ${targetPlan}`);
      window.location.reload();
    }, delayMs);

    return () => {
      clearTimeout(timer);
      clearInterval(countdownTimer);
    };
  }, [targetPlan, delayMs, countdown]);

  if (!reloading) return null;

  return (
    <div className="fixed top-0 left-0 w-full bg-primary-500 text-white p-2 text-center z-50">
      Detectamos que o plano selecionado é inconsistente. Recarregando em {countdown} segundos...
    </div>
  );
} 