// Public/js/admin/whatsapp/wa-dom.js (LIMPIO)
export const statusIndicator = document.getElementById(
  "whatsapp-status-indicator"
);
export const statusMessage = document.getElementById("whatsapp-status-message");
export const refreshStatusBtn = document.getElementById(
  "btn-refresh-whatsapp-status"
);

export const enabledGeneralToggle = document.getElementById(
  "whatsapp-enabled-general"
);
export const enabledGeneralLabel = document.getElementById(
  "whatsapp-enabled-general-label"
);
export const teacherNotificationsToggle = document.getElementById(
  "teacher-notifications-toggle"
);
export const teacherNotificationsLabel = document.getElementById(
  "teacher-notifications-label"
);
export const reportEnabledToggle = document.getElementById(
  "report-enabled-toggle"
);

// Configurar Docentes
export const teacherTargetTypeSelect = document.getElementById(
  "teacher-target-type"
);
export const teacherGroupField = document.getElementById("teacher-group-field");
export const teacherGroupFiltro = document.getElementById(
  "teacher-group-filtro"
);
export const teacherGroupHidden = document.getElementById(
  "teacher-group-hidden"
);
export const teacherGroupResultados = document.getElementById(
  "teacher-group-resultados"
);
export const teacherNumberField = document.getElementById(
  "teacher-number-field"
);
export const teacherNumberInputEl = document.getElementById(
  "teacher-number-input"
);

// Reportes
export const reportRulesListDiv = document.getElementById("report-rules-list");
export const reportRuleGroupFiltro = document.getElementById(
  "report-rule-group-filtro"
);
export const reportRuleGroupHidden = document.getElementById(
  "report-rule-group-hidden"
);
export const reportRuleGroupResultados = document.getElementById(
  "report-rule-resultados"
);
export const btnAddReportRule = document.getElementById("btn-add-report-rule");
export const msgAddReportRule = document.getElementById("msg-add-report-rule");

// General
export const saveConfigBtn = document.getElementById(
  "btn-save-whatsapp-config"
);
export const msgWhatsappConfig = document.getElementById("msg-whatsapp-config");
export const unsavedAlert = document.getElementById("unsaved-changes-alert");
export const jumpToSaveBtn = document.getElementById("btn-jump-to-save");
export const saveSection = document.getElementById("whatsapp-save-section");
export const configContent = document.getElementById("whatsapp-config-content");
export const qrContainer = document.getElementById("whatsapp-qr-container");
export const qrCanvas = document.getElementById("whatsapp-qr-canvas");
export const qrMessage = document.getElementById("whatsapp-qr-message");
export const forceRestartBtn = document.getElementById(
  "btn-force-whatsapp-restart"
);
export const msgForceRestart = document.getElementById("msg-force-restart");
// Dummies (para evitar errores si algún script antiguo los llama)
export const studentNotificationsToggle = document.getElementById(
  "student-notifications-toggle"
);
