import { mockStore } from '../mock/store';
import { playerDisplay } from '../mock/player-display';
import { isRestrictedCategory, isRestrictedBusinessText } from '../utils/restricted-business';
import { catalogConfig } from '../config/catalog';
import { isMoneyString } from '../types/common';
import type { MoneyString } from '../types/common';
import type { ServiceListVO, ServiceQuery, HomePlayer, ServiceDetailVO } from '../types/catalog';
import type { CatalogRepository } from './contracts/catalog';
import type { CatalogSeed } from '../mock/catalog-data';
import type { PlayerQuery, PlayerDetailVO } from '../types/catalog';

export function trustMetrics(kind:'service'|'player',id:string){
 const orders=mockStore.ordersSnapshot().filter(o=>(kind==='service'?o.serviceId:o.playerId)===id);
 const reviews=orders.flatMap(o=>o.review?.status==='VISIBLE'?[o.review]:[]);
 return {rating:reviews.length?Math.round(reviews.reduce((n,r)=>n+r.rating,0)/reviews.length*10)/10:null,
 positiveRate:null,
 completedOrders:orders.filter(o=>o.status==='COMPLETED').length};
}
function lowest(prices:MoneyString[]):MoneyString|null {
 for(const price of prices) if(!isMoneyString(price)) throw new Error('服务价格格式错误');
 // Compare decimal strings as integer cents, without floating point arithmetic.
 return prices.slice().sort((a,b)=>a.length-b.length || a.localeCompare(b))[0] ?? null;
}
export function projectServices(seed:CatalogSeed):ServiceListVO[] {
 return seed.services.filter(s=>s.status==='ACTIVE').sort((a,b)=>a.sortOrder-b.sortOrder || a.id.localeCompare(b.id)).flatMap(s=>{
  const game=seed.games.find(g=>g.id===s.gameId && g.status==='ACTIVE' && catalogConfig.enabledGameIds.includes(g.id));
  const category=seed.categories.find(c=>c.id===s.categoryId);
  const specs=seed.specs.filter(p=>p.serviceId===s.id&&p.status==='ACTIVE');
  if(!game||!category||isRestrictedCategory(category.id,category.name)||isRestrictedBusinessText(s.name,s.subtitle)||specs.some(p=>isRestrictedBusinessText(p.name)))return [];
  return [{id:s.id,game:{id:game.id,name:game.name},category:{id:category.id,name:category.name},name:s.name,subtitle:s.subtitle,coverUrl:'',
   priceFrom:lowest(specs.map(p=>p.price)),
   ...trustMetrics('service',s.id),recommended:s.recommended}];
 });
}
export function projectPlayers(seed:CatalogSeed,query:PlayerQuery={}):HomePlayer[] {
 const services=projectServices(seed);
 const keyword=(query.keyword||'').trim().toLocaleLowerCase();
 return seed.players.flatMap(p=>{
  const supported=services.filter(s=>seed.playerServices.some(link=>link.playerId===p.id&&link.serviceId===s.id&&link.status==='ACTIVE'));
  const level=p.level??'NORMAL';
  if(query.filter==='AVAILABLE'&&p.status!=='AVAILABLE'||query.filter==='GOLD'&&level!=='GOLD')return [];
  const display=playerDisplay(p.id);
  const fields=[display?.displayName??p.displayName,...(display?.tags??[]),...supported.flatMap(s=>[s.game.name,s.category.name,s.name,s.subtitle])];
  if(keyword&&!fields.some(value=>value.toLocaleLowerCase().includes(keyword)))return [];
  return [{id:p.id,displayName:display?.displayName??p.displayName,avatarUrl:display?.avatarUrl??'',bio:display?.bio??null,status:p.status,level,
   games:[...new Set(supported.map(s=>s.game.name))].join(' · '),tags:display?.tags??[...new Set(supported.map(s=>s.category.name))],
   priceFrom:lowest(supported.flatMap(s=>s.priceFrom===null?[]:[s.priceFrom])),...trustMetrics('player',p.id)}];
 });
}
export function projectPlayerDetail(seed:CatalogSeed,playerId:string):PlayerDetailVO|null {
 const player=projectPlayers(seed).find(p=>p.id===playerId);
 if(!player)return null;
 const services=projectServices(seed).filter(s=>seed.playerServices.some(link=>link.playerId===playerId&&link.serviceId===s.id&&link.status==='ACTIVE'));
 return {...player,bio:player.bio??null,positiveRate:trustMetrics('player',playerId).positiveRate,services};
}
export function projectDetail(seed:CatalogSeed,serviceId:string):ServiceDetailVO|null {
 const service=projectServices(seed).find(s=>s.id===serviceId);
 if(!service)return null;
 return {...service,description:service.subtitle,
  serviceInfo:{method:null,estimatedTime:null,availableTime:null},
  specs:seed.specs.filter(s=>s.serviceId===serviceId&&s.status==='ACTIVE').map(({id,serviceId,name,price})=>({id,serviceId,name,price})),
 };
}
async function read():Promise<CatalogSeed|null> {
 const epoch=mockStore.snapshot();
 const scenario=mockStore.getScenario();
 await new Promise<void>(resolve=>setTimeout(resolve,180));
 if(!mockStore.isCurrent(epoch)) throw new Error('数据已更新，请重试');
 if(scenario==='error') throw new Error('加载失败，请稍后重试');
 return scenario==='empty' ? null : mockStore.catalogSnapshot();
}
function queryServices(seed:CatalogSeed|null,query:ServiceQuery) {
 const page=query.page??1,pageSize=query.pageSize??20;
 if(!Number.isInteger(page)||page<1||!Number.isInteger(pageSize)||pageSize<1||pageSize>50) throw new Error('分页参数错误');
 const keyword=(query.keyword||'').trim().toLocaleLowerCase();
 const items=seed ? projectServices(seed).filter(s=>
  (!query.gameId||s.game.id===query.gameId) && (!query.categoryId||s.category.id===query.categoryId) &&
  (query.recommended===undefined||s.recommended===query.recommended) &&
  (!keyword||[s.name,s.subtitle,s.game.name].some(value=>value.toLocaleLowerCase().includes(keyword)))) : [];
 return {list:items.slice((page-1)*pageSize,page*pageSize),page,pageSize,total:items.length,hasMore:page*pageSize<items.length};
}
export const mockCatalog:CatalogRepository={
 async playerDetail(playerId){if(!playerId.trim())return null;const seed=await read();return seed?projectPlayerDetail(seed,playerId):null},
 async players(query){const seed=await read();return seed?projectPlayers(seed,query):[]},
 async detail(serviceId){if(!serviceId.trim())return null;const seed=await read();return seed?projectDetail(seed,serviceId):null},
 async games(){const seed=await read();return seed ? seed.games.filter(g=>g.status==='ACTIVE' && catalogConfig.enabledGameIds.includes(g.id)).map(({id,name,iconUrl,coverUrl})=>({id,name,iconUrl,coverUrl})) : []},
 async categories(){const seed=await read();return seed ? seed.categories.filter(c=>!isRestrictedCategory(c.id,c.name)) : []},
 async services(query){return queryServices(await read(),query)},
 async home(){
  const seed=await read();
  if(!seed)return {services:[],players:[]};
  const services=projectServices(seed);
  const players=projectPlayers(seed,{filter:'AVAILABLE'}).filter(p=>p.priceFrom!==null).slice(0,3);
  return {services:services.filter(s=>s.recommended).slice(0,4),players};
 },
};
