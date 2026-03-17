import { useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { Clan } from '../../types';

interface ClanInvitationSelectorProps {
  availableClans: Clan[];
  invitedClanIds: string[];
  onToggleClan: (clanId: string) => void;
  disabled?: boolean;
}

export function ClanInvitationSelector({
  availableClans,
  invitedClanIds,
  onToggleClan,
  disabled = false,
}: ClanInvitationSelectorProps) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const invitedClans = useMemo(
    () => availableClans.filter((clan) => invitedClanIds.includes(clan.id)),
    [availableClans, invitedClanIds]
  );

  const filteredClans = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return availableClans;
    }

    return availableClans.filter((clan) => {
      const searchable = `${clan.tag || ''} ${clan.name}`.toLowerCase();
      return searchable.includes(normalizedSearch);
    });
  }, [availableClans, search]);

  const handleRemoveClan = (clanId: string) => {
    onToggleClan(clanId);
    inputRef.current?.focus();
  };

  const suggestedClans = useMemo(
    () => filteredClans.filter((clan) => !invitedClanIds.includes(clan.id)),
    [filteredClans, invitedClanIds]
  );

  const shouldShowDropdown = !disabled && isOpen && suggestedClans.length > 0;
  const firstSuggestedClan = suggestedClans.find(
    (clan) => !invitedClanIds.includes(clan.id)
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        className="rounded-xl border border-military-200 bg-white px-3 py-3 shadow-sm dark:border-gray-700 dark:bg-gray-900"
      >
        <div className="relative">
          <div
            className="flex min-h-11 flex-wrap items-center gap-2 rounded-lg"
            onClick={() => {
              inputRef.current?.focus();
              if (!disabled) {
                setIsOpen(true);
              }
            }}
          >
            {invitedClans.map((clan) => (
              <span
                key={clan.id}
                className="inline-flex items-center gap-2 rounded-full border border-military-200 bg-military-50 px-3 py-1 text-sm text-military-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              >
                <span>{clan.tag ? `[${clan.tag}] ` : ''}{clan.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveClan(clan.id)}
                  disabled={disabled}
                  className="text-military-500 transition-colors hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                  aria-label={`Quitar clan ${clan.name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}

            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (!disabled) {
                  setIsOpen(true);
                }
              }}
              onFocus={() => {
                if (!disabled) {
                  setIsOpen(true);
                }
              }}
              onKeyDown={(e) => {
                if (
                  e.key === 'Backspace' &&
                  search.length === 0 &&
                  invitedClans.length > 0
                ) {
                  handleRemoveClan(invitedClans[invitedClans.length - 1].id);
                }

                if (
                  e.key === 'Enter' &&
                  firstSuggestedClan &&
                  !invitedClanIds.includes(firstSuggestedClan.id)
                ) {
                  e.preventDefault();
                  onToggleClan(firstSuggestedClan.id);
                  setSearch('');
                  setIsOpen(true);
                }

                if (e.key === 'Escape') {
                  setIsOpen(false);
                }
              }}
              placeholder={
                invitedClans.length > 0
                  ? 'Añadir más clanes...'
                  : 'Buscar clan por nombre o tag'
              }
              className="min-w-[220px] flex-1 border-0 bg-transparent p-0 text-sm text-military-900 outline-none placeholder:text-military-400 dark:text-gray-100 dark:placeholder:text-gray-500"
              disabled={disabled || availableClans.length === 0}
            />
          </div>
          {shouldShowDropdown && (
            <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 rounded-xl border border-military-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-900">
              <div className="max-h-56 space-y-1 overflow-y-auto">
                {suggestedClans.map((clan, index) => {
                  return (
                    <button
                      key={clan.id}
                      type="button"
                      onClick={() => {
                        onToggleClan(clan.id);
                        setSearch('');
                        setIsOpen(true);
                        inputRef.current?.focus();
                      }}
                      disabled={disabled}
                      className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-military-50 dark:hover:bg-gray-800"
                    >
                      <div className="min-w-0">
                        <p className="break-words text-sm font-medium text-military-900 dark:text-gray-100">
                          {clan.tag ? `[${clan.tag}] ` : ''}
                          {clan.name}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          index === 0
                            ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                            : 'bg-military-100 text-military-600 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {index === 0 ? 'Enter' : 'Añadir'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
