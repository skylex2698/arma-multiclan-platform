const COMMON_TIMEZONES = [
  'UTC',
  'Europe/Madrid',
  'Europe/London',
  'Europe/Berlin',
  'America/Argentina/Buenos_Aires',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
];

export const getUserTimezone = () =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

const getDateTimeParts = (value: string | Date, timezone: string) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
    timeZone: timezone,
  }).formatToParts(new Date(value));

  return Object.fromEntries(
    parts
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value])
  ) as Record<string, string>;
};

export const getEventTimezoneOptions = () => {
  const userTimezone = getUserTimezone();
  return Array.from(new Set([userTimezone, ...COMMON_TIMEZONES])).sort();
};

export const getAllTimezoneOptions = () => {
  const userTimezone = getUserTimezone();
  const intlWithSupportedValues = Intl as typeof Intl & {
    supportedValuesOf?: (key: 'timeZone') => string[];
  };

  const supportedTimezones = intlWithSupportedValues.supportedValuesOf?.('timeZone');

  return Array.from(
    new Set([userTimezone, ...(supportedTimezones || COMMON_TIMEZONES)])
  ).sort();
};

export const formatDateInTimezone = (
  value: string | Date,
  timezone: string,
  locale = 'es-ES'
) =>
  new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: timezone,
  }).format(new Date(value));

export const formatTimeInTimezone = (
  value: string | Date,
  timezone: string,
  locale = 'es-ES'
) =>
  new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: timezone,
  }).format(new Date(value));

export const getTimezoneShortName = (
  value: string | Date,
  timezone: string,
  locale = 'es-ES'
) =>
  new Intl.DateTimeFormat(locale, {
    timeZone: timezone,
    timeZoneName: 'short',
  })
    .formatToParts(new Date(value))
    .find((part) => part.type === 'timeZoneName')
    ?.value || timezone;

export const getDateInputValueInTimezone = (
  value: string | Date,
  timezone: string
) => {
  const parts = getDateTimeParts(value, timezone);
  return `${parts.year}-${parts.month}-${parts.day}`;
};

export const getTodayDateInputInTimezone = (timezone: string) =>
  getDateInputValueInTimezone(new Date(), timezone);

export const getTimeInputValueInTimezone = (
  value: string | Date,
  timezone: string
) => {
  const parts = getDateTimeParts(value, timezone);
  return `${parts.hour}:${parts.minute}`;
};

const getTimezoneOffsetMs = (value: string | Date, timezone: string) => {
  const parts = getDateTimeParts(value, timezone);
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );

  return asUtc - new Date(value).getTime();
};

export const createUtcDateFromTimezone = (
  dateInput: string,
  timeInput: string,
  timezone: string
) => {
  const [year, month, day] = dateInput.split('-').map(Number);
  const [hour, minute] = timeInput.split(':').map(Number);

  const reference = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const initialOffset = getTimezoneOffsetMs(reference, timezone);
  const normalized = new Date(reference.getTime() - initialOffset);
  const adjustedOffset = getTimezoneOffsetMs(normalized, timezone);

  return new Date(reference.getTime() - adjustedOffset);
};

export const isDateTimeInPast = (
  dateInput: string,
  timeInput: string,
  timezone: string
) => createUtcDateFromTimezone(dateInput, timeInput, timezone).getTime() < Date.now();

export const getNearestUpcomingFridayDateInput = (
  timezone: string,
  defaultTime = '20:00'
) => {
  const todayInput = getTodayDateInputInTimezone(timezone);
  const [year, month, day] = todayInput.split('-').map(Number);
  const baseDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const daysUntilFriday = (5 - baseDate.getUTCDay() + 7) % 7;
  const candidate = new Date(baseDate);
  candidate.setUTCDate(candidate.getUTCDate() + daysUntilFriday);

  const candidateInput = getDateInputValueInTimezone(candidate, timezone);
  if (!isDateTimeInPast(candidateInput, defaultTime, timezone)) {
    return candidateInput;
  }

  candidate.setUTCDate(candidate.getUTCDate() + 7);
  return getDateInputValueInTimezone(candidate, timezone);
};
