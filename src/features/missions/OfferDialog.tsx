import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { Money, MyApplication } from '../../api/types';
import { errorMessage } from '../../api/errorMessage';
import { Button } from '../../components/Button';
import { Dialog } from '../../components/Dialog';
import { Field } from '../../components/Field';
import { describedBy } from '../../components/fieldIds';
import { MESSAGE_MAX, MESSAGE_MIN, validateMessage } from '../jobs/validation';
import { missionsApi } from './missionsApi';
import styles from './OfferDialog.module.css';

export type OfferDialogProps = {
  open: boolean;
  missionId: number;
  /** Budget de la mission : sa monnaie sert pour le prix proposé. */
  budget: Money | null;
  onClose: () => void;
  onSent: (application: MyApplication) => void;
};

/** Se proposer pour une mission (JOB-5) : message, prix et délai facultatifs. */
export function OfferDialog({ open, missionId, budget, onClose, onSent }: OfferDialogProps) {
  const { t } = useTranslation();
  const currency = budget?.currency ?? 'XOF';
  const [message, setMessage] = useState('');
  const [price, setPrice] = useState('');
  const [delay, setDelay] = useState('');
  const [messageErr, setMessageErr] = useState<string | null>(null);
  const [formErr, setFormErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const close = () => {
    setMessage('');
    setPrice('');
    setDelay('');
    setMessageErr(null);
    setFormErr(null);
    onClose();
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const problem = validateMessage(message);
    setMessageErr(problem ? t('missions.offer.messageTooShort', { min: MESSAGE_MIN }) : null);
    if (problem) {
      document.getElementById('offer-message')?.focus();
      return;
    }
    setBusy(true);
    setFormErr(null);
    try {
      const amount = Number(price);
      const days = Number(delay);
      const application = await missionsApi.offer(missionId, {
        message: message.trim(),
        price: price && amount > 0 ? { amount, currency } : null,
        delayDays: delay && days > 0 ? days : null,
      });
      onSent(application);
      close();
    } catch (err) {
      setFormErr(errorMessage(t, err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} title={t('missions.offer.title')} onClose={close}>
      <p className={styles.lead}>{t('missions.offer.lead')}</p>
      <form onSubmit={onSubmit} noValidate>
        {formErr && (
          <p className={styles.alert} role="alert">
            {formErr}
          </p>
        )}
        <Field
          id="offer-message"
          label={t('missions.offer.message')}
          hint={t('missions.offer.messageHint')}
          error={messageErr}
          labelAside={
            <span className={styles.count} aria-hidden="true">
              {message.length}/{MESSAGE_MAX}
            </span>
          }
        >
          <textarea
            id="offer-message"
            rows={5}
            maxLength={MESSAGE_MAX}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              if (messageErr && !validateMessage(e.target.value)) setMessageErr(null);
            }}
            aria-invalid={!!messageErr}
            aria-describedby={describedBy('offer-message', true, messageErr)}
          />
        </Field>
        <div className={styles.grid}>
          <Field
            id="offer-price"
            label={
              <>
                {t('missions.offer.price', { currency })}{' '}
                <span className="muted">{t('question.optional')}</span>
              </>
            }
          >
            <input
              id="offer-price"
              type="number"
              inputMode="numeric"
              min={0}
              step={500}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </Field>
          <Field
            id="offer-delay"
            label={
              <>
                {t('missions.offer.delay')} <span className="muted">{t('question.optional')}</span>
              </>
            }
          >
            <input
              id="offer-delay"
              type="number"
              inputMode="numeric"
              min={1}
              max={90}
              value={delay}
              onChange={(e) => setDelay(e.target.value)}
            />
          </Field>
        </div>
        <div className={styles.actions}>
          <Button variant="secondary" onClick={close} disabled={busy}>
            {t('settings.cancel')}
          </Button>
          <Button type="submit" variant="primary" busy={busy}>
            {busy ? t('jobs.apply.busy') : t('missions.offer.submit')}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
