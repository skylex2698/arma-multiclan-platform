export const sanitizeFrequencyInput = (value: string) => {
  const cleaned = value.replace(',', '.').replace(/[^\d.]/g, '');
  const [integerPart = '', ...decimalParts] = cleaned.split('.');

  if (decimalParts.length === 0) {
    return integerPart;
  }

  return `${integerPart}.${decimalParts.join('').slice(0, 2)}`;
};

export const normalizeFrequencyValue = (value: string) => {
  const sanitized = sanitizeFrequencyInput(value).trim();

  if (!sanitized) {
    return '';
  }

  const [integerPart = '0', decimalPart = ''] = sanitized.split('.');
  const safeIntegerPart = integerPart || '0';

  return `${safeIntegerPart}.${decimalPart.padEnd(2, '0').slice(0, 2)}`;
};
