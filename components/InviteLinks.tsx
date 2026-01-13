"use client";

import { X, Plus, Trash2, QrCode, Copy, Download } from "lucide-react";
import { useEffect, useState } from "react";
import { listInvitesAction, createInviteAction, deleteInviteAction } from "@/actions/auth";
import { showErrorToast, showSuccessToast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLoading } from "@/contexts/LoadingContext";
import { downloadPNG, toDataURL } from "@/lib/client/qr";

interface InviteItem { id: string; token: string; comment?: string; link: string; createdByName?: string; expiresAt?: number }

export default function InviteLinks({ open, onClose }: { open: boolean; onClose: () => void; }) {
  const [items, setItems] = useState<InviteItem[]>([]);
  const [comment, setComment] = useState("");
  const [days, setDays] = useState<number>(7);
  const [qrMap, setQrMap] = useState<Record<string, string>>({});
  const [qrPreviewId, setQrPreviewId] = useState<string | null>(null);
  const { showLoading, hideLoading } = useLoading();

  useEffect(() => {
    if (!open) return;
    (async () => {
      showLoading();
      try {
        const list = await listInvitesAction();
        setItems(list || []);
        // pre-render QR data URLs
        const map: Record<string, string> = {};
        await Promise.all((list || []).map(async (it: InviteItem) => {
          map[it.id] = await toDataURL(it.link, { width: 768, margin: 2 });
        }));
        setQrMap(map);
      } catch (e) {
        console.error(e);
        showErrorToast("Failed to load invites");
      } finally {
        hideLoading();
      }
    })();
  }, [open]);

  async function createInvite() {
    showLoading();
    try {
      const it = await createInviteAction(comment, days);
      const dataUrl = it.link ? await toDataURL(it.link, { width: 768, margin: 2 }) : "";
      setItems(prev => [it, ...prev]);
      setComment("");
      setDays(7);
      setQrMap(prev => ({ ...prev, [it.id]: dataUrl }));
      showSuccessToast("Invite created");
    } catch (e) {
      console.error(e);
      showErrorToast("Failed to create invite");
    } finally {
      hideLoading();
    }
  }

  async function removeInvite(id: string) {
    if (!confirm("Delete this invite?")) return;
    showLoading();
    try {
      await deleteInviteAction(id);
      setItems(prev => prev.filter(i => i.id !== id));
      showSuccessToast("Invite deleted");
    } catch (e) {
      console.error(e);
      showErrorToast("Failed to delete invite");
    } finally {
      hideLoading();
    }
  }

  function isExpired(token: string) {
    try {
      const base64 = token.split(".")[1];
      const json = JSON.parse(atob(base64));
      const expMs = (json?.exp || 0) * 1000;
      return expMs > 0 && expMs < Date.now();
    } catch (e) {
      return false;
    }
  }

  function formatExpiry(expiresAt?: number) {
    try {
      return new Date(expiresAt).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return new Date(expiresAt).toString();
    }
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    showSuccessToast("Copied to clipboard");
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl border border-pale-gray">
        <div className="flex items-center justify-between p-4 border-b border-pale-gray">
          <div className="flex items-center gap-2">
            <QrCode size={20} className="text-vivid-blue" />
            <h2 className="text-lg font-semibold">Invite Links / QR Codes</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 border-b border-pale-gray grid grid-cols-1 md:grid-cols-[1fr_160px_auto] gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Comment (internal)</label>
            <Input placeholder="Comment (e.g. cohort, event)" value={comment} onChange={(e) => setComment(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valid for (days)</label>
            <Input
              type="number"
              min={1}
              max={31}
              value={days}
              onChange={(e) => setDays(Math.min(Math.max(parseInt(e.target.value || "7", 10) || 7, 1), 31))}
              placeholder="Days"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={createInvite} className="md:w-40">
              <Plus size={16} className="mr-2" /> Create Invite
            </Button>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {items.length === 0 && (
            <div className="text-sm text-gray-600">No active invites.</div>
          )}
          {items.map(it => (
            <div key={it.id} className="border border-pale-gray rounded-xl p-3 flex flex-col md:flex-row gap-3 items-start md:items-center">
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-600">Comment</div>
                <div className="font-medium break-words">{it.comment || "—"}</div>
                <div className="text-sm text-gray-600 mt-2">Created by</div>
                <div className="text-sm font-medium">{it.createdByName || "—"}</div>
                <div className="mt-2 text-sm text-gray-600">Link</div>
                <div className="text-xs break-all">{it.link}</div>
              </div>
              <div className="flex flex-col gap-2 w-full md:w-auto">
                <div className="mt-1">
                  {isExpired(it.token) ? (
                    <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">Expired</span>
                  ) : (
                    <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Active</span>
                  )}
                </div>
                <div>
                  <div className=" text-sm text-gray-600">Expires</div>
                  <div className="text-sm font-medium">{formatExpiry(it.expiresAt)}</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => copy(it.link)}><Copy size={16} />Copy</Button>
                  <Button variant="outline" className="flex-1" onClick={() => setQrPreviewId(it.id)}><QrCode size={16} />QR</Button>
                </div>
                <div className="flex">
                  <Button variant="destructive" onClick={() => removeInvite(it.id)} className="w-full"><Trash2 size={16} className="mr-2" />Delete</Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {qrPreviewId && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl p-4 md:p-6 max-w-2xl w-full flex flex-col items-center">
              <div className="w-full flex items-center justify-center">
                <img
                  alt="Invite QR"
                  src={qrMap[qrPreviewId]}
                  className="w-full h-auto max-h-[75vh] object-contain"
                />
              </div>
              <div className="mt-4 flex gap-2">
                <Button onClick={() => downloadPNG(items.find(i => i.id === qrPreviewId)?.link || "", "discurso_invite.png", { width: 1024, margin: 2 })}>
                  <Download size={16}/> Download
                </Button>
                <Button variant="outline" onClick={() => setQrPreviewId(null)}>Close</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
