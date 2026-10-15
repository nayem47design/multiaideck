// Saves the demo picture as a PNG: the placeholder's gradient (its computed CSS colours, so the
// file matches the screen) and its caption, drawn on a canvas. Returns false if the browser
// can't draw it.

const SIZE = 1024;

export function downloadPicture(el: HTMLElement, name: string) {
  const style = getComputedStyle(el);
  const colours = style.backgroundImage.match(/(rgba?|oklch|color)\([^)]*\)/g);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx || !colours?.length) return false;

  // 135deg: top-left to bottom-right, as on screen.
  const gradient = ctx.createLinearGradient(0, 0, SIZE, SIZE);
  colours.forEach((c, i) =>
    gradient.addColorStop(i / Math.max(1, colours.length - 1), c),
  );
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, SIZE, SIZE);

  const caption = el.querySelector("span");
  if (caption?.textContent) {
    const text = getComputedStyle(caption);
    const scale = SIZE / el.clientWidth;
    ctx.fillStyle = text.color;
    ctx.font = `${text.fontWeight} ${parseFloat(text.fontSize) * scale}px ${text.fontFamily}`;
    ctx.textBaseline = "bottom";
    const pad = parseFloat(style.paddingLeft) * scale;
    ctx.fillText(
      caption.textContent,
      pad,
      SIZE - parseFloat(style.paddingBottom) * scale,
    );
  }

  const link = document.createElement("a");
  link.download = `${
    name
      .trim()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .toLowerCase() || "picture"
  }.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
  return true;
}
