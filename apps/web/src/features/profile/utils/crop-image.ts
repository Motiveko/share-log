import type { Area } from "react-easy-crop";

const OUTPUT_SIZE = 256;
const OUTPUT_QUALITY = 0.9;

/**
 * 이미지를 주어진 영역으로 크롭하고 Blob으로 반환합니다.
 * @param imageSrc - 크롭할 이미지의 src URL
 * @param pixelCrop - 크롭 영역 (픽셀 단위)
 * @returns 크롭된 이미지의 Blob
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas context를 가져올 수 없습니다.");
  }

  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("이미지 변환에 실패했습니다."));
        }
      },
      "image/jpeg",
      OUTPUT_QUALITY
    );
  });
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.crossOrigin = "anonymous";
    image.src = url;
  });
}
