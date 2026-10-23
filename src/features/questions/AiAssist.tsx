import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { QuestionAssist, QuestionContext } from '../../api/types';
import { ApiError } from '../../api/api';
import { Button } from '../../components/Button';
import { Skeleton } from '../../components/skeleton/Skeleton';
import { AFRICAN_COUNTRIES } from '../../i18n/countries';
import { aiApi, AI_MIN_TEXT } from './aiApi';
import { ContextChips } from './ContextChips';
import { NETWORKS, OPERATORS } from './context';
import { parseTags } from './validation';
import styles from './AiAssist.module.css';

export type AiAssistProps = {
  title: string;
  body: string;
  code: string;
  /** Valeurs actuelles du formulaire, pour ne proposer que ce qui change. */
  tags: string;
  context: QuestionContext;
  onApplyTitle: (title: string) => void;
  onApplyTags: (tags: string[]) => void;
  onApplyContext: (context: Partial<QuestionContext>) => void;
};

type Status = 'idle' | 'loading' | 'done' | 'gone';
type Section = 'title' | 'tags' | 'context';

/** Ne garde que le contexte détecté valide et différent de ce que le membre a déjà saisi. */
function contextChanges(detected: QuestionContext, current: QuestionContext) {
  const changes: Partial<QuestionContext> = {};
  if (
    detected.countryCode &&
    detected.countryCode !== current.countryCode &&
    (AFRICAN_COUNTRIES as readonly string[]).includes(detected.countryCode)
  )
    changes.countryCode = detected.countryCode;
  if (
    detected.mobileMoneyOperator &&
    detected.mobileMoneyOperator !== current.mobileMoneyOperator &&
    OPERATORS.includes(detected.mobileMoneyOperator)
  )
    changes.mobileMoneyOperator = detected.mobileMoneyOperator;
  if (
    detected.networkQuality &&
    detected.networkQuality !== current.networkQuality &&
    NETWORKS.includes(detected.networkQuality)
  )
    changes.networkQuality = detected.networkQuality;
  const version = detected.techVersion?.trim().slice(0, 60);
  if (version && version !== current.techVersion) changes.techVersion = version;
  return changes;
}

/**
 * Assistant de rédaction (IA-1). Les suggestions s'appliquent d'un clic ou s'ignorent :
 * rien ne change sans l'accord du membre. Si l'assistant ne répond pas, il s'efface
 * et la question se publie normalement.
 */
export function AiAssist({
  title,
  body,
  code,
  tags,
  context,
  onApplyTitle,
  onApplyTags,
  onApplyContext,
}: AiAssistProps) {
  const { t, i18n } = useTranslation();
  const [status, setStatus] = useState<Status>('idle');
  const [result, setResult] = useState<QuestionAssist | null>(null);
  const [closed, setClosed] = useState<Section[]>([]);
  const [goneReason, setGoneReason] = useState<string | null>(null);
  const [announce, setAnnounce] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const enoughText = title.trim().length + body.trim().length >= AI_MIN_TEXT;

  const analyse = async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus('loading');
    setClosed([]);
    setAnnounce('');
    try {
      const suggestions = await aiApi.assistQuestion(
        { title: title.trim(), body: body.trim(), code: code.trim() || null },
        controller.signal,
      );
      setResult(suggestions);
      setStatus('done');
    } catch (error) {
      if (controller.signal.aborted) return;
      const code = error instanceof ApiError ? error.code : '';
      setGoneReason(t(code === 'AI_RATE_LIMITED' ? 'ask.ai.rateLimited' : 'ask.ai.unavailable'));
      setStatus('gone');
    }
  };

  const close = (section: Section, message?: string) => {
    setClosed((current) => [...current, section]);
    if (message) setAnnounce(message);
  };

  if (status === 'gone') {
    return (
      <p className={styles.gone} role="status">
        {goneReason}
      </p>
    );
  }

  const suggestedTags =
    result?.tags
      .map((tag) => ({ ...tag, name: parseTags(tag.name)[0] }))
      .filter((tag) => !!tag.name)
      .slice(0, 4) ?? [];
  const sameTags = suggestedTags.map((tag) => tag.name).join(',') === parseTags(tags).join(',');
  const suggestedTitle = result?.title?.trim().slice(0, 150) || null;
  const changes = result ? contextChanges(result.context, context) : {};
  const show = {
    title: !!suggestedTitle && suggestedTitle !== title.trim() && !closed.includes('title'),
    tags: suggestedTags.length > 0 && !sameTags && !closed.includes('tags'),
    context: Object.keys(changes).length > 0 && !closed.includes('context'),
  };
  const missing = (result?.missing ?? []).filter((info) => i18n.exists(`ask.ai.missing.${info}`));
  const nothingLeft = !show.title && !show.tags && !show.context && missing.length === 0;

  return (
    <section className={styles.assist} aria-labelledby="ai-assist-title">
      <div className={styles.head}>
        <div>
          <h2 id="ai-assist-title" className={styles.title}>
            {t('ask.ai.title')}
          </h2>
          <p className={styles.lead}>
            {enoughText ? t('ask.ai.lead') : t('ask.ai.needText', { min: AI_MIN_TEXT })}
          </p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={analyse}
          disabled={!enoughText}
          busy={status === 'loading'}
        >
          {status === 'loading'
            ? t('ask.ai.busy')
            : status === 'done'
              ? t('ask.ai.again')
              : t('ask.ai.button')}
        </Button>
      </div>

      {status === 'loading' && (
        <div className={styles.panel} aria-busy="true">
          <span className="sr-only">{t('ask.ai.busy')}</span>
          <Skeleton width={140} height={11} />
          <Skeleton height={14} />
          <Skeleton width="70%" height={14} />
          <div className={styles.skRow}>
            <Skeleton width={64} height={24} radius="sm" />
            <Skeleton width={84} height={24} radius="sm" />
            <Skeleton width={72} height={24} radius="sm" />
          </div>
        </div>
      )}

      {status === 'done' && result && (
        <div className={styles.panel}>
          <p className={styles.label}>{t('ask.ai.label')}</p>

          {nothingLeft && <p className={styles.text}>{t('ask.ai.nothing')}</p>}

          {show.title && (
            <div className={styles.item}>
              <h3 className={styles.itemTitle}>{t('ask.ai.titleSuggestion')}</h3>
              <p className={styles.quote}>{suggestedTitle}</p>
              <div className={styles.actions}>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    if (suggestedTitle) onApplyTitle(suggestedTitle);
                    close('title', t('ask.ai.appliedTitle'));
                  }}
                >
                  {t('ask.ai.apply')}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => close('title')}>
                  {t('ask.ai.ignore')}
                </Button>
              </div>
            </div>
          )}

          {show.tags && (
            <div className={styles.item}>
              <h3 className={styles.itemTitle}>{t('ask.ai.tagsSuggestion')}</h3>
              <ul className={styles.tags}>
                {suggestedTags.map((tag) => (
                  <li key={tag.name} className={styles.tag}>
                    {tag.name}
                    {tag.isNew && <span className={styles.newTag}>{t('ask.ai.newTag')}</span>}
                  </li>
                ))}
              </ul>
              <div className={styles.actions}>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    onApplyTags(suggestedTags.map((tag) => tag.name));
                    close('tags', t('ask.ai.appliedTags'));
                  }}
                >
                  {t('ask.ai.apply')}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => close('tags')}>
                  {t('ask.ai.ignore')}
                </Button>
              </div>
            </div>
          )}

          {show.context && (
            <div className={styles.item}>
              <h3 className={styles.itemTitle}>{t('ask.ai.contextSuggestion')}</h3>
              <ContextChips
                context={{
                  countryCode: changes.countryCode ?? null,
                  mobileMoneyOperator: changes.mobileMoneyOperator ?? null,
                  networkQuality: changes.networkQuality ?? null,
                  techVersion: changes.techVersion ?? null,
                }}
              />
              <div className={styles.actions}>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    onApplyContext(changes);
                    close('context', t('ask.ai.appliedContext'));
                  }}
                >
                  {t('ask.ai.apply')}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => close('context')}>
                  {t('ask.ai.ignore')}
                </Button>
              </div>
            </div>
          )}

          {missing.length > 0 && (
            <div className={styles.item}>
              <h3 className={styles.itemTitle}>{t('ask.ai.missingTitle')}</h3>
              <ul className={styles.missing}>
                {missing.map((info) => (
                  <li key={info}>{t(`ask.ai.missing.${info}`)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <p className="sr-only" role="status">
        {announce}
      </p>
    </section>
  );
}
