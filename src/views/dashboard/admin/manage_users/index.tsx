import { type FC } from 'react';
import HeaderComponent from '@/components/common/header_table';
import RenderTableManageUsers from './table/RenderTable';
import BlockUserDialog from './dialogs/BlockUserDialog';

const ManageUsers: FC = () => {
  return (
    <div>
      <HeaderComponent
        title="Tài khoản người dùng"
        description="Xem và quản lý trạng thái chặn/bỏ chặn tài khoản trong hệ thống"
      />

      <RenderTableManageUsers />

      {/* Dialog — mount ở đây để dùng chung store */}
      <BlockUserDialog />
    </div>
  );
};

export default ManageUsers;
