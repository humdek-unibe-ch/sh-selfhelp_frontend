"use client";
import React from "react";
import { styled } from "@mui/material/styles";
import { Stack, Button, Menu, MenuItem, Box } from "@mui/material";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useNavigation } from "@/hooks/useNavigation";
import { IMenuitemsType } from "@/types/layout/sidebar";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

const NavContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
}));

const StyledButton = styled(Button)(({ theme }) => ({
    color: theme.palette.text.secondary,
    fontWeight: 500,
    fontSize: "15px",
    textTransform: "none",
    minHeight: "42px",
    padding: "6px 16px",
    "&:hover": {
        backgroundColor: "rgba(93, 135, 255, 0.08)",
    },
    "&.active": {
        backgroundColor: "rgba(93, 135, 255, 0.15)",
        color: theme.palette.primary.main,
    },
}));

const StyledMenuItem = styled(MenuItem)(({ theme }) => ({
    fontSize: "14px",
    minHeight: "36px",
    "&:hover": {
        backgroundColor: "rgba(93, 135, 255, 0.08)",
    },
    "&.active": {
        backgroundColor: "rgba(93, 135, 255, 0.15)",
        color: theme.palette.primary.main,
    },
}));

const NavItem = ({ item, pathname }: { item: IMenuitemsType; pathname: string }) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const hasChildren = item.children && item.children.length > 0;

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        if (hasChildren) {
            event.preventDefault();
            setAnchorEl(event.currentTarget);
        }
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);

    return (
        <>
            <NextLink
                href={item.href || '#'}
                style={{ textDecoration: 'none' }}
                prefetch={false}
                onClick={handleClick}
            >
                <StyledButton
                    color="inherit"
                    className={pathname === item.href ? "active" : ""}
                    endIcon={hasChildren ? <KeyboardArrowDownIcon /> : null}
                >
                    {item.title}
                </StyledButton>
            </NextLink>
            {hasChildren && (
                <Menu
                    anchorEl={anchorEl}
                    open={open}
                    onClose={handleClose}
                    MenuListProps={{
                        'aria-labelledby': 'basic-button',
                    }}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'center',
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'center',
                    }}
                    PaperProps={{
                        elevation: 2,
                        sx: { 
                            mt: 1,
                            minWidth: 180,
                            '& .MuiList-root': {
                                padding: '8px',
                            }
                        }
                    }}
                >
                    {item.children?.map((child, index) => (
                        <NextLink
                            key={child.href || index}
                            href={child.href || '#'}
                            style={{ textDecoration: 'none', color: 'inherit' }}
                            onClick={handleClose}
                        >
                            <StyledMenuItem
                                className={pathname === child.href ? "active" : ""}
                            >
                                {child.title}
                            </StyledMenuItem>
                        </NextLink>
                    ))}
                </Menu>
            )}
        </>
    );
};

const Navigations = () => {
    const pathname = usePathname();
    const [isMounted, setIsMounted] = useState(false);
    const { menuItems } = useNavigation();

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return null;

    return (
        <NavContainer>
            <Stack 
                direction="row" 
                spacing={1}
                alignItems="center"
                justifyContent="center"
            >
                {menuItems.map((item, i) => (
                    <NavItem key={item.href || i} item={item} pathname={pathname} />
                ))}
            </Stack>
        </NavContainer>
    );
};

export default Navigations;
