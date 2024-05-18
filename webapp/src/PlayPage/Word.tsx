import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Popover,
  PopoverProps,
  Slider,
  Typography,
} from '@mui/material';
import { CorrectedWordScoreType } from './Play';
import { useTranslation } from 'react-i18next';
import { useAuth0 } from '@auth0/auth0-react';
import { updateWordEasinessFactor } from '../queries';

export default function Word({ wordText, wordScore }: WordProps) {
  const [ef, setEF] = useState(wordScore.score.easinessFactor);
  const color = ef < 2.5 ? 'error' : ef === 2.5 ? 'info' : 'success';

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <Chip
        clickable
        component={Typography}
        onClick={handleClick}
        color={color}
        size="small"
        label={wordText || wordScore.word!.wordText!}
      />
      <WordPopover
        wordScore={wordScore}
        setEF={setEF}
        PopoverProps={{
          open,
          anchorEl,
          onClose: handleClose,
          anchorOrigin: {
            vertical: 'bottom',
            horizontal: 'left',
          },
          transformOrigin: {
            vertical: 'top',
            horizontal: 'left',
          },
        }}
      />
    </>
  );
}

function WordPopover({
  wordScore,
  setEF: setParentEF,
  PopoverProps,
}: WordPopoverProps) {
  const { t } = useTranslation('WordDifficulty');
  const { t: tc } = useTranslation('common');

  const [ef, setEF] = useState(wordScore.score.easinessFactor);

  const MIN_EF = 1.3;
  const DEFAULT_EF = 2.5;
  const MAX_EF = Math.max(3.0, wordScore.score.easinessFactor);

  const { getAccessTokenSilently } = useAuth0();
  const updateEF = async () => {
    const token = await getAccessTokenSilently();
    await updateWordEasinessFactor(token, wordScore._id, ef);
    setParentEF(ef);
  };

  const marks = useMemo(
    () => [
      {
        value: MIN_EF,
        label: t('Difficult'),
      },
      {
        value: DEFAULT_EF,
        label: t('Neutral'),
      },
      {
        value: MAX_EF,
        label: t('Easy'),
      },
    ],
    [wordScore.score.easinessFactor],
  );

  return (
    <Popover {...PopoverProps}>
      <Box
        display={'flex'}
        flexDirection={'column'}
        paddingInline={'50px'}
        paddingBlock={'20px'}
        sx={{
          gap: '15px',
        }}
      >
        <Typography variant="body2">
          {t('How easy is this word for you?')}
        </Typography>
        <Slider
          min={1.3}
          max={3.0}
          step={0.01}
          marks={marks}
          value={ef}
          onChange={(_, newValue) => setEF(newValue as number)}
        />
        <Button
          size="small"
          variant="contained"
          style={{
            alignSelf: 'flex-end',
          }}
          onClick={async () => {
            await updateEF();
            PopoverProps.onClose && PopoverProps.onClose({}, 'backdropClick');
          }}
        >
          {tc('Save')}
        </Button>
      </Box>
    </Popover>
  );
}

interface WordPopoverProps {
  wordScore: CorrectedWordScoreType;
  setEF: (ef: number) => void;
  PopoverProps: PopoverProps;
}

export interface WordProps {
  wordText: string;
  wordScore: CorrectedWordScoreType;
}
