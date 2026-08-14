export const NOTCHES = [
  // 0: En Tepe (Sadece Kırmızı Vizör, Metin Yok)
  { id: 0, label: "", group: null },
  
  // 1: Tepe Sağ
  { id: 1, label: "NO", group: null },
  
  // 2, 3, 4: Sağ Grup (TIME FOR)
  { id: 2, label: "HUGS", group: "TIME FOR" },
  { id: 3, label: "TEA?", group: "TIME FOR" },
  { id: 4, label: "DINNER", group: "TIME FOR" },
  
  // 5, 6, 7: Alt Kısım
  { id: 5, label: "LATER", group: null },
  { id: 6, label: "COME HERE", group: null },
  { id: 7, label: "5 MINS", group: null },
  
  // 8, 9, 10: Sol Grup (RICH IS)
  { id: 8, label: "ON AIR", group: "RICH IS" },
  { id: 9, label: "BUSY", group: "RICH IS" },
  { id: 10, label: "FAFFING", group: "RICH IS" },
  
  // 11: Tepe Sol
  { id: 11, label: "YES", group: null }
];

export const TOTAL_NOTCHES = NOTCHES.length; // 12
export const STEP_ANGLE = (2 * Math.PI) / TOTAL_NOTCHES; // 30 Derece

export const PHYSICS_CONFIG = {
  SPRING_STIFFNESS: 0.09,
  DAMPING: 0.72
};