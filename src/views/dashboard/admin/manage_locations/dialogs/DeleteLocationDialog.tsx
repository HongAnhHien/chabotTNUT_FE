import { type FC } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useManageLocationsStore } from '../stores/location_store';

const DeleteLocationDialog: FC = () => {
  const { dialogMode, selected, isMutating, deleteLocation, closeDialog } = useManageLocationsStore();
  const open = dialogMode === 'delete';

  const handleDelete = async () => {
    if (!selected) return;
    const ok = await deleteLocation(selected._id);
    if (ok) closeDialog();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && closeDialog()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-red-700">Xóa địa điểm</DialogTitle>
              <DialogDescription className="mt-0.5">
                Hành động này không thể hoàn tác.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Bạn có chắc muốn xóa địa điểm{' '}
          <span className="font-semibold text-foreground">
            {selected?.ten_xa}, {selected?.ten_huyen}
          </span>
          ? Dữ liệu sẽ bị xóa vĩnh viễn.
        </p>

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

export default DeleteLocationDialog;
