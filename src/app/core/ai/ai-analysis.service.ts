import { Injectable } from '@angular/core';
import { EvaluationDimension, MyEvaluation } from '../data/employee-data.service';

// ═══════════════════════════════════════
// Interfaces
// ═══════════════════════════════════════

export interface SentimentResult {
    label: 'مثبت' | 'منفی' | 'خنثی';
    score: number; // -1 تا +1
    keywords: string[];
}

export interface DevelopmentSuggestion {
    dimension: string;
    priority: 'بالا' | 'متوسط' | 'پایین';
    suggestion: string;
    actionType: 'دوره آموزشی' | 'منتورینگ' | 'مطالعه شخصی' | 'پروژه عملی' | 'کارگاه';
    estimatedEffort: string;
}

export interface TrendPrediction {
    direction: 'صعودی' | 'نزولی' | 'ثابت';
    predictedNextScore: number;
    confidence: number; // 0-100
    description: string;
}

export interface TeamPattern {
    type: 'strength' | 'weakness';
    dimension: string;
    description: string;
    affectedMembers: number;
    recommendation: string;
}

export interface AISummary {
    overallAssessment: string;
    keyStrengths: string[];
    keyWeaknesses: string[];
    sentimentOverview: string;
    developmentFocus: string;
    trendOutlook: string;
}

export interface FullAIAnalysis {
    sentiment: SentimentResult;
    suggestions: DevelopmentSuggestion[];
    prediction: TrendPrediction;
    teamPatterns: TeamPattern[];
    summary: AISummary;
}

@Injectable({ providedIn: 'root' })
export class AIAnalysisService {

    // ═══════════════════════════════════════
    // 1. تحلیل احساسات (Sentiment Analysis)
    // ═══════════════════════════════════════

    private readonly POSITIVE_WORDS = [
        'عالی', 'خوب', 'بهترین', 'قوی', 'موفق', 'پیشرفت', 'رشد', 'توانمند',
        'موثر', 'کارآمد', 'خلاق', 'نوآور', 'متعهد', 'مسئولیت‌پذیر', 'حرفه‌ای',
        'دقیق', 'منظم', 'همکاری', 'ارتباط', 'رهبری', 'انگیزه', 'اشتیاق',
        'کیفیت', 'سرعت', 'دانش', 'تخصص', 'تجربه', 'قابل اعتماد', 'صادق',
        'پشتکار', 'صبور', 'انعطاف‌پذیر', 'حل مسئله', 'تحلیل', 'برنامه‌ریزی',
        'بهبود', 'ارتقا', 'ارزشمند', 'سازنده', 'مثبت', 'امیدوار', 'مطمئن',
        'استثنایی', 'چشمگیر', 'قابل تحسین', 'فراتر از انتظار', 'بی‌نظیر'
    ];

    private readonly NEGATIVE_WORDS = [
        'ضعیف', 'بد', 'نامناسب', 'ناکافی', 'مشکل', 'افت', 'کاهش', 'نقص',
        'تاخیر', 'غیبت', 'بی‌نظمی', 'عدم', 'فاقد', 'کمبود', 'نیاز', 'ضعف',
        'ناسازگار', 'ناموفق', 'ناامید', 'بی‌انگیزه', 'بی‌توجه', 'سهل‌انگار',
        'خطا', 'اشتباه', 'تکرار', 'شکایت', 'تنش', 'تعامل ضعیف', 'ارتباط ضعیف',
        'مقاومت', 'عدم همکاری', 'بی‌مسئولیتی', 'نامنظم', 'آشفته', 'گیج',
        'ناکارآمد', 'کند', 'عقب', 'جاماندن', 'نادیده', 'فراموش', 'بی‌دقت'
    ];

    /**
     * تحلیل احساسات متن فارسی
     */
    analyzeSentiment(text: string): SentimentResult {
        if (!text || text.trim().length === 0) {
            return { label: 'خنثی', score: 0, keywords: [] };
        }

        const normalizedText = text.toLowerCase().trim();
        let positiveCount = 0;
        let negativeCount = 0;
        const foundKeywords: string[] = [];

        for (const word of this.POSITIVE_WORDS) {
            if (normalizedText.includes(word)) {
                positiveCount++;
                foundKeywords.push(word);
            }
        }

        for (const word of this.NEGATIVE_WORDS) {
            if (normalizedText.includes(word)) {
                negativeCount++;
                foundKeywords.push(word);
            }
        }

        const total = positiveCount + negativeCount;
        if (total === 0) {
            return { label: 'خنثی', score: 0, keywords: [] };
        }

        const score = (positiveCount - negativeCount) / total;

        let label: 'مثبت' | 'منفی' | 'خنثی';
        if (score > 0.2) label = 'مثبت';
        else if (score < -0.2) label = 'منفی';
        else label = 'خنثی';

        return { label, score: Math.round(score * 100) / 100, keywords: foundKeywords.slice(0, 5) };
    }

    /**
     * تحلیل احساسات مجموعه بازخوردها
     */
    analyzeFeedbackSentiment(feedbacks: string[]): SentimentResult {
        if (feedbacks.length === 0) {
            return { label: 'خنثی', score: 0, keywords: [] };
        }

        const combinedText = feedbacks.join(' ');
        return this.analyzeSentiment(combinedText);
    }

    // ═══════════════════════════════════════
    // 2. پیشنهاد توسعه فردی
    // ═══════════════════════════════════════

    private readonly DEVELOPMENT_MAP: Record<string, DevelopmentSuggestion[]> = {
        'دانش فنی': [
            { dimension: 'دانش فنی', priority: 'بالا', suggestion: 'شرکت در دوره تخصصی فریم‌ورک‌های مدرن وب', actionType: 'دوره آموزشی', estimatedEffort: '۴۰ ساعت' },
            { dimension: 'دانش فنی', priority: 'متوسط', suggestion: 'مطالعه مستندات رسمی و مقالات روز تکنولوژی', actionType: 'مطالعه شخصی', estimatedEffort: '۱۰ ساعت/هفته' },
            { dimension: 'دانش فنی', priority: 'پایین', suggestion: 'مشارکت در پروژه‌های اوپن‌سورس مرتبط', actionType: 'پروژه عملی', estimatedEffort: '۲۰ ساعت/ماه' }
        ],
        'کار تیمی': [
            { dimension: 'کار تیمی', priority: 'بالا', suggestion: 'شرکت در کارگاه ارتباط موثر و حل تعارض', actionType: 'کارگاه', estimatedEffort: '۱۶ ساعت' },
            { dimension: 'کار تیمی', priority: 'متوسط', suggestion: 'جلسات منتورینگ با همکاران ارشد تیم', actionType: 'منتورینگ', estimatedEffort: '۲ ساعت/هفته' },
            { dimension: 'کار تیمی', priority: 'پایین', suggestion: 'مطالعه کتاب "Five Dysfunctions of a Team"', actionType: 'مطالعه شخصی', estimatedEffort: '۸ ساعت' }
        ],
        'خلاقیت و نوآوری': [
            { dimension: 'خلاقیت و نوآوری', priority: 'بالا', suggestion: 'شرکت در رویداد هکاتون داخلی یا خارجی', actionType: 'پروژه عملی', estimatedEffort: '۲۴ ساعت' },
            { dimension: 'خلاقیت و نوآوری', priority: 'متوسط', suggestion: 'کارگاه Design Thinking و تفکر خلاق', actionType: 'کارگاه', estimatedEffort: '۱۲ ساعت' },
            { dimension: 'خلاقیت و نوآوری', priority: 'پایین', suggestion: 'بررسی ترندهای فناوری و ارائه ایده ماهانه', actionType: 'مطالعه شخصی', estimatedEffort: '۵ ساعت/ماه' }
        ],
        'مسئولیت‌پذیری': [
            { dimension: 'مسئولیت‌پذیری', priority: 'بالا', suggestion: 'استفاده از ابزارهای مدیریت وظایف و پیگیری سیستماتیک', actionType: 'پروژه عملی', estimatedEffort: 'مداوم' },
            { dimension: 'مسئولیت‌پذیری', priority: 'متوسط', suggestion: 'جلسات منتورینگ با مدیر مستقیم برای تعیین اهداف SMART', actionType: 'منتورینگ', estimatedEffort: '۱ ساعت/هفته' },
            { dimension: 'مسئولیت‌پذیری', priority: 'پایین', suggestion: 'مطالعه کتاب "Extreme Ownership"', actionType: 'مطالعه شخصی', estimatedEffort: '۶ ساعت' }
        ],
        'ارتباطات': [
            { dimension: 'ارتباطات', priority: 'بالا', suggestion: 'دوره فن بیان و ارائه موثر', actionType: 'دوره آموزشی', estimatedEffort: '۲۰ ساعت' },
            { dimension: 'ارتباطات', priority: 'متوسط', suggestion: 'تمرین ارائه در جلسات تیمی و دریافت بازخورد', actionType: 'پروژه عملی', estimatedEffort: 'مداوم' },
            { dimension: 'ارتباطات', priority: 'پایین', suggestion: 'مطالعه کتاب "Crucial Conversations"', actionType: 'مطالعه شخصی', estimatedEffort: '۸ ساعت' }
        ],
        'کیفیت مشاوره': [
            { dimension: 'کیفیت مشاوره', priority: 'بالا', suggestion: 'دوره مشاوره استراتژیک و تحلیل کسب‌وکار', actionType: 'دوره آموزشی', estimatedEffort: '۳۰ ساعت' },
            { dimension: 'کیفیت مشاوره', priority: 'متوسط', suggestion: 'منتورینگ با مشاوران ارشد سازمان', actionType: 'منتورینگ', estimatedEffort: '۲ ساعت/هفته' },
            { dimension: 'کیفیت مشاوره', priority: 'پایین', suggestion: 'مطالعه کیس‌استادی‌های صنعت مرتبط', actionType: 'مطالعه شخصی', estimatedEffort: '۱۰ ساعت/ماه' }
        ],
        'مدیریت زمان': [
            { dimension: 'مدیریت زمان', priority: 'بالا', suggestion: 'کارگاه مدیریت زمان و اولویت‌بندی (GTD/Eisenhower)', actionType: 'کارگاه', estimatedEffort: '۸ ساعت' },
            { dimension: 'مدیریت زمان', priority: 'متوسط', suggestion: 'استفاده از تکنیک پومودورو و ردیابی زمان', actionType: 'پروژه عملی', estimatedEffort: 'مداوم' },
            { dimension: 'مدیریت زمان', priority: 'پایین', suggestion: 'مطالعه کتاب "Deep Work" اثر Cal Newport', actionType: 'مطالعه شخصی', estimatedEffort: '۶ ساعت' }
        ],
        'گزارش‌دهی': [
            { dimension: 'گزارش‌دهی', priority: 'بالا', suggestion: 'دوره نوشتن گزارش‌های حرفه‌ای و داشبوردسازی', actionType: 'دوره آموزشی', estimatedEffort: '۱۶ ساعت' },
            { dimension: 'گزارش‌دهی', priority: 'متوسط', suggestion: 'تمرین تهیه گزارش هفتگی ساختاریافته', actionType: 'پروژه عملی', estimatedEffort: 'مداوم' },
            { dimension: 'گزارش‌دهی', priority: 'پایین', suggestion: 'بررسی نمونه گزارش‌های برتر سازمان', actionType: 'مطالعه شخصی', estimatedEffort: '۴ ساعت' }
        ],
        'تعامل با کارفرما': [
            { dimension: 'تعامل با کارفرما', priority: 'بالا', suggestion: 'دوره مذاکره و مدیریت ذینفعان', actionType: 'دوره آموزشی', estimatedEffort: '۲۰ ساعت' },
            { dimension: 'تعامل با کارفرما', priority: 'متوسط', suggestion: 'جلسات منظم هماهنگی با کارفرما', actionType: 'منتورینگ', estimatedEffort: '۲ ساعت/هفته' },
            { dimension: 'تعامل با کارفرما', priority: 'پایین', suggestion: 'مطالعه اصول مدیریت ارتباط با مشتری', actionType: 'مطالعه شخصی', estimatedEffort: '۸ ساعت' }
        ]
    };

    /**
     * تولید پیشنهادات توسعه فردی بر اساس نقاط ضعف
     */
    generateDevelopmentSuggestions(dimensions: EvaluationDimension[], maxSuggestions: number = 5): DevelopmentSuggestion[] {
        const sortedByScore = [...dimensions].sort((a, b) => a.score - b.score);
        const suggestions: DevelopmentSuggestion[] = [];

        for (const dim of sortedByScore) {
            if (dim.score >= 80) continue; // نیازی به بهبود ندارد

            const dimSuggestions = this.DEVELOPMENT_MAP[dim.name];
            if (!dimSuggestions) continue;

            // انتخاب مناسب‌ترین پیشنهاد بر اساس امتیاز
            let selected: DevelopmentSuggestion | undefined;
            if (dim.score < 40) {
                selected = dimSuggestions.find(s => s.priority === 'بالا');
            } else if (dim.score < 60) {
                selected = dimSuggestions.find(s => s.priority === 'متوسط');
            } else {
                selected = dimSuggestions.find(s => s.priority === 'پایین');
            }

            if (selected && !suggestions.find(s => s.dimension === selected!.dimension)) {
                suggestions.push(selected);
            }

            if (suggestions.length >= maxSuggestions) break;
        }

        return suggestions;
    }

    // ═══════════════════════════════════════
    // 3. پیش‌بینی روند عملکرد
    // ═══════════════════════════════════════

    /**
     * پیش‌بینی امتیاز دوره بعدی بر اساس تاریخچه
     * از روش رگرسیون خطی ساده استفاده می‌شود
     */
    predictTrend(scoreHistory: { cycle: string; score: number }[]): TrendPrediction {
        if (scoreHistory.length === 0) {
            return {
                direction: 'ثابت',
                predictedNextScore: 0,
                confidence: 0,
                description: 'داده کافی برای پیش‌بینی وجود ندارد.'
            };
        }

        if (scoreHistory.length === 1) {
            return {
                direction: 'ثابت',
                predictedNextScore: scoreHistory[0].score,
                confidence: 30,
                description: 'تنها یک دوره داده موجود است. پیش‌بینی با قطعیت پایین.'
            };
        }

        // رگرسیون خطی ساده
        const n = scoreHistory.length;
        const scores = scoreHistory.map(h => h.score);
        const xValues = Array.from({ length: n }, (_, i) => i);

        const sumX = xValues.reduce((a, b) => a + b, 0);
        const sumY = scores.reduce((a, b) => a + b, 0);
        const sumXY = xValues.reduce((sum, x, i) => sum + x * scores[i], 0);
        const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        const predictedNext = Math.round(intercept + slope * n);
        const clampedPrediction = Math.max(0, Math.min(100, predictedNext));

        // محاسبه R² برای اعتماد
        const meanY = sumY / n;
        const ssTot = scores.reduce((sum, y) => sum + (y - meanY) ** 2, 0);
        const ssRes = scores.reduce((sum, y, i) => sum + (y - (intercept + slope * i)) ** 2, 0);
        const rSquared = ssTot > 0 ? Math.max(0, 1 - ssRes / ssTot) : 0;
        const confidence = Math.round(rSquared * 100);

        // تعیین جهت
        let direction: 'صعودی' | 'نزولی' | 'ثابت';
        if (slope > 2) direction = 'صعودی';
        else if (slope < -2) direction = 'نزولی';
        else direction = 'ثابت';

        // تولید توضیح
        const lastScore = scores[scores.length - 1];
        const diff = clampedPrediction - lastScore;
        let description = '';

        if (direction === 'صعودی') {
            description = `روند صعودی با شیب ${this.toPersianNum(Math.abs(Math.round(slope)))} امتیاز در هر دوره. پیش‌بینی امتیاز دوره بعد: ${this.toPersianNum(clampedPrediction)} (${diff > 0 ? '+' : ''}${this.toPersianNum(diff)})`;
        } else if (direction === 'نزولی') {
            description = `روند نزولی با شیب ${this.toPersianNum(Math.abs(Math.round(slope)))} امتیاز در هر دوره. نیاز به توجه ویژه.`;
        } else {
            description = `عملکرد نسبتاً ثابت. پیش‌بینی امتیاز دوره بعد: ${this.toPersianNum(clampedPrediction)}`;
        }

        return {
            direction,
            predictedNextScore: clampedPrediction,
            confidence: Math.min(confidence, 95),
            description
        };
    }

    // ═══════════════════════════════════════
    // 4. شناسایی الگوهای تیمی
    // ═══════════════════════════════════════

    /**
     * شناسایی نقاط قوت و ضعف مشترک در تیم
     */
    identifyTeamPatterns(teamMembers: { name: string; dimensions: EvaluationDimension[] }[]): TeamPattern[] {
        if (teamMembers.length === 0) return [];

        const patterns: TeamPattern[] = [];
        const allDimensions = teamMembers[0]?.dimensions || [];

        for (const dimTemplate of allDimensions) {
            const dimName = dimTemplate.name;
            const memberScores = teamMembers
                .map(m => m.dimensions.find(d => d.name === dimName))
                .filter((d): d is EvaluationDimension => d !== undefined);

            if (memberScores.length === 0) continue;

            const avgScore = memberScores.reduce((sum, d) => sum + d.score, 0) / memberScores.length;
            const lowScorers = memberScores.filter(d => d.score < 60).length;
            const highScorers = memberScores.filter(d => d.score >= 80).length;

            if (highScorers >= teamMembers.length * 0.6) {
                patterns.push({
                    type: 'strength',
                    dimension: dimName,
                    description: `${this.toPersianNum(Math.round(avgScore))}٪ اعضای تیم در بُعد "${dimName}" امتیاز بالای ۸۰ دارند.`,
                    affectedMembers: highScorers,
                    recommendation: `این نقطه قوت تیم را حفظ کنید. از اعضای قوی به عنوان منتور برای سایرین استفاده شود.`
                });
            }

            if (lowScorers >= teamMembers.length * 0.4) {
                patterns.push({
                    type: 'weakness',
                    dimension: dimName,
                    description: `${this.toPersianNum(lowScorers)} نفر از ${this.toPersianNum(teamMembers.length)} عضو تیم در بُعد "${dimName}" امتیاز زیر ۶۰ دارند.`,
                    affectedMembers: lowScorers,
                    recommendation: `برگزاری دوره آموزشی تیمی در زمینه "${dimName}" توصیه می‌شود.`
                });
            }
        }

        return patterns;
    }

    // ═══════════════════════════════════════
    // 5. خلاصه‌سازی هوشمند
    // ═══════════════════════════════════════

    /**
     * تولید خلاصه هوشمند از نتایج ارزیابی
     */
    generateSummary(
        evaluation: MyEvaluation,
        feedbacks: string[],
        prediction: TrendPrediction,
        suggestions: DevelopmentSuggestion[]
    ): AISummary {
        const sentiment = this.analyzeFeedbackSentiment(feedbacks);
        const sortedDims = [...evaluation.dimensions].sort((a, b) => b.score - a.score);
        const topDims = sortedDims.slice(0, 2);
        const bottomDims = sortedDims.slice(-2).reverse();

        // Overall assessment
        let overallAssessment = '';
        if (evaluation.overallScore >= 90) {
            overallAssessment = 'عملکرد استثنایی. کارمند در سطح بالایی از شایستگی قرار دارد و آماده ارتقاء است.';
        } else if (evaluation.overallScore >= 80) {
            overallAssessment = 'عملکرد بسیار خوب. کارمند در اکثر ابعاد عملکرد قوی دارد با چند حوزه قابل بهبود.';
        } else if (evaluation.overallScore >= 70) {
            overallAssessment = 'عملکرد خوب. کارمند عملکرد قابل قبولی دارد اما در برخی ابعاد نیاز به تقویت دارد.';
        } else if (evaluation.overallScore >= 60) {
            overallAssessment = 'عملکرد متوسط. چندین حوزه نیاز به بهبود جدی دارند. برنامه توسعه فردی توصیه می‌شود.';
        } else {
            overallAssessment = 'عملکرد نیاز به بهبود. اقدامات فوری توسعه‌ای و نظارت بیشتر ضروری است.';
        }

        // Key strengths
        const keyStrengths = topDims.map(d =>
            `${d.name} (${this.toPersianNum(d.score)} امتیاز)`
        );

        // Key weaknesses
        const keyWeaknesses = bottomDims.filter(d => d.score < 80).map(d =>
            `${d.name} (${this.toPersianNum(d.score)} امتیاز)`
        );

        // Sentiment overview
        let sentimentOverview = '';
        if (sentiment.label === 'مثبت') {
            sentimentOverview = `بازخوردها عمدتاً مثبت هستند. همکاران و مدیر از عملکرد رضایت دارند.`;
        } else if (sentiment.label === 'منفی') {
            sentimentOverview = `بازخوردها حاوی نکات انتقادی هستند. نیاز به رسیدگی به موارد مطرح شده وجود دارد.`;
        } else {
            sentimentOverview = `بازخوردها ترکیبی از نکات مثبت و منفی هستند.`;
        }

        // Development focus
        const developmentFocus = suggestions.length > 0
            ? `اولویت توسعه: تمرکز بر "${suggestions[0].dimension}" از طریق ${suggestions[0].actionType}.`
            : 'در حال حاضر نیاز فوری به اقدام توسعه‌ای نیست.';

        // Trend outlook
        const trendOutlook = prediction.direction === 'صعودی'
            ? `روند صعودی عملکرد ادامه دارد. پیش‌بینی امتیاز دوره بعد: ${this.toPersianNum(prediction.predictedNextScore)}.`
            : prediction.direction === 'نزولی'
                ? `روند نزولی نگران‌کننده. مداخله فوری توصیه می‌شود.`
                : `عملکرد ثابت است. تلاش برای شکستن سقف فعلی توصیه می‌شود.`;

        return {
            overallAssessment,
            keyStrengths,
            keyWeaknesses,
            sentimentOverview,
            developmentFocus,
            trendOutlook
        };
    }

    // ═══════════════════════════════════════
    // 6. تحلیل کامل AI
    // ═══════════════════════════════════════

    /**
     * اجرای تحلیل کامل AI برای یک ارزیابی
     */
    runFullAnalysis(
        evaluation: MyEvaluation,
        feedbacks: string[] = [],
        scoreHistory: { cycle: string; score: number }[] = [],
        teamMembers: { name: string; dimensions: EvaluationDimension[] }[] = []
    ): FullAIAnalysis {
        const sentiment = this.analyzeFeedbackSentiment(feedbacks);
        const suggestions = this.generateDevelopmentSuggestions(evaluation.dimensions);
        const prediction = this.predictTrend(scoreHistory);
        const teamPatterns = this.identifyTeamPatterns(teamMembers);
        const summary = this.generateSummary(evaluation, feedbacks, prediction, suggestions);

        return {
            sentiment,
            suggestions,
            prediction,
            teamPatterns,
            summary
        };
    }

    // Helper
    private toPersianNum(num: number): string {
        return num.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
    }
}