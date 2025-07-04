export interface BoosterPackResult {
  id: string;
  packType: 'common' | 'rare' | 'legendary';
  openedAt: string;
  items: {
    holobots?: string[];
    parts?: string[];
    tokens?: number;
    tickets?: number;
  };
} 