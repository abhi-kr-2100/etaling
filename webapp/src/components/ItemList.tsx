import { ReactNode } from 'react';
import { Property } from 'csstype';
import { Box } from '@mui/material';

export default function ItemList<T>({
  items,
  itemToTile,
  orientation = 'horizontal',
  style = defaultStyle,
}: ItemListProps<T>) {
  return (
    <Box
      display={'flex'}
      sx={{
        gap: style.gap ?? defaultStyle.gap,
      }}
      flexDirection={orientation === 'horizontal' ? 'column' : 'row'}
    >
      {items.map((item, idx) => itemToTile(item, idx))}
    </Box>
  );
}

const defaultStyle: ItemListStyleProps = {
  gap: 0,
};

export interface ItemListProps<T> {
  items: T[];
  itemToTile: (item: T, idx: number) => ReactNode;

  orientation: 'horizontal' | 'vertical';

  style?: ItemListStyleProps;
}

export interface ItemListStyleProps {
  gap?: Property.Gap;
}
