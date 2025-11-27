// Public/js/asistencias.js
document.addEventListener("DOMContentLoaded", () => {
  const codigoInput = document.getElementById("codigo");
  const registrarBtn = document.getElementById("registrar-btn");
  const resultadoDiv = document.getElementById("resultado");

  // Enfocar automáticamente al cargar
  if (codigoInput) codigoInput.focus();

  const registrarAsistencia = async () => {
    const codigo = codigoInput.value.trim().toUpperCase();

    // Feedback visual inmediato
    resultadoDiv.style.color = "#333";
    resultadoDiv.innerHTML =
      '<i class="bi bi-hourglass-split"></i> Procesando...';

    if (!codigo) {
      resultadoDiv.style.color = "var(--red)";
      resultadoDiv.innerHTML = "❌ Ingrese un código";
      codigoInput.focus();
      return;
    }

    try {
      const res = await fetch("/api/registrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo }),
      });

      const data = await res.json();

      if (data.exito) {
        let estadoTexto = "";
        // Mostrar estado también para docentes si el backend lo calcula
        if (data.estado === "puntual") estadoTexto = "🟢 Puntual";
        else if (data.estado === "tolerancia") estadoTexto = "🟠 Tolerancia";
        else if (data.estado === "tarde") estadoTexto = "🔴 Tarde";
        else if (data.estado === "justificada") estadoTexto = "🟠 Justificada";

        resultadoDiv.style.color = "#28a745"; // Verde éxito
        resultadoDiv.innerHTML = `
          <div>✅ <b>${data.nombre}</b></div>
          <div style="font-size: 0.9em; color: #555;">${data.hora} ${
          estadoTexto ? "| " + estadoTexto : ""
        }</div>
        `;
      } else {
        resultadoDiv.style.color = "var(--red)";
        resultadoDiv.innerHTML = `❌ ${data.mensaje}`;
      }
    } catch (error) {
      console.error("Error:", error);
      resultadoDiv.style.color = "var(--red)";
      resultadoDiv.innerHTML = `❌ Error de conexión`;
    } finally {
      codigoInput.value = "";
      codigoInput.focus();

      // Limpiar mensaje después de unos segundos
      setTimeout(() => {
        if (
          resultadoDiv.innerHTML.includes("✅") ||
          resultadoDiv.innerHTML.includes("❌")
        ) {
          resultadoDiv.innerHTML = "";
        }
      }, 5000);
    }
  };

  if (registrarBtn) {
    registrarBtn.addEventListener("click", registrarAsistencia);
  }

  if (codigoInput) {
    codigoInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        registrarAsistencia();
      }
    });
  }
});
