import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { HotelData } from '../Models/HotelData';
import { Bill } from '../Models/Bill';

/**
 * Generates the Excel file based on the Monthly Report.
 * @param {HotelData} hotelData | Details of Hotel
 * @param {{ month: number, year: number, reports: Bill[] }} reportData | Monthly Reports fetched from DB
 * @param {string[]} months | List of names of Months
 */
export const exportToExcel = async (hotelData, reportData, months) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('GSTR1 Report');

    // 1. Column Width Handling (Manual set for professional look)
    worksheet.columns = [
        { key: 'gstin', width: 22 },    // (A) GSTIN
        { key: 'party', width: 35 },    // (B) Party Name
        { key: 'invNo', width: 25 },    // (C) Invoice No.
        { key: 'date', width: 18 },     // (D) Invoice Date
        { key: 'val', width: 15 },      // (E) Invoice Value
        { key: 'rate', width: 10 },     // (F) Rate
        { key: 'taxVal', width: 15 },   // (G) Taxable Value
        { key: 'igst', width: 12 },     // (H) IGST
        { key: 'cgst', width: 12 },     // (I) CGST
        { key: 'sgst', width: 12 }     // (J) SGST
    ];

    // 2. Custom Header Rows (1-4)
    worksheet.getCell('A1').value = 'Period';
    worksheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getCell('B1').value = `${months[reportData.month]} ${reportData.year}`;
    worksheet.getCell('B1').alignment = { vertical: 'middle', horizontal: 'center' };
    
    worksheet.getCell('A3').value = 'GSTIN';
    worksheet.getCell('A3').alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getCell('B3').value = hotelData?.gstNo || "ASSAM-GUEST-HFS";
    worksheet.getCell('B3').alignment = { vertical: 'middle', horizontal: 'center' };
    
    worksheet.getCell('A4').value = 'Legal Name';
    worksheet.getCell('A4').alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getCell('B4').value = hotelData?.gstRegName || "Hotel Four Seasons";
    worksheet.getCell('B4').alignment = { vertical: 'middle', horizontal: 'center' };

    worksheet.getCell('A5').value = 'HSN/SAC';
    worksheet.getCell('A5').alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getCell('B5').value = hotelData?.sacCode;
    worksheet.getCell('B5').numFmt = '@';
    worksheet.getCell('B5').alignment = { vertical: 'middle', horizontal: 'center' };

    // 3. Table Headers (Row 6)
    const headers = ['GSTIN', 'Party Name', 'Invoice No.', 'Invoice Date', 'Invoice Value', 'Rate (%)', 'Taxable Value', 'IGST', 'CGST', 'SGST'];
    const headerRow = worksheet.getRow(7);
    headerRow.values = headers;
    headerRow.font = { bold: true, color: { argb: 'FF996515' } }; // Gold headers
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    // 4. Data Insertion (Row 8 onwards)
    let startRow = 9;
    let totals = { val: 0, taxVal: 0, igst: 0, cgst: 0, sgst: 0 };

    reportData.reports.forEach((bill) => {
        const amt = bill.amount;
        const totalTaxRate = amt.igstAmount > 0 ? amt.igstPercent : (amt.cgstPercent + amt.sgstPercent);

        const row = worksheet.getRow(startRow);
        row.values = [
            bill.gstNo || "URD",             // (A) GSTIN
            bill.partyName || "Walk-in",     // (B) Party
            bill.invoiceNo,                  // (C) Invoice No
            bill.getBillDateString(),        // (D) Date
            amt.totalAmount,                 // (E) Invoice Value
            totalTaxRate,              // (F) Rate
            amt.subTotalAmount,             // (G) Taxable Value
            amt.igstAmount || 0,             // (H) IGST
            amt.cgstAmount || 0,             // (I) CGST
            amt.sgstAmount || 0              // (J) SGST
        ];

        // Accumulate for summation
        totals.val += amt.totalAmount;
        totals.taxVal += amt.subTotalAmount;
        totals.igst += (amt.igstAmount || 0);
        totals.cgst += (amt.cgstAmount || 0);
        totals.sgst += (amt.sgstAmount || 0);

        // Formatting E, G, H, I, J as currency/numbers with 2 decimals
        [5, 7, 8, 9, 10].forEach(colIndex => {
            row.getCell(colIndex).numFmt = '#,##0.00';
        });

        row.alignment = { vertical: 'middle', horizontal: 'center' };

        startRow++;
    });

    // 5. Summation Row
    const sumRowIdx = startRow + 1;
    const sumRow = worksheet.getRow(sumRowIdx); // Skip one row
    sumRow.getCell(4).value = "TOTALS:";
    sumRow.getCell(4).font = { bold: true };
    sumRow.getCell(5).value = totals.val;
    sumRow.getCell(7).value = totals.taxVal;
    sumRow.getCell(8).value = totals.igst;
    sumRow.getCell(9).value = totals.cgst;
    sumRow.getCell(10).value = totals.sgst;
    sumRow.font = { bold: true };
    sumRow.alignment = { vertical: 'middle', horizontal: 'center' };

    // 6. Final Polish (Numerical Formatting)
    ['E', 'G', 'H', 'I', 'J'].forEach(col => {
        worksheet.getCell(`${col}${sumRowIdx}`).numFmt = '#,##0.00';
    });

    // Write and Save
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `HFS_GST_Report_${months[reportData.month]}_${reportData.year}.xlsx`);
};