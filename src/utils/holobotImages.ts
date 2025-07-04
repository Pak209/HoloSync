// Utility function to get holobot images from Supabase storage
export const getHolobotImage = (holobotName: string) => {
  const holobotImages: Record<string, string> = {
    'ace': 'https://pfpidggrdnmfgrbncpyl.supabase.co/storage/v1/object/public/holobots//ace.png',
    'era': 'https://pfpidggrdnmfgrbncpyl.supabase.co/storage/v1/object/public/holobots//era.png',
    'gama': 'https://pfpidggrdnmfgrbncpyl.supabase.co/storage/v1/object/public/holobots//gama.png',
    'hare': 'https://pfpidggrdnmfgrbncpyl.supabase.co/storage/v1/object/public/holobots//hare.png',
    'ken': 'https://pfpidggrdnmfgrbncpyl.supabase.co/storage/v1/object/public/holobots//ken.png',
    'kuma': 'https://pfpidggrdnmfgrbncpyl.supabase.co/storage/v1/object/public/holobots//kuma.png',
    'kurai': 'https://pfpidggrdnmfgrbncpyl.supabase.co/storage/v1/object/public/holobots//kurai.png',
    'logoart': 'https://pfpidggrdnmfgrbncpyl.supabase.co/storage/v1/object/public/holobots//logoart.jpeg',
    'logo': 'https://pfpidggrdnmfgrbncpyl.supabase.co/storage/v1/object/public/holobots//logo.png',
    'shadow': 'https://pfpidggrdnmfgrbncpyl.supabase.co/storage/v1/object/public/holobots//shadow.png',
    'tora': 'https://pfpidggrdnmfgrbncpyl.supabase.co/storage/v1/object/public/holobots//tora.png',
    'tsuin': 'https://pfpidggrdnmfgrbncpyl.supabase.co/storage/v1/object/public/holobots//tsuin.png',
    'wake': 'https://pfpidggrdnmfgrbncpyl.supabase.co/storage/v1/object/public/holobots//wake.png',
    'wolf': 'https://pfpidggrdnmfgrbncpyl.supabase.co/storage/v1/object/public/holobots//wolf.png',
  };
  
  const normalizedName = holobotName.toLowerCase();
  return holobotImages[normalizedName] 
    ? { uri: holobotImages[normalizedName] }
    : require('../../assets/icon.png'); // Fallback for unknown holobots
};

// Get available holobot names
export const getAvailableHolobots = (): string[] => {
  return ['ace', 'era', 'gama', 'hare', 'ken', 'kuma', 'kurai', 'logoart', 'logo', 'shadow', 'tora', 'tsuin', 'wake', 'wolf'];
}; 