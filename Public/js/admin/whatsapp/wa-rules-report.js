// Public/js/admin/whatsapp/wa-rules-report.js
import * as dom from "./wa-dom.js";
import * as state from "./wa-state.js";
import { showMessage, markUnsavedChanges } from "./wa-helpers.js";

let currentAutocompleteFocus = -1;

function closeAllAutocompleteLists() {
  if (dom.reportRuleGroupResultados)
    dom.reportRuleGroupResultados.innerHTML = "";
  currentAutocompleteFocus = -1;
}

function initReportAutocomplete() {
  const input = dom.reportRuleGroupFiltro;
  const hiddenInput = dom.reportRuleGroupHidden;
  const resultsContainer = dom.reportRuleGroupResultados;

  if (!input || !hiddenInput || !resultsContainer) return;

  input.addEventListener("input", function (e) {
    const val = this.value;
    closeAllAutocompleteLists();
    if (!val || val.length < 2) {
      hiddenInput.value = "";
      return;
    }

    state.availableGroups.forEach((group) => {
      if (group.name.toLowerCase().includes(val.toLowerCase())) {
        const itemDiv = document.createElement("div");
        itemDiv.classList.add("autocomplete-item");
        itemDiv.textContent = group.name;
        itemDiv.addEventListener("click", function () {
          input.value = group.name;
          hiddenInput.value = group.id;
          closeAllAutocompleteLists();
          markUnsavedChanges();
        });
        resultsContainer.appendChild(itemDiv);
      }
    });
  });

  document.addEventListener("click", (e) => {
    if (e.target !== input) closeAllAutocompleteLists();
  });
}

async function handleManualSend(event) {
  const btn = event.currentTarget;
  const groupId = btn.getAttribute("data-group-id");

  if (!confirm("¿Enviar reporte manual ahora?")) return;

  btn.disabled = true;
  showMessage(dom.msgAddReportRule, "Enviando...", false);

  try {
    const res = await fetch("/whatsapp/api/send-report-manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ciclo: "DOCENTES", turno: "docentes", groupId }),
    });
    const d = await res.json();
    showMessage(dom.msgAddReportRule, d.mensaje, !d.exito);
  } catch (e) {
    showMessage(dom.msgAddReportRule, e.message, true);
  } finally {
    btn.disabled = false;
  }
}

export function renderReportRules() {
  if (!dom.reportRulesListDiv) return;
  dom.reportRulesListDiv.innerHTML = "";
  const rules = state.currentWhatsappConfig.automatedReport?.targets || [];

  if (rules.length === 0) {
    dom.reportRulesListDiv.innerHTML = "<p>No hay destinos configurados.</p>";
    return;
  }

  const ul = document.createElement("ul");
  ul.className = "rules-ul";
  rules.forEach((rule, index) => {
    const group = state.availableGroups.find((g) => g.id === rule.groupId);
    const name = group ? group.name : rule.groupId;

    const li = document.createElement("li");
    li.innerHTML = `
      <span><b>Reporte Docentes</b> &rarr; ${name}</span>
      <div class="rule-actions">
        <button class="btn-rule-action btn-send-manual" data-group-id="${rule.groupId}" title="Enviar Ahora"><i class="bi bi-send-fill"></i></button>
        <button class="btn-rule-action btn-delete-rule" data-index="${index}" title="Eliminar"><i class="bi bi-trash-fill"></i></button>
      </div>
    `;
    ul.appendChild(li);
  });
  dom.reportRulesListDiv.appendChild(ul);

  document.querySelectorAll(".btn-delete-rule").forEach((b) => {
    b.addEventListener("click", (e) => {
      const idx = e.currentTarget.getAttribute("data-index");
      state.currentWhatsappConfig.automatedReport.targets.splice(idx, 1);
      renderReportRules();
      markUnsavedChanges();
    });
  });

  document.querySelectorAll(".btn-send-manual").forEach((b) => {
    b.addEventListener("click", handleManualSend);
  });
}

export function initReportRuleListeners() {
  initReportAutocomplete();
  if (dom.btnAddReportRule) {
    dom.btnAddReportRule.addEventListener("click", () => {
      const gid = dom.reportRuleGroupHidden.value;
      if (!gid)
        return showMessage(dom.msgAddReportRule, "Selecciona un grupo", true);

      if (!state.currentWhatsappConfig.automatedReport)
        state.currentWhatsappConfig.automatedReport = { targets: [] };
      state.currentWhatsappConfig.automatedReport.targets.push({
        ciclo: "DOCENTES",
        turno: "docentes",
        groupId: gid,
      });

      renderReportRules();
      dom.reportRuleGroupFiltro.value = "";
      dom.reportRuleGroupHidden.value = "";
      markUnsavedChanges();
    });
  }
}
