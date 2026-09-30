/** Формат телефона KZ — как workflow-mobile/lib/registration.ts */

export const PHONE_REGEX = /^\+7 \d{3} \d{3} \d{2} \d{2}$/;

export function formatPhone(value: string): string {
  let numbers = value.replace(/\D/g, '');
  // Keep intermediate input editable. Inserting "+7 " for a bare "+"
  // duplicated the country digit when users typed the next "7" themselves.
  if (!numbers) return value.trimStart().startsWith('+') ? '+' : '';

  // A pasted ten-digit number is national; a leading 7 is part of its code.
  if (numbers.length === 10 && !value.trimStart().startsWith('+')) {
    numbers = '7' + numbers;
  }
  if (numbers.startsWith('8')) numbers = '7' + numbers.slice(1);
  if (!numbers.startsWith('7')) numbers = '7' + numbers;
  numbers = numbers.slice(0, 11);
  if (numbers.length <= 1) return '+7';
  if (numbers.length <= 4) return `+7 ${numbers.slice(1)}`;
  if (numbers.length <= 7) return `+7 ${numbers.slice(1, 4)} ${numbers.slice(4)}`;
  if (numbers.length <= 9) {
    return `+7 ${numbers.slice(1, 4)} ${numbers.slice(4, 7)} ${numbers.slice(7)}`;
  }
  return `+7 ${numbers.slice(1, 4)} ${numbers.slice(4, 7)} ${numbers.slice(7, 9)} ${numbers.slice(9, 11)}`;
}
