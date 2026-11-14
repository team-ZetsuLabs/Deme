import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { PlaytestDetail } from '../../api/types';
import { Button } from '../../components/Button';
import { buttonClass } from '../../components/buttonClass';
import { Icon } from '../../components/Icon';
import { useToast } from '../../components/useToast';
import { errorMessage } from '../../api/errorMessage';
import { safeUrl } from '../../components/safeUrl';
import { useSession } from '../auth/useSession';
import { playtestsApi } from './playtestsApi';
import styles from './ParticipationPanel.module.css';

export type ParticipationPanelProps = {
  playtest: PlaytestDetail;
  onChange: (updated: PlaytestDetail) => void;
};

/** Parcours du testeur sur une campagne (TST-2) : rejoindre, déclarer, suivre ses 14 jours. */
export function ParticipationPanel({ playtest: p, onChange }: ParticipationPanelProps) {
  const { t } = useTranslation();
  const { user } = useSession();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState('');
  const [confirmingWithdraw, setConfirmingWithdraw] = useState(false);

  const run = async (action: () => Promise<PlaytestDetail>) => {
    setBusy(true);
    try {
      onChange(await action());
    } catch (error) {
      toast(errorMessage(t, error));
    } finally {
      setBusy(false);
    }
  };

  const mine = p.myParticipation;

  // Visiteur non connecté : inviter à se connecter.
  if (!user) {
    return (
      <section className={styles.panel}>
        <h2 className={styles.title}>{t('playtests.join.title')}</h2>
        <p className={styles.lead}>{t('playtests.join.loginText')}</p>
        <Button
          variant="primary"
          onClick={() => navigate('/login', { state: { from: location.pathname } })}
        >
          {t('playtests.join.login')}
        </Button>
      </section>
    );
  }

  // Pas encore testeur : rejoindre si une place est libre.
  if (!mine) {
    if (p.canJoin) {
      return (
        <section className={styles.panel}>
          <h2 className={styles.title}>{t('playtests.join.title')}</h2>
          <p className={styles.lead}>{t('playtests.join.text', { days: p.requiredDays })}</p>
          <Button variant="primary" busy={busy} onClick={() => run(() => playtestsApi.join(p.id))}>
            {t('playtests.join.cta')}
          </Button>
        </section>
      );
    }
    return null;
  }

  // Désisté ou retiré : on ne rejoint plus.
  if (mine.status === 'DROPPED' || mine.status === 'REMOVED') {
    return (
      <section className={styles.panel}>
        <p className={styles.lead}>
          {t(
            mine.status === 'REMOVED'
              ? 'playtests.participation.removed'
              : 'playtests.participation.dropped',
          )}
        </p>
        {mine.dropReason && <p className={styles.reason}>{mine.dropReason}</p>}
      </section>
    );
  }

  if (mine.status === 'COMPLETED') {
    return (
      <section className={`${styles.panel} ${styles.done}`}>
        <Icon name="check" size={20} />
        <div>
          <h2 className={styles.title}>{t('playtests.participation.completedTitle')}</h2>
          <p className={styles.lead}>
            {t('playtests.participation.completedText', { days: mine.requiredDays })}
          </p>
        </div>
      </section>
    );
  }

  const optIn = safeUrl(p.optInUrl);

  // JOINED : installer puis déclarer.
  if (mine.status === 'JOINED') {
    return (
      <section className={styles.panel}>
        <h2 className={styles.title}>{t('playtests.participation.joinedTitle')}</h2>
        <ol className={styles.steps}>
          <li>{t('playtests.participation.step1')}</li>
          <li>{t('playtests.participation.step2')}</li>
          <li>{t('playtests.participation.step3')}</li>
        </ol>
        {optIn && (
          <a
            className={buttonClass({ variant: 'secondary' })}
            href={optIn}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon name="out" size={16} /> {t('playtests.participation.openOptIn')}
          </a>
        )}
        <label className={styles.field} htmlFor="pt-google-email">
          {t('playtests.participation.googleEmail')}
          <input
            id="pt-google-email"
            type="email"
            inputMode="email"
            autoCapitalize="none"
            value={email}
            placeholder="nom@gmail.com"
            onChange={(e) => setEmail(e.target.value)}
          />
          <span className={styles.hint}>{t('playtests.participation.googleEmailHint')}</span>
        </label>
        <div className={styles.actions}>
          <Button
            variant="primary"
            busy={busy}
            onClick={() =>
              run(() => playtestsApi.confirm(p.id, { googleEmail: email.trim() || undefined }))
            }
          >
            {t('playtests.participation.confirm')}
          </Button>
          <Button variant="ghost" disabled={busy} onClick={() => setConfirmingWithdraw(true)}>
            {t('playtests.participation.withdraw')}
          </Button>
        </div>
        {confirmingWithdraw && (
          <WithdrawConfirm
            busy={busy}
            onCancel={() => setConfirmingWithdraw(false)}
            onConfirm={() => run(() => playtestsApi.withdraw(p.id, {}))}
          />
        )}
      </section>
    );
  }

  // CONFIRMED ou VERIFIED : test en cours. En web (tracking NONE), pas de décompte.
  const verified = mine.status === 'VERIFIED';
  const noTracking = p.tracking === 'NONE';
  return (
    <section className={styles.panel}>
      <h2 className={styles.title}>{t('playtests.participation.runningTitle')}</h2>
      <div className={styles.counter}>
        <strong>{mine.daysDone}</strong>
        <span>
          {noTracking
            ? t('playtests.participation.daysInstalled')
            : t('playtests.participation.daysOf', { total: mine.requiredDays })}
        </span>
      </div>
      <p className={styles.lead}>
        {noTracking
          ? t('playtests.participation.web')
          : verified
            ? t('playtests.participation.verified')
            : t('playtests.participation.declared')}
      </p>
      {!noTracking && mine.needsAttention && (
        <p className={styles.warn}>{t('playtests.participation.needsAttention')}</p>
      )}
      <div className={styles.actions}>
        {!noTracking && (
          <Button
            variant="primary"
            busy={busy}
            disabled={mine.checkedInToday}
            onClick={() => run(() => playtestsApi.checkIn(p.id))}
          >
            {mine.checkedInToday
              ? t('playtests.participation.checkedIn')
              : t('playtests.participation.checkIn')}
          </Button>
        )}
        <Button variant="ghost" disabled={busy} onClick={() => setConfirmingWithdraw(true)}>
          {t('playtests.participation.withdraw')}
        </Button>
      </div>
      {confirmingWithdraw && (
        <WithdrawConfirm
          busy={busy}
          onCancel={() => setConfirmingWithdraw(false)}
          onConfirm={() => run(() => playtestsApi.withdraw(p.id, {}))}
        />
      )}
    </section>
  );
}

type WithdrawConfirmProps = { busy: boolean; onCancel: () => void; onConfirm: () => void };

function WithdrawConfirm({ busy, onCancel, onConfirm }: WithdrawConfirmProps) {
  const { t } = useTranslation();
  return (
    <div
      className={styles.confirm}
      role="alertdialog"
      aria-label={t('playtests.participation.withdraw')}
    >
      <p>{t('playtests.participation.withdrawConfirm')}</p>
      <div className={styles.actions}>
        <Button variant="danger" busy={busy} onClick={onConfirm}>
          {t('playtests.participation.withdrawYes')}
        </Button>
        <Button variant="ghost" disabled={busy} onClick={onCancel}>
          {t('settings.cancel')}
        </Button>
      </div>
    </div>
  );
}
