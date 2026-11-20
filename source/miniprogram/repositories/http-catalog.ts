import { request, ApiError } from '../infrastructure/http-client';
import { catalogConfig } from '../config/catalog';
import { isMoneyString } from '../types/common';
import { isRestrictedCategory, isRestrictedBusinessText } from '../utils/restricted-business';
import type { CatalogRepository } from './contracts/catalog';
import type { Game, ServiceCategory, ServiceListVO, HomePlayer } from '../types/catalog';
type Row=Record<string,unknown>;
function row(v:unknown):Row {if(!v||typeof v!=='object'||Array.isArray(v))throw new Error('数据格式错误');return v as Row}
function list(v:unknown):unknown[]{if(!Array.isArray(v))throw new Error('列表格式错误');return v}
function str(v:unknown):string{if(typeof v!=='string')throw new Error('文本格式错误');return v}
function optional(v:unknown):string|null{return v==null?null:str(v)}
function id(v:unknown):string{const s=str(v);if(!/^[1-9]\d*$/.test(s))throw new Error('ID 格式错误');return s}
function money(v:unknown):string|null{if(v===null)return null;if(!isMoneyString(v))throw new Error('金额格式错误');return v}
function metric(v:unknown):number|null{if(v===null)return null;if(typeof v!=='number'||!Number.isFinite(v))throw new Error('指标错误');return v}
function game(value:unknown):Game{const v=row(value);return {id:id(v.id),name:str(v.name),iconUrl:optional(v.iconUrl)??'',coverUrl:optional(v.coverUrl)??''}}
function category(value:unknown):ServiceCategory|null{
 if(!value||typeof value!=='object'||Array.isArray(value))return null;
 const v=value as Row;
 if(typeof v.id!=='string'||! /^[1-9][0-9]*$/.test(v.id)||typeof v.name!=='string'||!v.name.trim()||(v.status!==undefined&&v.status!=='ACTIVE')||isRestrictedCategory(v.id,v.name))return null;
 return {id:v.id,name:v.name,iconUrl:typeof v.iconUrl==='string'?v.iconUrl:''};
}
const get=(path:string)=>request(path,v=>v);
async function nullable<T>(read:()=>Promise<T>):Promise<T|null>{try{return await read()}catch(e){if(e instanceof ApiError&&(e.status===404||e.code===40400))return null;throw e}}
async function dictionaries(){const [games,categories]=await Promise.all([httpCatalog.games(),httpCatalog.categories()]);return {games,categories}}
function service(value:unknown,dict:{games:Game[];categories:ServiceCategory[]}):ServiceListVO|null{
 const v=row(value),gameId=id(v.gameId),categoryId=v.categoryId,g=dict.games.find(g=>g.id===gameId);
 if(!g||v.status!=='ACTIVE')return null;
 if(typeof categoryId!=='string'||! /^[1-9][0-9]*$/.test(categoryId))return null;
 const c=dict.categories.find(c=>c.id===categoryId);if(!c)return null;
 const name=str(v.name),subtitle=optional(v.subtitle)??'',tags=v.tags==null?[]:list(v.tags).map(str);
  if(isRestrictedBusinessText(name,subtitle,...tags))return null;
 return {id:id(v.id),game:{id:g.id,name:g.name},category:{id:c.id,name:c.name},name,subtitle,coverUrl:optional(v.coverUrl)??'',priceFrom:money(v.priceFrom),rating:metric(v.rating??null),completedOrders:metric(v.completedOrders??null)??0,recommended:v.recommended===true};
}
function player(value:unknown):HomePlayer{
 const v=row(value),status=v.status,level=v.level;
 if(status!=='AVAILABLE'&&status!=='BUSY'&&status!=='OFFLINE')throw new Error('状态错误');
 if(!['NORMAL','GOLD','SILVER','BRONZE'].includes(String(level)))throw new Error('等级错误');
 const completedOrders=metric(v.completedOrders);if(completedOrders===null||!Number.isInteger(completedOrders)||completedOrders<0)throw new Error('数量错误');
 return {id:id(v.id),displayName:str(v.displayName),avatarUrl:optional(v.avatarUrl)??'',bio:optional(v.bio),status,level:level==='GOLD'?'GOLD':'NORMAL',playerRank:level==='GOLD'?'gold':level==='SILVER'?'silver':level==='BRONZE'?'bronze':null,rating:metric(v.rating),completedOrders,
 games:list(v.games).map(game).filter(g=>catalogConfig.enabledGameIds.includes(g.id)).map(g=>g.name).join(' · '),tags:list(v.tags).map(str),priceFrom:money(v.priceFrom)};
}
export const httpCatalog:CatalogRepository={
 async games(){return list(await get('/games')).map(game).filter(g=>catalogConfig.enabledGameIds.includes(g.id))},
 async categories(){return list(await get('/service-categories')).map(category).filter((c):c is ServiceCategory=>c!==null)},
 async services(query){
 const page=query.page??1,pageSize=query.pageSize??20;
 if(!Number.isInteger(page)||page<1||!Number.isInteger(pageSize)||pageSize<1||pageSize>50)throw new Error('分页参数错误');
 const params:string[]=[];if(query.categoryId)params.push('categoryId='+encodeURIComponent(query.categoryId));if(query.keyword?.trim())params.push('keyword='+encodeURIComponent(query.keyword.trim()));
 const [data,dict]=await Promise.all([get('/services'+(params.length?'?'+params.join('&'):'')),dictionaries()]);
 const items=list(data).map(v=>service(v,dict)).filter((s):s is ServiceListVO=>s!==null).filter(s=>(!query.gameId||s.game.id===query.gameId)&&(!query.categoryId||s.category.id===query.categoryId)&&(query.recommended===undefined||s.recommended===query.recommended));
 return {list:items.slice((page-1)*pageSize,page*pageSize),page,pageSize,total:items.length,hasMore:page*pageSize<items.length};
 },
 async detail(serviceId){if(!serviceId.trim())return null;return nullable(async()=>{
 const [data,dict]=await Promise.all([get('/services/'+encodeURIComponent(id(serviceId))),dictionaries()]);const v=row(data),base=service(v,dict);if(!base)return null;
 const description=optional(v.description)??'',method=optional(v.serviceMethod),estimatedTime=optional(v.estimatedTime),availableTime=optional(v.availableTime);
 const specs=list(v.specs).map(value=>{const s=row(value),price=money(s.price);if(price===null)throw new Error('规格价格缺失');return {id:id(s.id),serviceId:base.id,name:str(s.name),price}});
 if(isRestrictedBusinessText(description,method,estimatedTime,availableTime,...specs.map(s=>s.name)))return null;
 return {...base,description,serviceInfo:{method,estimatedTime,availableTime},specs};
 })},
 async players(query){const keyword=(query.keyword??'').trim().toLocaleLowerCase();return list(await get('/players')).map(player).filter(p=>(query.filter!=='AVAILABLE'||p.status==='AVAILABLE')&&(query.filter!=='GOLD'||p.level==='GOLD')&&(!keyword||[p.displayName,p.games,...p.tags].some(v=>v.toLocaleLowerCase().includes(keyword))))},
 async playerDetail(playerId){if(!playerId.trim())return null;return nullable(async()=>{
 const [data,services,dict]=await Promise.all([get('/players/'+encodeURIComponent(id(playerId))),get('/services'),dictionaries()]);const v=row(data),supported=new Set(list(v.services).map(s=>id(row(s).id)));
 return {...player(v),bio:optional(v.bio),positiveRate:metric(v.positiveRate),services:list(services).map(s=>service(s,dict)).filter((s):s is ServiceListVO=>s!==null&&supported.has(s.id))};
 })},
 async home(){const [services,players]=await Promise.all([httpCatalog.services({pageSize:4}),httpCatalog.players({filter:'AVAILABLE'})]);return {services:services.list,players:players.filter(p=>p.priceFrom!==null).slice(0,3)}},
};
