import { type FC, useEffect, useState } from 'react';
import {
  KeyRound, ShieldCheck, Trash2, Loader2, Eye, EyeOff,
  CheckCircle2, XCircle, Activity, Copy, Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import HeaderComponent from '@/components/common/header_table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import AdminApi from '@/infra/admin/admin_api';
import type { IApiKeySetting, IApiKeyUsage } from '@/infra/api/interfaces/IApiKey';

const fmtDt = (iso: string) =>
  new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));

const fmtDtShort = (iso?: string | null) => {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
};

const AdminApiKeyPage: FC = () => {
  const [setting, setSetting] = useState<IApiKeySetting | null | undefined>(undefined); // undefined = loading
  const [editing, setEditing] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [labelInput, setLabelInput]   = useState('');
  const [notesInput, setNotesInput]   = useState('');
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [usage, setUsage] = useState<IApiKeyUsage | null>(null);
  const [checkingUsage, setCheckingUsage] = useState(false);

  const [revealOpen, setRevealOpen] = useState(false);
  const [revealPwd, setRevealPwd]   = useState('');
  const [revealing, setRevealing]   = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadKey = () => {
    setSetting(undefined);
    AdminApi.getLlamaParseKey()
      .then(res => setSetting(res?.data ?? null))
      .catch(() => { setSetting(null); toast.error('Không thể tải thông tin API key.'); });
  };

  useEffect(loadKey, []);

  const startEdit = () => {
    setApiKeyInput('');
    setLabelInput(setting?.label ?? '');
    setNotesInput(setting?.notes ?? '');
    setEditing(true);
  };

  const cancelEdit = () => setEditing(false);

  const handleSave = async () => {
    if (!apiKeyInput.trim()) { toast.error('Vui lòng nhập API key.'); return; }
    setSaving(true);
    try {
      const res = await AdminApi.upsertLlamaParseKey({
        api_key: apiKeyInput.trim(),
        label: labelInput.trim() || undefined,
        notes: notesInput.trim() || undefined,
      });
      setSetting(res.data);
      setEditing(false);
      setUsage(null);
      toast.success('Đã lưu API key.');
    } catch {
      toast.error('Lưu API key thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await AdminApi.deleteLlamaParseKey();
      setSetting(null);
      setUsage(null);
      setDeleteOpen(false);
      toast.success('Đã xóa API key.');
    } catch {
      toast.error('Xóa API key thất bại.');
    } finally {
      setDeleting(false);
    }
  };

  const handleCheckUsage = async () => {
    setCheckingUsage(true);
    setUsage(null);
    try {
      const res = await AdminApi.checkLlamaParseUsage();
      setUsage(res.data);
    } catch {
      toast.error('API key không hợp lệ hoặc hết hạn.');
    } finally {
      setCheckingUsage(false);
    }
  };

  const openReveal = () => { setRevealPwd(''); setRevealedKey(null); setRevealOpen(true); };
  const closeReveal = () => { setRevealOpen(false); setRevealedKey(null); setRevealPwd(''); };

  const handleReveal = async () => {
    if (!revealPwd.trim()) { toast.error('Vui lòng nhập mật khẩu để xác thực.'); return; }
    setRevealing(true);
    try {
      const res = await AdminApi.revealLlamaParseKey({ password: revealPwd });
      setRevealedKey(res.data.api_key);
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Xác thực thất bại.');
    } finally {
      setRevealing(false);
    }
  };

  const copyRevealed = async () => {
    if (!revealedKey) return;
    await navigator.clipboard.writeText(revealedKey).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="max-w-2xl">
      <HeaderComponent title="API key LlamaParse" description="Chỉ tồn tại 1 key duy nhất — dùng để parse tài liệu (PDF/Word)" />

      {setting === undefined ? (
        <div className="rounded-xl border border-border bg-card p-10 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#2F6B3F]" />
        </div>
      ) : editing ? (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="space-y-1.5">
            <Label>API key {setting ? '(nhập key mới để thay thế)' : ''} *</Label>
            <Input value={apiKeyInput} onChange={e => setApiKeyInput(e.target.value)} placeholder="llx-xxxxxxxxxxxxxxxxxxxx" autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label>Tên ghi chú</Label>
            <Input value={labelInput} onChange={e => setLabelInput(e.target.value)} placeholder="Production key" />
          </div>
          <div className="space-y-1.5">
            <Label>Ghi chú thêm</Label>
            <Input value={notesInput} onChange={e => setNotesInput(e.target.value)} placeholder="Tùy chọn" />
          </div>
          <div className="flex gap-2 pt-1">
            <Button onClick={handleSave} disabled={saving} className="gap-2 text-white" style={{ background: 'linear-gradient(135deg, #2F6B3F, #3d7a50)' }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Lưu
            </Button>
            <Button variant="outline" onClick={cancelEdit} disabled={saving}>Hủy</Button>
          </div>
        </div>
      ) : setting ? (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-base font-bold text-foreground">{setting.label || 'Không tên'}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Cập nhật lần cuối: {fmtDt(setting.updated_at)}</p>
            </div>
            <Badge variant="outline" className={setting.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-muted text-muted-foreground'}>
              {setting.is_active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
              {setting.is_active ? 'Đang hoạt động' : 'Tạm tắt'}
            </Badge>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-3.5 py-2.5 mb-3">
            <ShieldCheck className="w-4 h-4 text-muted-foreground shrink-0" />
            <code className="text-sm text-foreground tracking-wide">{setting.api_key}</code>
            <Button variant="outline" size="sm" onClick={openReveal} className="ml-auto gap-1.5">
              <Eye className="w-3.5 h-3.5" /> Hiện key
            </Button>
          </div>

          {setting.notes && <p className="text-sm text-muted-foreground mb-4">{setting.notes}</p>}

          <div className="flex flex-wrap gap-2">
            <Button onClick={startEdit} className="gap-2 text-white" style={{ background: 'linear-gradient(135deg, #2F6B3F, #3d7a50)' }}>
              <KeyRound className="w-4 h-4" /> Thay key
            </Button>
            <Button variant="outline" onClick={handleCheckUsage} disabled={checkingUsage} className="gap-2">
              {checkingUsage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
              Kiểm tra usage
            </Button>
            <Button variant="destructive" onClick={() => setDeleteOpen(true)} disabled={deleting} className="gap-2">
              <Trash2 className="w-4 h-4" /> Xóa
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800">
            <XCircle className="w-4 h-4 shrink-0" /> Chưa cấu hình API key LlamaParse. Chức năng parse tài liệu sẽ không hoạt động.
          </div>
          <div className="space-y-1.5">
            <Label>API key *</Label>
            <Input value={apiKeyInput} onChange={e => setApiKeyInput(e.target.value)} placeholder="llx-xxxxxxxxxxxxxxxxxxxx" />
          </div>
          <div className="space-y-1.5">
            <Label>Tên ghi chú</Label>
            <Input value={labelInput} onChange={e => setLabelInput(e.target.value)} placeholder="Production key" />
          </div>
          <div className="space-y-1.5">
            <Label>Ghi chú thêm</Label>
            <Input value={notesInput} onChange={e => setNotesInput(e.target.value)} placeholder="Tùy chọn" />
          </div>
          <Button onClick={handleSave} disabled={saving} className="gap-2 text-white" style={{ background: 'linear-gradient(135deg, #2F6B3F, #3d7a50)' }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Lưu key
          </Button>
        </div>
      )}

      {/* ── Usage result ──────────────────────────────── */}
      {usage && (
        <div className="rounded-xl border border-border bg-card p-5 mt-4">
          <div className="flex items-center gap-3 flex-wrap mb-4">
            <Badge variant="outline" className={usage.is_valid ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}>
              {usage.is_valid ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
              {usage.is_valid ? 'Key hợp lệ' : 'Key không hợp lệ'}
            </Badge>
            <span className="text-sm font-semibold text-foreground">{usage.key_label}</span>
            <code className="text-xs text-muted-foreground">{usage.key_masked}</code>
          </div>

          <div className="flex flex-wrap gap-6 mb-4">
            <div>
              <p className="text-xl font-bold text-foreground tabular-nums">{usage.total_jobs}</p>
              <p className="text-xs font-medium text-muted-foreground">Tổng jobs</p>
            </div>
            {Object.entries(usage.by_status).map(([st, n]) => (
              <div key={st}>
                <p className="text-xl font-bold text-foreground tabular-nums">{n}</p>
                <p className="text-xs font-medium text-muted-foreground">{st}</p>
              </div>
            ))}
          </div>

          {usage.recent_jobs.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {['File', 'Trạng thái', 'Tier', 'Ngày tạo'].map(h => (
                      <th key={h} className="text-left py-2 px-2 text-xs font-medium text-muted-foreground uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {usage.recent_jobs.map(j => (
                    <tr key={j.id} className="border-b border-border last:border-0">
                      <td className="py-2 px-2 text-foreground">{j.name}</td>
                      <td className={`py-2 px-2 ${j.error ? 'text-red-600' : 'text-foreground'}`}>{j.status}</td>
                      <td className="py-2 px-2 text-muted-foreground">{j.tier}</td>
                      <td className="py-2 px-2 text-muted-foreground">{fmtDtShort(j.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Delete confirm dialog ─────────────────────── */}
      <Dialog open={deleteOpen} onOpenChange={(v) => !v && setDeleteOpen(false)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-700 flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Xóa API key
            </DialogTitle>
            <DialogDescription>
              Chức năng parse tài liệu sẽ ngừng hoạt động cho đến khi cấu hình key mới. Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>Hủy</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting} className="gap-2">
              {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
              {deleting ? 'Đang xóa...' : 'Xóa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reveal key dialog ─────────────────────────── */}
      <Dialog open={revealOpen} onOpenChange={(v) => !v && closeReveal()}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><EyeOff className="w-5 h-5" /> Hiện API key thật</DialogTitle>
            {!revealedKey && <DialogDescription>Nhập lại mật khẩu tài khoản admin để xác thực trước khi hiện key thật.</DialogDescription>}
          </DialogHeader>

          {!revealedKey ? (
            <>
              <div className="space-y-1.5">
                <Label>Mật khẩu admin</Label>
                <Input
                  type="password" value={revealPwd} onChange={e => setRevealPwd(e.target.value)}
                  placeholder="Mật khẩu admin" autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') handleReveal(); }}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={closeReveal} disabled={revealing}>Hủy</Button>
                <Button onClick={handleReveal} disabled={revealing} className="gap-2 text-white" style={{ background: 'linear-gradient(135deg, #2F6B3F, #3d7a50)' }}>
                  {revealing ? <Loader2 className="w-4 h-4 animate-spin" /> : <EyeOff className="w-4 h-4" />}
                  Xác thực & hiện key
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3.5 py-2.5">
                <code className="text-sm text-foreground break-all flex-1">{revealedKey}</code>
                <button onClick={copyRevealed} title="Sao chép" className={`shrink-0 ${copied ? 'text-emerald-600' : 'text-muted-foreground hover:text-foreground'}`}>
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={closeReveal}>Đóng</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminApiKeyPage;
