export interface HolobotEquipment {
  head?: string;
  body?: string;
  arms?: string;
  legs?: string;
}

export interface HolobotPart {
  id: string;
  name: string;
  type: 'head' | 'body' | 'arms' | 'legs';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  attributes: {
    attack?: number;
    defense?: number;
    speed?: number;
    health?: number;
  };
  description?: string;
} 