import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

// Create styles
const styles = StyleSheet.create({
    page: {
        padding: 20, // Reduced padding
        fontFamily: 'Helvetica',
        fontSize: 10,
        lineHeight: 1.3, // Reduced line height
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10, // Reduced margin
        alignItems: 'flex-start', // Align top to avoid overlap issues if logo is tall
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        paddingBottom: 5,
    },
    logo: {
        width: 140, // Slightly smaller
        height: 'auto',
    },
    titleContainer: {
        textAlign: 'right',
        flex: 1, // Allow taking space
        marginLeft: 20, // Add spacing from logo
    },
    reportTitle: {
        fontSize: 16, // Slightly smaller
        fontWeight: 'bold',
        marginTop: 0,
    },
    spkNumber: {
        fontSize: 14, // Larger
        fontWeight: 'heavy', // Bold/Heavy
        color: '#000', // Darker (Black)
        marginTop: 5,
    },
    section: {
        margin: 5, // Reduced
        padding: 5,
        flexGrow: 1,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        marginBottom: 3,
        backgroundColor: '#e6e6e6',
        padding: 2,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 2, // Reduced
    },
    label: {
        width: '35%',
        fontWeight: 'bold',
        fontSize: 9, // Slightly smaller text
    },
    value: {
        width: '65%',
        fontSize: 9,
    },
    grid: {
        flexDirection: 'row',
        gap: 10,
    },
    column: {
        flex: 1,
    },
    footer: {
        marginTop: 10, // Reduced
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    signatureBlock: {
        alignItems: 'center',
        marginTop: 10, // Reduced
    },
    signatureLine: {
        marginTop: 40, // Reduced
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        width: 120, // Slightly smaller
        textAlign: 'center',
    },
    disclaimer: {
        fontSize: 6, // Reduced
        color: '#777',
        marginTop: 5,
        textAlign: 'center',
        fontStyle: 'italic',
    }
});

// Interface for props
interface SpkPdfProps {
    data: any;
}

const SpkPdfDocument: React.FC<SpkPdfProps> = ({ data }) => {
    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
    };

    const formatCurrency = (amount: number | string) => {
        if (!amount) return 'Rp 0';
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(amount));
    };

    // Use absolute URL for image if possible, or relative if public folder works
    // In React/Vite, /logo-wide.jpg should be in public folder.
    const logoSrc = "/images/logo-wide.jpg";

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    {/* eslint-disable-next-line jsx-a11y/alt-text */}
                    <Image style={styles.logo} src={logoSrc} />
                    <View style={styles.titleContainer}>
                        <Text style={styles.reportTitle}>SURAT PEMESANAN KENDARAAN</Text>
                        <Text style={styles.spkNumber}>No: {data.noSPK || '-'}</Text>
                        <Text style={{ fontSize: 10 }}>Tanggal: {formatDate(data.tanggal)}</Text>
                    </View>
                </View>

                {/* Customer Information */}
                <View>
                    <Text style={styles.sectionTitle}>I. DATA PEMESAN (CUSTOMER)</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Nama Customer</Text>
                        <Text style={styles.value}>: {data.namaCustomer || '-'}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Alamat</Text>
                        <Text style={styles.value}>: {data.alamatCustomer || '-'}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>No. Telepon</Text>
                        <Text style={styles.value}>: {data.noTeleponCustomer || '-'}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Email</Text>
                        <Text style={styles.value}>: {data.emailcustomer || '-'}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Pekerjaan</Text>
                        <Text style={styles.value}>: {data.pekerjaanCustomer || '-'}</Text>
                    </View>
                </View>

                {/* Data STNK/BPKB */}
                <View style={{ marginTop: 10 }}>
                    <Text style={styles.sectionTitle}>II. DATA UTK STNK & BPKB</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Nama di STNK/BPKB</Text>
                        <Text style={styles.value}>: {data.detailInfo?.namaBpkbStnk || '-'}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Alamat STNK</Text>
                        <Text style={styles.value}>: {data.detailInfo?.alamatBpkbStnk || '-'}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Kota</Text>
                        <Text style={styles.value}>: {data.detailInfo?.kotaStnkBpkb || '-'}</Text>
                    </View>
                </View>

                {/* Vehicle & Payment Info Grid */}
                <View style={[styles.grid, { marginTop: 10 }]}>
                    {/* Vehicle Info */}
                    <View style={styles.column}>
                        <Text style={styles.sectionTitle}>III. DATA KENDARAAN</Text>
                        <View style={styles.row}>
                            <Text style={styles.label}>Tipe</Text>
                            <Text style={styles.value}>: {data.unitInfo?.vehicleType?.name || '-'}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>Warna</Text>
                            <Text style={styles.value}>: {data.unitInfo?.color?.colorname || data.unitInfo?.color?.name || '-'}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>Tahun</Text>
                            <Text style={styles.value}>: {data.unitInfo?.tahun || '-'}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>No. Rangka</Text>
                            <Text style={styles.value}>: {data.unitInfo?.noRangka || '-'}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>No. Mesin</Text>
                            <Text style={styles.value}>: {data.unitInfo?.noMesin || '-'}</Text>
                        </View>
                    </View>

                    {/* Payment Info */}
                    <View style={styles.column}>
                        <Text style={styles.sectionTitle}>IV. RINCIAN PEMBAYARAN</Text>
                        <View style={styles.row}>
                            <Text style={styles.label}>Cara Bayar</Text>
                            <Text style={styles.value}>: {data.paymentInfo?.caraBayar || '-'}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>Harga OTR</Text>
                            <Text style={styles.value}>: {formatCurrency(data.unitInfo?.hargaOtr)}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>Tanda Jadi</Text>
                            <Text style={styles.value}>: {formatCurrency(data.paymentInfo?.tandaJadi)}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>Uang Muka (DP)</Text>
                            <Text style={styles.value}>: {formatCurrency(data.paymentInfo?.dp)}</Text>
                        </View>
                        {data.paymentInfo?.caraBayar === 'KREDIT' && (
                            <>
                                <View style={styles.row}>
                                    <Text style={styles.label}>Angsuran</Text>
                                    <Text style={styles.value}>: {formatCurrency(data.paymentInfo?.angsuran)}</Text>
                                </View>
                                <View style={styles.row}>
                                    <Text style={styles.label}>Tenor</Text>
                                    <Text style={styles.value}>: {data.paymentInfo?.tenor} Bulan</Text>
                                </View>
                                <View style={styles.row}>
                                    <Text style={styles.label}>Leasing</Text>
                                    <Text style={styles.value}>: {data.paymentInfo?.namaLeasing || '-'}</Text>
                                </View>
                            </>
                        )}
                    </View>
                </View>

                {/* Notes */}
                <View style={{ marginTop: 10 }}>
                    <Text style={styles.sectionTitle}>CATATAN / BONUS</Text>
                    <View style={{ border: '1px solid #ccc', padding: 5, minHeight: 40 }}>
                        <Text>{data.unitInfo?.bonus ? `Bonus: ${data.unitInfo.bonus}` : ''}</Text>
                        <Text>{data.unitInfo?.lainLain ? `Lain-lain: ${data.unitInfo.lainLain}` : ''}</Text>
                        <Text>{data.paymentInfo?.keterangan ? `Keterangan: ${data.paymentInfo.keterangan}` : ''}</Text>
                    </View>
                </View>

                {/* Signatures */}
                <View style={styles.footer}>
                    <View style={styles.signatureBlock}>
                        <Text>Hormat Kami,</Text>
                        <View style={{ ...styles.signatureLine, borderBottomColor: 'transparent' }} />
                        <View style={{ borderBottomWidth: 1, borderBottomColor: '#000', width: 150, textAlign: 'center', marginTop: 0 }} >
                            <Text style={{ textAlign: 'center', paddingBottom: 2 }}>{data.salesProfile?.surename || '(.....................)'}</Text>
                        </View>
                        <Text>Sales Consultant</Text>
                    </View>
                    <View style={styles.signatureBlock}>
                        <Text>Menyetujui,</Text>
                        <View style={{ ...styles.signatureLine, borderBottomColor: 'transparent' }} />
                        <View style={{ borderBottomWidth: 1, borderBottomColor: '#000', width: 150, textAlign: 'center', marginTop: 0 }} >
                            <Text style={{ textAlign: 'center', paddingBottom: 2 }}>{data.namaCustomer || '(.....................)'}</Text>
                        </View>
                        <Text>Pemesanan (Customer)</Text>
                    </View>
                    <View style={styles.signatureBlock}>
                        <Text>Nama SPV</Text>
                        <View style={{ ...styles.signatureLine, borderBottomColor: 'transparent' }} />
                        <View style={{ borderBottomWidth: 1, borderBottomColor: '#000', width: 150, textAlign: 'center', marginTop: 0 }} >
                            <Text style={{ textAlign: 'center', paddingBottom: 2 }}>{data.salesProfile?.namasupervisor || '(.....................)'}</Text>
                        </View>
                        <Text>Supervisor</Text>
                    </View>
                </View>

                <View style={{ marginTop: 10 }}>
                    <Text style={{ fontSize: 6, fontStyle: 'italic', textAlign: 'center', color: '#555', marginBottom: 2, lineHeight: 1.2 }}>
                        Lakukan pembayaran dengan cara Transfer ke rekening Bank BCA NO.258 3033 947 An CV KARUNIA MOTOR
                    </Text>
                    <Text style={{ fontSize: 6, fontStyle: 'italic', textAlign: 'center', color: '#555', marginBottom: 2, lineHeight: 1.2 }}>
                        Pembayaran tunai dianggap sah apabila telah diterima oleh kasir, lakukan konfirmasi ke telp. (031) 503 222 9
                    </Text>
                    <Text style={{ fontSize: 6, fontStyle: 'italic', textAlign: 'center', color: '#555', lineHeight: 1.2 }}>
                        Harga tidak terikat, sewaktu waktu dapat berubah tanpa pemberitahuan terlebih dahulu.
                        Surat pesanan kendaraan ini bukan sebagai bukti pembayaran yang sah.
                    </Text>
                    <Text style={styles.disclaimer}>
                        * Dokumen ini dicetak secara otomatis oleh sistem. Simpan dokumen ini sebagai bukti pemesanan yang sah.
                    </Text>
                </View>
            </Page>
        </Document>
    );
};

export default SpkPdfDocument;
