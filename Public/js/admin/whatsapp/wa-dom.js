// Public/js/admin/whatsapp/wa-dom.js

// Estado
export const statusIndicator = document.getElementById(
  "whatsapp-status-indicator"
);
export const statusMessage = document.getElementById("whatsapp-status-message");
export const refreshStatusBtn = document.getElementById(
  "btn-refresh-whatsapp-status"
);

// Toggles
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

// Configuración Docentes (Inputs)
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

// Configuración Reportes (Inputs)
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

// General / Botones
export const saveConfigBtn = document.getElementById(
  "btn-save-whatsapp-config"
);
export const msgWhatsappConfig = document.getElementById("msg-whatsapp-config");
export const unsavedAlert = document.getElementById("unsaved-changes-alert");
export const jumpToSaveBtn = document.getElementById("btn-jump-to-save");
export const saveSection = document.getElementById("whatsapp-save-section");

// Contenedores QR y Config
export const configContent = document.getElementById("whatsapp-config-content");
export const qrContainer = document.getElementById("whatsapp-qr-container");
export const qrCanvas = document.getElementById("whatsapp-qr-canvas");
export const qrMessage = document.getElementById("whatsapp-qr-message");
export const forceRestartBtn = document.getElementById(
  "btn-force-whatsapp-restart"
);
export const msgForceRestart = document.getElementById("msg-force-restart");
