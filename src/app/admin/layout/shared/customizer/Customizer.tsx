import { FC, useState } from "react";
import { useSelector, useDispatch } from "@/store/hooks";
import { 
  IconX, 
  IconSettings, 
  IconCheck,
  IconSun,
  IconMoon,
  IconArrowLeft,
  IconArrowRight,
  IconLayoutSidebarRightExpand,
  IconLayoutSidebarLeftExpand,
  IconLayoutDashboard,
  IconBox,
  IconBorderAll,
} from "@tabler/icons-react";
import {
  setTheme,
  setDir,
  setDarkMode,
  toggleLayout,
  toggleSidebar,
  toggleHorizontal,
  setBorderRadius,
  setCardShadow,
} from "@/store/customizer/CustomizerSlice";
import { AppState } from "@/store/store";
import { 
  Box, 
  ActionIcon, 
  Drawer, 
  Title, 
  Divider, 
  Stack, 
  Group,
  Text,
  Tooltip,
  Grid,
  Paper,
  ScrollArea,
  Button,
} from '@mantine/core';

const SIDEBAR_WIDTH = 320;

interface ThemeColor {
  id: number;
  bgColor: string;
  disp?: string;
}

const Customizer: FC = () => {
  const [showDrawer, setShowDrawer] = useState(false);
  const customizer = useSelector((state: AppState) => state.customizer);
  const dispatch = useDispatch();

  const thColors: ThemeColor[] = [
    {
      id: 1,
      bgColor: "#1e88e5",
      disp: "BLUE_THEME",
    },
    {
      id: 2,
      bgColor: "#0074BA",
      disp: "AQUA_THEME",
    },
    {
      id: 3,
      bgColor: "#763EBD",
      disp: "PURPLE_THEME",
    },
    {
      id: 4,
      bgColor: "#0A7EA4",
      disp: "GREEN_THEME",
    },
    {
      id: 5,
      bgColor: "#01C0C8",
      disp: "CYAN_THEME",
    },
    {
      id: 6,
      bgColor: "#FA896B",
      disp: "ORANGE_THEME",
    },
  ];

  const StyledBox = ({ children, onClick, active }: { children: React.ReactNode; onClick?: () => void; active?: boolean }) => (
    <Paper
      p="md"
      onClick={onClick}
      style={{
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'transform 0.1s ease-in',
        backgroundColor: active ? 'var(--mantine-color-blue-light)' : undefined,
        color: active ? 'var(--mantine-color-blue-filled)' : undefined,
        '&:hover': {
          transform: 'scale(1.05)',
        },
      }}
    >
      {children}
    </Paper>
  );

  return (
    <>
      <Tooltip label="Settings">
        <ActionIcon
          variant="filled"
          color="blue"
          size="xl"
          radius="xl"
          pos="fixed"
          bottom={15}
          right={25}
          onClick={() => setShowDrawer(true)}
        >
          <IconSettings stroke={1.5} />
        </ActionIcon>
      </Tooltip>

      <Drawer
        opened={showDrawer}
        onClose={() => setShowDrawer(false)}
        position="right"
        size={SIDEBAR_WIDTH}
      >
        <ScrollArea h="100vh" type="hover">
          <Box p="md">
            <Group justify="space-between" mb="md">
              <Title order={4}>Settings</Title>
              <ActionIcon variant="subtle" onClick={() => setShowDrawer(false)}>
                <IconX size="1rem" />
              </ActionIcon>
            </Group>

            <Divider />

            <Stack mt="lg">
              <Title order={6}>Theme Option</Title>
              <Group grow>
                <StyledBox 
                  onClick={() => dispatch(setDarkMode("light"))}
                  active={customizer.activeMode === "light"}
                >
                  <IconSun size="1.2rem" />
                  <Text>Light</Text>
                </StyledBox>
                <StyledBox 
                  onClick={() => dispatch(setDarkMode("dark"))}
                  active={customizer.activeMode === "dark"}
                >
                  <IconMoon size="1.2rem" />
                  <Text>Dark</Text>
                </StyledBox>
              </Group>

              <Title order={6} mt="lg">Theme Direction</Title>
              <Group grow>
                <StyledBox 
                  onClick={() => dispatch(setDir("ltr"))}
                  active={customizer.activeDir === "ltr"}
                >
                  <IconArrowLeft size="1.2rem" />
                  <Text>LTR</Text>
                </StyledBox>
                <StyledBox 
                  onClick={() => dispatch(setDir("rtl"))}
                  active={customizer.activeDir === "rtl"}
                >
                  <IconArrowRight size="1.2rem" />
                  <Text>RTL</Text>
                </StyledBox>
              </Group>

              <Title order={6} mt="lg">Theme Colors</Title>
              <Grid>
                {thColors.map((thcolor) => (
                  <Grid.Col span={4} key={thcolor.id}>
                    <Tooltip label={thcolor.disp}>
                      <Box
                        onClick={() => dispatch(setTheme(thcolor.disp))}
                        style={{
                          cursor: 'pointer',
                          padding: '10px',
                          transition: 'transform 0.1s ease-in',
                          '&:hover': {
                            transform: 'scale(1.05)',
                          },
                        }}
                      >
                        <Box
                          style={{
                            backgroundColor: thcolor.bgColor,
                            width: 25,
                            height: 25,
                            borderRadius: 60,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                          }}
                        >
                          {customizer.activeTheme === thcolor.disp && (
                            <IconCheck size="0.8rem" />
                          )}
                        </Box>
                      </Box>
                    </Tooltip>
                  </Grid.Col>
                ))}
              </Grid>

              <Title order={6} mt="lg">Layout Type</Title>
              <Group grow>
                <StyledBox 
                  onClick={() => dispatch(toggleHorizontal(false))}
                  active={!customizer.isHorizontal}
                >
                  <IconLayoutDashboard size="1.2rem" />
                  <Text>Vertical</Text>
                </StyledBox>
                <StyledBox 
                  onClick={() => dispatch(toggleHorizontal(true))}
                  active={customizer.isHorizontal}
                >
                  <IconLayoutSidebarRightExpand size="1.2rem" />
                  <Text>Horizontal</Text>
                </StyledBox>
              </Group>

              <Title order={6} mt="lg">Layout Width</Title>
              <Group grow>
                <StyledBox 
                  onClick={() => dispatch(toggleLayout("boxed"))}
                  active={customizer.isLayout === "boxed"}
                >
                  <IconBox size="1.2rem" />
                  <Text>Boxed</Text>
                </StyledBox>
                <StyledBox 
                  onClick={() => dispatch(toggleLayout("full"))}
                  active={customizer.isLayout === "full"}
                >
                  <IconLayoutSidebarLeftExpand size="1.2rem" />
                  <Text>Full</Text>
                </StyledBox>
              </Group>

              <Title order={6} mt="lg">Container Option</Title>
              <Group grow>
                <StyledBox 
                  onClick={() => dispatch(toggleSidebar())}
                  active={!customizer.isCollapse}
                >
                  <IconLayoutSidebarLeftExpand size="1.2rem" />
                  <Text>Sidebar</Text>
                </StyledBox>
                <StyledBox 
                  onClick={() => dispatch(toggleSidebar())}
                  active={customizer.isCollapse}
                >
                  <IconLayoutSidebarRightExpand size="1.2rem" />
                  <Text>Collapse</Text>
                </StyledBox>
              </Group>

              <Title order={6} mt="lg">Card With</Title>
              <Group grow>
                <StyledBox 
                  onClick={() => dispatch(setCardShadow(false))}
                  active={!customizer.isCardShadow}
                >
                  <IconBorderAll size="1.2rem" />
                  <Text>Border</Text>
                </StyledBox>
                <StyledBox 
                  onClick={() => dispatch(setCardShadow(true))}
                  active={customizer.isCardShadow}
                >
                  <IconBox size="1.2rem" />
                  <Text>Shadow</Text>
                </StyledBox>
              </Group>

              <Title order={6} mt="lg">Border Radius</Title>
              <Group grow>
                {[0, 4, 6, 8, 10, 12].map((radius) => (
                  <Paper
                    key={radius}
                    p="xs"
                    style={{
                      cursor: 'pointer',
                      textAlign: 'center',
                      backgroundColor: 
                        customizer.borderRadius === radius 
                          ? 'var(--mantine-color-blue-light)' 
                          : undefined,
                      color: 
                        customizer.borderRadius === radius 
                          ? 'var(--mantine-color-blue-filled)' 
                          : undefined,
                    }}
                    onClick={() => dispatch(setBorderRadius(radius))}
                  >
                    {radius}
                  </Paper>
                ))}
              </Group>
            </Stack>
          </Box>
        </ScrollArea>
      </Drawer>
    </>
  );
};

export default Customizer;
