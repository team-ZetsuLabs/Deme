import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { buttonClass } from '../../components/buttonClass';
import { StatusScreen } from '../../components/StatusScreen';
import { usePageTitle } from '../../hooks/usePageTitle';

export default function NotFoundPage() {
  const { t } = useTranslation();
  usePageTitle(t('notFound.title'));
  return (
    <StatusScreen
      code="404"
      title={t('notFound.title')}
      text={t('notFound.text')}
      actions={
        <Link to="/questions" className={buttonClass({ variant: 'primary' })}>
          {t('notFound.back')}
        </Link>
      }
    />
  );
}
