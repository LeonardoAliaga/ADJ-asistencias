// Public/js/admin/users.js
let allUserOptions = [];

function getFullNameClient(u) {
  return `${u.apellido || ""} ${u.nombre || ""}`.trim();
}

function crearListaUsuarios(usuarios) {
  if (!usuarios || usuarios.length === 0)
    return "<p style='padding:20px; text-align:center'>No hay docentes.</p>";

  return usuarios
    .map(
      (u) => `
    <li>
      <div style="display:flex; flex-direction:column;">
        <span class="user-name"><strong>${
          u.codigo
        }</strong> - ${getFullNameClient(u)}</span>
        <small style="color:#666">${(u.dias_asistencia || []).join(
          ", "
        )}</small>
      </div>
      <div class="user-actions">
        <span class="btn-edit-usuario" title="Editar" data-codigo="${u.codigo}">
          <i class="bi bi-pencil-square"></i>
        </span>
        <span class="btn-eliminar" title="Eliminar" data-codigo="${
          u.codigo
        }" data-nombre="${u.nombre}">
          <i class="bi bi-trash-fill"></i>
        </span>
      </div>
    </li>
  `
    )
    .join("");
}

function bindUserEvents() {
  document.querySelectorAll(".btn-eliminar").forEach((btn) => {
    btn.onclick = async () => {
      const codigo = btn.dataset.codigo;
      if (confirm("¿Eliminar docente?")) {
        await fetch(`/api/usuarios/${codigo}`, { method: "DELETE" });
        cargarUsuarios();
      }
    };
  });

  document.querySelectorAll(".btn-edit-usuario").forEach((btn) => {
    btn.onclick = () => {
      const codigo = btn.dataset.codigo;
      const user = allUserOptions.find((u) => u.codigo === codigo);
      if (user) abrirModalEditar(user);
    };
  });
}

function abrirModalEditar(user) {
  const modal = document.getElementById("edit-user-modal");
  document.getElementById("edit-original-codigo").value = user.codigo;
  document.getElementById("edit-codigo").value = user.codigo;
  document.getElementById("edit-nombre").value = user.nombre;
  document.getElementById("edit-apellido").value = user.apellido;

  const dias = user.dias_asistencia || [];
  document
    .querySelectorAll("#edit-dias-asistencia-selector .day-btn")
    .forEach((b) => {
      if (dias.includes(b.dataset.day)) b.classList.add("active");
      else b.classList.remove("active");
    });

  modal.style.display = "block";
}

export async function cargarUsuarios() {
  try {
    const res = await fetch("/api/usuarios");
    const data = await res.json();
    const docentes = data
      .filter((u) => u.rol === "docente")
      .sort((a, b) => a.apellido.localeCompare(b.apellido));
    allUserOptions = docentes;

    const div = document.getElementById("vista-usuarios-list");
    if (div) {
      div.innerHTML = `<ul>${crearListaUsuarios(docentes)}</ul>`;
      bindUserEvents();
    }
  } catch (e) {
    console.error(e);
  }
}

export function initUserFormEvents() {
  document.querySelectorAll(".day-btn").forEach((b) => {
    b.onclick = function (e) {
      e.preventDefault(); // Evitar submit
      this.classList.toggle("active");
    };
  });

  const modal = document.getElementById("edit-user-modal");
  const close = document.getElementById("close-edit-modal");
  if (close) close.onclick = () => (modal.style.display = "none");
  window.onclick = (e) => {
    if (e.target == modal) modal.style.display = "none";
  };
}
