'use client';

import { useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { REWARD_ICONS, iconFor, type RewardItem } from '@/lib/rewardIcons';

interface RewardEditorProps {
  label: string;
  value: RewardItem;
  onChange: (next: RewardItem) => void;
}

const MAX_SIDE = 600; // px — downscale longest side
const JPEG_QUALITY = 0.82;
const MAX_FINAL_BYTES = 350 * 1024;

async function fileToImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Could not load image'));
      img.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Resize a user-uploaded image down to max MAX_SIDE px on the longest side,
 * re-encode as JPEG, and return a data: URL. Keeps payloads small enough
 * to fit comfortably in a Prisma JSON column and a Vercel request body.
 */
async function resizeToDataUrl(file: File): Promise<string> {
  // For images the browser cannot decode (svg, gif), just return as-is.
  if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(r.error);
      r.readAsDataURL(file);
    });
  }
  const img = await fileToImage(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  // White background so JPEG-compressed PNGs with transparency don't go black.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
}

export default function RewardEditor({ label, value, onChange }: RewardEditorProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const Icon = iconFor(value.icon);

  const handleFile = async (file: File) => {
    try {
      const dataUrl = await resizeToDataUrl(file);
      // Safety check on the encoded data URL length (1 byte ~ 1.33 chars in base64)
      const approxBytes = dataUrl.length * 0.75;
      if (approxBytes > MAX_FINAL_BYTES * 2) {
        alert(`Image is still too large after compression (${Math.round(approxBytes / 1024)} KB). Try a smaller image.`);
        return;
      }
      onChange({ ...value, imageUrl: dataUrl });
    } catch (err: any) {
      alert(err?.message || 'Could not read image');
    }
  };

  return (
    <div className="border rounded-lg p-3">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold">{label}</p>
        {(value.name || value.imageUrl || value.icon) && (
          <button
            type="button"
            onClick={() => onChange({ name: '', imageUrl: null, icon: null, description: null })}
            className="text-xs text-gray-500 hover:text-red-600 inline-flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      <div className="grid grid-cols-[80px_1fr] gap-3 items-start">
        <div className="w-20 h-20 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50">
          {value.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value.imageUrl} alt={value.name} className="w-full h-full object-cover" />
          ) : (
            <Icon className="w-10 h-10 text-gray-400" />
          )}
        </div>
        <div className="space-y-2">
          <input
            type="text"
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
            placeholder="Reward name (e.g. iPhone 15, Royal Enfield 350)"
            className="input w-full text-sm"
          />
          <select
            value={value.icon || ''}
            onChange={(e) => onChange({ ...value, icon: e.target.value || null })}
            className="input w-full text-sm"
          >
            <option value="">— Pick an icon (fallback when no image) —</option>
            {REWARD_ICONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="btn btn-secondary text-xs inline-flex items-center"
            >
              <Upload className="w-3 h-3 mr-1" /> {value.imageUrl ? 'Replace image' : 'Upload image'}
            </button>
            {value.imageUrl && (
              <button
                type="button"
                onClick={() => onChange({ ...value, imageUrl: null })}
                className="text-xs text-gray-500 hover:text-red-600"
              >
                Remove image
              </button>
            )}
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = '';
              }}
            />
          </div>
        </div>
      </div>
      <textarea
        value={value.description || ''}
        onChange={(e) => onChange({ ...value, description: e.target.value })}
        placeholder="Optional short description (e.g. terms or model details)"
        className="input w-full text-xs mt-2"
        rows={2}
      />
    </div>
  );
}
