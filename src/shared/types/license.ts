/**
 * Local, NON-BLOCKING license info (SECURITY_AND_LICENSE.md). Purely
 * informational — it never gates the app or an event in progress.
 */
export interface LicenseStatus {
  installationName: string;
  activatedAt: string;
  edition: string;
  blocking: false;
}
