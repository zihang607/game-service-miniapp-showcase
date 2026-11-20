import type { ID, MoneyString, PlayerStatus } from './common';
export interface NamedItem { id:ID; name:string }
export interface Game extends NamedItem { iconUrl:string; coverUrl:string }
export interface ServiceCategory extends NamedItem { iconUrl:string }
export interface ServiceListVO {
 id:ID; game:NamedItem; category:NamedItem; name:string; subtitle:string; coverUrl:string;
 priceFrom:MoneyString|null; rating:number|null; completedOrders:number; recommended:boolean;
}
export interface ServiceQuery { gameId?:ID; categoryId?:ID; keyword?:string; recommended?:boolean; page?:number; pageSize?:number }
export type PlayerRank='gold'|'silver'|'bronze';
export type PlayerListFilter=NonNullable<PlayerQuery['filter']>|'SILVER'|'BRONZE';
export interface HomePlayer {
 id:ID; displayName:string; avatarUrl:string; status:PlayerStatus; level:'NORMAL'|'GOLD';
 playerRank?:PlayerRank|null; bio?:string|null;
 games:string; tags:string[]; priceFrom:MoneyString|null; rating:number|null; completedOrders:number;
}
export interface HomeContent { services:ServiceListVO[]; players:HomePlayer[] }
export interface PlayerQuery { keyword?:string; filter?:'ALL'|'AVAILABLE'|'GOLD' }
export interface PlayerDetailVO extends HomePlayer {
 bio:string|null; positiveRate:number|null; services:ServiceListVO[];
}
export interface ServiceSpecVO { id:ID; serviceId:ID; name:string; price:MoneyString }
export interface ServiceDetailVO extends ServiceListVO {
 description:string;
 serviceInfo:{method:string|null; estimatedTime:string|null; availableTime:string|null};
 specs:ServiceSpecVO[];
}
