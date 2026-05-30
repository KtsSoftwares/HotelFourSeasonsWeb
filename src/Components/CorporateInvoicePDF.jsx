import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { HotelData } from '../Models/HotelData';
import { CateringBill } from '../Models/CateringBill';
import RobotoRegular from '../assets/Roboto Fonts/Roboto-Regular.ttf';
import RobotoBold from '../assets/Roboto Fonts/Roboto-Bold.ttf';
import RobotoItalic from '../assets/Roboto Fonts/Roboto-Italic.ttf';

// Register standard modern fonts for crisp line execution
Font.register({
    family: 'Roboto',
    fonts: [
        { src: RobotoRegular, fontWeight: 400 },
        { src: RobotoBold, fontWeight: 700 },
        { src: RobotoItalic, fontWeight: 400 }
    ]
});

const styles = StyleSheet.create({
    page: {
        padding: 40,
        backgroundColor: '#FFFFFF',
        fontFamily: 'Roboto',
        fontSize: 10,
        color: '#222222',
        lineHeight: 1.5
    },
    // Top Luxury Accent Band
    topAccent: {
        height: 6,
        backgroundColor: '#D4AF37',
        marginBottom: 20
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderBottom: '1px solid #E5E5E5',
        paddingBottom: 15,
        marginBottom: 20
    },
    hotelTitle: {
        fontSize: 18,
        fontWeight: 700,
        color: '#1A1A1B',
        letterSpacing: 0.5
    },
    hotelSub: {
        fontSize: 9,
        color: '#555555'
    },
    invoiceMeta: {
        alignItems: 'flex-end'
    },
    invoiceBadge: {
        fontSize: 12,
        fontWeight: 700,
        color: '#D4AF37',
        letterSpacing: 1,
        marginBottom: 5
    },
    metaText: {
        fontSize: 9,
        color: '#333333'
    },
    // Buyer / Seller Tracking Columns
    billingSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 25,
        backgroundColor: '#F9F9F9',
        padding: 12,
        borderRadius: 4,
        border: '1px solid #E5E5E5'
    },
    billColumn: {
        width: '48%'
    },
    sectionLabel: {
        fontSize: 8,
        fontWeight: 700,
        color: '#D4AF37',
        textTransform: 'uppercase',
        marginBottom: 4,
        letterSpacing: 0.5
    },
    companyName: {
        fontSize: 11,
        fontWeight: 700,
        color: '#1A1A1B',
        marginBottom: 3
    },
    // Invoicing Matrix Table
    table: {
        width: '100%',
        marginBottom: 20
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#1A1A1B',
        padding: 8,
        borderRadius: 2
    },
    tableRow: {
        flexDirection: 'row',
        padding: 8,
        borderBottom: '1px solid #E5E5E5',
        alignItems: 'center'
    },
    th: {
        color: '#D4AF37',
        fontSize: 9,
        fontWeight: 700,
        textTransform: 'uppercase'
    },
    td: {
        fontSize: 9,
        color: '#333333'
    },
    colDesc: { width: '45%', textAlign: 'left' },
    colHsn: { width: '15%', textAlign: 'center' },
    colQty: { width: '12%', textAlign: 'center' },
    colRate: { width: '13%', textAlign: 'right' },
    colAmt: { width: '15%', textAlign: 'right' },

    // Financial Calculation Summary Blocks
    summaryContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10
    },
    termsBlock: {
        width: '50%',
        fontSize: 8,
        color: '#777777',
        paddingRight: 20
    },
    calcBlock: {
        width: '45%',
        alignSelf: 'flex-end'
    },
    calcRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 3,
        borderBottom: '1px dashed #E5E5E5'
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#F9F9F9',
        padding: 8,
        marginTop: 5,
        borderRadius: 2
    },
    totalLabel: {
        fontWeight: 700,
        fontSize: 10
    },
    totalValue: {
        color: '#D4AF37',
        fontWeight: 700,
        fontSize: 10
    },
    wordsBlock: {
        marginTop: 15,
        padding: 8,
        backgroundColor: '#F9F9F9',
        borderRadius: 2,
        borderLeft: '3px solid #D4AF37'
    },
    wordsText: {
        fontSize: 9,
        fontWeight: 700,
        color: '#333333'
    },
    footerDeclaration: {
        marginTop: 40,
        borderTop: '1px solid #E5E5E5',
        paddingTop: 15,
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    legalNotice: {
        width: '60%',
        fontSize: 8,
        color: '#888888'
    },
    signatureBlock: {
        width: '35%',
        alignItems: 'center',
        marginTop: 10
    },
    signatureLine: {
        width: '100%',
        borderTop: '1px solid #333333',
        marginTop: 30,
        marginBottom: 3
    },
    signatureLabel: {
        fontSize: 8,
        color: '#555555',
        textAlign: 'center'
    }
});

/**
 * CorporateInvoicePDF Component
 * @param {{ hotelData: HotelData, bill: CateringBill, isQuotation: boolean }} props
 */
const CorporateInvoicePDF = ({ hotelData, bill, isQuotation }) => {
    const { clientData, rates, inputs, billCalculations } = bill;

    const docTitle = isQuotation
        ? `Quotation-${clientData.companyName || 'Corporate'}`
        : `Catering Invoice-${bill.invoiceNo}`;

    return (
        <Document title={docTitle}>
            <Page size="A4" style={styles.page}>
                {/* Decorative Accent Header Band */}
                <View style={styles.topAccent} />

                {/* HOTEL BRAND & INVOICE META HEADER */}
                <View style={styles.headerRow}>
                    <View>
                        <Text style={styles.hotelTitle}>{hotelData?.name || "Hotel Four Seasons"}</Text>
                        <Text style={[styles.hotelSub, { marginTop: 2 }]}>{`${hotelData?.address.line1}, ${hotelData.address.city}, ${hotelData.address.state} ${hotelData.address.pin}` || "Dostinagar, Pancharatna Road, Goalpara, Assam 783101"}</Text>
                        <Text style={styles.hotelSub}>Contact: {hotelData?.contactNumbers?.join(", ") || "+91 94013 91428"}</Text>
                        <Text style={[styles.hotelSub, { fontWeight: 700 }]}>GSTIN: {hotelData?.gstNo || "18AXCPS2518L1Z5"}</Text>
                        <Text style={styles.hotelSub}>Email: {hotelData?.email || "info.ktsgroupglp@gmail.com"}</Text>
                        <Text style={styles.hotelSub}>Website: {hotelData?.website || ""}</Text>
                    </View>
                    <View style={styles.invoiceMeta}>
                        <Text style={styles.invoiceBadge}>{isQuotation ? "QUOTATION" : "PROFORMA INVOICE"}</Text>
                        <Text style={styles.metaText}>{isQuotation ? "Proposal Ref:" : "Invoice No:"} {bill.invoiceNo}</Text>
                        <Text style={styles.metaText}>Dated: {bill.getInvoiceDateString()}</Text>
                    </View>
                </View>

                {/* BUYER INFORMATION BLOCK */}
                <View style={styles.billingSection}>
                    <View style={styles.billColumn}>
                        <Text style={styles.sectionLabel}>Buyer (Bill To)</Text>
                        <Text style={styles.companyName}>{clientData.companyName}</Text>
                        <Text style={styles.metaText}>{clientData.companyAddress}</Text>
                        <Text style={styles.metaText}>GSTIN/UIN: {clientData.companyGst || "N/A"}</Text>
                    </View>
                    <View style={styles.billColumn}>
                        <Text style={styles.sectionLabel}>Venue Details</Text>
                        <Text style={styles.companyName}>Conference & Event Arena</Text>
                        <Text style={styles.metaText}>Corporate Event Hall Suite</Text>
                        <Text style={styles.metaText}>Place of Supply: Assam (Code: 18)</Text>
                    </View>
                </View>

                {/* STATEMENT LINE ITEMS MATRIX */}
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.th, styles.colDesc]}>Description of Services</Text>
                        <Text style={[styles.th, styles.colHsn]}>SAC/HSN</Text>
                        <Text style={[styles.th, styles.colQty]}>Quantity</Text>
                        <Text style={[styles.th, styles.colRate]}>Rate</Text>
                        <Text style={[styles.th, styles.colAmt]}>Amount</Text>
                    </View>

                    {/* Item 1: Conference Hall Rental */}
                    {inputs.hallDays > 0 && (
                        <View style={styles.tableRow}>
                            <Text style={[styles.td, styles.colDesc]}>Corporate Conference Hall Charges</Text>
                            <Text style={[styles.td, styles.colHsn]}>999799</Text>
                            <Text style={[styles.td, styles.colQty]}>{inputs.hallDays} Days</Text>
                            <Text style={[styles.td, styles.colRate]}>{rates.hallPerDay.toFixed(2)}</Text>
                            <Text style={[styles.td, styles.colAmt]}>{billCalculations.hallSubtotal.toFixed(2)}</Text>
                        </View>
                    )}

                    {/* Item 2: Sound System Setup */}
                    {inputs.soundDays > 0 && (
                        <View style={styles.tableRow}>
                            <Text style={[styles.td, styles.colDesc]}>Professional Sound System & Microphone Setup</Text>
                            <Text style={[styles.td, styles.colHsn]}>8518</Text>
                            <Text style={[styles.td, styles.colQty]}>{inputs.soundDays} Days</Text>
                            <Text style={[styles.td, styles.colRate]}>{rates.soundPerDay.toFixed(2)}</Text>
                            <Text style={[styles.td, styles.colAmt]}>{billCalculations.soundSubtotal.toFixed(2)}</Text>
                        </View>
                    )}

                    {/* Item 3: Catering Services */}
                    {inputs.totalGuests > 0 && (
                        <View style={styles.tableRow}>
                            <Text style={[styles.td, styles.colDesc]}>Premium Event Catering (Non-Veg Thali & Welcome Tea)</Text>
                            <Text style={[styles.td, styles.colHsn]}>996332</Text>
                            <Text style={[styles.td, styles.colQty]}>{inputs.totalGuests} Pax</Text>
                            <Text style={[styles.td, styles.colRate]}>{rates.mealPerPerson.toFixed(2)}</Text>
                            <Text style={[styles.td, styles.colAmt]}>{billCalculations.cateringSubtotal.toFixed(2)}</Text>
                        </View>
                    )}
                </View>

                {/* CALCULATION BREAKDOWN SUMMARY PANELS */}
                <View style={styles.summaryContainer}>
                    {/* Left Column: Notes & Conditions */}
                    <View style={styles.termsBlock}>
                        <Text style={{ fontWeight: 700, marginBottom: 3, color: '#1A1A1B' }}>Terms & Conditions:</Text>
                        <Text>1. All disputes are strictly subject to local Goalpara Jurisdiction.</Text>
                        {isQuotation ?
                            (<Text style={{ color: '#D4AF37', fontWeight: 700 }}>2. This quotation estimate is strictly valid for 15 days from the date of issue.</Text>)
                            : (<Text>2. This is a secure Computer Generated Proforma Invoice requiring no physical seals.</Text>)
                        }
                    </View>

                    {/* Right Column: Statement Totals */}
                    <View style={styles.calcBlock}>
                        <View style={styles.calcRow}>
                            <Text style={styles.td}>Taxable Value</Text>
                            <Text style={styles.td}>₹{billCalculations.taxableValue.toFixed(2)}</Text>
                        </View>

                        <View style={styles.calcRow}>
                            <Text style={styles.td}>Catering GST Value</Text>
                            <Text style={styles.td}>₹{billCalculations.cateringGst.toFixed(2)}</Text>
                        </View>

                        <View style={styles.calcRow}>
                            <Text style={styles.td}>Hall & Sound System GST Value</Text>
                            <Text style={styles.td}>₹{billCalculations.rentalGst.toFixed(2)}</Text>
                        </View>

                        <View style={styles.calcRow}>
                            <Text style={styles.td}>Total GST Output</Text>
                            <Text style={styles.td}>₹{billCalculations.totalGst.toFixed(2)}</Text>
                        </View>

                        <View style={styles.calcRow}>
                            <Text style={styles.td}>Round-Off</Text>
                            <Text style={styles.td}>{billCalculations.roundOff}</Text>
                        </View>

                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>{isQuotation ? "Estimated Total:" : "Grand Total Due:"}</Text>
                            <Text style={styles.totalValue}>₹{billCalculations.finalTotal.toLocaleString('en-IN')}.00</Text>
                        </View>
                    </View>
                </View>

                {/* AMOUNT CHARGEABLE IN WORDS SECTION */}
                <View style={styles.wordsBlock}>
                    <Text style={styles.wordsText}>
                        <Text style={{ fontWeight: 700 }}>Amount Chargeable (In Words): </Text>
                        {billCalculations.amountInWords.toUpperCase() || "N/A"}
                    </Text>
                </View>

                {/* CORPORATE LEGAL COMPLIANCE FOOTER SIGN OFF */}
                <View style={styles.footerDeclaration}>
                    <Text style={styles.legalNotice}>
                        {isQuotation
                            ? "This document is a commercial price estimate and proposal framework. Official tax scheduling follows confirmation."
                            : "We declare that this invoice shows the actual price of the event services described and that all particulars are true and correct."}
                    </Text>
                    {!isQuotation ? (<View style={styles.signatureBlock}>
                        <Text style={{ fontSize: 8, color: '#333' }}>For {hotelData?.name || "Hotel Four Seasons"}</Text>
                        <View style={styles.signatureLine} />
                        <Text style={styles.signatureLabel}>Authorized Signatory</Text>
                    </View>) : null}
                </View>
            </Page>
        </Document>
    );
};

export default CorporateInvoicePDF;