// Public/js/admin/whatsapp/wa-config.js (LIMPIO)
import * as dom from "./wa-dom.js";
import * as state from "./wa-state.js";
import {
  showMessage,
  markUnsavedChanges,
  showUnsavedNotification,
} from "./wa-helpers.js";
import { updateTeacherTargetUI } from "./wa-rules-teacher.js";
import { renderReportRules } from "./wa-rules-report.js";

export async function loadGroups() {
  try {
    const response = await fetch("/whatsapp/api/groups");
    const data = await response.json();
    if (data.exito && Array.isArray(data.groups)) {
      state.setGroups(data.groups.sort((a, b) => a.name.localeCompare(b.name)));
      await loadWhatsappConfig(); // Cargar config tras tener grupos
    }
  } catch (error) {
    console.error("Error cargando grupos:", error);
  }
}

export async function loadWhatsappConfig() {
  try {
    const response = await fetch("/whatsapp/api/config");
    const data = await response.json();
    if (data.exito) {
      state.setConfig(data.config);
      const conf = state.currentWhatsappConfig;

      // UI General
      if (dom.enabledGeneralToggle)
        dom.enabledGeneralToggle.checked = conf.enabledGeneral;
      if (dom.teacherNotificationsToggle)
        dom.teacherNotificationsToggle.checked =
          conf.teacherNotificationsEnabled;

      // UI Docente
      if (dom.teacherTargetTypeSelect)
        dom.teacherTargetTypeSelect.value = conf.teacherTargetType || "number";

      if (conf.teacherTargetType === "group") {
        if (dom.teacherGroupHidden)
          dom.teacherGroupHidden.value = conf.teacherTargetId;
        const g = state.availableGroups.find(
          (x) => x.id === conf.teacherTargetId
        );
        if (dom.teacherGroupFiltro)
          dom.teacherGroupFiltro.value = g ? g.name : "";
      } else {
        if (dom.teacherNumberInputEl)
          dom.teacherNumberInputEl.value = (conf.teacherTargetId || "").replace(
            "@c.us",
            ""
          );
      }
      updateTeacherTargetUI();

      // UI Reportes
      renderReportRules();
    }
  } catch (e) {
    console.error(e);
  }
}

export async function saveWhatsappConfig() {
  if (dom.saveConfigBtn) dom.saveConfigBtn.disabled = true;
  showMessage(dom.msgWhatsappConfig, "Guardando...", false);

  const teacherType = dom.teacherTargetTypeSelect.value;
  let teacherId = null;

  if (teacherType === "number") {
    const num = dom.teacherNumberInputEl.value.replace(/\D/g, "");
    if (num.length >= 9) teacherId = `${num}@c.us`;
  } else {
    teacherId = dom.teacherGroupHidden.value;
  }

  const configToSave = {
    enabledGeneral: dom.enabledGeneralToggle.checked,
    studentNotificationsEnabled: false, // Forzado false
    teacherNotificationsEnabled: dom.teacherNotificationsToggle.checked,
    automatedReportEnabled: true, // Siempre activo para permitir manual
    studentRules: [],
    teacherTargetType: teacherType,
    teacherTargetId: teacherId,
    automatedReport: {
      targets: state.currentWhatsappConfig.automatedReport?.targets || [],
    },
  };

  try {
    const res = await fetch("/whatsapp/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(configToSave),
    });
    const d = await res.json();
    if (d.exito) {
      showMessage(dom.msgWhatsappConfig, "Guardado.");
      state.setConfig(configToSave);
      showUnsavedNotification(false);
    }
  } catch (e) {
    showMessage(dom.msgWhatsappConfig, "Error al guardar", true);
  } finally {
    if (dom.saveConfigBtn) dom.saveConfigBtn.disabled = false;
  }
}
