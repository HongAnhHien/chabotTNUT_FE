import { type FC } from 'react';
import { type SidebarProps } from './INavProps';
import Sidebar from './Sidebar';

const SidebarMobile: FC<SidebarProps> = (props) => {
  return <Sidebar {...props} />;
};

export default SidebarMobile;
