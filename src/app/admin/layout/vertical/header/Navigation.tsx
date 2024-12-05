import { useState } from "react";
import Link from "next/link";
import { IconHelp, IconLayoutDashboard } from "@tabler/icons-react";
import { Box, ActionIcon, Menu, Text, Divider, Grid, Button, Group } from "@mantine/core";

const AppDD = () => {
    const [opened, setOpened] = useState(false);

    return (
        <Box>
            <Menu opened={opened} onChange={setOpened}>
                <Menu.Target>
                    <ActionIcon 
                        variant="transparent"
                        color="white"
                        size="lg"
                    >
                        <IconLayoutDashboard size="1.3rem" />
                    </ActionIcon>
                </Menu.Target>

                <Menu.Dropdown w={850}>
                    <Grid>
                        <Grid.Col span={8}>
                            <Box p="md" pr={0} pb="xs">
                                <Divider />
                                <Box
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        paddingTop: "md",
                                        paddingRight: "md",
                                    }}
                                >
                                    <Link href="/faq" className="hover-text-primary">
                                        <Group gap="xs">
                                            <IconHelp size="1.3rem" stroke={1.5} />
                                            <Text size="sm" c="dimmed">
                                                Frequently Asked Questions
                                            </Text>
                                        </Group>
                                    </Link>
                                    <Button radius="xl">Check</Button>
                                </Box>
                            </Box>
                            <Divider orientation="vertical" />
                        </Grid.Col>
                    </Grid>
                </Menu.Dropdown>
            </Menu>
        </Box>
    );
};

export default AppDD;
