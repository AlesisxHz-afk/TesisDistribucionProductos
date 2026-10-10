/**
 * reportes_simple.js - Agrícola Alaya S.A.C
 * Script interactivo ultra-ligero para reportes
 * (Búsqueda en tiempo real, filtros, ordenación, paginación de 10 registros y exportación a Excel / CSV)
 */

const PAGE_SIZE = 10;

function initReport() {
    const table = document.getElementById('reportTable');
    if (!table) return;

    const tbody = table.querySelector('tbody');
    const tableContainer = table.closest('.table-container') || table.parentElement;
    const searchInput = document.getElementById('reportSearch');
    const filterSelects = document.querySelectorAll('.filter-select');
    const countBadge = document.getElementById('recordCount');
    const headers = table.querySelectorAll('thead th[data-col]');

    let sortCol = null;
    let sortAsc = true;
    let currentPage = 1;
    let filteredRows = [];

    // Contenedor de paginación
    let paginationContainer = document.getElementById('reportPagination');
    if (!paginationContainer) {
        paginationContainer = document.createElement('div');
        paginationContainer.className = 'report-pagination';
        paginationContainer.id = 'reportPagination';
        tableContainer.appendChild(paginationContainer);
    }

    // Obtener todas las filas de datos
    function getAllDataRows() {
        if (!tbody) return [];
        return Array.from(tbody.querySelectorAll('tr:not(.empty-state):not(.empty-state-row)'));
    }

    // Renderizar controles y visualización de paginación
    function updatePaginationUI() {
        if (!tbody) return;

        const totalFiltered = filteredRows.length;
        const totalRows = getAllDataRows().length;
        const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));

        // Ajustar página actual a rango válido
        if (currentPage > totalPages) currentPage = totalPages;
        if (currentPage < 1) currentPage = 1;

        const startIdx = (currentPage - 1) * PAGE_SIZE;
        const endIdx = Math.min(startIdx + PAGE_SIZE, totalFiltered);

        // Control de estado vacío
        let emptyRow = tbody.querySelector('.empty-state-row');
        if (totalFiltered === 0 && totalRows > 0) {
            if (!emptyRow) {
                emptyRow = document.createElement('tr');
                emptyRow.className = 'empty-state-row';
                const colSpan = table.querySelectorAll('thead th').length || 6;
                emptyRow.innerHTML = `<td colspan="${colSpan}" class="empty-state"><i class="fas fa-search me-2"></i>No se encontraron registros que coincidan con la búsqueda.</td>`;
                tbody.appendChild(emptyRow);
            } else {
                emptyRow.style.display = '';
            }
        } else if (emptyRow) {
            emptyRow.style.display = 'none';
        }

        // Mostrar solo los elementos de la página actual
        const allRows = getAllDataRows();
        allRows.forEach(row => {
            if (row.dataset.filteredOut === 'true') {
                row.style.display = 'none';
            }
        });

        filteredRows.forEach((row, idx) => {
            if (idx >= startIdx && idx < endIdx) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });

        // Actualizar badge superior
        if (countBadge) {
            countBadge.textContent = `${totalFiltered} de ${totalRows} registros`;
        }

        // Si no hay paginación necesaria
        if (!paginationContainer) return;

        // Construir HTML de la barra de paginación
        let infoText = '0 registros';
        if (totalFiltered > 0) {
            infoText = `Mostrando ${startIdx + 1} - ${endIdx} de ${totalFiltered} registros (Página ${currentPage} de ${totalPages})`;
        }

        let buttonsHtml = '';

        // Botón Anterior
        buttonsHtml += `
            <button type="button" class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">
                <i class="fas fa-chevron-left"></i> Anterior
            </button>
        `;

        // Generar números de páginas
        if (totalPages <= 7) {
            for (let p = 1; p <= totalPages; p++) {
                buttonsHtml += `
                    <button type="button" class="pagination-btn ${p === currentPage ? 'active' : ''}" data-page="${p}">
                        ${p}
                    </button>
                `;
            }
        } else {
            // Página 1 siempre
            buttonsHtml += `
                <button type="button" class="pagination-btn ${currentPage === 1 ? 'active' : ''}" data-page="1">1</button>
            `;

            if (currentPage > 3) {
                buttonsHtml += `<span class="pagination-ellipsis">...</span>`;
            }

            const pStart = Math.max(2, currentPage - 1);
            const pEnd = Math.min(totalPages - 1, currentPage + 1);

            for (let p = pStart; p <= pEnd; p++) {
                buttonsHtml += `
                    <button type="button" class="pagination-btn ${p === currentPage ? 'active' : ''}" data-page="${p}">
                        ${p}
                    </button>
                `;
            }

            if (currentPage < totalPages - 2) {
                buttonsHtml += `<span class="pagination-ellipsis">...</span>`;
            }

            // Última página siempre
            buttonsHtml += `
                <button type="button" class="pagination-btn ${currentPage === totalPages ? 'active' : ''}" data-page="${totalPages}">${totalPages}</button>
            `;
        }

        // Botón Siguiente
        buttonsHtml += `
            <button type="button" class="pagination-btn" ${currentPage >= totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">
                Siguiente <i class="fas fa-chevron-right"></i>
            </button>
        `;

        paginationContainer.innerHTML = `
            <div class="pagination-info">${infoText}</div>
            <div class="pagination-controls">${buttonsHtml}</div>
        `;

        // Escuchar clics en los botones de paginación
        paginationContainer.querySelectorAll('.pagination-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const targetPage = parseInt(this.getAttribute('data-page'), 10);
                if (!isNaN(targetPage) && targetPage >= 1 && targetPage <= totalPages && targetPage !== currentPage) {
                    currentPage = targetPage;
                    updatePaginationUI();
                }
            });
        });
    }

    // Filtrar filas según texto y selectores
    function applyFilters() {
        if (!tbody) return;
        const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const allRows = getAllDataRows();

        // Recolectar valores de selectores
        const filters = [];
        filterSelects.forEach(sel => {
            const colIdx = parseInt(sel.getAttribute('data-col'), 10);
            const val = sel.value.toLowerCase().trim();
            if (val) {
                filters.push({ colIdx, val });
            }
        });

        filteredRows = [];

        allRows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length === 0) return;

            let matchesQuery = true;
            if (query) {
                matchesQuery = row.textContent.toLowerCase().includes(query);
            }

            let matchesSelects = true;
            for (const f of filters) {
                if (cells[f.colIdx]) {
                    const cellVal = cells[f.colIdx].textContent.toLowerCase().trim();
                    if (!cellVal.includes(f.val)) {
                        matchesSelects = false;
                        break;
                    }
                }
            }

            if (matchesQuery && matchesSelects) {
                row.dataset.filteredOut = 'false';
                filteredRows.push(row);
            } else {
                row.dataset.filteredOut = 'true';
                row.style.display = 'none';
            }
        });

        // Reiniciar a página 1 al filtrar
        currentPage = 1;
        updatePaginationUI();
    }

    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
    }

    filterSelects.forEach(sel => {
        sel.addEventListener('change', applyFilters);
    });

    // Ordenamiento por columnas
    headers.forEach(th => {
        th.style.cursor = 'pointer';
        th.addEventListener('click', function () {
            const colIdx = parseInt(th.getAttribute('data-col'), 10);
            if (isNaN(colIdx)) return;

            if (sortCol === colIdx) {
                sortAsc = !sortAsc;
            } else {
                sortCol = colIdx;
                sortAsc = true;
            }

            // Actualizar iconos de ordenamiento
            headers.forEach(h => {
                const icon = h.querySelector('i.sort-icon');
                if (icon) {
                    icon.className = 'fas fa-sort sort-icon text-muted ms-1';
                }
            });

            const currentIcon = th.querySelector('i.sort-icon');
            if (currentIcon) {
                currentIcon.className = `fas fa-sort-${sortAsc ? 'up' : 'down'} sort-icon text-primary ms-1`;
            }

            const rows = getAllDataRows();
            rows.sort((a, b) => {
                const cellA = a.children[colIdx] ? a.children[colIdx].innerText.trim() : '';
                const cellB = b.children[colIdx] ? b.children[colIdx].innerText.trim() : '';

                const numA = parseFloat(cellA.replace(/[^0-9.-]+/g, ''));
                const numB = parseFloat(cellB.replace(/[^0-9.-]+/g, ''));

                if (!isNaN(numA) && !isNaN(numB) && !cellA.includes('/') && !cellA.includes('-')) {
                    return sortAsc ? numA - numB : numB - numA;
                }

                return sortAsc ? cellA.localeCompare(cellB, 'es', { numeric: true }) : cellB.localeCompare(cellA, 'es', { numeric: true });
            });

            // Reinsertar ordenados en tbody
            rows.forEach(r => tbody.appendChild(r));

            // Actualizar lista filtrada manteniendo el nuevo orden
            filteredRows = rows.filter(r => r.dataset.filteredOut !== 'true');
            updatePaginationUI();
        });
    });

    // Inicializar lista de filas filtradas y paginación
    filteredRows = getAllDataRows();
    updatePaginationUI();
}

// Ejecutar inmediatamente o al cargar DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReport);
} else {
    initReport();
}

/**
 * Exportar a Excel (.xls nativo compatible con Microsoft Excel)
 * Exporta el conjunto filtrado completo (no solo la página actual)
 */
function exportReportExcel(filename) {
    const table = document.getElementById('reportTable');
    if (!table) return;

    // Clonar la tabla para exportar
    const clone = table.cloneNode(true);

    // Remover filas excluidas por los filtros o vacías
    clone.querySelectorAll('tbody tr').forEach(tr => {
        if (tr.classList.contains('empty-state-row') || tr.dataset.filteredOut === 'true') {
            tr.remove();
        } else {
            // Asegurar que estén visibles en el archivo Excel
            tr.style.display = '';
        }
    });

    // Limpiar iconos de ordenamiento y decoraciones
    clone.querySelectorAll('i, .sort-icon').forEach(el => el.remove());

    const tableHtml = clone.outerHTML;
    const excelTemplate = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" 
              xmlns:x="urn:schemas-microsoft-com:office:excel" 
              xmlns="http://www.w3.org/TR/REC-html40">
        <head>
            <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
            <!--[if gte mso 9]>
            <xml>
                <x:ExcelWorkbook>
                    <x:ExcelWorksheets>
                        <x:ExcelWorksheet>
                            <x:Name>${filename || 'Reporte'}</x:Name>
                            <x:WorksheetOptions>
                                <x:DisplayGridlines/>
                            </x:WorksheetOptions>
                        </x:ExcelWorksheet>
                    </x:ExcelWorksheets>
                </x:ExcelWorkbook>
            </xml>
            <![endif]-->
            <style>
                table { border-collapse: collapse; font-family: Arial, sans-serif; }
                th { background-color: #2e7d32; color: #ffffff; font-weight: bold; border: 1px solid #cccccc; padding: 10px; font-size: 13px; text-align: left; }
                td { border: 1px solid #e0e0e0; padding: 8px; font-size: 12px; }
            </style>
        </head>
        <body>
            ${tableHtml}
        </body>
        </html>
    `;

    const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', (filename || 'reporte') + '.xls');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Exportar a CSV (Separado por punto y coma, con BOM UTF-8 para Excel)
 * Exporta el conjunto filtrado completo (no solo la página actual)
 */
function exportReportCSV(filename) {
    const table = document.getElementById('reportTable');
    if (!table) return;

    const rows = table.querySelectorAll('tr');
    let csv = [];

    rows.forEach(row => {
        // Ignorar fila vacía o filtrada
        if (row.classList.contains('empty-state-row') || row.dataset.filteredOut === 'true') {
            return;
        }

        const cols = row.querySelectorAll('th, td');
        const rowData = [];
        cols.forEach(col => {
            const clone = col.cloneNode(true);
            clone.querySelectorAll('i, .sort-icon').forEach(el => el.remove());
            let text = clone.innerText.replace(/(\r\n|\n|\r)/gm, ' ').replace(/\s+/g, ' ').trim();
            text = text.replace(/"/g, '""');
            rowData.push(`"${text}"`);
        });

        if (rowData.length > 0) {
            csv.push(rowData.join(';'));
        }
    });

    const csvContent = '\uFEFF' + csv.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', (filename || 'reporte') + '.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
