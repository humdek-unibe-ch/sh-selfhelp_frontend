import React from 'react';
import { useSelector, useDispatch } from '@/store/hooks';
import { setLanguage } from '@/store/customizer/CustomizerSlice';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { AppState } from '@/store/store';
import { Stack, Text, ActionIcon, Menu, Avatar, Group } from '@mantine/core';

const Languages = [
  {
    flagname: 'English (UK)',
    icon: "/images/flag/icon-flag-en.svg",
    value: 'en',
  },
  {
    flagname: '中国人 (Chinese)',
    icon: "/images/flag/icon-flag-cn.svg",
    value: 'ch',
  },
  {
    flagname: 'français (French)',
    icon: "/images/flag/icon-flag-fr.svg",
    value: 'fr',
  },
  {
    flagname: 'عربي (Arabic)',
    icon: "/images/flag/icon-flag-sa.svg",
    value: 'ar',
  },
];

const Language = () => {
  const dispatch = useDispatch();
  const customizer = useSelector((state: AppState) => state.customizer);
  const currentLang = Languages.find((_lang) => _lang.value === customizer.isLanguage) || Languages[1];
  const { i18n } = useTranslation();

  useEffect(() => {
    i18n.changeLanguage(customizer.isLanguage);
  }, []);

  return (
    <Menu>
      <Menu.Target>
        <ActionIcon variant="transparent">
          <Avatar src={currentLang.icon} alt={currentLang.value} size="sm" />
        </ActionIcon>
      </Menu.Target>

      <Menu.Dropdown w={200}>
        {Languages.map((option, index) => (
          <Menu.Item
            key={index}
            onClick={() => dispatch(setLanguage(option.value))}
          >
            <Group gap="xs">
              <Avatar src={option.icon} alt={option.icon} size="sm" />
              <Text size="sm">{option.flagname}</Text>
            </Group>
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
};

export default Language;
