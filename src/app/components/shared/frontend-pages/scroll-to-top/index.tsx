'use client';
import { useEffect, useState } from 'react';
import { ActionIcon, Transition } from '@mantine/core';
import { IconArrowUp } from '@tabler/icons-react';

const ScrollToTop = () => {
    const [isVisible, setIsVisible] = useState(false);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    const toggleVisibility = () => {
        if (window.pageYOffset > 300) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    };

    useEffect(() => {
        window.addEventListener('scroll', toggleVisibility);
        return () => {
            window.removeEventListener('scroll', toggleVisibility);
        };
    }, []);

    return (
        <Transition mounted={isVisible} transition="slide-up" duration={400}>
            {(transitionStyles) => (
                <ActionIcon
                    onClick={scrollToTop}
                    variant="filled"
                    color="blue"
                    size="xl"
                    radius="xl"
                    style={{
                        position: 'fixed',
                        right: '30px',
                        bottom: '30px',
                        ...transitionStyles,
                    }}
                >
                    <IconArrowUp size={24} />
                </ActionIcon>
            )}
        </Transition>
    );
};

export default ScrollToTop;
