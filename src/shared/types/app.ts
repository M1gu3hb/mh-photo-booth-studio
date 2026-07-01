/** Runtime information about the running application (Acerca de / footer). */
export interface AppInfo {
  productName: string;
  version: string;
  electronVersion: string;
  chromeVersion: string;
  nodeVersion: string;
  platform: NodeJS.Platform;
  environment: 'development' | 'production';
}
