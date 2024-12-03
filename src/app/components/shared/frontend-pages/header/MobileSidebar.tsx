/**
 * @fileoverview Mobile sidebar navigation component that displays a collapsible menu
 * for mobile and tablet views of the application.
 */

"use client";
import React from "react";
import { styled } from "@mui/material/styles";
import { 
    Box, 
    Button, 
    Stack,
    Collapse,
    List,
    ListItem,
    ListItemText
} from "@mui/material";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

// Custom components and hooks
import Logo from "@/app/admin/layout/shared/logo/Logo";
import { useNavigation } from "@/hooks/useNavigation";
import { IMenuitemsType } from "@/types/layout/sidebar";

const StyledButton = styled(Button)(({ theme }) => ({
    color: theme.palette.text.secondary,
    fontWeight: 500,
    fontSize: "15px",
    textTransform: "none",
    minHeight: "42px",
    padding: "6px 16px",
    justifyContent: "flex-start",
    width: "100%",
    "&:hover": {
        backgroundColor: "rgba(93, 135, 255, 0.08)",
    },
    "&.active": {
        backgroundColor: "rgba(93, 135, 255, 0.15)",
        color: theme.palette.primary.main,
    },
}));

const StyledListItem = styled(ListItem)(({ theme }) => ({
    padding: "4px 16px 4px 32px",
    "&:hover": {
        backgroundColor: "rgba(93, 135, 255, 0.08)",
        cursor: "pointer",
    },
    "&.active": {
        backgroundColor: "rgba(93, 135, 255, 0.15)",
        color: theme.palette.primary.main,
    },
}));

interface NavItemProps {
    item: IMenuitemsType;
    pathname: string;
}

const NavItem = ({ item, pathname }: NavItemProps) => {
    const [open, setOpen] = React.useState(false);
    const hasChildren = item.children && item.children.length > 0;

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        if (hasChildren) {
            event.preventDefault();
            setOpen(!open);
        }
    };

    return (
        <>
            <NextLink
                href={item.href || '#'}
                style={{ textDecoration: 'none', width: '100%' }}
                onClick={handleClick}
                prefetch={false}
            >
                <StyledButton
                    color="inherit"
                    className={pathname === item.href ? "active" : ""}
                    endIcon={hasChildren ? (open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />) : null}
                >
                    {item.title}
                </StyledButton>
            </NextLink>
            {hasChildren && (
                <Collapse in={open} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                        {item.children?.map((child, index) => (
                            <NextLink
                                key={child.href || index}
                                href={child.href || '#'}
                                style={{ textDecoration: 'none', color: 'inherit' }}
                            >
                                <StyledListItem
                                    className={pathname === child.href ? "active" : ""}
                                >
                                    <ListItemText 
                                        primary={child.title}
                                        primaryTypographyProps={{
                                            fontSize: '14px',
                                            fontWeight: pathname === child.href ? 500 : 400
                                        }}
                                    />
                                </StyledListItem>
                            </NextLink>
                        ))}
                    </List>
                </Collapse>
            )}
        </>
    );
};

const MobileSidebar = () => {
    const pathname = usePathname();
    const { menuItems } = useNavigation();

    return (
        <>
            <Box px={3} py={2}>
                <Logo />
            </Box>
            <Box>
                <Stack direction="column" spacing={1}>
                    {menuItems.map((item, i) => (
                        <NavItem 
                            key={item.href || i} 
                            item={item} 
                            pathname={pathname}
                        />
                    ))}
                </Stack>
            </Box>
        </>
    );
};

export default MobileSidebar;
