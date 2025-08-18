'use client';

import { useState } from 'react';
import { Button, TextInput, Text, Paper, Stack, Group, Badge, Alert } from '@mantine/core';
import { isCssClassSafe, getAllCssClasses } from '../../../../utils/css-safelist';

interface ICssClassValidatorProps {
  testClasses?: string;
}

export function CssClassValidator({ testClasses = '' }: ICssClassValidatorProps) {
  const [inputClasses, setInputClasses] = useState(testClasses);
  const [validationResults, setValidationResults] = useState<Array<{ className: string; isValid: boolean }>>([]);

  const validateClasses = () => {
    const classes = inputClasses.split(' ').filter(cls => cls.trim());
    const results = classes.map(className => ({
      className: className.trim(),
      isValid: isCssClassSafe(className.trim())
    }));
    setValidationResults(results);
  };

  const testCommonClasses = () => {
    const commonTestClasses = [
      'rounded-t-lg',
      'bg-white',
      'shadow-md',
      'p-4',
      'text-xl',
      'grid-cols-2',
      'hover:shadow-lg',
      'transition-shadow',
      'object-cover',
      'max-w-6xl',
      'container',
      'mx-auto'
    ];
    setInputClasses(commonTestClasses.join(' '));
    
    const results = commonTestClasses.map(className => ({
      className,
      isValid: isCssClassSafe(className)
    }));
    setValidationResults(results);
  };

  const copyAllClasses = () => {
    navigator.clipboard.writeText(getAllCssClasses());
  };

  return (
    <Paper p="md" withBorder>
      <Stack gap="md">
        <Text size="lg" fw={500}>CSS Class Validator</Text>
        
        <Alert color="blue" title="Usage">
          This tool helps debug Tailwind CSS classes that might not be included in the final bundle.
          Enter space-separated class names to check if they&apos;re in the safelist.
        </Alert>

        <Group>
          <TextInput
            placeholder="Enter CSS classes separated by spaces"
            value={inputClasses}
            onChange={(e) => setInputClasses(e.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <Button onClick={validateClasses}>Validate</Button>
          <Button variant="outline" onClick={testCommonClasses}>
            Test Common Classes
          </Button>
        </Group>

        {validationResults.length > 0 && (
          <Stack gap="xs">
            <Text fw={500}>Validation Results:</Text>
            <Group gap="xs">
              {validationResults.map(({ className, isValid }) => (
                <Badge
                  key={className}
                  color={isValid ? 'green' : 'red'}
                  variant={isValid ? 'light' : 'filled'}
                >
                  {className} {isValid ? '✓' : '✗'}
                </Badge>
              ))}
            </Group>
          </Stack>
        )}

        <Group>
          <Button variant="outline" size="sm" onClick={copyAllClasses}>
            Copy All Safelist Classes
          </Button>
          <Text size="sm" c="dimmed">
            Total classes in safelist: {getAllCssClasses().split(' ').length}
          </Text>
        </Group>

        {/* Test rendering of common classes */}
        <Stack gap="xs">
          <Text fw={500}>Visual Test:</Text>
          <div className="rounded-t-lg bg-white shadow-md p-4 max-w-md">
            <div className="text-xl font-bold mb-2">Test Card</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-100 p-2 rounded">Item 1</div>
              <div className="bg-green-100 p-2 rounded">Item 2</div>
            </div>
            <div 
              className="w-full h-24 bg-gray-200 rounded mt-4 flex items-center justify-center text-gray-500 text-sm"
            >
              Test Image Area
            </div>
          </div>
        </Stack>
      </Stack>
    </Paper>
  );
} 