import { type FC } from 'react';
import { Plus } from 'lucide-react';
import HeaderComponent from '@/components/common/header_table';
import { Button } from '@/components/ui/button';
import RenderTableManageUsers from './table/RenderTable';
import { CreateUserDialog, EditUserDialog } from './dialogs/UserFormDialog';
import DeleteUserDialog from './dialogs/DeleteUserDialog';
import { useManageUsersStore } from './stores/user_store';

const ManageUsers: FC = () => {
  const { openDialog } = useManageUsersStore();

  return (
    <div>
      <HeaderComponent
        title="Tài khoản người dùng"
        description="Quản lý toàn bộ tài khoản của hệ thống"
        actions={
          <Button
            size="lg"
            className="gap-1.5 text-white"
            style={{ background: 'linear-gradient(135deg, #2F6B3F, #3d7a50)' }}
            onClick={() => openDialog('create')}
          >
            <Plus className="h-4 w-4" />
            Thêm tài khoản
          </Button>
        }
      />

      <RenderTableManageUsers />

      {/* Dialogs — mount ở đây để dùng chung store */}
      <CreateUserDialog />
      <EditUserDialog />
      <DeleteUserDialog />
    </div>
  );
};

export default ManageUsers;
