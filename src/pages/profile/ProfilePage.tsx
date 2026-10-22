import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ApiError } from '../../api/api';
import { Avatar } from '../../components/Avatar';
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
import NotFoundPage from '../notfound/NotFoundPage';
import styles from './ProfilePage.module.css';

type ProfileTab = 'activity' | 'skills' | 'badges';

/** /users/:id, et /users/me pour son propre profil. */
export default function ProfilePage() {
  const { id: rawId } = useParams();
  const { status, user } = useSession();
  if (rawId === 'me') {
    if (status === 'loading') return <PageLoader />;
    return user ? (
      <Navigate to={`/users/${user.id}`} replace />
    ) : (
      <Navigate to="/login" replace state={{ from: '/users/me' }} />
    );
  }
  const id = Number(rawId);
  return Number.isInteger(id) && id > 0 ? <ProfileView id={id} /> : <NotFoundPage />;
}

/** Profil public (REP-5) : un CV vivant, construit par l'entraide. */
function ProfileView({ id }: { id: number }) {
  const { t, i18n } = useTranslation();
  const { user } = useSession();
  const [tab, setTab] = useState<ProfileTab>('activity');
  const query = useApiQuery(() => usersApi.get(id), [id]);
  const p = query.data;
  usePageTitle(p?.name ?? t('profile.pageTitle'));

  if (query.loading) return <PageLoader />;
  if (query.error instanceof ApiError && query.error.status === 404) return <NotFoundPage />;
  if (query.error || !p) return <ErrorState error={query.error} onRetry={query.reload} />;

  const isMe = user?.id === p.id;
  const country = countryName(p.country, i18n.language);
  const place = [p.city, country].filter(Boolean).join(', ');
  const joined = new Intl.DateTimeFormat(i18n.language, { month: 'long', year: 'numeric' }).format(
    new Date(p.joinedAt),
  );
  const fmt = (n: number) => n.toLocaleString(i18n.language);

  return (
    <section className={styles.panel}>
      <div className={styles.head}>
        <Avatar name={p.name} photoUrl={p.photoUrl} size={88} />
        <div className={styles.identity}>
          <h1 className={styles.name}>{p.name}</h1>
          {p.githubLogin && <p className={styles.handle}>@{p.githubLogin}</p>}
          {p.bio && <p className={styles.bio}>{p.bio}</p>}
          <ul className={styles.meta}>
            {place && (
              <li>
                <Icon name="pin" size={14} />
                {place}
              </li>
            )}
            <li>
              <Icon name="cal" size={14} />
              {t('profile.joined', { date: joined })}
            </li>
            {p.githubLogin && (
              <li>
                <Icon name="github" size={14} />
                <a
                  href={`https://github.com/${encodeURIComponent(p.githubLogin)}`}
                  rel="noopener noreferrer nofollow"
                >
                  github.com/{p.githubLogin}
                </a>
              </li>
            )}
          </ul>
        </div>
        <div className={styles.headActions}>
          {isMe ? (
            <Link to="/settings" className={buttonClass({ variant: 'secondary' })}>
              {t('profile.edit')}
            </Link>
          ) : (
            <ReportButton targetType="PROFILE" targetId={p.id} authorId={p.id} />
          )}
          {p.recruiterVisible && (
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
          <dd>{fmt(p.stats.answers)}</dd>
        </div>
        <div>
          <dt>{t('profile.stats.accepted')}</dt>
          <dd>{fmt(p.stats.accepted)}</dd>
        </div>
        <div>
          <dt>{t('profile.stats.questions')}</dt>
          <dd>{fmt(p.stats.questions)}</dd>
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
        {tab === 'activity' &&
          (p.activity.length ? (
            <ActivityList items={p.activity} />
          ) : (
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
          ))}
        {tab === 'skills' &&
          (p.skills.length ? (
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
        {tab === 'badges' && <BadgeGrid earned={p.badges} />}
      </Tabs>
    </section>
  );
}
