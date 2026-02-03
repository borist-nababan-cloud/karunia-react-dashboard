import React from 'react';
import { pdf } from '@react-pdf/renderer';
import SpkPdfDocument from '@/components/SpkPdfDocument';
import { saveAs } from 'file-saver';

// Re-export the type for consistency
export type SpkData = any;

export const generateSpkPdf = async (data: SpkData, filename?: string) => {
  try {
    const doc = <SpkPdfDocument data={data} />;
    const blob = await pdf(doc).toBlob();

    const defaultFilename = `SPK-${data.spkNumber}-${new Date().toISOString().split('T')[0]}.pdf`;
    saveAs(blob, filename || defaultFilename);

    return blob;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

export const previewSpkPdf = async (data: SpkData) => {
  try {
    const doc = <SpkPdfDocument data={data} />;
    const blob = await pdf(doc).toBlob();
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');

    return url;
  } catch (error) {
    console.error('Error previewing PDF:', error);
    throw error;
  }
};

// Sample data for testing
export const sampleSpkData: SpkData = {
  spkNumber: 'SPK/001/SBM/XII/2025',
  date: '13 Desember 2025',
  customer: {
    namaLengkap: 'Ahmad Wijaya',
    alamat: 'Jl. Merdeka No. 123',
    kecamatan: 'Cikarang Selatan',
    kotaKabupaten: 'Bekasi',
    kodePos: '17550',
    noTelepon: '0812-3456-7890',
    noTeleponAlt: '-',
    email: 'ahmad.wijaya@email.com',
    noKtp: '3275031212850001',
    npwp: '-',
    pembayaran: 'KREDIT',
    jenisPerusahaan: 'Perorangan',
    namaPerusahaan: '-',
    alamatPerusahaan: '-',
    npwpPerusahaan: '-'
  },
  vehicle: {
    tipeKendaraan: 'Honda Beat FI CBS',
    tahunPembuatan: '2025',
    warnaKendaraan: 'Hitam',
    warnaInterior: 'Hitam',
    noMesin: 'JFC1E-1500001',
    noRangka: 'MH1JFC115JK000001',
    hargaSatuan: '17500000',
    aksesoris: [],
    totalHarga: '17500000',
    uangMuka: '5000000',
    sisaPembayaran: '12500000',
    alamatKirim: 'Jl. Merdeka No. 123',
    jangkaWaktuPengiriman: 'Segera',
    namaPenerima: 'Ahmad Wijaya'
  },
  sales: {
    nama: 'Budi Santoso'
  },
  signatures: {
    customer: 'Ahmad Wijaya',
    cabang: 'Jakarta'
  }
};