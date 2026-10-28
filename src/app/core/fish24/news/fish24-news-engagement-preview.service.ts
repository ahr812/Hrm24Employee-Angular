import { Injectable, signal } from '@angular/core';
import { addJalaliDays, currentTehranJalaliDate, fish24ReportPeriodBounds, tehranSaturdayWeekday } from '../reports/fish24-report-calendar';

export type Fish24NewsEngagementKind = 'view' | 'like';
export interface Fish24NewsEngagementEvent { readonly id: string; readonly newsId: number; readonly kind: Fish24NewsEngagementKind; readonly occurredAt: string; readonly mock: true; }

function demoEvents(now: Date): readonly Fish24NewsEngagementEvent[] {
  const today=currentTehranJalaliDate(now); const month=fish24ReportPeriodBounds('month',today,tehranSaturdayWeekday(now)); const previous=month.previous!.start!;
  const [year,monthNumber]=today.split('/').map(Number); const old=`${year-1}/${String(monthNumber).padStart(2,'0')}/10`;
  const buckets: readonly [number,Fish24NewsEngagementKind,string,number][]=[
    [401,'view',today,150],[401,'view',previous,60],[401,'view',old,38],
    [402,'view',today,50],[402,'view',addJalaliDays(previous,1),20],[402,'view',old,21],
    [401,'like',today,6],[401,'like',previous,3],[401,'like',old,3],
    [402,'like',today,2],[402,'like',previous,1],[402,'like',old,1]
  ];
  return buckets.flatMap(([newsId,kind,date,count])=>Array.from({length:count},(_,index)=>({id:`mock-${kind}-${newsId}-${date.replaceAll('/','')}-${index+1}`,newsId,kind,occurredAt:`${date} 12:00`,mock:true as const})));
}

@Injectable({providedIn:'root'})
export class Fish24NewsEngagementPreviewService {
  private readonly state=signal<readonly Fish24NewsEngagementEvent[]>(demoEvents(new Date()));
  readonly events=this.state.asReadonly();
  removeForNews(newsId:number):void{this.state.update(events=>events.filter(event=>event.newsId!==newsId));}
}
