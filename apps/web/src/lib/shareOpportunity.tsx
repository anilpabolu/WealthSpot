import { toBlob } from 'html-to-image';
import { createRoot } from 'react-dom/client';
import { SharePostcard } from '@/components/share/SharePostcard';


export interface ShareData {
  title: string;
  targetIRR?: string;
  tenure?: string;
  minEntry?: string;
  coverImage?: string;
  city?: string;
  slug: string;
  referralCode?: string;
}

export async function shareOpportunityDynamic(data: ShareData): Promise<void> {
  // Enforce production domain for the QR code if generating from local dev, 
  // so the QR code remains scannable globally by mobile devices.
  const baseUrl = window.location.hostname === 'localhost' ? 'https://wealthspot.in' : window.location.origin;
  const url = `${baseUrl}/opportunity/${data.slug}${data.referralCode ? `?ref=${data.referralCode}` : ''}`;
  const text = `Discover this exclusive ${data.title} on WealthSpot.\n\nExplore the opportunity here: ${url}\nFor more details, contact us at 632909773`;

  try {
    // 1. Create a detached DOM node
    const container = document.createElement('div');
    // Hide it far off screen so it doesn't affect layout
    container.style.position = 'fixed';
    container.style.top = '-9999px';
    container.style.left = '-9999px';
    document.body.appendChild(container);

    // 2. Render the postcard into the node
    const root = createRoot(container);
    
    await new Promise<void>((resolve) => {
      root.render(
        <SharePostcard
          title={data.title}
          targetIRR={data.targetIRR}
          tenure={data.tenure}
          minEntry={data.minEntry}
          coverImage={data.coverImage}
          city={data.city}
          url={url}
        />
      );
      // Double rAF keeps execution within the browser's frame pipeline,
      // which is less likely to expire the user-gesture token than setTimeout.
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

    // 3. Find the exact DOM element to snapshot
    const element = container.firstElementChild as HTMLElement;
    if (!element) throw new Error("Failed to render postcard");

    // 4. Generate the image blob
    // skipFonts prevents html-to-image from reading document.styleSheets, which throws
    // a SecurityError for cross-origin stylesheets (e.g. Google Fonts).
    const blob = await toBlob(element, {
      cacheBust: true,
      pixelRatio: 1, // 1200x630 is perfectly sized
      skipFonts: true,
      style: {
        transform: 'scale(1)',
        transformOrigin: 'top left',
      }
    });

    // Clean up DOM immediately
    root.unmount();
    document.body.removeChild(container);

    if (!blob) throw new Error("Failed to generate image blob");

    // 5. Share logic
    const file = new File([blob], `wealthspot-${data.slug}.png`, { type: 'image/png' });
    
    // Windows Desktop often drops the 'text' field if a 'file' is included when handing off to WhatsApp.
    // To ensure the user doesn't lose the marketing text and link, we automatically copy it to their clipboard first.
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      console.warn("Failed to copy text to clipboard beforehand", e);
    }

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ title: data.title, text, files: [file] });
      } catch (shareErr: any) {
        if (shareErr?.name === 'AbortError') return; // user cancelled
        throw shareErr; // re-throw so outer catch handles it
      }
    } else {
      // Desktop Fallback: Download the image and copy the text
      try {
        await navigator.clipboard.writeText(text);
      } catch (err) {
        console.warn("Clipboard access denied, text not copied");
      }
      
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `wealthspot-${data.slug}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
      
      alert("Postcard image downloaded to your computer!\n\nThe message/link has been copied to your clipboard. You can now paste them directly into WhatsApp or LinkedIn.");
    }
  } catch (error: any) {
    // User cancelled the share sheet — not an error, exit silently.
    if (error?.name === 'AbortError') return;

    console.warn("Share postcard failed, falling back to clipboard:", error?.message ?? error);

    // Do NOT retry navigator.share() here — the user gesture has already expired
    // and calling it again will always throw NotAllowedError.
    try {
      await navigator.clipboard.writeText(text);
      alert("Link copied to clipboard!");
    } catch {
      alert(`Share link: ${url}`);
    }
  }
}
