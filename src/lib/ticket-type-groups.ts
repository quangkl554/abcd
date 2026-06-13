export const TICKET_TYPE_GROUPS = [
  { id: 'lo', label: 'Bao lô (2C)', tone: 'blue', loai: ['Lo'] },
  { id: 'dau-duoi', label: 'Đầu đuôi (2C)', tone: 'amber', loai: ['Dau', 'Duoi', 'DauDuoi'] },
  { id: '3cang', label: '3 càng', tone: 'mint', loai: ['3Cang'] },
  { id: 'xiu-chu', label: 'Xỉu chủ', tone: 'rose', loai: ['XiuChu', 'XiuChuDau', 'XiuChuDuoi', 'DauDuoi3C', 'Dau3C', 'Duoi3C'] },
  { id: '4cang', label: '4 càng', tone: 'lavender', loai: ['4Cang'] },
  { id: 'xien', label: 'Xiên', tone: 'teal', loai: ['Xien2', 'Xien3', 'Xien4'] },
] as const;

export type TicketTypeGroupId = (typeof TICKET_TYPE_GROUPS)[number]['id'];

const TICKET_TYPE_GROUP_IDS = new Set<string>(TICKET_TYPE_GROUPS.map(group => group.id));

export function normalizeTicketTypeGroupIds(value: string | null | undefined): TicketTypeGroupId[] {
  if (!value) return [];
  return [...new Set(value.split(',').map(item => item.trim()).filter(item => TICKET_TYPE_GROUP_IDS.has(item)))] as TicketTypeGroupId[];
}

export function ticketTypesForGroups(groupIds: readonly string[]) {
  const selected = new Set(groupIds);
  return TICKET_TYPE_GROUPS
    .filter(group => selected.has(group.id))
    .flatMap(group => [...group.loai]);
}
