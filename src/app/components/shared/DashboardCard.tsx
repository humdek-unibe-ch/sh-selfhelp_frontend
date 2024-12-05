import { useSelector } from '@/store/hooks';
import { AppState } from '@/store/store';
import { Card, Text, Stack, Box, Group } from '@mantine/core';

type Props = {
  title?: string;
  subtitle?: string;
  action?: JSX.Element | any;
  footer?: JSX.Element;
  cardheading?: string | JSX.Element;
  headtitle?: string | JSX.Element;
  headsubtitle?: string | JSX.Element;
  children?: JSX.Element;
  middlecontent?: string | JSX.Element;
};

const DashboardCard = ({
  title,
  subtitle,
  children,
  action,
  footer,
  cardheading,
  headtitle,
  headsubtitle,
  middlecontent,
}: Props) => {
  const customizer = useSelector((state: AppState) => state.customizer);

  return (
    <Card
      p={0}
      shadow={customizer.isCardShadow ? 'md' : undefined}
      withBorder={!customizer.isCardShadow}
    >
      {cardheading ? (
        <Box p="md">
          <Text fz="xl" fw={500}>{headtitle}</Text>
          <Text fz="sm" c="dimmed">{headsubtitle}</Text>
        </Box>
      ) : (
        <Box p="30px">
          {title ? (
            <Group justify="space-between" align="center" mb="lg">
              <Box>
                {title ? <Text fz="xl" fw={500}>{title}</Text> : ''}
                {subtitle ? (
                  <Text fz="sm" c="dimmed">
                    {subtitle}
                  </Text>
                ) : null}
              </Box>
              {action}
            </Group>
          ) : null}

          {children}
        </Box>
      )}

      {middlecontent}
      {footer}
    </Card>
  );
};

export default DashboardCard;
