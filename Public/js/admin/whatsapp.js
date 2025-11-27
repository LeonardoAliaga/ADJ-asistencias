// Public/js/admin/whatsapp.js (LIMPIO)
import * as dom from "./whatsapp/wa-dom.js";
import * as state from "./whatsapp/wa-state.js";
import {
  showUnsavedNotification,
  markUnsavedChanges,
  showMessage,
} from "./whatsapp/wa-helpers.js";
import {
  updateWhatsappStatus,
  stopStatusPolling,
} from "./whatsapp/wa-status.js";
import {
  loadWhatsappConfig,
  saveWhatsappConfig,
} from "./whatsapp/wa-config.js";
import { initTeacherRuleListeners } from "./whatsapp/wa-rules-teacher.js";
import { initReportRuleListeners } from "./whatsapp/wa-rules-report.js";

export function initWhatsappAdmin() {
  state.setUnsavedChanges(false);
  showUnsavedNotification(false);
  stopStatusPolling();

  updateWhatsappStatus();
  loadWhatsappConfig();

  // Listeners
  if (dom.refreshStatusBtn) {
    dom.refreshStatusBtn.addEventListener("click", updateWhatsappStatus);
  }
  if (dom.forceRestartBtn) {
    dom.forceRestartBtn.onclick = async () => {
      if (!confirm("Se cerrará la sesión actual de WhatsApp. ¿Continuar?"))
        return;
      showMessage(dom.msgForceRestart, "Reiniciando...", false);
      try {
        await fetch("/whatsapp/api/restart", { method: "POST" });
        await updateWhatsappStatus();
      } catch (e) {
        showMessage(dom.msgForceRestart, "Error al reiniciar", true);
      }
    };
  }

  initTeacherRuleListeners();
  initReportRuleListeners();

  if (dom.enabledGeneralToggle) {
    dom.enabledGeneralToggle.addEventListener("change", markUnsavedChanges);
  }
  if (dom.teacherNotificationsToggle) {
    dom.teacherNotificationsToggle.addEventListener(
      "change",
      markUnsavedChanges
    );
  }

  if (dom.saveConfigBtn) {
    dom.saveConfigBtn.addEventListener("click", saveWhatsappConfig);
  }
  if (dom.jumpToSaveBtn && dom.saveSection) {
    dom.jumpToSaveBtn.addEventListener("click", () => {
      dom.saveSection.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }
}
