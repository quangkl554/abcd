'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const core = require('../src/lib/xoso-core.cjs');

test('parse simple player header rate as 2c shortcut', () => {
  const header = core.extractPlayerHeader('người 1 (700,700):\n61 68b 75n', 'nam');
  assert.equal(header.playerName, 'người 1');
  assert.equal(header.profile.heSoXac.Lo, 700);
  assert.equal(header.profile.tyLe.Lo, 70000);
  assert.equal(header.profile.heSoXac['3Cang'], undefined);
});

test('parse standalone player header without colon', () => {
  const header = core.extractPlayerHeader('nguoi 3 (700,700)', 'nam');
  assert.equal(header.playerName, 'nguoi 3');
  assert.equal(header.bodyText, '');
  assert.equal(header.profile.heSoXac.Lo, 700);
});

test('parse inline rate group before parenthesized rate', () => {
  const header = core.extractPlayerHeader('nguoi 1 2c (700,700)', 'nam');
  assert.equal(header.playerName, 'nguoi 1');
  assert.equal(header.rateText, '2c=700,700');
  assert.equal(header.profile.heSoXac.Lo, 700);

  const threeC = core.extractPlayerHeader('nguoi 1 3c (690,6000)', 'nam');
  assert.equal(threeC.playerName, 'nguoi 1');
  assert.equal(threeC.profile.heSoXac['3Cang'], 690);
  assert.equal(threeC.profile.tyLe['3Cang'], 600000);
  assert.equal(threeC.profile.heSoXac.Lo, undefined);
});

test('parse detailed rate profile by groups', () => {
  const profile = core.parseRateProfile('2c=700/700, 3c=690/6000, xc=680/5500', 'nam');
  assert.equal(profile.heSoXac.Lo, 700);
  assert.equal(profile.tyLe.Lo, 70000);
  assert.equal(profile.heSoXac['3Cang'], 690);
  assert.equal(profile.tyLe['3Cang'], 600000);
  assert.equal(profile.heSoXac.XiuChu, 680);
  assert.equal(profile.tyLe.XiuChu, 550000);
});

test('parse detailed rate profile with comma separators', () => {
  const profile = core.parseRateProfile('2c=700,700 3c=690,6000 xc=700,5500', 'nam');
  assert.equal(profile.heSoXac.Lo, 700);
  assert.equal(profile.tyLe.Lo, 70000);
  assert.equal(profile.heSoXac['3Cang'], 690);
  assert.equal(profile.tyLe['3Cang'], 600000);
  assert.equal(profile.heSoXac.XiuChu, 700);
  assert.equal(profile.tyLe.XiuChu, 550000);
});

test('parse shortened display rate profile without changing numeric meaning', () => {
  const profile = core.parseRateProfile('2c=70,70 3c=69,600 xc=70,550', 'nam');
  assert.equal(profile.heSoXac.Lo, 700);
  assert.equal(profile.tyLe.Lo, 70000);
  assert.equal(profile.heSoXac['3Cang'], 690);
  assert.equal(profile.tyLe['3Cang'], 600000);
  assert.equal(profile.heSoXac.XiuChu, 700);
  assert.equal(profile.tyLe.XiuChu, 550000);

  const header = core.extractPlayerHeader('nguoi 1 2c (70,70)', 'nam');
  assert.equal(header.playerName, 'nguoi 1');
  assert.equal(header.rateText, '2c=70,70');
  assert.equal(header.profile.heSoXac.Lo, 700);
  assert.equal(header.profile.tyLe.Lo, 70000);
});

test('rate profile can override coefficients by region', () => {
  const profile = {
    byRegion: {
      nam: { heSoXac: { Lo: 720 }, tyLe: {} },
      bac: { heSoXac: { Lo: 820, '3Cang': 720 }, tyLe: {} },
    },
  };
  assert.equal(core.mergeRates('nam', profile).heSoXac.Lo, 720);
  assert.equal(core.mergeRates('bac', profile).heSoXac.Lo, 820);
  assert.equal(core.mergeRates('bac', profile).heSoXac['3Cang'], 720);
});

test('regional default xac coefficients stay isolated', () => {
  const bac = core.defaultRates('bac');
  const nam = core.defaultRates('nam');
  const trung = core.defaultRates('trung');

  assert.equal(bac.heSoXac.Lo, 800);
  assert.equal(bac.heSoXac.DauDuoi, 800);
  assert.equal(bac.heSoXac.Dau, 800);
  assert.equal(bac.heSoXac.Duoi, 800);
  assert.equal(bac.heSoXac['3Cang'], 700);
  assert.equal(bac.heSoXac['4Cang'], 700);
  assert.equal(bac.tyLe.Lo, 80000);
  assert.equal(bac.tyLe.DauDuoi, 80000);
  assert.equal(bac.tyLe['3Cang'], 600000);

  assert.equal(nam.heSoXac.Lo, 700);
  assert.equal(nam.heSoXac.DauDuoi, 700);
  assert.equal(trung.heSoXac.Lo, 700);
  assert.equal(trung.heSoXac.DauDuoi, 700);

  const legacyShared = { heSoXac: { Lo: 720, DauDuoi: 720 }, tyLe: { Lo: 72000 } };
  assert.equal(core.mergeRates('nam', legacyShared).heSoXac.Lo, 720);
  assert.equal(core.mergeRates('trung', legacyShared).heSoXac.Lo, 720);
  assert.equal(core.mergeRates('bac', legacyShared).heSoXac.Lo, 800);

  const bacScoped = { byRegion: { bac: { heSoXac: { Lo: 820 }, tyLe: { Lo: 82000 } } } };
  assert.equal(core.mergeRates('bac', bacScoped).heSoXac.Lo, 820);
});

test('parse one Telegram message split by nam trung bac headings', () => {
  const rates = {
    byRegion: {
      nam: { heSoXac: { Lo: 720 }, tyLe: {} },
      trung: { heSoXac: { Lo: 720 }, tyLe: {} },
      bac: { heSoXac: { Lo: 820 }, tyLe: {} },
    },
  };
  const parsed = core.parseTelegramEnvelope({
    text: 'nguoi 2:\nnam\nb 39 10n\ntrung\nb 78 5n\nbac\nbao 61 10d',
    region: 'nam',
    rates,
    date: new Date(2026, 4, 12),
  });

  assert.equal(parsed.tickets.length, 3);
  assert.deepEqual(parsed.tickets.map(t => t.region), ['nam', 'trung', 'bac']);
  assert.deepEqual(parsed.tickets.map(t => t.heSoXac), [720, 720, 820]);
});

test('parse one Telegram message split by region and player headings', () => {
  const parsed = core.parseMultiTelegramEnvelope({
    text: 'nam\nngười 1\nb 12 10n\ntrung\nngười 2\nb 34 20n',
    region: 'nam',
    date: new Date(2026, 4, 12),
  });

  assert.equal(parsed.tickets.length, 2);
  assert.deepEqual(parsed.tickets.map(t => t.playerName), ['người 1', 'người 2']);
  assert.deepEqual(parsed.tickets.map(t => t.region), ['nam', 'trung']);
  assert.deepEqual(parsed.tickets.map(t => t.soList), [['12'], ['34']]);
  assert.equal(parsed.blocks.length, 2);
});

test('parse Telegram envelope with legacy free-form southern ticket text', () => {
  const parsed = core.parseTelegramEnvelope({
    text: 'người 1 (700,700):\n61 68b 75n dd 280n 061 068 261 268b 10n xc 75n',
    region: 'nam',
    activeDai: ['TP.HCM', 'Đồng Tháp', 'Cà Mau'],
    idFactory: (() => {
      let i = 0;
      return () => `t${++i}`;
    })(),
  });

  assert.equal(parsed.playerName, 'người 1');
  assert.equal(parsed.tickets.length, 4);
  assert.deepEqual(
    parsed.tickets.map(t => t.loai),
    ['Lo', 'DauDuoi', '3Cang', 'XiuChu'],
  );
  assert.equal(parsed.tickets[0].xac, 75 * 2 * 18 * 700);
  assert.equal(parsed.tickets[1].xac, 280 * 2 * 2 * 700);
  assert.equal(parsed.tickets[2].tyLeTrung, 600000);
});

test('parse Telegram envelope ignores standalone region line', () => {
  const parsed = core.parseTelegramEnvelope({
    text: 'nguoi 1 (700,700):\nnam\nlo 12 34 10d',
    region: 'bac',
    activeDai: ['TP.HCM', 'Dong Thap', 'Ca Mau'],
  });

  assert.equal(parsed.region, 'nam');
  assert.equal(parsed.playerName, 'nguoi 1');
  assert.equal(parsed.tickets.length, 1);
  assert.equal(parsed.warnings.some(w => w.includes('"nam"')), false);
});

test('parse split Telegram ticket using fallback active player and rates', () => {
  const active = core.parseTelegramEnvelope({
    text: 'nguoi 3 (700,700)',
    region: 'nam',
    activeDai: ['TP.HCM'],
  });
  const parsed = core.parseTelegramEnvelope({
    text: 'b 11 22 33 123 50n',
    region: 'nam',
    fallbackPlayer: active.playerName,
    rates: active.rates,
    activeDai: ['TP.HCM'],
  });

  assert.equal(active.playerName, 'nguoi 3');
  assert.equal(active.tickets.length, 0);
  assert.equal(parsed.playerName, 'nguoi 3');
  assert.equal(parsed.tickets.length, 2);
  assert.equal(parsed.tickets[0].heSoXac, 700);
  assert.equal(parsed.warnings.some(w => w.includes('MISSING_PLAYER')), false);
});

test('parse compact type tokens like b123 and dd100n', () => {
  const first = core.parseTelegramEnvelope({
    text: 'nguoi 3 (700,700):\nb 12 13 14 51 50n dd100n',
    region: 'nam',
    activeDai: ['TP.HCM'],
  });
  assert.deepEqual(first.tickets.map(t => t.loai), ['Lo', 'DauDuoi']);
  assert.equal(first.tickets[1].tienDat, 100);
  assert.deepEqual(first.tickets[1].soList, ['12', '13', '14', '51']);
  assert.deepEqual(first.warnings, []);

  const second = core.parseTelegramEnvelope({
    text: 'nguoi 3 (700,700):\nb123 424 482 428 3n dd 10n',
    region: 'nam',
    activeDai: ['TP.HCM'],
  });
  assert.deepEqual(second.tickets.map(t => t.loai), ['3Cang', 'XiuChu']);
  assert.deepEqual(second.tickets[0].soList, ['123', '424', '482', '428']);
  assert.deepEqual(second.warnings, []);
});

test('parse compact money/type tokens like 15ndd and dau1trieu', () => {
  const splitMoneyType = core.parseTelegramEnvelope({
    text: 'nguoi 1:\nb 17 69 15ndd 40n',
    region: 'nam',
    activeDai: ['TP.HCM'],
  });
  assert.deepEqual(splitMoneyType.tickets.map(t => t.loai), ['Lo', 'DauDuoi']);
  assert.deepEqual(splitMoneyType.tickets.map(t => t.tienDat), [15, 40]);
  assert.deepEqual(splitMoneyType.warnings, []);

  const millionStake = core.parseTelegramEnvelope({
    text: 'nguoi 1:\n70dau1trieu',
    region: 'nam',
    activeDai: ['TP.HCM'],
  });
  assert.equal(millionStake.tickets.length, 1);
  assert.equal(millionStake.tickets[0].loai, 'Dau');
  assert.equal(millionStake.tickets[0].tienDat, 1000);
  assert.deepEqual(millionStake.tickets[0].soList, ['70']);
});

test('parse dotted shorthand stakes without leaking stake into next ticket', () => {
  const inlineStake = core.parseTelegramEnvelope({
    text: 'nguoi 1:\n10b 100n 01b 50. Đầu 10 01 200n 101 110 b 6n 610 b 28n 601b 10n',
    region: 'nam',
    activeDai: ['Bình Dương'],
  });

  assert.equal(inlineStake.tickets.length, 6);
  assert.deepEqual(inlineStake.tickets[1].soList, ['01']);
  assert.equal(inlineStake.tickets[1].loai, 'Lo');
  assert.equal(inlineStake.tickets[1].tienDat, 50);
  assert.equal(inlineStake.tickets[1].xac, 630000);
  assert.deepEqual(inlineStake.tickets[2].soList, ['10', '01']);
  assert.equal(inlineStake.tickets[2].loai, 'Dau');
  assert.equal(inlineStake.tickets[2].tienDat, 200);
  assert.equal(inlineStake.tickets[2].xac, 280000);

  const endingStake = core.parseTelegramEnvelope({
    text: 'nguoi 1:\n2đ phụ 17 71 13 31b 50n dd 17 280n 73 380n 84 62 b 35n dd 120.',
    region: 'nam',
    date: new Date(2026, 4, 29),
  });
  const dd = endingStake.tickets.find(t => t.loai === 'DauDuoi' && t.soList.join('|') === '84|62');
  assert.ok(dd);
  assert.equal(dd.tienDat, 120);
  assert.equal(dd.xac, 672000);
});

test('range ending before glued type token expands before ticket type is applied', () => {
  const parsed = core.parseTelegramEnvelope({
    text: 'nguoi 1:\n02b 120n dd 600n 002 den 902dd 75n',
    region: 'nam',
    activeDai: ['Bình Dương'],
  });

  const xiuChu = parsed.tickets.find(t => t.loai === 'XiuChu');
  assert.ok(xiuChu);
  assert.deepEqual(xiuChu.soList, ['002', '102', '202', '302', '402', '502', '602', '702', '802', '902']);
  assert.equal(xiuChu.tienDat, 75);
  assert.equal(xiuChu.xac, 1050000);
});

test('parse glued stake/type/stake tokens like 30ndd40n', () => {
  const parsed = core.parseTelegramEnvelope({
    text: 'nguoi 1:\nb 72 32 30ndd40n',
    region: 'nam',
    activeDai: ['Vung Tau'],
  });

  assert.deepEqual(parsed.tickets.map(t => t.loai), ['Lo', 'DauDuoi']);
  assert.deepEqual(parsed.tickets.map(t => t.tienDat), [30, 40]);
  assert.deepEqual(parsed.tickets[1].soList, ['72', '32']);
  assert.deepEqual(parsed.warnings, []);
});

test('parse phu as southern side stations excluding main station', () => {
  const parsed = core.parseTelegramEnvelope({
    text: 'nguoi 1:\n2d phu 10 50 90b 50n dui 90 250n',
    region: 'nam',
    date: new Date(2026, 4, 12),
  });

  assert.deepEqual(parsed.tickets.map(t => t.dai), [
    ['Bến Tre', 'Bạc Liêu'],
    ['Bến Tre', 'Bạc Liêu'],
  ]);
  assert.deepEqual(parsed.tickets.map(t => t.loai), ['Lo', 'Duoi']);
  assert.deepEqual(parsed.warnings, []);
});

test('trailing station aliases apply to already parsed tickets in the line', () => {
  const parsed = core.parseTelegramEnvelope({
    text: 'nguoi 1:\n08 48 88b 40n dd 48 84 160n vt btr',
    region: 'nam',
    date: new Date(2026, 4, 12),
  });

  assert.deepEqual(parsed.tickets.map(t => t.dai), [
    ['Vũng Tàu', 'Bến Tre'],
    ['Vũng Tàu', 'Bến Tre'],
  ]);
  assert.deepEqual(parsed.tickets.map(t => t.xac), [3024000, 896000]);
  assert.deepEqual(parsed.warnings, []);
});

test('plus-separated station aliases and trailing bli are treated as stations', () => {
  const plus = core.parseTelegramEnvelope({
    text: 'nguoi 1:\nBlo -BT+ bli .72.100n..',
    region: 'nam',
    date: new Date(2026, 4, 12),
  });
  assert.deepEqual(plus.tickets[0].dai, ['Bến Tre', 'Bạc Liêu']);

  const trailing = core.parseTelegramEnvelope({
    text: 'nguoi 1:\nBl 27 67 b 35n dui 90 300n bli',
    region: 'nam',
    date: new Date(2026, 4, 12),
  });
  assert.deepEqual(trailing.tickets.map(t => t.dai), [['Bạc Liêu'], ['Bạc Liêu']]);
  assert.deepEqual(trailing.tickets.map(t => t.loai), ['Lo', 'Duoi']);

  const leading = core.parseTelegramEnvelope({
    text: 'nguoi 1:\nbli b 12 10n dd 34 20n',
    region: 'nam',
    date: new Date(2026, 4, 12),
  });
  assert.deepEqual(leading.tickets.map(t => t.dai), [['Bạc Liêu'], ['Bạc Liêu']]);
  assert.deepEqual(leading.tickets.map(t => t.loai), ['Lo', 'DauDuoi']);
});

test('bl after station remains bao lo instead of Bac Lieu alias', () => {
  const date = new Date(2026, 5, 5);
  const activeDai = core.getActiveDai('nam', date);
  const parsed = core.parseTelegramEnvelope({
    text: 'nguoi 1:\nbd bl 12 100n',
    region: 'nam',
    date,
  });

  assert.deepEqual(parsed.warnings, []);
  assert.equal(parsed.tickets.length, 1);
  assert.equal(parsed.tickets[0].loai, 'Lo');
  assert.deepEqual(parsed.tickets[0].dai, [activeDai[1]]);
  assert.deepEqual(parsed.tickets[0].soList, ['12']);
  assert.equal(parsed.tickets[0].tienDat, 100);
});

test('trailing str alias moves parsed tickets to Soc Trang without default duplicate', () => {
  const date = new Date(2026, 4, 27);
  const activeDai = core.getActiveDai('nam', date);
  assert.deepEqual(activeDai, ['Đồng Nai', 'Cần Thơ', 'Sóc Trăng']);

  const parsed = core.parseTelegramEnvelope({
    text: 'nguoi 1:\n21 61 01 41 81b 40n 27 67b 60n 13 53 93 33 73b 40n dui 120n 06 60 20b 35n dd 06 60 180n str\n11 51 91b 60n dd 180n str',
    region: 'nam',
    date,
  });

  assert.equal(parsed.tickets.length, 8);
  assert.deepEqual(parsed.tickets.map(t => t.dai), parsed.tickets.map(() => ['Sóc Trăng']));
  assert.equal(parsed.tickets.some(t => t.dai.includes('Đồng Nai')), false);
  assert.equal(parsed.warnings.some(w => w.includes('"str"')), false);
});

test('parse glued station aliases and double b compact lo token', () => {
  const date = new Date(2026, 4, 26);
  const activeDai = core.getActiveDai('nam', date);
  const gluedDai = core.parseTelegramEnvelope({
    text: 'nguoi 1:\n3d 16 56 96b 60n dd 120n ( bli05 45 85b 100n dd 85 380n 05 45 95 180n 40 80b 50n 01 41 81b 40n 71 31 13b 50n dui 19 91 71 90 49 160n 17 57 97 b 120n dd 85 95 280n dui 97 57 260n 17 80n)',
    region: 'nam',
    date,
  });
  assert.deepEqual(gluedDai.tickets.slice(0, 2).map(t => t.dai), [activeDai, activeDai]);
  assert.deepEqual(gluedDai.tickets.slice(2).map(t => t.dai), gluedDai.tickets.slice(2).map(() => [activeDai[2]]));
  assert.deepEqual(gluedDai.tickets[2].soList, ['05', '45', '85']);

  const doubleB = core.parseTelegramEnvelope({
    text: 'nguoi 1:\n38 78bb75n dui 380n dau 120n',
    region: 'nam',
    date,
  });
  assert.deepEqual(doubleB.tickets.map(t => t.loai), ['Lo', 'Duoi', 'Dau']);
  assert.deepEqual(doubleB.tickets.map(t => t.soList), [
    ['38', '78'],
    ['38', '78'],
    ['38', '78'],
  ]);

  const gluedNumberStake = core.parseTelegramEnvelope({
    text: 'nguoi 1:\nTn ag 58 85 18 81 14 41b 50n dd 75n 44 43 b 50n 844 843b 10n xc 75n 8844 4844b 5n 8843n 10n',
    region: 'nam',
    date: new Date(2026, 4, 28),
  });
  const fourCang = gluedNumberStake.tickets.filter(t => t.loai === '4Cang');
  assert.equal(gluedNumberStake.tickets.some(t => t.xac > 100_000_000), false);
  assert.deepEqual(fourCang.map(t => t.soList), [['8844', '4844'], ['8843']]);
  assert.deepEqual(fourCang.map(t => t.tienDat), [5, 10]);

  const trailingFiller = core.parseTelegramEnvelope({
    text: 'nguoi 1:\n06 46 86b 120n 15 55 95b 75n 00 40 80b 40n 10 50 90b 60n dau 15 55 95 200n ag lay tin nay',
    region: 'nam',
    date: new Date(2026, 4, 28),
  });
  assert.deepEqual(trailingFiller.tickets.map(t => t.dai), trailingFiller.tickets.map(() => ['An Giang']));
  assert.deepEqual(trailingFiller.warnings, []);
});

test('parse station-prefixed bet type and bl before station scope', () => {
  const prefixedType = core.parseTelegramEnvelope({
    text: 'nguoi 1:\nTpb.52.03.45.79.100nđđ60n.b.103.03.31.71.28.68.30nđđ30n',
    region: 'nam',
    date: new Date(2026, 4, 11),
  });
  assert.equal(prefixedType.warnings.length, 0);
  assert.deepEqual(prefixedType.tickets[0].dai, ['TP.HCM']);
  assert.deepEqual(prefixedType.tickets[0].loai, 'Lo');
  assert.deepEqual(prefixedType.tickets[1].loai, 'DauDuoi');

  const blBeforeDai = core.parseTelegramEnvelope({
    text: 'nguoi 1:\nBl TP+ĐT 52.03.100n..130.10n',
    region: 'nam',
    date: new Date(2026, 4, 11),
  });
  assert.equal(blBeforeDai.warnings.length, 0);
  assert.deepEqual(blBeforeDai.tickets[0].dai, ['TP.HCM', 'Đồng Tháp']);
  assert.deepEqual(blBeforeDai.tickets.map(t => t.loai), ['Lo', '3Cang']);
});

test('2d phu before parentheses scopes previous and parenthesized tickets', () => {
  const parsed = core.parseTelegramEnvelope({
    text: 'nguoi 1:\n04 44 84b 75n dd 160n 2d phu (đầu 004den 904 60n dui 40n đai bli)',
    region: 'nam',
    date: new Date(2026, 4, 12),
  });

  assert.deepEqual(parsed.tickets.map(t => t.loai), ['Lo', 'DauDuoi', 'XiuChuDau', 'XiuChuDuoi']);
  assert.deepEqual(parsed.tickets[0].dai, ['Bến Tre', 'Bạc Liêu']);
  assert.deepEqual(parsed.tickets[1].dai, ['Bến Tre', 'Bạc Liêu']);
  assert.deepEqual(parsed.tickets[2].dai, ['Bạc Liêu']);
  assert.deepEqual(parsed.tickets[3].dai, ['Bạc Liêu']);
  assert.deepEqual(parsed.warnings, []);
});

test('ignore conversational filler and parse moi con stake phrases', () => {
  const filler = core.parseTelegramEnvelope({
    text: 'nguoi 1:\nghi cho anh con 23 24 5n',
    region: 'nam',
    activeDai: ['TP.HCM'],
  });
  assert.equal(filler.tickets.length, 1);
  assert.deepEqual(filler.tickets[0].soList, ['23', '24']);
  assert.equal(filler.tickets[0].loai, 'Lo');
  assert.equal(filler.tickets[0].tienDat, 5);
  assert.deepEqual(filler.warnings, []);

  const each = core.parseTelegramEnvelope({
    text: 'nguoi 1:\n23 24 moi con 5 diem',
    region: 'nam',
    activeDai: ['TP.HCM'],
  });
  assert.equal(each.tickets.length, 1);
  assert.equal(each.tickets[0].loai, 'Lo');
  assert.equal(each.tickets[0].tienDat, 5);
  assert.deepEqual(each.warnings, []);

  const thousand = core.parseTelegramEnvelope({
    text: 'nguoi 1:\nbao lo 52,25 moi con 10 ngan dau duoi 52,25 moi con 10 ngan',
    region: 'bac',
  });
  assert.deepEqual(thousand.tickets.map(t => t.loai), ['Lo', 'DauDuoi']);
  assert.deepEqual(thousand.tickets.map(t => t.tienDat), [10, 10]);
  assert.deepEqual(thousand.warnings, []);
});

test('parse central mc shorthand and mt/mtr markers', () => {
  const date = new Date(2026, 4, 31);
  const activeDai = core.getActiveDai('trung', date);
  const parsed = core.parseTelegramEnvelope({
    text: [
      'nguoi 1:',
      '28-68-52- bl mc 25n, 39 49, 15 , bl mc 30n, Mtr 3 dai',
      '68-28-52Mc..30 n..78/38/92/Mc,,15 n bl.3 dai Mt.',
      'Mt bl.12.20n.52.952.5n.',
      'Bl. Mt ba dai. 52. 10n.',
    ].join('\n'),
    region: 'trung',
    date,
  });

  assert.deepEqual(parsed.warnings, []);
  assert.deepEqual(parsed.tickets[0].soList, ['28', '68', '52']);
  assert.equal(parsed.tickets[0].tienDat, 25);
  assert.deepEqual(parsed.tickets[0].dai, activeDai);
  assert.equal(parsed.tickets.some(t => t.soList.join(',') === '68,28,52' && t.tienDat === 30), true);
  assert.equal(parsed.tickets.some(t => t.soList.join(',') === '78,38,92' && t.tienDat === 15), true);
  assert.equal(parsed.tickets.some(t => t.loai === '3Cang' && t.soList.join(',') === '952' && t.tienDat === 5), true);
  assert.equal(parsed.tickets.some(t => t.soList.join(',') === '52' && t.tienDat === 10 && t.dai.length === activeDai.length), true);
});

test('parse pasted central ticket batch without token warnings', () => {
  const date = new Date(2026, 4, 31);
  const activeDai = core.getActiveDai('trung', date);
  const parsed = core.parseTelegramEnvelope({
    text: [
      'nguoi 1:',
      '28-68-52- bl mc 25n, 39 49, 15 , bl mc 30n, Mtr 3 dai',
      'B. 52.20n.352.652.372.6372..3652.6352.5n.dd.352.392.372.30n',
      '68-28-52Mc..30 n..78/38/92/Mc,,15 n bl.3 dai Mt.',
      '615 bl 10n 3 dai Mtr',
      'Mt bl.12.20n.52.952.5n.',
      'Bl. Mt ba dai. 52. 10n.859.392.6392.5n. 479. 958. 2n  dd  89.  92..359.392.30n.  59. . 952.  632.. 859. 459. 359. . 592. 792. 12n .',
      'B.29.92.39.93..10n.i',
      'Khanh Hoa lo 43 42 48 84 60d. 34 30d. 24 54 10d',
    ].join('\n'),
    region: 'trung',
    date,
  });

  assert.deepEqual(parsed.warnings, []);
  assert.equal(parsed.tickets.length, 24);
  assert.equal(parsed.tickets.some(t => t.soList.join(',') === '78,38,92' && t.tienDat === 15), true);
  assert.equal(parsed.tickets.some(t => t.soList.join(',') === '43,42,48,84' && t.tienDat === 60 && t.dai[0] === activeDai[0]), true);
});

test('default ticket type follows number length when type is omitted', () => {
  const parsed = core.parseTelegramEnvelope({
    text: 'nguoi 1:\n23 24 5n\n123 124 5n\n1234 1245 5n\n23b100',
    region: 'nam',
    activeDai: ['TP.HCM'],
  });

  assert.deepEqual(parsed.tickets.map(t => t.loai), ['Lo', '3Cang', '4Cang', 'Lo']);
  assert.deepEqual(parsed.tickets[3].soList, ['23']);
  assert.equal(parsed.tickets[3].tienDat, 100);
  assert.deepEqual(parsed.warnings, []);
});

test('parse station aliases without confusing bet type shortcuts', () => {
  const nam = core.parseTelegramEnvelope({
    text: 'nguoi 1:\nbl 07 47 10n\nbac lieu b 12 10n',
    region: 'nam',
    date: new Date(2026, 4, 12),
  });
  assert.equal(nam.tickets[0].loai, 'Lo');
  assert.deepEqual(nam.tickets[0].dai, ['Vũng Tàu']);
  assert.deepEqual(nam.tickets[1].dai, ['Bạc Liêu']);

  const trung = core.parseTelegramEnvelope({
    text: 'nguoi 1:\ndac nong b 12 10n\ndak nong dd 34 20n',
    region: 'trung',
    date: new Date(2026, 4, 16),
  });
  assert.deepEqual(trung.tickets[0].dai, ['Đắk Nông']);
  assert.deepEqual(trung.tickets[1].dai, ['Đắk Nông']);
});

test('expanded southern station aliases cover every station', () => {
  const activeDai = core.getConfig('nam').daiList;
  const cases = [
    ['tph b 12 10n', 'TP.HCM'],
    ['d thap b 12 10n', 'Đồng Tháp'],
    ['cma b 12 10n', 'Cà Mau'],
    ['bte b 12 10n', 'Bến Tre'],
    ['vtu b 12 10n', 'Vũng Tàu'],
    ['bcl b 12 10n', 'Bạc Liêu'],
    ['d nai b 12 10n', 'Đồng Nai'],
    ['cnt b 12 10n', 'Cần Thơ'],
    ['s trang b 12 10n', 'Sóc Trăng'],
    ['tni b 12 10n', 'Tây Ninh'],
    ['agi b 12 10n', 'An Giang'],
    ['bthn b 12 10n', 'Bình Thuận'],
    ['vlg b 12 10n', 'Vĩnh Long'],
    ['sobe b 12 10n', 'Bình Dương'],
    ['trv b 12 10n', 'Trà Vinh'],
    ['loga b 12 10n', 'Long An'],
    ['bphc b 12 10n', 'Bình Phước'],
    ['hgi b 12 10n', 'Hậu Giang'],
    ['tgi b 12 10n', 'Tiền Giang'],
    ['kgi b 12 10n', 'Kiên Giang'],
    ['dlat b 12 10n', 'Đà Lạt'],
  ];

  for (const [line, expected] of cases) {
    const parsed = core.parseTelegramEnvelope({
      text: `nguoi 1:\n${line}`,
      region: 'nam',
      activeDai,
      defaultDai: ['TP.HCM'],
    });
    assert.equal(parsed.tickets.length, 1, line);
    assert.deepEqual(parsed.tickets[0].dai, [expected], line);
    assert.deepEqual(parsed.warnings, [], line);
  }
});

test('expanded central and northern station aliases cover every station', () => {
  const activeDai = core.getConfig('trung').daiList;
  const cases = [
    ['tth b 12 10n', 'TT.Huế'],
    ['p yen b 12 10n', 'Phú Yên'],
    ['dkl b 12 10n', 'Đắk Lắk'],
    ['qnm b 12 10n', 'Quảng Nam'],
    ['dana b 12 10n', 'Đà Nẵng'],
    ['nha trang b 12 10n', 'Khánh Hòa'],
    ['b dinh b 12 10n', 'Bình Định'],
    ['qtr b 12 10n', 'Quảng Trị'],
    ['qbi b 12 10n', 'Quảng Bình'],
    ['g lai b 12 10n', 'Gia Lai'],
    ['n thuan b 12 10n', 'Ninh Thuận'],
    ['q ngai b 12 10n', 'Quảng Ngãi'],
    ['dkn b 12 10n', 'Đắk Nông'],
    ['k tum b 12 10n', 'Kon Tum'],
  ];

  for (const [line, expected] of cases) {
    const parsed = core.parseTelegramEnvelope({
      text: `nguoi 1:\n${line}`,
      region: 'trung',
      activeDai,
      defaultDai: ['TT.Huế'],
    });
    assert.equal(parsed.tickets.length, 1, line);
    assert.deepEqual(parsed.tickets[0].dai, [expected], line);
    assert.deepEqual(parsed.warnings, [], line);
  }

  const bac = core.parseTelegramEnvelope({
    text: 'nguoi 1:\nhn b 12 10n\nbac bo dd 34 20n',
    region: 'bac',
  });
  assert.deepEqual(bac.tickets.map(t => t.dai), [['Miền Bắc'], ['Miền Bắc']]);
  assert.deepEqual(bac.warnings, []);
});

test('parse multiple station aliases before a ticket', () => {
  const parsed = core.parseTelegramEnvelope({
    text: 'nguoi 1:\ncm,dt b 75 10n',
    region: 'nam',
    date: new Date(2026, 4, 11),
  });

  assert.equal(parsed.tickets.length, 1);
  assert.equal(parsed.tickets[0].loai, 'Lo');
  assert.deepEqual(parsed.tickets[0].soList, ['75']);
  assert.deepEqual(parsed.tickets[0].dai, ['Cà Mau', 'Đồng Tháp']);
  assert.equal(parsed.tickets[0].xac, 10 * 1 * 18 * 700 * 2);
});

test('warn and drop a whole line when it contains an inactive station', () => {
  const parsed = core.parseTelegramEnvelope({
    text: 'nguoi 1:\ncm,blieu b 75 10n\nbaclieu b 12 10n',
    region: 'nam',
    date: new Date(2026, 4, 11),
  });

  assert.equal(parsed.tickets.length, 0);
  assert.equal(parsed.warnings.some(w => w.includes('Bạc Liêu') && w.includes('cm,blieu b 75 10n')), true);
  assert.equal(parsed.warnings.some(w => w.includes('Bạc Liêu') && w.includes('baclieu b 12 10n')), true);
  assert.equal(parsed.warnings.some(w => w.includes('Vui lòng gửi lại tin mới đúng đài hôm nay')), true);
});

test('warn on unusual characters in ticket lines', () => {
  const parsed = core.parseTelegramEnvelope({
    text: 'nguoi 1:\ncm 🔥 b 75 10n',
    region: 'nam',
    date: new Date(2026, 4, 11),
  });

  assert.equal(parsed.tickets.length, 1);
  assert.equal(parsed.warnings.some(w => w.includes('ký tự lạ') && w.includes('🔥')), true);
});

test('parse contextual headings and dau duoi phrase', () => {
  const parsed = core.parseTelegramEnvelope({
    text: 'nguoi 1:\nBlo - Tp\n.52.12.92.100n\nBlo - 3 dai\n53.150n 235.20n\nDau duoi 3 dai .918.981.235.30n',
    region: 'nam',
    date: new Date(2026, 4, 11),
  });

  assert.equal(parsed.tickets.length, 4);
  assert.deepEqual(parsed.tickets[0].dai, ['TP.HCM']);
  assert.deepEqual(parsed.tickets[0].soList, ['52', '12', '92']);
  assert.equal(parsed.tickets[1].loai, 'Lo');
  assert.deepEqual(parsed.tickets[1].dai, ['TP.HCM', 'Đồng Tháp', 'Cà Mau']);
  assert.equal(parsed.tickets[2].loai, '3Cang');
  assert.deepEqual(parsed.tickets[2].dai, ['TP.HCM', 'Đồng Tháp', 'Cà Mau']);
  assert.equal(parsed.tickets[3].loai, 'XiuChu');
});

test('ambiguous lines after contextual heading require explicit scope', () => {
  const parsed = core.parseTelegramEnvelope({
    text: 'nguoi 1:\nBlo - 3 dai\n53.150n\nBl 07.47.10n\nvt b 07.47.10n',
    region: 'nam',
    date: new Date(2026, 4, 12),
  });
  const activeDai = core.getActiveDai('nam', new Date(2026, 4, 12));

  assert.deepEqual(parsed.tickets[0].dai, activeDai);
  assert.deepEqual(parsed.tickets[1].dai, ['Vũng Tàu']);
  assert.equal(parsed.warnings.some(w => w.includes('Bl 07.47.10n') && w.includes('chưa lưu')), true);
});

test('explicit scoped line closes copied heading context', () => {
  const parsed = core.parseTelegramEnvelope({
    text: [
      'nguoi 1:',
      'Blo - 3 dai',
      '53.150n 235.20n',
      'Dau duoi 3 dai .918.981.235.30n',
      'Bl 07. 47. 10n. 70. 5n',
      'B.00.01.22.93.83.92..10n, 22.48.848.422.292.612.652.592.622.401..5n, 92.89.98..3n, 392..2n, 351..1n. Dd.92.12..30n, 52..12n, 51.93.83.48.22.422.848.292..6n,',
    ].join('\n'),
    region: 'nam',
    date: new Date(2026, 4, 11),
  });

  assert.equal(parsed.warnings.some(w => w.includes('chưa lưu')), false);
  assert.equal(parsed.tickets.some(t => t.sourceText === 'Bl 07. 47. 10n. 70. 5n' && t.soList.includes('70')), true);
  assert.equal(parsed.tickets.some(t => t.sourceText.startsWith('B.00.01') && t.soList.includes('392')), true);
});

test('copied heading block skips unclear continuation lines', () => {
  const parsed = core.parseTelegramEnvelope({
    text: [
      'nguoi 1:',
      'Blo vt',
      '.362.5n 79.60n',
      'Dau duoi 362.62.200n',
      'Blo -BT+ BL',
      '.72.100n..',
      'Blo - 3 dai-',
      '.76.67.120n 32 100n.',
      '867.10n',
      'Dau duoi 67.76..70n',
      '010.362.775.918.981.40n',
    ].join('\n'),
    region: 'nam',
    date: new Date(2026, 4, 12),
  });

  assert.equal(parsed.tickets.some(t => t.soList.includes('867')), false);
  assert.equal(parsed.tickets.some(t => t.soList.includes('010')), false);
  assert.equal(parsed.warnings.some(w => w.includes('867.10n') && w.includes('chưa lưu')), true);
  assert.equal(parsed.warnings.some(w => w.includes('Dau duoi 67.76') && w.includes('chưa lưu')), true);
  assert.equal(parsed.warnings.some(w => w.includes('010.362.775') && w.includes('chưa lưu')), true);
});

test('parse whole-line and parenthesized station scope', () => {
  const lineWide = core.parseTelegramEnvelope({
    text: 'nguoi 1:\n3dai.b.76.53.17.69.250n.dd150n.b.217.keo.den.917.5n.dd120n',
    region: 'nam',
    date: new Date(2026, 4, 11),
  });
  assert.deepEqual(lineWide.tickets[0].dai, ['TP.HCM', 'Đồng Tháp', 'Cà Mau']);
  assert.deepEqual(lineWide.tickets[2].soList, ['217', '317', '417', '517', '617', '717', '817', '917']);
  assert.equal(lineWide.tickets[3].loai, 'XiuChu');

  const scoped = core.parseTelegramEnvelope({
    text: 'nguoi 1:\nBl 53 10n ( 3 dai ).\nDd 53 60n ( 1 dai )',
    region: 'nam',
    date: new Date(2026, 4, 11),
  });
  assert.deepEqual(scoped.tickets[0].dai, ['TP.HCM', 'Đồng Tháp', 'Cà Mau']);
  assert.deepEqual(scoped.tickets[1].dai, ['TP.HCM']);

  const exactScoped = core.parseTelegramEnvelope({
    text: 'nguoi 1:\nBl 21 61 100n (bl 3dai 21 61 100n)',
    region: 'nam',
    date: new Date(2026, 4, 11),
  });
  const exactActiveDai = core.getActiveDai('nam', new Date(2026, 4, 11));
  assert.deepEqual(exactScoped.warnings, []);
  assert.deepEqual(exactScoped.tickets.map(t => t.dai), [[exactActiveDai[0]], exactActiveDai]);
  assert.deepEqual(exactScoped.tickets.map(t => t.soList), [['21', '61'], ['21', '61']]);

  const inline = core.parseTelegramEnvelope({
    text: 'nguoi 1:\n70dau1trieu.200...22.67b100..(22.67b100.3dai)',
    region: 'nam',
    date: new Date(2026, 4, 11),
  });
  assert.equal(inline.tickets[0].loai, 'Dau');
  assert.equal(inline.tickets[0].tienDat, 1200);
  assert.deepEqual(inline.tickets[0].dai, ['TP.HCM']);
  assert.deepEqual(inline.tickets[1].dai, ['TP.HCM']);
  assert.deepEqual(inline.tickets[2].dai, ['TP.HCM', 'Đồng Tháp', 'Cà Mau']);

  for (const marker of ['3đ', '3 đ', '3đài', '3 đài', '3₫ai']) {
    const endMarker = core.parseTelegramEnvelope({
      text: `nguoi 1:\n23b100.${marker}`,
      region: 'nam',
      date: new Date(2026, 4, 11),
    });
    assert.equal(endMarker.tickets[0].tienDat, 100);
    assert.deepEqual(endMarker.tickets[0].dai, ['TP.HCM', 'Đồng Tháp', 'Cà Mau']);
  }
});

test('exclude station marker scopes tickets to remaining active stations', () => {
  const date = new Date(2026, 4, 16);
  const activeDai = core.getActiveDai('nam', date);
  assert.deepEqual(activeDai, ['TP.HCM', 'Long An', 'Bình Phước', 'Hậu Giang']);

  const heading = core.parseTelegramEnvelope({
    text: 'nguoi 1:\nbỏ bp\nb 12 10n',
    region: 'nam',
    date,
  });
  assert.deepEqual(heading.tickets[0].dai, ['TP.HCM', 'Long An', 'Hậu Giang']);
  assert.deepEqual(heading.warnings, []);

  const inline = core.parseTelegramEnvelope({
    text: 'nguoi 1:\nbao 3 dai bo bp 60b70n',
    region: 'nam',
    date,
  });
  assert.deepEqual(inline.tickets[0].dai, ['TP.HCM', 'Long An', 'Hậu Giang']);
  assert.deepEqual(inline.tickets[0].soList, ['60']);
  assert.equal(inline.tickets[0].tienDat, 70);
  assert.deepEqual(inline.warnings, []);
});

test('parse glued number/type/stake tokens inside parentheses', () => {
  const parsed = core.parseTelegramEnvelope({
    text: 'nguoi 1:\nb 12 10n (34b20n) 60b70n',
    region: 'nam',
    activeDai: ['TP.HCM'],
  });

  assert.deepEqual(parsed.tickets.map(t => t.soList), [['12'], ['34'], ['60']]);
  assert.deepEqual(parsed.tickets.map(t => t.tienDat), [10, 20, 70]);
  assert.deepEqual(parsed.tickets.map(t => t.dai), [['TP.HCM'], ['TP.HCM'], ['TP.HCM']]);
  assert.deepEqual(parsed.warnings, []);
});

test('parse keo ranges with filler words', () => {
  const parsed = core.parseTelegramEnvelope({
    text: 'nguoi 1:\n123 keo luon nha 923 b 5n\n101 den 109 dd 10n\n02 keo 92 b 1n',
    region: 'nam',
    activeDai: ['TP.HCM'],
  });

  assert.deepEqual(parsed.tickets[0].soList, ['123', '223', '323', '423', '523', '623', '723', '823', '923']);
  assert.deepEqual(parsed.tickets[1].soList, ['101', '102', '103', '104', '105', '106', '107', '108', '109']);
  assert.deepEqual(parsed.tickets[2].soList, ['02', '12', '22', '32', '42', '52', '62', '72', '82', '92']);
});

test('parse dd with two stakes as dau and duoi stakes', () => {
  const parsed = core.parseTelegramEnvelope({
    text: 'nguoi 1:\ndd 19 80 60 10d 20d',
    region: 'nam',
    activeDai: ['TP.HCM', 'Dong Thap', 'Ca Mau'],
  });

  assert.deepEqual(parsed.tickets.map(t => t.loai), ['Dau', 'Duoi']);
  assert.deepEqual(parsed.tickets.map(t => t.tienDat), [10, 20]);
  assert.deepEqual(parsed.tickets[0].soList, ['19', '80', '60']);
});

test('parse glued first dd stake as dau and duoi stakes', () => {
  const parsed = core.parseTelegramEnvelope({
    text: 'nguoi 1:\ndd 36 10n 5n',
    region: 'nam',
    activeDai: ['Vũng Tàu'],
  });

  assert.deepEqual(parsed.tickets.map(t => t.loai), ['Dau', 'Duoi']);
  assert.deepEqual(parsed.tickets.map(t => t.tienDat), [10, 5]);
  assert.deepEqual(parsed.tickets.map(t => t.soList), [['36'], ['36']]);
  assert.deepEqual(parsed.warnings, []);
});

test('parse duplicated dd stake as one dau-duoi ticket', () => {
  const parsed = core.parseTelegramEnvelope({
    text: 'nguoi 1:\n65 25 57 Dd 100n 100n',
    region: 'nam',
    activeDai: ['TP.HCM'],
  });

  assert.equal(parsed.tickets.length, 1);
  assert.equal(parsed.tickets[0].loai, 'DauDuoi');
  assert.equal(parsed.tickets[0].tienDat, 100);
  assert.deepEqual(parsed.tickets[0].soList, ['65', '25', '57']);
});

test('suffix dd stake does not change next pulled group type', () => {
  const parsed = core.parseTelegramEnvelope({
    text: 'nguoi 1:\nb 217 keo den 917 5n dd120n 276 keo den 976 5n dd120n',
    region: 'nam',
    activeDai: ['TP.HCM'],
  });

  assert.deepEqual(parsed.tickets.map(t => t.loai), ['3Cang', 'XiuChu', '3Cang', 'XiuChu']);
  assert.deepEqual(parsed.tickets.map(t => t.tienDat), [5, 120, 5, 120]);
  assert.deepEqual(parsed.tickets[2].soList, ['276', '376', '476', '576', '676', '776', '876', '976']);
});

test('two-digit bare group before repeated dd stake inherits previous dd suffix', () => {
  const parsed = core.parseTelegramEnvelope({
    text: 'nguoi 1:\n3dai b.45.52.250n.dd100n b.13.31.48.70n.dd30n 23.32.72.97.79.09.30n.dd30n',
    region: 'nam',
    date: new Date(2026, 4, 26),
  });

  assert.deepEqual(parsed.tickets.map(t => t.loai), ['Lo', 'DauDuoi', 'Lo', 'DauDuoi', 'DauDuoi', 'DauDuoi']);
  assert.deepEqual(parsed.tickets[4].soList, ['23', '32', '72', '97', '79', '09']);
  assert.equal(parsed.tickets[4].xac, 756000);
});

test('bare xc stake before dd and ending 3d marker are not treated as numbers', () => {
  const parsed = core.parseTelegramEnvelope({
    text: 'nguoi 1:\n15 47b 75n 315 347 215 247b 6n xc 35 dd 15 180n 47 120n 3d',
    region: 'nam',
    date: new Date(2026, 4, 11),
  });

  assert.deepEqual(parsed.tickets.map(t => t.loai), ['Lo', '3Cang', 'XiuChu', 'DauDuoi', 'DauDuoi']);
  assert.deepEqual(parsed.tickets[2].soList, ['315', '347', '215', '247']);
  assert.equal(parsed.tickets[2].tienDat, 35);
  assert.deepEqual(parsed.tickets[3].soList, ['15']);
  assert.deepEqual(parsed.tickets[4].soList, ['47']);
  assert.equal(parsed.tickets.some(t => t.loai === 'Duoi' && t.tienDat === 3), false);
});

test('three digit number before new type is not reused as previous xc stake', () => {
  const parsed = core.parseTelegramEnvelope({
    text: 'nguoi 1:\n03 43 83b 20ndd 130n  983 683 903 603 943 643 xc 60n  843 b 10n xc 150n 8843 2843b 25n bd',
    region: 'nam',
    date: new Date(2026, 5, 5),
  });
  const activeDai = core.getActiveDai('nam', new Date(2026, 5, 5));

  assert.deepEqual(parsed.warnings, []);
  assert.equal(parsed.tickets.length, 6);
  assert.equal(parsed.tickets.some(t => t.tienDat === 843), false);
  assert.deepEqual(parsed.tickets.map(t => t.dai), parsed.tickets.map(() => [activeDai[1]]));
  assert.deepEqual(parsed.tickets.map(t => t.loai), ['Lo', 'DauDuoi', 'XiuChu', '3Cang', 'XiuChu', '4Cang']);
  assert.deepEqual(parsed.tickets[2].soList, ['983', '683', '903', '603', '943', '643']);
  assert.deepEqual(parsed.tickets[3].soList, ['843']);
  assert.equal(parsed.tickets[3].tienDat, 10);
  assert.deepEqual(parsed.tickets[4].soList, ['843']);
  assert.equal(parsed.tickets[4].tienDat, 150);
  assert.deepEqual(parsed.tickets[5].soList, ['8843', '2843']);
});

test('ending 3d marker applies to emitted line tickets without becoming dd stake', () => {
  const parsed = core.parseTelegramEnvelope({
    text: 'nguoi 1:\n18 81b 30n dd 60n 14 41b 40n dd 14 120n 41 30n 3d',
    region: 'nam',
    date: new Date(2026, 4, 11),
  });
  const activeDai = core.getActiveDai('nam', new Date(2026, 4, 11));

  assert.deepEqual(parsed.tickets.map(t => t.dai), parsed.tickets.map(() => activeDai));
  assert.equal(parsed.tickets.some(t => t.loai === 'Duoi' && t.tienDat === 3), false);
});

test('southern default uses main station for that weekday', () => {
  const date = new Date(2026, 4, 12);
  const activeDai = core.getActiveDai('nam', date);
  const parsed = core.parseTelegramEnvelope({
    text: 'nguoi 1:\nb 12 10n',
    region: 'nam',
    date,
  });

  assert.deepEqual(parsed.activeDai, activeDai);
  assert.deepEqual(parsed.defaultDai, [activeDai[1]]);
  assert.deepEqual(parsed.tickets[0].dai, [activeDai[1]]);
  assert.equal(parsed.tickets[0].xac, 10 * 1 * 18 * 700);
});

test('southern main station follows configured weekday table', () => {
  const cases = [
    [new Date(2026, 4, 11), 'TP.HCM'],
    [new Date(2026, 4, 12), 'Vũng Tàu'],
    [new Date(2026, 4, 13), 'Đồng Nai'],
    [new Date(2026, 4, 14), 'Tây Ninh'],
    [new Date(2026, 4, 15), 'Bình Dương'],
    [new Date(2026, 4, 16), 'TP.HCM'],
    [new Date(2026, 4, 17), 'Tiền Giang'],
  ];

  for (const [date, expected] of cases) {
    assert.equal(core.getMainDai('nam', date), expected);
  }
});

test('southern explicit multi-station marker uses all active day stations', () => {
  const date = new Date(2026, 4, 11);
  const activeDai = core.getActiveDai('nam', date);
  const parsed = core.parseTelegramEnvelope({
    text: 'nguoi 1:\n3dai b 12 10n',
    region: 'nam',
    date,
  });

  assert.deepEqual(parsed.tickets[0].dai, activeDai);
  assert.equal(parsed.tickets[0].xac, 10 * 1 * 18 * 700 * activeDai.length);
});

test('southern explicit station overrides main station', () => {
  const date = new Date(2026, 4, 13);
  const activeDai = core.getActiveDai('nam', date);
  const parsed = core.parseTelegramEnvelope({
    text: 'nguoi 1:\nct b 12 10n',
    region: 'nam',
    date,
  });

  assert.deepEqual(parsed.activeDai, activeDai);
  assert.deepEqual(parsed.tickets[0].dai, [activeDai[1]]);
});

test('central default uses every station for that weekday', () => {
  const date = new Date(2026, 4, 11);
  const activeDai = core.getActiveDai('trung', date);
  const parsed = core.parseTelegramEnvelope({
    text: 'nguoi 1:\nb 12 10n',
    region: 'trung',
    date,
  });

  assert.deepEqual(parsed.defaultDai, activeDai);
  assert.deepEqual(parsed.tickets[0].dai, activeDai);
  assert.equal(parsed.tickets[0].xac, 10 * 1 * 18 * 700 * activeDai.length);
});

test('central explicit station narrows the station list', () => {
  const date = new Date(2026, 4, 11);
  const activeDai = core.getActiveDai('trung', date);
  const parsed = core.parseTelegramEnvelope({
    text: 'nguoi 1:\nhue b 12 10n',
    region: 'trung',
    date,
  });

  assert.deepEqual(parsed.tickets[0].dai, [activeDai[0]]);
});

test('check southern tickets against draw results', () => {
  const parsed = core.parseTelegramEnvelope({
    text: 'người 1:\n61 68b 75n dd 280n 061 068b 10n xc 75n',
    region: 'nam',
    activeDai: ['TP.HCM'],
  });
  const checked = core.checkTickets(
    parsed.tickets,
    {
      'TP.HCM': {
        db: ['123468'],
        g1: ['11111'],
        g2: ['22222'],
        g3: ['33333', '44444'],
        g4: ['55555', '66666', '77777', '88888', '99999', '10000', '10001'],
        g5: ['0000'],
        g6: ['1111', '2222', '3333'],
        g7: ['061'],
        g8: ['61'],
      },
    },
    { region: 'nam', activeDai: ['TP.HCM'] },
  );

  const lo = checked.find(t => t.loai === 'Lo');
  const dd = checked.find(t => t.loai === 'DauDuoi');
  const xc = checked.find(t => t.loai === 'XiuChu');
  assert.equal(lo.ketQua, 'TRÚNG');
  assert.equal(lo.hits.length, 3);
  assert.equal(lo.tienThang, 75 * 70000 * 3);
  assert.equal(dd.ketQua, 'TRÚNG');
  assert.equal(dd.hits.length, 2);
  assert.equal(xc.ketQua, 'TRÚNG');
});

test('check multi-station tickets only against their own station results', () => {
  const parsed = core.parseTelegramEnvelope({
    text: 'nguoi 1:\nvt b 39 10n\nbentre b 12 10n',
    region: 'nam',
    date: new Date(2026, 4, 12),
  });
  const checked = core.checkTickets(
    parsed.tickets,
    {
      'Bến Tre': {
        db: ['123412'],
        g1: ['11111'],
        g2: ['22222'],
        g3: ['33333', '44444'],
        g4: ['55555', '66666', '77777', '88888', '99999', '10000', '10001'],
        g5: ['0000'],
        g6: ['1111', '2222', '3333'],
        g7: ['061'],
        g8: ['00'],
      },
      'Vũng Tàu': {
        db: ['123400'],
        g1: ['11111'],
        g2: ['22222'],
        g3: ['33333', '44444'],
        g4: ['55555', '66666', '77777', '88888', '99999', '10000', '10001'],
        g5: ['0000'],
        g6: ['1111', '2222', '3333'],
        g7: ['061'],
        g8: ['39'],
      },
    },
    { region: 'nam', activeDai: ['Bến Tre', 'Vũng Tàu'] },
  );

  const vt = checked.find(t => t.dai.includes('Vũng Tàu'));
  const bt = checked.find(t => t.dai.includes('Bến Tre'));
  assert.equal(vt.ketQua, 'TRÚNG');
  assert.equal(vt.hits.every(hit => hit.dai === 'Vũng Tàu'), true);
  assert.equal(bt.ketQua, 'TRÚNG');
  assert.equal(bt.hits.every(hit => hit.dai === 'Bến Tre'), true);
});

test('parse northern xc shorthand for three digit dau-duoi', () => {
  const parsed = core.parseTelegramEnvelope({
    text: 'nguoi 1:\n123 xc 20n',
    region: 'bac',
    activeDai: ['Miá»n Báº¯c'],
  });

  assert.deepEqual(parsed.warnings, []);
  assert.equal(parsed.tickets.length, 1);
  assert.equal(parsed.tickets[0].loai, 'DauDuoi3C');
  assert.deepEqual(parsed.tickets[0].soList, ['123']);
  assert.equal(parsed.tickets[0].tienDat, 20);
  assert.equal(parsed.tickets[0].heSoXac, 700);
  assert.equal(parsed.tickets[0].tyLeTrung, 550000);
  assert.equal(parsed.tickets[0].xac, 20 * 1 * 4 * 700);
});

test('parse and check northern xien ticket', () => {
  const parsed = core.parseTelegramEnvelope({
    text: 'người 2:\nxien2 12 34 10n',
    region: 'bac',
    activeDai: ['Miền Bắc'],
  });
  assert.equal(parsed.tickets.length, 1);
  assert.equal(parsed.tickets[0].loai, 'Xien2');

  const checked = core.checkTickets(
    parsed.tickets,
    {
      'Miền Bắc': {
        db: ['12345'],
        g1: ['11112'],
        g2: ['22234', '33333'],
        g3: ['44444', '55555', '66666', '77777', '88888', '99999'],
        g4: ['0000', '1111', '2222', '3333'],
        g5: ['4444', '5555', '6666', '7777', '8888', '9999'],
        g6: ['123', '456', '789'],
        g7: ['01', '02', '03', '04'],
      },
    },
    { region: 'bac', activeDai: ['Miền Bắc'] },
  );
  assert.equal(checked[0].ketQua, 'TRÚNG');
  assert.equal(checked[0].tienThang, 10 * 10000);
});

test('parse draw result text for single station', () => {
  const draw = core.parseDrawResultText(
    [
      'Đặc biệt 123456',
      'Giải nhất 11111',
      'Giải nhì 22222',
      'Giải ba 33333 44444',
      'Giải tư 55555 66666 77777 88888 99999 10061 10068',
      'Giải năm 0000',
      'Giải sáu 1111 2222 3333',
      'Giải bảy 061',
      'Giải tám 61',
    ].join('\n'),
    'nam',
  );
  assert.deepEqual(draw.activeDai, ['TP.HCM', 'Đồng Tháp', 'Cà Mau']);
  assert.equal(draw.results['TP.HCM'].db[0], '123456');
  assert.equal(draw.results['TP.HCM'].g8[0], '61');
});

test('parse az24-style html draw tables', () => {
  const bac = core.parseDrawResultText(`
    <table class="kqmb colgiai"><tbody>
      <tr class="db"><td class="txt-giai">ĐB</td><td><span>61513</span></td></tr>
      <tr><td class="txt-giai">G1</td><td><span>25473</span></td></tr>
      <tr><td class="txt-giai">G2</td><td><span>05981</span><span>36393</span></td></tr>
      <tr><td class="txt-giai">G3</td><td><span>01096</span><span>81866</span><span>19263</span><span>59097</span><span>46712</span><span>16436</span></td></tr>
      <tr><td class="txt-giai">G4</td><td><span>5033</span><span>4807</span><span>8302</span><span>0840</span></td></tr>
      <tr><td class="txt-giai">G5</td><td><span>2819</span><span>3011</span><span>7912</span><span>9554</span><span>2672</span><span>5294</span></td></tr>
      <tr><td class="txt-giai">G6</td><td><span>440</span><span>550</span><span>613</span></td></tr>
      <tr><td class="txt-giai">G7</td><td><span>45</span><span>27</span><span>16</span><span>15</span></td></tr>
    </tbody></table>
  `, 'bac');
  assert.deepEqual(bac.activeDai, ['Miền Bắc']);
  assert.equal(bac.results['Miền Bắc'].db[0], '61513');
  assert.equal(bac.results['Miền Bắc'].g7[3], '15');

  const nam = core.parseDrawResultText(`
    <table class="colthreecity colgiai"><tbody>
      <tr><th></th><th>Đồng Nai</th><th>Cần Thơ</th><th>Sóc Trăng</th></tr>
      <tr><td>G8</td><td><div>&zwj;94</div></td><td><div>&zwj;94</div></td><td><div>&zwj;64</div></td></tr>
      <tr><td>G7</td><td><div>658</div></td><td><div>305</div></td><td><div>253</div></td></tr>
      <tr><td>G6</td><td><div>3673</div><div>7600</div><div>2736</div></td><td><div>9344</div><div>5063</div><div>2844</div></td><td><div>1768</div><div>1403</div><div>1401</div></td></tr>
      <tr><td>G5</td><td><div>0383</div></td><td><div>8108</div></td><td><div>9662</div></td></tr>
      <tr><td>G4</td><td><div>36468</div><div>42690</div><div>59907</div><div>79002</div><div>16104</div><div>04139</div><div>49404</div></td><td><div>58901</div><div>11094</div><div>26498</div><div>16955</div><div>22470</div><div>11765</div><div>62138</div></td><td><div>06330</div><div>75309</div><div>81483</div><div>79407</div><div>82549</div><div>82898</div><div>64403</div></td></tr>
      <tr><td>G3</td><td><div>08584</div><div>73825</div></td><td><div>21924</div><div>93976</div></td><td><div>28384</div><div>89362</div></td></tr>
      <tr><td>G2</td><td><div>95371</div></td><td><div>74920</div></td><td><div>89893</div></td></tr>
      <tr><td>G1</td><td><div>36587</div></td><td><div>83469</div></td><td><div>61339</div></td></tr>
      <tr><td>ĐB</td><td><div>738909</div></td><td><div>007940</div></td><td><div>094538</div></td></tr>
    </tbody></table>
  `, 'nam');
  assert.deepEqual(nam.activeDai, ['Đồng Nai', 'Cần Thơ', 'Sóc Trăng']);
  assert.equal(nam.results['Đồng Nai'].db[0], '738909');
  assert.equal(nam.results['Cần Thơ'].g8[0], '94');
  assert.equal(nam.results['Sóc Trăng'].g4.length, 7);
  const mobiNam = core.parseDrawResultText(`
    <table class="extendable read-result badai colgiai"><tbody>
      <tr class="gr-yellow"><th></th><th>Tay Ninh</th><th>An Giang</th><th>Binh Thuan</th></tr>
      <tr class="g8"><td>G8</td><td><div>74</div></td><td><div>86</div></td><td><div>46</div></td></tr>
      <tr><td>G7</td><td><div>102</div></td><td><div>054</div></td><td><div>751</div></td></tr>
      <tr><td>G6</td><td><div>9161</div><div>8209</div><div>5690</div></td><td><div>9247</div><div>2584</div><div>8849</div></td><td><div>0130</div><div>6457</div><div>3378</div></td></tr>
      <tr><td>G5</td><td><div>4055</div></td><td><div>7319</div></td><td><div>9645</div></td></tr>
      <tr><td>G4</td><td><div>58483</div><div>33836</div><div>77399</div><div>12078</div><div>16273</div><div>64606</div><div>02528</div></td><td><div>26611</div><div>70238</div><div>22071</div><div>71935</div><div>84472</div><div>74682</div><div>00597</div></td><td><div>66670</div><div>53045</div><div>94538</div><div>37971</div><div>17497</div><div>31357</div><div>12829</div></td></tr>
      <tr><td>G3</td><td><div>65215</div><div>57607</div></td><td><div>24198</div><div>30102</div></td><td><div>19584</div><div>42289</div></td></tr>
      <tr><td>G2</td><td><div>10248</div></td><td><div>97431</div></td><td><div>36340</div></td></tr>
      <tr><td>G1</td><td><div>55851</div></td><td><div>58783</div></td><td><div>33365</div></td></tr>
      <tr class="gdb"><td>DB</td><td><div>490332</div></td><td><div>377962</div></td><td><div>180200</div></td></tr>
    </tbody></table>
  `, 'nam');
  assert.deepEqual(mobiNam.activeDai, ['Tây Ninh', 'An Giang', 'Bình Thuận']);
  assert.equal(mobiNam.results['Tây Ninh'].db[0], '490332');
  assert.equal(mobiNam.results['Bình Thuận'].g4.length, 7);
});

test('format report and split Telegram messages', () => {
  const parsed = core.parseTelegramEnvelope({
    text: 'người 1:\n61b 10n',
    region: 'nam',
    activeDai: ['TP.HCM'],
  });
  const checked = core.checkTickets(parsed.tickets, { 'TP.HCM': { db: ['123461'], g8: ['00'] } }, { region: 'nam', activeDai: ['TP.HCM'] });
  const summary = core.summarizeTickets(checked)[0];
  const report = core.formatPlayerReport(summary);
  assert.match(report, /KẾT QUẢ - người 1/);
  assert.match(report, /Xác:/);
  assert.match(report, /Thắng:/);
  assert.match(report, /Lãi\/lỗ:/);
  assert.equal(report.includes('STT |'), false);
  assert.equal(core.splitTelegramMessages(report, 40).length > 1, true);
});
