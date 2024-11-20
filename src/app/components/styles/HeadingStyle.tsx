import React from 'react';
import { HeadingStyle as HeadingStyleType } from '@/types/api/styles.types';

interface HeadingStyleProps {
    style: HeadingStyleType;
}

const HeadingStyle: React.FC<HeadingStyleProps> = ({ style }) => {
    return (
        <div className={style.css}>
            Heading Style: {style.title?.content} (Level {style.level?.content})
        </div>
    );
};

export default HeadingStyle;