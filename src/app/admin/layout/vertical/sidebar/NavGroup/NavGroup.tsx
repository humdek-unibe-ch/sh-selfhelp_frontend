import { IconDots } from '@tabler/icons-react';
import React from 'react';
import { Box, Text } from '@mantine/core';

type NavGroup = {
  navlabel?: boolean;
  subheader?: string;
};

interface ItemType {
  item: NavGroup;
  hideMenu: string | boolean;
}

const NavGroup = ({ item, hideMenu }: ItemType) => {
  return (
    <Box
      component="div"
      style={{
        marginTop: '24px',
        marginBottom: '0',
        padding: '3px 12px',
        marginLeft: hideMenu ? undefined : '-10px',
      }}
    >
      <Text
        size="xs"
        fw={700}
        tt="uppercase"
        c="dimmed"
      >
        {hideMenu ? <IconDots size="14" /> : item?.subheader}
      </Text>
    </Box>
  );
};

export default NavGroup;
