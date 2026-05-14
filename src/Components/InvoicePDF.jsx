import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { HotelData } from '../Models/HotelData';
import { Customer } from '../Models/Customer';
import { Bill } from '../Models/Bill';
import KtsLogo from '../assets/Images/KTS_Logo.png';
import RobotoRegular from '../assets/Roboto Fonts/Roboto-Regular.ttf';
import RobotoBold from '../assets/Roboto Fonts/Roboto-Bold.ttf';
import RobotoItalic from '../assets/Roboto Fonts/Roboto-Italic.ttf';

// Registering Roboto with full character support
Font.register({
    family: 'Roboto',
    fonts: [
        { src: RobotoRegular, fontWeight: 400 },
        { src: RobotoBold, fontWeight: 700 },
        { src: RobotoItalic, fontWeight: 400 }
    ]
});

const styles = StyleSheet.create({
    page: { padding: 30, fontSize: 10, fontFamily: 'Roboto', color: '#000' },
    header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    hotelInfo: { width: '40%' },
    invoiceInfo: { width: '35%', textAlign: 'right' },
    bold: { fontWeight: 700 },
    title: { fontSize: 18, fontWeight: 700, marginBottom: 5 },
    sectionTitle: { fontSize: 11, fontWeight: 700, borderBottom: 1, marginBottom: 5, marginTop: 10 },
    grid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    gridCol: { width: '100%' },
    table: { display: 'table', width: 'auto', borderStyle: 'solid', borderWidth: 0.5, borderRightWidth: 0, borderBottomWidth: 0, marginTop: 10 },
    tableRow: { margin: 'auto', flexDirection: 'row' },
    tableCol: { width: '20%', borderStyle: 'solid', borderWidth: 0.5, borderLeftWidth: 0, borderTopWidth: 0 },
    tableCell: { margin: 'auto', marginTop: 5, marginBottom: 5, fontSize: 9 },
    tableColWide: { width: '40%', borderStyle: 'solid', borderWidth: 0.5, borderLeftWidth: 0, borderTopWidth: 0 },
    termsSection: { marginTop: 20, fontSize: 11, lineHeight: 1.2 },
    footer: { marginTop: 10, flexDirection: 'row', justifyContent: 'space-between' },
    amountWords: { marginTop: 10, fontSize: 9, fontWeight: 400 },
    logo: { width: 60, height: 60, marginBottom: 5 }
});

/**
 * 
 * @param {{ hotel: HotelData, customer: Customer, bill: Bill }} props
 */
const InvoicePDF = ({ hotel, customer, bill }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            {/* 1. Header */}
            <View style={styles.header}>
                <View style={styles.hotelInfo}>
                    <Text style={[styles.title, { textTransform: 'uppercase' }]}>{hotel.name}</Text>
                    <Text>{hotel.address.line1}, {hotel.address.city}</Text>
                    <Text>{hotel.address.state} - {hotel.address.pin}</Text>
                    <Text>Contact: {hotel.contactNumbers.join(", ")}</Text>
                    <Text>Email: {hotel.email}</Text>
                    <Text style={styles.bold}>GSTIN: {hotel.gstNo}</Text>
                    {hotel.website && <Text>Website: {hotel.website}</Text>}
                </View>
                <Image src={KtsLogo} style={styles.logo} />
                <View style={styles.invoiceInfo}>
                    <Text style={[styles.title, { fontSize: 16 }]}>INVOICE</Text>
                    <Text style={styles.bold}>Invoice No: {bill.invoiceNo}</Text>
                    <Text>Date: {bill.getBillDateString()}</Text>
                </View>
            </View>

            {/* 2. Guest & Stay Details */}
            <View style={styles.grid}>
                <View style={styles.gridCol}>
                    <Text style={styles.sectionTitle}>BILL TO</Text>
                    <Text style={styles.bold}>{customer.name}</Text>
                    <Text>{customer.address.areaName}, {customer.address.district}</Text>
                    <Text>{customer.address.state} - {customer.address.pincode}</Text>
                    <Text style={styles.bold}>GSTIN: {customer.companyGst || "N/A"}</Text>
                    <Text>Company Name: {customer.companyName || "N/A"}</Text>
                    <Text>Company Address: {customer.companyAddress.district ? `${customer.companyAddress.district}, ` : ""}{customer.companyAddress.state ? `${customer.companyAddress.state} ` : ""}{customer.companyAddress.country ? customer.companyAddress.country : ""}</Text>
                </View>
                <View style={styles.gridCol}>
                    <Text style={styles.sectionTitle}>STAY DETAILS</Text>
                    <Text style={styles.bold}>Room No: #{customer.roomNumber}</Text>
                    <Text>Check-in: {customer.getCheckInDateString()}</Text>
                    <Text>Check-out: {customer.getCheckOutDateString()}</Text>
                    <Text>Stays: {bill.daysStayed}</Text>
                </View>
            </View>

            {/* 3. Occupancy Table */}
            <Text style={styles.sectionTitle}>OCCUPANCY DETAILS</Text>
            <View style={styles.table}>
                <View style={[styles.tableRow, { backgroundColor: '#f0f0f0' }]}>
                    <View style={[styles.tableCol, { width: '10%' }]}><Text style={[styles.tableCell, styles.bold]}>Sl.</Text></View>
                    <View style={styles.tableColWide}><Text style={[styles.tableCell, styles.bold]}>Guest Name</Text></View>
                    <View style={styles.tableCol}><Text style={[styles.tableCell, styles.bold]}>Age</Text></View>
                    <View style={[styles.tableCol, { width: '30%' }]}><Text style={[styles.tableCell, styles.bold]}>ID Reference</Text></View>
                </View>
                <View style={styles.tableRow}>
                    <View style={[styles.tableCol, { width: '10%' }]}><Text style={styles.tableCell}>1</Text></View>
                    <View style={styles.tableColWide}><Text style={styles.tableCell}>{customer.name} (Lead)</Text></View>
                    <View style={styles.tableCol}><Text style={styles.tableCell}>{customer.age}</Text></View>
                    <View style={[styles.tableCol, { width: '30%' }]}><Text style={styles.tableCell}>{customer.id}</Text></View>
                </View>
                {customer.companions.map((comp, index) => (
                    <View style={styles.tableRow} key={comp.id}>
                        <View style={[styles.tableCol, { width: '10%' }]}><Text style={styles.tableCell}>{index + 2}</Text></View>
                        <View style={styles.tableColWide}><Text style={styles.tableCell}>{comp.name}</Text></View>
                        <View style={styles.tableCol}><Text style={styles.tableCell}>{comp.age}</Text></View>
                        <View style={[styles.tableCol, { width: '30%' }]}><Text style={styles.tableCell}>{comp.id}</Text></View>
                    </View>
                ))}
            </View>

            {/* 4. Billing Summary */}
            <Text style={styles.sectionTitle}>BILLING SUMMARY</Text>
            <View style={styles.table}>
                <View style={[styles.tableRow, { backgroundColor: '#f0f0f0' }]}>
                    <View style={styles.tableColWide}><Text style={[styles.tableCell, styles.bold]}>Description</Text></View>
                    <View style={styles.tableCol}><Text style={[styles.tableCell, styles.bold]}>HSN/SAC</Text></View>
                    <View style={styles.tableCol}><Text style={[styles.tableCell, styles.bold]}>Rate</Text></View>
                    <View style={styles.tableCol}><Text style={[styles.tableCell, styles.bold]}>Stays</Text></View>
                    <View style={styles.tableCol}><Text style={[styles.tableCell, styles.bold]}>Total</Text></View>
                </View>
                <View style={styles.tableRow}>
                    <View style={styles.tableColWide}><Text style={styles.tableCell}>Room Accommodation Services</Text></View>
                    <View style={styles.tableCol}><Text style={styles.tableCell}>{hotel.sacCode}</Text></View>
                    <View style={styles.tableCol}><Text style={styles.tableCell}>{bill.amount.rate}</Text></View>
                    <View style={styles.tableCol}><Text style={styles.tableCell}>{bill.daysStayed}</Text></View>
                    <View style={styles.tableCol}><Text style={styles.tableCell}>{bill.amount.rate * bill.daysStayed}</Text></View>
                </View>
            </View>

            {/* 5. Taxes & Grand Total */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                <view><Text style={styles.amountWords}>Amount in words: {bill.amount.amountInWords.toUpperCase()}</Text></view>
                <view>
                    {customer.companyAddress.state === hotel.address.state ?
                        <>
                            <Text>CGST ({bill.amount.cgstPercent}%): {'\u20B9'}{bill.amount.cgstAmount}/-</Text>
                            <Text>SGST ({bill.amount.sgstPercent}%): {'\u20B9'}{bill.amount.sgstAmount}/-</Text>
                        </> :
                        <Text>IGST ({bill.amount.igstPercent}%): {'\u20B9'}{bill.amount.igstAmount}/-</Text>
                    }
                    <Text style={[styles.bold, { fontSize: 12, marginTop: 5, borderTop: 0.5, paddingTop: 3 }]}>
                        GRAND TOTAL: {'\u20B9'}{bill.amount.totalAmount}/-
                    </Text>
                </view>
            </View>

            {/* 6. Footer: Terms & Bank */}
            <View style={styles.footer}>
                <View style={[styles.termsSection, { width: '60%' }]}>
                    <Text style={[styles.bold, { marginBottom: 3 }]}>Declaration:</Text>
                    <Text style={{ marginBottom: 5 }}>Certified that the particulars given above are true and correct.</Text>

                    <Text style={[styles.bold, { marginBottom: 2 }]}>Terms & Conditions:</Text>
                    <Text>• Bill are payable on presentation.</Text>
                    <Text>• Management not liable for inconveniences beyond control (strikes, power failure etc).</Text>
                    <Text style={styles.bold}>• Check out time 12 PM.</Text>
                    <Text>• Please hand over your room key at the reception.</Text>
                    <Text>• Subject to Goalpara Jurisdiction only.</Text>
                    <Text>• Check out post confirmation from Housekeeping department.</Text>
                </View>
                <View style={[styles.termsSection, { width: '35%', textAlign: 'right' }]}>
                    <Text style={styles.bold}>Bank Details:</Text>
                    <Text>{hotel.bankDetails.accountHolderName}</Text>
                    <Text>{hotel.bankDetails.bankName}</Text>
                    <Text>A/C: {hotel.bankDetails.accountNumber}</Text>
                    <Text>IFSC: {hotel.bankDetails.ifscCode}</Text>
                    <View style={{ marginTop: 60, borderTop: 0.5, paddingTop: 5 }}>
                        <Text style={styles.bold}>Authorized Signatory</Text>
                    </View>
                </View>
            </View>
        </Page>
    </Document>
);

export default InvoicePDF;