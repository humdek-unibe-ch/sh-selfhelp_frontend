'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Box, Text, Group, Badge, Paper, Stack, Button, Menu, ActionIcon } from '@mantine/core';
import { IconChevronUp, IconChevronDown, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import classes from './SpacingField.module.css';

export type TSpacingValue = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ISpacingValues {
  mt?: TSpacingValue; // margin-top
  mb?: TSpacingValue; // margin-bottom
  ms?: TSpacingValue; // margin-start
  me?: TSpacingValue; // margin-end
  pt?: TSpacingValue; // padding-top
  pb?: TSpacingValue; // padding-bottom
  ps?: TSpacingValue; // padding-start
  pe?: TSpacingValue; // padding-end
}

export type TSpacingFieldType = 'spacing_margin' | 'spacing_margin_padding';

interface ISpacingFieldProps {
  fieldId: number;
  fieldName: string;
  fieldTitle?: string;
  fieldType: TSpacingFieldType;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const SPACING_OPTIONS: TSpacingValue[] = ['none', 'xs', 'sm', 'md', 'lg', 'xl'];

const SPACING_LABELS: Record<TSpacingValue, string> = {
  none: '0',
  xs: 'XS',
  sm: 'SM',
  md: 'MD',
  lg: 'LG',
  xl: 'XL'
};

export function SpacingField({
  fieldId,
  fieldName,
  fieldTitle,
  fieldType,
  value,
  onChange,
  disabled = false
}: ISpacingFieldProps) {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const boxModelRef = useRef<HTMLDivElement>(null);

  // Parse JSON value or return default values
  const parseSpacingValue = useCallback((jsonValue: string): ISpacingValues => {
    if (!jsonValue || jsonValue.trim() === '') {
      return {};
    }

    try {
      const parsed = JSON.parse(jsonValue);
      return parsed || {};
    } catch {
      return {};
    }
  }, []);

  // Convert spacing values back to JSON string
  const stringifySpacingValue = useCallback((spacingValues: ISpacingValues): string => {
    // Filter out undefined and 'none' values
    const filtered = Object.entries(spacingValues).reduce((acc, [key, val]) => {
      if (val && val !== 'none') {
        acc[key as keyof ISpacingValues] = val;
      }
      return acc;
    }, {} as ISpacingValues);

    return JSON.stringify(filtered);
  }, []);

  const spacingValues = parseSpacingValue(value);

  // Handle spacing value change
  const handleSpacingChange = useCallback((property: keyof ISpacingValues, newValue: TSpacingValue) => {
    const updatedValues = { ...spacingValues };

    if (newValue === 'none') {
      delete updatedValues[property];
    } else {
      updatedValues[property] = newValue;
    }

    const newJsonValue = stringifySpacingValue(updatedValues);

    onChange(newJsonValue);
    setActiveDropdown(null);
  }, [spacingValues, onChange, stringifySpacingValue]);

  // Handle arrow button clicks to increment/decrement values
  const handleArrowClick = useCallback((property: keyof ISpacingValues, direction: 'up' | 'down') => {
    if (disabled) return;

    const currentValue = spacingValues[property] || 'none';
    const currentIndex = SPACING_OPTIONS.indexOf(currentValue);
    
    let newIndex: number;
    if (direction === 'up') {
      newIndex = Math.min(currentIndex + 1, SPACING_OPTIONS.length - 1);
    } else {
      newIndex = Math.max(currentIndex - 1, 0);
    }

    const newValue = SPACING_OPTIONS[newIndex];
    handleSpacingChange(property, newValue);
  }, [disabled, spacingValues, handleSpacingChange]);


  // Render spacing control with arrow buttons and dropdown
  const renderSpacingControl = (
    property: keyof ISpacingValues,
    position: string,
    label: string
  ) => {
    const currentValue = spacingValues[property] || 'none';
    const isActive = activeDropdown === property;
    const isVertical = position.includes('Top') || position.includes('Bottom');
    const isStart = position.includes('Start');
    const isEnd = position.includes('End');

    // Arrow button props
    const arrowButtonProps = {
      size: 'xs' as const,
      variant: 'subtle' as const,
      color: 'gray',
      disabled,
    };

    const controlGroup = (
      <Group gap={2} className={`${classes.spacingControl} ${classes[position]}`}>
        {/* Arrow buttons for vertical controls (top/bottom) - positioned left/right */}
        {isVertical && (
          <>
            <ActionIcon
              {...arrowButtonProps}
              onClick={() => handleArrowClick(property, 'down')}
              title={`Decrease ${label}`}
            >
              <IconChevronLeft size={12} />
            </ActionIcon>
            <Menu
              opened={isActive}
              onChange={(opened) => setActiveDropdown(opened ? property : null)}
              position="bottom"
              withArrow
              shadow="md"
              width={80}
            >
              <Menu.Target>
                <Button
                  className={`${classes.spacingValue} ${isActive ? classes.spacingValueActive : ''}`}
                  title={`${label}: ${currentValue}`}
                  variant="outline"
                  size="xs"
                  px="xs"
                  fw={600}
                >
                  {SPACING_LABELS[currentValue]}
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                {SPACING_OPTIONS.map((option) => (
                  <Menu.Item
                    key={option}
                    onClick={() => handleSpacingChange(property, option)}
                    bg={currentValue === option ? 'blue.1' : undefined}
                    fw={currentValue === option ? 600 : 500}
                  >
                    <Text size="xs">
                      {SPACING_LABELS[option]}
                    </Text>
                  </Menu.Item>
                ))}
              </Menu.Dropdown>
            </Menu>
            <ActionIcon
              {...arrowButtonProps}
              onClick={() => handleArrowClick(property, 'up')}
              title={`Increase ${label}`}
            >
              <IconChevronRight size={12} />
            </ActionIcon>
          </>
        )}

        {/* Arrow buttons for horizontal controls (start/end) - positioned top/bottom */}
        {(isStart || isEnd) && (
          <Stack gap={2} align="center">
            <ActionIcon
              {...arrowButtonProps}
              onClick={() => handleArrowClick(property, 'up')}
              title={`Increase ${label}`}
            >
              <IconChevronUp size={12} />
            </ActionIcon>
            <Menu
              opened={isActive}
              onChange={(opened) => setActiveDropdown(opened ? property : null)}
              position="bottom"
              withArrow
              shadow="md"
              width={80}
            >
              <Menu.Target>
                <Button
                  className={`${classes.spacingValue} ${isActive ? classes.spacingValueActive : ''}`}
                  title={`${label}: ${currentValue}`}
                  variant="outline"
                  size="xs"
                  px="xs"
                  fw={600}
                >
                  {SPACING_LABELS[currentValue]}
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                {SPACING_OPTIONS.map((option) => (
                  <Menu.Item
                    key={option}
                    onClick={() => handleSpacingChange(property, option)}
                    bg={currentValue === option ? 'blue.1' : undefined}
                    fw={currentValue === option ? 600 : 500}
                  >
                    <Text size="xs">
                      {SPACING_LABELS[option]}
                    </Text>
                  </Menu.Item>
                ))}
              </Menu.Dropdown>
            </Menu>
            <ActionIcon
              {...arrowButtonProps}
              onClick={() => handleArrowClick(property, 'down')}
              title={`Decrease ${label}`}
            >
              <IconChevronDown size={12} />
            </ActionIcon>
          </Stack>
        )}
      </Group>
    );

    return controlGroup;
  };

  // Determine which controls to show based on field type
  const showMargin = fieldType === 'spacing_margin' || fieldType === 'spacing_margin_padding';
  const showPadding = fieldType === 'spacing_margin_padding';

  return (
    <Stack gap="sm">
      {/* Box Model Visualization */}
      <Paper withBorder p="md" bg="gray.0">
        <Box ref={boxModelRef} className={classes.boxModel}>
          {/* Margin Layer */}
          {showMargin && (
            <Box className={classes.marginLayer}>
              {renderSpacingControl('mt', 'marginTop', 'Margin Top')}
              {renderSpacingControl('mb', 'marginBottom', 'Margin Bottom')}
              {renderSpacingControl('ms', 'marginStart', 'Margin Start')}
              {renderSpacingControl('me', 'marginEnd', 'Margin End')}
            </Box>
          )}

          {/* Padding Layer */}
          {showPadding && (
            <Box className={classes.paddingLayer}>
              {renderSpacingControl('pt', 'paddingTop', 'Padding Top')}
              {renderSpacingControl('pb', 'paddingBottom', 'Padding Bottom')}
              {renderSpacingControl('ps', 'paddingStart', 'Padding Start')}
              {renderSpacingControl('pe', 'paddingEnd', 'Padding End')}
            </Box>
          )}

          {/* Content Area - Fixed position inside padding layer */}
          <Paper className={classes.contentArea} withBorder radius="sm" bg="gray.1">
            <Text size="xs" c="gray.7" fw={600}>
              Content
            </Text>
          </Paper>
        </Box>
      </Paper>

    </Stack>
  );
}
