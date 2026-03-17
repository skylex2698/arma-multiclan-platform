import { normalizeFrequencyValue } from './frequency';

const RADIO_PHONETIC_ALPHABET = [
  'Alfa',
  'Bravo',
  'Charlie',
  'Delta',
  'Echo',
  'Foxtrot',
  'Golf',
  'Hotel',
  'India',
  'Juliet',
  'Kilo',
  'Lima',
  'Mike',
  'November',
  'Oscar',
  'Papa',
  'Quebec',
  'Romeo',
  'Sierra',
  'Tango',
  'Uniform',
  'Victor',
  'Whiskey',
  'X-ray',
  'Yankee',
  'Zulu',
];

export const DEFAULT_SQUAD_BASE_FREQUENCY = '41.00';

export const getPhoneticSquadName = (sequence: number) => {
  const safeSequence = Math.max(sequence, 1);
  const alphabetIndex = (safeSequence - 1) % RADIO_PHONETIC_ALPHABET.length;
  const cycle = Math.floor((safeSequence - 1) / RADIO_PHONETIC_ALPHABET.length) + 1;
  const baseName = RADIO_PHONETIC_ALPHABET[alphabetIndex];

  return cycle === 1 ? baseName : `${baseName} ${cycle}`;
};

export const getAutomaticSquadFrequency = (
  baseFrequency: string,
  sequence: number
) => {
  const normalizedBase = normalizeFrequencyValue(baseFrequency);

  if (!normalizedBase) {
    return '';
  }

  const numericBase = Number(normalizedBase);
  if (!Number.isFinite(numericBase)) {
    return '';
  }

  return (numericBase + Math.max(sequence - 1, 0)).toFixed(2);
};

export const buildAutomaticSquadIdentity = (
  sequence: number,
  baseFrequency: string
) => ({
  sequence,
  name: getPhoneticSquadName(sequence),
  frequency: getAutomaticSquadFrequency(baseFrequency, sequence),
});
