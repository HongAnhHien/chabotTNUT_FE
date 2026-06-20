import { type FC } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useManageUsersStore } from '../stores/user_store';

const DeleteUserDialog: FC = () => {
  const { dialogMode, selected, isMutating, deleteUser, closeDialog } = useManageUsersStore();
  const open = dialogMode === 'delete';

  const handleDelete = async () => {
    if (!selected) return;
    const ok = await deleteUser(selected._id);
    if (ok) closeDialog();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && closeDialog()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-red-700 flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            Xóa tài khoản
          </DialogTitle>
        </DialogHeader>

        <div className="py-2 space-y-1">
          <p className="text-sm text-stone-700">
            Bạn chắc chắn muốn xóa tài khoản{' '}
            <span className="font-semibold text-stone-900">@{selected?.username}</span>?
          </p>
          <p className="text-xs text-muted-foreground">Hành động này không thể hoàn tác.</p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={closeDialog} disabled={isMutating}>Hủy</Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isMutating}
            className="gap-2"
          >
            {isMutating && <Loader2 className="w-4 h-4 animate-spin" />}
            {isMutating ? 'Đang xóa...' : 'Xóa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteUserDialog;
