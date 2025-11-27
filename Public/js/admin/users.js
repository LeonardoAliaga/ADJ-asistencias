// Public/js/admin/users.js (LIMPIO)
let allUserOptions = [];
let currentAutocompleteFocus = -1;

function getFullNameClient(u = {}) {
  const ap = u.apellido ? String(u.apellido).trim() : "";
  const nom = u.nombre ? String(u.nombre).trim() : "";
  return `${ap} ${nom}`.trim() || nom;
}

function crearListaUsuarios(usuarios) {
  if (usuarios.length === 0) return "<p>No hay docentes registrados.</p>";
  return usuarios
    .map((u) => {
      const dias = u.dias_asistencia ? u.dias_asistencia.join(", ") : "";
      return `
        <li style="position:relative;padding-right:110px;">
          <div style="display:flex;flex-direction:column;">
            <span><strong>${u.codigo}</strong> - ${getFullNameClient(u)}</span>
            <small style="color:#666">${dias}</small>
          </div>
          <div style="position:absolute;right:5px;top:8px;display:flex;gap:8px;">
            <span class="btn-edit-usuario" style="cursor:pointer;color:#007bff;" title="Editar">
              <i class="bi bi-pencil-fill"></i>
            </span>
            <span class="btn-eliminar" style="cursor:pointer;color:red;" title="Eliminar">
              <i class="bi bi-x-circle-fill"></i>
            </span>
          </div>
        </li>`;
    })
    .join("");
}

function agregarEventosLista() {
  // Eventos Eliminar
  document.querySelectorAll(".btn-eliminar").forEach((btn) => {
    btn.onclick = async function (e) {
      e.stopPropagation();
      const li = btn.closest("li");
      const codigo = li.querySelector("strong").textContent.trim();
      if (confirm(`¿Eliminar docente ${codigo}?`)) {
        await fetch(`/api/usuarios/${codigo}`, { method: "DELETE" });
        cargarUsuarios(true);
      }
    };
  });

  // Eventos Editar
  document.querySelectorAll(".btn-edit-usuario").forEach((btn) => {
    btn.onclick = function (e) {
      e.stopPropagation();
      const li = btn.closest("li");
      const codigo = li.querySelector("strong").textContent.trim();
      abrirModalEditar(codigo);
    };
  });
}

function abrirModalEditar(codigo) {
  const modal = document.getElementById("edit-user-modal");
  const user = allUserOptions.find((u) => u.codigo === codigo);
  if (!modal || !user) return;

  document.getElementById("edit-original-codigo").value = user.codigo;
  document.getElementById("edit-codigo").value = user.codigo;
  document.getElementById("edit-nombre").value = user.nombre;
  document.getElementById("edit-apellido").value = user.apellido;

  // Días
  document
    .querySelectorAll("#edit-dias-asistencia-selector .day-btn")
    .forEach((btn) => {
      if (
        user.dias_asistencia &&
        user.dias_asistencia.includes(btn.getAttribute("data-day"))
      ) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

  document.getElementById("msg-editar-usuario").style.display = "none";
  modal.style.display = "block";
}

// Autocompletado para Justificar
function initAutocomplete() {
  const input = document.getElementById("justificar-usuario-filtro");
  const hidden = document.getElementById("justificar-alumno-hidden");
  const results = document.getElementById("justificar-resultados");

  if (!input) return;

  input.addEventListener("input", function () {
    const val = this.value.toLowerCase();
    results.innerHTML = "";
    if (!val) {
      hidden.value = "";
      return;
    }

    allUserOptions.forEach((u) => {
      const name = getFullNameClient(u);
      if (
        name.toLowerCase().includes(val) ||
        u.codigo.toLowerCase().includes(val)
      ) {
        const div = document.createElement("div");
        div.className = "autocomplete-item";
        div.textContent = `${name} (${u.codigo})`;
        div.onclick = () => {
          input.value = name;
          hidden.value = u.codigo;
          results.innerHTML = "";
        };
        results.appendChild(div);
      }
    });
  });

  document.addEventListener("click", (e) => {
    if (e.target !== input) results.innerHTML = "";
  });
}

export async function cargarUsuarios(forceReload = false) {
  const res = await fetch("/api/usuarios");
  const usuarios = await res.json();
  // Filtrar solo docentes (aunque el backend debería enviar todos, nos aseguramos)
  const docentes = usuarios
    .filter((u) => u.rol === "docente")
    .sort((a, b) => a.apellido.localeCompare(b.apellido));
  allUserOptions = docentes;

  const container = document.getElementById("vista-usuarios-list");
  if (container) {
    container.innerHTML = `
      <div style="background:#fff; padding:15px; border-radius:8px;">
        <ul style="list-style:none; padding:0;">${crearListaUsuarios(
          docentes
        )}</ul>
      </div>
    `;
    agregarEventosLista();
  }
}

export function initUserFormEvents() {
  // Botones de día (Agregar)
  document
    .querySelectorAll("#dias-asistencia-selector .day-btn")
    .forEach((btn) => {
      btn.onclick = () => btn.classList.toggle("active");
    });
  // Botones de día (Editar)
  document
    .querySelectorAll("#edit-dias-asistencia-selector .day-btn")
    .forEach((btn) => {
      btn.onclick = () => btn.classList.toggle("active");
    });

  // Inputs mayúsculas
  const toUpper = (e) => (e.target.value = e.target.value.toUpperCase());
  ["nombre", "apellido", "edit-nombre", "edit-apellido"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.oninput = toUpper;
  });

  // Cerrar modal editar
  const closeEdit = document.getElementById("close-edit-modal");
  if (closeEdit)
    closeEdit.onclick = () =>
      (document.getElementById("edit-user-modal").style.display = "none");

  initAutocomplete();
}
