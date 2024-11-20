import React from 'react';
import { Style } from '@/types/api/styles.types';

interface BasicStyleProps {
  style: Style;
}

const BasicStyle: React.FC<BasicStyleProps> = ({ style }) => {
  const renderStyle = () => {
    switch (style.style_name) {
      case 'container':
        return <div>Container Style</div>;
      case 'image':
        return <div>Image Style</div>;
      case 'markdown':
        return <div>Markdown Style</div>;
      case 'heading':
        return <div>Heading Style</div>;
      case 'card':
        return <div>Card Style</div>;
      case 'div':
        return <div>Div Style</div>;
      case 'button':
        return <div>Button Style</div>;
      case 'carousel':
        return <div>Carousel Style</div>;
      case 'link':
        return <div>Link Style</div>;
      default:
        return <div>Unsupported style type</div>;
    }
  };

  return (
    <div className={style.css}>
      {renderStyle()}
    </div>
  );
};

export default BasicStyle;