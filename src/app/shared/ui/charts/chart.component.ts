import { Component, ElementRef, ViewChild, afterNextRender, effect, input, DestroyRef, inject } from '@angular/core';
import { Chart } from 'chart.js/auto';

@Component({
    selector: 'app-chart',
    standalone: true,
    template: `<canvas #chartCanvas></canvas>`,
    styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      min-height: 300px;
      position: relative;
    }
  `]
})
export class ChartComponent {
    @ViewChild('chartCanvas', { static: true }) chartCanvas!: ElementRef<HTMLCanvasElement>;

    // ورودی‌ها به صورت Signal تعریف شده‌اند تا واکنش‌گرا باشند
    type = input<string>('bar');
    data = input<any>({});
    options = input<any>({});

    private chart: Chart | null = null;
    private destroyRef = inject(DestroyRef);

    constructor() {
        //渲染 نمودار پس از اینکه canvas در DOM قرار گرفت
        afterNextRender(() => {
            this.initChart();
        });

        // واکنش به تغییرات داده‌ها و آپدیت نمودار
        effect(() => {
            const data = this.data();
            const options = this.options();

            if (this.chart) {
                this.chart.data = data;
                this.chart.options = options;
                this.chart.update();
            }
        });
    }

    private initChart() {
        if (this.chartCanvas) {
            this.chart = new Chart(this.chartCanvas.nativeElement, {
                type: this.type() as any,
                data: this.data(),
                options: this.options()
            });

            // پاکسازی حافظه هنگام نابودی کامپوننت
            this.destroyRef.onDestroy(() => {
                if (this.chart) {
                    this.chart.destroy();
                }
            });
        }
    }
}