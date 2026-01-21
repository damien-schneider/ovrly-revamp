import { ElementType, type OverlayElement } from "@/features/canvas/types";

/**
 * Generate a self-contained HTML file for OBS browser source.
 * This creates an HTML document that renders the given elements
 * with all necessary styles and JavaScript inline.
 *
 * @param elements - Array of elements to render
 * @returns Complete HTML string
 */
export function generateOBSHtml(elements: OverlayElement[]): string {
  const elementsJson = JSON.stringify(elements);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ovrly Browser Source</title>
  <style>
    body { margin: 0; padding: 0; overflow: hidden; background: transparent; }
    #root { position: relative; width: 100vw; height: 100vh; overflow: hidden; }
    .element { position: absolute; box-sizing: border-box; }
    
    @keyframes slideIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
    .chat-msg { margin-bottom: 8px; padding: 4px 8px; animation: slideIn 0.3s ease-out; }
    .emote { position: absolute; animation: floatUp linear infinite; }
    @keyframes floatUp { from { transform: translateY(110vh); } to { transform: translateY(-10vh); } }
  </style>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Press+Start+2P&family=Roboto+Mono&display=swap" rel="stylesheet">
</head>
<body>
  <div id="root"></div>

  <script>
    const elements = ${elementsJson};
    const root = document.getElementById('root');

    function renderElements() {
      // Find the overlay (container) if it exists at (0,0)
      const overlay = elements.find(e => e.type === '${ElementType.OVERLAY}' && e.x === 0 && e.y === 0);
      
      if (overlay) {
          root.style.width = overlay.width + 'px';
          root.style.height = overlay.height + 'px';
          root.style.backgroundColor = overlay.backgroundColor;
      }

      elements.forEach(el => {
        if (!el.visible) return;
        if (el.type === '${ElementType.OVERLAY}' && el.x === 0 && el.y === 0) return; // Background root

        const div = document.createElement('div');
        div.className = 'element';
        div.style.left = el.x + 'px';
        div.style.top = el.y + 'px';
        div.style.width = el.width + 'px';
        div.style.height = el.height + 'px';
        div.style.opacity = el.opacity;
        div.style.zIndex = el.zIndex;
        div.style.transform = \`rotate(\${el.rotation}deg)\`;

        if (el.type === '${ElementType.BOX}') {
          div.style.backgroundColor = el.backgroundColor;
          div.style.borderColor = el.borderColor;
          div.style.borderWidth = el.borderWidth + 'px';
          div.style.borderStyle = 'solid';
          div.style.borderRadius = el.borderRadius + 'px';
        } else if (el.type === '${ElementType.TEXT}') {
          div.textContent = el.content;
          div.style.color = el.color;
          div.style.fontFamily = el.fontFamily;
          div.style.fontSize = el.fontSize + 'px';
          div.style.fontWeight = el.fontWeight;
          div.style.textAlign = el.textAlign;
          div.style.display = 'flex';
          div.style.alignItems = 'center';
          if (el.textAlign === 'center') div.style.justifyContent = 'center';
          if (el.textAlign === 'right') div.style.justifyContent = 'flex-end';
        } else if (el.type === '${ElementType.IMAGE}') {
          const img = document.createElement('img');
          img.src = el.src;
          img.style.width = '100%';
          img.style.height = '100%';
          img.style.objectFit = el.objectFit;
          div.appendChild(img);
        } else if (el.type === '${ElementType.WEBCAM}') {
            div.style.borderRadius = el.shape === 'circle' ? '50%' : el.borderRadius + 'px';
            div.style.border = \`\${el.borderWidth}px solid \${el.borderColor}\`;
            div.style.boxShadow = \`0 0 \${el.shadowBlur}px \${el.shadowColor}\`;
            div.style.backgroundColor = 'transparent'; 
        } else if (el.type === '${ElementType.TIMER}') {
            div.textContent = '10:00'; // Static mock
            div.style.fontFamily = el.fontFamily;
            div.style.fontSize = el.fontSize + 'px';
            div.style.color = el.color;
            div.style.fontWeight = 'bold';
            div.style.display = 'flex';
            div.style.alignItems = 'center';
            div.style.justifyContent = 'center';
        } else if (el.type === '${ElementType.PROGRESS}') {
            div.style.backgroundColor = el.backgroundColor;
            div.style.borderRadius = el.borderRadius + 'px';
            div.style.overflow = 'hidden';
            const bar = document.createElement('div');
            bar.style.width = el.progress + '%';
            bar.style.height = '100%';
            bar.style.backgroundColor = el.barColor;
            div.appendChild(bar);
        } else if (el.type === '${ElementType.CHAT}') {
           div.style.backgroundColor = el.style.backgroundColor;
           div.style.borderRadius = el.style.borderRadius + 'px';
           div.style.overflow = 'hidden';
           div.style.display = 'flex';
           div.style.flexDirection = 'column';
           div.style.justifyContent = 'flex-end';
           div.style.padding = '10px';
           const messages = [
             { user: 'StreamFan', text: 'This looks amazing!', color: '#ff5555' },
             { user: 'ModBot', text: 'Enjoy the stream.', color: '#55ff55' }
           ];
           messages.forEach(msg => {
             const msgDiv = document.createElement('div');
             msgDiv.className = 'chat-msg';
             msgDiv.style.fontFamily = el.style.fontFamily;
             msgDiv.style.fontSize = el.style.fontSize + 'px';
             msgDiv.style.color = el.style.textColor;
             const userSpan = document.createElement('span');
             userSpan.textContent = msg.user + ': ';
             userSpan.style.color = el.style.usernameColor || msg.color;
             userSpan.style.fontWeight = 'bold';
             msgDiv.appendChild(userSpan);
             msgDiv.appendChild(document.createTextNode(msg.text));
             div.appendChild(msgDiv);
           });
        }

        root.appendChild(div);
      });
    }

    renderElements();
  </script>
</body>
</html>
  `;
}

/**
 * Download the generated HTML as a file.
 *
 * @param elements - Elements to export
 * @param filename - Name of the downloaded file
 */
export function downloadOBSHtml(
  elements: OverlayElement[],
  filename = "overlay.html"
): void {
  const html = generateOBSHtml(elements);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Generate a data URI that can be used directly in OBS browser source.
 *
 * @param elements - Elements to export
 * @returns Base64-encoded data URI string
 */
export function generateOBSDataUri(elements: OverlayElement[]): string {
  const html = generateOBSHtml(elements);
  const base64 = btoa(unescape(encodeURIComponent(html)));
  return `data:text/html;base64,${base64}`;
}
