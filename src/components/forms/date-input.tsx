import { Input, type InputProps } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * Campo de data.
 *
 * Existe por causa do Safari no iOS. Ali o `input[type="date"]` mostra a data
 * por extenso — "15 de ago. de 2026" — e adota esse texto como largura mínima,
 * que nenhuma regra de largura consegue reduzir. O efeito aparecia em três
 * lugares ao mesmo tempo: dentro de um grid o campo invadia a coluna vizinha
 * (nascimento por cima de sexo biológico), dentro de um card ele vazava a borda
 * direita, e sozinho numa linha esticava de ponta a ponta parecendo grande
 * demais ao lado dos outros campos.
 *
 * `appearance-none` devolve o dimensionamento ao CSS, e `min-w-0` permite
 * encolher abaixo do conteúdo — juntos eliminam o transbordo. O seletor nativo
 * continua abrindo ao toque: ele não depende da aparência do controle.
 *
 * `max-w-56` resolve o extremo oposto. Data tem tamanho previsível, então
 * ocupar a largura inteira de um card só afasta o rótulo do valor e desequilibra
 * o formulário. O limite é maior que a data mais longa em português, e como o
 * campo continua `w-full` ele encolhe normalmente em telas estreitas.
 */
export function DateInput({ className, ...props }: Omit<InputProps, 'type'>) {
  return (
    <Input
      type="date"
      className={cn('w-full min-w-0 max-w-56 appearance-none', className)}
      {...props}
    />
  );
}
