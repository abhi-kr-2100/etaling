import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

export default function EtalingHeader() {
  const { t } = useTranslation('Homepage');

  return (
    <Box display={'flex'} flexDirection={'column'} alignItems={'center'}>
      <Typography variant="h1">{t('Etaling')}</Typography>
      <Typography variant="subtitle1">{t('EtalingMotto')}</Typography>
    </Box>
  );
}
