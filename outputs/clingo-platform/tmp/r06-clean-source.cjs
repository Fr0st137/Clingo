const fs=require('node:fs');const path='apps/api/src/provider/provider-multi-orders.service.ts';let text=fs.readFileSync(path,'utf8');
const start=text.indexOf('      if (input.action === "reject")'),end=text.indexOf('\n    });',start);if(start<0||end<start)throw Error('Unexpected service structure');
text=text.slice(0,start)+'      order.status = "rejected"; order.revision += 1;\n      return multiOrderView(await manager.save(ProviderMultiOrderEntity, order));'+text.slice(end);
text=text.replace(/const validDate =[\s\S]*?(?=@Injectable\(\))/,'');
text=text.replace('BadRequestException, ','').replace('{ In, Repository }','{ Repository }').replace(', type ProviderMultiOrderSession','').replace('ProviderAccountEntity, ProviderEmployeeEntity, ProviderMembershipEntity','ProviderAccountEntity, ProviderMembershipEntity');
for(const line of ['import { ProviderClientEntity } from "./provider-clients.entity";','import { ProviderJobEntity } from "./provider-jobs.entity";','import { ProviderOfferEntity } from "./provider-offers.entity";','import { accountBookings, bookingJobs } from "../dashboard/booking-bridge";'])text=text.replace(line+'\r\n','').replace(line+'\n','');
fs.writeFileSync(path,text);
