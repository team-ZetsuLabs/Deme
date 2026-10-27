import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { countryOptions, OTHER_COUNTRY } from '../i18n/countries';
import { Flag } from './Flag';
import styles from './CountrySelect.module.css';

export type CountrySelectProps = {
  /** id du bouton, relié au libellé (`<label htmlFor>` ou Field). */
  id: string;
  /** Code ISO, OTHER_COUNTRY, ou '' quand rien n'est choisi. */
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  /** Texte de la valeur vide : « Choisissez votre pays », « Tous les pays »… */
  emptyLabel: string;
  /** Ajoute le choix « Autre » (diaspora, hors d'Afrique) en fin de liste. */
  otherLabel?: string;
  /** field : dans un formulaire ; filter : dans une barre de filtres. */
  variant?: 'field' | 'filter';
  invalid?: boolean;
  describedBy?: string;
};

type Option = { value: string; label: string };

/** Hauteur maximale de la liste, en pixels (voir .list dans le CSS). */
const LIST_MAX_HEIGHT = 280;

/** Lettres sans accents, pour la saisie au clavier (« cote » trouve « Côte d'Ivoire »). */
const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/**
 * Choix du pays avec les drapeaux : un `<select>` natif ne peut pas afficher d'image.
 * Suit le modèle « combobox en lecture seule » de l'ARIA : le focus reste sur le bouton,
 * l'option active est annoncée par aria-activedescendant.
 */
export function CountrySelect({
  id,
  value,
  onChange,
  onBlur,
  emptyLabel,
  otherLabel,
  variant = 'field',
  invalid = false,
  describedBy,
}: CountrySelectProps) {
  const { i18n } = useTranslation();
  const options = useMemo<Option[]>(
    () => [
      { value: '', label: emptyLabel },
      ...countryOptions(i18n.language).map((c) => ({ value: c.code, label: c.name })),
      ...(otherLabel ? [{ value: OTHER_COUNTRY, label: otherLabel }] : []),
    ],
    [i18n.language, emptyLabel, otherLabel],
  );
  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(selectedIndex);
  // La liste s'ouvre vers le haut quand la place manque en dessous (page sans défilement).
  const [upward, setUpward] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typed = useRef({ text: '', at: 0 });
  const listId = `${id}-list`;
  const optionId = (index: number) => `${id}-opt-${index}`;
  const selected = options[selectedIndex];

  useEffect(() => {
    if (!open) return;
    // Fait défiler la liste seule, jamais la page.
    const list = listRef.current;
    const option = list?.children[active] as HTMLElement | undefined;
    if (!list || !option) return;
    if (option.offsetTop < list.scrollTop) list.scrollTop = option.offsetTop;
    else if (option.offsetTop + option.offsetHeight > list.scrollTop + list.clientHeight)
      list.scrollTop = option.offsetTop + option.offsetHeight - list.clientHeight;
  }, [open, active]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const openList = (index = selectedIndex) => {
    const box = wrapRef.current?.getBoundingClientRect();
    if (box) {
      const below = window.innerHeight - box.bottom;
      setUpward(below < LIST_MAX_HEIGHT && box.top > below);
    }
    setActive(index);
    setOpen(true);
  };

  const choose = (index: number) => {
    setOpen(false);
    if (options[index].value !== value) onChange(options[index].value);
  };

  /** Premières lettres tapées : va au pays suivant qui commence ainsi. */
  const typeahead = (key: string) => {
    const now = Date.now();
    const t = typed.current;
    t.text = now - t.at > 700 ? key : t.text + key;
    t.at = now;
    const query = fold(t.text);
    const from = open ? active : selectedIndex;
    const start = t.text.length === 1 ? from + 1 : from;
    for (let i = 0; i < options.length; i++) {
      const index = (start + i) % options.length;
      if (fold(options[index].label).startsWith(query)) return openList(index);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const last = options.length - 1;
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        openList();
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        typeahead(e.key);
      }
      return;
    }
    const moves: Record<string, number> = {
      ArrowDown: Math.min(last, active + 1),
      ArrowUp: Math.max(0, active - 1),
      Home: 0,
      End: last,
      PageDown: Math.min(last, active + 10),
      PageUp: Math.max(0, active - 10),
    };
    if (e.key in moves) {
      e.preventDefault();
      setActive(moves[e.key]);
    } else if (e.key === 'Enter' || (e.key === ' ' && Date.now() - typed.current.at > 700)) {
      e.preventDefault();
      choose(active);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === 'Tab') {
      choose(active);
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      typeahead(e.key);
    }
  };

  return (
    <div
      ref={wrapRef}
      className={variant === 'filter' ? `${styles.wrap} ${styles.filter}` : styles.wrap}
    >
      <button
        type="button"
        id={id}
        role="combobox"
        className={styles.button}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? optionId(active) : undefined}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        onBlur={() => {
          setOpen(false);
          onBlur?.();
        }}
      >
        <FlagSlot code={selected.value} />
        <span
          className={
            selected.value || variant === 'filter'
              ? styles.value
              : `${styles.value} ${styles.empty}`
          }
        >
          {selected.label}
        </span>
      </button>
      <ul
        ref={listRef}
        id={listId}
        role="listbox"
        aria-labelledby={id}
        className={upward ? `${styles.list} ${styles.upward}` : styles.list}
        hidden={!open}
        // Le focus reste sur le bouton pendant le clic dans la liste.
        onMouseDown={(e) => e.preventDefault()}
      >
        {open &&
          options.map((option, index) => (
            <li
              key={option.value || 'empty'}
              id={optionId(index)}
              role="option"
              aria-selected={index === selectedIndex}
              className={index === active ? `${styles.option} ${styles.active}` : styles.option}
              onClick={() => choose(index)}
              onMouseMove={() => index !== active && setActive(index)}
            >
              <FlagSlot code={option.value} />
              {option.label}
            </li>
          ))}
      </ul>
    </div>
  );
}

/** Garde la place du drapeau pour aligner les noms, même sans drapeau. */
function FlagSlot({ code }: { code: string }) {
  return (
    <span className={styles.flagSlot} aria-hidden="true">
      <Flag code={code} width={20} />
    </span>
  );
}
