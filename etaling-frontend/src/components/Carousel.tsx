import { ReactNode } from 'react';

import { Box } from '@mui/material';

import { Property } from 'csstype';

export default function Carousel<T>({
  items,
  itemToTile,
  style = defaultStyle,
}: CarouselProps<T>) {
  return (
    <Box
      display={'flex'}
      sx={{
        gap: style.gap ?? defaultStyle.gap,
      }}
    >
      {items.map((item, idx) => itemToTile(item, idx))}
    </Box>
  );
}

const defaultStyle: CarouselStyleProps = {
  gap: 0,
};

export interface CarouselProps<T> {
  items: T[];
  itemToTile: (item: T, idx: number) => ReactNode;

  style?: CarouselStyleProps;
}

export interface CarouselStyleProps {
  gap?: Property.Gap;
}
