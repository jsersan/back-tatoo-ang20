// ============================================
// PDF SERVICE - SOLO PARA BACKEND (NODE.JS)
// backend/services/pdf.service.ts
// ============================================

import jsPDF from 'jspdf';

export class PdfService {
  constructor() { }

  /** MÉTODO AUXILIAR: Agregar pie de página */
  private agregarPieDePagina(pdf: jsPDF, numeroPagina: number): void {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const yPosition = pageHeight - 20;

    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text('Este documento fue generado automáticamente', 20, yPosition);
    pdf.text(`Página ${numeroPagina}`, pageWidth - 30, yPosition);
  }

  /** MÉTODO AUXILIAR: Agregar encabezado de tabla */
  private agregarEncabezadoTabla(pdf: jsPDF, yPosition: number): number {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const lightGray: [number, number, number] = [242, 243, 244];

    pdf.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    pdf.rect(20, yPosition - 5, pageWidth - 40, 8, 'F');

    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Producto', 25, yPosition);
    pdf.text('Color', 120, yPosition);
    pdf.text('Cantidad', 160, yPosition, { align: 'right' });
    pdf.text('Precio', pageWidth - 25, yPosition, { align: 'right' });

    pdf.setFont('helvetica', 'normal');
    return yPosition + 10;
  }

  /** Genera un albarán PDF y lo retorna como Buffer */
  generarAlbaranBuffer(pedido: any, lineas: any[], usuario?: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        let yPosition = 20;
        let numeroPagina = 1;
        const primaryColor: [number, number, number] = [82, 102, 122];

        // ========== ENCABEZADO ==========
        pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        pdf.rect(0, 0, pageWidth, 40, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(24);
        pdf.text('ALBARÁN', 20, 25);
        pdf.setFontSize(10);
        pdf.text(`Ref: #${pedido.id}`, 20, 32);

        // ========== INFORMACIÓN DEL COMPRADOR ==========
        yPosition = 55;
        if (usuario) {
          pdf.setTextColor(0, 0, 0);
          pdf.setFontSize(12);
          pdf.text('Información del Comprador', 20, yPosition);
          yPosition += 10;
          pdf.setFontSize(10);
          pdf.text(`Nombre: ${usuario.nombre || 'N/A'}`, 20, yPosition);
          yPosition += 7;
          pdf.text(`Email: ${usuario.email || 'N/A'}`, 20, yPosition);
          yPosition += 7;
          pdf.text(`Dirección: ${usuario.direccion || 'N/A'}`, 20, yPosition);
          yPosition += 7;
          pdf.text(`Ciudad: ${usuario.ciudad || 'N/A'} - CP: ${usuario.cp || 'N/A'}`, 20, yPosition);
          yPosition += 15;
        }

        // ========== INFORMACIÓN DEL PEDIDO ==========
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(12);
        pdf.text('Información del Pedido', 20, yPosition);
        yPosition += 10;
        pdf.setFontSize(10);
        pdf.text(`Fecha: ${this.formatearFecha(pedido.fecha)}`, 20, yPosition);
        yPosition += 7;
        pdf.text(`Referencia: #${pedido.id}`, 20, yPosition);
        yPosition += 7;
        pdf.text(`${pedido.total.toFixed(2)} €`, 20, yPosition); // <--- Cambio aquí

        // ========== TABLA DE PRODUCTOS ==========
        yPosition += 20;
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Productos', 20, yPosition);
        yPosition += 10;

        yPosition = this.agregarEncabezadoTabla(pdf, yPosition);

        // ========== FILAS DE PRODUCTOS ==========
        pdf.setFont('helvetica', 'normal');
        lineas.forEach((linea: any) => {
          const nombre = linea.nombre || 'Sin nombre';
          const color = linea.color || 'N/A';
          const cantidadRaw = linea.cantidad !== undefined ? linea.cantidad : linea.cant;
          const cantidad = parseInt(cantidadRaw) || 0;
          const precioRaw = linea.precio !== undefined ? linea.precio : linea.product?.precio;
          const precio = parseFloat(precioRaw) || 0;
          const precioLinea = precio * cantidad;

          if (yPosition > pageHeight - 40) {
            this.agregarPieDePagina(pdf, numeroPagina);
            pdf.addPage();
            numeroPagina++;
            yPosition = 20;
            yPosition = this.agregarEncabezadoTabla(pdf, yPosition);
          }

          pdf.text(nombre, 25, yPosition);
          pdf.text(color, 120, yPosition);
          pdf.text(cantidad.toString(), 160, yPosition, { align: 'right' });
          pdf.text(`${precioLinea.toFixed(2)} €`, pageWidth - 25, yPosition, { align: 'right' }); // <--- Cambio aquí

          yPosition += 8;
        });

        // ========== LÍNEA SEPARADORA Y TOTAL ==========
        yPosition += 5;
        pdf.setDrawColor(200, 200, 200);
        pdf.line(20, yPosition, pageWidth - 20, yPosition);
        yPosition += 10;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        pdf.text('TOTAL:', 20, yPosition);
        pdf.text(`${pedido.total.toFixed(2)} €`, pageWidth - 21, yPosition, { align: 'right' }); // <--- Cambio aquí

        this.agregarPieDePagina(pdf, numeroPagina);

        const arrayBuffer = pdf.output('arraybuffer');
        const pdfBuffer = Buffer.from(arrayBuffer);
        resolve(pdfBuffer);
      } catch (error) {
        reject(error);
      }
    });
  }

  private formatearFecha(fecha: any): string {
    if (!fecha) return '';
    try {
      const date = new Date(fecha);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return '';
    }
  }
}
