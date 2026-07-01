/** Web-gallery integration contracts (software ↔ mh-photo-booth-web). */

export interface WebConfig {
  /** Public site URL, e.g. https://website-flame-rho-35.vercel.app */
  siteUrl: string;
  /** API key sent as x-api-key when creating events / uploading. */
  apiKey: string;
}

export interface WebConnectionStatus {
  configured: boolean;
  reachable: boolean;
  siteUrl: string;
  message: string;
}

/** Result of publishing one media item to the web. */
export interface WebPublishResult {
  uploadId: string;
  folio: string;
  pageUrl: string;
  mediaUrl: string;
  /** QR (data URL) pointing at pageUrl — ready to show/scan. */
  qrDataUrl: string;
}

export interface EventFolioResult {
  eventFolio: string;
  pageUrl: string;
  qrDataUrl: string;
}
