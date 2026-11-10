// Imagens ilustrativas (Unsplash). Caso não carreguem, o componente <Photo> exibe uma arte de fallback.
const u = (id: string, w = 900) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=75`;

export const IMG = {
  hero: u("photo-1560066984-138dadb4c035", 1600),
  about1: u("photo-1521590832167-7bcbfaa6381f", 1000),
  about2: u("photo-1522337360788-8b13dee7a37e", 800),
  auth: u("photo-1562322140-8baeececf3df", 1200),
  corteFeminino: u("photo-1562322140-8baeececf3df"),
  corteMasculino: u("photo-1503951914875-452162b0f3f1"),
  corteUnissex: u("photo-1522337360788-8b13dee7a37e"),
  manicure: u("photo-1604654894610-df63bc536371"),
  pedicure: u("photo-1519014816548-bf5fe059798b"),
  hidratacao: u("photo-1560869713-7d0a29430803"),
  pro1: u("photo-1494790108377-be9c29b29330", 400),
  pro2: u("photo-1507003211169-0a1dd7228f2d", 400),
  pro3: u("photo-1438761681033-6461ffad8d80", 400),
  pro4: u("photo-1534528741775-53994a69daeb", 400),
  pro5: u("photo-1500648767791-00dcc994a43e", 400),
};
