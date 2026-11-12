"""Read-only inspection of actual browser-downloaded audit workbooks."""
from pathlib import Path
import json
from openpyxl import load_workbook

downloads = Path.home() / 'Downloads'
results = []
for stem, columns, rows in [('invoice-export',45,6),('accounting-vouchers',16,12),('customer-details',16,3),('formal-invoices',8,6)]:
    files = sorted(downloads.glob(f'fish24-{stem}*.xlsx'), key=lambda p:p.stat().st_mtime, reverse=True)[:2]
    for i,p in enumerate(files):
        wb = load_workbook(p, data_only=False)
        ws = wb.active
        cells = list(ws._cells.values())
        result = dict(file=str(p), sheets=wb.sheetnames, rows=ws.max_row-1, columns=ws.max_column,
                      formulas=sum(c.data_type=='f' for c in cells), styled=sum(c.has_style for c in cells),
                      headers=[c.value for c in ws[1]], merged=len(ws.merged_cells.ranges))
        assert ws.max_column == columns, result
        assert result['formulas']==0 and result['styled']==0 and result['merged']==0, result
        expected = (4 if stem=='accounting-vouchers' else 1 if stem=='customer-details' else 2) if i==0 else rows
        assert result['rows']==expected, result
        if stem=='accounting-vouchers':
            result['data'] = list(ws.values)[1:]
            debit = sum(r[12] or 0 for r in result['data'])
            credit = sum(r[13] or 0 for r in result['data'])
            assert debit == credit == (639000 if i == 0 else 552696000)
            result['balanced_total_rial'] = debit
        if stem in ('invoice-export','formal-invoices'):
            result['first_row'] = list(ws.values)[1]
        if stem == 'invoice-export':
            assert all(ws.cell(r,1).data_type == 's' for r in range(2,ws.max_row+1))
            assert all(ws.cell(r,3).data_type == 'n' for r in range(2,ws.max_row+1))
            if i == 1:
                assert '00022343' in [ws.cell(r,1).value for r in range(2,ws.max_row+1)]
        results.append(result)
for name, expected_rows in [('fish24-document-sends (2).xlsx',3),('fish24-transactions (1).xlsx',5),('fish24-faqs (1).xlsx',5)]:
    ws = load_workbook(downloads/name, data_only=False).active
    assert ws.max_row-1 == expected_rows
    assert not any(c.data_type == 'f' or c.has_style for row in ws for c in row)
    if 'faqs' in name:
        assert ws.cell(6,3).value == '=SUM(1,2)\n<b>متن ساده</b>'
        assert ws.cell(6,3).data_type == 's'
    else:
        assert all(ws.cell(r,3).value == '09121234567' for r in range(2,ws.max_row+1))
    results.append(dict(file=str(downloads/name),rows=expected_rows,columns=ws.max_column,formulas=0,styled=0))
out = Path(__file__).with_name('workbook-verification.json')
out.write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps([{k:v for k,v in r.items() if k not in ('headers','data','first_row')} for r in results],ensure_ascii=False,indent=2))
