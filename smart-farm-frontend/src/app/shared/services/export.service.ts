/**
 * Universal Export Service
 * Provides PDF and CSV export functionality with Feedin branding
 * Uses jsPDF for PDF generation and native CSV generation
 */
import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Feedin brand colors - matching the app's design tokens
export const FEEDIN_COLORS = {
  primary: '#10b981',        // Green-500 - Primary brand color
  primaryDark: '#059669',    // Green-600
  primaryLight: '#34d399',   // Green-400
  secondary: '#3b82f6',      // Blue-500
  secondaryDark: '#2563eb',  // Blue-600
  accent: '#8b5cf6',         // Purple-500

  // Background colors
  headerBg: '#10b981',
  altRowBg: '#f0fdf4',       // Very light green
  altRowBgDark: '#dcfce7',   // Light green

  // Text colors
  textPrimary: '#1f2937',
  textSecondary: '#6b7280',
  textWhite: '#ffffff',

  // Border colors
  border: '#e5e7eb',
  borderDark: '#d1d5db',

  // Status colors
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6'
};

// Export column configuration interface
export interface ExportColumn {
  key: string;
  header: string;
  width?: number;
  format?: 'text' | 'date' | 'datetime' | 'currency' | 'number' | 'status' | 'boolean';
  align?: 'left' | 'center' | 'right';
}

// Export options interface
export interface ExportOptions {
  title: string;
  subtitle?: string;
  filename: string;
  columns: ExportColumn[];
  data: any[];
  includeTimestamp?: boolean;
  adminName?: string;
  sectionName?: string;
}

// PDF specific options
export interface PDFExportOptions extends ExportOptions {
  orientation?: 'portrait' | 'landscape';
  pageSize?: 'a4' | 'letter' | 'legal';
  showPageNumbers?: boolean;
  showFooter?: boolean;
}

// CSV specific options
export interface CSVExportOptions extends ExportOptions {
  delimiter?: ',' | ';' | '\t';
  includeMetadata?: boolean;
  encoding?: 'utf-8' | 'utf-16';
}

@Injectable({
  providedIn: 'root'
})
export class ExportService {
  // Feedin logo as base64 (PNG format for better quality in PDFs)
  // This will be loaded dynamically from assets
  private logoBase64: string = '';
  private logoLoaded = false;

  constructor() {
    this.loadLogo();
  }

  /**
   * Load the Feedin logo and convert to base64
   */
  private async loadLogo(): Promise<void> {
    try {
      const response = await fetch('/assets/images/Feedin_logo.png');
      const blob = await response.blob();
      const reader = new FileReader();

      return new Promise((resolve, reject) => {
        reader.onload = () => {
          this.logoBase64 = reader.result as string;
          this.logoLoaded = true;
          resolve();
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.warn('Could not load Feedin logo for exports:', error);
      this.logoLoaded = false;
    }
  }

  /**
   * Ensure logo is loaded before export
   */
  private async ensureLogoLoaded(): Promise<void> {
    if (!this.logoLoaded) {
      await this.loadLogo();
    }
  }

  /**
   * Generate a professional PDF export
   */
  async exportToPDF(options: PDFExportOptions): Promise<void> {
    await this.ensureLogoLoaded();

    const {
      title,
      subtitle,
      filename,
      columns,
      data,
      orientation = 'portrait',
      pageSize = 'a4',
      showPageNumbers = true,
      showFooter = true,
      adminName,
      includeTimestamp = true
    } = options;

    // Create PDF document
    const doc = new jsPDF({
      orientation,
      unit: 'mm',
      format: pageSize
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPosition = margin;

    // Add header with logo and title
    yPosition = this.addPDFHeader(doc, title, subtitle, pageWidth, margin);

    // Add metadata section
    if (includeTimestamp || adminName) {
      yPosition = this.addPDFMetadata(doc, yPosition, margin, pageWidth, includeTimestamp, adminName);
    }

    // Add table
    const tableColumns = columns.map(col => ({
      header: col.header,
      dataKey: col.key
    }));

    const tableData = data.map(row => {
      const formattedRow: any = {};
      columns.forEach(col => {
        formattedRow[col.key] = this.formatValue(row[col.key], col.format);
      });
      return formattedRow;
    });

    autoTable(doc, {
      startY: yPosition + 5,
      head: [columns.map(col => col.header)],
      body: tableData.map(row => columns.map(col => row[col.key])),
      theme: 'striped',
      headStyles: {
        fillColor: this.hexToRgb(FEEDIN_COLORS.primary),
        textColor: this.hexToRgb(FEEDIN_COLORS.textWhite),
        fontStyle: 'bold',
        fontSize: 10,
        cellPadding: 4,
        halign: 'left'
      },
      alternateRowStyles: {
        fillColor: this.hexToRgb(FEEDIN_COLORS.altRowBg)
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 3,
        textColor: this.hexToRgb(FEEDIN_COLORS.textPrimary)
      },
      styles: {
        lineColor: this.hexToRgb(FEEDIN_COLORS.border),
        lineWidth: 0.1,
        font: 'helvetica'
      },
      columnStyles: this.getColumnStyles(columns),
      margin: { left: margin, right: margin },
      didDrawPage: (data) => {
        // Add page numbers and footer on each page
        if (showPageNumbers) {
          this.addPDFPageNumber(doc, pageWidth, pageHeight, margin);
        }
        if (showFooter) {
          this.addPDFFooter(doc, pageWidth, pageHeight, margin);
        }
      }
    });

    // Generate filename with date
    const generatedFilename = this.generateFilename(filename, 'pdf');

    // Save the PDF
    doc.save(generatedFilename);
  }

  /**
   * Add PDF header with logo and title
   */
  private addPDFHeader(
    doc: jsPDF,
    title: string,
    subtitle: string | undefined,
    pageWidth: number,
    margin: number
  ): number {
    let yPosition = margin;

    // Add gradient-like header background
    doc.setFillColor(...this.hexToRgb(FEEDIN_COLORS.primary));
    doc.rect(0, 0, pageWidth, 35, 'F');

    // Add a secondary color accent stripe
    doc.setFillColor(...this.hexToRgb(FEEDIN_COLORS.primaryDark));
    doc.rect(0, 32, pageWidth, 3, 'F');

    // Add logo if available
    if (this.logoBase64) {
      try {
        doc.addImage(this.logoBase64, 'PNG', margin, 8, 30, 18);
      } catch (e) {
        console.warn('Could not add logo to PDF:', e);
      }
    }

    // Add title (centered or offset based on logo)
    doc.setTextColor(...this.hexToRgb(FEEDIN_COLORS.textWhite));
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');

    const titleX = this.logoBase64 ? margin + 40 : pageWidth / 2;
    const titleAlign = this.logoBase64 ? 'left' : 'center';
    doc.text(title, titleX, 18, { align: titleAlign as any });

    // Add subtitle if provided
    if (subtitle) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(subtitle, titleX, 26, { align: titleAlign as any });
    }

    return 40; // Return Y position after header
  }

  /**
   * Add metadata section (export date, admin name, etc.)
   */
  private addPDFMetadata(
    doc: jsPDF,
    yPosition: number,
    margin: number,
    pageWidth: number,
    includeTimestamp: boolean,
    adminName: string | undefined
  ): number {
    doc.setFontSize(9);
    doc.setTextColor(...this.hexToRgb(FEEDIN_COLORS.textSecondary));
    doc.setFont('helvetica', 'normal');

    const metadataLines: string[] = [];

    if (includeTimestamp) {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const timeStr = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
      metadataLines.push(`Generated: ${dateStr} at ${timeStr}`);
    }

    if (adminName) {
      metadataLines.push(`Generated by: ${adminName}`);
    }

    metadataLines.forEach((line, index) => {
      doc.text(line, margin, yPosition + (index * 5));
    });

    return yPosition + (metadataLines.length * 5) + 5;
  }

  /**
   * Add page numbers to PDF
   */
  private addPDFPageNumber(
    doc: jsPDF,
    pageWidth: number,
    pageHeight: number,
    margin: number
  ): void {
    const pageCount = (doc as any).internal.getNumberOfPages();
    const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber;

    doc.setFontSize(8);
    doc.setTextColor(...this.hexToRgb(FEEDIN_COLORS.textSecondary));
    doc.text(
      `Page ${currentPage} of ${pageCount}`,
      pageWidth - margin,
      pageHeight - 10,
      { align: 'right' }
    );
  }

  /**
   * Add footer to PDF
   */
  private addPDFFooter(
    doc: jsPDF,
    pageWidth: number,
    pageHeight: number,
    margin: number
  ): void {
    // Add footer line
    doc.setDrawColor(...this.hexToRgb(FEEDIN_COLORS.border));
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

    // Add company info
    doc.setFontSize(8);
    doc.setTextColor(...this.hexToRgb(FEEDIN_COLORS.textSecondary));
    doc.setFont('helvetica', 'normal');
    doc.text('Feedin - Smart Agriculture Platform', margin, pageHeight - 10);
    doc.text('© ' + new Date().getFullYear() + ' Feedin. All rights reserved.', margin, pageHeight - 6);
  }

  /**
   * Get column styles for autoTable
   */
  private getColumnStyles(columns: ExportColumn[]): any {
    const styles: any = {};
    columns.forEach((col, index) => {
      styles[index] = {
        halign: col.align || 'left',
        cellWidth: col.width ? col.width : 'auto'
      };
    });
    return styles;
  }

  /**
   * Generate a CSV export
   */
  exportToCSV(options: CSVExportOptions): void {
    const {
      title,
      filename,
      columns,
      data,
      delimiter = ',',
      includeMetadata = true,
      includeTimestamp = true,
      adminName,
      sectionName
    } = options;

    const lines: string[] = [];

    // Add metadata rows if requested
    if (includeMetadata) {
      lines.push(this.escapeCSV(`Feedin Export - ${title}`, delimiter));

      if (sectionName) {
        lines.push(this.escapeCSV(`Section: ${sectionName}`, delimiter));
      }

      if (includeTimestamp) {
        const now = new Date();
        lines.push(this.escapeCSV(`Export Date: ${now.toISOString()}`, delimiter));
      }

      if (adminName) {
        lines.push(this.escapeCSV(`Generated by: ${adminName}`, delimiter));
      }

      lines.push(''); // Empty line before data
    }

    // Add header row
    const headerRow = columns.map(col => this.escapeCSVField(col.header)).join(delimiter);
    lines.push(headerRow);

    // Add data rows
    data.forEach(row => {
      const dataRow = columns.map(col => {
        const value = this.formatValue(row[col.key], col.format);
        return this.escapeCSVField(value);
      }).join(delimiter);
      lines.push(dataRow);
    });

    // Create CSV content with BOM for UTF-8
    const BOM = '\uFEFF';
    const csvContent = BOM + lines.join('\r\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const generatedFilename = this.generateFilename(filename, 'csv');

    this.downloadFile(blob, generatedFilename);
  }

  /**
   * Format a value based on its type
   */
  private formatValue(value: any, format?: string): string {
    if (value === null || value === undefined) {
      return '-';
    }

    switch (format) {
      case 'date':
        return this.formatDate(value);
      case 'datetime':
        return this.formatDateTime(value);
      case 'currency':
        return this.formatCurrency(value);
      case 'number':
        return this.formatNumber(value);
      case 'boolean':
        return value ? 'Yes' : 'No';
      case 'status':
        return String(value).charAt(0).toUpperCase() + String(value).slice(1).toLowerCase();
      default:
        return String(value);
    }
  }

  /**
   * Format date value
   */
  private formatDate(value: any): string {
    if (!value) return '-';
    try {
      const date = new Date(value);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return String(value);
    }
  }

  /**
   * Format datetime value
   */
  private formatDateTime(value: any): string {
    if (!value) return '-';
    try {
      const date = new Date(value);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return String(value);
    }
  }

  /**
   * Format currency value
   */
  private formatCurrency(value: any): string {
    if (typeof value !== 'number') return String(value);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  }

  /**
   * Format number value
   */
  private formatNumber(value: any): string {
    if (typeof value !== 'number') return String(value);
    return new Intl.NumberFormat('en-US').format(value);
  }

  /**
   * Escape CSV field value
   */
  private escapeCSVField(value: string): string {
    if (!value) return '';

    // If the value contains special characters, wrap in quotes
    if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
      // Escape double quotes by doubling them
      value = value.replace(/"/g, '""');
      return `"${value}"`;
    }

    return value;
  }

  /**
   * Escape entire CSV line
   */
  private escapeCSV(value: string, delimiter: string): string {
    return this.escapeCSVField(value);
  }

  /**
   * Generate filename with timestamp
   */
  private generateFilename(baseName: string, extension: string): string {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const safeName = baseName.toLowerCase().replace(/\s+/g, '_');
    return `feedin_${safeName}_${dateStr}.${extension}`;
  }

  /**
   * Convert hex color to RGB array
   */
  private hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      return [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
      ];
    }
    return [0, 0, 0];
  }

  /**
   * Download a file
   */
  private downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}
