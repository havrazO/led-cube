// Cube widget: draws a 4x4x4 LED mask as inline SVG. Mask format: reference/data-format.md
// (16 hex digits, highest first; bit i = voxel i; i = 16z + 4y + x; x left->right, y front->back, z bottom->top).
function voxelsFromMask(hex16) {
  if (!/^[0-9a-fA-F]{16}$/.test(hex16)) throw new Error("mask must be 16 hex digits: " + hex16);
  const bits = BigInt("0x" + hex16);
  const lit = [];
  for (let i = 0; i < 64; i++) if ((bits >> BigInt(i)) & 1n) lit.push(i);
  return lit;
}

// Oblique view: x goes right, z goes up, y (depth) goes up-right at 0.3 pitch. Voxel 0 is nearest, bottom-left.
// Lit LEDs are filled cubes (drawn back to front, so nearer ones cover farther ones); unlit LEDs are small grey dots.
function cubeSvg(hex16, opts) {
  const size = (opts && opts.size) || 220;
  const color = (opts && opts.color) || "var(--accent, #1d4ed8)";
  const lit = new Set(voxelsFromMask(hex16));
  const step = size / 6.4, e = 0.62; // pitch in px, cube edge in pitch units
  const pt = (x, y, z) => `${(x * step + y * step * 0.3).toFixed(1)},${(size - 8 - z * step - y * step * 0.3).toFixed(1)}`;
  const face = (op, ...p) => `<polygon points="${p.map((q) => pt(...q)).join(" ")}" fill-opacity="${op}"/>`;
  let svg = "";
  for (let y = 3; y >= 0; y--) for (let z = 0; z < 4; z++) for (let x = 0; x < 4; x++) {
    const X = x + 0.2, Y = y + 0.2, Z = z + 0.2;
    if (!lit.has(16 * z + 4 * y + x)) {
      const [cx, cy] = pt(X + e / 2, Y + e / 2, Z + e / 2).split(",");
      svg += `<circle cx="${cx}" cy="${cy}" r="${(step * 0.07).toFixed(1)}" fill="#c3cad1" stroke="none"/>`;
      continue;
    }
    svg += "<g>" + face(1, [X, Y, Z], [X + e, Y, Z], [X + e, Y, Z + e], [X, Y, Z + e]) +
      face(0.7, [X, Y, Z + e], [X + e, Y, Z + e], [X + e, Y + e, Z + e], [X, Y + e, Z + e]) +
      face(0.5, [X + e, Y, Z], [X + e, Y + e, Z], [X + e, Y + e, Z + e], [X + e, Y, Z + e]) + "</g>";
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="${color}" stroke="${color}" stroke-width=".6" role="img" aria-label="LED cube, ${lit.size} of 64 LEDs on">${svg}</svg>`;
}

function renderCube(el, hex16, opts) {
  el.innerHTML = cubeSvg(hex16, opts);
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-mask]").forEach((el) => {
      try { renderCube(el, el.dataset.mask); } catch (err) { el.textContent = "(invalid mask)"; }
    });
  });
}
if (typeof module !== "undefined") module.exports = { voxelsFromMask, cubeSvg };
