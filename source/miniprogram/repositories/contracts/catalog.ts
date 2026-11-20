import type { Game, ServiceCategory, ServiceQuery, ServiceListVO, HomeContent } from '../../types/catalog';
import type { PageResult } from '../../types/common';
import type { ServiceDetailVO } from '../../types/catalog';
import type { PlayerQuery, HomePlayer, PlayerDetailVO } from '../../types/catalog';
export interface CatalogRepository {
 playerDetail(playerId:string):Promise<PlayerDetailVO|null>;
 players(query:PlayerQuery):Promise<HomePlayer[]>;
 detail(serviceId:string):Promise<ServiceDetailVO|null>;
 games():Promise<Game[]>;
 categories():Promise<ServiceCategory[]>;
 services(query:ServiceQuery):Promise<PageResult<ServiceListVO>>;
 home():Promise<HomeContent>;
}
