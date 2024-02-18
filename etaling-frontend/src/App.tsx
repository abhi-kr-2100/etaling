import { useTranslation } from 'react-i18next';

export default function App() {
  const { t } = useTranslation('Homepage');

  return (
    <>
      <h1>{t('Estaling')}</h1>
      <p>{t('EstalingMotto')}</p>
    </>
  );
}
