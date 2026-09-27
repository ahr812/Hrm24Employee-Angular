import { Injectable, computed, signal } from '@angular/core';
import { Fish24RoleId } from '../models/fish24-role.model';

export interface GeographyProvince { readonly id:number; readonly name:string; readonly createdAt:string; readonly active:boolean; }
export interface GeographyCounty { readonly id:number; readonly provinceId:number; readonly name:string; readonly createdAt:string; readonly active:boolean; }
export interface GeographyCity { readonly id:number; readonly countyId:number; readonly name:string; readonly createdAt:string; readonly active:boolean; }
export type GeographyKind='province'|'county'|'city';
export interface GeographyResult { readonly ok:boolean; readonly error:string; }

const MANAGER_ROLES:readonly Fish24RoleId[]=['super-admin','sales-expert'];

@Injectable({providedIn:'root'})
export class Fish24GeographyService {
  private readonly provinceRecords=signal<readonly GeographyProvince[]>([
    {id:1,name:'تهران',createdAt:'۱۴۰۳/۰۲/۱۸',active:true},
    {id:2,name:'البرز',createdAt:'۱۴۰۳/۰۲/۱۸',active:true}
  ]);
  private readonly countyRecords=signal<readonly GeographyCounty[]>([
    {id:101,provinceId:1,name:'تهران',createdAt:'۱۴۰۳/۰۲/۱۸',active:true},
    {id:102,provinceId:2,name:'کرج',createdAt:'۱۴۰۳/۰۲/۱۸',active:true}
  ]);
  private readonly cityRecords=signal<readonly GeographyCity[]>([
    {id:1001,countyId:101,name:'تهران',createdAt:'۱۴۰۳/۰۲/۱۸',active:true},
    {id:1002,countyId:102,name:'کرج',createdAt:'۱۴۰۳/۰۲/۱۸',active:true}
  ]);
  private readonly provinceAliases=new Map<string,number>([['تهران',1],['البرز',2]]);
  private readonly countyAliases=new Map<string,number>([['تهران',101],['کرج',102]]);
  private readonly cityAliases=new Map<string,number>([['تهران',1001],['کرج',1002]]);

  readonly provinces=computed(()=>[...this.provinceRecords()].sort((a,b)=>a.id-b.id));
  readonly counties=computed(()=>[...this.countyRecords()].sort((a,b)=>a.id-b.id));
  readonly cities=computed(()=>[...this.cityRecords()].sort((a,b)=>a.id-b.id));

  canManage(role:Fish24RoleId){return MANAGER_ROLES.includes(role);} canExport(role:Fish24RoleId){return this.canManage(role);}
  province(id:number){return this.provinces().find(x=>x.id===id)??null;} county(id:number){return this.counties().find(x=>x.id===id)??null;} city(id:number){return this.cities().find(x=>x.id===id)??null;}
  provinceName(id:number){return this.province(id)?.name??'—';} countyName(id:number){return this.county(id)?.name??'—';}
  provinceForCounty(countyId:number){const county=this.county(countyId);return county?this.province(county.provinceId):null;}
  countyForCity(cityId:number){const city=this.city(cityId);return city?this.county(city.countyId):null;}
  provinceForCity(cityId:number){const county=this.countyForCity(cityId);return county?this.province(county.provinceId):null;}
  isProvinceAvailable(id:number){return this.province(id)?.active===true;}
  isCountyAvailable(id:number){const county=this.county(id);return !!county?.active&&this.isProvinceAvailable(county.provinceId);}
  isCityAvailable(id:number){const city=this.city(id);return !!city?.active&&this.isCountyAvailable(city.countyId);}

  createProvince(role:Fish24RoleId,name:string){if(!this.canManage(role))return this.denied();const valid=this.validName(name);if('error'in valid)return valid;if(this.provinces().some(x=>this.key(x.name)===valid.key))return this.fail('نام استان تکراری است.');const id=Math.max(0,...this.provinces().map(x=>x.id))+1;this.provinceRecords.update(items=>[...items,{id,name:valid.display,createdAt:'۱۴۰۵/۰۷/۰۵',active:true}]);this.provinceAliases.set(valid.key,id);return this.ok();}
  createCounty(role:Fish24RoleId,provinceId:number,name:string){if(!this.canManage(role))return this.denied();if(!this.isProvinceAvailable(provinceId))return this.fail('استان انتخاب‌شده وجود ندارد یا برای انتخاب جدید فعال نیست.');const valid=this.validName(name);if('error'in valid)return valid;if(this.counties().some(x=>x.provinceId===provinceId&&this.key(x.name)===valid.key))return this.fail('نام شهرستان در این استان تکراری است.');const id=Math.max(100,...this.counties().map(x=>x.id))+1;this.countyRecords.update(items=>[...items,{id,provinceId,name:valid.display,createdAt:'۱۴۰۵/۰۷/۰۵',active:true}]);this.countyAliases.set(valid.key,id);return this.ok();}
  createCity(role:Fish24RoleId,provinceId:number,countyId:number,name:string){if(!this.canManage(role))return this.denied();const county=this.county(countyId);if(!county||county.provinceId!==provinceId)return this.fail('شهرستان با استان انتخاب‌شده سازگار نیست.');if(!this.isCityParentAvailable(countyId))return this.fail('استان یا شهرستان انتخاب‌شده برای انتخاب جدید فعال نیست.');const valid=this.validName(name);if('error'in valid)return valid;if(this.cities().some(x=>x.countyId===countyId&&this.key(x.name)===valid.key))return this.fail('نام شهر در این شهرستان تکراری است.');const id=Math.max(1000,...this.cities().map(x=>x.id))+1;this.cityRecords.update(items=>[...items,{id,countyId,name:valid.display,createdAt:'۱۴۰۵/۰۷/۰۵',active:true}]);this.cityAliases.set(valid.key,id);return this.ok();}

  updateProvince(role:Fish24RoleId,id:number,name:string){if(!this.canManage(role))return this.denied();const current=this.province(id);if(!current)return this.fail('استان یافت نشد.');const valid=this.validName(name);if('error'in valid)return valid;if(this.provinces().some(x=>x.id!==id&&this.key(x.name)===valid.key))return this.fail('نام استان تکراری است.');this.provinceAliases.set(this.key(current.name),id);this.provinceRecords.update(items=>items.map(x=>x.id===id?{...x,name:valid.display}:x));return this.ok();}
  updateCounty(role:Fish24RoleId,id:number,provinceId:number,name:string){if(!this.canManage(role))return this.denied();const current=this.county(id);if(!current)return this.fail('شهرستان یافت نشد.');if(current.provinceId!==provinceId)return this.fail('استان شهرستان موجود قابل تغییر نیست.');const valid=this.validName(name);if('error'in valid)return valid;if(this.counties().some(x=>x.id!==id&&x.provinceId===provinceId&&this.key(x.name)===valid.key))return this.fail('نام شهرستان در این استان تکراری است.');this.countyAliases.set(this.key(current.name),id);this.countyRecords.update(items=>items.map(x=>x.id===id?{...x,name:valid.display}:x));return this.ok();}
  updateCity(role:Fish24RoleId,id:number,countyId:number,name:string){if(!this.canManage(role))return this.denied();const current=this.city(id);if(!current)return this.fail('شهر یافت نشد.');if(current.countyId!==countyId)return this.fail('شهرستان شهر موجود قابل تغییر نیست.');const valid=this.validName(name);if('error'in valid)return valid;if(this.cities().some(x=>x.id!==id&&x.countyId===countyId&&this.key(x.name)===valid.key))return this.fail('نام شهر در این شهرستان تکراری است.');this.cityAliases.set(this.key(current.name),id);this.cityRecords.update(items=>items.map(x=>x.id===id?{...x,name:valid.display}:x));return this.ok();}

  toggle(role:Fish24RoleId,kind:GeographyKind,id:number){if(!this.canManage(role))return this.denied();if(kind==='province'){if(!this.province(id))return this.fail('استان یافت نشد.');this.provinceRecords.update(items=>items.map(x=>x.id===id?{...x,active:!x.active}:x));}else if(kind==='county'){if(!this.county(id))return this.fail('شهرستان یافت نشد.');this.countyRecords.update(items=>items.map(x=>x.id===id?{...x,active:!x.active}:x));}else{if(!this.city(id))return this.fail('شهر یافت نشد.');this.cityRecords.update(items=>items.map(x=>x.id===id?{...x,active:!x.active}:x));}return this.ok();}

  provinceOptions(current=''){const currentId=this.provinceIdByName(current);return this.provinces().filter(x=>x.active||x.id===currentId);}
  countyOptions(provinceName:string,current=''){const provinceId=this.provinceIdByName(provinceName);const currentId=this.countyIdByName(current);return this.counties().filter(x=>x.provinceId===provinceId&&(this.isCountyAvailable(x.id)||x.id===currentId));}
  cityOptions(countyName:string,current=''){const countyId=this.countyIdByName(countyName);const currentId=this.cityIdByName(current);return this.cities().filter(x=>x.countyId===countyId&&(this.isCityAvailable(x.id)||x.id===currentId));}
  provinceIdByName(name:string){return this.provinceAliases.get(this.key(name))??this.provinces().find(x=>this.key(x.name)===this.key(name))?.id??null;}
  countyIdByName(name:string){return this.countyAliases.get(this.key(name))??this.counties().find(x=>this.key(x.name)===this.key(name))?.id??null;}
  cityIdByName(name:string){return this.cityAliases.get(this.key(name))??this.cities().find(x=>this.key(x.name)===this.key(name))?.id??null;}
  resolveProvinceName(name:string){const id=this.provinceIdByName(name);return id?this.provinceName(id):name;}
  resolveCountyName(name:string){const id=this.countyIdByName(name);return id?this.countyName(id):name;}
  resolveCityName(name:string){const id=this.cityIdByName(name);return id?this.city(id)?.name??name:name;}
  ownStatus(kind:GeographyKind,id:number){return kind==='province'?this.province(id)?.active:kind==='county'?this.county(id)?.active:this.city(id)?.active;}
  effectivelyAvailable(kind:GeographyKind,id:number){return kind==='province'?this.isProvinceAvailable(id):kind==='county'?this.isCountyAvailable(id):this.isCityAvailable(id);}

  private isCityParentAvailable(countyId:number){return this.isCountyAvailable(countyId);}
  private validName(name:string):{display:string;key:string}|GeographyResult{const display=name.trim().replace(/\s+/g,' ');if(!display)return this.fail('نام الزامی است.');return{display,key:this.key(display)};}
  private key(value:string){return value.trim().replace(/\s+/g,' ').replace(/ي/g,'ی').replace(/ك/g,'ک').toLocaleLowerCase('fa-IR');}
  private ok():GeographyResult{return{ok:true,error:''};} private fail(error:string):GeographyResult{return{ok:false,error};} private denied(){return this.fail('دسترسی مدیریت مناطق جغرافیایی را ندارید.');}
}
