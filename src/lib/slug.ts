import slugify from "slugify";

export function createGuestSlug(name: string) {
  return slugify(name, {
    lower: true,
    strict: true,
    locale: "pt",
  });
}
