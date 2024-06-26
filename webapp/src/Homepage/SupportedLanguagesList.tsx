import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { Property } from 'csstype';

import ItemList from '../components/ItemList';

import { Language } from '../assets/language';

export default function SupportedLanguagesList({
  supportedLanguages,
}: SupportedLanguagesListProps) {
  const theme = useTheme();

  return (
    <ItemList
      items={supportedLanguages}
      itemToTile={(lang) => (
        <LanguageTile
          language={lang}
          style={{
            bgcolor: theme.palette.primary.main,
          }}
          key={lang.id}
        />
      )}
      style={{
        gap: '14px',
      }}
    />
  );
}

function LanguageTile({
  language,
  style = defaultLanguageTileStyle,
}: LanguageTileProps) {
  return (
    <Box
      width={style.width ?? defaultLanguageTileStyle.width}
      height={style.height ?? defaultLanguageTileStyle.height}
      display={'flex'}
      justifyContent={'center'}
      alignItems={'center'}
      borderRadius={style.borderRadius ?? defaultLanguageTileStyle.borderRadius}
      bgcolor={style.bgcolor ?? defaultLanguageTileStyle.bgcolor}
    >
      <Typography>{language.name}</Typography>
    </Box>
  );
}

const defaultLanguageTileStyle: LanguageTileStyleProps = {
  width: '100px',
  height: '90px',
  borderRadius: '15px',
  bgcolor: 'white',
};

export interface SupportedLanguagesListProps {
  supportedLanguages: Language[];
}

export interface LanguageTileProps {
  language: Language;
  style?: LanguageTileStyleProps;
}

export interface LanguageTileStyleProps {
  width?: Property.Width;
  height?: Property.Height;
  borderRadius?: Property.BorderRadius;
  bgcolor?: Property.BackgroundColor;
}
