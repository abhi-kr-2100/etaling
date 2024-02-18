import { useTranslation } from 'react-i18next';

export default function App() {
  const { t } = useTranslation('Homepage');

  return (
    <>
      <h1>{t('Etaling')}</h1>
      <p>{t('EtalingMotto')}</p>
    </>
  );
}
