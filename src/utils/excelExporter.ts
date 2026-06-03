// src/utils/excelExporter.ts
// Utilidad para exportar datos a Excel con formato

import * as XLSX from 'xlsx';

interface ConfiguracionExcel {
  nombreHoja?: string;
  nombreArchivo?: string;
  autoajustarAncho?: boolean;
  encabezadoEnNegrita?: boolean;
}

/**
 * Exportar datos a Excel
 */
export function exportarExcel(
  datos: any[],
  nombreHoja: string = 'Datos',
  config: ConfiguracionExcel = {}
): void {
  try {
    const opciones: ConfiguracionExcel = {
      autoajustarAncho: true,
      encabezadoEnNegrita: true,
      ...config,
    };

    if (datos.length === 0) {
      console.warn('No hay datos para exportar');
      return;
    }

    // Crear workbook
    const workbook = XLSX.utils.book_new();

    // Convertir datos a sheet
    const worksheet = XLSX.utils.json_to_sheet(datos);

    // Ajustar ancho de columnas
    if (opciones.autoajustarAncho) {
      const anchos = calcularAnchos(datos);
      worksheet['!cols'] = anchos;
    }

    // Formato de encabezado (negrita)
    if (opciones.encabezadoEnNegrita && datos.length > 0) {
      aplicarFormatoEncabezado(worksheet, Object.keys(datos[0]));
    }

    // Agregar sheet al workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, nombreHoja);

    // Descargar
    const nombreArchivo = `${opciones.nombreArchivo || nombreHoja}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, nombreArchivo);
  } catch (err) {
    console.error('Error exportando Excel:', err);
    throw err;
  }
}

/**
 * Exportar múltiples hojas
 */
export function exportarExcelMultipleHojas(
  conjuntoDatos: { nombre: string; datos: any[] }[],
  nombreArchivo: string = 'reporte'
): void {
  try {
    const workbook = XLSX.utils.book_new();

    conjuntoDatos.forEach(({ nombre, datos }) => {
      if (datos.length > 0) {
        const worksheet = XLSX.utils.json_to_sheet(datos);

        // Ajustar ancho
        const anchos = calcularAnchos(datos);
        worksheet['!cols'] = anchos;

        // Formato encabezado
        aplicarFormatoEncabezado(worksheet, Object.keys(datos[0]));

        XLSX.utils.book_append_sheet(workbook, worksheet, nombre);
      }
    });

    const archivo = `${nombreArchivo}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, archivo);
  } catch (err) {
    console.error('Error exportando múltiples hojas:', err);
    throw err;
  }
}

/**
 * Calcular ancho óptimo de columnas
 */
function calcularAnchos(datos: any[]): { wch: number }[] {
  if (datos.length === 0) return [];

  const primeraFila = datos[0];
  const columnas = Object.keys(primeraFila);

  return columnas.map((col) => {
    let maxLargo = col.length;

    datos.forEach((fila) => {
      const valor = String(fila[col] || '');
      if (valor.length > maxLargo) {
        maxLargo = valor.length;
      }
    });

    // Añadir padding y limitar máximo
    return { wch: Math.min(maxLargo + 2, 50) };
  });
}

/**
 * Aplicar formato de negrita al encabezado
 */
function aplicarFormatoEncabezado(worksheet: XLSX.WorkSheet, columnas: string[]): void {
  columnas.forEach((col, idx) => {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: idx });
    if (!worksheet[cellAddress]) {
      worksheet[cellAddress] = {};
    }

    worksheet[cellAddress].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: 'FFD3D3D3' } }, // Gris claro
      alignment: { horizontal: 'center', vertical: 'center' },
    };
  });
}

/**
 * Exportar tabla de casos
 */
export function exportarCasosExcel(casos: any[], nombreArchivo: string = 'casos'): void {
  const datosFormateados = casos.map((caso) => ({
    'No. Caso': caso.numero_caso,
    Demandado: caso.demandado_principal || '-',
    Sucursal: caso.sucursal_id || '-',
    'Tipo Crédito': caso.tipo_credito_id || '-',
    'Capital MN': caso.capital_mn ? `$${caso.capital_mn.toLocaleString('es-MX')}` : '-',
    'Capital ME': caso.capital_me ? `$${caso.capital_me.toLocaleString('es-MX')}` : '-',
    Estado: caso.estado || '-',
    Asistente: caso.asistente_id || '-',
    'Fecha Creación': new Date(caso.fecha_creacion).toLocaleDateString('es-MX'),
  }));

  exportarExcel(datosFormateados, 'Casos', { nombreArchivo });
}

/**
 * Exportar tabla de juicios
 */
export function exportarJuiciosExcel(juicios: any[], nombreArchivo: string = 'juicios'): void {
  const datosFormateados = juicios.map((juicio) => ({
    'No. Expediente': juicio.numero_expediente,
    Juzgado: juicio.juzgado_id || '-',
    'Tipo Juicio': juicio.tipo_juicio_id || '-',
    'Caso ID': juicio.caso_id,
    Estado: juicio.estado || '-',
    'Etapa Actual': juicio.etapa_actual || '-',
    'Fecha Presentación': new Date(juicio.fecha_presentacion).toLocaleDateString('es-MX'),
    Asistente: juicio.asistente_id || '-',
  }));

  exportarExcel(datosFormateados, 'Juicios', { nombreArchivo });
}

/**
 * Exportar tabla de recuperación
 */
export function exportarRecuperacionExcel(
  casos: any[],
  nombreArchivo: string = 'recuperacion'
): void {
  const datosFormateados = casos.map((caso) => {
    const recuperado = caso.metadata?.recuperacion_total || 0;
    const capital = caso.capital_mn || 0;
    const porcentaje = capital > 0 ? ((recuperado / capital) * 100).toFixed(1) : '0.0';

    return {
      'No. Caso': caso.numero_caso,
      'Capital Total': `$${capital.toLocaleString('es-MX')}`,
      Recuperado: `$${recuperado.toLocaleString('es-MX')}`,
      '% Recuperación': `${porcentaje}%`,
      Pendiente: `$${(capital - recuperado).toLocaleString('es-MX')}`,
      'Fecha Creación': new Date(caso.fecha_creacion).toLocaleDateString('es-MX'),
    };
  });

  exportarExcel(datosFormateados, 'Recuperación', { nombreArchivo });
}

/**
 * Exportar consolidado de reportes
 */
export function exportarConsolidadoReportes(
  casos: any[],
  juicios: any[],
  nombreArchivo: string = 'consolidado'
): void {
  const hojas = [
    {
      nombre: 'Casos',
      datos: casos.map((c) => ({
        'No. Caso': c.numero_caso,
        Demandado: c.demandado_principal,
        Estado: c.estado,
        'Capital MN': c.capital_mn,
      })),
    },
    {
      nombre: 'Juicios',
      datos: juicios.map((j) => ({
        Expediente: j.numero_expediente,
        Estado: j.estado,
        Etapa: j.etapa_actual,
        'Fecha Presentación': j.fecha_presentacion,
      })),
    },
  ];

  exportarExcelMultipleHojas(hojas, nombreArchivo);
}
