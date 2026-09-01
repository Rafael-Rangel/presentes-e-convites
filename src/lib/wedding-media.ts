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

export const HERO_PHOTO = "/wedding/hero-invite.webp";

/** Fotos do carrossel duplo do convite (ambas as faixas) */
export const CAROUSEL_PHOTOS = [
  "/wedding/carousel-01.webp",
  "/wedding/carousel-02.webp",
  "/wedding/carousel-03.webp",
  "/wedding/carousel-04.webp",
  "/wedding/carousel-05.webp",
  "/wedding/carousel-06.webp",
  "/wedding/carousel-07.webp",
  "/wedding/carousel-08.webp",
] as const;

/** Mesmas fotos nos dois carrosséis; ordem invertida na faixa B */
export const STORY_ROW_A = [...CAROUSEL_PHOTOS];
export const STORY_ROW_B = [...CAROUSEL_PHOTOS].reverse();

export const GALLERY_PHOTOS = [...CAROUSEL_PHOTOS];
export const STRIP_PHOTOS = [
  CAROUSEL_PHOTOS[0],
  CAROUSEL_PHOTOS[2],
  CAROUSEL_PHOTOS[4],
  CAROUSEL_PHOTOS[6],
];
