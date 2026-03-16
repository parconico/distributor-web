const CUIT_MULTIPLIERS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

export function validateCuit(cuit: string): boolean {
  const cleaned = cuit.replace(/\D/g, "");

  if (cleaned.length !== 11) {
    return false;
  }

  const digits = cleaned.split("").map(Number);
  const checkDigit = digits[10];

  let sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += digits[i] * CUIT_MULTIPLIERS[i];
  }

  const mod = sum % 11;
  const expectedCheck = mod === 0 ? 0 : mod === 1 ? 9 : 11 - mod;

  return checkDigit === expectedCheck;
}

export function formatCuit(cuit: string): string {
  const cleaned = cuit.replace(/\D/g, "");

  if (cleaned.length <= 2) {
    return cleaned;
  }

  if (cleaned.length <= 10) {
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
  }

  return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 10)}-${cleaned.slice(10, 11)}`;
}
