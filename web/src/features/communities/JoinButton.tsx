import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { MembershipResult } from '../../api/types';
import { errorMessage } from '../../api/errorMessage';
import { Button } from '../../components/Button';
import { useToast } from '../../components/useToast';
import { useSession } from '../auth/useSession';
import { communitiesApi } from './communitiesApi';

export type JoinButtonProps = {
  slug: string;
  name: string;
  joined: boolean;
  memberCount: number;
  onChange: (result: MembershipResult) => void;
};

/**
 * Rejoindre ou quitter une communauté. Ouvert à tous les niveaux, Nouveau compris.
 * Mise à jour immédiate, annulée si le serveur refuse.
 */
export function JoinButton({
  slug,
  name,
  joined: joinedProp,
  memberCount,
  onChange,
}: JoinButtonProps) {
  const { t } = useTranslation();
  const { user } = useSession();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [pending, setPending] = useState(false);
  // Sans session, personne n'est membre, quoi qu'indique la réponse.
  const joined = !!user && joinedProp;

  const onClick = async () => {
    if (!user) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    const previous = { joined, memberCount };
    onChange({ joined: !joined, memberCount: memberCount + (joined ? -1 : 1) });
    setPending(true);
    try {
      const result = joined ? await communitiesApi.leave(slug) : await communitiesApi.join(slug);
      onChange(result);
      toast(t(joined ? 'communities.left' : 'communities.joinedToast', { name }));
    } catch (error) {
      onChange(previous);
      toast(errorMessage(t, error));
    } finally {
      setPending(false);
    }
  };

  return (
    <Button
      size="sm"
      variant={joined ? 'secondary' : 'primary'}
      aria-pressed={joined}
      aria-label={t(joined ? 'communities.leaveLabel' : 'communities.joinLabel', { name })}
      disabled={pending}
      onClick={onClick}
    >
      {joined ? t('communities.member') : t('communities.join')}
    </Button>
  );
}
