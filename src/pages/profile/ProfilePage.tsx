import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ApiError } from '../../api/api';
import { Avatar } from '../../components/Avatar';
import { Flag } from '../../components/Flag';
import { buttonClass } from '../../components/buttonClass';
import { ErrorState } from '../../components/ErrorState';
import { Icon } from '../../components/Icon';
import { StateMessage } from '../../components/StateMessage';
import { Tabs } from '../../components/Tabs';
import { useSession } from '../../features/auth/useSession';
import { ReportButton } from '../../features/moderation/ReportButton';
import { ActivityList } from '../../features/profile/ActivityList';
import { BadgeGrid } from '../../features/profile/BadgeGrid';
import { LevelProgress } from '../../features/profile/LevelProgress';
import { usersApi } from '../../features/profile/usersApi';
import { useApiQuery } from '../../hooks/useApiQuery';
import { usePageTitle } from '../../hooks/usePageTitle';
import { countryName } from '../../i18n/countries';
import { PageLoader } from '../../layout/PageLoader';
import { ProfileSkeleton } from '../../components/skeleton/ProfileSkeleton';
import NotFoundPage from '../notfound/NotFoundPage';
import styles from './ProfilePage.module.css';

type ProfileTab = 'activity' | 'skills' | 'badges';

/** /users/:username, et /users/me pour son propre profil. */
export default function ProfilePage() {
  const { username } = useParams();
  const { status, user } = useSession();
  if (username === 'me') {
    if (status === 'loading') return <PageLoader />;
    return user ? (
      <Navigate to={`/users/${user.username}`} replace />
    ) : (
      <Navigate to="/login" replace state={{ from: '/users/me' }} />
    );
  }
  return username ? <ProfileView username={username} /> : <NotFoundPage />;
}

/** Profil public (REP-5) : un CV vivant, construit par l'entraide. */
function ProfileView({ username }: { username: string }) {
  const { t, i18n } = useTranslation();
  const { user } = useSession();
  const [tab, setTab] = useState<ProfileTab>('activity');
  const query = useApiQuery(() => usersApi.get(username), [username]);
  const p = query.data;
  usePageTitle(p?.displayName ?? t('profile.pageTitle'));

  if (query.loading) return <ProfileSkeleton />;
  if (query.error instanceof ApiError && query.error.status === 404) return <NotFoundPage />;
  if (query.error || !p) return <ErrorState error={query.error} onRetry={query.reload} />;

  const isMe = user?.username === p.username;
  const country = countryName(p.countryCode ?? null, i18n.language);
  const place = [p.city, country].filter(Boolean).join(', ');
  const joined = new Intl.DateTimeFormat(i18n.language, { month: 'long', year: 'numeric' }).format(
    new Date(p.createdAt),
  );
  const fmt = (n: number) => n.toLocaleString(i18n.language);

  return (
    <section className={styles.panel}>
      <div className={styles.head}>
        <Avatar name={p.displayName} photoUrl={p.avatarUrl ?? null} size={88} />
        <div className={styles.identity}>
          <h1 className={styles.name}>{p.displayName}</h1>
          <p className={styles.handle}>@{p.username}</p>
          {p.bio && <p className={styles.bio}>{p.bio}</p>}
          <ul className={styles.meta}>
            {place && (
              <li>
                {country ? <Flag code={p.countryCode} width={18} /> : <Icon name="pin" size={14} />}
                {place}
              </li>
            )}
            <li>
              <Icon name="cal" size={14} />
              {t('profile.joined', { date: joined })}
            </li>
          </ul>
        </div>
        <div className={styles.headActions}>
          {isMe ? (
            <div className={styles.ownActions}>
              <Link to="/profile/edit" className={buttonClass({ variant: 'secondary' })}>
                {t('profile.edit')}
              </Link>
              {/* Accès aux paramètres depuis le profil, utile sur mobile (onglet Compte). */}
              <Link
                to="/settings"
                className={buttonClass({ variant: 'ghost' })}
                aria-label={t('nav.settings')}
                title={t('nav.settings')}
              >
                <Icon name="gear" size={18} />
              </Link>
            </div>
          ) : (
            <ReportButton targetType="PROFILE" targetId={p.username} authorUsername={p.username} />
          )}
          {p.visibleToRecruiters && (
            <span className={styles.recruiter}>
              <Icon name="check" size={14} />
              {t('profile.recruiterVisible')}
            </span>
          )}
        </div>
      </div>

      <dl className={styles.stats}>
        <div>
          <dt>{t('profile.stats.reputation')}</dt>
          <dd className={styles.gold}>{fmt(p.reputation)}</dd>
        </div>
        <div>
          <dt>{t('profile.stats.answers')}</dt>
          <dd>{fmt(p.answerCount)}</dd>
        </div>
        {p.acceptedCount != null && (
          <div>
            <dt>{t('profile.stats.accepted')}</dt>
            <dd>{fmt(p.acceptedCount)}</dd>
          </div>
        )}
        <div>
          <dt>{t('profile.stats.questions')}</dt>
          <dd>{fmt(p.questionCount)}</dd>
        </div>
      </dl>

      <LevelProgress level={p.level} reputation={p.reputation} nextLevelAt={p.nextLevelAt} />

      <Tabs<ProfileTab>
        label={t('profile.sections')}
        active={tab}
        onChange={setTab}
        tabs={[
          { key: 'activity', label: t('profile.tabs.activity') },
          { key: 'skills', label: t('profile.tabs.skills') },
          { key: 'badges', label: t('profile.tabs.badges') },
        ]}
      >
        {tab === 'activity' && (
          <ActivityList
            username={p.username}
            empty={
              <StateMessage
                action={
                  isMe && (
                    <Link to="/questions/ask" className={buttonClass({ variant: 'primary' })}>
                      {t('question.askQuestion')}
                    </Link>
                  )
                }
              >
                {isMe ? t('profile.emptyMine') : t('profile.empty')}
              </StateMessage>
            }
          />
        )}
        {tab === 'skills' &&
          (p.skills?.length ? (
            <>
              <p className={styles.skillsHint}>{t('profile.skillsHint')}</p>
              <ul className={styles.skills}>
                {p.skills.map((skill) => (
                  <li key={skill}>
                    <Link
                      className={styles.skill}
                      to={`/questions?tag=${encodeURIComponent(skill)}`}
                    >
                      {skill}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <StateMessage>{t('profile.noSkills')}</StateMessage>
          ))}
        {tab === 'badges' && <BadgeGrid earned={p.badges ?? []} />}
      </Tabs>
    </section>
  );
}
