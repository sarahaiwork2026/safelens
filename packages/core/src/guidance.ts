import type { IncidentType } from './schema';
export const GUIDANCE: Record<IncidentType, string> = {
  suspicious:
    'Keep a safe distance, do not approach, and note details from a safe place.',
  theft:
    'Do not confront anyone. Note details from a safe distance and call Police 15.',
  snatching: 'Do not chase. Move to a busy, well-lit place and call Police 15.',
  robbery:
    'Keep away from the spot, do not confront anyone, and call Police 15 when safe.',
  harassment:
    'Move to a public, well-lit place and contact a trusted person or Police 15.',
  assault:
    'Move to a secure place and avoid the area. Call Police 15 when safe.',
  firing:
    'Take cover, stay away from windows, and avoid the area. Call Police 15 when safe.',
  kidnapping:
    'Do not intervene alone. Note vehicle details if safe and call Police 15.',
  fire: 'Leave the building, stay low under smoke, and call Fire Brigade 16.',
  accident:
    'Slow down and avoid the road. Call Rescue 1122 or Edhi 115 if someone is hurt.',
  hazard:
    'Keep away and avoid flames or switches near a leak. Call Rescue 1122.',
  unclear:
    'Stay alert and contact official emergency services if you are in danger.',
};
