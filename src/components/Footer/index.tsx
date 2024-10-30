import { DefaultFooter } from '@ant-design/pro-components';
import React from 'react';

const Footer: React.FC = () => {
  return (
    <DefaultFooter
      style={{
        background: 'none',
      }}
      links={[{ title: 'KameKamehub', href: '' }]}
      prefixCls="2024"
    />
  );
};

export default Footer;
