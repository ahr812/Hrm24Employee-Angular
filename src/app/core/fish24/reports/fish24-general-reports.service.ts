import { Injectable, inject } from '@angular/core';
import { Fish24NewsPreviewService } from '../news/fish24-news-preview.service';
import { Fish24NewsCommentPreviewService } from '../news/fish24-news-comment-preview.service';
import { Fish24NewsEngagementPreviewService } from '../news/fish24-news-engagement-preview.service';
import { InternalSmsHistoryPreviewService } from '../../../features/fish24/internal/sms/internal-sms-history-preview.service';
import { Fish24ReportPeriod, Fish24ReportPeriodBounds, currentTehranJalaliDate, dateInFish24Range, fish24ReportPeriodBounds, tehranSaturdayWeekday } from './fish24-report-calendar';

export type Fish24GeneralMetricId='activeNews'|'views'|'likes'|'manualSms';
export interface Fish24GeneralComparison{readonly id:Fish24GeneralMetricId;readonly current:number;readonly previous:number|null;readonly bounds:Fish24ReportPeriodBounds;}
export interface Fish24CommentSnapshot{readonly approved:number;readonly unapproved:number;readonly total:number;}

@Injectable({providedIn:'root'})
export class Fish24GeneralReportsService{
  private readonly news=inject(Fish24NewsPreviewService);private readonly comments=inject(Fish24NewsCommentPreviewService);private readonly engagement=inject(Fish24NewsEngagementPreviewService);private readonly sms=inject(InternalSmsHistoryPreviewService);
  comparison(id:Fish24GeneralMetricId,period:Fish24ReportPeriod,now=new Date()):Fish24GeneralComparison{const bounds=fish24ReportPeriodBounds(period,currentTehranJalaliDate(now),tehranSaturdayWeekday(now));const dates=this.dates(id);const count=(range:Fish24ReportPeriodBounds['current'])=>dates.filter(date=>dateInFish24Range(date,range)).length;return{id,current:count(bounds.current),previous:bounds.previous?count(bounds.previous):null,bounds};}
  commentSnapshot():Fish24CommentSnapshot{const items=this.comments.comments();const approved=items.filter(item=>item.approved).length;return{approved,unapproved:items.length-approved,total:items.length};}
  currentJalaliDate(now=new Date()):string{return currentTehranJalaliDate(now);}
  private dates(id:Fish24GeneralMetricId):readonly string[]{if(id==='activeNews')return this.news.news().filter(item=>item.active).map(item=>item.createdAt);if(id==='manualSms')return this.sms.records().map(item=>item.sentAt);const kind=id==='views'?'view':'like';return this.engagement.events().filter(event=>event.kind===kind&&this.news.newsItem(event.newsId)).map(event=>event.occurredAt);}
}
