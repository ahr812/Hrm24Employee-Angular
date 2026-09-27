import {TestBed} from '@angular/core/testing';
import {Fish24GeographyService} from './fish24-geography.service';

describe('Fish24GeographyService',()=>{
 let service:Fish24GeographyService;
 beforeEach(()=>{TestBed.configureTestingModule({});service=TestBed.inject(Fish24GeographyService);});
 it('allows only Administrator and Sales management/export actions',()=>{
  expect(service.canManage('super-admin')).toBeTrue();expect(service.canManage('sales-expert')).toBeTrue();expect(service.canManage('support-expert')).toBeFalse();expect(service.canExport('support-expert')).toBeFalse();expect(service.createProvince('support-expert','گیلان').ok).toBeFalse();
 });
 it('creates active hierarchy with valid parents',()=>{
  expect(service.createProvince('super-admin','گیلان').ok).toBeTrue();const p=service.provinces().find(x=>x.name==='گیلان')!;expect(p.active).toBeTrue();expect(service.createCounty('sales-expert',p.id,'رشت').ok).toBeTrue();const c=service.counties().find(x=>x.name==='رشت')!;expect(c.provinceId).toBe(p.id);expect(service.createCity('super-admin',p.id,c.id,'رشت').ok).toBeTrue();expect(service.isCityAvailable(service.cities().find(x=>x.name==='رشت')!.id)).toBeTrue();
 });
 it('normalizes whitespace and Persian letters for scoped uniqueness including inactive records',()=>{
  expect(service.createProvince('super-admin','  تهران  ').ok).toBeFalse();expect(service.createCounty('super-admin',1,'تـهران'.replace('ـ','')).ok).toBeFalse();expect(service.toggle('super-admin','county',101).ok).toBeTrue();expect(service.createCounty('super-admin',1,'تهران').ok).toBeFalse();expect(service.createCounty('super-admin',2,'تهران').ok).toBeTrue();
 });
 it('rejects missing, incompatible and inactive ancestry',()=>{
  expect(service.createCounty('super-admin',999,'نمونه').ok).toBeFalse();expect(service.createCity('super-admin',1,102,'نمونه').ok).toBeFalse();service.toggle('super-admin','province',1);expect(service.createCounty('super-admin',1,'جدید').ok).toBeFalse();expect(service.createCity('super-admin',1,101,'جدید').ok).toBeFalse();expect(service.createProvince('super-admin','  ').ok).toBeFalse();
 });
 it('preserves identity and immutable parents on edit and propagates renamed display names',()=>{
  expect(service.updateCounty('super-admin',101,2,'تهران نو').ok).toBeFalse();expect(service.updateCity('super-admin',1001,102,'تهران نو').ok).toBeFalse();expect(service.updateProvince('super-admin',1,'تهران بزرگ').ok).toBeTrue();expect(service.resolveProvinceName('تهران')).toBe('تهران بزرگ');expect(service.county(101)?.provinceId).toBe(1);expect(service.city(1001)?.countyId).toBe(101);
 });
 it('keeps own child status while parent controls effective availability',()=>{
  expect(service.city(1001)?.active).toBeTrue();service.toggle('super-admin','province',1);expect(service.province(1)?.active).toBeFalse();expect(service.county(101)?.active).toBeTrue();expect(service.city(1001)?.active).toBeTrue();expect(service.isCityAvailable(1001)).toBeFalse();expect(service.cityOptions('تهران','تهران').map(x=>x.name)).toContain('تهران');service.toggle('super-admin','province',1);expect(service.isCityAvailable(1001)).toBeTrue();service.toggle('super-admin','city',1001);expect(service.isCityAvailable(1001)).toBeFalse();service.toggle('super-admin','province',1);service.toggle('super-admin','province',1);expect(service.isCityAvailable(1001)).toBeFalse();
 });
});
