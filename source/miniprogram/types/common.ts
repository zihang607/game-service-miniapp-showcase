export type ID = string;
/** Runtime boundaries must validate two decimal places. */
export type MoneyString = string;
export type UserRole = 'CUSTOMER' | 'PLAYER' | 'ADMIN';
export type PlayerStatus = 'AVAILABLE' | 'BUSY' | 'OFFLINE';
export type OrderStatus = 'UNPAID' | 'WAITING_ACCEPT' | 'ACCEPTED' | 'IN_SERVICE' | 'WAITING_CONFIRM' | 'COMPLETED' | 'CANCELLED';
export interface ApiResponse<T> {
    code: number;
    message: string;
    data: T | null;
}
export interface PageResult<T> {
    list: T[];
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
}
export type PageState = 'loading' | 'empty' | 'error' | 'normal';
export const ORDER_LABELS: Record<OrderStatus, string> = {
    UNPAID: '待付款', WAITING_ACCEPT: '待接单', ACCEPTED: '已接单', IN_SERVICE: '服务中', WAITING_CONFIRM: '待确认', COMPLETED: '已完成', CANCELLED: '已取消'
};
export const PLAYER_LABELS: Record<PlayerStatus, string> = {
    AVAILABLE: '可接单', BUSY: '忙碌', OFFLINE: '离线'
};
export function isMoneyString(value: unknown): value is MoneyString { return typeof value === 'string' && /^(0|[1-9]\d*)\.\d{2}$/.test(value); }
