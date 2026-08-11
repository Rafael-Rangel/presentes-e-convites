/** Fotos otimizadas em WebP (Drive do pedido de casamento) */
export const WEDDING_PHOTOS = [
  "/wedding/IMG_7636_VSCO.webp",
  "/wedding/IMG_7637_VSCO.webp",
  "/wedding/IMG_7638_VSCO.webp",
  "/wedding/IMG_7639_VSCO.webp",
  "/wedding/IMG_7641_VSCO.webp",
  "/wedding/IMG_7642_VSCO.webp",
  "/wedding/IMG_7644_VSCO.webp",
  "/wedding/IMG_7645_VSCO.webp",
  "/wedding/IMG_7646_VSCO.webp",
  "/wedding/IMG_7647_VSCO.webp",
  "/wedding/IMG_7648_VSCO.webp",
  "/wedding/IMG_7649_VSCO.webp",
  "/wedding/IMG_7650_VSCO.webp",
  "/wedding/IMG_7651_VSCO.webp",
  "/wedding/IMG_7652_VSCO.webp",
  "/wedding/IMG_7653_VSCO.webp",
  "/wedding/IMG_7654_VSCO.webp",
  "/wedding/IMG_7655_VSCO.webp",
  "/wedding/IMG_7656_VSCO.webp",
  "/wedding/IMG_7657_VSCO.webp",
  "/wedding/IMG_7658_VSCO.webp",
  "/wedding/IMG_7659_VSCO.webp",
  "/wedding/IMG_7660_VSCO.webp",
  "/wedding/IMG_7661_VSCO.webp",
  "/wedding/IMG_7662_VSCO.webp",
  "/wedding/IMG_7663_VSCO.webp",
  "/wedding/IMG_7668_VSCO.webp",
  "/wedding/IMG_7669_VSCO.webp",
  "/wedding/IMG_7670_VSCO.webp",
  "/wedding/IMG_7671_VSCO.webp",
  "/wedding/IMG_7672_VSCO.webp",
  "/wedding/IMG_7673_VSCO.webp",
  "/wedding/IMG_7675_VSCO.webp",
  "/wedding/IMG_7676_VSCO.webp",
  "/wedding/IMG_7677_VSCO.webp",
  "/wedding/IMG_7678_VSCO.webp",
  "/wedding/IMG_7679_VSCO.webp",
  "/wedding/IMG_7682_VSCO.webp",
  "/wedding/IMG_7683_VSCO.webp",
  "/wedding/IMG_7684_VSCO.webp",
  "/wedding/IMG_7685_VSCO.webp",
  "/wedding/IMG_7687_VSCO.webp",
  "/wedding/IMG_7688_VSCO.webp",
  "/wedding/8ca52091-f99d-4ec2-aca4-4a4dc6f96fdc.webp",
] as const;

export function toWebpPath(src: string) {
  return src.replace(/\.(jpe?g|png)$/i, ".webp");
}

export const HERO_PHOTO = WEDDING_PHOTOS[8]; // IMG_7646
export const STORY_ROW_A = WEDDING_PHOTOS.slice(0, 10);
export const STORY_ROW_B = WEDDING_PHOTOS.slice(10, 20);
export const GALLERY_PHOTOS = WEDDING_PHOTOS.slice(0, 12);
export const STRIP_PHOTOS = [
  WEDDING_PHOTOS[2],
  WEDDING_PHOTOS[5],
  WEDDING_PHOTOS[10],
  WEDDING_PHOTOS[15],
  WEDDING_PHOTOS[22],
  WEDDING_PHOTOS[28],
];
