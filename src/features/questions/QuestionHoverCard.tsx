import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import type { QuestionSummary } from '../../api/types';
import { Icon } from '../../components/Icon';
import { ContextChips } from './ContextChips';
import { questionsApi } from './questionsApi';
import { stripMarkdown } from './stripMarkdown';
import styles from './QuestionHoverCard.module.css';

type Preview = Pick<
  QuestionSummary,
  'title' | 'excerpt' | 'context' | 'score' | 'answerCount' | 'hasAcceptedAnswer'
>;

/** Un même détail n'est chargé qu'une fois, même si on survole le lien plusieurs fois. */
const cache = new Map<number, Preview>();
const SHOW_DELAY_MS = 350;
const CARD_WIDTH = 320;

export type QuestionHoverCardProps = {
  id: number;
  /** Résumé déjà en main (fil, questions similaires) : aucun appel réseau. */
  question?: QuestionSummary;
  children: ReactNode;
};

/**
 * Aperçu d'une question au survol ou au focus d'un lien (titre, extrait, contexte, réponses).
 * Rendu dans un portail en position fixe : il n'est ni rogné ni imbriqué dans un paragraphe.
 */
export function QuestionHoverCard({ id, question, children }: QuestionHoverCardProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(question ?? cache.get(id) ?? null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const showTimer = useRef<number | undefined>(undefined);
  const hideTimer = useRef<number | undefined>(undefined);

  useEffect(
    () => () => {
      window.clearTimeout(showTimer.current);
      window.clearTimeout(hideTimer.current);
    },
    [],
  );

  const load = () => {
    if (question || preview) return;
    questionsApi
      .get(id)
      .then((q) => {
        const p: Preview = {
          title: q.title,
          excerpt: stripMarkdown(q.bodyMarkdown),
          context: q.context,
          score: q.score,
          answerCount: q.answerCount,
          hasAcceptedAnswer: q.acceptedAnswerId != null,
        };
        cache.set(id, p);
        setPreview(p);
      })
      .catch(() => undefined); // un aperçu qui échoue reste silencieux
  };

  const show = () => {
    window.clearTimeout(hideTimer.current);
    load();
    showTimer.current = window.setTimeout(() => {
      const rect = wrapRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.min(CARD_WIDTH, window.innerWidth - 16);
      const rtl = document.documentElement.dir === 'rtl';
      let left = rtl ? rect.right - width : rect.left;
      left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
      setPos({ top: rect.bottom + 8, left, width });
      setOpen(true);
    }, SHOW_DELAY_MS);
  };

  const hide = () => {
    window.clearTimeout(showTimer.current);
    hideTimer.current = window.setTimeout(() => setOpen(false), 100);
  };

  const data = question ?? preview;

  return (
    <span
      ref={wrapRef}
      className={styles.wrap}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocusCapture={show}
      onBlurCapture={hide}
    >
      {children}
      {open &&
        data &&
        pos &&
        createPortal(
          <div
            role="tooltip"
            aria-hidden="true"
            className={styles.card}
            style={{ top: pos.top, left: pos.left, width: pos.width }}
          >
            <span className={styles.cardTitle}>{data.title}</span>
            {data.excerpt && <span className={styles.excerpt}>{data.excerpt}</span>}
            <ContextChips context={data.context} />
            <span className={styles.meta}>
              {data.hasAcceptedAnswer && (
                <span className={styles.solved}>
                  <Icon name="check" size={12} />
                  {t('question.accepted')}
                </span>
              )}
              <span>{t('question.answers', { count: data.answerCount })}</span>
              <span>{t('question.points', { points: data.score })}</span>
            </span>
          </div>,
          document.body,
        )}
    </span>
  );
}
