import { jsPDF } from 'jspdf';

export class PdfService {
  // Genera el albarán y lo devuelve como Buffer
  async generarAlbaranBuffer(pedido: any, lineasPedido: any[], usuario: any): Promise<Buffer> {
    const pdf = new jsPDF();

    pdf.setFontSize(18);
    pdf.text('Albarán de Pedido', 20, 20);

    pdf.setFontSize(12);
    pdf.text(`Pedido ID: ${pedido.id}`, 20, 30);
    pdf.text(`Cliente: ${usuario?.nombre || 'Desconocido'}`, 20, 40);

    let y = 50;
    lineasPedido.forEach((linea: any) => {
      pdf.text(`Producto: ${linea.nombre} x${linea.cant} (${linea.precio}€)`, 20, y);
      y += 10;
    });

    pdf.text(`Total: ${pedido.total}€`, 20, y + 10);

    return Buffer.from(pdf.output('arraybuffer'));
  }
}
