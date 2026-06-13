'use strict';

const REGION = {
  BAC: 'bac',
  NAM: 'nam',
  TRUNG: 'trung',
};

const REGION_ALIASES = {
  bac: REGION.BAC,
  mb: REGION.BAC,
  xsmb: REGION.BAC,
  mienbac: REGION.BAC,
  mien_bac: REGION.BAC,
  nam: REGION.NAM,
  mn: REGION.NAM,
  xsmn: REGION.NAM,
  miennam: REGION.NAM,
  mien_nam: REGION.NAM,
  trung: REGION.TRUNG,
  mt: REGION.TRUNG,
  mtr: REGION.TRUNG,
  xsmt: REGION.TRUNG,
  mientrung: REGION.TRUNG,
  mien_trung: REGION.TRUNG,
};

const HESOXAC_BAC = {
  Lo: 800,
  '3Cang': 700,
  '4Cang': 700,
  DauDuoi: 800,
  Dau: 800,
  Duoi: 800,
  DauDuoi3C: 700,
  Dau3C: 700,
  Duoi3C: 700,
  Xien2: 700,
  Xien3: 700,
  Xien4: 700,
};

const TYLE_BAC = {
  Lo: 80000,
  '3Cang': 600000,
  '4Cang': 4500000,
  DauDuoi: 80000,
  Dau: 80000,
  Duoi: 80000,
  DauDuoi3C: 550000,
  Dau3C: 550000,
  Duoi3C: 550000,
  Xien2: 10000,
  Xien3: 40000,
  Xien4: 80000,
};

const HESOXAC_NAM_TRUNG = {
  Lo: 700,
  Dau: 700,
  Duoi: 700,
  DauDuoi: 700,
  XiuChu: 700,
  XiuChuDau: 700,
  XiuChuDuoi: 700,
  '3Cang': 700,
  '4Cang': 700,
};

const TYLE_NAM_TRUNG = {
  Lo: 70000,
  Dau: 70000,
  Duoi: 70000,
  DauDuoi: 70000,
  XiuChu: 550000,
  XiuChuDau: 550000,
  XiuChuDuoi: 550000,
  '3Cang': 600000,
  '4Cang': 4500000,
};

const GIAI_BAC = [
  { name: 'Đặc Biệt', count: 1, ndigits: 5, key: 'db' },
  { name: 'Giải Nhất', count: 1, ndigits: 5, key: 'g1' },
  { name: 'Giải Nhì', count: 2, ndigits: 5, key: 'g2' },
  { name: 'Giải Ba', count: 6, ndigits: 5, key: 'g3' },
  { name: 'Giải Tư', count: 4, ndigits: 4, key: 'g4' },
  { name: 'Giải Năm', count: 6, ndigits: 4, key: 'g5' },
  { name: 'Giải Sáu', count: 3, ndigits: 3, key: 'g6' },
  { name: 'Giải Bảy', count: 4, ndigits: 2, key: 'g7' },
];

const GIAI_NAM_TRUNG = [
  { name: 'Đặc Biệt', count: 1, ndigits: 6, key: 'db' },
  { name: 'Giải Nhất', count: 1, ndigits: 5, key: 'g1' },
  { name: 'Giải Nhì', count: 1, ndigits: 5, key: 'g2' },
  { name: 'Giải Ba', count: 2, ndigits: 5, key: 'g3' },
  { name: 'Giải Tư', count: 7, ndigits: 5, key: 'g4' },
  { name: 'Giải Năm', count: 1, ndigits: 4, key: 'g5' },
  { name: 'Giải Sáu', count: 3, ndigits: 4, key: 'g6' },
  { name: 'Giải Bảy', count: 1, ndigits: 3, key: 'g7' },
  { name: 'Giải Tám', count: 1, ndigits: 2, key: 'g8' },
];

const DAI_NAM = [
  'TP.HCM',
  'Đồng Tháp',
  'Cà Mau',
  'Bến Tre',
  'Vũng Tàu',
  'Bạc Liêu',
  'Đồng Nai',
  'Cần Thơ',
  'Sóc Trăng',
  'Tây Ninh',
  'An Giang',
  'Bình Thuận',
  'Vĩnh Long',
  'Bình Dương',
  'Trà Vinh',
  'Long An',
  'Bình Phước',
  'Hậu Giang',
  'Tiền Giang',
  'Kiên Giang',
  'Đà Lạt',
];

const DAI_TRUNG = [
  'TT.Huế',
  'Phú Yên',
  'Đắk Lắk',
  'Quảng Nam',
  'Đà Nẵng',
  'Khánh Hòa',
  'Bình Định',
  'Quảng Trị',
  'Quảng Bình',
  'Gia Lai',
  'Ninh Thuận',
  'Quảng Ngãi',
  'Đắk Nông',
  'Kon Tum',
];

const DAI_ALIAS_NAM = {
  tp: 'TP.HCM',
  tphcm: 'TP.HCM',
  tpho: 'TP.HCM',
  'tp hcm': 'TP.HCM',
  'tp.hcm': 'TP.HCM',
  hcm: 'TP.HCM',
  hcmc: 'TP.HCM',
  sggp: 'TP.HCM',
  baotp: 'TP.HCM',
  'bao tp': 'TP.HCM',
  thanhpho: 'TP.HCM',
  'thanh pho': 'TP.HCM',
  saigon: 'TP.HCM',
  'sai gon': 'TP.HCM',
  sg: 'TP.HCM',
  sgon: 'TP.HCM',
  dt: 'Đồng Tháp',
  dth: 'Đồng Tháp',
  dongthap: 'Đồng Tháp',
  'dong thap': 'Đồng Tháp',
  dthap: 'Đồng Tháp',
  thap: 'Đồng Tháp',
  cm: 'Cà Mau',
  camau: 'Cà Mau',
  'ca mau': 'Cà Mau',
  cmau: 'Cà Mau',
  bt: 'Bến Tre',
  bentre: 'Bến Tre',
  'ben tre': 'Bến Tre',
  btr: 'Bến Tre',
  btre: 'Bến Tre',
  vt: 'Vũng Tàu',
  vungtau: 'Vũng Tàu',
  'vung tau': 'Vũng Tàu',
  brvt: 'Vũng Tàu',
  vtau: 'Vũng Tàu',
  baclieu: 'Bạc Liêu',
  'bac lieu': 'Bạc Liêu',
  baclieu1: 'Bạc Liêu',
  'b lieu': 'Bạc Liêu',
  blieu: 'Bạc Liêu',
  bli: 'Bạc Liêu',
  dn: 'Đồng Nai',
  dongnai: 'Đồng Nai',
  'dong nai': 'Đồng Nai',
  dnai: 'Đồng Nai',
  ct: 'Cần Thơ',
  cantho: 'Cần Thơ',
  'can tho': 'Cần Thơ',
  ctho: 'Cần Thơ',
  cth: 'Cần Thơ',
  st: 'Sóc Trăng',
  str: 'Sóc Trăng',
  soctrang: 'Sóc Trăng',
  'soc trang': 'Sóc Trăng',
  strang: 'Sóc Trăng',
  stg: 'Sóc Trăng',
  tn: 'Tây Ninh',
  tayninh: 'Tây Ninh',
  'tay ninh': 'Tây Ninh',
  tninh: 'Tây Ninh',
  ag: 'An Giang',
  angiang: 'An Giang',
  'an giang': 'An Giang',
  agiang: 'An Giang',
  bth: 'Bình Thuận',
  binhthuan: 'Bình Thuận',
  'binh thuan': 'Bình Thuận',
  bthuan: 'Bình Thuận',
  bthu: 'Bình Thuận',
  vl: 'Vĩnh Long',
  vinhlong: 'Vĩnh Long',
  'vinh long': 'Vĩnh Long',
  vlong: 'Vĩnh Long',
  bd: 'Bình Dương',
  binhduong: 'Bình Dương',
  'binh duong': 'Bình Dương',
  bduong: 'Bình Dương',
  sb: 'Bình Dương',
  sbe: 'Bình Dương',
  tv: 'Trà Vinh',
  travinh: 'Trà Vinh',
  'tra vinh': 'Trà Vinh',
  tvinh: 'Trà Vinh',
  la: 'Long An',
  longan: 'Long An',
  'long an': 'Long An',
  lan: 'Long An',
  bp: 'Bình Phước',
  binhphuoc: 'Bình Phước',
  'binh phuoc': 'Bình Phước',
  bphuoc: 'Bình Phước',
  bph: 'Bình Phước',
  hg: 'Hậu Giang',
  haugiang: 'Hậu Giang',
  'hau giang': 'Hậu Giang',
  hgiang: 'Hậu Giang',
  tg: 'Tiền Giang',
  tiengiang: 'Tiền Giang',
  'tien giang': 'Tiền Giang',
  tgiang: 'Tiền Giang',
  tgo: 'Tiền Giang',
  kg: 'Kiên Giang',
  kiengiang: 'Kiên Giang',
  'kien giang': 'Kiên Giang',
  kgiang: 'Kiên Giang',
  dl: 'Đà Lạt',
  dalat: 'Đà Lạt',
  'da lat': 'Đà Lạt',
  lamdong: 'Đà Lạt',
  'lam dong': 'Đà Lạt',
  ld: 'Đà Lạt',
  ldong: 'Đà Lạt',
};

const DAI_ALIAS_TRUNG = {
  hue: 'TT.Huế',
  tthue: 'TT.Huế',
  tthu: 'TT.Huế',
  thuathienhue: 'TT.Huế',
  'thua thien hue': 'TT.Huế',
  thuathien: 'TT.Huế',
  th: 'TT.Huế',
  hu: 'TT.Huế',
  py: 'Phú Yên',
  phuyen: 'Phú Yên',
  'phu yen': 'Phú Yên',
  pyen: 'Phú Yên',
  phu: 'Phú Yên',
  dlk: 'Đắk Lắk',
  dl: 'Đắk Lắk',
  daklak: 'Đắk Lắk',
  'dak lak': 'Đắk Lắk',
  daclac: 'Đắk Lắk',
  'dac lac': 'Đắk Lắk',
  daclack: 'Đắk Lắk',
  'dac lack': 'Đắk Lắk',
  dklak: 'Đắk Lắk',
  dak: 'Đắk Lắk',
  daclac: 'Đắk Lắk',
  dlac: 'Đắk Lắk',
  qna: 'Quảng Nam',
  qnam: 'Quảng Nam',
  quangnam: 'Quảng Nam',
  'quang nam': 'Quảng Nam',
  qn: 'Quảng Nam',
  dn: 'Đà Nẵng',
  danang: 'Đà Nẵng',
  'da nang': 'Đà Nẵng',
  dna: 'Đà Nẵng',
  dng: 'Đà Nẵng',
  dnang: 'Đà Nẵng',
  kh: 'Khánh Hòa',
  khanhhoa: 'Khánh Hòa',
  'khanh hoa': 'Khánh Hòa',
  khoa: 'Khánh Hòa',
  nhatrang: 'Khánh Hòa',
  nt: 'Khánh Hòa',
  bdi: 'Bình Định',
  bd: 'Bình Định',
  binhdinh: 'Bình Định',
  'binh dinh': 'Bình Định',
  bdinh: 'Bình Định',
  qt: 'Quảng Trị',
  quangtri: 'Quảng Trị',
  'quang tri': 'Quảng Trị',
  qtri: 'Quảng Trị',
  qb: 'Quảng Bình',
  quangbinh: 'Quảng Bình',
  'quang binh': 'Quảng Bình',
  qbinh: 'Quảng Bình',
  gl: 'Gia Lai',
  gialai: 'Gia Lai',
  'gia lai': 'Gia Lai',
  glai: 'Gia Lai',
  gla: 'Gia Lai',
  nth: 'Ninh Thuận',
  ninht: 'Ninh Thuận',
  ninhthuan: 'Ninh Thuận',
  'ninh thuan': 'Ninh Thuận',
  nthuan: 'Ninh Thuận',
  qng: 'Quảng Ngãi',
  quangngai: 'Quảng Ngãi',
  'quang ngai': 'Quảng Ngãi',
  qngai: 'Quảng Ngãi',
  dno: 'Đắk Nông',
  daknong: 'Đắk Nông',
  'dak nong': 'Đắk Nông',
  dacnong: 'Đắk Nông',
  'dac nong': 'Đắk Nông',
  dakn: 'Đắk Nông',
  dacn: 'Đắk Nông',
  dknong: 'Đắk Nông',
  dnong: 'Đắk Nông',
  kt: 'Kon Tum',
  kontum: 'Kon Tum',
  'kon tum': 'Kon Tum',
  ktum: 'Kon Tum',
  ktu: 'Kon Tum',
};

const DAI_ALIAS_BAC = {
  mb: 'Miền Bắc',
  bac: 'Miền Bắc',
  mienbac: 'Miền Bắc',
  'mien bac': 'Miền Bắc',
};

addDaiAliases(DAI_ALIAS_BAC, {
  'Miền Bắc': ['mbac', 'xsmb', 'bacbo', 'bac bo', 'hn', 'hanoi', 'ha noi', 'thudo', 'thu do'],
});

addDaiAliases(DAI_ALIAS_NAM, {
  'TP.HCM': ['tph', 'tphochiminh', 'tp ho chi minh', 'ho chi minh', 'hochiminh', 'hcmcity', 'tp sg', 'tpsg', 'sai g', 'saigoncity'],
  'Đồng Tháp': ['dthp', 'dongth', 'dong t', 'd thap', 'dtap', 'dongth'],
  'Cà Mau': ['cma', 'c mau', 'cam', 'camau1'],
  'Bến Tre': ['bte', 'b tre', 'bentre1', 'ben t'],
  'Vũng Tàu': ['vtu', 'vta', 'v tau', 'br vt', 'baria', 'ba ria', 'bariavungtau', 'ba ria vung tau'],
  'Bạc Liêu': ['bcl', 'bacl', 'bac l', 'b lieu', 'blieu1', 'baclieu2'],
  'Đồng Nai': ['dnai1', 'd nai', 'dong n', 'dongn', 'nai'],
  'Cần Thơ': ['cnt', 'c tho', 'can t', 'canth', 'ctho1'],
  'Sóc Trăng': ['sct', 'sctr', 'soc tr', 's trang', 'soctr', 'soc t'],
  'Tây Ninh': ['tni', 't ninh', 'tay n', 'tayn'],
  'An Giang': ['agi', 'a giang', 'an g', 'ang'],
  'Bình Thuận': ['bthn', 'b thuan', 'binh th', 'binhth', 'bthuan1'],
  'Vĩnh Long': ['vlg', 'v long', 'vinh l', 'vinhl'],
  'Bình Dương': ['bdu', 'bdg', 'b duong', 'binh d', 'sobe', 'songbe', 'song be'],
  'Trà Vinh': ['trv', 'trvinh', 't vinh', 'tra v'],
  'Long An': ['loga', 'l an', 'long a', 'longa'],
  'Bình Phước': ['bphc', 'bpoc', 'b phuoc', 'binh p', 'binhp'],
  'Hậu Giang': ['hgi', 'h giang', 'hau g', 'haug'],
  'Tiền Giang': ['tgi', 't giang', 'tien g', 'tieng'],
  'Kiên Giang': ['kgi', 'k giang', 'kien g', 'kieng'],
  'Đà Lạt': ['dlat', 'dal', 'd lat', 'l dong', 'ldg', 'lamd'],
});

addDaiAliases(DAI_ALIAS_TRUNG, {
  'TT.Huế': ['tth', 'tt hue', 't hue', 'thua thien', 'thua thien h', 'tth'],
  'Phú Yên': ['pye', 'p yen', 'phu y', 'phuy'],
  'Đắk Lắk': ['dkl', 'd lak', 'dak l', 'daklac', 'dak lac', 'dacl', 'd lac'],
  'Quảng Nam': ['qnm', 'q nam', 'quang n', 'qnam1'],
  'Đà Nẵng': ['dana', 'd nang', 'da n', 'dan'],
  'Khánh Hòa': ['khh', 'k h', 'k hoa', 'khanh h', 'nha trang'],
  'Bình Định': ['bdi1', 'b dinh', 'binh d', 'binhd'],
  'Quảng Trị': ['qtr', 'q tri', 'quang t', 'quangt'],
  'Quảng Bình': ['qbi', 'q binh', 'quang b', 'quangb'],
  'Gia Lai': ['g lai', 'gia l', 'gla1'],
  'Ninh Thuận': ['nthn', 'n thuan', 'ninh th', 'ninhth'],
  'Quảng Ngãi': ['qnga', 'q ngai', 'quang ng', 'quangn'],
  'Đắk Nông': ['dkn', 'd nong', 'dak n', 'dakno', 'dacno'],
  'Kon Tum': ['ktm', 'k tum', 'kon t', 'kont'],
});

const DAI_PHRASE_ALIAS_BAC = {
  'mien bac': 'mienbac',
  'bac bo': 'bacbo',
  'ha noi': 'hanoi',
  'thu do': 'thudo',
};

const DAI_PHRASE_ALIAS_NAM = {
  'tp ho chi minh': 'tphochiminh',
  'ho chi minh': 'hochiminh',
  'tp sg': 'tpsg',
  'sai g': 'saigon',
  'd thap': 'dthap',
  'dong t': 'dongthap',
  'c mau': 'camau',
  'b tre': 'bentre',
  'v tau': 'vungtau',
  'br vt': 'brvt',
  'ba ria': 'baria',
  'ba ria vung tau': 'bariavungtau',
  'bac l': 'baclieu',
  'b lieu': 'blieu',
  'd nai': 'dongnai',
  'dong n': 'dongnai',
  'c tho': 'cantho',
  'can t': 'cantho',
  's trang': 'soctrang',
  'soc tr': 'soctrang',
  'soc t': 'soctrang',
  't ninh': 'tayninh',
  'tay n': 'tayninh',
  'a giang': 'angiang',
  'an g': 'angiang',
  'b thuan': 'binhthuan',
  'binh th': 'binhthuan',
  'v long': 'vinhlong',
  'vinh l': 'vinhlong',
  'b duong': 'binhduong',
  'binh d': 'binhduong',
  'song be': 'songbe',
  't vinh': 'travinh',
  'tra v': 'travinh',
  'l an': 'longan',
  'long a': 'longan',
  'b phuoc': 'binhphuoc',
  'binh p': 'binhphuoc',
  'h giang': 'haugiang',
  'hau g': 'haugiang',
  't giang': 'tiengiang',
  'tien g': 'tiengiang',
  'k giang': 'kiengiang',
  'kien g': 'kiengiang',
  'd lat': 'dalat',
  'l dong': 'lamdong',
};

const DAI_PHRASE_ALIAS_TRUNG = {
  'tt hue': 'hue',
  't hue': 'hue',
  'thua thien': 'hue',
  'p yen': 'phuyen',
  'phu y': 'phuyen',
  'd lak': 'daklak',
  'dak l': 'daklak',
  'dak lac': 'daklac',
  'd lac': 'daclac',
  'q nam': 'quangnam',
  'quang n': 'quangnam',
  'd nang': 'danang',
  'da n': 'danang',
  'k h': 'khanhhoa',
  'k hoa': 'khanhhoa',
  'khanh h': 'khanhhoa',
  'nha trang': 'nhatrang',
  'b dinh': 'binhdinh',
  'binh d': 'binhdinh',
  'q tri': 'quangtri',
  'quang t': 'quangtri',
  'q binh': 'quangbinh',
  'quang b': 'quangbinh',
  'g lai': 'gialai',
  'gia l': 'gialai',
  'n thuan': 'ninhthuan',
  'ninh th': 'ninhthuan',
  'q ngai': 'quangngai',
  'quang ng': 'quangngai',
  'd nong': 'daknong',
  'dak n': 'daknong',
  'k tum': 'kontum',
  'kon t': 'kontum',
};

function addDaiAliases(target, groups) {
  for (const [dai, aliases] of Object.entries(groups)) {
    for (const alias of aliases) {
      const normalized = normalizeVN(alias).trim();
      const compact = compactKey(alias);
      for (const key of [normalized, compact]) {
        if (key && !target[key]) target[key] = dai;
      }
    }
  }
}

const SCHEDULE_NAM = {
  2: ['TP.HCM', 'Đồng Tháp', 'Cà Mau'],
  3: ['Bến Tre', 'Vũng Tàu', 'Bạc Liêu'],
  4: ['Đồng Nai', 'Cần Thơ', 'Sóc Trăng'],
  5: ['Tây Ninh', 'An Giang', 'Bình Thuận'],
  6: ['Vĩnh Long', 'Bình Dương', 'Trà Vinh'],
  7: ['TP.HCM', 'Long An', 'Bình Phước', 'Hậu Giang'],
  CN: ['Tiền Giang', 'Kiên Giang', 'Đà Lạt'],
};

const MAIN_DAI_NAM = {
  2: 'tphcm',
  3: 'vungtau',
  4: 'dongnai',
  5: 'tayninh',
  6: 'binhduong',
  7: 'tphcm',
  CN: 'tiengiang',
};

const SCHEDULE_TRUNG = {
  2: ['TT.Huế', 'Phú Yên'],
  3: ['Đắk Lắk', 'Quảng Nam'],
  4: ['Đà Nẵng', 'Khánh Hòa'],
  5: ['Bình Định', 'Quảng Trị', 'Quảng Bình'],
  6: ['Gia Lai', 'Ninh Thuận'],
  7: ['Đà Nẵng', 'Quảng Ngãi', 'Đắk Nông'],
  CN: ['Khánh Hòa', 'Kon Tum', 'TT.Huế'],
};

const CONFIGS = {
  [REGION.BAC]: {
    region: REGION.BAC,
    name: 'Miền Bắc',
    daiList: ['Miền Bắc'],
    daiAlias: DAI_ALIAS_BAC,
    schedule: { MB: ['Miền Bắc'] },
    defaultActiveDai: ['Miền Bắc'],
    prizeRows: GIAI_BAC,
    heSoXacDefault: HESOXAC_BAC,
    tyLeDefault: TYLE_BAC,
    minLens: [5, 5, 5, 5, 4, 4, 3, 2],
    giaiKeys: ['db', 'g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7'],
    giaiLabels: ['ĐB', 'G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
  },
  [REGION.NAM]: {
    region: REGION.NAM,
    name: 'Miền Nam',
    daiList: DAI_NAM,
    daiAlias: DAI_ALIAS_NAM,
    schedule: SCHEDULE_NAM,
    defaultActiveDai: SCHEDULE_NAM[2],
    prizeRows: GIAI_NAM_TRUNG,
    heSoXacDefault: HESOXAC_NAM_TRUNG,
    tyLeDefault: TYLE_NAM_TRUNG,
    minLens: [6, 5, 5, 5, 5, 4, 4, 3, 2],
    giaiKeys: ['db', 'g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7', 'g8'],
    giaiLabels: ['ĐB', 'G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8'],
  },
  [REGION.TRUNG]: {
    region: REGION.TRUNG,
    name: 'Miền Trung',
    daiList: DAI_TRUNG,
    daiAlias: DAI_ALIAS_TRUNG,
    schedule: SCHEDULE_TRUNG,
    defaultActiveDai: SCHEDULE_TRUNG[2],
    prizeRows: GIAI_NAM_TRUNG,
    heSoXacDefault: HESOXAC_NAM_TRUNG,
    tyLeDefault: TYLE_NAM_TRUNG,
    minLens: [6, 5, 5, 5, 5, 4, 4, 3, 2],
    giaiKeys: ['db', 'g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7', 'g8'],
    giaiLabels: ['ĐB', 'G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8'],
  },
};

const RATE_GROUPS = {
  '2c': ['Lo', 'Dau', 'Duoi', 'DauDuoi'],
  '2': ['Lo', 'Dau', 'Duoi', 'DauDuoi'],
  lo: ['Lo'],
  bl: ['Lo'],
  b: ['Lo'],
  dd: ['DauDuoi'],
  dauduoi: ['DauDuoi'],
  dau: ['Dau'],
  duoi: ['Duoi'],
  '3c': ['3Cang', 'XiuChu', 'XiuChuDau', 'XiuChuDuoi', 'Dau3C', 'Duoi3C', 'DauDuoi3C'],
  '3': ['3Cang', 'XiuChu', 'XiuChuDau', 'XiuChuDuoi', 'Dau3C', 'Duoi3C', 'DauDuoi3C'],
  '4c': ['4Cang'],
  '4': ['4Cang'],
  xc: ['XiuChu', 'XiuChuDau', 'XiuChuDuoi', 'Dau3C', 'Duoi3C', 'DauDuoi3C'],
  xiuchu: ['XiuChu', 'XiuChuDau', 'XiuChuDuoi'],
  xdau: ['XiuChuDau', 'Dau3C'],
  xdui: ['XiuChuDuoi', 'Duoi3C'],
  xduoi: ['XiuChuDuoi', 'Duoi3C'],
  xien2: ['Xien2'],
  xien3: ['Xien3'],
  xien4: ['Xien4'],
};

const TYPE_LABELS = {
  Lo: 'Bao lô',
  '3Cang': '3 càng',
  '4Cang': '4 càng',
  Dau: 'Đầu',
  Duoi: 'Đuôi',
  DauDuoi: 'Đầu đuôi',
  XiuChu: 'Xỉu chủ',
  XiuChuDau: 'XC đầu',
  XiuChuDuoi: 'XC đuôi',
  DauDuoi3C: 'Đầu đuôi 3C',
  Dau3C: 'Đầu 3C',
  Duoi3C: 'Đuôi 3C',
  Xien2: 'Xiên 2',
  Xien3: 'Xiên 3',
  Xien4: 'Xiên 4',
};

const LLM_TICKET_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    player: {
      type: ['object', 'null'],
      additionalProperties: false,
      properties: {
        name: { type: ['string', 'null'] },
        rate_text: { type: ['string', 'null'] },
      },
      required: ['name', 'rate_text'],
    },
    region: { type: ['string', 'null'], enum: ['bac', 'nam', 'trung', null] },
    tickets: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          numbers: { type: 'array', items: { type: 'string' } },
          type: { type: 'string' },
          points: { type: 'number' },
          dais: { type: 'array', items: { type: 'string' } },
          rate_text: { type: ['string', 'null'] },
          source_text: { type: ['string', 'null'] },
        },
        required: ['numbers', 'type', 'points', 'dais', 'rate_text', 'source_text'],
      },
    },
    warnings: { type: 'array', items: { type: 'string' } },
  },
  required: ['player', 'region', 'tickets', 'warnings'],
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeVN(input) {
  const s = String(input || '');
  const map = {
    à: 'a', á: 'a', ả: 'a', ã: 'a', ạ: 'a', ă: 'a', ắ: 'a', ặ: 'a',ằ: 'a', ẵ: 'a', ẳ: 'a',
    â: 'a', ấ: 'a', ậ: 'a', ầ: 'a', ẩ: 'a', ẫ: 'a',
    è: 'e', é: 'e', ẻ: 'e', ẽ: 'e', ẹ: 'e', ê: 'e', ế: 'e', ệ: 'e',ề: 'e', ể: 'e', ễ: 'e',
    ì: 'i', í: 'i', ỉ: 'i', ĩ: 'i', ị: 'i',
    ò: 'o', ó: 'o', ỏ: 'o', õ: 'o', ọ: 'o', ô: 'o', ố: 'o', ộ: 'o',ồ: 'o', ổ: 'o',ỗ: 'o',
    ơ: 'o', ớ: 'o', ợ: 'o', ờ: 'o', ở: 'o',ỡ: 'o',
    ù: 'u', ú: 'u', ủ: 'u',ũ: 'u', ụ: 'u', ư: 'u',ứ: 'u',ự: 'u',ừ: 'u',ử: 'u',ữ: 'u',
   ỳ: 'y', ý: 'y',ỷ: 'y',ỹ: 'y',ỵ: 'y',
    đ: 'd',
  };
  return s
    .toLowerCase()
    .replace(/[àáảãạăắặằẵẳâấậầẩẫèéẻẽẹêếệềểễìíỉĩịòóỏõọôốộồổỗơớợờởỡùúủũụưứựừửữỳýỷỹỵđ]/g, ch => map[ch] || ch);
}

function compactKey(value) {
  return normalizeVN(value).replace(/[_\s.\-]+/g, '');
}

function canonicalRegion(region) {
  if (!region) return REGION.NAM;
  const key = compactKey(region);
  return REGION_ALIASES[key] || REGION_ALIASES[normalizeVN(region)] || REGION.NAM;
}

function getConfig(region) {
  return CONFIGS[canonicalRegion(region)];
}

function getScheduleKey(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const day = d.getDay();
  if (day === 0) return 'CN';
  return String(day + 1);
}

function getActiveDai(region, date = new Date()) {
  const cfg = getConfig(region);
  if (cfg.region === REGION.BAC) return [...cfg.defaultActiveDai];
  const key = getScheduleKey(date);
  return [...(cfg.schedule[key] || cfg.defaultActiveDai)];
}

function getMainDai(region, date = new Date(), activeDai) {
  const cfg = getConfig(region);
  const active = activeDai && activeDai.length ? activeDai : getActiveDai(region, date);
  if (cfg.region === REGION.TRUNG) return null;
  if (cfg.region === REGION.NAM) {
    const main = detectDai(MAIN_DAI_NAM[getScheduleKey(date)], region);
    const canonicalActive = normalizeDaiList(active, region, cfg.defaultActiveDai);
    if (main && canonicalActive.includes(main)) return main;
  }
  return active[0] || cfg.defaultActiveDai[0] || null;
}

function getDefaultBetDai(region, date = new Date(), activeDai) {
  const cfg = getConfig(region);
  const active = activeDai && activeDai.length ? [...activeDai] : getActiveDai(region, date);
  if (cfg.region === REGION.NAM) {
    const main = getMainDai(region, date, active);
    return main ? [main] : [];
  }
  return active;
}

function defaultRates(region) {
  const cfg = getConfig(region);
  return {
    heSoXac: clone(cfg.heSoXacDefault),
    tyLe: clone(cfg.tyLeDefault),
  };
}

function sharedRateRegionKeys(region) {
  return canonicalRegion(region) === REGION.BAC ? [REGION.BAC] : [REGION.NAM, REGION.TRUNG];
}

function cloneRateBucket(bucket) {
  return {
    heSoXac: clone(bucket && bucket.heSoXac ? bucket.heSoXac : {}),
    tyLe: clone(bucket && (bucket.tyLe || bucket.tiLe) ? (bucket.tyLe || bucket.tiLe) : {}),
  };
}

function withScopedRateProfile(rates, region) {
  const byRegion = {};
  for (const key of sharedRateRegionKeys(region)) {
    byRegion[key] = cloneRateBucket(rates);
  }
  return { ...rates, byRegion };
}

function rateProfilePartsForRegion(profile, region) {
  if (!profile) return [];
  const key = canonicalRegion(region);
  const root = profile.rates && typeof profile.rates === 'object' ? profile.rates : profile;
  const byRegion = profile.byRegion || profile.ratesByRegion || root.byRegion || root.ratesByRegion;
  if (byRegion) {
    const sharedKey = key === REGION.TRUNG ? REGION.NAM : key === REGION.NAM ? REGION.TRUNG : null;
    const regionPart = byRegion[key] || (sharedKey ? byRegion[sharedKey] : null);
    return regionPart ? [regionPart] : [];
  }
  return key === REGION.BAC ? [] : [root];
}

function mergeRates(region, ...profiles) {
  const out = defaultRates(region);
  for (const profile of profiles) {
    if (!profile) continue;
    for (const source of rateProfilePartsForRegion(profile, region)) {
      for (const [k, v] of Object.entries(source.heSoXac || {})) {
        if (Number.isFinite(Number(v))) out.heSoXac[k] = Number(v);
      }
      for (const [k, v] of Object.entries(source.tyLe || source.tiLe || {})) {
        if (Number.isFinite(Number(v))) out.tyLe[k] = Number(v);
      }
    }
  }
  return withScopedRateProfile(out, region);
}

function normalizeHeSoShortcut(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return n > 0 && n < 100 ? n * 10 : n;
}

function expandTyLeShortcut(value, defaultValue = null) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (n >= 10000) return n;
  const baseline = Number(defaultValue);
  if (Number.isFinite(baseline) && baseline > 0) {
    if (baseline >= 1000000) return n < 10000 ? n * 1000 : n * 100;
    if (baseline >= 100000) return n < 1000 ? n * 1000 : n * 100;
    return n < 100 ? n * 1000 : n * 100;
  }
  return n < 1000 ? n * 1000 : n * 100;
}

function applyGroupRate(rates, region, groupRaw, heSoRaw, tyLeRaw) {
  const group = compactKey(groupRaw);
  const cfg = getConfig(region);
  const heSo = normalizeHeSoShortcut(heSoRaw);
  if (!Number.isFinite(heSo)) return false;
  const targetTypes = RATE_GROUPS[group] || [normalizeTicketType(groupRaw, region)];
  let applied = false;
  for (const type of targetTypes) {
    if (!type) continue;
    const tyLe = expandTyLeShortcut(tyLeRaw, cfg.tyLeDefault[type]);
    if (!Number.isFinite(tyLe)) continue;
    if (Object.prototype.hasOwnProperty.call(cfg.heSoXacDefault, type)) {
      rates.heSoXac[type] = heSo;
      applied = true;
    }
    if (Object.prototype.hasOwnProperty.call(cfg.tyLeDefault, type)) {
      rates.tyLe[type] = tyLe;
      applied = true;
    }
  }
  return applied;
}

function parseRateProfile(rateText, region = REGION.NAM) {
  const rates = { heSoXac: {}, tyLe: {} };
  if (!rateText || !String(rateText).trim()) return rates;
  const text = normalizeVN(rateText).replace(/[()]/g, '').trim();
  const simple = text.match(/^\s*(\d+(?:\.\d+)?)\s*[,/]\s*(\d+(?:\.\d+)?)\s*$/);
  if (simple) {
    applyGroupRate(rates, region, '2c', simple[1], simple[2]);
    return withScopedRateProfile(rates, region);
  }

  const pairRe = /([a-z0-9]+)\s*=\s*(\d+(?:\.\d+)?)\s*[,/]\s*(\d+(?:\.\d+)?)/g;
  let m;
  while ((m = pairRe.exec(text)) !== null) {
    applyGroupRate(rates, region, m[1], m[2], m[3]);
  }
  return withScopedRateProfile(rates, region);
}

function splitInlineRateGroupName(name, rateText, region = REGION.NAM) {
  const rawName = String(name || '').trim();
  const rawRate = rateText == null ? null : String(rateText).trim();
  if (!rawName || !rawRate) return { name: rawName, rateText: rawRate };
  const m = rawName.match(/^(.*?)\s+(2c|3c|4c|xc|lo|b|bl|dd|dau|duoi|xien[234])$/i);
  if (!m) return { name: rawName, rateText: rawRate };
  const group = compactKey(m[2]);
  if (!RATE_GROUPS[group] && !normalizeTicketType(group, region)) return { name: rawName, rateText: rawRate };
  return {
    name: m[1].trim(),
    rateText: rawRate.includes('=') ? rawRate : `${group}=${rawRate}`,
  };
}

function extractPlayerHeader(rawText, region = REGION.NAM) {
  const text = String(rawText || '').replace(/\r\n/g, '\n');
  const lines = text.split('\n');
  const firstIdx = lines.findIndex(line => line.trim());
  if (firstIdx === -1) return { playerName: null, profile: null, bodyText: '', hasHeader: false };
  const line = lines[firstIdx].trim();
  let m = line.match(/^([^:]{1,80}?)(?:\s*\(([^)]*)\))?\s*:\s*(.*)$/);
  let bodyLine = '';
  if (!m) {
    const headerOnly = line.match(/^(.{1,80}?)(?:\s*\(([^)]*)\))?\s*$/);
    const normalizedHeader = headerOnly ? normalizeVN(headerOnly[1].trim()) : '';
    const isExplicitPlayerLine = /^(nguoi|ng|khach|player|user)\b/.test(normalizedHeader);
    if (!headerOnly || !isExplicitPlayerLine) return { playerName: null, profile: null, bodyText: text, hasHeader: false };
    m = [line, headerOnly[1], headerOnly[2] || null, ''];
  } else {
    bodyLine = m[3] || '';
  }
  const nameParts = splitInlineRateGroupName(m[1].trim(), m[2] || null, region);
  const name = nameParts.name;
  const normalizedName = normalizeVN(name);
  const looksLikeHeader =
    /^(nguoi|ng|khach|player|user|ban|a|b|c|d|e|f)\b/.test(normalizedName) ||
    normalizedName.length <= 24;
  if (!looksLikeHeader) return { playerName: null, profile: null, bodyText: text, hasHeader: false };

  const before = lines.slice(0, firstIdx);
  const after = lines.slice(firstIdx + 1);
  const bodyText = [...before, bodyLine, ...after].join('\n').trim();
  return {
    playerName: name,
    profile: parseRateProfile(nameParts.rateText, region),
    bodyText,
    hasHeader: true,
    rateText: nameParts.rateText || null,
  };
}

function normalizeTicketType(typeRaw, region = REGION.NAM) {
  if (!typeRaw) return null;
  const t = compactKey(typeRaw);
  const base = {
    b: 'Lo',
    bb: 'Lo',
    bl: 'Lo',
    blo: 'Lo',
    bao: 'Lo',
    lo: 'Lo',
    lô: 'Lo',
    dd: 'DauDuoi',
    dauduoi: 'DauDuoi',
    daudui: 'DauDuoi',
    daucuoi: 'DauDuoi',
    daucui: 'DauDuoi',
    daucoi: 'DauDuoi',
    daud: 'DauDuoi',
    dc: 'DauDuoi',
    dau: 'Dau',
    dauu: 'Dau',
    dao: 'Dau',
    duoi: 'Duoi',
    dui: 'Duoi',
    du: 'Duoi',
    cui: 'Duoi',
    cuoi: 'Duoi',
    coi: 'Duoi',
    '3c': '3Cang',
    '3cang': '3Cang',
    bacang: '3Cang',
    '4c': '4Cang',
    '4cang': '4Cang',
    boncang: '4Cang',
  };
  if (getConfig(region).region === REGION.BAC) {
    Object.assign(base, {
      xc: 'DauDuoi3C',
      xiuchu: 'DauDuoi3C',
      xiu: 'DauDuoi3C',
      xchu: 'DauDuoi3C',
      xdau: 'Dau3C',
      xiudau: 'Dau3C',
      xdui: 'Duoi3C',
      xdu: 'Duoi3C',
      xcui: 'Duoi3C',
      xduoi: 'Duoi3C',
      xiuduoi: 'Duoi3C',
    });
    if (/^(xien|x|da|dx)[234]?$/.test(t)) {
      const level = t.match(/[234]/);
      return level ? `Xien${level[0]}` : 'Xien';
    }
  } else {
    Object.assign(base, {
      xc: 'XiuChu',
      xiuchu: 'XiuChu',
      xiu: 'XiuChu',
      xchu: 'XiuChu',
      xdau: 'XiuChuDau',
      xiudau: 'XiuChuDau',
      xdui: 'XiuChuDuoi',
      xdu: 'XiuChuDuoi',
      xcui: 'XiuChuDuoi',
      xduoi: 'XiuChuDuoi',
      xiuduoi: 'XiuChuDuoi',
    });
  }
  return base[t] || null;
}

function getTien(token) {
  const m = String(token || '').match(/^(\d+(?:\.\d+)?)(n|k|d|m|diem|diểm|ngan|nghin|tr|trieu|triệu)?$/);
  if (!m || !m[2]) return 0;
  const value = Number(m[1]);
  return /^(tr|trieu|triệu)$/i.test(m[2]) ? value * 1000 : value;
}

function detectDai(token, region) {
  const cfg = getConfig(region);
  const t = normalizeVN(token).trim();
  return cfg.daiAlias[t] || cfg.daiAlias[compactKey(token)] || null;
}

function preprocessLine(line, region) {
  let s = normalizeVN(line);
  s = s.replace(/[.,;\/]{2,}/g, ' ');
  s = s.replace(/([.,;\/])\s+([.,;\/])/g, ' ');
  s = s.replace(/\u20ab/g, 'd');
  s = s.replace(/[₫]/g, 'd');
  s = s.replace(
    /((?:^|\s)(?:\d{2,4})?(?:b|bl|dd|dc|dau|duoi|dui|xc|xdau|xdui|xduoi|xiuchu|xchu)\s+)(\d+(?:\.\d+)?)\.(?=\s+(?:b|bl|dd|dc|dau|duoi|dui|xc|xdau|xdui|xduoi|xiuchu|xchu)\b|\s*$)/g,
    '$1$2n',
  );
  s = s.replace(/\.(?=\d)/g, ' ').replace(/(?<=\d)\./g, ' ').replace(/\./g, ' ');
  s = s.replace(/[\(\[]/g, ' ( ').replace(/[\)\]]/g, ' ) ');
  s = s.replace(/[,;\-–—:+\/]/g, ' ');
  s = s.replace(/keo\s*d[eê]n/g, 'den').replace(/k[eé]o/g, 'den');
  s = s.replace(/\bden\s+(?:luon|nha|nhe|nghen|hen|dum|giup|toi|qua|sang)\b/g, 'den');
  s = s.replace(/(\d)(den)(\d)/g, '$1 den $3');
  s = s.replace(/(\d)(den)/g, '$1 den');
  s = s.replace(/(den)(\d)/g, 'den $2');
  s = s.replace(/(\d+)\s+(?:diem|ngan|nghin)/g, '$1n');
  s = s.replace(/(\d+(?:\.\d+)?)\s+([nkm])\b/g, '$1$2');
  s = s.replace(/(\d+)(?:ngan|nghin)\b/g, '$1n');
  s = s.replace(/(\d{2,}(?:\.\d+)?)\s+d\b/g, '$1n');

  const commonMap = {
    'blmt': 'bl mtr',
    'blmb': 'bl mb',
    'blmn': 'bl mn',
    'bao lo': 'bl',
    'b lo': 'bl',
    'lo bao': 'bl',
    'dau duoi': 'dd',
    'dau dui': 'dd',
    'dau du': 'dd',
    'dau cuoi': 'dd',
    'dau cui': 'dd',
    'dau coi': 'dd',
    'duoi dau': 'dd',
    'dui dau': 'dd',
    'cui dau': 'dd',
    'cuoi dau': 'dd',
    'keo den': 'den',
    'keo d': 'den',
    '2d phu': 'phu',
    '2dai phu': 'phu',
    '2 dai phu': 'phu',
    '2 d phu': 'phu',
    'hai dai phu': 'phu',
    'dai phu': 'phu',
    'd phu': 'phu',
    '1 dai': '1dai',
    'mot dai': '1dai',
    'hai dai': '2dai',
    'ba dai': '3dai',
    'bon dai': '4dai',
    '4 dai': '4dai',
    '3 dai': '3dai',
    '2 dai': '2dai',
    '1 đai': '1dai',
    '4 đai': '4dai',
    '3 đai': '3dai',
    '2 đai': '2dai',
    '1 d': '1d',
    'hai d': '2d',
    'ba d': '3d',
    'bon d': '4d',
    '4 d': '4d',
    '3 d': '3d',
    '2 d': '2d',
    'mien trung': 'mtr',
  };
  const cfgRegion = getConfig(region).region;
  const regionMap =
    cfgRegion === REGION.BAC
      ? DAI_PHRASE_ALIAS_BAC
      : cfgRegion === REGION.TRUNG
      ? {
          'tt hue': 'hue',
          'thua thien hue': 'hue',
          'phu yen': 'py',
          'dak lak': 'dlk',
          'dac lak': 'dlk',
          'dac lac': 'dlk',
          'dak lac': 'dlk',
          'quang nam': 'qna',
          'da nang': 'dn',
          'khanh hoa': 'kh',
          'binh dinh': 'bdi',
          'quang tri': 'qt',
          'quang binh': 'qb',
          'gia lai': 'gl',
          'ninh thuan': 'nth',
          'quang ngai': 'qng',
          'dak nong': 'dno',
          'dac nong': 'dno',
          'kon tum': 'kt',
          ...DAI_PHRASE_ALIAS_TRUNG,
        }
      : {
          'tp hcm': 'tphcm',
          'tp h c m': 'tphcm',
          'thanh pho': 'tphcm',
          'bao tp': 'baotp',
          'sai gon': 'saigon',
          'dong thap': 'dongthap',
          'ca mau': 'camau',
          'ben tre': 'bentre',
          'vung tau': 'vungtau',
          'bac lieu': 'baclieu',
          'b lieu': 'blieu',
          'dong nai': 'dongnai',
          'can tho': 'cantho',
          'soc trang': 'soctrang',
          'tay ninh': 'tayninh',
          'an giang': 'angiang',
          'binh thuan': 'binhthuan',
          'vinh long': 'vinhlong',
          'binh duong': 'binhduong',
          'tra vinh': 'travinh',
          'long an': 'longan',
          'binh phuoc': 'binhphuoc',
          'hau giang': 'haugiang',
          'tien giang': 'tiengiang',
          'kien giang': 'kiengiang',
          'da lat': 'dalat',
          'lam dong': 'lamdong',
          ...DAI_PHRASE_ALIAS_NAM,
        };
  for (const [k, v] of Object.entries({ ...commonMap, ...regionMap })) {
    s = s.replace(new RegExp(`\\b${k}\\b`, 'g'), v);
  }
  return s.replace(/\s+/g, ' ').trim();
}

function expandCompactTokens(tokens, region) {
  const expanded = [];
  for (const tok of tokens) {
    const dualStake = tok.match(/^(\d+(?:\.\d+)?)(n|k|d|m|diem|diểm|ngan|nghin|tr|trieu|triệu)(\d+(?:\.\d+)?)(n|k|d|m|diem|diểm|ngan|nghin|tr|trieu|triệu)$/i);
    if (dualStake) {
      const val1 = dualStake[1] + dualStake[2];
      const val2 = dualStake[3] + dualStake[4];
      const t1 = getTien(val1);
      const t2 = getTien(val2);
      if (t1 > 0 && t2 > 0) {
        if (t1 === t2) {
          expanded.push('dd', val1);
        } else {
          expanded.push('dau', val1, 'duoi', val2);
        }
        continue;
      }
    }

    if (
      tok === 'den' ||
      tok === 'phu' ||
      normalizeTicketType(tok, region) ||
      detectDai(tok, region) ||
      /^[1234]dai$/.test(tok) ||
      tok === 'dai' ||
      /^[1234]d$/.test(tok) ||
      /^\d{2,4}$/.test(tok) ||
      getTien(tok) > 0
    ) {
      expanded.push(tok);
      continue;
    }

    const daiType = tok.match(/^([a-z]+)(b|bl|dd|dc|dau|duoi|dui|xc|xdau|xdui|xduoi)$/);
    if (daiType && detectDai(daiType[1], region) && normalizeTicketType(daiType[2], region)) {
      expanded.push(daiType[1], daiType[2]);
      continue;
    }

    const daiNumber = tok.match(/^([a-z]+)(\d{2,4})$/);
    if (daiNumber && detectDai(daiNumber[1], region)) {
      expanded.push(daiNumber[1], daiNumber[2]);
      continue;
    }

    const moneyTypeMoney = tok.match(/^(\d+(?:\.\d+)?(?:n|k|d|m|diem|tr|trieu))([a-z]+)(\d+(?:\.\d+)?(?:n|k|d|m|diem|tr|trieu))$/);
    if (moneyTypeMoney && normalizeTicketType(moneyTypeMoney[2], region)) {
      expanded.push(moneyTypeMoney[1], moneyTypeMoney[2], moneyTypeMoney[3]);
      continue;
    }

    const numberTypeMoney = tok.match(/^(\d{2,4})([a-z]+)(\d+(?:\.\d+)?(?:n|k|d|m|diem|diểm|tr|trieu|triệu))$/);
    if (numberTypeMoney && normalizeTicketType(numberTypeMoney[2], region)) {
      expanded.push(numberTypeMoney[1], numberTypeMoney[2], numberTypeMoney[3]);
      continue;
    }

    const numberMoiCon = tok.match(/^(\d{2,4})(mc)$/);
    if (numberMoiCon) {
      expanded.push(numberMoiCon[1], numberMoiCon[2]);
      continue;
    }

    const numberType = tok.match(/^(\d{2,4})([a-z]+)$/);
    if (numberType && normalizeTicketType(numberType[2], region)) {
      expanded.push(numberType[1], numberType[2]);
      continue;
    }

    const moneyType = tok.match(/^(\d+(?:\.\d+)?(?:n|k|d|m|diem|diểm|tr|trieu|triệu))([a-z]+)$/);
    if (moneyType && normalizeTicketType(moneyType[2], region)) {
      expanded.push(moneyType[1], moneyType[2]);
      continue;
    }

    const typeMoney = tok.match(/^([a-z]+)(\d+(?:\.\d+)?(?:n|k|d|m|diem|diểm|tr|trieu|triệu))$/);
    if (typeMoney && normalizeTicketType(typeMoney[1], region)) {
      expanded.push(typeMoney[1], typeMoney[2]);
      continue;
    }

    const typeNumber = tok.match(/^([a-z]+)(\d{2,4})$/);
    if (typeNumber && normalizeTicketType(typeNumber[1], region)) {
      expanded.push(typeNumber[1], typeNumber[2]);
      continue;
    }

    expanded.push(tok);
  }
  return expanded;
}

function expandRangeIntoBuffer(numBuf, endToken) {
  if (!/^\d{2,4}$/.test(endToken) || numBuf.length === 0) return false;
  const startTok = numBuf[numBuf.length - 1];
  const startNum = parseInt(startTok, 10);
  const endNum = parseInt(endToken, 10);
  const len = Math.max(startTok.length, endToken.length);
  if (!(endNum > startNum && endNum - startNum <= 1000)) return true;

  let step = 1;
  if (len === 2) {
    const s1 = startNum % 10;
    const e1 = endNum % 10;
    const s10 = Math.floor(startNum / 10);
    const e10 = Math.floor(endNum / 10);
    if (s1 === e1) step = 10;
    else if (s10 === e10) step = 1;
  } else if (len === 3) {
    const s2 = startNum % 100;
    const e2 = endNum % 100;
    const s100 = Math.floor(startNum / 100);
    const e100 = Math.floor(endNum / 100);
    if (s2 === e2) step = 100;
    else if (s100 === e100) step = 1;
  } else if (len === 4) {
    const s3 = startNum % 1000;
    const e3 = endNum % 1000;
    if (s3 === e3) step = 1000;
    else step = 1;
  }

  for (let n = startNum + step; n <= endNum; n += step) {
    numBuf.push(n.toString().padStart(len, '0'));
  }
  return true;
}

function normalizeDaiList(dais, region, activeDai) {
  const cfg = getConfig(region);
  const fallback = activeDai && activeDai.length ? activeDai : cfg.defaultActiveDai;
  const out = [];
  for (const raw of dais || []) {
    const detected = detectDai(raw, region);
    const exact = cfg.daiList.find(d => normalizeVN(d) === normalizeVN(raw));
    const value = detected || exact;
    if (value && !out.includes(value)) out.push(value);
  }
  return out.length ? out : [...fallback];
}

function recalcTicketXac(ticket) {
  const daiCount = Array.isArray(ticket.dai) ? ticket.dai.length : 0;
  ticket.xac = Number(ticket.tienDat || 0) * Number(ticket.chan || 0) * Number(ticket.soGiai || 0) * Number(ticket.heSoXac || 0) * daiCount;
  ticket.tong = ticket.xac;
}

function validateTicketsAgainstActiveDai(tickets, region, activeDai) {
  const cfg = getConfig(region);
  if (cfg.region === REGION.BAC) return [];
  const canonicalActiveDai = normalizeDaiList(activeDai, region, getActiveDai(region));
  const activeSet = new Set(canonicalActiveDai);
  const warnings = [];
  const seen = new Set();

  const invalidLines = new Map();
  for (const ticket of tickets || []) {
    const sourceText = String(ticket.sourceText || '').trim();
    const daiList = normalizeDaiList(ticket.dai || [], region, canonicalActiveDai);
    const invalidDai = daiList.filter(dai => !activeSet.has(dai));
    if (invalidDai.length) {
      const key = sourceText || invalidDai.join(',');
      const row = invalidLines.get(key) || { sourceText, invalidDai: [] };
      for (const dai of invalidDai) {
        if (!row.invalidDai.includes(dai)) row.invalidDai.push(dai);
      }
      ticket.invalidDai = true;
      invalidLines.set(key, row);
      continue;
    }
    ticket.dai = [...new Set(daiList)];
    recalcTicketXac(ticket);
  }

  for (const row of invalidLines.values()) {
    const sourceText = row.sourceText || 'dòng này';
    const key = row.invalidDai.join(',') + '|' + sourceText + '|' + canonicalActiveDai.join(',');
    if (!seen.has(key)) {
      warnings.push(
        'Hôm nay không có đài ' + row.invalidDai.join(', ') +
        ', hệ thống đã bỏ dòng "' + sourceText +
        '". Vui lòng gửi lại tin mới đúng đài hôm nay: ' + canonicalActiveDai.join(', ') + '.'
      );
      seen.add(key);
    }
  }
  return warnings;
}

function makeTicket(nums, loaiRaw, tienDat, daiList, context) {
  const region = canonicalRegion(context.region);
  const cfg = getConfig(region);
  let loai = loaiRaw;
  const soList = (nums || []).map(n => String(n).trim()).filter(n => /^\d+$/.test(n));
  if (soList.length === 0 && !['XiuChu', 'XiuChuDau', 'XiuChuDuoi'].includes(loai)) return null;
  const nDigits = soList.length > 0 ? soList[0].length : 2;

  if (loai === 'Lo') {
    if (nDigits === 3) loai = '3Cang';
    else if (nDigits === 4) loai = '4Cang';
  }

  if (region === REGION.BAC) {
    if (nDigits >= 3) {
      if (loai === 'DauDuoi') loai = 'DauDuoi3C';
      else if (loai === 'Dau') loai = 'Dau3C';
      else if (loai === 'Duoi') loai = 'Duoi3C';
    } else if (nDigits === 2) {
      if (loai === 'DauDuoi3C') loai = 'DauDuoi';
      else if (loai === 'Dau3C') loai = 'Dau';
      else if (loai === 'Duoi3C') loai = 'Duoi';
    }
  } else if (nDigits >= 3) {
    if (loai === 'DauDuoi') loai = 'XiuChu';
    else if (loai === 'Dau') loai = 'XiuChuDau';
    else if (loai === 'Duoi') loai = 'XiuChuDuoi';
  } else if (nDigits === 2) {
    if (loai === 'XiuChu') loai = 'DauDuoi';
    else if (loai === 'XiuChuDau') loai = 'Dau';
    else if (loai === 'XiuChuDuoi') loai = 'Duoi';
  }

  if (!Object.prototype.hasOwnProperty.call(cfg.heSoXacDefault, loai)) return null;

  let chan = Math.max(soList.length, 1);
  let soGiai = 1;
  if (region === REGION.BAC) {
    if (loai === 'Lo') soGiai = 27;
    else if (loai === '3Cang') soGiai = 23;
    else if (loai === '4Cang') soGiai = 20;
    else if (loai === 'DauDuoi') soGiai = 5;
    else if (loai === 'Dau') soGiai = 4;
    else if (loai === 'Duoi') soGiai = 1;
    else if (loai === 'DauDuoi3C') soGiai = 4;
    else if (loai === 'Dau3C') soGiai = 3;
    else if (loai === 'Duoi3C') soGiai = 1;
    else if (loai.startsWith('Xien')) {
      soGiai = 1;
      chan = 1;
    }
  } else {
    if (loai === 'Lo') soGiai = 18;
    else if (loai === '3Cang') soGiai = 17;
    else if (loai === '4Cang') soGiai = 16;
    else if (loai === 'DauDuoi' || loai === 'XiuChu') soGiai = 2;
    else if (loai === 'Dau' || loai === 'Duoi' || loai === 'XiuChuDau' || loai === 'XiuChuDuoi') soGiai = 1;
  }

  const rates = mergeRates(region, context.rates, context.rateOverride);
  const heSoXac = rates.heSoXac[loai] || cfg.heSoXacDefault[loai] || 700;
  const tyLeTrung = rates.tyLe[loai] || cfg.tyLeDefault[loai] || 0;
  const normalizedDais = normalizeDaiList(daiList, region, context.activeDai);
  const tien = Number(tienDat) || 0;
  const xac = tien * chan * soGiai * heSoXac * normalizedDais.length;

  return {
    id: context.idFactory ? context.idFactory() : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    playerName: context.playerName || null,
    region,
    soList,
    loai,
    loaiLabel: TYPE_LABELS[loai] || loai,
    tienDat: tien,
    chan,
    soGiai,
    heSoXac,
    tyLeTrung,
    xac,
    tong: xac,
    dai: normalizedDais,
    sourceText: context.sourceText || null,
    ketQua: '?',
    tienThang: 0,
    ghiChu: '',
    hits: [],
  };
}

function findWeirdCharacters(line) {
  const allowedSymbols = new Set(['.', ',', ';', ':', '(', ')', '[', ']', '{', '}', '+', '-', '–', '—', '_', '/', '\\', "'", '"', '=', '*', '&', '%', '₫']);
  const out = [];
  for (const ch of String(line || '')) {
    if (/[\p{L}\p{N}\s]/u.test(ch)) continue;
    if (allowedSymbols.has(ch)) continue;
    if (!out.includes(ch)) out.push(ch);
  }
  return out.slice(0, 8);
}

function cleanXienGroup(value) {
  return String(value || '')
    .trim()
    .replace(/^[,.;/|]+|[,.;/|]+$/g, '')
    .trim();
}

function xienGroupNumberCount(value) {
  return cleanXienGroup(value)
    .replace(/[,.;/|]+/g, ' ')
    .split(/\s+/)
    .filter(tok => /^\d{2,4}$/.test(tok)).length;
}

function splitXienGroups(content, explicitLevel = 0) {
  const raw = cleanXienGroup(content);
  const candidates = [];

  const addCandidate = (parts, score) => {
    const groups = parts.map(cleanXienGroup).filter(Boolean);
    if (groups.length < 2 || groups.some(group => {
      const count = xienGroupNumberCount(group);
      return count < 2 || count > 4;
    })) return;
    const signature = groups.join('|');
    if (!candidates.some(candidate => candidate.signature === signature)) {
      candidates.push({ groups, score, signature });
    }
  };

  for (const delimiter of [';', '/', '|']) {
    if (raw.includes(delimiter)) addCandidate(raw.split(delimiter), 100);
  }

  for (const delimiter of [',', '.']) {
    const escaped = delimiter === '.' ? '\\.' : delimiter;
    addCandidate(raw.split(new RegExp(`\\s+${escaped}\\s+`)), 95);
    addCandidate(raw.split(new RegExp(`${escaped}\\s+`)), 85);
  }

  if (raw.includes(',') && raw.includes('.')) {
    addCandidate(raw.split('.'), 70);
    addCandidate(raw.split(','), 70);
  }

  candidates.sort((a, b) => b.score - a.score || a.groups.length - b.groups.length);
  if (candidates.length) {
    const top = candidates[0];
    const equallyLikely = candidates.find(candidate => candidate.score === top.score && candidate.signature !== top.signature);
    return {
      groups: top.groups,
      ambiguous: Boolean(equallyLikely),
    };
  }

  const numCount = xienGroupNumberCount(raw);
  if (explicitLevel && numCount >= explicitLevel && numCount % explicitLevel === 0) {
    return { groups: [raw], ambiguous: false };
  }
  if (numCount >= 2 && numCount <= 4) {
    return { groups: [raw], ambiguous: false };
  }
  return { groups: [raw], ambiguous: numCount > 0 };
}

function parseLegacyTickets(rawText, options = {}) {
  const region = canonicalRegion(options.region);
  const result = [];
  const warnings = [];
  const date = options.date || new Date();
  const activeDai = options.activeDai && options.activeDai.length ? [...options.activeDai] : getActiveDai(region, date);
  const defaultDai = options.defaultDai && options.defaultDai.length
    ? [...options.defaultDai]
    : getDefaultBetDai(region, date, activeDai);
  const globalDaiList = options.selectedDai && options.selectedDai.length ? options.selectedDai : defaultDai;
  const lines = String(rawText || '').split(/\r?\n/);
  let carryDaiList = [...globalDaiList];
  let carryLoai = null;
  let carryPending = false;
  let openHeadingContext = null;

  const isPhuMarkerToken = tok => tok === 'phu';
  const phuDaiList = () => {
    const mainSet = new Set(normalizeDaiList(defaultDai, region, activeDai));
    const phu = activeDai.filter(dai => !mainSet.has(dai));
    return phu.length ? phu : [...activeDai];
  };
  const isExcludeDaiToken = tok => tok === 'bo' || tok === 'tru';
  const sameDaiList = (left, right) => {
    const a = normalizeDaiList(left, region, activeDai);
    const b = normalizeDaiList(right, region, activeDai);
    return a.length === b.length && a.every((dai, index) => dai === b[index]);
  };
  const excludeDais = (baseDais, excludedDais) => {
    const base = normalizeDaiList(baseDais && baseDais.length ? baseDais : activeDai, region, activeDai);
    const excluded = new Set(normalizeDaiList(excludedDais, region, activeDai));
    const remaining = base.filter(dai => !excluded.has(dai));
    return remaining.length ? remaining : base;
  };
  const isDaiMarkerToken = tok => isPhuMarkerToken(tok) || /^[1234]dai$/.test(tok) || tok === 'dai' || /^[1234]d$/.test(tok);
  const daiListFromMarker = tok => {
    const lDai = detectDai(tok, region);
    if (lDai) return [lDai];
    if (isPhuMarkerToken(tok)) return phuDaiList();
    if (isDaiMarkerToken(tok)) {
      if (tok === '1dai' || tok === '1d') return [...globalDaiList];
      if (tok === '2dai' || tok === '2d') return activeDai.slice(0, 2);
      return [...activeDai];
    }
    return null;
  };
  const detectDaiInTokens = (tokens, index) => {
    const tok = tokens[index];
    const direct = detectDai(tok, region);
    if (direct) return direct;
    return null;
  };
  const readExcludedDaiRun = (tokens, startIndex, baseDais) => {
    if (!isExcludeDaiToken(tokens[startIndex])) return { dais: null, nextIndex: startIndex };
    const excludedDais = [];
    let nextIndex = startIndex + 1;
    if (tokens[nextIndex] === 'dai') nextIndex++;
    while (nextIndex < tokens.length) {
      const dai = detectDaiInTokens(tokens, nextIndex);
      if (!dai) break;
      if (!excludedDais.includes(dai)) excludedDais.push(dai);
      nextIndex++;
    }
    if (!excludedDais.length) return { dais: null, nextIndex: startIndex + 1 };
    return {
      dais: excludeDais(baseDais, excludedDais),
      nextIndex,
    };
  };

  const getStakeTien = tok => (isDaiMarkerToken(tok) ? 0 : getTien(tok));

  const isCompactNumberTypeStake = tok => {
    const plain = String(tok || '').match(/^(\d{2,4})([a-z]+)(\d+(?:\.\d+)?)([nkdm])?$/);
    if (plain && normalizeTicketType(plain[2], region)) return true;
    const withSuffix = String(tok || '').match(/^(\d{2,4})([a-z0-9]+)(\d+(?:\.\d+)?[nkdm])?$/);
    return !!(withSuffix && normalizeTicketType(withSuffix[2], region));
  };
  const hasStakeToken = tok =>
    !isDaiMarkerToken(tok) &&
    (getStakeTien(tok) > 0 || /^\d+(?:\.\d+)?(?:n|k|d|m|diem|điểm|tr|trieu|triệu)$/.test(tok) || isCompactNumberTypeStake(tok));
  const isFillerToken = tok => [
    'luon',
    'nha',
    'nhe',
    'nghen',
    'hen',
    'dum',
    'giup',
    'cho',
    'minh',
    'ghi',
    'anh',
    'chi',
    'em',
    'con',
    'moi',
    'moiem',
    'moi',
    'nhe',
    'di',
    'lay',
    'tin',
    'nay',
    'mc',
    'mt',
    'mtr',
    'mb',
    'mn',
    'i',
    'bo',
    'tru',
  ].includes(tok);

  for (let ln = 0; ln < lines.length; ln++) {
    const originalLine = lines[ln];
    if (!originalLine.trim()) {
      carryDaiList = [...globalDaiList];
      carryLoai = null;
      carryPending = false;
      openHeadingContext = null;
      continue;
    }
    const weirdChars = findWeirdCharacters(originalLine);
    if (weirdChars.length) {
      warnings.push(`Dòng ${ln + 1}: có ký tự lạ "${weirdChars.join(' ')}", hệ thống đã bỏ qua ký tự này.`);
    }
    let lineToProcess = originalLine;
    const normalizedLine = normalizeVN(originalLine).trim();
    const isXienLine = /^(?:xien|dx|da)(?:\s*[234])?(?=\s|$)/i.test(normalizedLine) || (carryLoai && (carryLoai === 'Xien' || carryLoai.startsWith('Xien')));
    if (isXienLine) {
      const stakeMatch = originalLine.match(/(?:\s+[x\*]\s*|\s+)(\d+(?:\.\d+)?\s*(?:n|k|d|m|diem|diểm|ngan|nghin|tr|trieu|triệu)?)\s*$/i);
      if (stakeMatch) {
        const stakeStr = stakeMatch[0];
        let content = originalLine.slice(0, originalLine.length - stakeStr.length).trim();
        let explicitLevel = 0;
        const prefixMatch = content.match(/^(?:xi[eê]n|dx|da)\s*([234])?\s*/i);
        if (prefixMatch) {
          explicitLevel = prefixMatch[1] ? Number(prefixMatch[1]) : 0;
          content = content.slice(prefixMatch[0].length).trim();
        }
        const splitRes = splitXienGroups(content, explicitLevel);
        if (splitRes.ambiguous) {
          warnings.push(`Dòng ${ln + 1}: xiên không rõ nhóm nên chưa tạo vé. Vui lòng dùng dấu chấm, dấu chấm phẩy hoặc dấu phẩy có khoảng trắng để tách tổ (ví dụ: 12,14. 15,16. x 100n).`);
          continue;
        }
        if (splitRes.groups.length >= 1) {
          const invalidGroup = splitRes.groups.some(group => {
            const count = xienGroupNumberCount(group);
            if (!explicitLevel) return count < 2 || count > 4;
            return splitRes.groups.length === 1 ? count % explicitLevel !== 0 : count !== explicitLevel;
          });
          if (invalidGroup) {
            warnings.push(`Dòng ${ln + 1}: số lượng số trong tổ xiên không khớp loại xiên nên chưa tạo vé.`);
            continue;
          }
          const rewrittenGroups = splitRes.groups.map(group => {
            const cleanG = cleanXienGroup(group);
            const groupNumCount = xienGroupNumberCount(cleanG);
            const level = explicitLevel || groupNumCount;
            return `xien${level} ${cleanG}${stakeStr}`;
          });
          if (rewrittenGroups.length > 1) {
            lines.splice(ln + 1, 0, ...rewrittenGroups.slice(1));
          }
          lineToProcess = rewrittenGroups[0];
        }
      }
    }
    const s = preprocessLine(lineToProcess, region);
    const tokens = expandCompactTokens(s.split(' ').filter(Boolean), region);
    if (tokens.length === 0) continue;

    const hasStake = tokens.some(hasStakeToken);
    const hasBetNumber = tokens.some(tok => /^\d{2,4}$/.test(tok));
    if (!hasStake && !hasBetNumber) {
      let headingLoai = null;
      let headingDais = [];
      for (let h = 0; h < tokens.length; h++) {
        const tok = tokens[h];
        const t = normalizeTicketType(tok, region);
        if (t) headingLoai = t === 'Xien' || t.startsWith('Xien') ? t : t;
        if (isExcludeDaiToken(tok)) {
          const excluded = readExcludedDaiRun(tokens, h, headingDais.length ? headingDais : activeDai);
          if (excluded.dais) {
            headingDais = excluded.dais;
            h = excluded.nextIndex - 1;
            continue;
          }
        }
        const ds = daiListFromMarker(tok);
        if (ds) headingDais = ds;
      }
      if (headingLoai || headingDais.length) {
        carryLoai = headingLoai || null;
        carryDaiList = headingDais.length ? headingDais : [...globalDaiList];
        carryPending = true;
        openHeadingContext = {
          line: ln + 1,
          text: originalLine.trim(),
          consumed: false,
        };
        continue;
      }
    }

    const usingCarry = carryPending;
    const hasExplicitDaiScope = tokens.some((tok, idx) => (
      !!detectDaiInTokens(tokens, idx) ||
      !!daiListFromMarker(tok) ||
      !!(isExcludeDaiToken(tok) && readExcludedDaiRun(tokens, idx, activeDai).dais)
    ));
    if (
      openHeadingContext &&
      openHeadingContext.consumed &&
      !usingCarry &&
      (hasStake || hasBetNumber) &&
      !hasExplicitDaiScope
    ) {
      warnings.push(
        `Dòng ${ln + 1}: chưa rõ "${originalLine.trim()}" có tiếp tục theo "${openHeadingContext.text}" hay là vé mới; hệ thống chưa lưu dòng này. Gửi lại kèm đài hoặc số đài rõ ràng.`
      );
      continue;
    }

    let currentDaiList = usingCarry ? [...carryDaiList] : [...globalDaiList];
    let currentLoai = usingCarry ? carryLoai : null;
    let currentXienLevel = 0;
    let numBuf = [];
    let lastNumBuf = [];
    let lastEmittedBatch = [];
    const lineEmittedTickets = [];
    let recentSuffixLoai = null;
    let parenDepth = 0;
    const contextStack = [];

    const applyDaisToTickets = (tickets, dais) => {
      const normalizedDais = normalizeDaiList(dais, region, activeDai);
      for (const ticket of tickets || []) {
        ticket.dai = [...normalizedDais];
        ticket.xac = ticket.tienDat * ticket.chan * ticket.soGiai * ticket.heSoXac * ticket.dai.length;
        ticket.tong = ticket.xac;
      }
    };

    const detectDaiAt = index => {
      return detectDaiInTokens(tokens, index);
    };

    const readDaiRun = startIndex => {
      const dais = [];
      let nextIndex = startIndex;
      while (nextIndex < tokens.length) {
        const dai = detectDaiAt(nextIndex);
        if (!dai) break;
        if (!dais.includes(dai)) dais.push(dai);
        nextIndex++;
      }
      return { dais, nextIndex };
    };

    const currentParenTickets = () => {
      const currentContext = contextStack[contextStack.length - 1];
      const start = currentContext ? currentContext.lineEmittedStart : 0;
      return lineEmittedTickets.slice(start);
    };

    const applyOrSetDais = (dais, nextIndex) => {
      const normalizedDais = normalizeDaiList(dais, region, activeDai);
      const futureIsParenGroup = tokens[nextIndex] === '(';
      const hasFuture = hasFutureTicketContent(nextIndex);

      if (parenDepth > 0 && numBuf.length === 0) {
        const parenTickets = currentParenTickets();
        if (parenTickets.length > 0 && !hasFuture) {
          applyDaisToTickets(parenTickets, normalizedDais);
        } else if (lastEmittedBatch.length > 0 && !hasFuture) {
          applyDaisToTickets(lastEmittedBatch, normalizedDais);
        } else {
          currentDaiList = normalizedDais;
        }
        return;
      }

      if (numBuf.length === 0 && lineEmittedTickets.length > 0 && (!hasFuture || futureIsParenGroup)) {
        applyDaisToTickets(lineEmittedTickets, normalizedDais);
        currentDaiList = normalizedDais;
        return;
      }

      currentDaiList = normalizedDais;
    };

    const flushVe = (nums, loai, tien, dais, xienLevel = 0) => {
      const created = [];
      if (!loai) loai = 'Lo';
      if (nums.length === 0) {
        if (!loai.startsWith('Xiu')) return;
        const ve = makeTicket([], loai, tien, dais, { ...options, region, activeDai, sourceText: originalLine });
        if (ve) {
          result.push(ve);
          created.push(ve);
        }
        lineEmittedTickets.push(...created);
        lastEmittedBatch = created;
        return;
      }

      if (loai === 'Xien') {
        let level = xienLevel;
        if (level >= 2 && level <= 4) {
          for (let k = 0; k < nums.length; k += level) {
            const chunk = nums.slice(k, k + level);
            if (chunk.length < 2) continue;
            const ve = makeTicket(chunk, `Xien${chunk.length}`, tien, dais, { ...options, region, activeDai, sourceText: originalLine });
            if (ve) {
              result.push(ve);
              created.push(ve);
            }
          }
        } else {
          const actualLoai = nums.length === 2 ? 'Xien2' : nums.length === 3 ? 'Xien3' : nums.length >= 4 ? 'Xien4' : '';
          if (actualLoai) {
            const ve = makeTicket(nums, actualLoai, tien, dais, { ...options, region, activeDai, sourceText: originalLine });
            if (ve) {
              result.push(ve);
              created.push(ve);
            }
          }
      }
      lastNumBuf = [...nums];
      lineEmittedTickets.push(...created);
      lastEmittedBatch = created;
      return;
      }

      const groups = {};
      for (const n of nums) {
        const len = n.length;
        if (!groups[len]) groups[len] = [];
        groups[len].push(n);
      }
      for (const groupNums of Object.values(groups)) {
        const ve = makeTicket(groupNums, loai, tien, dais, { ...options, region, activeDai, sourceText: originalLine });
        if (ve) {
          result.push(ve);
          created.push(ve);
        }
      }
      lastNumBuf = [...nums];
      lineEmittedTickets.push(...created);
      lastEmittedBatch = created;
    };

    const hasFutureTicketContent = startIndex => {
      for (let j = startIndex; j < tokens.length; j++) {
        const future = tokens[j];
        if (future === '(' || future === ')' || isFillerToken(future)) continue;
        if (isExcludeDaiToken(future)) continue;
        if (daiListFromMarker(future)) continue;
        return true;
      }
      return false;
    };

    let i = 0;
    while (i < tokens.length) {
      const tok = tokens[i];

      if (tok === '(') {
        contextStack.push({
          currentDaiList: [...currentDaiList],
          currentLoai,
          currentXienLevel,
          lineEmittedStart: lineEmittedTickets.length,
        });
        parenDepth++;
        i++;
        continue;
      }

      if (tok === ')') {
        const previous = contextStack.pop();
        if (previous) {
          currentDaiList = previous.currentDaiList;
          currentLoai = previous.currentLoai;
          currentXienLevel = previous.currentXienLevel;
        }
        parenDepth = Math.max(0, parenDepth - 1);
        i++;
        continue;
      }

      if (tok === 'den') {
        let nextIndex = i + 1;
        while (nextIndex < tokens.length && isFillerToken(tokens[nextIndex])) nextIndex++;
        if (nextIndex < tokens.length && expandRangeIntoBuffer(numBuf, tokens[nextIndex])) {
          i = nextIndex + 1;
          continue;
        }
        i++;
        continue;
      }

      if (isExcludeDaiToken(tok)) {
        const baseDais = sameDaiList(currentDaiList, globalDaiList) ? activeDai : currentDaiList;
        const excluded = readExcludedDaiRun(tokens, i, baseDais);
        if (excluded.dais) {
          applyOrSetDais(excluded.dais, excluded.nextIndex);
          i = excluded.nextIndex;
          continue;
        }
        i++;
        continue;
      }

      const lCheckDai = detectDaiAt(i);
      if (lCheckDai) {
        const run = readDaiRun(i);
        applyOrSetDais(run.dais, run.nextIndex);
        i = run.nextIndex;
        continue;
      }
      if (isDaiMarkerToken(tok)) {
        if (tok === 'dai' && i + 1 < tokens.length && detectDaiAt(i + 1)) {
          i++;
          continue;
        }
        const ds = daiListFromMarker(tok);
        if (ds) {
          applyOrSetDais(ds, i + 1);
        }
        i++;
        continue;
      }

      if (
        (tok === 'x' || tok === '*') &&
        numBuf.length > 0 &&
        currentLoai === 'Xien' &&
        i + 1 < tokens.length &&
        getStakeTien(tokens[i + 1]) > 0
      ) {
        i++;
        continue;
      }

      const typeCheck = normalizeTicketType(tok, region);
      if (typeCheck) {
        if (
          numBuf.length === 1 &&
          String(numBuf[0]).length <= 2 &&
          !(i + 1 < tokens.length && getStakeTien(tokens[i + 1]) > 0) &&
          lastNumBuf.length > 0 &&
          currentLoai &&
          currentLoai !== typeCheck &&
          (currentLoai === 'Xien' || currentLoai.startsWith('Xiu'))
        ) {
          const inferredStake = Number(numBuf[0]);
          if (Number.isFinite(inferredStake) && inferredStake > 0 && inferredStake <= 999) {
            flushVe(lastNumBuf, currentLoai, inferredStake, currentDaiList, currentXienLevel);
            numBuf = [];
          }
        }

        const suffixStake = i + 1 < tokens.length ? getStakeTien(tokens[i + 1]) : 0;
        if (suffixStake > 0 && numBuf.length === 0 && lastNumBuf.length > 0) {
          let suffixLoai = typeCheck.startsWith('Xien') ? 'Xien' : typeCheck;
          let suffixXienLevel = currentXienLevel;
          if (suffixLoai === 'Xien') {
            const mLevel = tok.match(/[234]/);
            suffixXienLevel = mLevel ? Number(mLevel[0]) : currentXienLevel || 2;
          }
          const secondStake = i + 2 < tokens.length ? getStakeTien(tokens[i + 2]) : 0;
          if (suffixLoai === 'DauDuoi' && secondStake > 0) {
            if (secondStake === suffixStake) {
              flushVe(lastNumBuf, 'DauDuoi', suffixStake, currentDaiList, suffixXienLevel);
            } else {
              flushVe(lastNumBuf, 'Dau', suffixStake, currentDaiList, suffixXienLevel);
              flushVe(lastNumBuf, 'Duoi', secondStake, currentDaiList, suffixXienLevel);
            }
            recentSuffixLoai = null;
            i += 3;
            continue;
          }
          flushVe(lastNumBuf, suffixLoai, suffixStake, currentDaiList, suffixXienLevel);
          recentSuffixLoai = suffixLoai;
          i += 2;
          continue;
        }

        currentLoai = typeCheck;
        recentSuffixLoai = null;
        if (typeCheck === 'Xien' || typeCheck.startsWith('Xien')) {
          const mLevel = tok.match(/[234]/);
          if (mLevel) currentXienLevel = Number(mLevel[0]);
          else if (i + 1 < tokens.length && /^[234]$/.test(tokens[i + 1])) {
            currentXienLevel = Number(tokens[i + 1]);
            i++;
          } else currentXienLevel = 2;
          currentLoai = 'Xien';
        }
        i++;
        continue;
      }

      const mNumTypePlainTien = tok.match(/^(\d{2,4})([a-z]+)(\d+(?:\.\d+)?)([nkdm])?$/);
      if (mNumTypePlainTien) {
        const lCheck = normalizeTicketType(mNumTypePlainTien[2], region);
        if (lCheck) {
          numBuf.push(mNumTypePlainTien[1]);
          currentLoai = lCheck.startsWith('Xien') ? 'Xien' : lCheck;
          if (currentLoai === 'Xien') {
            const mLevel = mNumTypePlainTien[2].match(/[234]/);
            currentXienLevel = mLevel ? Number(mLevel[0]) : 2;
          }
          const tien = Number(mNumTypePlainTien[3]) || 10;
          flushVe(numBuf, currentLoai, tien, currentDaiList, currentXienLevel);
          recentSuffixLoai = null;
          numBuf = [];
          i++;
          continue;
        }
      }

      const mNumTypeTien = tok.match(/^(\d{2,4})([a-z0-9]+)(\d+(?:\.\d+)?[nkdm])?$/);
      if (mNumTypeTien) {
        const lCheck = normalizeTicketType(mNumTypeTien[2], region);
        if (lCheck) {
          numBuf.push(mNumTypeTien[1]);
          currentLoai = lCheck.startsWith('Xien') ? 'Xien' : lCheck;
          if (currentLoai === 'Xien') {
            const mLevel = mNumTypeTien[2].match(/[234]/);
            currentXienLevel = mLevel ? Number(mLevel[0]) : 2;
          }
          let tien = 0;
          if (mNumTypeTien[3]) tien = getTien(mNumTypeTien[3]) || Number.parseFloat(mNumTypeTien[3]) || 0;
          if (tien === 0 && i + 1 < tokens.length) {
            const t2 = getStakeTien(tokens[i + 1]);
            if (t2 > 0) {
              tien = t2;
              i++;
            }
          }
          if (tien === 0) tien = 10;
          flushVe(numBuf, currentLoai, tien, currentDaiList, currentXienLevel);
          recentSuffixLoai = null;
          numBuf = [];
          i++;
          continue;
        }
      }

      const mLoaiTien = tok.match(/^([a-z0-9]+)(\d+(?:\.\d+)?[nkdm]?)$/);
      if (mLoaiTien) {
        const lCheck = normalizeTicketType(mLoaiTien[1], region);
        if (lCheck) {
          currentLoai = lCheck.startsWith('Xien') ? 'Xien' : lCheck;
          if (currentLoai === 'Xien') {
            const mLevel = mLoaiTien[1].match(/[234]/);
            currentXienLevel = mLevel ? Number(mLevel[0]) : 2;
          }
          const tien = getStakeTien(mLoaiTien[2]) || Number.parseFloat(mLoaiTien[2]) || 10;
          const targetNums = numBuf.length > 0 ? numBuf : lastNumBuf;
          if (targetNums.length > 0) {
            flushVe(targetNums, currentLoai, tien, currentDaiList, currentXienLevel);
            recentSuffixLoai = null;
            numBuf = [];
          }
          i++;
          continue;
        }
      }

      if (/^\d{2,4}$/.test(tok)) {
        numBuf.push(tok);
        i++;
        continue;
      }

      const gluedNumberBeforeStake = tok.match(/^(\d{2,4})n$/);
      if (gluedNumberBeforeStake && i + 1 < tokens.length) {
        const gluedNumber = gluedNumberBeforeStake[1];
        const nextStake = getStakeTien(tokens[i + 1]);
        const currentStake = getStakeTien(tok);
        const targetNums = numBuf.length > 0 ? numBuf : lastNumBuf;
        const hasTwoDigitDauDuoiTarget =
          currentLoai === 'DauDuoi' &&
          targetNums.length > 0 &&
          targetNums.every(n => String(n).length === 2);
        const duplicatedDauDuoiStake =
          currentLoai === 'DauDuoi' &&
          currentStake > 0 &&
          nextStake === currentStake &&
          (numBuf.length > 0 || lastNumBuf.length > 0);
        const looksLikeMistypedType =
          nextStake > 0 &&
          !hasTwoDigitDauDuoiTarget &&
          !duplicatedDauDuoiStake &&
          (gluedNumber.length >= 3 || nextStake !== currentStake);
        if (looksLikeMistypedType) {
          numBuf.push(gluedNumber);
          i++;
          continue;
        }
      }

      let tValue = getStakeTien(tok);
      if (tValue > 0) {
        const targetNums = numBuf.length > 0 ? numBuf : lastNumBuf;
        if (targetNums.length > 0) {
          let lType = currentLoai || 'Lo';
          const nextType = i + 1 < tokens.length ? normalizeTicketType(tokens[i + 1], region) : null;
          const nextTypeStake = nextType && i + 2 < tokens.length ? getStakeTien(tokens[i + 2]) : 0;
          const shouldInheritRecentSuffix =
            numBuf.length > 0 &&
            recentSuffixLoai &&
            recentSuffixLoai === nextType &&
            nextTypeStake > 0 &&
            lType === 'Lo' &&
            targetNums.every(n => String(n).length === 2);
          if (shouldInheritRecentSuffix) lType = recentSuffixLoai;

          let consumedExtraStakeToken = false;
          if (tValue >= 1000 && i + 1 < tokens.length && /^\d{1,3}$/.test(tokens[i + 1])) {
            tValue += Number(tokens[i + 1]);
            consumedExtraStakeToken = true;
          }
          const nextValue = i + 1 < tokens.length ? getStakeTien(tokens[i + 1]) : 0;
          if (lType === 'DauDuoi' && nextValue > 0) {
            if (nextValue === tValue) {
              flushVe(targetNums, 'DauDuoi', tValue, currentDaiList, currentXienLevel);
            } else {
              flushVe(targetNums, 'Dau', tValue, currentDaiList, currentXienLevel);
              flushVe(targetNums, 'Duoi', nextValue, currentDaiList, currentXienLevel);
            }
            recentSuffixLoai = null;
            numBuf = [];
            i += 2;
            continue;
          }
          flushVe(targetNums, lType, tValue, currentDaiList, currentXienLevel);
          recentSuffixLoai = null;
          numBuf = [];
          if (consumedExtraStakeToken) {
            i += 2;
            continue;
          }
        }
        i++;
        continue;
      }

      if (isFillerToken(tok)) {
        i++;
        continue;
      }

      if (/[a-z]/.test(tok) && !['n', 'k', 'd', 'diem', 'ngan', 'nghin', 'tq'].includes(tok)) warnings.push(`Dòng ${ln + 1}: bỏ qua token "${tok}"`);
      i++;
    }

    if (usingCarry) {
      if (openHeadingContext) openHeadingContext.consumed = true;
      carryDaiList = [...globalDaiList];
      carryLoai = null;
      carryPending = false;
    }
    if (hasExplicitDaiScope) {
      openHeadingContext = null;
    }
  }

  return { tickets: result, warnings };
}

function parseCommand(text) {
  const trimmed = String(text || '').trim();
  if (!trimmed.startsWith('/')) return null;
  const [commandRaw, ...rest] = trimmed.split(/\s+/);
  const command = commandRaw.replace(/^\/+/, '').split('@')[0].toLowerCase();
  return {
    command,
    args: rest,
    body: trimmed.slice(commandRaw.length).trim(),
  };
}

function stripRegionOnlyLines(rawText, defaultRegion) {
  let region = canonicalRegion(defaultRegion);
  const kept = [];
  for (const line of String(rawText || '').split(/\r?\n/)) {
    const normalized = normalizeVN(line.trim());
    const compact = normalized.replace(/[\s_-]+/g, '');
    if (compact && REGION_ALIASES[compact]) {
      region = REGION_ALIASES[compact];
      continue;
    }
    kept.push(line);
  }
  return { region, text: kept.join('\n') };
}

function regionFromOnlyLine(line) {
  const normalized = normalizeVN(String(line || '').trim());
  const compact = normalized.replace(/[\s_-]+/g, '');
  return compact && REGION_ALIASES[compact] ? REGION_ALIASES[compact] : null;
}

function inlineBaoLoRegion(line) {
  const match = normalizeVN(String(line || '')).match(/\bbl(mt|mb|mn)\b/);
  if (!match) return null;
  const region = match[1] === 'mt' ? REGION.TRUNG : match[1] === 'mb' ? REGION.BAC : REGION.NAM;
  return {
    region,
    text: String(line || '').replace(/\bbl(?:mt|mb|mn)\b/i, 'bl'),
  };
}

function parsePlayerHeadingLine(line, region = REGION.NAM) {
  const raw = String(line || '').trim();
  if (!raw || regionFromOnlyLine(raw)) return null;

  let m = raw.match(/^(.{1,80}?)(?:\s*\(([^)]*)\))?\s*:\s*(.*)$/);
  const hasColon = Boolean(m);
  if (!m) {
    m = raw.match(/^(.{1,80}?)(?:\s*\(([^)]*)\))?\s*$/);
  }
  if (!m) return null;

  const nameParts = splitInlineRateGroupName((m[1] || '').trim(), m[2] || null, region);
  const playerName = nameParts.name;
  const normalizedName = normalizeVN(playerName).replace(/\s+/g, ' ').trim();
  const compactName = normalizedName.replace(/[\s_-]+/g, '');
  if (!playerName || !normalizedName || REGION_ALIASES[compactName]) return null;

  const explicitPlayer = /^(nguoi|ng|khach|player|user|ban)\b/.test(normalizedName);
  const shortColonName =
    hasColon &&
    normalizedName.length <= 24 &&
    !/^\d+$/.test(normalizedName) &&
    !normalizeTicketType(normalizedName, region);

  if (!explicitPlayer && !shortColonName) return null;
  return {
    playerName,
    rateText: nameParts.rateText || null,
    bodyText: hasColon ? (m[3] || '').trim() : '',
    hasColon,
  };
}

function splitTelegramTextBlocks(rawText, options = {}) {
  const defaultRegion = canonicalRegion(options.region);
  const fallbackPlayer = options.fallbackPlayer || null;
  let current = {
    region: defaultRegion,
    playerName: fallbackPlayer,
    rateText: null,
    lines: [],
    explicitPlayer: false,
  };
  const blocks = [];
  let sawBoundary = false;

  function pushCurrent() {
    const text = current.lines.join('\n').trim();
    if (!text && !current.explicitPlayer) return;
    blocks.push({
      region: canonicalRegion(current.region),
      playerName: current.playerName || null,
      rateText: current.rateText || null,
      text,
      hasExplicitPlayer: current.explicitPlayer,
    });
  }

  for (const rawLine of String(rawText || '').replace(/\r\n/g, '\n').split('\n')) {
    const headingRegion = regionFromOnlyLine(rawLine);
    if (headingRegion) {
      pushCurrent();
      current = {
        region: headingRegion,
        playerName: current.playerName || fallbackPlayer,
        rateText: current.rateText || null,
        lines: [],
        explicitPlayer: false,
      };
      sawBoundary = true;
      continue;
    }

    const playerHeading = parsePlayerHeadingLine(rawLine, current.region);
    if (playerHeading) {
      pushCurrent();
      current = {
        region: current.region,
        playerName: playerHeading.playerName,
        rateText: playerHeading.rateText,
        lines: [],
        explicitPlayer: true,
      };
      if (playerHeading.bodyText) current.lines.push(playerHeading.bodyText);
      sawBoundary = true;
      continue;
    }

    current.lines.push(rawLine);
  }

  pushCurrent();
  return {
    sawBoundary,
    blocks,
    lastRegion: blocks.length ? blocks[blocks.length - 1].region : defaultRegion,
  };
}

function blockInputText(block) {
  if (!block.playerName) return block.text || '';
  const rate = block.rateText ? ` (${block.rateText})` : '';
  const body = block.text ? `\n${block.text}` : '';
  return `${block.playerName}${rate}:${body}`;
}

function parseMultiTelegramEnvelope(options = {}) {
  const rawText = String(options.text || '');
  if (/^\s*\//.test(rawText)) return parseTelegramEnvelope(options);

  const split = splitTelegramTextBlocks(rawText, options);
  if (!split.sawBoundary && split.blocks.length <= 1) {
    return parseTelegramEnvelope(options);
  }

  const date = options.date || new Date();
  const allTickets = [];
  const warnings = [];
  const blockSummaries = [];
  let lastParsed = null;
  let lastRegion = split.lastRegion || canonicalRegion(options.region);
  let lastActiveDai = [];
  let lastDefaultDai = [];
  let lastRates = null;

  for (const block of split.blocks) {
    const blockRegion = canonicalRegion(block.region);
    const blockActiveDai = getActiveDai(blockRegion, date);
    const blockDefaultDai = getDefaultBetDai(blockRegion, date, blockActiveDai);
    const parsed = parseTelegramEnvelope({
      ...options,
      text: blockInputText(block),
      region: blockRegion,
      fallbackPlayer: block.playerName || options.fallbackPlayer || null,
      activeDai: blockActiveDai,
      defaultDai: blockDefaultDai,
    });
    const label = `${block.playerName || parsed.playerName || 'chưa rõ người'} / ${getConfig(blockRegion).name}`;
    const blockWarnings = parsed.warnings || [];
    warnings.push(...blockWarnings.map(w => (split.blocks.length > 1 ? `[${label}] ${w}` : w)));
    allTickets.push(...(parsed.tickets || []));
    blockSummaries.push({
      region: blockRegion,
      regionName: getConfig(blockRegion).name,
      playerName: block.playerName || parsed.playerName || null,
      ticketCount: parsed.tickets ? parsed.tickets.length : 0,
      warningCount: blockWarnings.length,
      text: block.text,
    });
    lastParsed = parsed;
    lastRegion = blockRegion;
    lastActiveDai = parsed.activeDai || blockActiveDai;
    lastDefaultDai = parsed.defaultDai || blockDefaultDai;
    lastRates = parsed.rates || lastRates;
  }

  if (!split.blocks.length) return parseTelegramEnvelope(options);

  const uniquePlayers = [...new Set(allTickets.map(t => t.playerName).filter(Boolean))];
  return {
    kind: 'tickets',
    region: lastRegion,
    playerName: uniquePlayers.length === 1 ? uniquePlayers[0] : null,
    hasHeader: Boolean(split.blocks.some(block => block.hasExplicitPlayer)),
    rateText: null,
    activeDai: lastActiveDai,
    defaultDai: lastDefaultDai,
    rates: lastRates,
    tickets: allTickets,
    warnings,
    rawText,
    blocks: blockSummaries,
    blockCount: blockSummaries.length,
    lastParsed,
  };
}

function splitRegionSections(rawText, defaultRegion) {
  let current = { region: canonicalRegion(defaultRegion), lines: [] };
  const sections = [current];
  let sawHeading = false;
  let lastRegion = current.region;
  for (const line of String(rawText || '').split(/\r?\n/)) {
    const headingRegion = regionFromOnlyLine(line);
    if (headingRegion) {
      current = { region: headingRegion, lines: [] };
      sections.push(current);
      sawHeading = true;
      lastRegion = headingRegion;
      continue;
    }
    const inlineRegion = inlineBaoLoRegion(line);
    if (inlineRegion) {
      sections.push({ region: inlineRegion.region, lines: [inlineRegion.text] });
      sawHeading = true;
      lastRegion = inlineRegion.region;
      continue;
    }
    current.lines.push(line);
    if (line.trim()) lastRegion = current.region;
  }
  return {
    sawHeading,
    sections: sections
      .map(section => ({ region: section.region, text: section.lines.join('\n').trim() }))
      .filter(section => section.text),
    lastRegion,
  };
}

function parseTelegramEnvelope(options = {}) {
  let region = canonicalRegion(options.region);
  const rawText = String(options.text || '');
  const command = parseCommand(rawText);
  if (command && command.command !== 'kq') {
    return {
      kind: 'command',
      command,
      region,
      playerName: options.fallbackPlayer || null,
      tickets: [],
      warnings: [],
    };
  }

  const header = extractPlayerHeader(rawText, region);
  const playerName = header.playerName || options.fallbackPlayer || null;
  const playerProfile = playerName && options.playerProfiles ? options.playerProfiles[playerName] : null;
  let bodyText = header.hasHeader ? header.bodyText : rawText;
  const sectioned = splitRegionSections(bodyText, region);
  if (sectioned.sawHeading) {
    const date = options.date || new Date();
    const warnings = [];
    const tickets = [];
    let lastRegion = sectioned.lastRegion || region;
    let lastActiveDai = [];
    let lastDefaultDai = [];
    let lastRates = mergeRates(lastRegion, playerProfile, options.rates);
    if (!playerName && !command) warnings.push('MISSING_PLAYER: cần ghi rõ "người X:" ít nhất một lần trong ngày/chat.');

    for (const section of sectioned.sections) {
      const sectionRegion = canonicalRegion(section.region);
      lastRegion = sectionRegion;
      const headerProfile = header.rateText ? parseRateProfile(header.rateText, sectionRegion) : header.profile;
      const rates = mergeRates(sectionRegion, playerProfile, headerProfile, options.rates);
      const activeDai = getActiveDai(sectionRegion, date);
      const defaultDai = getDefaultBetDai(sectionRegion, date, activeDai);
      const parsed = parseLegacyTickets(section.text, { ...options, region: sectionRegion, playerName, activeDai, defaultDai, rates });
      const activeDaiWarnings = validateTicketsAgainstActiveDai(parsed.tickets, sectionRegion, activeDai);
      tickets.push(...parsed.tickets.filter(ticket => !ticket.invalidDai));
      warnings.push(...(parsed.warnings || []), ...activeDaiWarnings);
      lastActiveDai = activeDai;
      lastDefaultDai = defaultDai;
      lastRates = rates;
    }

    return {
      kind: 'tickets',
      region: lastRegion,
      playerName,
      hasHeader: header.hasHeader,
      rateText: header.rateText || null,
      activeDai: lastActiveDai,
      defaultDai: lastDefaultDai,
      rates: lastRates,
      tickets,
      warnings,
      rawText,
    };
  }

  const regionLine = stripRegionOnlyLines(bodyText, region);
  region = regionLine.region;
  bodyText = regionLine.text;
  const headerProfile = header.rateText ? parseRateProfile(header.rateText, region) : header.profile;
  const rates = mergeRates(region, playerProfile, headerProfile, options.rates);
  const date = options.date || new Date();
  const activeDai = options.activeDai && options.activeDai.length ? options.activeDai : getActiveDai(region, date);
  const defaultDai = options.defaultDai && options.defaultDai.length
    ? options.defaultDai
    : getDefaultBetDai(region, date, activeDai);
  const warnings = [];
  if (!playerName && !command) warnings.push('MISSING_PLAYER: cần ghi rõ "người X:" ít nhất một lần trong ngày/chat.');

  if (command && command.command === 'kq') {
    const resultRegion = command.args[0] ? canonicalRegion(command.args[0]) : region;
    return {
      kind: 'draw_result',
      command,
      region: resultRegion,
      playerName,
      draw: parseDrawResultText(command.body.replace(/^(bac|nam|trung|mb|mn|mt)\b/i, '').trim(), resultRegion),
      tickets: [],
      warnings,
    };
  }

  const parsed = options.llmJson
    ? convertLlmJsonToTickets(options.llmJson, { ...options, region, playerName, activeDai, defaultDai, rates })
    : parseLegacyTickets(bodyText, { ...options, region, playerName, activeDai, defaultDai, rates });
  const activeDaiWarnings = validateTicketsAgainstActiveDai(parsed.tickets, region, activeDai);

  return {
    kind: 'tickets',
    region,
    playerName,
    hasHeader: header.hasHeader,
    rateText: header.rateText || null,
    activeDai,
    defaultDai,
    rates,
    tickets: parsed.tickets.filter(ticket => !ticket.invalidDai),
    warnings: [...warnings, ...(parsed.warnings || []), ...activeDaiWarnings],
    rawText,
  };
}

function convertLlmJsonToTickets(llmJson, options = {}) {
  const region = canonicalRegion(llmJson.region || options.region);
  const date = options.date || new Date();
  const activeDai = options.activeDai && options.activeDai.length ? options.activeDai : getActiveDai(region, date);
  const defaultDai = options.defaultDai && options.defaultDai.length
    ? options.defaultDai
    : getDefaultBetDai(region, date, activeDai);
  const playerName = (llmJson.player && llmJson.player.name) || options.playerName || null;
  const llmProfile = llmJson.player && llmJson.player.rate_text ? parseRateProfile(llmJson.player.rate_text, region) : null;
  const baseRates = mergeRates(region, options.rates, llmProfile);
  const tickets = [];
  const warnings = Array.isArray(llmJson.warnings) ? [...llmJson.warnings] : [];

  for (const raw of llmJson.tickets || []) {
    const loai = normalizeTicketType(raw.type, region);
    if (!loai) {
      warnings.push(`Không hiểu loại vé: ${raw.type}`);
      continue;
    }
    const rateOverride = raw.rate_text ? parseRateProfile(raw.rate_text, region) : null;
    const dais = raw.dais && raw.dais.length ? raw.dais : defaultDai;
    const ticket = makeTicket(raw.numbers || [], loai, Number(raw.points), dais, {
      ...options,
      region,
      playerName,
      activeDai,
      rates: baseRates,
      rateOverride,
      sourceText: raw.source_text || null,
    });
    if (ticket) tickets.push(ticket);
  }
  return { tickets, warnings };
}

function getAllEndings(kq, ndigits, region) {
  const cfg = getConfig(region);
  const out = [];
  cfg.giaiKeys.forEach((key, ki) => {
    if (cfg.minLens[ki] < ndigits) return;
    const vals = kq[key] || [];
    vals.forEach((v, ci) => {
      if (!v) return;
      const padded = String(v).padStart(cfg.minLens[ki], '0');
      out.push({
        val: padded.slice(-ndigits),
        fullVal: padded,
        label: cfg.giaiLabels[ki] + (vals.length > 1 ? String.fromCharCode(97 + ci) : ''),
      });
    });
  });
  return out;
}

function normalizeDrawResults(drawResults, region) {
  const cfg = getConfig(region);
  const out = {};
  for (const [dai, entry] of Object.entries(drawResults || {})) {
    const canonicalDai = normalizeDaiList([dai], region, cfg.defaultActiveDai)[0];
    out[canonicalDai] = {};
    for (const g of cfg.prizeRows) {
      out[canonicalDai][g.key] = (entry[g.key] || []).map(v => String(v).replace(/\D/g, '').padStart(g.ndigits, '0'));
    }
  }
  return out;
}

function addHit(ticket, hit) {
  ticket.ketQua = 'TRÚNG';
  ticket.tienThang += hit.tienThang;
  ticket.hits.push(hit);
  ticket.ghiChu += `${hit.so}${hit.dai ? ` - ${hit.dai}` : ''}|`;
}

function checkTickets(tickets, drawResults, options = {}) {
  const region = canonicalRegion(options.region || (tickets[0] && tickets[0].region));
  const results = normalizeDrawResults(drawResults, region);
  const activeDai = options.activeDai || Object.keys(results);

  return tickets.map(original => {
    const ticket = clone(original);
    ticket.ketQua = 'Trượt';
    ticket.tienThang = 0;
    ticket.ghiChu = '';
    ticket.hits = [];
    const daiList = (Array.isArray(ticket.dai) ? ticket.dai : [ticket.dai]).filter(d => activeDai.includes(d));
    if (daiList.length === 0) {
      ticket.ketQua = 'Chưa có KQ';
      return ticket;
    }

    for (const dai of daiList) {
      const kq = results[dai];
      if (!kq) continue;
      const all2 = getAllEndings(kq, 2, region);
      const all3 = getAllEndings(kq, 3, region);
      const all4 = getAllEndings(kq, 4, region);

      if (['Xien2', 'Xien3', 'Xien4'].includes(ticket.loai)) {
        const all2vals = all2.map(e => e.val);
        const matchedNums = [];
        let allFound = true;
        for (const so of ticket.soList) {
          const so2 = so.padStart(2, '0').slice(-2);
          if (all2vals.includes(so2)) matchedNums.push(so2);
          else allFound = false;
        }
        if (allFound && matchedNums.length === ticket.soList.length) {
          addHit(ticket, {
            so: matchedNums.join(', '),
            dai,
            label: 'Xiên',
            tienThang: ticket.tienDat * ticket.tyLeTrung,
          });
        }
        continue;
      }

      for (const so of ticket.soList) {
        const so2 = so.padStart(2, '0').slice(-2);
        const so3 = so.padStart(3, '0').slice(-3);
        const so4 = so.padStart(4, '0').slice(-4);

        if (ticket.loai === 'Lo') {
          for (const m of all2.filter(e => e.val === so2)) {
            addHit(ticket, { so: m.val, dai, label: m.label, tienThang: ticket.tienDat * ticket.tyLeTrung });
          }
        } else if (ticket.loai === '3Cang') {
          for (const m of all3.filter(e => e.val === so3)) {
            addHit(ticket, { so: m.val, dai, label: m.label, tienThang: ticket.tienDat * ticket.tyLeTrung });
          }
        } else if (ticket.loai === '4Cang') {
          for (const m of all4.filter(e => e.val === so4)) {
            addHit(ticket, { so: m.val, dai, label: m.label, tienThang: ticket.tienDat * ticket.tyLeTrung });
          }
        } else if (region === REGION.BAC) {
          if (ticket.loai === 'Dau' || ticket.loai === 'DauDuoi') {
            for (const g of kq.g7 || []) {
              const dau = String(g).padStart(2, '0').slice(-2);
              if (dau === so2) addHit(ticket, { so: dau, dai, label: 'G7', tienThang: ticket.tienDat * ticket.tyLeTrung });
            }
          }
          if (ticket.loai === 'Duoi' || ticket.loai === 'DauDuoi') {
            const db = kq.db && kq.db[0];
            const duoi = db ? String(db).padStart(5, '0').slice(-2) : null;
            if (duoi === so2) addHit(ticket, { so: duoi, dai, label: 'ĐB', tienThang: ticket.tienDat * ticket.tyLeTrung });
          }
          if (ticket.loai === 'Dau3C' || ticket.loai === 'DauDuoi3C') {
            for (const g of kq.g6 || []) {
              const dau3c = String(g).padStart(3, '0').slice(-3);
              if (dau3c === so3) addHit(ticket, { so: dau3c, dai, label: 'G6', tienThang: ticket.tienDat * ticket.tyLeTrung });
            }
          }
          if (ticket.loai === 'Duoi3C' || ticket.loai === 'DauDuoi3C') {
            const db = kq.db && kq.db[0];
            const duoi3c = db ? String(db).padStart(5, '0').slice(-3) : null;
            if (duoi3c === so3) addHit(ticket, { so: duoi3c, dai, label: 'ĐB', tienThang: ticket.tienDat * ticket.tyLeTrung });
          }
        } else {
          if (ticket.loai === 'Dau' || ticket.loai === 'DauDuoi') {
            const g8 = kq.g8 && kq.g8[0];
            const dau = g8 ? String(g8).padStart(2, '0').slice(-2) : null;
            if (dau === so2) addHit(ticket, { so: dau, dai, label: 'G8', tienThang: ticket.tienDat * ticket.tyLeTrung });
          }
          if (ticket.loai === 'Duoi' || ticket.loai === 'DauDuoi') {
            const db = kq.db && kq.db[0];
            const duoi = db ? String(db).padStart(6, '0').slice(-2) : null;
            if (duoi === so2) addHit(ticket, { so: duoi, dai, label: 'ĐB', tienThang: ticket.tienDat * ticket.tyLeTrung });
          } else if (['XiuChu', 'XiuChuDau', 'XiuChuDuoi'].includes(ticket.loai)) {
            const g7 = kq.g7 && kq.g7[0];
            const db = kq.db && kq.db[0];
            const dau3 = g7 ? String(g7).padStart(3, '0').slice(-3) : null;
            const duoi3 = db ? String(db).padStart(6, '0').slice(-3) : null;
            if ((ticket.loai === 'XiuChuDau' || ticket.loai === 'XiuChu') && dau3 === so3) {
              addHit(ticket, { so: dau3, dai, label: 'G7', tienThang: ticket.tienDat * ticket.tyLeTrung });
            }
            if ((ticket.loai === 'XiuChuDuoi' || ticket.loai === 'XiuChu') && duoi3 === so3) {
              addHit(ticket, { so: duoi3, dai, label: 'ĐB', tienThang: ticket.tienDat * ticket.tyLeTrung });
            }
          }
        }
      }
    }
    return ticket;
  });
}

function detectDaisFromText(lines, region) {
  const cfg = getConfig(region);
  if (cfg.region === REGION.BAC) return ['Miền Bắc'];
  for (let i = 0; i < Math.min(15, lines.length); i++) {
    const line = normalizeVN(lines[i]);
    const rowDais = [];
    for (const [alias, dai] of Object.entries(cfg.daiAlias)) {
      const idx = line.indexOf(alias);
      if (idx !== -1) rowDais.push({ name: dai, idx });
    }
    if (rowDais.length > 0) {
      rowDais.sort((a, b) => a.idx - b.idx);
      return [...new Set(rowDais.map(r => r.name))].slice(0, 4);
    }
  }
  return [...cfg.defaultActiveDai];
}

function chunkLongNumber(value, len) {
  const out = [];
  const raw = String(value || '').replace(/\D/g, '');
  if (raw.length > len && raw.length % len === 0) {
    for (let i = 0; i < raw.length; i += len) out.push(raw.slice(i, i + len));
    return out;
  }
  return raw ? [raw] : [];
}

function parseDrawResultText(text, region = REGION.NAM) {
  const cfg = getConfig(region);
  const htmlDraw = parseDrawResultHtml(text, cfg);
  if (htmlDraw && hasUsableDrawResults(cfg, htmlDraw.results)) return htmlDraw;

  const lines = String(text || '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);
  const activeDai = detectDaisFromText(lines, region);
  const results = Object.fromEntries(activeDai.map(d => [d, {}]));
  const prizeMap = {
    'dac biet': 'db',
    db: 'db',
    'giai nhat': 'g1',
    'giai 1': 'g1',
    g1: 'g1',
    'giai nhi': 'g2',
    'giai 2': 'g2',
    g2: 'g2',
    'giai ba': 'g3',
    'giai 3': 'g3',
    g3: 'g3',
    'giai tu': 'g4',
    'giai 4': 'g4',
    g4: 'g4',
    'giai nam': 'g5',
    'giai 5': 'g5',
    g5: 'g5',
    'giai sau': 'g6',
    'giai 6': 'g6',
    g6: 'g6',
    'giai bay': 'g7',
    'giai 7': 'g7',
    g7: 'g7',
    'giai tam': 'g8',
    'giai 8': 'g8',
    g8: 'g8',
  };
  const countMap = Object.fromEntries(cfg.prizeRows.map(g => [g.key, g.count]));
  const lenMap = Object.fromEntries(cfg.prizeRows.map(g => [g.key, g.ndigits]));
  let currentPrize = null;
  let prizeNumCount = 0;

  for (const rawLine of lines) {
    let line = normalizeVN(rawLine);
    let matchedPrize = null;
    for (const [name, key] of Object.entries(prizeMap)) {
      if (line.startsWith(name) || (line.includes(name) && line.length < name.length + 24)) {
        matchedPrize = key;
        line = line.replace(name, ' ').trim();
        break;
      }
    }
    if (matchedPrize) {
      currentPrize = matchedPrize;
      prizeNumCount = 0;
    }
    if (!currentPrize) continue;
    const expectedLen = lenMap[currentPrize] || 2;
    const nums = (line.match(/\d+/g) || []).flatMap(n => chunkLongNumber(n, expectedLen)).filter(n => n.length >= 2);
    if (nums.length === 0) continue;

    for (const num of nums) {
      const gCount = countMap[currentPrize] || 1;
      const daiIndex = activeDai.length === 1 ? 0 : Math.min(activeDai.length - 1, Math.floor(prizeNumCount / gCount));
      const dai = activeDai[daiIndex];
      if (!results[dai][currentPrize]) results[dai][currentPrize] = [];
      results[dai][currentPrize].push(num.slice(-expectedLen).padStart(expectedLen, '0'));
      prizeNumCount++;
    }
  }
  return { activeDai, results: normalizeDrawResults(results, region) };
}

function parseDrawResultHtml(text, cfg) {
  const html = String(text || '');
  if (!/<table[\s>]/i.test(html)) return null;
  return cfg.region === REGION.BAC ? parseSingleStationHtmlDraw(html, cfg) : parseMultiStationHtmlDraw(html, cfg);
}

function parseSingleStationHtmlDraw(html, cfg) {
  const table = firstMatch(html, /<table[^>]*class=["'][^"']*(?:kqmb|colgiai)[^"']*["'][^>]*>[\s\S]*?<\/table>/i);
  if (!table) return null;
  const station = cfg.daiList[0];
  const results = { [station]: {} };
  for (const row of matchHtml(table, /<tr[^>]*>[\s\S]*?<\/tr>/gi)) {
    const cells = htmlCells(row);
    if (cells.length < 2) continue;
    const key = prizeKeyFromLabel(stripHtml(cells[0]));
    if (!key) continue;
    const nums = cells.slice(1).flatMap(extractHtmlNumbers);
    if (nums.length) results[station][key] = nums;
  }
  return { activeDai: [station], results: normalizeDrawResults(results, cfg.region) };
}

function parseMultiStationHtmlDraw(html, cfg) {
  const table = firstMatch(html, /<table[^>]*class=["'][^"']*(?:col(?:two|three|four)city|badai)[^"']*colgiai[^"']*["'][^>]*>[\s\S]*?<\/table>/i);
  if (!table) return null;
  const rows = matchHtml(table, /<tr[^>]*>[\s\S]*?<\/tr>/gi);
  const header = rows.find(row => /<th[\s>]/i.test(row));
  if (!header) return null;
  const headerCells = htmlCells(header);
  const stations = headerCells.slice(1).map(cell => detectDai(stripHtml(cell), cfg.region) || stripHtml(cell)).filter(Boolean);
  if (!stations.length) return null;

  const results = Object.fromEntries(stations.map(station => [station, {}]));
  for (const row of rows) {
    if (row === header) continue;
    const cells = htmlCells(row);
    if (cells.length < 2) continue;
    const key = prizeKeyFromLabel(stripHtml(cells[0]));
    if (!key) continue;
    for (let i = 0; i < stations.length; i++) {
      const nums = extractHtmlNumbers(cells[i + 1] || '');
      if (nums.length) results[stations[i]][key] = nums;
    }
  }
  return { activeDai: stations, results: normalizeDrawResults(results, cfg.region) };
}

function hasUsableDrawResults(cfg, results) {
  const requiredKeys = cfg.prizeRows.map(row => row.key);
  return Object.values(results || {}).some(prizes => requiredKeys.every(key => Array.isArray(prizes[key]) && prizes[key].length > 0));
}

function firstMatch(value, regex) {
  const match = String(value || '').match(regex);
  return match ? match[0] : '';
}

function matchHtml(value, regex) {
  return [...String(value || '').matchAll(regex)].map(match => match[0]);
}

function htmlCells(rowHtml) {
  return matchHtml(rowHtml, /<t[dh][^>]*>[\s\S]*?<\/t[dh]>/gi).map(cell => cell.replace(/^<t[dh][^>]*>/i, '').replace(/<\/t[dh]>$/i, ''));
}

function stripHtml(html) {
  return decodeHtmlEntities(String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeHtmlEntities(value) {
  return String(value || '')
    .replace(/&zwj;|&#8205;/gi, '')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'");
}

function extractHtmlNumbers(html) {
  return (stripHtml(html).match(/\d+/g) || []).map(num => num.trim()).filter(Boolean);
}

function prizeKeyFromLabel(label) {
  const normalized = normalizeVN(label).replace(/\s+/g, ' ').trim();
  if (!normalized || normalized.includes('ma db')) return null;
  if (/^(db|dac biet)$/.test(normalized)) return 'db';
  const compact = normalized.replace(/\s+/g, '');
  const match = compact.match(/^g(?:iai)?([1-8])$/);
  return match ? `g${match[1]}` : null;
}

function summarizeTickets(tickets) {
  const byPlayer = new Map();
  for (const ticket of tickets) {
    const player = ticket.playerName || 'Chưa rõ người';
    if (!byPlayer.has(player)) {
      byPlayer.set(player, { playerName: player, tickets: [], tongXac: 0, tongTrung: 0, laiLo: 0, soVe: 0, soVeTrung: 0 });
    }
    const row = byPlayer.get(player);
    row.tickets.push(ticket);
    row.tongXac += Number(ticket.xac || ticket.tong || 0);
    row.tongTrung += Number(ticket.tienThang || 0);
    row.soVe++;
    if (ticket.ketQua === 'TRÚNG') row.soVeTrung++;
  }
  for (const row of byPlayer.values()) row.laiLo = row.tongTrung - row.tongXac;
  return [...byPlayer.values()];
}

function formatMoney(value) {
  return Math.round(Number(value || 0)).toLocaleString('vi-VN');
}

function formatIngestAck(parsed) {
  if (parsed.kind === 'command') return `Đã nhận lệnh /${parsed.command.command}.`;
  if (parsed.kind === 'draw_result') {
    const dais = parsed.draw ? parsed.draw.activeDai.join(', ') : '';
    return `Đã nhận KQ ${getConfig(parsed.region).name}${dais ? `: ${dais}` : ''}.`;
  }
  if (parsed.blocks && parsed.blocks.length > 1) {
    const tongXacBlocks = parsed.tickets.reduce((sum, t) => sum + Number(t.xac || 0), 0);
    const warningsBlocks = parsed.warnings && parsed.warnings.length ? `\nCảnh báo:\n${parsed.warnings.map(w => `- ${w}`).join('\n')}` : '';
    const blockLines = parsed.blocks
      .map(block => `- ${block.playerName || 'chưa rõ người'} / ${block.regionName}: ${block.ticketCount} vé`)
      .join('\n');
    return [
      `Đã đọc: ${parsed.tickets.length} vé từ ${parsed.blocks.length} block`,
      `Tổng xác tạm: ${formatMoney(tongXacBlocks)}`,
      blockLines,
      warningsBlocks,
    ]
      .filter(Boolean)
      .join('\n');
  }
  const tongXac = parsed.tickets.reduce((sum, t) => sum + Number(t.xac || 0), 0);
  const warnings = parsed.warnings && parsed.warnings.length ? `\nCảnh báo:\n${parsed.warnings.map(w => `- ${w}`).join('\n')}` : '';
  if (parsed.hasHeader && parsed.playerName && parsed.tickets.length === 0 && !warnings) {
    return [
      `Đã chọn người: ${parsed.playerName}`,
      `Miền: ${getConfig(parsed.region).name}`,
      'Các tin sau trong chat này sẽ gán cho người này.',
    ].join('\n');
  }
  return [
    `Người: ${parsed.playerName || 'chưa rõ'}`,
    `Miền: ${getConfig(parsed.region).name}`,
    `Đã đọc: ${parsed.tickets.length} vé`,
    warnings,
  ]
    .filter(Boolean)
    .join('\n');
}

function formatPlayerReport(summary) {
  const diff = Number(summary.laiLo || 0);
  const status = diff > 0 ? `Bù ${formatMoney(diff)}` : diff < 0 ? `Thu ${formatMoney(Math.abs(diff))}` : 'Hòa 0';
  return [
    `KẾT QUẢ - ${summary.playerName}`,
    `Xác: ${formatMoney(summary.tongXac)}`,
    `Thắng: ${formatMoney(summary.tongTrung)}`,
    `Lãi/lỗ: ${formatMoney(diff)} (${status})`,
  ].join('\n');
}

function splitTelegramMessages(text, limit = 3900) {
  const chunks = [];
  let current = '';
  for (const line of String(text || '').split('\n')) {
    if ((current + line + '\n').length > limit) {
      if (current) chunks.push(current.trimEnd());
      current = '';
    }
    current += line + '\n';
  }
  if (current.trim()) chunks.push(current.trimEnd());
  return chunks;
}

function buildGroqMessages(rawText, context = {}) {
  const region = canonicalRegion(context.region);
  const cfg = getConfig(region);
  const activeDai = context.activeDai || getActiveDai(region, context.date || new Date());
  const defaultDai = context.defaultDai || getDefaultBetDai(region, context.date || new Date(), activeDai);
  return [
    {
      role: 'system',
      content:
        'Bạn là bộ chuyển đổi tin dò xổ số sang JSON. Chỉ trích xuất dữ liệu, không tính tiền, không suy diễn kết quả. ' +
        'Giữ số có số 0 đầu. Loại vé hợp lệ gồm: ' +
        Object.keys(cfg.heSoXacDefault).join(', ') +
        '. Quy ước: b/bl/blo là bao lô, không phải Bạc Liêu; Bạc Liêu có thể viết bac lieu/blieu/b lieu/bli. ' +
        'dd/đđ/dau duoi/dau cui là đầu đuôi. 1đ/2đ/3đ/4đ, 1 đài/2 đài/3 đài/4 đài là số lượng đài; nếu nằm trong ngoặc chỉ áp dụng trong ngoặc, nếu ở cuối dòng áp dụng cho cả dòng. ' +
        'Số tiền sau số hoặc loại vé có thể viết n/d/đ/k/m/trieu; ví dụ 23b100 là số 23 bao lô 100 điểm. ' +
        'Kéo/đến phải mở rộng dãy số: 123 đến 923 là 123,223,...,923; 101 đến 109 là 101,...,109; 02 đến 92 là 02,12,...,92. ' +
        'Nếu không chắc, đưa cảnh báo ngắn cho người dùng, không nhắc tên Groq/LLM.',
    },
    {
      role: 'user',
      content: `Miền mặc định: ${cfg.name}\nĐài trong ngày: ${activeDai.join(', ')}\nĐài mặc định nếu tin không ghi đài: ${defaultDai.join(', ')}\nTin gốc:\n${rawText}`,
    },
  ];
}

module.exports = {
  REGION,
  CONFIGS,
  LLM_TICKET_SCHEMA,
  normalizeVN,
  canonicalRegion,
  getConfig,
  getActiveDai,
  getMainDai,
  getDefaultBetDai,
  defaultRates,
  mergeRates,
  normalizeHeSoShortcut,
  parseRateProfile,
  extractPlayerHeader,
  parsePlayerHeadingLine,
  splitTelegramTextBlocks,
  normalizeTicketType,
  parseLegacyTickets,
  parseTelegramEnvelope,
  parseMultiTelegramEnvelope,
  convertLlmJsonToTickets,
  makeTicket,
  getAllEndings,
  normalizeDrawResults,
  checkTickets,
  parseDrawResultText,
  summarizeTickets,
  formatMoney,
  formatIngestAck,
  formatPlayerReport,
  splitTelegramMessages,
  buildGroqMessages,
};
