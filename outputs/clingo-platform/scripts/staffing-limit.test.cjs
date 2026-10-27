const {test}=require('node:test');
const assert=require('node:assert/strict');
const {staffingLimit,assertOfferStaffing,assertStaffingReduction}=require('../apps/api/dist/provider/provider-staffing');
const {defaultOfferConfiguration}=require('../apps/api/dist/provider/provider-offers.input');
const {ProviderEmployeeEntity}=require('../apps/api/dist/provider/provider.entity');
const configuration=workers=>({...defaultOfferConfiguration(),areaTiers:[{minSquareMeters:1,maxSquareMeters:null,workers}]});
test('R04: solo is always one; team is bounded by declaration, roster and the existing system maximum',()=>{
  assert.equal(staffingLimit({staffingMode:'solo',declaredStaff:20},20),1);
  assert.equal(staffingLimit({staffingMode:'team',declaredStaff:2},3),2);
  assert.equal(staffingLimit({staffingMode:'team',declaredStaff:4},2),2);
  assert.equal(staffingLimit({staffingMode:'team',declaredStaff:null},3),3);
  assert.equal(staffingLimit({staffingMode:'team',declaredStaff:null},0),1);
  assert.equal(staffingLimit({staffingMode:'team',declaredStaff:null},80),50);
});
test('R04: explicit excess tiers reject without mutation; bootstrap draft is possible but empty roster cannot publish',async()=>{
  const account={id:'a',staffingMode:'team',declaredStaff:2};let count=2;
  const manager={find:async()=>Array.from({length:count},(_,id)=>({id}))};
  const invalid=configuration(3),before=structuredClone(invalid);
  await assert.rejects(()=>assertOfferStaffing(manager,account,invalid,false),error=>error.getStatus()===400);
  assert.deepEqual(invalid,before);await assertOfferStaffing(manager,account,configuration(2),true);
  count=0;await assertOfferStaffing(manager,account,configuration(1),false);
  await assert.rejects(()=>assertOfferStaffing(manager,account,configuration(1),true),error=>error.getStatus()===400);
  count=2;await assert.rejects(()=>assertOfferStaffing(manager,{...account,staffingMode:'solo'},configuration(2),false));
});
test('R04: reducing the team is blocked by current drafts and publications, while archives do not prevent removal',async()=>{
  const account={id:'a',staffingMode:'team',declaredStaff:null};
  const offer={id:'service',title:'Duża usługa',status:'draft',configuration:configuration(3)};
  const manager={find:async entity=>entity===ProviderEmployeeEntity?[]:[offer]};
  await assert.rejects(()=>assertStaffingReduction(manager,account,2),error=>error.getStatus()===409);
  offer.status='archived';await assertStaffingReduction(manager,account,2);
  offer.status='published';offer.configuration=configuration(1);
  await assert.rejects(()=>assertStaffingReduction(manager,account,0),error=>error.getStatus()===409);
});
