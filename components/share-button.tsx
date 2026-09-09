'use client';

import { useState } from 'react';

/*
 * Web Share where it exists — on a phone that is the native sheet, which is
 * the whole point of sharing a plate. Everywhere else, copy the link and say
 * so, because a button that silently does nothing is worse than no button.
 */
export function ShareButton({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    // Resolve to an absolute URL: navigator.share and the clipboard both want
    // something a recipient can open, not a site-relative path.
    const absolute = new URL(url, window.location.origin).toString();

    if (navigator.share) {
      try {
        await navigator.share({ title, url: absolute });
        return;
      } catch {
        // Cancelled, or the sheet refused. Fall through to the clipboard.
      }
    }

    try {
      await navigator.clipboard.writeText(absolute);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className="tap border border-rule bg-surface px-3 py-2 text-sm text-ink hover:border-rule-strong"
    >
      {copied ? 'Link copied' : 'Share'}
    </button>
  );
}
