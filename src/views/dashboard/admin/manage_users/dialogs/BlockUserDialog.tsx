import { type FC, useState } from 'react';
import { Loader2, Ban } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useManageUsersStore } from '../stores/user_store';

const BlockUserDialog: FC = () => {
  const { dialogMode, selected, isMutating, blockUser, closeDialog } = useManageUsersStore();
  const open = dialogMode === 'block';
  const [reason, setReason] = useState('');

  const handleClose = () => { setReason(''); closeDialog(); };

  const handleBlock = async () => {
    if (!selected) return;
    const ok = await blockUser(selected._id, reason.trim() ? { reason: reason.trim() } : undefined);
    if (ok) handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-red-700 flex items-center gap-2">
            <Ban className="w-5 h-5" />
            Chặn tài khoản
          </DialogTitle>
          <DialogDescription>
            Tài khoản <span className="font-semibold text-foreground">@{selected?.username}</span> sẽ không thể đăng nhập vào hệ thống cho đến khi được bỏ chặn.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label>Lý do (tùy chọn)</Label>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Vd: Vi phạm nội quy sử dụng" autoFocus />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isMutating}>Hủy</Button>
          <Button
            variant="destructive"
            onClick={handleBlock}
            disabled={isMutating}
            className="gap-2"
          >
            {isMutating && <Loader2 className="w-4 h-4 animate-spin" />}
            {isMutating ? 'Đang chặn...' : 'Chặn tài khoản'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BlockUserDialog;
