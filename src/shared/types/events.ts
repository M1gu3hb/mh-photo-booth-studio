/**
 * Payload the event form sends to create/update an event. `qrEnabled` is a
 * friendly boolean here; the service stores it as 0/1. Stored records come back
 * as `EventRecord` (see entities.ts).
 */
export interface EventInput {
  name: string;
  eventType: string;
  eventDate: string | null;
  clientReference: string | null;
  templateId: string | null;
  defaultPhotoCount: number;
  defaultCopies: number;
  qrEnabled: boolean;
  qrLink: string | null;
}
