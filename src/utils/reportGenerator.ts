// src/utils/reportGenerator.ts
// Generador de PDFs con jsPDF y autoTable

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface OpcionesReporte {
  titulo: string;
  filtros?: string;
  tipo: string;
}

/**
 * Generar reporte PDF con encabezado estándar
 */
export async function generarReportePDF(
  datos: any,
  opciones: OpcionesReporte
): Promise<void> {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margen = 15;

    // Encabezado
    agregarEncabezado(doc, pageWidth);

    // Título
    doc.setFontSize(16);
    doc.setTextColor(10, 102, 194); // Color primario
    doc.text(opciones.titulo, margen, 40);

    // Filtros
    if (opciones.filtros) {
      doc.setFontSize(10);
      doc.setTextColor(118, 118, 118); // Gris
      doc.text(opciones.filtros, margen, 50);
    }

    // Datos según tipo
    let yActual = opciones.filtros ? 60 : 55;

    switch (opciones.tipo) {
      case 'casos-sucursal':
        yActual = agregarReporteCasosSucursal(doc, datos, yActual, margen, pageWidth, pageHeight);
        break;
      case 'juicios-estado':
        yActual = agregarReporteJuiciosEstado(doc, datos, yActual, margen, pageWidth, pageHeight);
        break;
      case 'recuperacion':
        yActual = agregarReporteRecuperacion(doc, datos, yActual, margen, pageWidth, pageHeight);
        break;
      case 'asistentes':
        yActual = agregarReporteAsistentes(doc, datos, yActual, margen, pageWidth, pageHeight);
        break;
      case 'vencimientos':
        yActual = agregarReporteVencimientos(doc, datos, yActual, margen, pageWidth, pageHeight);
        break;
    }

    // Pie de página
    agregarPiePagina(doc, pageHeight, margen);

    // Descargar
    const nombreArchivo = `${opciones.tipo}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(nombreArchivo);
  } catch (err) {
    console.error('Error generando PDF:', err);
    throw err;
  }
}

/**
 * Agregar encabezado estándar
 */
function agregarEncabezado(doc: jsPDF, pageWidth: number): void {
  const margen = 15;

  // Fondo color
  doc.setFillColor(10, 102, 194);
  doc.rect(0, 0, pageWidth, 30, 'F');

  // Título
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text('JURISCONTROL WEB', margen, 15);

  // Subtítulo
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.text('Sistema de Gestión Legal Integral', margen, 23);

  // Reset color
  doc.setTextColor(0, 0, 0);
}

/**
 * Agregar pie de página
 */
function agregarPiePagina(doc: jsPDF, pageHeight: number, margen: number): void {
  const pageCount = doc.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(118, 118, 118);
    doc.text(
      `Generado: ${new Date().toLocaleString('es-MX')} | Página ${i} de ${pageCount}`,
      margen,
      pageHeight - 10
    );
  }
}

/**
 * Reporte: Casos por Sucursal
 */
function agregarReporteCasosSucursal(
  doc: jsPDF,
  datos: any,
  yInicial: number,
  margen: number,
  pageWidth: number,
  pageHeight: number
): number {
  let y = yInicial;

  Object.entries(datos).forEach(([sucursal, casos]: [string, any]) => {
    // Encabezado sucursal
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`Sucursal ${sucursal}`, margen, y);
    y += 5;

    // Tabla
    const datos_tabla = (casos as any[]).map((c) => [
      c.numero_caso,
      c.estado,
      `$${(c.capital_mn || 0).toLocaleString('es-MX')}`,
      new Date(c.fecha_creacion).toLocaleDateString('es-MX'),
    ]);

    autoTable(doc, {
      startY: y,
      head: [['No. Caso', 'Estado', 'Capital', 'Fecha']],
      body: datos_tabla,
      margin: margen,
      styles: { fontSize: 9 },
      columnStyles: { 2: { halign: 'right' } },
    });

    y = (doc as any).lastAutoTable.finalY + 10;

    // Totales
    const totalCapital = (casos as any[]).reduce((sum, c) => sum + (c.capital_mn || 0), 0);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text(
      `Total: ${casos.length} casos | $${totalCapital.toLocaleString('es-MX')}`,
      margen,
      y
    );
    y += 15;

    // Nueva página si es necesario
    if (y > pageHeight - 30) {
      doc.addPage();
      y = 20;
    }
  });

  return y;
}

/**
 * Reporte: Juicios por Estado
 */
function agregarReporteJuiciosEstado(
  doc: jsPDF,
  datos: any[],
  yInicial: number,
  margen: number,
  pageWidth: number,
  pageHeight: number
): number {
  const datos_tabla = datos.map((j) => [
    j.numero_expediente,
    j.estado,
    j.etapa_actual,
    j.casos?.numero_caso || '-',
    new Date(j.fecha_presentacion).toLocaleDateString('es-MX'),
  ]);

  autoTable(doc, {
    startY: yInicial,
    head: [['Expediente', 'Estado', 'Etapa', 'Caso', 'Fecha']],
    body: datos_tabla,
    margin: margen,
    styles: { fontSize: 9 },
  });

  return (doc as any).lastAutoTable.finalY + 10;
}

/**
 * Reporte: Recuperación Mensual
 */
function agregarReporteRecuperacion(
  doc: jsPDF,
  datos: any,
  yInicial: number,
  margen: number,
  pageWidth: number,
  pageHeight: number
): number {
  let y = yInicial;

  const datos_tabla = Object.entries(datos).map(([mes, info]: [string, any]) => [
    mes,
    `$${info.capital.toLocaleString('es-MX')}`,
    `$${info.recuperado.toLocaleString('es-MX')}`,
    `${((info.recuperado / info.capital) * 100 || 0).toFixed(1)}%`,
    info.casos.toString(),
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Mes', 'Capital', 'Recuperado', '% Recuperación', 'Casos']],
    body: datos_tabla,
    margin: margen,
    styles: { fontSize: 9 },
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'center' } },
  });

  return (doc as any).lastAutoTable.finalY + 10;
}

/**
 * Reporte: Actividad de Asistentes
 */
function agregarReporteAsistentes(
  doc: jsPDF,
  datos: any,
  yInicial: number,
  margen: number,
  pageWidth: number,
  pageHeight: number
): number {
  const datos_tabla = Object.entries(datos).map(([asistente, info]: [string, any]) => [
    asistente,
    info.casosAsignados.toString(),
    `$${info.capitalTotal.toLocaleString('es-MX')}`,
    `$${info.recuperado.toLocaleString('es-MX')}`,
    ((info.recuperado / info.capitalTotal) * 100 || 0).toFixed(1) + '%',
  ]);

  autoTable(doc, {
    startY: yInicial,
    head: [['Asistente', 'Casos', 'Capital Total', 'Recuperado', '% Recuperación']],
    body: datos_tabla,
    margin: margen,
    styles: { fontSize: 9 },
    columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
  });

  return (doc as any).lastAutoTable.finalY + 10;
}

/**
 * Reporte: Vencimientos Próximos
 */
function agregarReporteVencimientos(
  doc: jsPDF,
  datos: any[],
  yInicial: number,
  margen: number,
  pageWidth: number,
  pageHeight: number
): number {
  const hoy = new Date();

  const datos_tabla = datos.map((c) => {
    const diasRestantes = Math.ceil(
      (new Date(c.fecha_vencimiento).getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
    );
    const urgencia = diasRestantes <= 3 ? '🚨 CRÍTICA' : diasRestantes <= 7 ? '⚠️ ALTA' : '✓ Normal';

    return [
      c.numero_caso,
      new Date(c.fecha_vencimiento).toLocaleDateString('es-MX'),
      diasRestantes.toString(),
      urgencia,
      c.estado,
    ];
  });

  autoTable(doc, {
    startY: yInicial,
    head: [['Caso', 'Vencimiento', 'Días', 'Urgencia', 'Estado']],
    body: datos_tabla,
    margin: margen,
    styles: { fontSize: 9 },
    columnStyles: { 2: { halign: 'center' } },
  });

  return (doc as any).lastAutoTable.finalY + 10;
}
