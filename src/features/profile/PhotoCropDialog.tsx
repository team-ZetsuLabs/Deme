import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { Dialog } from '../../components/Dialog';
import { clampOffset, coverScale, sourceRect } from './cropMath';
import styles from './PhotoCropDialog.module.css';

/** Côté du viewport de recadrage, en pixels (tient à 360 px de large). */
const VIEWPORT = 288;
/** Côté de l'image exportée, en pixels. */
const OUTPUT = 512;
const ZOOM_MIN = 1;
const ZOOM_MAX = 3;

export type PhotoCropDialogProps = {
  /** Image choisie à recadrer. */
  file: File;
  /** Envoi en cours (après validation du cadrage). */
  busy: boolean;
  onCancel: () => void;
  /** Reçoit la photo recadrée carrée (JPEG), prête à envoyer. */
  onConfirm: (cropped: File) => void;
};

/**
 * Recadrage carré de la photo de profil (SET-1) : on glisse pour déplacer, le curseur pour
 * zoomer, puis on rend un carré via canvas. Aucune bibliothèque (cahier : pas de dépendance CDN).
 */
export function PhotoCropDialog({ file, busy, onCancel, onConfirm }: PhotoCropDialogProps) {
  const { t } = useTranslation();
  const imgRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const [url, setUrl] = useState('');
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const next = URL.createObjectURL(file);
    setUrl(next);
    setNat(null);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    return () => URL.revokeObjectURL(next);
  }, [file]);

  const scaleFor = (n: { w: number; h: number }, z: number) => coverScale(VIEWPORT, n.w, n.h) * z;

  const onImgLoad = () => {
    const el = imgRef.current;
    if (!el) return;
    const n = { w: el.naturalWidth, h: el.naturalHeight };
    const scale = scaleFor(n, 1);
    // Image centrée dans le viewport au départ.
    setNat(n);
    setOffset({ x: (VIEWPORT - n.w * scale) / 2, y: (VIEWPORT - n.h * scale) / 2 });
  };

  const onZoom = (nextZoom: number) => {
    if (!nat) return;
    const oldScale = scaleFor(nat, zoom);
    const newScale = scaleFor(nat, nextZoom);
    // On garde le point au centre du viewport fixe pendant le zoom.
    const cx = (VIEWPORT / 2 - offset.x) / oldScale;
    const cy = (VIEWPORT / 2 - offset.y) / oldScale;
    const x = VIEWPORT / 2 - cx * newScale;
    const y = VIEWPORT / 2 - cy * newScale;
    setZoom(nextZoom);
    setOffset(clampOffset(VIEWPORT, nat.w * newScale, nat.h * newScale, x, y));
  };

  const onPointerDown = (e: ReactPointerEvent) => {
    dragRef.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    if (!dragRef.current || !nat) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    dragRef.current = { x: e.clientX, y: e.clientY };
    const scale = scaleFor(nat, zoom);
    setOffset((prev) =>
      clampOffset(VIEWPORT, nat.w * scale, nat.h * scale, prev.x + dx, prev.y + dy),
    );
  };
  const onPointerUp = () => {
    dragRef.current = null;
  };

  const handleConfirm = () => {
    const el = imgRef.current;
    if (!nat || !el) return;
    const scale = scaleFor(nat, zoom);
    const { sx, sy, size } = sourceRect(VIEWPORT, scale, offset.x, offset.y);
    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(el, sx, sy, size, size, 0, 0, OUTPUT, OUTPUT);
    canvas.toBlob(
      (blob) => {
        if (blob) onConfirm(new File([blob], 'avatar.jpg', { type: 'image/jpeg' }));
      },
      'image/jpeg',
      0.9,
    );
  };

  const scale = nat ? scaleFor(nat, zoom) : 1;

  return (
    <Dialog open title={t('settings.photo.crop.title')} onClose={onCancel}>
      <div
        className={styles.viewport}
        style={{ width: VIEWPORT, height: VIEWPORT }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <img
          ref={imgRef}
          src={url}
          alt=""
          draggable={false}
          onLoad={onImgLoad}
          className={styles.image}
          style={
            nat
              ? { width: nat.w * scale, height: nat.h * scale, left: offset.x, top: offset.y }
              : { visibility: 'hidden' }
          }
        />
        <div className={styles.mask} aria-hidden="true" />
      </div>

      <label className={styles.zoomRow}>
        <span className={styles.zoomLabel}>{t('settings.photo.crop.zoom')}</span>
        <input
          type="range"
          min={ZOOM_MIN}
          max={ZOOM_MAX}
          step={0.01}
          value={zoom}
          onChange={(e) => onZoom(Number(e.target.value))}
          aria-label={t('settings.photo.crop.zoom')}
        />
      </label>

      <p className={styles.hint}>{t('settings.photo.crop.hint')}</p>

      <div className={styles.actions}>
        <Button variant="ghost" onClick={onCancel} disabled={busy}>
          {t('settings.cancel')}
        </Button>
        <Button variant="primary" busy={busy} onClick={handleConfirm}>
          {t('settings.photo.crop.confirm')}
        </Button>
      </div>
    </Dialog>
  );
}
