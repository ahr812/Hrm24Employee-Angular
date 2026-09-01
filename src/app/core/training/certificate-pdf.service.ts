import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Certificate } from './training.service';

@Injectable({ providedIn: 'root' })
export class CertificatePdfService {

    async downloadCertificate(cert: Certificate): Promise<void> {
        const container = document.createElement('div');
        container.style.cssText = 'position:fixed;left:-9999px;top:0;width:1123px;height:794px;overflow:hidden;';
        document.body.appendChild(container);

        const certTypeFa = this.getCertTypeFa(cert.type);
        const dateLine = cert.expiresAt
            ? `تاریخ صدور: ${cert.issuedAt} | انقضا: ${cert.expiresAt}`
            : `تاریخ صدور: ${cert.issuedAt}`;

        const logoW = 300;
        const logoH = 86;

        container.innerHTML = `
<div style="width:1123px;height:794px;background:#fff;font-family:'Vazirmatn',sans-serif;direction:rtl;position:relative;">

    <!-- Borders -->
    <div style="position:absolute;inset:15px;border:4px solid #B8860B;"></div>
    <div style="position:absolute;inset:28px;border:1.5px solid #DAA520;"></div>

    <!-- Corners -->
    <div style="position:absolute;top:28px;right:28px;width:40px;height:40px;border-top:3px solid #B8860B;border-right:3px solid #B8860B;"></div>
    <div style="position:absolute;top:28px;left:28px;width:40px;height:40px;border-top:3px solid #B8860B;border-left:3px solid #B8860B;"></div>
    <div style="position:absolute;bottom:28px;right:28px;width:40px;height:40px;border-bottom:3px solid #B8860B;border-right:3px solid #B8860B;"></div>
    <div style="position:absolute;bottom:28px;left:28px;width:40px;height:40px;border-bottom:3px solid #B8860B;border-left:3px solid #B8860B;"></div>

    <!-- Logo -->
    <img src="/images/logofull.svg" style="position:absolute;top:35px;left:50%;transform:translateX(-50%);width:${logoW}px;height:${logoH}px;" crossorigin="anonymous" />

    <!-- Ornament -->
    <div style="position:absolute;top:136px;left:50%;transform:translateX(-50%);width:320px;height:1.5px;background:linear-gradient(90deg,transparent,#B8860B,transparent);"></div>

    <!-- CERTIFICATE -->
    <div style="position:absolute;top:148px;width:100%;text-align:center;font-size:36px;font-weight:900;color:#B8860B;letter-spacing:6px;direction:ltr;">CERTIFICATE</div>

    <!-- OF COMPLETION -->
    <div style="position:absolute;top:196px;width:100%;text-align:center;font-size:15px;color:#888;letter-spacing:4px;direction:ltr;">OF COMPLETION</div>

    <!-- Divider -->
    <div style="position:absolute;top:224px;left:50%;transform:translateX(-50%);width:200px;height:1px;background:linear-gradient(90deg,transparent,#B8860B,transparent);"></div>

    <!-- Certify -->
    <div style="position:absolute;top:242px;width:100%;text-align:center;font-size:15px;color:#666;">گواهی می‌شود که</div>

    <!-- Name -->
    <div style="position:absolute;top:272px;width:100%;text-align:center;font-size:32px;font-weight:900;color:#1e1e1e;">${cert.employeeName}</div>

    <!-- Gold line UNDER name -->
    <div style="position:absolute;top:326px;left:50%;transform:translateX(-50%);width:300px;height:2px;background:#B8860B;"></div>

    <!-- Completed -->
    <div style="position:absolute;top:340px;width:100%;text-align:center;font-size:15px;color:#666;">دوره زیر را با موفقیت تکمیل نموده است:</div>

    <!-- Course -->
    <div style="position:absolute;top:370px;width:100%;text-align:center;font-size:22px;font-weight:800;color:#1e3c78;padding:0 40px;box-sizing:border-box;">${cert.courseTitle}</div>

    <!-- Code -->
    <div style="position:absolute;top:404px;width:100%;text-align:center;font-size:13px;color:#888;direction:ltr;">Course Code: ${cert.courseCode}</div>

    <!-- Score -->
    <div style="position:absolute;top:430px;width:100%;text-align:center;font-size:14px;color:#555;">نمره: ${cert.score}% &nbsp;|&nbsp; رتبه: ${cert.grade} &nbsp;|&nbsp; نوع: ${certTypeFa}</div>

    <!-- Date -->
    <div style="position:absolute;top:456px;width:100%;text-align:center;font-size:13px;color:#777;">${dateLine}</div>

    <!-- Bottom divider -->
    <div style="position:absolute;top:484px;left:50%;transform:translateX(-50%);width:250px;height:1px;background:linear-gradient(90deg,transparent,#B8860B,transparent);"></div>

    <!-- Signatures -->
    <div style="position:absolute;top:504px;width:100%;display:flex;justify-content:center;gap:260px;">
        <div style="text-align:center;"><div style="width:160px;border-bottom:1px solid #666;margin-bottom:5px;"></div><div style="font-size:13px;color:#555;">مدیر آموزش</div></div>
        <div style="text-align:center;"><div style="width:160px;border-bottom:1px solid #666;margin-bottom:5px;"></div><div style="font-size:13px;color:#555;">مدیر منابع انسانی</div></div>
    </div>

    <!-- Issuer -->
    <div style="position:absolute;top:564px;width:100%;text-align:center;font-size:12px;color:#777;">${cert.issuer}</div>

    <!-- Branding line -->
    <div style="position:absolute;top:586px;left:50%;transform:translateX(-50%);width:350px;height:2px;background:linear-gradient(90deg,transparent,#B8860B,transparent);"></div>

    <!-- HRM24 -->
    <div style="position:absolute;top:596px;width:100%;text-align:center;font-size:24px;font-weight:900;color:#B8860B;letter-spacing:3px;direction:ltr;">HRM24</div>

    <!-- English tagline -->
    <div style="position:absolute;top:626px;width:100%;text-align:center;font-size:11px;color:#666;direction:ltr;">Human Resource Management System</div>

    <!-- Persian tagline -->
    <div style="position:absolute;top:644px;width:100%;text-align:center;font-size:11px;color:#888;">سامانه منابع انسانی</div>

    <!-- Link -->
    <div style="position:absolute;top:664px;width:100%;text-align:center;font-size:14px;font-weight:700;color:#1e3c78;direction:ltr;text-decoration:underline;text-underline-offset:3px;">https://hrm24.com</div>

    <!-- Verification -->
    <div style="position:absolute;top:686px;width:100%;text-align:center;font-size:8px;color:#bbb;direction:ltr;">Verification: ${cert.verificationCode} | Digitally issued by HRM24</div>

</div>`;

        await new Promise(r => setTimeout(r, 1000));

        try {
            const canvas = await html2canvas(container.firstElementChild as HTMLElement, {
                scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#ffffff', logging: false
            });
            const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
            pdf.addImage(canvas.toDataURL('image/png', 1.0), 'PNG', 0, 0, 297, 210);
            pdf.link(112, 194, 72, 6, { url: 'https://hrm24.com' });
            pdf.save(`Certificate-${cert.courseCode}-${cert.employeeName.replace(/\s+/g, '_')}.pdf`);
        } catch (e) {
            console.error('Certificate PDF failed:', e);
        } finally {
            document.body.removeChild(container);
        }
    }

    private getCertTypeFa(type: string): string {
        return { attendance: 'حضور', completion: 'تکمیل دوره', competency: 'شایستگی', professional: 'حرفه‌ای', renewal: 'تمدید' }[type] || type;
    }
}