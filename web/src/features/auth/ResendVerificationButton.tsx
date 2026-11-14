import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { errorMessage } from '../../api/errorMessage';
import { Button } from '../../components/Button';
import { useToast } from '../../components/useToast';
import { authApi } from './authApi';

export type ResendVerificationButtonProps = { size?: 'sm' | 'md' };

/** Renvoie l'email de vérification (AUTH-4) ; le serveur limite le nombre d'envois. */
export function ResendVerificationButton({ size = 'md' }: ResendVerificationButtonProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const onClick = async () => {
    setBusy(true);
    try {
      await authApi.resendVerification();
      setSent(true);
      toast(t('verifyEmail.resent'));
    } catch (error) {
      toast(errorMessage(t, error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      size={size === 'sm' ? 'sm' : undefined}
      variant="secondary"
      busy={busy}
      disabled={sent}
      onClick={onClick}
    >
      {sent ? t('verifyEmail.resentShort') : t('verifyEmail.resend')}
    </Button>
  );
}
