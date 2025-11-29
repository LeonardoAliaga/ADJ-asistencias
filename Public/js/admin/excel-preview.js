// Public/js/admin/excel-preview.js

function csvToHtmlTable(csvText) {
  const rows = csvText.trim().split("\n");
  if (rows.length === 0) return "<p><i>(Hoja vacía)</i></p>";

  let html = "<table><tbody>";

  rows.forEach((line) => {
    if (!line.trim()) return;

    const cells = line.split(",");

    // Título
    if (cells[0].includes("REGISTRO DE ASISTENCIA")) {
      html += `<tr class="table-title"><td colspan="3" class="table-title-cell">${cells[0].replace(
        /"/g,
        ""
      )}</td></tr>`;
      return;
    }

    // Datos: N, Nombre, Hora, ClaseCSS
    const cssClass = cells[3] || "";
    const displayCells = cells.slice(0, 3); // Solo mostramos 3

    if (cells[0].includes("N°")) {
      // Header Row
      html += '<tr class="table-header">';
      displayCells.forEach((c) => (html += `<th>${c.replace(/"/g, "")}</th>`));
      html += "</tr>";
    } else {
      // Data Row
      html += '<tr class="table-data">';
      displayCells.forEach((c, i) => {
        // Columna 3 (índice 2) lleva el color
        if (i === 2 && cssClass) {
          html += `<td class="status-${cssClass}">${c.replace(/"/g, "")}</td>`;
        } else {
          html += `<td>${c.replace(/"/g, "")}</td>`;
        }
      });
      html += "</tr>";
    }
  });

  html += "</tbody></table>";
  return html;
}

// ... (Resto del archivo igual: mostrarPreview, cargarArchivosExcel...) ...
async function mostrarPreview(archivo) {
  const modal = document.getElementById("preview-modal");
  const content = document.getElementById("preview-content");
  const title = document.getElementById("preview-filename");
  const tabs = document.getElementById("preview-tabs");

  if (!modal) return;
  title.textContent = archivo;
  content.innerHTML = "Cargando...";
  tabs.innerHTML = "";
  modal.style.display = "block";

  try {
    const res = await fetch(`/api/excel/preview/${archivo}`);
    const data = await res.json();
    content.innerHTML = "";

    if (data.exito && data.sheets) {
      data.sheets.forEach((sheet, idx) => {
        const btn = document.createElement("button");
        btn.textContent = sheet.name;
        btn.className = `preview-tab ${idx === 0 ? "active" : ""}`;
        tabs.appendChild(btn);

        const div = document.createElement("div");
        div.className = `preview-tab-content ${idx === 0 ? "active" : ""}`;
        div.innerHTML = csvToHtmlTable(sheet.content);
        content.appendChild(div);

        btn.onclick = () => {
          tabs
            .querySelectorAll(".preview-tab")
            .forEach((t) => t.classList.remove("active"));
          content
            .querySelectorAll(".preview-tab-content")
            .forEach((d) => d.classList.remove("active"));
          btn.classList.add("active");
          div.classList.add("active");
        };
      });
    }
  } catch (e) {
    content.innerHTML = "Error cargando vista previa.";
  }
}

export async function cargarArchivosExcel() {
  const div = document.getElementById("archivos-excel");
  if (!div) return;
  div.innerHTML = "<i>Cargando...</i>";
  try {
    const res = await fetch("/api/excel");
    const files = await res.json();
    div.innerHTML =
      files
        .map(
          (f) => `
      <div class="excel-item">
        <a href="/api/excel/${f}" download><i class="bi bi-file-earmark-excel-fill"></i> ${f}</a>
        <button class="btn-preview" data-filename="${f}"><i class="bi bi-eye-fill"></i></button>
      </div>
    `
        )
        .join("") || "<p>No hay reportes.</p>";

    div.querySelectorAll(".btn-preview").forEach((b) => {
      b.onclick = () => mostrarPreview(b.dataset.filename);
    });
  } catch (e) {
    div.innerHTML = "Error.";
  }
}

export function initModalEvents() {
  const modal = document.getElementById("preview-modal");
  const close = document.getElementById("close-preview");
  if (close) close.onclick = () => (modal.style.display = "none");
  if (modal)
    window.onclick = (e) => {
      if (e.target == modal) modal.style.display = "none";
    };
}
