/** Zone definitions for the PRIM8 3D isometric studio (world units). */

export interface Spot3D {
  x: number;
  z: number;
}

export interface RoomDef {
  labelKey: string;
  labelPos: Spot3D;
  entry: Spot3D;
  spots: Spot3D[];
}

export const ROOMS: Record<string, RoomDef> = {
  showroom: {
    labelKey: 'room.showroom',
    labelPos: { x: -6.5, z: -2 },
    entry: { x: -4.5, z: 0 },
    spots: [
      { x: -7, z: -4 },
      { x: -6.5, z: -1 },
      { x: -7, z: 1.5 },
      { x: -6, z: 3.5 },
      { x: -5.5, z: -3 },
      { x: -5.8, z: 2 },
    ],
  },
  manager: {
    labelKey: 'room.manager',
    labelPos: { x: 0, z: -5.5 },
    entry: { x: 0, z: -3.5 },
    spots: [
      { x: -2, z: -5 },
      { x: 0, z: -5 },
      { x: 2, z: -5 },
      { x: -1.5, z: -4 },
      { x: 1.5, z: -4 },
      { x: 0, z: -3.8 },
    ],
  },
  meeting: {
    labelKey: 'room.meeting',
    labelPos: { x: 5.5, z: -4.5 },
    entry: { x: 4, z: -3 },
    spots: [
      { x: 5, z: -5 },
      { x: 6.2, z: -4.5 },
      { x: 5.5, z: -3.5 },
      { x: 6.5, z: -3.2 },
      { x: 4.5, z: -4 },
      { x: 5.8, z: -5.5 },
    ],
  },
  workspace: {
    labelKey: 'room.workspace',
    labelPos: { x: 0, z: 0.5 },
    entry: { x: 0, z: 2 },
    spots: [
      { x: -1.6, z: -0.4 },
      { x: 1.6, z: -0.4 },
      { x: -1.6, z: 1.8 },
      { x: 1.6, z: 1.8 },
      { x: 0, z: 0.6 },
      { x: 2.4, z: 0.8 },
    ],
  },
  datacenter: {
    labelKey: 'room.datacenter',
    labelPos: { x: 5.5, z: 4.5 },
    entry: { x: 3.5, z: 3.5 },
    spots: [
      { x: 4.5, z: 4 },
      { x: 6, z: 4 },
      { x: 5, z: 5.2 },
      { x: 6.5, z: 5.5 },
      { x: 4, z: 5.5 },
      { x: 5.5, z: 3.5 },
    ],
  },
};

export const DESK_SPOTS: { x: number; z: number; room: string }[] = [
  { x: -1.6, z: 0.2, room: 'workspace' },
  { x: 1.6, z: 0.2, room: 'workspace' },
  { x: -1.6, z: 2.4, room: 'workspace' },
  { x: 1.6, z: 2.4, room: 'workspace' },
  { x: -2, z: -4.2, room: 'manager' },
  { x: 2, z: -4.2, room: 'manager' },
  { x: 4.5, z: 4.6, room: 'datacenter' },
  { x: 6, z: 4.6, room: 'datacenter' },
];

export const POIS: { id: string; x: number; z: number; action: string }[] = [
  { id: 'vending', x: 7, z: 3.2, action: 'drink' },
  { id: 'lounge', x: 5.5, z: -4.2, action: 'sit' },
  { id: 'kitchen_table', x: 5.2, z: 5, action: 'sit' },
  { id: 'creative_wall', x: -6.5, z: -2, action: 'look' },
  { id: 'studio_center', x: 0, z: 0.8, action: 'look' },
];

export const ROOM_SIZE = { width: 18, depth: 14, height: 4.2 };
export const FLOOR_Y = 0;
