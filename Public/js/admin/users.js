// Public/js/admin/users.js
let allUserOptions = [];
let currentAutocompleteFocus = -1;

function getFullNameClient(u = {}) {
  const ap = u.apellido ? String(u.apellido).trim() : "";
  const nom = u.nombre ? String(u.nombre).trim() : "";
  return `${ap} ${nom}`.trim() || nom;
}

function crearListaUsuarios(usuarios) {
  if (usuarios.length === 0)
    return "<p style='padding:20px; text-align:center'>No hay docentes registrados.</p>";

  return usuarios
    .map((u) => {
      const dias = u.dias_asistencia ? u.dias_asistencia.join(", ") : "";
      // Estructura LI preparada para el CSS Hover
      return `
      <li>
        <div style="display:flex; flex-direction:column;">
          <span><strong>${u.codigo}</strong> - ${getFullNameClient(u)}</span>
          <small style="color:#666">${dias}</small>
        </div>
        <div class="user-actions">
          <span class="btn-edit-usuario" title="Editar" data-codigo="${
            u.codigo
          }">
            <i class="bi bi-pencil-square"></i>
          </span>
          <span class="btn-eliminar" title="Eliminar" data-codigo="${u.codigo}">
            <i class="bi bi-trash-fill"></i>
          </span>
        </div>
      </li>
    `;
    })
    .join("");
}

function agregarEventosLista() {
  // Eventos Eliminar
  document.querySelectorAll(".btn-eliminar").forEach((btn) => {
    btn.onclick = async function (e) {
      e.stopPropagation();
      const codigo = btn.getAttribute("data-codigo");
      const li = btn.closest("li");
      const nombre = li.querySelector("span").textContent;

      if (confirm(`¿Seguro que deseas eliminar a:\n${nombre}?`)) {
        try {
          const res = await fetch(`/api/usuarios/${codigo}`, {
            method: "DELETE",
          });
          if (res.ok) {
            cargarUsuarios(true);
          } else {
            alert("Error al eliminar usuario");
          }
        } catch (e) {
          console.error(e);
        }
      }
    };
  });

  // Eventos Editar
  document.querySelectorAll(".btn-edit-usuario").forEach((btn) => {
    btn.onclick = function (e) {
      e.stopPropagation();
      const codigo = btn.getAttribute("data-codigo");
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

  // Marcar días
  const diasUser = user.dias_asistencia || [];
  document
    .querySelectorAll("#edit-dias-asistencia-selector .day-btn")
    .forEach((btn) => {
      const day = btn.getAttribute("data-day");
      if (diasUser.includes(day)) btn.classList.add("active");
      else btn.classList.remove("active");
    });

  document.getElementById("msg-editar-usuario").style.display = "none";
  modal.style.display = "block";
}

// --- AUTOCOMPLETADO RESTAURADO ---
function closeAllAutocompleteLists() {
  const items = document.getElementById("justificar-resultados");
  if (items) items.innerHTML = "";
  currentAutocompleteFocus = -1;
}

function addAutocompleteActive(items) {
  if (!items) return false;
  removeAutocompleteActive(items);
  if (currentAutocompleteFocus >= items.length) currentAutocompleteFocus = 0;
  if (currentAutocompleteFocus < 0) currentAutocompleteFocus = items.length - 1;
  items[currentAutocompleteFocus].classList.add("autocomplete-active");
  items[currentAutocompleteFocus].scrollIntoView({ block: "nearest" });
}

function removeAutocompleteActive(items) {
  for (let i = 0; i < items.length; i++) {
    items[i].classList.remove("autocomplete-active");
  }
}

function initAutocomplete() {
  const input = document.getElementById("justificar-usuario-filtro");
  const hiddenInput = document.getElementById("justificar-alumno-hidden");
  const resultsContainer = document.getElementById("justificar-resultados");

  if (!input || !hiddenInput || !resultsContainer) return;

  input.addEventListener("input", function (e) {
    const val = this.value;
    closeAllAutocompleteLists();
    if (!val || val.length < 1) {
      hiddenInput.value = "";
      return false;
    }

    const valNorm = val
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    allUserOptions.forEach((user) => {
      const fullName = getFullNameClient(user);
      const searchStr = `${fullName} ${user.codigo}`
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      if (searchStr.includes(valNorm)) {
        const itemDiv = document.createElement("div");
        itemDiv.classList.add("autocomplete-item");
        itemDiv.textContent = `${fullName} (${user.codigo})`;

        itemDiv.addEventListener("click", function () {
          input.value = fullName;
          hiddenInput.value = user.codigo;
          closeAllAutocompleteLists();
        });
        resultsContainer.appendChild(itemDiv);
      }
    });
  });

  input.addEventListener("keydown", function (e) {
    let items = resultsContainer.getElementsByClassName("autocomplete-item");
    if (e.keyCode == 40) {
      // Down
      currentAutocompleteFocus++;
      addAutocompleteActive(items);
    } else if (e.keyCode == 38) {
      // Up
      currentAutocompleteFocus--;
      addAutocompleteActive(items);
    } else if (e.keyCode == 13) {
      // Enter
      e.preventDefault();
      if (currentAutocompleteFocus > -1 && items[currentAutocompleteFocus]) {
        items[currentAutocompleteFocus].click();
      }
    }
  });

  document.addEventListener("click", function (e) {
    if (e.target !== input) {
      closeAllAutocompleteLists();
    }
  });
}
// --- FIN AUTOCOMPLETADO ---

export async function cargarUsuarios(forceReload = false) {
  try {
    const res = await fetch("/api/usuarios");
    const data = await res.json();
    // Filtrar docentes y ordenar
    const docentes = data
      .filter((u) => u.rol === "docente")
      .sort((a, b) => (a.apellido || "").localeCompare(b.apellido || ""));
    allUserOptions = docentes;

    const container = document.getElementById("vista-usuarios-list");
    if (container) {
      container.innerHTML = `
        <div style="background:#fff; padding:15px; border-radius:8px; border:1px solid #ddd;">
          <ul style="list-style:none; padding:0;">${crearListaUsuarios(
            docentes
          )}</ul>
        </div>
      `;
      agregarEventosLista();
    }
  } catch (e) {
    console.error(e);
  }
}

export function initUserFormEvents() {
  // Botones día (Agregar)
  document
    .querySelectorAll("#dias-asistencia-selector .day-btn")
    .forEach((btn) => {
      btn.onclick = () => btn.classList.toggle("active");
    });
  // Botones día (Editar)
  document
    .querySelectorAll("#edit-dias-asistencia-selector .day-btn")
    .forEach((btn) => {
      btn.onclick = () => btn.classList.toggle("active");
    });

  // Mayúsculas
  const toUpper = (e) => (e.target.value = e.target.value.toUpperCase());
  ["nombre", "apellido", "edit-nombre", "edit-apellido"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.oninput = toUpper;
  });

  // Cerrar modal
  const closeEdit = document.getElementById("close-edit-modal");
  if (closeEdit)
    closeEdit.onclick = () =>
      (document.getElementById("edit-user-modal").style.display = "none");
  window.addEventListener("click", (e) => {
    const modal = document.getElementById("edit-user-modal");
    if (e.target == modal) modal.style.display = "none";
  });

  // Iniciar la búsqueda en vivo
  initAutocomplete();
}
