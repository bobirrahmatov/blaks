/**
 * Covenant Monitoring — application logic for Confluence
 *
 * Macro order (must match):
 *   <div id="globalRiskCovenants"></div>
 *   apexcharts → xlsx → html2canvas
 *   covenants-style.css → covenants-page-style.css
 *   covenants.js  (this file)
 *   covenantsHTMLPage.js  (injects HTML, then calls bootstrapCovenantsPage)
 *
 * Data:
 *   Covenants → Confluence attachment Covenants_current.xlsx (page 3229979875)
 *   Activity  → dummy (Deferred / Waived / Deleted)
 */
// ===== COVENANTS-ONLY PAGE =====
      const COVENANTS_ONLY_PAGE = true;

      function isCovenantsOnlyPage() {
        return typeof COVENANTS_ONLY_PAGE !== "undefined" && !!COVENANTS_ONLY_PAGE;
      }

      function setTextById(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
      }

      function refreshCovenantPageCharts() {
        const run = (label, fn) => {
          try {
            if (typeof fn === "function") fn();
          } catch (e) {
            console.warn("refreshCovenantPageCharts:", label, e);
          }
        };
        const view = window.currentCovenantViewType || "pastDue";
        run("populateCovenantMonitoringData", populateCovenantMonitoringData);
        run("createCovenantMonitoringChart", () =>
          createCovenantMonitoringChart(view)
        );
        run("updateCovenantRegionalTable", () =>
          updateCovenantRegionalTable(view)
        );
        run("updateCovenantDashboardViz", updateCovenantDashboardViz);
        run("updateCovenantActivitySection", updateCovenantActivitySection);
        run("updateCovenantInsightsSection", updateCovenantInsightsSection);
        run("updateCovenantTopMetrics", updateCovenantTopMetrics);
        run("renderCovenantDetailsTable", renderCovenantDetailsTable);
      }
      window.refreshCovenantPageCharts = refreshCovenantPageCharts;

// Shared Past Due–style tooltip + SVG download helpers (covenants page)
      function buildCovenantStyleTooltip(opts) {
        const title = opts.title || "";
        const subtitle = opts.subtitle || "";
        const count = Number(opts.count) || 0;
        const total = Number(opts.total) || 0;
        const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : "0.0";
        const hasRel =
          opts.relationships !== undefined && opts.relationships !== null;
        const relCount = Number(opts.relationships) || 0;
        const perRel =
          relCount > 0 ? (count / relCount).toFixed(1) : "";
        const breakdownTitle = opts.breakdownTitle || "Breakdown";
        const breakdownRows = Array.isArray(opts.breakdownRows)
          ? opts.breakdownRows
          : [];
        const col1 = opts.col1Header || "Item";
        const col2 = opts.col2Header || "Count";

        let rowsHtml = "";
        breakdownRows.forEach((row) => {
          const value = Number(row.value) || 0;
          if (value <= 0 && opts.includeZeros !== true) return;
          rowsHtml += `
            <tr>
              <td style="padding: 6px 8px; text-align: left; font-size: 11px; color: #6B7280; font-weight: 500;">${row.label}</td>
              <td style="padding: 6px 8px; text-align: right; font-size: 11px; color: #111827; font-weight: 600;">${value.toLocaleString()}</td>
            </tr>`;
        });

        return `
          <div style="
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            min-width: ${hasRel ? "340px" : "280px"};
            max-width: ${hasRel ? "380px" : "320px"};
            overflow: hidden;
            font-family: Outfit, sans-serif;
          ">
            <div style="border-bottom: 1px solid #E5E7EB; padding: 16px 16px 12px 16px; margin-bottom: 14px;">
              <div style="font-weight: 600; font-size: 15px; color: #111827; margin-bottom: 4px;">${title}</div>
              <div style="font-size: 12px; font-weight: 500; color: #6B7280;">${subtitle}</div>
            </div>
            <div style="padding: 0 16px 16px 16px;">
              <div style="display: grid; grid-template-columns: ${hasRel ? "1fr 1fr 1fr" : "1fr 1fr"}; gap: 10px; margin-bottom: 16px;">
                <div style="background: #F9FAFB; border-radius: 8px; padding: 12px; border: 1px solid #E5E7EB;">
                  <div style="display: flex; align-items: center; gap: 6px; font-size: 11px; color: #6B7280; font-weight: 500; margin-bottom: 6px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M9 11l3 3L22 4"></path>
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                    </svg>
                    Count
                  </div>
                  <div style="font-size: 20px; font-weight: 700; color: #111827;">${count.toLocaleString()}</div>
                </div>
                <div style="background: #F9FAFB; border-radius: 8px; padding: 12px; border: 1px solid #E5E7EB;">
                  <div style="display: flex; align-items: center; gap: 6px; font-size: 11px; color: #6B7280; font-weight: 500; margin-bottom: 6px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M12 6v6l4 2"></path>
                    </svg>
                    % of Total
                  </div>
                  <div style="font-size: 14px; font-weight: 700; color: #111827;">${percentage}%</div>
                </div>
                ${
                  hasRel
                    ? `<div style="background: #F9FAFB; border-radius: 8px; padding: 12px; border: 1px solid #E5E7EB;">
                  <div style="display: flex; align-items: center; gap: 6px; font-size: 11px; color: #6B7280; font-weight: 500; margin-bottom: 6px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    Relationships
                  </div>
                  <div style="font-size: 20px; font-weight: 700; color: #111827;">${relCount.toLocaleString()}</div>
                  ${
                    perRel
                      ? `<div style="font-size: 10px; color: #6B7280; font-weight: 500; margin-top: 4px;">${perRel} per relationship</div>`
                      : ""
                  }
                </div>`
                    : ""
                }
              </div>
              <div style="margin-top: 12px;">
                <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                  </svg>
                  <span style="font-size: 12px; font-weight: 600; color: #374151;">${breakdownTitle}</span>
                </div>
                <table style="width: 100%; border-collapse: collapse;">
                  <thead>
                    <tr style="border-bottom: 1px solid #E5E7EB;">
                      <th style="padding: 6px 8px; text-align: left; font-size: 10px; color: #6B7280; font-weight: 600; text-transform: uppercase;">${col1}</th>
                      <th style="padding: 6px 8px; text-align: right; font-size: 10px; color: #6B7280; font-weight: 600; text-transform: uppercase;">${col2}</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${
                      rowsHtml ||
                      '<tr><td colspan="2" style="padding: 8px; text-align: center; font-size: 11px; color: #9CA3AF;">No data</td></tr>'
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>`;
      }



      function triggerSvgDownload(svgStr, filename) {
        const blob = new Blob([svgStr], {
          type: "image/svg+xml;charset=utf-8",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = (filename || "download") + ".svg";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      function downloadApexChartSVG(instance, filename) {
        if (!instance) {
          console.warn("Chart instance not found for SVG download");
          return;
        }
        try {
          const chartEl = instance.el || (instance.w && instance.w.globals && instance.w.globals.dom && instance.w.globals.dom.el);
          const root = chartEl || document;
          const svgEl =
            (chartEl && chartEl.querySelector && chartEl.querySelector(".apexcharts-svg")) ||
            null;
          if (!svgEl) {
            console.warn("SVG element not found for chart download");
            return;
          }
          const svgClone = svgEl.cloneNode(true);
          const bg = svgClone.querySelector(".apexcharts-canvas-svg-bg");
          if (bg) bg.remove();
          svgClone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
          const svgStr =
            '<?xml version="1.0" encoding="UTF-8"?>' +
            new XMLSerializer().serializeToString(svgClone);
          triggerSvgDownload(svgStr, filename);
        } catch (e) {
          console.error("SVG download failed:", e);
        }
      }

      function downloadTableAsSVG(elementId, filename) {
        const host = document.getElementById(elementId);
        if (!host) {
          console.warn("Table host not found:", elementId);
          return;
        }
        const table =
          host.tagName === "TABLE"
            ? host
            : host.closest("table") || host.querySelector("table");
        if (!table) {
          console.warn("Table not found inside:", elementId);
          return;
        }
        try {
          const clone = table.cloneNode(true);
          clone.setAttribute(
            "style",
            "border-collapse:collapse;font-family:Outfit,sans-serif;font-size:12px;width:100%;background:#fff;color:#111827;"
          );
          clone.querySelectorAll("th, td").forEach((cell) => {
            const existing = cell.getAttribute("style") || "";
            cell.setAttribute(
              "style",
              existing +
                ";border:1px solid #E5E7EB;padding:8px 10px;text-align:left;white-space:nowrap;"
            );
          });
          clone.querySelectorAll("th").forEach((th) => {
            th.setAttribute(
              "style",
              (th.getAttribute("style") || "") +
                ";background:#F9FAFB;font-weight:600;color:#374151;"
            );
          });

          const width = Math.max(table.scrollWidth || 0, table.offsetWidth || 0, 720);
          const height = Math.max(table.scrollHeight || 0, table.offsetHeight || 0, 200);
          const html = new XMLSerializer().serializeToString(clone);
          const svgStr = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <foreignObject width="100%" height="100%">
    <div xmlns="http://www.w3.org/1999/xhtml" style="padding:12px;background:#ffffff;">${html}</div>
  </foreignObject>
</svg>`;
          triggerSvgDownload(svgStr, filename);
        } catch (e) {
          console.error("Table SVG download failed:", e);
        }
      }

      window.downloadCovenantSVG = function (key, filename) {
        if (String(key || "").startsWith("table:")) {
          downloadTableAsSVG(String(key).slice(6), filename);
          return;
        }
        let instance = null;
        if (key === "monitoring") instance = covenantMonitoringChartInstance;
        else if (key === "activity")
          instance = covActivityChartInstances && covActivityChartInstances.main;
        else if (key === "agingByRegion")
          instance =
            covInsightChartInstances && covInsightChartInstances.agingByRegion;
        else if (key === "productDonut")
          instance =
            covInsightChartInstances && covInsightChartInstances.productDonut;
        else if (key === "actionByRegion")
          instance = covDashChartInstances && covDashChartInstances.actionByRegion;
        else if (key === "pastDueAging")
          instance = covDashChartInstances && covDashChartInstances.pastDueAging;
        else if (key === "upcomingProduct")
          instance = covDashChartInstances && covDashChartInstances.upcomingProduct;
        else if (key === "comingDueMonth")
          instance = covDashChartInstances && covDashChartInstances.comingDueMonth;
        downloadApexChartSVG(instance, filename || key);
      };

      function regionalBreakdownRows(regionalBreakdown) {
        return ["NAM", "LATAM", "EMEA", "APAC"].map((region) => ({
          label: region,
          value: (regionalBreakdown && regionalBreakdown[region]) || 0,
        }));
      }


      window.covenantDetailsFilter = window.covenantDetailsFilter || "actionNeeded";
      window.covenantDetailsTableState = window.covenantDetailsTableState || {
        page: 1,
        perPage: 10,
        rows: [],
      };
      let covenantDetailsSearchTimer = null;

      function getCovenantProductProgram(row) {
        const val = String(
          (row && (row.Product_Program || row.Product_Program_Name)) || ""
        ).trim();
        return val || "Unknown";
      }

      function getCovenantProductProgramName(row) {
        const name = String(
          (row &&
            (row.Product_Program_Name || row["Product Program Name"])) ||
            ""
        ).trim();
        if (name) return name;
        return String(
          (row && (row.Product_Program || row["Product Program"])) || ""
        ).trim();
      }

      function getCovenantUnderwriter(row) {
        return String((row && (row.Underwriter || row["Underwriter"])) || "").trim();
      }

      function getCovenantTeamLead(row) {
        return String(
          (row &&
            (row.Underwriting_Team_Lead ||
              row["Underwriting Team Lead"])) ||
            ""
        ).trim();
      }

      function getCovenantRegion(row) {
        return String((row && row.Region) || "")
          .trim()
          .toUpperCase();
      }

      function getCovenantFrequency(row) {
        const val = String(
          (row &&
            (row.Periodic_Frequency || row.Frequency || row.Periodicity)) ||
            ""
        ).trim();
        return val || "Unknown";
      }

      function countUniqueRelationships(rows) {
        const set = new Set();
        (rows || []).forEach((row) => {
          const key = getCovenantRelationshipKey(row);
          if (key) set.add(key);
        });
        return set.size;
      }

      function getCovenantRelationshipKey(row) {
        // Unique relationship key for the Relationships KPI (entire filtered file)
        const id = String((row && row.Relationship_ID) || "").trim();
        if (id) return id;
        const name = String(
          (row &&
            (row.Relationship_Name || row.Borrowers_Name || row.Client_Name)) ||
            ""
        ).trim();
        return name;
      }

      function normalizeComingDuePastDueStatus(raw) {
        // Exact match only against Excel "Coming Due / Past Due" values
        const s = String(raw || "")
          .trim()
          .toLowerCase()
          .replace(/[_-]+/g, " ")
          .replace(/\s+/g, " ");
        if (s === "past due" || s === "pastdue") return "Past Due";
        if (s === "coming due" || s === "comingdue") return "Coming Due";
        return ""; // unknown / blank — do not invent status
      }

      function normalizePastDueCategoryValue(raw) {
        const s = String(raw || "")
          .trim()
          .toLowerCase()
          .replace(/\s+/g, " ");
        if (!s) return "";
        if (
          s === ">90 days" ||
          s === "> 90 days" ||
          s === "90+ days" ||
          s === "over 90 days"
        ) {
          return ">90 Days";
        }
        if (s === "61-90 days" || s === "61 to 90 days") return "61-90 Days";
        if (s === "46-60 days" || s === "46 to 60 days") return "46-60 Days";
        if (s === "31-45 days" || s === "31 to 45 days") return "31-45 Days";
        if (s === "0-30 days" || s === "1-30 days" || s === "0 to 30 days")
          return "0-30 Days";
        if (s === "1-45 days" || s === "0-45 days") return "1-45 Days";
        return String(raw || "").trim(); // keep original if unknown
      }

      function isCovenantPastDue(row) {
        return (
          normalizeComingDuePastDueStatus(row && row.Coming_Due_Past_Due) ===
          "Past Due"
        );
      }

      function isCovenantComingDue(row) {
        return (
          normalizeComingDuePastDueStatus(row && row.Coming_Due_Past_Due) ===
          "Coming Due"
        );
      }

      function isCovenantActionNeeded(row) {
        // Action Needed = Past Due only (Coming Due / Past Due = Past Due)
        return isCovenantPastDue(row);
      }

      function getCovenant45DaysDate(row) {
        if (!row) return null;
        return parseDate(
          row["45_Days_Past_Due_Date"] ||
            row["45 Days Past Due Date"] ||
            row["45DaysPastDueDate"]
        );
      }

      function isCovenant45DaysPastDue(row, asOf) {
        if (!isCovenantPastDue(row)) return false;
        const d45 = getCovenant45DaysDate(row);
        if (!d45) return false;
        if (!asOf) return true;
        const a = new Date(asOf);
        a.setHours(0, 0, 0, 0);
        d45.setHours(0, 0, 0, 0);
        return a.getTime() >= d45.getTime();
      }

      function isCovenantGt90(row) {
        return (
          isCovenantPastDue(row) &&
          normalizePastDueCategoryValue(row && row.Past_Due_Category) ===
            ">90 Days"
        );
      }

      function getCovenantAsOfDate(rows) {
        const src = rows || [];
        for (let i = 0; i < src.length; i++) {
          const d = parseDate(src[i].As_Of_Date || src[i].Report_Date);
          if (d) {
            d.setHours(0, 0, 0, 0);
            return d;
          }
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
      }

      function formatCovenantDate(value) {
        const d = parseDate(value);
        if (!d) return "—";
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return d.getFullYear() + "-" + mm + "-" + dd;
      }

      function isCovenantDueThisMonth(row, asOf) {
        const due = parseDate(row && row.Covenant_Due_Date);
        if (!due || !asOf) return false;
        return (
          due.getFullYear() === asOf.getFullYear() &&
          due.getMonth() === asOf.getMonth()
        );
      }

      function covenantDaysFromAsOf(dueValue, asOf) {
        const due = parseDate(dueValue);
        if (!due || !asOf) return null;
        const a = new Date(asOf);
        a.setHours(0, 0, 0, 0);
        due.setHours(0, 0, 0, 0);
        return Math.round((due.getTime() - a.getTime()) / 86400000);
      }

      const COMING_DUE_BUCKET_LABELS = [
        "1-45 Days",
        "46-60 Days",
        "61-90 Days",
        "90+ Days",
      ];
      const COMING_DUE_BUCKET_COLORS = [
        "#15803d",
        "#16a34a",
        "#22c55e",
        "#4ade80",
      ];

      function comingDueDaysBucket(days) {
        if (days == null || isNaN(days)) return null;
        const n = Math.max(0, Number(days));
        if (n <= 45) return "1-45 Days";
        if (n <= 60) return "46-60 Days";
        if (n <= 90) return "61-90 Days";
        return "90+ Days";
      }

      function comingDueBucketForRow(row, asOf) {
        const daysUntil = covenantDaysFromAsOf(
          row && row.Covenant_Due_Date,
          asOf
        );
        return comingDueDaysBucket(
          daysUntil == null ? null : Math.max(0, daysUntil)
        );
      }

      function buildComingDueBucketCounts(rows, asOf) {
        const counts = {
          "1-45 Days": 0,
          "46-60 Days": 0,
          "61-90 Days": 0,
          "90+ Days": 0,
        };
        (rows || []).forEach((row) => {
          const bucket = comingDueBucketForRow(row, asOf);
          if (bucket) counts[bucket]++;
        });
        return counts;
      }

      function buildComingDueBucketsByRegion(rows, asOf) {
        const regions = ["APAC", "EMEA", "NAM", "LATAM"];
        const data = {};
        regions.forEach((r) => {
          data[r] = {
            "1-45 Days": 0,
            "46-60 Days": 0,
            "61-90 Days": 0,
            "90+ Days": 0,
          };
        });
        (rows || []).forEach((row) => {
          const region = String((row && row.Region) || "")
            .trim()
            .toUpperCase();
          if (!data[region]) return;
          const bucket = comingDueBucketForRow(row, asOf);
          if (bucket) data[region][bucket]++;
        });
        return data;
      }

      function buildUpcomingWindowCounts(rows, asOf) {
        const windows = { next7: 0, next30: 0, next60: 0, next90: 0 };
        (rows || []).forEach((row) => {
          const days = covenantDaysFromAsOf(row && row.Covenant_Due_Date, asOf);
          if (days == null || days < 0) return;
          if (days <= 7) windows.next7++;
          if (days <= 30) windows.next30++;
          if (days <= 60) windows.next60++;
          if (days <= 90) windows.next90++;
        });
        return windows;
      }

      function buildUpcomingDueTimeline(rows) {
        const map = {};
        (rows || []).forEach((row) => {
          const d = parseDate(row && row.Covenant_Due_Date);
          if (!d) return;
          const key =
            d.getFullYear() +
            "-" +
            String(d.getMonth() + 1).padStart(2, "0");
          map[key] = (map[key] || 0) + 1;
        });
        const keys = Object.keys(map).sort();
        return {
          keys,
          labels: keys.map((k) => {
            const parts = k.split("-");
            const dt = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
            return dt.toLocaleString("en-US", {
              month: "short",
              year: "numeric",
            });
          }),
          counts: keys.map((k) => map[k]),
        };
      }

      function escapeHtml(value) {
        return String(value == null ? "" : value)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;");
      }

      function setCovInsight(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text || "";
      }

      function covChartHeight(el) {
        const h = el && el.clientHeight ? el.clientHeight : 0;
        return Math.max(h, 300);
      }

      function updateCovenantTopMetrics() {
        // Cards are counted directly from the filtered Excel rows (single source of truth)
        const dataSource =
          typeof getCovenantPageDataSource === "function"
            ? getCovenantPageDataSource() || []
            : [];

        let pastDue = 0;
        let comingDue = 0;
        const rels = new Set();

        dataSource.forEach((row) => {
          if (isCovenantPastDue(row)) pastDue++;
          else if (isCovenantComingDue(row)) comingDue++;
          const key = getCovenantRelationshipKey(row);
          if (key) rels.add(key);
        });

        const totalActive = dataSource.length;
        const actionNeeded = pastDue;
        const actionPct =
          totalActive > 0 ? ((actionNeeded / totalActive) * 100).toFixed(1) : "0.0";
        const upPct =
          totalActive > 0 ? ((comingDue / totalActive) * 100).toFixed(1) : "0.0";

        const comingEl = document.getElementById("covMetricComingDue");
        const totalEl = document.getElementById("covMetricTotal");
        const relEl = document.getElementById("covMetricRelationships");
        const actionEl = document.getElementById("covMetricActionNeeded");
        if (comingEl) comingEl.textContent = comingDue.toLocaleString();
        if (totalEl) totalEl.textContent = totalActive.toLocaleString();
        if (relEl) relEl.textContent = rels.size.toLocaleString();
        if (actionEl) actionEl.textContent = actionNeeded.toLocaleString();

        setCovInsight(
          "covMetricTotalSub",
          totalActive
            ? actionNeeded.toLocaleString() +
                " of " +
                totalActive.toLocaleString() +
                " are Past Due"
            : "Filtered file"
        );
        setCovInsight(
          "covMetricActionSub",
          actionNeeded ? actionPct + "% of total" : "Past Due only"
        );
        setCovInsight(
          "covMetricComingDueSub",
          comingDue ? upPct + "% of total" : "Coming Due"
        );
        setCovInsight(
          "covMetricRelationshipsSub",
          rels.size
            ? (totalActive / Math.max(rels.size, 1)).toFixed(1) +
                " per relationship"
            : "Unique Relationship ID"
        );
      }

      function buildCovenantDetailsGroupedRows(statusFilter, search) {
        const dataSource = getCovenantPageDataSource();
        const filter = statusFilter || "actionNeeded";
        const isPastDue = filter !== "comingDue" && filter !== "upcoming";
        const asOf = getCovenantAsOfDate(dataSource);
        const detailedTableData = {};

        const addToBucket = (entry, days) => {
          if (days == null || isNaN(days)) return;
          const n = Number(days);
          if (n <= 45) entry.days_1_45++;
          else if (n <= 60) entry.days_46_60++;
          else if (n <= 90) entry.days_61_90++;
          else entry.days_90_plus++;
        };

        dataSource.forEach((row) => {
          const isPast = isCovenantPastDue(row);
          const isComing = isCovenantComingDue(row);
          if (isPastDue && !isPast) return;
          if (!isPastDue && !isComing) return;

          const relationshipID =
            String(row.Relationship_ID || "").trim() || "Unknown";
          const relationshipName =
            row.Relationship_Name ||
            row.Borrowers_Name ||
            row.Client_Name ||
            "Unknown";
          const underwriter =
            row.Lead_Underwriter || row.Underwriter || "Unknown";
          const region =
            String(row.Region || "Unknown").trim().toUpperCase() || "Unknown";
          const key = relationshipID + "|" + underwriter + "|" + region;

          if (!detailedTableData[key]) {
            detailedTableData[key] = {
              relationshipID,
              relationshipName,
              underwriter,
              region,
              days_1_45: 0,
              days_46_60: 0,
              days_61_90: 0,
              days_90_plus: 0,
            };
          }

          if (isPast) {
            const category = normalizePastDueCategoryValue(row.Past_Due_Category);
            if (
              category === "0-30 Days" ||
              category === "31-45 Days" ||
              category === "1-45 Days"
            ) {
              detailedTableData[key].days_1_45++;
            } else if (category === "46-60 Days") {
              detailedTableData[key].days_46_60++;
            } else if (category === "61-90 Days") {
              detailedTableData[key].days_61_90++;
            } else if (category === ">90 Days" || category === "90+ Days") {
              detailedTableData[key].days_90_plus++;
            } else {
              addToBucket(detailedTableData[key], parseFloat(row.Days_Past_Due));
            }
          } else {
            const bucket = comingDueBucketForRow(row, asOf);
            if (bucket === "1-45 Days") detailedTableData[key].days_1_45++;
            else if (bucket === "46-60 Days") detailedTableData[key].days_46_60++;
            else if (bucket === "61-90 Days") detailedTableData[key].days_61_90++;
            else if (bucket === "90+ Days") detailedTableData[key].days_90_plus++;
          }
        });

        let rows = Object.values(detailedTableData);

        if (search) {
          rows = rows.filter((row) => {
            const hay = [
              row.relationshipID,
              row.relationshipName,
              row.underwriter,
              row.region,
            ]
              .map((v) => String(v || "").toLowerCase())
              .join(" ");
            return hay.includes(search);
          });
        }

        rows.sort((a, b) => {
          if (isPastDue) {
            if (b.days_90_plus !== a.days_90_plus)
              return b.days_90_plus - a.days_90_plus;
            if (b.days_61_90 !== a.days_61_90) return b.days_61_90 - a.days_61_90;
            if (b.days_46_60 !== a.days_46_60) return b.days_46_60 - a.days_46_60;
            return b.days_1_45 - a.days_1_45;
          }
          if (b.days_1_45 !== a.days_1_45) return b.days_1_45 - a.days_1_45;
          if (b.days_46_60 !== a.days_46_60) return b.days_46_60 - a.days_46_60;
          if (b.days_61_90 !== a.days_61_90) return b.days_61_90 - a.days_61_90;
          return b.days_90_plus - a.days_90_plus;
        });

        return rows;
      }

      function updateCovenantDetailsTableHeader() {
        const headerEl = document.getElementById("covenantDetailsTableHeader");
        const subtitleEl = document.getElementById("covenantDetailsTableSubtitle");
        const filter = window.covenantDetailsFilter || "actionNeeded";
        const isComing = filter === "comingDue" || filter === "upcoming";
        const titleEl = document.getElementById("covenantDetailsTableTitle");
        if (titleEl) {
          titleEl.textContent = isComing
            ? "Coming Due Covenants"
            : "Past Due Covenants";
        }
        if (subtitleEl) {
          subtitleEl.textContent = isComing
            ? "Coming Due breakdown by days until Covenant Due Date"
            : "Comprehensive breakdown with aging buckets";
        }
        if (!headerEl) return;
        headerEl.innerHTML = `
            <th class="px-6 py-4 text-left text-sm font-medium whitespace-nowrap text-gray-500">Relationship ID</th>
            <th class="px-6 py-4 text-left text-sm font-medium whitespace-nowrap text-gray-500">Relationship Name</th>
            <th class="px-6 py-4 text-left text-sm font-medium whitespace-nowrap text-gray-500">Underwriter</th>
            <th class="px-6 py-4 text-center text-sm font-medium whitespace-nowrap text-gray-500">Region</th>
            <th class="px-6 py-4 text-center text-sm font-medium whitespace-nowrap text-gray-500">1-45 Days</th>
            <th class="px-6 py-4 text-center text-sm font-medium whitespace-nowrap text-gray-500">46-60 Days</th>
            <th class="px-6 py-4 text-center text-sm font-medium whitespace-nowrap text-gray-500">61-90 Days</th>
            <th class="px-6 py-4 text-center text-sm font-medium whitespace-nowrap text-gray-500">90+ Days</th>
          `;
      }

      function updateCovenantDetailsTablePagination() {
        const state = window.covenantDetailsTableState;
        const total = state.rows.length;
        const perPage = state.perPage || 10;
        const totalPages = Math.max(1, Math.ceil(total / perPage) || 1);
        if (state.page > totalPages) state.page = totalPages;
        if (state.page < 1) state.page = 1;

        const start = total === 0 ? 0 : (state.page - 1) * perPage + 1;
        const end = Math.min(state.page * perPage, total);

        const startEl = document.getElementById("covenantDetailsTableStart");
        const endEl = document.getElementById("covenantDetailsTableEnd");
        const totalEl = document.getElementById("covenantDetailsTableTotal");
        const pageEl = document.getElementById("covenantDetailsTableCurrentPage");
        const pagesEl = document.getElementById("covenantDetailsTableTotalPages");
        const prevBtn = document.getElementById("covenantDetailsTablePrevBtn");
        const nextBtn = document.getElementById("covenantDetailsTableNextBtn");
        const perPageEl = document.getElementById("covenantDetailsTablePerPage");

        if (startEl) startEl.textContent = start.toLocaleString();
        if (endEl) endEl.textContent = end.toLocaleString();
        if (totalEl) totalEl.textContent = total.toLocaleString();
        if (pageEl) pageEl.textContent = String(state.page);
        if (pagesEl) pagesEl.textContent = String(totalPages);
        if (prevBtn) prevBtn.disabled = state.page <= 1 || total === 0;
        if (nextBtn) nextBtn.disabled = state.page >= totalPages || total === 0;
        if (perPageEl && String(perPageEl.value) !== String(perPage)) {
          perPageEl.value = String(perPage);
        }
      }

      function renderCovenantDetailsTablePage() {
        const tbody = document.getElementById("covenantDetailsTableBody");
        if (!tbody) return;

        const state = window.covenantDetailsTableState;
        const filter = window.covenantDetailsFilter || "actionNeeded";
        const isPastDue = filter !== "comingDue" && filter !== "upcoming";
        const rows = state.rows || [];
        const perPage = state.perPage || 10;
        const totalPages = Math.max(1, Math.ceil(rows.length / perPage) || 1);
        const startIndex = (state.page - 1) * perPage;
        const pageRows = rows.slice(startIndex, startIndex + perPage);
        const colSpan = 8;
        const isLastPage = state.page >= totalPages;

        updateCovenantDetailsTableHeader();
        updateCovenantDetailsTablePagination();

        if (pageRows.length === 0) {
          tbody.innerHTML = generateTableEmptyStateRow(
            colSpan,
            isPastDue ? "Past Due Covenants" : "Coming Due Covenants"
          );
          return;
        }

        const regionColors = {
          APAC: "bg-blue-50 text-blue-600",
          EMEA: "bg-green-50 text-green-600",
          NAM: "bg-orange-50 text-orange-600",
          LATAM: "bg-purple-50 text-purple-600",
        };

        const comingDuePill =
          "bg-green-100 text-green-700 rounded-full px-2 py-0.5 text-xs font-medium";
        const pastDuePills = {
          days_1_45:
            "bg-green-100 text-green-700 rounded-full px-2 py-0.5 text-xs font-medium",
          days_46_60:
            "bg-yellow-100 text-yellow-700 rounded-full px-2 py-0.5 text-xs font-medium",
          days_61_90:
            "bg-orange-100 text-orange-700 rounded-full px-2 py-0.5 text-xs font-medium",
          days_90_plus:
            "bg-red-100 text-red-700 rounded-full px-2 py-0.5 text-xs font-medium",
        };

        const bodyHtml = pageRows
          .map((row) => {
            const regionColor =
              regionColors[row.region] || "bg-gray-50 text-gray-600";
            const pill145 = isPastDue ? pastDuePills.days_1_45 : comingDuePill;
            const pill4660 = isPastDue ? pastDuePills.days_46_60 : comingDuePill;
            const pill6190 = isPastDue ? pastDuePills.days_61_90 : comingDuePill;
            const pill90 = isPastDue ? pastDuePills.days_90_plus : comingDuePill;
            return `
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4 text-left text-sm text-gray-600 whitespace-nowrap">${escapeHtml(row.relationshipID)}</td>
                  <td class="px-6 py-4 text-left text-sm font-medium text-gray-900">${escapeHtml(row.relationshipName)}</td>
                  <td class="px-6 py-4 text-left text-sm text-gray-700">${escapeHtml(row.underwriter)}</td>
                  <td class="px-6 py-4 text-center">
                    <span class="${regionColor} rounded-full px-2 py-0.5 text-xs font-medium">${escapeHtml(row.region)}</span>
                  </td>
                  <td class="px-6 py-4 text-center">
                    <span class="${pill145}">${row.days_1_45}</span>
                  </td>
                  <td class="px-6 py-4 text-center">
                    <span class="${pill4660}">${row.days_46_60}</span>
                  </td>
                  <td class="px-6 py-4 text-center">
                    <span class="${pill6190}">${row.days_61_90}</span>
                  </td>
                  <td class="px-6 py-4 text-center">
                    <span class="${pill90}">${row.days_90_plus}</span>
                  </td>
                </tr>`;
          })
          .join("");

        let totalsHtml = "";
        if (rows.length > 0 && isLastPage) {
          const total145 = rows.reduce((sum, row) => sum + row.days_1_45, 0);
          const total4660 = rows.reduce((sum, row) => sum + row.days_46_60, 0);
          const total6190 = rows.reduce((sum, row) => sum + row.days_61_90, 0);
          const total90Plus = rows.reduce((sum, row) => sum + row.days_90_plus, 0);
          totalsHtml = `
              <tr class="font-semibold border-t-2 border-gray-300">
                <td class="px-6 py-4 text-left text-sm text-gray-900">Total (${rows.length})</td>
                <td colspan="2" class="px-6 py-4"></td>
                <td class="px-6 py-4"></td>
                <td class="px-6 py-4 text-center text-sm text-gray-900">${total145}</td>
                <td class="px-6 py-4 text-center text-sm text-gray-900">${total4660}</td>
                <td class="px-6 py-4 text-center text-sm text-gray-900">${total6190}</td>
                <td class="px-6 py-4 text-center text-sm text-gray-900">${total90Plus}</td>
              </tr>`;
        }

        tbody.innerHTML = bodyHtml + totalsHtml;
      }

      function renderCovenantDetailsTable(forceStatus, resetPage) {
        const tbody = document.getElementById("covenantDetailsTableBody");
        if (!tbody) return;

        if (forceStatus) window.covenantDetailsFilter = forceStatus;
        const statusFilter = window.covenantDetailsFilter || "actionNeeded";
        const searchEl = document.getElementById("covenantDetailsSearch");
        const search = (searchEl && searchEl.value ? searchEl.value : "").trim().toLowerCase();
        const perPageEl = document.getElementById("covenantDetailsTablePerPage");
        const selectedPerPage = perPageEl ? parseInt(perPageEl.value, 10) : 10;

        if (!window.covenantDetailsTableState) {
          window.covenantDetailsTableState = {
            page: 1,
            perPage: !isNaN(selectedPerPage) && selectedPerPage > 0 ? selectedPerPage : 10,
            rows: [],
          };
        }
        if (!window.covenantDetailsTableState.perPage) {
          window.covenantDetailsTableState.perPage =
            !isNaN(selectedPerPage) && selectedPerPage > 0 ? selectedPerPage : 10;
        }
        if (resetPage !== false) {
          window.covenantDetailsTableState.page = 1;
        }

        window.covenantDetailsTableState.rows = buildCovenantDetailsGroupedRows(
          statusFilter,
          search
        );
        syncCovenantDetailsFilterButtons();
        renderCovenantDetailsTablePage();
      }

      function syncCovenantDetailsFilterButtons() {
        const filter = window.covenantDetailsFilter || "actionNeeded";
        const activeId =
          filter === "comingDue" || filter === "upcoming"
            ? "covenantDetailsBtnComingDue"
            : "covenantDetailsBtnActionNeeded";
        const base =
          "px-2.5 py-1.5 text-xs rounded-md transition-all duration-200";
        [
          "covenantDetailsBtnActionNeeded",
          "covenantDetailsBtnComingDue",
        ].forEach((id) => {
          const el = document.getElementById(id);
          if (!el) return;
          el.className =
            id === activeId
              ? base + " bg-white shadow-sm text-gray-900 font-medium"
              : base + " text-gray-600";
        });
      }

      function filterCovenantDetailsTable(status) {
        renderCovenantDetailsTable(status, true);
      }

      function onCovenantDetailsSearchInput() {
        if (covenantDetailsSearchTimer) clearTimeout(covenantDetailsSearchTimer);
        covenantDetailsSearchTimer = setTimeout(() => {
          renderCovenantDetailsTable(null, true);
        }, 200);
      }

      function changeCovenantDetailsTablePage(direction) {
        const state = window.covenantDetailsTableState;
        if (!state) return;
        const totalPages = Math.max(1, Math.ceil(state.rows.length / (state.perPage || 10)) || 1);
        if (direction === "prev" && state.page > 1) state.page -= 1;
        if (direction === "next" && state.page < totalPages) state.page += 1;
        renderCovenantDetailsTablePage();
      }

      function updateCovenantDetailsTablePerPage(perPage) {
        const state = window.covenantDetailsTableState;
        if (!state) return;
        const size = parseInt(perPage, 10);
        state.perPage = !isNaN(size) && size > 0 ? size : 10;
        state.page = 1;
        renderCovenantDetailsTablePage();
      }

      function refreshCovenantPageViews(viewType) {
        const vt = viewType || window.currentCovenantViewType || "pastDue";
        updateCovenantTopMetrics();
        updateCovenantRegionalTable(vt);
        updateCovenantDashboardViz();
        renderCovenantDetailsTable(null, true);
      }


      window.filterCovenantDetailsTable = filterCovenantDetailsTable;
      window.onCovenantDetailsSearchInput = onCovenantDetailsSearchInput;
      window.changeCovenantDetailsTablePage = changeCovenantDetailsTablePage;
      window.updateCovenantDetailsTablePerPage = updateCovenantDetailsTablePerPage;
      window.renderCovenantDetailsTable = renderCovenantDetailsTable;


      // ===== Vanilla UI helpers (replaces Alpine.js) =====
      function closeUiMenu(id) {
        const menu = document.getElementById(id);
        if (!menu) return;
        menu.classList.add("hidden");
        menu.classList.remove("block");
        const root = menu.closest("[data-ui-root]") || menu.parentElement;
        const chevron = root && root.querySelector("[data-ui-chevron]");
        if (chevron) chevron.classList.remove("rotate-180");
      }

      function toggleUiMenu(id) {
        const menu = document.getElementById(id);
        if (!menu) return;
        const willOpen = menu.classList.contains("hidden");
        document.querySelectorAll("[data-ui-menu]").forEach((m) => {
          if (m.id !== id) {
            m.classList.add("hidden");
            m.classList.remove("block");
            const r = m.closest("[data-ui-root]") || m.parentElement;
            const c = r && r.querySelector("[data-ui-chevron]");
            if (c) c.classList.remove("rotate-180");
          }
        });
        if (willOpen) {
          menu.classList.remove("hidden");
          menu.classList.add("block");
        } else {
          menu.classList.add("hidden");
          menu.classList.remove("block");
        }
        const root = menu.closest("[data-ui-root]") || menu.parentElement;
        const chevron = root && root.querySelector("[data-ui-chevron]");
        if (chevron) chevron.classList.toggle("rotate-180", willOpen);
      }

      function setActiveInGroup(el, activeCls, inactiveCls, baseCls) {
        if (!el || !el.parentElement) return;
        const siblings = el.parentElement.querySelectorAll(":scope > button");
        siblings.forEach((btn) => {
          btn.className = (baseCls + " " + inactiveCls).trim();
        });
        el.className = (baseCls + " " + activeCls).trim();
      }

      
      document.addEventListener("click", function (e) {
        document.querySelectorAll("[data-ui-menu]").forEach((menu) => {
          const root = menu.closest("[data-ui-root]") || menu.parentElement;
          if (root && !root.contains(e.target)) {
            menu.classList.add("hidden");
            menu.classList.remove("block");
            const chevron = root.querySelector("[data-ui-chevron]");
            if (chevron) chevron.classList.remove("rotate-180");
          }
        });
      });

      // ===== PORTFOLIO ANALYTICS CONFIGURATION =====
      // This dashboard loads data from Confluence in READ-ONLY mode
      // Similar to cmps.html, data is fetched from an attachment but never modified
      // All filters and options are dynamically populated from the loaded data

      // Update these values to match your Confluence page and attachment
      const CONFLUENCE_PAGE_ID = "3229979875"; // Your Confluence page ID
      const CONFLUENCE_COVENANTS_FILE = "Covenants_current.xlsx"; // Covenants data file (this week)
      const CONFLUENCE_BASE_URL =
        "https://cedt-confluence.nam.nsroot.net/confluence";
      // ==========================================

      // ===== PERFORMANCE OPTIMIZATIONS FOR 40K+ ROWS =====
      // 1. INDEX CACHING: Pre-parse dates and build indexes for fast filtering
      // 2. SMART FILTERING: Early exit loops, minimal object access, use for-loops not .filter()
      // 3. RESULT CACHING: Cache filtered results to avoid re-filtering same queries
      // 4. SINGLE-PASS METRICS: Calculate all metrics in one loop instead of multiple passes
      // 5. OPTIMIZED CHARTS: Use Map() instead of objects, limit data points
      // 6. DEBOUNCED SEARCH: 300ms delay to prevent filtering on every keystroke
      // 7. LAZY LOADING: 20 rows per page by default (only render visible data)
      // 8. ASYNC RENDERING: Use requestAnimationFrame to prevent UI blocking
      // 9. MEMOIZATION: Cache filtered/sorted results to avoid recomputation
      //
      // Expected Performance: 40K rows should filter in 50-200ms (was 2-5 seconds)
      // =====================================================

      // Global variables
      let portfolioData = [];
      let covenantsData = []; // Separate covenant data from Covenants_tw.xlsx

      // ===== COVENANT ACTIVITY (Deferred / Waived / Deleted) =====
      // Source: Covenants_Activity_Report.xlsx — Covenant Compliance
      const CONFLUENCE_COVENANTS_ACTIVITY_FILE = "Covenants_Activity_Report.xlsx";
      let covenantsActivityData = [];
      window.covenantsActivityData = covenantsActivityData;
      const covActivityChartInstances = {
        main: null,
      };

      function normalizeActivityRegion(region) {
        const r = String(region || "").trim().toUpperCase();
        if (!r) return "Other";
        if (r === "NAM" || r === "LATAM" || r === "AMERICAS" || r === "AMER" || r.includes("AMERICA")) {
          return "Americas";
        }
        if (r === "EMEA" || r.includes("EUROPE") || r.includes("MIDDLE EAST")) return "EMEA";
        if (r === "APAC" || r === "ASIA" || r.includes("PACIFIC")) return "APAC";
        return "Other";
      }

      function normalizeComplianceBucket(value) {
        const v = String(value || "").trim().toLowerCase();
        if (!v) return null;
        if (v.includes("defer")) return "deferred";
        if (v.includes("waiv")) return "waived";
        if (v.includes("delet") || v.includes("deactiv") || v.includes("inactiv")) return "deleted";
        return null;
      }

      function getActivityField(row, names) {
        for (const name of names) {
          if (row[name] != null && String(row[name]).trim() !== "") return row[name];
          const found = Object.keys(row || {}).find(
            (k) => k.replace(/[_\s]+/g, "").toLowerCase() === name.replace(/[_\s]+/g, "").toLowerCase()
          );
          if (found && row[found] != null && String(row[found]).trim() !== "") return row[found];
        }
        return null;
      }

      function parseActivityDate(value) {
        if (!value && value !== 0) return null;
        if (value instanceof Date && !isNaN(value)) return value;
        if (typeof value === "number" && typeof XLSX !== "undefined") {
          const parsed = XLSX.SSF.parse_date_code(value);
          if (parsed) return new Date(parsed.y, parsed.m - 1, parsed.d);
        }
        const s = String(value).trim();
        const d = new Date(s);
        if (!isNaN(d.getTime())) return d;
        const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
        if (m) {
          const year = m[3].length === 2 ? 2000 + parseInt(m[3], 10) : parseInt(m[3], 10);
          return new Date(year, parseInt(m[1], 10) - 1, parseInt(m[2], 10));
        }
        return null;
      }

      function monthKey(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      }

      function formatMonthLabel(key) {
        const [y, m] = key.split("-").map(Number);
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return `${months[m - 1]}-${String(y).slice(-2)}`;
      }

      function generateDummyCovenantActivityData() {
        const data = [];
        const regions = ["NAM", "EMEA", "APAC", "LATAM"];
        const compliances = ["Deferred", "Waived", "Deleted", "Deactivated", "Compliant"];
        const productPrograms = [
          "Corporate Lending",
          "Trade Finance",
          "Working Capital",
          "Project Finance",
          "Real Estate",
          "Asset Based Lending",
          "Equipment Finance",
          "Supply Chain Finance",
        ];
        const underwriters = [
          "John Smith",
          "Sarah Johnson",
          "David Lee",
          "Carlos Rodriguez",
          "Robert Brown",
          "Lisa Anderson",
          "Mike Wilson",
          "Emily Chen",
          "Tom Harris",
          "Anna Martinez",
        ];

        // When real covenants are loaded, seed activity from those relationships
        // so Deferred filters stay aligned with Excel Product / Underwriter / Region.
        const covSource =
          (typeof covenantsData !== "undefined" &&
            Array.isArray(covenantsData) &&
            covenantsData.length &&
            covenantsData) ||
          (window.covenantsData && window.covenantsData.length
            ? window.covenantsData
            : null);

        const seedRels = [];
        if (covSource) {
          const seen = new Set();
          covSource.forEach((row) => {
            const id = String(row.Relationship_ID || "").trim();
            if (!id || seen.has(id)) return;
            seen.add(id);
            seedRels.push({
              id,
              name: String(row.Relationship_Name || "").trim() || id,
              ca: String(row.CA_Number || "").trim(),
              region: String(row.Region || "").trim() || regions[seedRels.length % 4],
              product:
                String(
                  row.Product_Program || row.Product_Program_Name || ""
                ).trim() || productPrograms[seedRels.length % 8],
              uw:
                String(row.Lead_Underwriter || row.Underwriter || "").trim() ||
                underwriters[seedRels.length % 10],
              team:
                String(
                  row.Underwriting_Team_Lead || row.Team_Lead || ""
                ).trim() || underwriters[(seedRels.length + 2) % 10],
            });
          });
        }

        const now = new Date();
        const asOf =
          typeof getCovenantAsOfDate === "function"
            ? getCovenantAsOfDate(
                (typeof covenantsData !== "undefined" && covenantsData) ||
                  window.covenantsData ||
                  []
              )
            : null;
        const anchor = asOf || now;
        const count = 420;
        for (let i = 0; i < count; i++) {
          const monthOffset = i % 3; // 3 visible months ending at As Of Date
          const d = new Date(
            anchor.getFullYear(),
            anchor.getMonth() - monthOffset,
            5 + (i % 20)
          );
          const compliance = compliances[i % compliances.length];
          const forced =
            i % 7 === 0 ? "Deferred" : i % 7 === 1 ? "Waived" : i % 11 === 0 ? "Deleted" : compliance;

          let rel;
          if (seedRels.length) {
            rel = seedRels[i % seedRels.length];
          } else {
            const relNum = (i % 50) + 1;
            rel = {
              id: "REL" + String(relNum).padStart(3, "0"),
              name: `${regions[i % regions.length]} Company ${relNum}`,
              ca: "CA2024" + String(relNum).padStart(3, "0"),
              region: regions[i % regions.length],
              product: productPrograms[i % productPrograms.length],
              uw: underwriters[i % underwriters.length],
              team: underwriters[(i + 2) % underwriters.length],
            };
          }

          data.push({
            "Maker Date": d.toISOString().split("T")[0],
            Region: rel.region,
            "Relationship ID": rel.id,
            "Relationship Name": rel.name,
            "CA Number": rel.ca || "CA" + String(i).padStart(5, "0"),
            "Covenant Number": "COV-ACT-" + i,
            Product_Program: rel.product,
            Product_Program_Name: rel.product,
            Lead_Underwriter: rel.uw,
            Underwriting_Team_Lead: rel.team,
            "Covenant Compliance": forced,
            "Modified in Reporting Month": "YES",
            "As of Date": d.toISOString().split("T")[0],
            "Covenant Deferred Date": forced === "Deferred" ? d.toISOString().split("T")[0] : null,
            "Cumulative Deferred Days": forced === "Deferred" ? 15 + (i % 30) : 0,
          });
        }
        return data;
      }

      async function fetchCovenantsActivityFromConfluence() {
        const url = `${CONFLUENCE_BASE_URL}/download/attachments/${CONFLUENCE_PAGE_ID}/${CONFLUENCE_COVENANTS_ACTIVITY_FILE}?api=v2`;
        console.log("Fetching covenant activity file:", CONFLUENCE_COVENANTS_ACTIVITY_FILE);
        const response = await fetch(url, { credentials: "include" });
        if (!response.ok) {
          throw new Error(
            `Failed to fetch ${CONFLUENCE_COVENANTS_ACTIVITY_FILE}: ${response.status} ${response.statusText}`
          );
        }
        const blob = await response.blob();
        return await parseCovenantExcelBlob(blob);
      }

      function buildCovenantActivityMatrix(rows, bucket) {
        const regions = ["Americas", "EMEA", "APAC"];
        const monthMap = new Map(); // key -> {Americas, EMEA, APAC}

        (rows || []).forEach((row) => {
          const compliance = normalizeComplianceBucket(
            getActivityField(row, [
              "Covenant Compliance",
              "Covenant_Compliance",
              "CovenantCompliance",
            ])
          );
          if (compliance !== bucket) return;

          const region = normalizeActivityRegion(
            getActivityField(row, ["Region"])
          );
          if (!regions.includes(region)) return;

          const date = parseActivityDate(
            getActivityField(row, [
              "Maker Date",
              "Maker_Date",
              "As of Date",
              "As_of_Date",
              "AsOfDate",
            ])
          );
          if (!date) return;

          const key = monthKey(date);
          if (!monthMap.has(key)) {
            monthMap.set(key, { Americas: 0, EMEA: 0, APAC: 0 });
          }
          monthMap.get(key)[region] += 1;
        });

        // Last 3 months that actually appear in the filtered (visible) activity
        let months = Array.from(monthMap.keys()).sort();
        months = months.slice(-3);

        const matrix = {
          months,
          labels: months.map(formatMonthLabel),
          regions,
          series: regions.map((region) => ({
            name: region,
            data: months.map((m) => (monthMap.get(m) || {})[region] || 0),
          })),
          totals: months.map((m) => {
            const row = monthMap.get(m) || { Americas: 0, EMEA: 0, APAC: 0 };
            return row.Americas + row.EMEA + row.APAC;
          }),
          byRegion: {},
        };
        regions.forEach((region) => {
          matrix.byRegion[region] = months.map(
            (m) => (monthMap.get(m) || {})[region] || 0
          );
        });
        return matrix;
      }


      let currentCovActivityView = "deferred";
      let covActivityTableFilter = "all";
      window.currentCovActivityView = currentCovActivityView;

      const COV_ACTIVITY_VIEW_META = {
        deferred: {
          title: "Deferred Covenants",
          subtitle: "Across 3 months from visible months",
        },
        waived: {
          title: "Waived Covenants",
          subtitle: "Across 3 months from visible months",
        },
        deleted: {
          title: "Deleted & Deactivated Covenants",
          subtitle: "Across 3 months from visible months",
        },
      };

      function covStackedBarPlotOptions(extra) {
        return {
          bar: Object.assign(
            {
              horizontal: false,
              columnWidth: "45%",
              borderRadius: 8,
              borderRadiusApplication: "end",
              borderRadiusWhenStacked: "last",
              dataLabels: {
                total: {
                  enabled: true,
                  offsetY: -8,
                  style: {
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#111827",
                  },
                  formatter: function (val) {
                    return val;
                  },
                },
              },
            },
            extra || {}
          ),
        };
      }

      function covStackedBarDataLabels() {
        return {
          enabled: true,
          formatter: function (val) {
            return val > 0 ? val : "";
          },
          style: {
            fontSize: "11px",
            fontWeight: 600,
            colors: ["#ffffff"],
          },
          dropShadow: { enabled: false },
        };
      }

      function covSingleBarPlotOptions(opts) {
        const horizontal = !!(opts && opts.horizontal);
        return {
          bar: {
            horizontal,
            distributed: !!(opts && opts.distributed),
            borderRadius: 8,
            borderRadiusApplication: "end",
            columnWidth: (opts && opts.columnWidth) || "45%",
            barHeight: (opts && opts.barHeight) || "58%",
            dataLabels: {
              position: "top",
              hideOverflowingLabels: false,
            },
          },
        };
      }

      function covSingleBarDataLabels(opts) {
        const horizontal = !!(opts && opts.horizontal);
        return {
          enabled: true,
          formatter: function (val) {
            const n = Number(val);
            if (!n || n < 0) return "";
            return Math.round(n);
          },
          offsetX: horizontal ? 8 : 0,
          offsetY: horizontal ? 0 : -16,
          textAnchor: horizontal ? "start" : "middle",
          style: {
            fontSize: "13px",
            fontWeight: 700,
            colors: ["#111827"],
          },
          dropShadow: { enabled: false },
          background: { enabled: false },
        };
      }

      function covHexToRgb(hex) {
        const h = String(hex || "").replace("#", "");
        if (h.length !== 6) return { r: 54, g: 65, b: 245 };
        return {
          r: parseInt(h.slice(0, 2), 16),
          g: parseInt(h.slice(2, 4), 16),
          b: parseInt(h.slice(4, 6), 16),
        };
      }

      function covRgbToHex(r, g, b) {
        return (
          "#" +
          [r, g, b]
            .map((n) =>
              Math.round(Math.max(0, Math.min(255, n)))
                .toString(16)
                .padStart(2, "0")
            )
            .join("")
        );
      }

      function covMixTowardWhite(hex, amount) {
        const c = covHexToRgb(hex);
        const t = Math.max(0, Math.min(1, Number(amount) || 0));
        return covRgbToHex(
          c.r + (255 - c.r) * t,
          c.g + (255 - c.g) * t,
          c.b + (255 - c.b) * t
        );
      }

      function covCountIntensityColors(counts, baseHex) {
        const nums = (counts || []).map((n) => Number(n) || 0);
        const base = baseHex || "#3641f5";
        if (!nums.length) return [base];
        const positives = nums.filter((n) => n > 0);
        const max = positives.length ? Math.max.apply(null, positives) : 1;
        const min = positives.length ? Math.min.apply(null, positives) : 0;
        return nums.map((n) => {
          if (n <= 0) return covMixTowardWhite(base, 0.72);
          const ratio = max === min ? 1 : (n - min) / (max - min);
          return covMixTowardWhite(base, 0.58 * (1 - ratio));
        });
      }

      function covHBarValueMax(counts) {
        const nums = (counts || [])
          .map(Number)
          .filter((n) => !isNaN(n) && n > 0);
        if (!nums.length) return undefined;
        const max = Math.max.apply(null, nums);
        return Math.ceil(max * 1.28);
      }

      function covHBarXAxis(labels, counts, extra) {
        const cfg = {
          categories: labels || [],
          min: 0,
          forceNiceScale: false,
          decimalsInFloat: 0,
          labels: {
            show: true,
            style: { fontSize: "11px", colors: "#6B7280" },
            formatter: function (val) {
              const n = Number(val);
              if (isNaN(n)) return String(val == null ? "" : val);
              if (n < 0) return "0";
              return String(Math.round(n));
            },
          },
        };
        const max = covHBarValueMax(counts);
        if (max != null) cfg.max = max;
        return Object.assign(cfg, extra || {});
      }

      function covHBarGrid(extra) {
        return Object.assign(
          {
            borderColor: "#F3F4F6",
            strokeDashArray: 4,
            padding: { left: 8, right: 52, top: 8, bottom: 0 },
          },
          extra || {}
        );
      }

      function createCovenantActivityChart(matrix) {
        if (typeof ApexCharts === "undefined") return;

        if (covActivityChartInstances.main) {
          covActivityChartInstances.main.destroy();
          covActivityChartInstances.main = null;
        }

        const totals = (matrix && matrix.totals) || [];
        const grandTotal = totals.reduce((a, b) => a + (Number(b) || 0), 0);
        const meta =
          COV_ACTIVITY_VIEW_META[currentCovActivityView] ||
          COV_ACTIVITY_VIEW_META.deferred;

        if (!matrix || !grandTotal) {
          const host = document.getElementById("covActivityChartHost");
          if (host) {
            renderCenteredEmptyState(host, meta.title || "Deferred Covenants");
          } else {
            const el = document.getElementById("covActivityChart");
            if (el) el.innerHTML = generateNoDataMessage(meta.title || "Deferred Covenants");
          }
          return;
        }

        const parts = ensureActivityChartStructure();
        const el = parts && parts.chart;
        if (!el) return;

        const options = {
          series: matrix.series,
          colors: ["#1e3a8a", "#6b7280", "#93c5fd"],
          chart: {
            fontFamily: "Outfit, sans-serif",
            type: "bar",
            stacked: true,
            height: "100%",
            width: "100%",
            toolbar: { show: false },
            zoom: { enabled: false },
            parentHeightOffset: 0,
          },
          plotOptions: {
            bar: {
              horizontal: false,
              columnWidth: "45%",
              borderRadius: 8,
              borderRadiusApplication: "end",
              borderRadiusWhenStacked: "last",
              dataLabels: {
                total: {
                  enabled: true,
                  offsetY: -8,
                  style: {
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#111827",
                  },
                  formatter: function (val) {
                    return val;
                  },
                },
              },
            },
          },
          dataLabels: {
            enabled: true,
            formatter: function (val) {
              return val > 0 ? val : "";
            },
            style: {
              fontSize: "11px",
              fontWeight: 600,
              colors: ["#ffffff"],
            },
            dropShadow: { enabled: false },
          },
          xaxis: {
            categories: matrix.labels,
            axisBorder: { show: false },
            axisTicks: { show: false },
            labels: {
              style: { colors: "#6B7280", fontSize: "12px" },
            },
          },
          yaxis: {
            labels: {
              style: { colors: "#6B7280", fontSize: "11px" },
              formatter: function (val) {
                return Math.round(val);
              },
            },
          },
          legend: {
            position: "top",
            horizontalAlign: "center",
            fontSize: "12px",
            markers: { width: 10, height: 10, radius: 2 },
            itemMargin: { horizontal: 12, vertical: 0 },
          },
          grid: {
            borderColor: "#E5E7EB",
            strokeDashArray: 3,
            padding: { left: 10, right: 10, top: 0, bottom: 0 },
          },
          tooltip: {
            enabled: true,
            shared: true,
            intersect: false,
            custom: function ({ series, dataPointIndex }) {
              const label =
                (matrix.labels && matrix.labels[dataPointIndex]) || "Period";
              const meta =
                COV_ACTIVITY_VIEW_META[currentCovActivityView] ||
                COV_ACTIVITY_VIEW_META.deferred;
              const breakdownRows = (matrix.series || []).map((s, i) => ({
                label: s.name,
                value: (series[i] && series[i][dataPointIndex]) || 0,
              }));
              const count = breakdownRows.reduce(
                (sum, row) => sum + (Number(row.value) || 0),
                0
              );
              const total = (matrix.totals || []).reduce(
                (sum, v) => sum + (Number(v) || 0),
                0
              );
              return buildCovenantStyleTooltip({
                title: label,
                subtitle: meta.subtitle || meta.title,
                count,
                total,
                breakdownTitle: "Regional Distribution",
                breakdownRows,
                col1: "Region",
                col2: "Count",
              });
            },
          },
          fill: { opacity: 1 },
        };

        el.innerHTML = "";
        const chart = new ApexCharts(el, options);
        covActivityChartInstances.main = chart;
        chart.render();
      }


      function formatDeltaPct(curr, prev) {
        if (prev === 0 && curr === 0) return "";
        let rounded;
        if (prev === 0) rounded = 100;
        else rounded = Math.round(((curr - prev) / prev) * 100);
        if (rounded === 0) {
          return `<span style="margin-left:6px;font-size:11px;color:#6b7280;font-weight:600">→0%</span>`;
        }
        if (rounded > 0) {
          return `<span style="margin-left:6px;font-size:11px;color:#dc2626;font-weight:600">↑${rounded}%</span>`;
        }
        return `<span style="margin-left:6px;font-size:11px;color:#16a34a;font-weight:600">↓${Math.abs(rounded)}%</span>`;
      }

      function renderCovenantActivityRegionalTable(matrix, viewType) {
        const meta =
          COV_ACTIVITY_VIEW_META[viewType] || COV_ACTIVITY_VIEW_META.deferred;
        const titleEl = document.getElementById("covActivityTableTitle");
        const subtitleEl = document.getElementById("covActivityTableSubtitle");
        const headerEl = document.getElementById("covActivityTableHeader");
        const bodyEl = document.getElementById("covActivityTableBody");
        if (!bodyEl) return;

        const statusWord =
          viewType === "waived"
            ? "waived"
            : viewType === "deleted"
            ? "deleted & deactivated"
            : "deferred";

        if (titleEl) {
          titleEl.textContent = meta.title.replace(" Covenants", " Covenants by Region");
          if (viewType === "deleted") {
            titleEl.textContent = "Deleted & Deactivated Covenants by Region";
          } else if (viewType === "waived") {
            titleEl.textContent = "Waived Covenants by Region";
          } else {
            titleEl.textContent = "Deferred Covenants by Region";
          }
        }
        if (subtitleEl) {
          subtitleEl.textContent = `Regional breakdown of ${statusWord} activity across 3 months from visible months`;
        }

        const monthLabels = matrix.labels || [];
        if (headerEl) {
          headerEl.innerHTML =
            `<th class="px-3 py-3 text-xs font-semibold text-gray-700 tracking-wider whitespace-nowrap">Region</th>` +
            monthLabels
              .map(
                (label) =>
                  `<th class="px-2 py-3 text-xs font-semibold text-gray-700 tracking-wider text-center">${label}</th>`
              )
              .join("") +
            `<th class="px-2 py-3 text-xs font-semibold text-gray-700 tracking-wider text-center">Total</th>` +
            `<th class="px-2 py-3 text-xs font-semibold text-gray-700 tracking-wider text-center">% of Total</th>`;
        }

        const regions = matrix.regions || ["Americas", "EMEA", "APAC"];
        const grandTotal = (matrix.totals || []).reduce((a, b) => a + b, 0);
        const tableTitle =
          (titleEl && titleEl.textContent) ||
          meta.title.replace(" Covenants", " Covenants by Region") ||
          "Deferred Covenants by Region";
        if (!grandTotal) {
          const colCount = Math.max(3, (monthLabels.length || 0) + 3);
          bodyEl.innerHTML = generateTableEmptyStateRow(colCount, tableTitle);
          return;
        }
        const rows = [...regions, "Global"];

        bodyEl.innerHTML = rows
          .map((region, rIdx) => {
            const values =
              region === "Global"
                ? matrix.totals || monthLabels.map(() => 0)
                : (matrix.byRegion && matrix.byRegion[region]) ||
                  monthLabels.map(() => 0);
            const rowTotal = values.reduce((a, b) => a + b, 0);
            const pct =
              grandTotal > 0 ? ((rowTotal / grandTotal) * 100).toFixed(1) : "0.0";
            const isGlobal = region === "Global";
            const rowClass = isGlobal
              ? "bg-gray-50 font-semibold text-gray-900"
              : rIdx % 2 === 0
              ? "bg-white"
              : "bg-gray-50";
            const cells = values
              .map((val, idx) => {
                const delta =
                  idx === 0 ? "" : formatDeltaPct(val, values[idx - 1]);
                return `<td class="px-2 py-3 text-sm text-center text-gray-700 whitespace-nowrap"><span style="display:inline-flex;align-items:center;justify-content:center;gap:0;width:100%">${val}${delta}</span></td>`;
              })
              .join("");
            return `<tr class="${rowClass}">
              <td class="px-3 py-3 text-sm text-gray-800 whitespace-nowrap">${region}</td>
              ${cells}
              <td class="px-2 py-3 text-sm text-center text-gray-800 whitespace-nowrap">${rowTotal}</td>
              <td class="px-2 py-3 text-sm text-center text-gray-600 whitespace-nowrap">${pct}%</td>
            </tr>`;
          })
          .join("");
      }

      function normalizeRelKey(value) {
        const s = String(value || "").trim().toLowerCase();
        if (!s) return "";
        const m = s.match(/^(rel)0*(\d+)$/i);
        if (m) return m[1] + m[2];
        return s;
      }

      function activityRowMatchesSelectedRegions(row, actRegions) {
        if (!actRegions || !actRegions.length) return true;
        const raw = String(getActivityField(row, ["Region"]) || "")
          .trim()
          .toUpperCase();
        if (!raw) return false;

        return actRegions.some((region) => {
          const fr = String(region || "").trim().toUpperCase();
          if (!fr) return false;
          if (raw === fr) return true;

          // Umbrella "Americas" matches NAM/LATAM; NAM must not match LATAM
          if (fr === "AMERICAS" || fr === "AMER") {
            return (
              raw === "NAM" ||
              raw === "LATAM" ||
              raw === "AMERICAS" ||
              raw === "AMER" ||
              normalizeActivityRegion(raw) === "Americas"
            );
          }
          if (fr === "NAM" || fr === "LATAM") {
            return raw === fr;
          }
          if (fr === "EMEA" || fr === "APAC") {
            return raw === fr || normalizeActivityRegion(raw) === fr;
          }
          return normalizeActivityRegion(raw) === normalizeActivityRegion(fr);
        });
      }

      function filterCovenantActivityRows(rows) {
        const source = Array.isArray(rows) ? rows : [];

        const actRegions =
          typeof selectedRegions !== "undefined" && selectedRegions.length > 0
            ? selectedRegions.map((r) => String(r).toUpperCase())
            : selectedRegion &&
              selectedRegion !== "all" &&
              selectedRegion !== "multi"
            ? [String(selectedRegion).toUpperCase()]
            : [];

        const hasProduct =
          typeof selectedProducts !== "undefined" && selectedProducts.length > 0;
        const hasUw =
          typeof selectedUnderwriters !== "undefined" &&
          selectedUnderwriters.length > 0;
        const hasTeam =
          typeof selectedTeamLeads !== "undefined" &&
          selectedTeamLeads.length > 0;
        const hasSearch = !!(
          selectedSearchTerm && String(selectedSearchTerm).trim()
        );
        const hasAnyFilter =
          actRegions.length > 0 || hasProduct || hasUw || hasTeam || hasSearch;

        if (!hasAnyFilter) return source.slice();

        const productFields = [
          "Product Program Name",
          "Product_Program_Name",
          "Product_Program",
          "Product Program",
        ];
        const uwFields = [
          "Underwriter",
          "Lead_Underwriter",
          "Lead Underwriter",
        ];
        const teamFields = [
          "Underwriting Team Lead",
          "Underwriting_Team_Lead",
        ];
        const products = hasProduct
          ? selectedProducts.map((p) => String(p).toLowerCase())
          : [];
        const uws = hasUw
          ? selectedUnderwriters.map((u) => String(u).toLowerCase())
          : [];
        const leads = hasTeam
          ? selectedTeamLeads.map((u) => String(u).toLowerCase())
          : [];

        const activityHasProduct = source.some((r) =>
          getActivityField(r, productFields)
        );
        const activityHasUw = source.some((r) => getActivityField(r, uwFields));
        const activityHasTeam = source.some((r) =>
          getActivityField(r, teamFields)
        );

        // 1) Direct filters on activity rows when those fields exist
        let filtered = source.filter((row) => {
          if (
            actRegions.length > 0 &&
            !activityRowMatchesSelectedRegions(row, actRegions)
          ) {
            return false;
          }
          if (hasProduct && activityHasProduct) {
            const val = String(
              getActivityField(row, productFields) || ""
            ).toLowerCase();
            if (!val || !products.includes(val)) return false;
          }
          if (hasUw && activityHasUw) {
            const val = String(
              getActivityField(row, uwFields) || ""
            ).toLowerCase();
            if (!val || !uws.includes(val)) return false;
          }
          if (hasTeam && activityHasTeam) {
            const val = String(
              getActivityField(row, teamFields) || ""
            ).toLowerCase();
            if (!val || !leads.includes(val)) return false;
          }
          return true;
        });

        // 2) Always intersect with filtered covenant relationships when product /
        //    UW / team / search filters are active so Deferred tracks the page filters.
        if (hasProduct || hasUw || hasTeam || hasSearch) {
          const covRows =
            typeof getCovenantPageDataSource === "function"
              ? getCovenantPageDataSource() || []
              : [];

          if (!covRows.length) return [];

          const relIds = new Set();
          const caNums = new Set();
          covRows.forEach((row) => {
            const id = normalizeRelKey(row.Relationship_ID);
            const ca = String(row.CA_Number || "")
              .trim()
              .toLowerCase();
            if (id) relIds.add(id);
            if (ca) caNums.add(ca);
          });

          const bridged = filtered.filter((row) => {
            const id = normalizeRelKey(
              getActivityField(row, ["Relationship ID", "Relationship_ID"])
            );
            const ca = String(
              getActivityField(row, ["CA Number", "CA_Number"]) || ""
            )
              .trim()
              .toLowerCase();
            return (id && relIds.has(id)) || (ca && caNums.has(ca));
          });

          // If Rel/CA keys don't overlap, fall back to direct field-filtered rows
          // (dummy/real activity that carries Product/UW columns).
          if (
            bridged.length > 0 ||
            !(
              (hasProduct && activityHasProduct) ||
              (hasUw && activityHasUw) ||
              (hasTeam && activityHasTeam)
            )
          ) {
            filtered = bridged;
          }
        }

        if (hasSearch) {
          const searchLower = String(selectedSearchTerm).toLowerCase();
          filtered = filtered.filter((row) => {
            const hay = [
              getActivityField(row, ["Relationship Name", "Relationship_Name"]),
              getActivityField(row, ["Relationship ID", "Relationship_ID"]),
              getActivityField(row, ["CA Number", "CA_Number"]),
              getActivityField(row, ["Covenant Number", "Covenant_Number"]),
              getActivityField(row, ["Region"]),
              getActivityField(row, [
                "Covenant Compliance",
                "Covenant_Compliance",
              ]),
              getActivityField(row, productFields),
              getActivityField(row, uwFields),
            ]
              .map((v) => String(v || "").toLowerCase())
              .join(" ");
            return hay.includes(searchLower);
          });
        }

        return filtered;
      }

      window.filterCovenantActivityRows = filterCovenantActivityRows;

      function updateCovenantActivityView(viewType) {
        currentCovActivityView = viewType || "deferred";
        window.currentCovActivityView = currentCovActivityView;
        const meta =
          COV_ACTIVITY_VIEW_META[currentCovActivityView] ||
          COV_ACTIVITY_VIEW_META.deferred;
        const titleEl = document.getElementById("covActivityViewTitle");
        const subEl = document.getElementById("covActivityViewSubtitle");
        if (titleEl) titleEl.textContent = meta.title;
        if (subEl) subEl.textContent = meta.subtitle;

        const rawRows =
          (window.covenantsActivityData && window.covenantsActivityData.length
            ? window.covenantsActivityData
            : null) ||
          covenantsActivityData ||
          [];
        const rows = filterCovenantActivityRows(rawRows);
        const matrix = buildCovenantActivityMatrix(
          rows,
          currentCovActivityView
        );
        createCovenantActivityChart(matrix);
        renderCovenantActivityRegionalTable(matrix, currentCovActivityView);
      }

      function updateCovenantActivitySection() {
        updateCovenantActivityView(currentCovActivityView || "deferred");
      }

      window.updateCovenantActivitySection = updateCovenantActivitySection;
      window.updateCovenantActivityView = updateCovenantActivityView;



      // ===== Covenant Insights (from Past Due expanded charts) =====
      const covInsightChartInstances = {
        agingByRegion: null,
        productDonut: null,
      };

      function getFilteredPastDueCovenants() {
        const raw =
          typeof getCovenantPageDataSource === "function"
            ? getCovenantPageDataSource()
            : covenantsData || [];
        return (raw || []).filter((row) => isCovenantPastDue(row));
      }

      function destroyInsightChart(key) {
        if (covInsightChartInstances[key]) {
          covInsightChartInstances[key].destroy();
          covInsightChartInstances[key] = null;
        }
      }

      function buildInsightRegionalAging(pastDueRows) {
        const regions = ["APAC", "EMEA", "NAM", "LATAM"];
        const regionalAgingData = {};
        regions.forEach((region) => {
          regionalAgingData[region] = {
            "1-30": 0,
            "31-45": 0,
            "46-60": 0,
            "61-90": 0,
            ">90": 0,
            comingDue: 0,
          };
        });

        pastDueRows.forEach((row) => {
          const region = String(row.Region || "").trim().toUpperCase();
          if (!regionalAgingData[region]) return;
          const category = String(row.Past_Due_Category || "").trim();
          const days = Number(row.Days_Past_Due) || 0;

          if (category === ">90 Days" || category === "90+ Days") {
            regionalAgingData[region][">90"]++;
          } else if (category === "61-90 Days") {
            regionalAgingData[region]["61-90"]++;
          } else if (category === "46-60 Days") {
            regionalAgingData[region]["46-60"]++;
          } else if (category === "31-45 Days") {
            regionalAgingData[region]["31-45"]++;
          } else if (
            category === "0-30 Days" ||
            category === "1-30 Days" ||
            category === "1-45 Days"
          ) {
            if (category === "1-45 Days" && days > 30) {
              regionalAgingData[region]["31-45"]++;
            } else {
              regionalAgingData[region]["1-30"]++;
            }
          }
        });

        return regionalAgingData;
      }

      function buildInsightProductData(covenantRows) {
        // Total active covenants by Product_Program (entire filtered file — not Past Due only)
        const byProduct = {};
        (covenantRows || []).forEach((row) => {
          const product = getCovenantProductProgram(row);
          if (!product || product === "Unknown") return;
          const region = String(row.Region || "").trim().toUpperCase();
          if (!byProduct[product]) {
            byProduct[product] = {
              count: 0,
              regionalBreakdown: { NAM: 0, LATAM: 0, EMEA: 0, APAC: 0 },
              statusBreakdown: { pastDue: 0, comingDue: 0, other: 0 },
              relationships: new Set(),
            };
          }
          byProduct[product].count++;
          const relKey = getCovenantRelationshipKey(row);
          if (relKey) byProduct[product].relationships.add(relKey);
          if (byProduct[product].regionalBreakdown[region] !== undefined) {
            byProduct[product].regionalBreakdown[region]++;
          }
          if (typeof isCovenantPastDue === "function" && isCovenantPastDue(row)) {
            byProduct[product].statusBreakdown.pastDue++;
          } else if (
            typeof isCovenantComingDue === "function" &&
            isCovenantComingDue(row)
          ) {
            byProduct[product].statusBreakdown.comingDue++;
          } else {
            byProduct[product].statusBreakdown.other++;
          }
        });

        return Object.entries(byProduct).sort((a, b) => b[1].count - a[1].count);
      }

      function updateCovenantInsightsSection() {
        if (typeof ApexCharts === "undefined") return;
        const pastDueRows = getFilteredPastDueCovenants();
        const allActiveRows =
          typeof getCovenantPageDataSource === "function"
            ? getCovenantPageDataSource() || []
            : [];
        const regionOrder = ["APAC", "EMEA", "NAM", "LATAM"];
        const regionalAgingData = buildInsightRegionalAging(pastDueRows);
        const productData = buildInsightProductData(allActiveRows);
        const totalCovenants = allActiveRows.length;

        // --- Aging Severity by Region (stacked) ---
        const agingParts = ensureInsightAgingStructure();
        const agingRegionEl = agingParts && agingParts.chart;
        if (agingRegionEl || document.getElementById("covInsightAgingHost")) {
          destroyInsightChart("agingByRegion");
          const regionsWithData = regionOrder.filter((r) => {
            const d = regionalAgingData[r] || {};
            return (
              (d["1-30"] || 0) +
                (d["31-45"] || 0) +
                (d["46-60"] || 0) +
                (d["61-90"] || 0) +
                (d[">90"] || 0) >
              0
            );
          });
          if (regionsWithData.length === 0) {
            renderCenteredEmptyState(
              "covInsightAgingHost",
              "Aging Severity by Region"
            );
          } else {
            const agingReady = ensureInsightAgingStructure();
            const agingEl = agingReady && agingReady.chart;
            if (agingEl) {
              agingEl.innerHTML = "";
              covInsightChartInstances.agingByRegion = new ApexCharts(
                agingEl,
                {
                series: [
                  {
                    name: "1-45 Days",
                    data: regionsWithData.map(
                      (r) =>
                        (regionalAgingData[r]["1-30"] || 0) +
                        (regionalAgingData[r]["31-45"] || 0)
                    ),
                  },
                  {
                    name: "46-90 Days",
                    data: regionsWithData.map(
                      (r) =>
                        (regionalAgingData[r]["46-60"] || 0) +
                        (regionalAgingData[r]["61-90"] || 0)
                    ),
                  },
                  {
                    name: ">90 Days",
                    data: regionsWithData.map(
                      (r) => regionalAgingData[r][">90"] || 0
                    ),
                  },
                ],
                chart: {
                  type: "bar",
                  stacked: true,
                  height: covChartHeight(
                    document.getElementById("covInsightAgingHost") || agingEl
                  ),
                  width: "100%",
                  toolbar: { show: false },
                  fontFamily: "Outfit, sans-serif",
                  parentHeightOffset: 0,
                },
                colors: ["#fecaca", "#f87171", "#dc2626"],
                plotOptions: covStackedBarPlotOptions(),
                dataLabels: covStackedBarDataLabels(),
                xaxis: {
                  categories: regionsWithData,
                  labels: { style: { fontSize: "12px", colors: "#6B7280" } },
                },
                yaxis: {
                  labels: { style: { fontSize: "11px", colors: "#6B7280" } },
                },
                legend: {
                  position: "top",
                  horizontalAlign: "left",
                  fontSize: "12px",
                },
                grid: { borderColor: "#F3F4F6", strokeDashArray: 4, padding: { top: 16 } },
                tooltip: {
                  enabled: true,
                  theme: "light",
                  custom: function ({ series, dataPointIndex }) {
                    const region = regionsWithData[dataPointIndex] || "Region";
                    const breakdownRows = [
                      {
                        label: "1-45 Days",
                        value: (series[0] && series[0][dataPointIndex]) || 0,
                      },
                      {
                        label: "46-90 Days",
                        value: (series[1] && series[1][dataPointIndex]) || 0,
                      },
                      {
                        label: ">90 Days",
                        value: (series[2] && series[2][dataPointIndex]) || 0,
                      },
                    ];
                    const count = breakdownRows.reduce(
                      (sum, row) => sum + (Number(row.value) || 0),
                      0
                    );
                    return buildCovenantStyleTooltip({
                      title: region,
                      subtitle: "Aging severity by region",
                      count,
                      total: pastDueRows.length,
                      relationships: countUniqueRelationships(
                        pastDueRows.filter(
                          (row) =>
                            String(row.Region || "")
                              .trim()
                              .toUpperCase() === region
                        )
                      ),
                      breakdownTitle: "Aging Buckets",
                      breakdownRows,
                      col1: "Bucket",
                      col2: "Count",
                    });
                  },
                },
              }
            );
            covInsightChartInstances.agingByRegion.render();
            const pdTotal = pastDueRows.length;
            let worstRegion = "";
            let worstCount = 0;
            regionsWithData.forEach((r) => {
              const d = regionalAgingData[r] || {};
              const n =
                (d["1-30"] || 0) +
                (d["31-45"] || 0) +
                (d["46-60"] || 0) +
                (d["61-90"] || 0) +
                (d[">90"] || 0);
              if (n > worstCount) {
                worstCount = n;
                worstRegion = r;
              }
            });
            const gt90All = regionsWithData.reduce(
              (s, r) => s + ((regionalAgingData[r] || {})[">90"] || 0),
              0
            );
            setCovInsight(
              "covInsightAgingByRegionInsight",
              worstRegion && pdTotal
                ? worstRegion +
                    " has the most past-due covenants (" +
                    worstCount.toLocaleString() +
                    ", " +
                    ((worstCount / pdTotal) * 100).toFixed(1) +
                    "%). " +
                    gt90All.toLocaleString() +
                    " are in the >90 Days bucket."
                : ""
            );
            }
          }
        }

        // --- Covenants by Product Program (donut + list) ---
        destroyInsightChart("productDonut");
        if (!productData.length || totalCovenants === 0) {
          renderCenteredEmptyState(
            "covInsightProductHost",
            "Covenants by Product Program"
          );
        } else {
          const productParts = ensureInsightProductStructure();
          const donutEl = productParts && productParts.donut;
          const listEl = productParts && productParts.list;
          if (donutEl) {
            donutEl.innerHTML = "";
            if (listEl) listEl.innerHTML = "";
            const colors = [
              "#3641f5",
              "#7592ff",
              "#dde9ff",
              "#ff6b6b",
              "#ffd93d",
              "#6bcf7f",
              "#c084fc",
            ];
            const displayProducts = productData.slice(0, 8);

            if (listEl) {
              listEl.innerHTML = displayProducts
                .map(([program, data], index) => {
                  const color = colors[index % colors.length];
                  const count = data.count;
                  const percentage = ((count / totalCovenants) * 100).toFixed(1);
                  return `
                    <div class="flex items-center gap-3 py-2">
                      <div class="w-4 h-4 rounded-sm flex-shrink-0" style="background-color: ${color};"></div>
                      <p class="text-sm font-medium text-gray-800 flex-1">${program}</p>
                      <p class="text-sm font-semibold text-gray-900">${count} <span class="text-gray-500 font-normal">• ${percentage}%</span></p>
                    </div>`;
                })
                .join("");
            }

            covInsightChartInstances.productDonut = new ApexCharts(donutEl, {
              series: displayProducts.map((p) => p[1].count),
              labels: displayProducts.map((p) => p[0]),
              colors: colors.slice(0, displayProducts.length),
              chart: {
                fontFamily: "Outfit, sans-serif",
                type: "donut",
                width: 280,
                height: 280,
              },
              stroke: { show: false },
              plotOptions: {
                pie: {
                  donut: {
                    size: "65%",
                    background: "transparent",
                    labels: {
                      show: true,
                      name: {
                        show: true,
                        offsetY: -10,
                        color: "#1D2939",
                        fontSize: "14px",
                        fontWeight: "600",
                      },
                      value: {
                        show: true,
                        offsetY: 10,
                        color: "#667085",
                        fontSize: "16px",
                        fontWeight: "700",
                      },
                      total: {
                        show: true,
                        label: "Total",
                        color: "#111827",
                        fontSize: "16px",
                        fontWeight: "700",
                        formatter: function (w) {
                          return w.globals.seriesTotals.reduce(
                            (a, b) => a + b,
                            0
                          );
                        },
                      },
                    },
                  },
                },
              },
              dataLabels: { enabled: false },
              legend: { show: false },
              tooltip: {
                enabled: true,
                theme: "light",
                custom: function ({ series, seriesIndex }) {
                  const entry = displayProducts[seriesIndex];
                  const program = entry ? entry[0] : "Product";
                  const data = entry ? entry[1] : {};
                  const count = series[seriesIndex] || 0;
                  return buildCovenantStyleTooltip({
                    title: program,
                    subtitle: "Total active covenants by product program",
                    count,
                    total: totalCovenants,
                    breakdownTitle: "Status",
                    breakdownRows: [
                      {
                        label: "Past Due",
                        value:
                          (data.statusBreakdown &&
                            data.statusBreakdown.pastDue) ||
                          0,
                      },
                      {
                        label: "Coming Due",
                        value:
                          (data.statusBreakdown &&
                            data.statusBreakdown.comingDue) ||
                          0,
                      },
                      {
                        label: "Other",
                        value:
                          (data.statusBreakdown && data.statusBreakdown.other) ||
                          0,
                      },
                    ],
                    col1: "Status",
                    col2: "Count",
                    relationships:
                      (data.relationships && data.relationships.size) || 0,
                  });
                },
              },
            });
            covInsightChartInstances.productDonut.render();
            const top = displayProducts[0];
            setCovInsight(
              "covInsightProductInsight",
              top && totalCovenants
                ? top[0] +
                    " is the largest Product_Program (" +
                    top[1].count.toLocaleString() +
                    ", " +
                    ((top[1].count / totalCovenants) * 100).toFixed(1) +
                    "%)."
                : ""
            );
          }
        }
      }

      window.updateCovenantInsightsSection = updateCovenantInsightsSection;

      const covDashChartInstances = {
        actionByRegion: null,
        pastDueAging: null,
        upcomingProduct: null,
        comingDueMonth: null,
      };

      function destroyDashChart(key) {
        if (covDashChartInstances[key]) {
          try {
            covDashChartInstances[key].destroy();
          } catch (e) {
            /* ignore */
          }
          covDashChartInstances[key] = null;
        }
      }

      function renderDashEmpty(hostId, title) {
        const host = document.getElementById(hostId);
        if (host && typeof renderCenteredEmptyState === "function") {
          renderCenteredEmptyState(hostId, title);
        }
      }

      function updateCovenantDashboardViz() {
        if (typeof ApexCharts === "undefined") return;
        const rows =
          typeof getCovenantPageDataSource === "function"
            ? getCovenantPageDataSource() || []
            : [];
        const regionOrder = ["APAC", "EMEA", "NAM", "LATAM"];
        const pastDueRows = rows.filter((r) => isCovenantPastDue(r));
        const upcomingRows = rows.filter((r) => isCovenantComingDue(r));

        // --- Action Needed by Region (horizontal bar, Past Due only) ---
        const actionEl = document.getElementById("covChartActionByRegion");
        if (actionEl) {
          destroyDashChart("actionByRegion");
          const byRegion = {};
          regionOrder.forEach((r) => {
            byRegion[r] = 0;
          });
          pastDueRows.forEach((row) => {
            const region = String(row.Region || "").trim().toUpperCase();
            if (byRegion[region] === undefined) return;
            byRegion[region]++;
          });
          const regionsWithData = regionOrder.filter((r) => byRegion[r] > 0);
          const relsByRegion = {};
          regionsWithData.forEach((r) => {
            relsByRegion[r] = new Set();
          });
          pastDueRows.forEach((row) => {
            const region = String(row.Region || "").trim().toUpperCase();
            if (!relsByRegion[region]) return;
            const key = getCovenantRelationshipKey(row);
            if (key) relsByRegion[region].add(key);
          });
          const host = document.getElementById("covChartActionByRegionHost");
          if (regionsWithData.length === 0) {
            renderDashEmpty("covChartActionByRegionHost", "Action Needed by Region");
          } else {
            if (host && host.classList.contains("covenant-empty-host")) {
              host.classList.remove("covenant-empty-host");
              if (!document.getElementById("covChartActionByRegion")) {
                host.innerHTML =
                  '<div id="covChartActionByRegion" class="cov-chart-fill w-full h-full"></div>';
              }
            }
            const liveEl = document.getElementById("covChartActionByRegion");
            if (liveEl) {
              const pdData = regionsWithData.map((r) => byRegion[r]);
              const actionTotal = pdData.reduce((s, n) => s + n, 0);
              covDashChartInstances.actionByRegion = new ApexCharts(liveEl, {
                series: [{ name: "Action Needed", data: pdData }],
                chart: {
                  type: "bar",
                  height: covChartHeight(host || liveEl),
                  width: "100%",
                  toolbar: { show: false },
                  fontFamily: "Outfit, sans-serif",
                  parentHeightOffset: 0,
                },
                colors: ["#dc2626"],
                plotOptions: covSingleBarPlotOptions({
                  horizontal: true,
                  barHeight: "58%",
                }),
                dataLabels: covSingleBarDataLabels({ horizontal: true }),
                xaxis: covHBarXAxis(regionsWithData, pdData),
                yaxis: {
                  labels: { style: { fontSize: "12px", colors: "#6B7280" } },
                },
                legend: { show: false },
                grid: covHBarGrid(),
                tooltip: {
                  enabled: true,
                  custom: function ({ series, dataPointIndex }) {
                    const region = regionsWithData[dataPointIndex];
                    const pd = (series[0] && series[0][dataPointIndex]) || 0;
                    return buildCovenantStyleTooltip({
                      title: region,
                      subtitle: "Action Needed (Past Due) by region",
                      count: pd,
                      total: actionTotal,
                      relationships:
                        (relsByRegion[region] && relsByRegion[region].size) ||
                        0,
                      breakdownTitle: "Status",
                      breakdownRows: [{ label: "Past Due", value: pd }],
                    });
                  },
                },
              });
              covDashChartInstances.actionByRegion.render();
              const topRegion = regionsWithData
                .slice()
                .sort((a, b) => byRegion[b] - byRegion[a])[0];
              const topCount = topRegion ? byRegion[topRegion] : 0;
              setCovInsight(
                "covChartActionByRegionInsight",
                topRegion && actionTotal
                  ? topRegion +
                      " has the most Action Needed covenants (" +
                      topCount.toLocaleString() +
                      ", " +
                      ((topCount / actionTotal) * 100).toFixed(1) +
                      "% of Past Due)."
                  : ""
              );
            }
          }
        }

        // --- Past Due aging (vertical bar from Past Due Category) ---
        const agingEl = document.getElementById("covChartPastDueAging");
        if (agingEl) {
          destroyDashChart("pastDueAging");
          const order = [
            "0-30 Days",
            "31-45 Days",
            "46-60 Days",
            "61-90 Days",
            ">90 Days",
          ];
          const counts = {};
          order.forEach((k) => (counts[k] = 0));
          pastDueRows.forEach((row) => {
            const cat = normalizePastDueCategoryValue(row.Past_Due_Category);
            if (cat === "1-45 Days") counts["0-30 Days"]++;
            else if (counts[cat] !== undefined) counts[cat]++;
          });
          const cats = order.filter((k) => counts[k] > 0);
          const host = document.getElementById("covChartPastDueAgingHost");
          if (cats.length === 0) {
            renderDashEmpty("covChartPastDueAgingHost", "Past Due Aging");
          } else {
            if (host) host.classList.remove("covenant-empty-host");
            const liveEl = document.getElementById("covChartPastDueAging") || agingEl;
            const colorMap = {
              "0-30 Days": "#fecaca",
              "31-45 Days": "#fca5a5",
              "46-60 Days": "#f87171",
              "61-90 Days": "#ef4444",
              ">90 Days": "#b91c1c",
            };
            const totalPd = cats.reduce((s, k) => s + counts[k], 0);
            covDashChartInstances.pastDueAging = new ApexCharts(liveEl, {
              series: [{ name: "Past Due", data: cats.map((k) => counts[k]) }],
              chart: {
                type: "bar",
                height: covChartHeight(host || liveEl),
                width: "100%",
                toolbar: { show: false },
                fontFamily: "Outfit, sans-serif",
                parentHeightOffset: 0,
              },
              colors: cats.map((k) => colorMap[k]),
              plotOptions: covSingleBarPlotOptions({
                distributed: true,
                columnWidth: "48%",
              }),
              dataLabels: covSingleBarDataLabels(),
              legend: { show: false },
              xaxis: {
                categories: cats,
                labels: { style: { fontSize: "11px", colors: "#6B7280" } },
              },
              yaxis: {
                labels: { style: { fontSize: "11px", colors: "#6B7280" } },
              },
              grid: { borderColor: "#F3F4F6", strokeDashArray: 4, padding: { top: 18 } },
              grid: { borderColor: "#F3F4F6", strokeDashArray: 4 },
              tooltip: {
                enabled: true,
                custom: function ({ series, dataPointIndex }) {
                  const label = cats[dataPointIndex];
                  const count = (series[0] && series[0][dataPointIndex]) || 0;
                  return buildCovenantStyleTooltip({
                    title: label,
                    subtitle: "Past Due Category",
                    count: count,
                    total: totalPd,
                    breakdownTitle: "Share of past due",
                    breakdownRows: [{ label: label, value: count }],
                  });
                },
              },
            });
            covDashChartInstances.pastDueAging.render();
            const worst = cats.slice().sort((a, b) => counts[b] - counts[a])[0];
            setCovInsight(
              "covChartPastDueAgingInsight",
              worst && totalPd
                ? worst +
                    " is the largest past-due bucket (" +
                    counts[worst].toLocaleString() +
                    ", " +
                    ((counts[worst] / totalPd) * 100).toFixed(1) +
                    "%)."
                : ""
            );
          }
        }

        // --- Coming Due by Month (vertical bar, green) ---
        const monthEl = document.getElementById("covChartComingDueMonth");
        if (monthEl) {
          destroyDashChart("comingDueMonth");
          const timeline = buildUpcomingDueTimeline(upcomingRows);
          const host = document.getElementById("covChartComingDueMonthHost");
          if (!timeline.labels.length) {
            renderDashEmpty("covChartComingDueMonthHost", "Coming Due by Month");
          } else {
            if (host) host.classList.remove("covenant-empty-host");
            const liveEl = document.getElementById("covChartComingDueMonth") || monthEl;
            const totalUp = upcomingRows.length;
            covDashChartInstances.comingDueMonth = new ApexCharts(liveEl, {
              series: [{ name: "Coming Due", data: timeline.counts }],
              chart: {
                type: "bar",
                height: covChartHeight(host || liveEl),
                width: "100%",
                toolbar: { show: false },
                fontFamily: "Outfit, sans-serif",
                parentHeightOffset: 0,
              },
              colors: ["#16a34a"],
              plotOptions: covSingleBarPlotOptions({ columnWidth: "46%" }),
              dataLabels: covSingleBarDataLabels(),
              xaxis: {
                categories: timeline.labels,
                labels: { style: { fontSize: "12px", colors: "#6B7280" } },
              },
              yaxis: {
                labels: { style: { fontSize: "11px", colors: "#6B7280" } },
              },
              grid: { borderColor: "#F3F4F6", strokeDashArray: 4, padding: { top: 18 } },
              grid: { borderColor: "#F3F4F6", strokeDashArray: 4 },
              tooltip: {
                enabled: true,
                custom: function ({ series, dataPointIndex }) {
                  const label = timeline.labels[dataPointIndex];
                  const count = (series[0] && series[0][dataPointIndex]) || 0;
                  return buildCovenantStyleTooltip({
                    title: label,
                    subtitle: "Coming Due by Covenant Due Date month",
                    count: count,
                    total: totalUp,
                    relationships: countUniqueRelationships(
                      upcomingRows.filter((row) => {
                        const d = parseDate(row && row.Covenant_Due_Date);
                        if (!d) return false;
                        const key =
                          d.getFullYear() +
                          "-" +
                          String(d.getMonth() + 1).padStart(2, "0");
                        return key === (timeline.keys && timeline.keys[dataPointIndex]);
                      })
                    ),
                    breakdownTitle: "Month",
                    breakdownRows: [{ label: label, value: count }],
                  });
                },
              },
            });
            covDashChartInstances.comingDueMonth.render();
            let peakIdx = 0;
            timeline.counts.forEach((n, i) => {
              if (n > timeline.counts[peakIdx]) peakIdx = i;
            });
            const peakCount = timeline.counts[peakIdx] || 0;
            setCovInsight(
              "covChartComingDueMonthInsight",
              totalUp && peakCount
                ? timeline.labels[peakIdx] +
                    " has the largest Coming Due volume (" +
                    peakCount.toLocaleString() +
                    ", " +
                    ((peakCount / totalUp) * 100).toFixed(1) +
                    "%)."
                : ""
            );
          }
        }
      }

      window.updateCovenantDashboardViz = updateCovenantDashboardViz;






      let historicalTrendsData = [];
      let ccmData = []; // CCM (Credit Committee Memos) data from CCM_current.xlsx
      let ccmDataPrevious = []; // Previous month CCM data from CCM_previous.xlsx
      let filteredData = [];

      // Global constant for excluded facility types (used across multiple charts)
      const EXCLUDED_FACILITY_TYPES = [
        "Cash Management-DOL",
        "Cash Management-ACH",
        "Settlement",
        "Overdraft Line",
        "Collateral Monitoring Line",
        "Outgoing TPC",
        "Credit Card",
        "Guaranty",
        "Cash Management-Other",
        "B&I Margin Loan",
        "Cash Management-BACS",
        "SAFE - Prime Finance",
        "Clearing",
        "Agency Clearing",
        "SAFE - Financing",
        "B&I Short Market Values",
        "Residential First Mortgage-Standard",
        "B&I Non-Purpose Loan",
        "Unallocated",
      ];

      // ===== DATA MODE =====
      // Covenants: Confluence Excel by default; override for local testing:
      //   - window.COVENANTS_ENABLE_DUMMY_DATA = true (set before covenants.js)
      //   - or open page with ?dummy=1
      // Activity (Deferred/Waived/Deleted): dummy by default
      const ENABLE_DUMMY_DATA =
        (typeof window !== "undefined" &&
          window.COVENANTS_ENABLE_DUMMY_DATA === true) ||
        (typeof location !== "undefined" &&
          /(?:\?|&)dummy=1(?:&|$)/.test(String(location.search || ""))) ||
        false;
      const ENABLE_DUMMY_ACTIVITY =
        typeof window !== "undefined" &&
        window.COVENANTS_ENABLE_DUMMY_ACTIVITY === false
          ? false
          : true;

      console.log(
        "[Covenants] Data mode → covenants:",
        ENABLE_DUMMY_DATA ? "DUMMY" : "Confluence",
        "| activity:",
        ENABLE_DUMMY_ACTIVITY ? "DUMMY" : "Confluence"
      );

      if (ENABLE_DUMMY_DATA) {
        // Generate comprehensive dummy data for testing
        const regions = ["NAM", "EMEA", "APAC", "LATAM"];
        const productPrograms = [
          "Corporate Lending",
          "Trade Finance",
          "Working Capital",
          "Project Finance",
          "Real Estate",
          "Asset Based Lending",
          "Equipment Finance",
          "Supply Chain Finance",
        ];
        const facilityTypes = [
          "Revolver",
          "Term Loan",
          "Overdraft",
          "Bridge Loan",
          "Construction Loan",
          "LOC",
          "Guarantee",
          "SBLC",
        ];
        const creditClass = [
          "PASS",
          "SPECIAL MENTION",
          "SUBSTANDARD",
          "DOUBTFUL",
        ];
        const underwriters = [
          "John Smith",
          "Sarah Johnson",
          "David Lee",
          "Carlos Rodriguez",
          "Robert Brown",
          "Lisa Anderson",
          "Mike Wilson",
          "Emily Chen",
          "Tom Harris",
          "Anna Martinez",
        ];
        const orginationUnits = [
          "Commercial Banking",
          "Investment Banking",
          "SME Banking",
          "Structured Finance",
          "Real Estate Finance",
          "Trade Services",
        ];

        portfolioData = [];

        // Generate 50 portfolio records
        for (let i = 1; i <= 50; i++) {
          const region = regions[i % regions.length];
          const productProgram = productPrograms[i % productPrograms.length];
          const facilityType = facilityTypes[i % facilityTypes.length];
          const underwriter = underwriters[i % underwriters.length];
          const baseAmount = i * 1000000 + Math.random() * 5000000;

          // Create some expiring items (20% of records) within next 3 months from Nov 30, 2024
          // Create some expired items (15% of records) before Nov 30, 2024
          const isExpiring = i % 5 === 0;
          const isExpired = i % 7 === 0;
          let expiryDate;
          let caExpiryDate;

          if (isExpired && !isExpiring) {
            // Expired: Aug-Oct 2024 (before Nov 30, 2024)
            const randomMonth = Math.floor(Math.random() * 3); // 0, 1, or 2
            const month = 7 + randomMonth; // 7 (Aug), 8 (Sep), 9 (Oct)
            expiryDate = new Date(
              2024,
              month,
              Math.floor(Math.random() * 28) + 1
            )
              .toISOString()
              .split("T")[0];
            caExpiryDate = new Date(
              2024,
              month,
              Math.floor(Math.random() * 28) + 1
            )
              .toISOString()
              .split("T")[0];
          } else if (isExpiring) {
            // Expiring: Next 3 months: Dec 2024, Jan 2025, Feb 2025
            const randomMonth = Math.floor(Math.random() * 3); // 0, 1, or 2
            const month = 11 + randomMonth; // 11 (Dec), 12 (Jan), 13 (Feb)
            const year = month > 11 ? 2025 : 2024;
            const actualMonth = month > 11 ? month - 12 : month;
            expiryDate = new Date(
              year,
              actualMonth,
              Math.floor(Math.random() * 28) + 1
            )
              .toISOString()
              .split("T")[0];
            caExpiryDate = new Date(
              year,
              actualMonth,
              Math.floor(Math.random() * 28) + 1
            )
              .toISOString()
              .split("T")[0];
          } else {
            expiryDate = new Date(
              2026,
              Math.floor(Math.random() * 12),
              Math.floor(Math.random() * 28) + 1
            )
              .toISOString()
              .split("T")[0];
            caExpiryDate = new Date(
              2026,
              Math.floor(Math.random() * 12),
              Math.floor(Math.random() * 28) + 1
            )
              .toISOString()
              .split("T")[0];
          }

          // Create new deals (30% are from current month, 20% from last month)
          let originationDate;
          let facilityFirstApprovalDate = null;

          if (i % 10 < 3) {
            originationDate =
              "2024-11-" +
              (Math.floor(Math.random() * 20) + 1).toString().padStart(2, "0");
            // For NAM, LATAM, EMEA: set Facility_First_Approval_Date to current month
            if (region === "NAM" || region === "LATAM" || region === "EMEA") {
              facilityFirstApprovalDate =
                "2024-11-" +
                (Math.floor(Math.random() * 20) + 1)
                  .toString()
                  .padStart(2, "0");
            }
          } else if (i % 10 < 5) {
            originationDate =
              "2024-10-" +
              (Math.floor(Math.random() * 20) + 1).toString().padStart(2, "0");
            // For NAM, LATAM, EMEA: set Facility_First_Approval_Date to previous month
            if (region === "NAM" || region === "LATAM" || region === "EMEA") {
              facilityFirstApprovalDate =
                "2024-10-" +
                (Math.floor(Math.random() * 20) + 1)
                  .toString()
                  .padStart(2, "0");
            }
          } else {
            originationDate =
              "2024-" +
              (Math.floor(Math.random() * 9) + 1).toString().padStart(2, "0") +
              "-15";
            // Older facilities - no recent approval date
            facilityFirstApprovalDate = null;
          }

          // APAC doesn't have Facility_First_Approval_Date (different logic)
          if (region === "APAC") {
            facilityFirstApprovalDate = null;
          }

          portfolioData.push({
            Report_Date: "2024-11-30",
            Region: region,
            Origination_Unit: orginationUnits[i % orginationUnits.length],
            Underwriting_Team_Lead: underwriter,
            Lead_Underwriter: underwriter,
            Product_Underwriter: underwriters[(i + 1) % underwriters.length],
            Relationship_ID: "REL" + i.toString().padStart(3, "0"),
            Relationship_Name: `${region} Company ${i}`,
            Borrowers_Name: `Borrower ${i}`,
            CA_Number: "CA2024" + i.toString().padStart(3, "0"),
            Facility_ID: "FAC2024" + i.toString().padStart(3, "0"),
            Facility_Number: "F" + i.toString().padStart(3, "0"),
            Product_Program: productProgram,
            Product_Program_Name: productProgram,
            Facility_Type: facilityType,
            Fac_Amount: baseAmount,
            Facility_Amount: baseAmount,
            OSUC: baseAmount * (0.7 + Math.random() * 0.2),
            Total_OS: baseAmount * (0.5 + Math.random() * 0.3),
            Unused_Commitment: baseAmount * (0.1 + Math.random() * 0.2),
            Credit_Classification: creditClass[i % creditClass.length],
            Management_Status: i % 3 === 0 ? "DM" : "CM",
            CA_Review:
              region === "EMEA" && i % 2 === 0
                ? "Yes"
                : region === "EMEA"
                ? "No"
                : "",
            "PSE_non-PSE": i % 4 === 0 ? "PSE" : "non-PSE",
            PSE_non_PSE: i % 4 === 0 ? "PSE" : "non-PSE",
            Commitment_Type: i % 3 === 0 ? "Uncommitted" : "Committed",
            Committed_Uncommitted: i % 3 === 0 ? "UNCOMMITTED" : "COMMITTED",
            Maturity_Date: expiryDate,
            Origination_Date: originationDate,
            Facility_First_Approval_Date: facilityFirstApprovalDate,
            CA_Expiry_Date: caExpiryDate,
            CA_Expiration_Date: caExpiryDate,
            ROTCE: 8 + Math.random() * 15,
          });
        }

        console.log(
          "📦 Generating dummy data for Pipeline (Deals Pending Closure)..."
        );

        // Add specific dummy data for Pipeline (Deals Pending Closure)
        // Criteria: No Origination_Date, Has Facility_First_Approval_Date (current year), NAM/LATAM only, non-PSE
        const pipelineProducts = [
          "Corporate Lending",
          "Trade Finance",
          "Working Capital",
          "Project Finance",
          "Asset Based Lending",
          "Equipment Finance",
        ];
        const pipelineFacilityTypes = [
          "Revolver",
          "Term Loan",
          "Bridge Loan",
          "LOC",
          "Guarantee",
          "SBLC",
        ];
        const pipelineUnderwriters = [
          "John Smith",
          "Sarah Johnson",
          "David Lee",
          "Carlos Rodriguez",
          "Robert Brown",
          "Maria Garcia",
          "Michael Chen",
          "Jennifer Martinez",
          "James Wilson",
          "Patricia Anderson",
        ];
        const pipelineRegions = ["NAM", "LATAM"];
        const pipelineRelationships = [
          "TechCorp Industries",
          "Global Manufacturing",
          "Energy Solutions Inc",
          "Retail Holdings LLC",
          "Healthcare Systems",
          "Financial Services Co",
          "Transportation Group",
          "Construction Partners",
          "Telecom Networks",
          "Food & Beverage Corp",
        ];

        // Create 45 pending deals for better pagination testing
        for (let i = 1; i <= 45; i++) {
          const region = pipelineRegions[i % pipelineRegions.length];
          const productProgram = pipelineProducts[i % pipelineProducts.length];
          const facilityType =
            pipelineFacilityTypes[i % pipelineFacilityTypes.length];
          const underwriter =
            pipelineUnderwriters[i % pipelineUnderwriters.length];
          const relationship =
            pipelineRelationships[i % pipelineRelationships.length];
          const baseAmount = i * 1500000 + Math.random() * 10000000; // Vary amounts more

          // Create approval dates throughout current year with different aging buckets
          // Distribute across: 1-30 days (25%), 31-60 days (25%), 61-90 days (25%), >90 days (25%)
          let daysOld;
          if (i % 4 === 0) {
            daysOld = Math.floor(Math.random() * 30) + 1; // 1-30 days
          } else if (i % 4 === 1) {
            daysOld = Math.floor(Math.random() * 30) + 31; // 31-60 days
          } else if (i % 4 === 2) {
            daysOld = Math.floor(Math.random() * 30) + 61; // 61-90 days
          } else {
            daysOld = Math.floor(Math.random() * 90) + 91; // 91-180 days
          }

          // Calculate approval date based on daysOld (using current year)
          const today = new Date(); // Use actual current date
          today.setHours(0, 0, 0, 0);
          const approvalDate = new Date(today);
          approvalDate.setDate(approvalDate.getDate() - daysOld);
          const facilityFirstApprovalDate = approvalDate
            .toISOString()
            .split("T")[0];

          // Future maturity dates (not expiring/expired)
          const futureYear = 2026 + (i % 2);
          const futureMonth = Math.floor(Math.random() * 12);
          const expiryDate = new Date(
            futureYear,
            futureMonth,
            Math.floor(Math.random() * 28) + 1
          )
            .toISOString()
            .split("T")[0];
          const caExpiryDate = new Date(
            futureYear,
            futureMonth,
            Math.floor(Math.random() * 28) + 1
          )
            .toISOString()
            .split("T")[0];

          // Alternate Management_Status: ~50% DM, ~50% CM
          const managementStatus = i % 2 === 0 ? "DM" : "CM";

          portfolioData.push({
            Report_Date: new Date().toISOString().split("T")[0], // Use current date
            Region: region,
            Origination_Unit: orginationUnits[i % orginationUnits.length],
            Underwriting_Team_Lead: underwriter,
            Lead_Underwriter: underwriter,
            Product_Underwriter:
              pipelineUnderwriters[(i + 1) % pipelineUnderwriters.length],
            Relationship_ID: "PIPELINE_REL" + i.toString().padStart(3, "0"),
            Relationship_Name: `${relationship} - ${region}`,
            Borrowers_Name: relationship,
            CA_Number:
              "PIPELINECA" +
              new Date().getFullYear() +
              i.toString().padStart(3, "0"),
            Facility_ID:
              "PIPELINEFAC" +
              new Date().getFullYear() +
              i.toString().padStart(3, "0"),
            Facility_Number: "PF" + i.toString().padStart(3, "0"),
            Product_Program: productProgram,
            Product_Program_Name: productProgram,
            Facility_Type: facilityType,
            Fac_Amount: baseAmount,
            Facility_Amount: baseAmount,
            OSUC: baseAmount * 0.05, // Very low OSUC (deal is pending)
            Total_OS: baseAmount * 0.02, // Very low outstanding (deal is pending)
            Unused_Commitment: baseAmount * 0.98,
            Credit_Classification: creditClass[i % creditClass.length],
            Management_Status: managementStatus, // 50% DM, 50% CM for testing filter
            "DM/CM": managementStatus, // Also add alternative field name
            CA_Review: region === "EMEA" ? "No" : "",
            "PSE_non-PSE": "non-PSE", // Must be non-PSE for pipeline
            PSE_non_PSE: "non-PSE",
            Commitment_Type: "Committed",
            Committed_Uncommitted: "COMMITTED",
            Maturity_Date: expiryDate,
            Origination_Date: "", // EMPTY - this is the key criteria for pending closure
            Facility_First_Approval_Date: facilityFirstApprovalDate, // Has approval date in current year
            CA_Expiry_Date: caExpiryDate,
            CA_Expiration_Date: caExpiryDate,
            ROTCE: 12 + Math.random() * 8,
          });
        }

        console.log(
          "✅ Generated 45 Pipeline (Deals Pending Closure) dummy records with DM/CM distribution"
        );
        const samplePipelineDeal = portfolioData.filter(
          (d) => d.Facility_ID && d.Facility_ID.startsWith("PIPELINEFAC")
        )[0];
        console.log("📊 Sample pipeline deal:", {
          Facility_ID: samplePipelineDeal?.Facility_ID,
          Management_Status: samplePipelineDeal?.Management_Status,
          "DM/CM": samplePipelineDeal?.["DM/CM"],
          Origination_Date: samplePipelineDeal?.Origination_Date,
          Facility_First_Approval_Date:
            samplePipelineDeal?.Facility_First_Approval_Date,
          Region: samplePipelineDeal?.Region,
          Report_Date: samplePipelineDeal?.Report_Date,
        });
        const pipelineDeals = portfolioData.filter(
          (d) => d.Facility_ID && d.Facility_ID.startsWith("PIPELINEFAC")
        );
        const dmCount = pipelineDeals.filter(
          (d) => d.Management_Status === "DM"
        ).length;
        const cmCount = pipelineDeals.filter(
          (d) => d.Management_Status === "CM"
        ).length;
        console.log(
          `📊 Pipeline DM/CM Distribution: DM=${dmCount}, CM=${cmCount}`
        );
        console.log(
          `📅 Current Year: ${new Date().getFullYear()}, Sample Approval Year: ${new Date(
            samplePipelineDeal?.Facility_First_Approval_Date
          ).getFullYear()}`
        );

        // Add covenants data (200 covenant records — richer for expand/KPI testing)
        covenantsData = [];
        for (let i = 1; i <= 200; i++) {
          const region = regions[i % regions.length];
          // Better distribution: 40% Past Due, 60% Coming Due
          const isPastDue = i % 5 < 2;
          const daysOverdue = isPastDue
            ? Math.floor(Math.random() * 120) + 1
            : 0;

          let category = "";
          if (isPastDue) {
            if (daysOverdue <= 30) category = "0-30 Days";
            else if (daysOverdue <= 45) category = "31-45 Days";
            else if (daysOverdue <= 60) category = "46-60 Days";
            else if (daysOverdue <= 90) category = "61-90 Days";
            else category = ">90 Days";
          } else {
            category = ""; // Coming Due rows have no Past Due Category
          }

          const dueDate = isPastDue
            ? new Date(2024, 10, 30 - daysOverdue)
            : (function () {
                const bucket = i % 20;
                if (bucket === 0) return new Date(2024, 10, 30);
                if (bucket < 5) return new Date(2024, 11, 1 + (i % 7));
                if (bucket < 12) return new Date(2024, 11, 8 + (i % 22));
                if (bucket < 17) return new Date(2025, 0, 1 + (i % 28));
                return new Date(2025, 1, 1 + (i % 28));
              })();

          const ymd = (d) =>
            d.getFullYear() +
            "-" +
            String(d.getMonth() + 1).padStart(2, "0") +
            "-" +
            String(d.getDate()).padStart(2, "0");

          // Periodic frequencies that match your data
          const periodicFrequencies = [
            "One-Time",
            "Monthly",
            "Quarterly",
            "Semi-Annual",
            "Annual",
          ];
          const periodicFreq =
            periodicFrequencies[i % periodicFrequencies.length];

          // Calculate 45 days past due date
          const days45PastDue =
            isPastDue && daysOverdue > 45
              ? ymd(new Date(2024, 10, 30 - (daysOverdue - 45)))
              : null;

          covenantsData.push({
            Report_Date: "2024-11-30",
            As_Of_Date: "2024-11-30",
            Region: region,
            Origination_Unit: orginationUnits[i % orginationUnits.length],
            Underwriting_Team_Lead: underwriters[i % underwriters.length],
            Lead_Underwriter: underwriters[i % underwriters.length],
            Underwriter: underwriters[i % underwriters.length],
            Product_Underwriter: underwriters[(i + 1) % underwriters.length],
            OU_Expense_Code: "OU" + ((i % 10) + 1).toString().padStart(3, "0"),
            CU_Expense_Code: "CU" + ((i % 10) + 1).toString().padStart(3, "0"),
            Relationship_ID: "REL" + ((i % 50) + 1).toString().padStart(3, "0"),
            Relationship_Name: `${region} Company ${(i % 50) + 1}`,
            Borrowers_Name: `Borrower ${i}`,
            CA_Number: "CA2024" + ((i % 50) + 1).toString().padStart(3, "0"),
            Facility_Number: "F" + ((i % 50) + 1).toString().padStart(3, "0"),
            Product_Program_Name: productPrograms[i % productPrograms.length],
            Product_Program: productPrograms[i % productPrograms.length],
            Facility_Type: facilityTypes[i % facilityTypes.length],
            Covenant_Number: "COV2024" + i.toString().padStart(3, "0"),
            Periodic_Frequency: periodicFreq,
            Covenant_Due_Date: ymd(dueDate),
            Covenant_Deferred_Date: i % 10 === 0 ? "2024-12-30" : null,
            Days_Past_Due: daysOverdue,
            Coming_Due_Past_Due: isPastDue ? "Past Due" : "Coming Due",
            Past_Due_Category: category,
            Covenant_Description: `Financial covenant ${i} - ${
              i % 3 === 0
                ? "Debt Service Coverage"
                : i % 3 === 1
                ? "Leverage Ratio"
                : "Current Ratio"
            }`,
            Covenant_Remarks: isPastDue ? "Follow up required" : "On track",
            "45_Days_Past_Due_Date": days45PastDue,
            Control_Unit: orginationUnits[i % orginationUnits.length],
          });
        }
        window.covenantsData = covenantsData; // Ensure global access
        console.log(
          "✅ Generated",
          covenantsData.length,
          "covenant records with new fields"
        );

        covenantsActivityData = generateDummyCovenantActivityData();
        window.covenantsActivityData = covenantsActivityData;
        console.log(
          "✅ Generated",
          covenantsActivityData.length,
          "covenant activity records"
        );


        // Add CCM data - Current Month (80 records with proper structure)
        ccmData = [];
        const classifications = [
          "PASS",
          "SPECIAL MENTION",
          "SUBSTANDARD",
          "DOUBTFUL",
        ];
        const frequencies = ["Annual", "Semi-Annual", "Quarterly"];
        const ccmStatuses = ["Completed", "In Progress", "Overdue", "Pending"];

        for (let i = 1; i <= 80; i++) {
          const region = regions[i % regions.length];
          const statusIndex = i % 20;
          const classification = classifications[i % classifications.length];

          // Distribute statuses: 30% Past Due, 35% Coming Due, 35% Open
          let ccmStatus;
          if (statusIndex < 6) {
            ccmStatus = "Past Due";
          } else if (statusIndex < 13) {
            ccmStatus = "Coming Due";
          } else {
            ccmStatus = "Open";
          }

          // Next CCM dates based on status
          let nextMonthEnd, nextApproval;
          if (ccmStatus === "Past Due") {
            // Past due: dates in the past (Oct 2024 or earlier)
            nextMonthEnd = new Date(2024, 8 + (i % 3), 0); // Aug-Oct 2024
            nextApproval = new Date(2024, 8 + (i % 3), 15);
          } else if (ccmStatus === "Coming Due") {
            // Coming due: dates in Dec 2024
            nextMonthEnd = new Date(2024, 11, 31); // Dec 31, 2024
            nextApproval = new Date(2024, 11, 5 + (i % 20)); // Dec 5-25, 2024
          } else {
            // Open: dates in future (Jan 2025 onwards)
            nextMonthEnd = new Date(2025, i % 12, 0);
            nextApproval = new Date(2025, i % 12, 15);
          }

          ccmData.push({
            Report_Date: "2024-11-30",
            Region: region,
            Relationship_ID: "REL" + ((i % 50) + 1).toString().padStart(3, "0"),
            Client_Name: `${region} Client ${i}`,
            Classification: classification,
            Frequency: frequencies[i % frequencies.length],
            Underwriter: underwriters[i % underwriters.length],
            Next_CCM_Month_End: nextMonthEnd.toISOString().split("T")[0],
            Next_CCM_Approval_Date: nextApproval.toISOString().split("T")[0],
            CCM_Status: ccmStatus,
          });
        }
        window.ccmData = ccmData;

        // Add CCM data - Previous Month (75 records for variance comparison)
        ccmDataPrevious = [];
        for (let i = 1; i <= 75; i++) {
          const region = regions[i % regions.length];
          const statusIndex = i % 20;
          const classification = classifications[i % classifications.length];

          // Distribute statuses similarly but with slight variations
          let ccmStatus;
          if (statusIndex < 5) {
            ccmStatus = "Past Due";
          } else if (statusIndex < 12) {
            ccmStatus = "Coming Due";
          } else {
            ccmStatus = "Open";
          }

          let nextMonthEnd, nextApproval;
          if (ccmStatus === "Past Due") {
            nextMonthEnd = new Date(2024, 7 + (i % 3), 0); // Jul-Sep 2024
            nextApproval = new Date(2024, 7 + (i % 3), 15);
          } else if (ccmStatus === "Coming Due") {
            nextMonthEnd = new Date(2024, 10, 30); // Nov 30, 2024
            nextApproval = new Date(2024, 10, 5 + (i % 20));
          } else {
            nextMonthEnd = new Date(2024, 11 + (i % 12), 0);
            nextApproval = new Date(2024, 11 + (i % 12), 15);
          }

          ccmDataPrevious.push({
            Report_Date: "2024-10-31",
            Region: region,
            Relationship_ID: "REL" + ((i % 50) + 1).toString().padStart(3, "0"),
            Client_Name: `${region} Client ${i}`,
            Classification: classifications[(i + 1) % classifications.length], // Slight variation
            Frequency: frequencies[i % frequencies.length],
            Underwriter: underwriters[i % underwriters.length],
            Next_CCM_Month_End: nextMonthEnd.toISOString().split("T")[0],
            Next_CCM_Approval_Date: nextApproval.toISOString().split("T")[0],
            CCM_Status: ccmStatus,
          });
        }
        window.ccmDataPrevious = ccmDataPrevious;

        console.log("✅ Generated comprehensive dummy data:");
        console.log(`   - ${portfolioData.length} portfolio records`);
        console.log(
          `   - ${covenantsData.length} covenant records (this week)`
        );
        console.log(`   - ${ccmData.length} CCM records (current month)`);
        console.log(
          `   - ${ccmDataPrevious.length} CCM records (previous month)`
        );

        // Log sample of Facility_First_Approval_Date by region
        const facilityApprovalSample = portfolioData.slice(0, 4).map((row) => ({
          region: row.Region,
          facilityId: row.Facility_ID,
          approvalDate: row.Facility_First_Approval_Date,
        }));
        console.log(
          "📋 Facility_First_Approval_Date sample:",
          facilityApprovalSample
        );

        // Generate Historical Trends Dummy Data (Portfolio_Aggregated_History.xlsx)
        // Generate small set of dummy data (matching real file size of ~120 rows)
        historicalTrendsData = [];
        const trendRegions = ["NAM", "EMEA", "APAC", "LATAM"];
        const trendProductPrograms = [
          "Corporate Lending",
          "Trade Finance",
        ];
        const trendProductSubs = [
          "Term Loan",
          "Revolver",
        ];
        const trendUnderwriters = [
          "John Smith",
          "Sarah Johnson",
        ];
        const pseOptions = ["Yes", "No"];
        const commitmentOptions = ["Yes", "No"];

        // Generate only 15 weeks of historical data (matching ~120 rows: 15 weeks × 4 regions × 2 products)
        const weeksToGenerate = 15;
        const endDate = new Date("2024-11-30");

        for (let week = 0; week < weeksToGenerate; week++) {
          // Calculate week date (going backwards from end date)
          const weekDate = new Date(endDate);
          weekDate.setDate(weekDate.getDate() - week * 7);
          const dateStr = weekDate.toISOString().split("T")[0];

          // Generate data for each region and product combination
          trendRegions.forEach((region) => {
            trendProductPrograms.forEach((program, progIdx) => {
              const subProgram =
                trendProductSubs[progIdx % trendProductSubs.length];
              const underwriter =
                trendUnderwriters[
                  Math.floor(Math.random() * trendUnderwriters.length)
                ];
              const pse =
                pseOptions[Math.floor(Math.random() * pseOptions.length)];
              const commitment =
                commitmentOptions[
                  Math.floor(Math.random() * commitmentOptions.length)
                ];

              // Base amounts with some randomness and growth trend
              const growthFactor = 1 + week * 0.005; // 0.5% growth per week
              const baseTFA =
                (5000000 + Math.random() * 3000000) * growthFactor;
              const baseOSUC = baseTFA * (0.7 + Math.random() * 0.15);
              const baseTotalOS = baseOSUC * (0.6 + Math.random() * 0.2);

              // Facilities and relationships with growth trend (0.3% growth per week)
              const facilityGrowth = 1 + week * 0.003;
              const relationshipGrowth = 1 + week * 0.003;
              const facilities = Math.floor(
                (10 + Math.random() * 15) * facilityGrowth
              );
              const relationships = Math.floor(
                (5 + Math.random() * 10) * relationshipGrowth
              );
              const cas = Math.floor(3 + Math.random() * 8);

              historicalTrendsData.push({
                Report_Date: dateStr,
                Region: region,
                Product_Program: program,
                Product_Sub_Program: subProgram,
                Underwriter: underwriter,
                PSE: pse,
                Commitment: commitment,
                TFA: Math.round(baseTFA * 100) / 100,
                OSUC: Math.round(baseOSUC * 100) / 100,
                Total_OS: Math.round(baseTotalOS * 100) / 100,
                Total_Unused_Exposure:
                  Math.round((baseOSUC - baseTotalOS) * 100) / 100,
                Total_Undrawn: Math.round((baseTFA - baseTotalOS) * 100) / 100,
                Count_of_Facilities: facilities,
                Count_of_Relationships: relationships,
                Count_of_CAs: cas,
              });
            });
          });
        }

        console.log(
          `✅ Generated ${historicalTrendsData.length} historical trends records (${weeksToGenerate} weeks × ${trendRegions.length} regions × ${trendProductPrograms.length} products)`
        );
        console.log(
          "📈 Trends date range:",
          historicalTrendsData[historicalTrendsData.length - 1].Report_Date,
          "to",
          historicalTrendsData[0].Report_Date
        );
        if (historicalTrendsData.length > 0) {
          console.log("📊 Sample trend record:", historicalTrendsData[0]);
        }
      }
      // ===== END DUMMY DATA =====

      let expirationChartInstance = null;
      let searchDebounceTimer = null;
      let relationshipChartInstance = null;
      let facilityTrendChartInstance = null; // Store facility trend chart instance
      let facilityMaturityChartInstance = null; // Store facility maturity chart instance
      let newFacilitiesApprovedChartInstance = null; // Store New Facilities Approved chart instance
      let rotceChartInstance = null; // Store ROTCE chart instance
      let updateBarChartTimer = null; // Debounce timer for bar chart updates
      let activeFilters = {};
      let selectedMetricType = "facilityAmount"; // Default to Facility Amount

      // Smart Filter States (Overview Tab only)
      let selectedRegion = "all"; // all, APAC, EMEA, LATAM, NAM
      let selectedPSE = "all"; // all, PSE, non-PSE
      let selectedStatus = "all"; // all, CM, DM
      let selectedCommitmentStatus = "all"; // all, Committed, Uncommitted
      let selectedAmountType = "osuc"; // direct, contingent, pse, osuc, tfa (for metrics)
      let selectedPeriod = "current"; // current, previous (for New Facilities Approved  chart)
      let selectedSearchTerm = ""; // Global search filter

      // Helper function to check if we're on the Overview tab
      // (Now always returns true since we only have the overview)
      
      // Chart View States
      let currentCovenantViewType = "pastDue"; // pastDue, comingDue
      window.currentCovenantViewType = currentCovenantViewType; // Make it globally accessible
      let currentCCMViewType = "pastDue"; // pastDue, comingDue, open

      // Reporting Month (derived from max Report_Date in data)
      let reportingMonth = null; // Will be set after data loads

      // Get the reporting month from portfolio data (max Report_Date)
      function getReportingMonth() {
        if (reportingMonth) return reportingMonth;

        const dataSource =
          filteredData.length > 0 ? filteredData : portfolioData;
        if (!dataSource || dataSource.length === 0) {
          // Fallback to current date if no data
          return new Date();
        }

        // Get max Report_Date from data
        const reportDates = dataSource
          .map((row) => parseDate(row.Report_Date))
          .filter((d) => d !== null);

        if (reportDates.length === 0) {
          return new Date();
        }

        reportingMonth = new Date(Math.max(...reportDates));
        console.log(
          "📅 Reporting Month set to:",
          reportingMonth.toLocaleDateString()
        );
        return reportingMonth;
      }

      // Get reporting month start and end dates
      function getReportingMonthRange() {
        const repMonth = getReportingMonth();
        const monthStart = new Date(
          repMonth.getFullYear(),
          repMonth.getMonth(),
          1
        );
        monthStart.setHours(0, 0, 0, 0);
        const monthEnd = new Date(
          repMonth.getFullYear(),
          repMonth.getMonth() + 1,
          0
        );
        monthEnd.setHours(23, 59, 59, 999);
        return { monthStart, monthEnd, reportingMonth: repMonth };
      }

      // Cross-filtering state management
      let chartFilter = {
        active: false,
        type: null, // 'relationship', 'region', 'product', 'facilityType', etc.
        value: null, // The clicked value (e.g., relationship name, region name, etc.)
        label: null, // Display label for UI
      };

      // Performance optimization: Cache for expensive calculations
      let metricsCache = {
        full: null,
        filtered: null,
        filterHash: "",
      };
      let indexCache = {
        byRegion: null,
        byProduct: null,
        byRelationship: null,
        dates: null,
      };

      // ============================================

      // Initialize on page load
      window.bootstrapCovenantsPage = function () {
        console.log("=== Portfolio Analytics Dashboard ===");

        // Global click-outside handler for all filter dropdowns
        document.addEventListener("click", function (event) {
          // Check if click is outside any overview tab filter dropdown (region, product, etc.)
          const overviewDropdowns = document.querySelectorAll(
            "#regionFilterDropdown, #productFilterDropdown, #subProductFilterDropdown, #underwriterFilterDropdown"
          );
          overviewDropdowns.forEach((dropdown) => {
            if (!dropdown.classList.contains("hidden")) {
              const dropdownParent = dropdown.parentElement;
              const dropdownButton = dropdownParent
                ? dropdownParent.querySelector("button")
                : null;
              const clickedInside =
                dropdown.contains(event.target) ||
                (dropdownButton && dropdownButton.contains(event.target)) ||
                (dropdownParent && dropdownParent.contains(event.target));
              if (!clickedInside) {
                dropdown.classList.add("hidden");
              }
            }
          });

          // Check if click is outside any trends filter dropdown
          const trendsDropdowns = document.querySelectorAll(
            '[id^="trends"][id$="FilterDropdown"]'
          );
          trendsDropdowns.forEach((dropdown) => {
            if (!dropdown.classList.contains("hidden")) {
              const dropdownButton = dropdown.previousElementSibling;
              const clickedInside =
                dropdown.contains(event.target) ||
                (dropdownButton && dropdownButton.contains(event.target));
              if (!clickedInside) {
                dropdown.classList.add("hidden");
              }
            }
          });

          // Check if click is outside any balances filter dropdown
          const balancesDropdowns = document.querySelectorAll(
            '[id^="balances"][id$="FilterDropdown"]'
          );
          balancesDropdowns.forEach((dropdown) => {
            if (!dropdown.classList.contains("hidden")) {
              const dropdownButton = dropdown.previousElementSibling;
              const clickedInside =
                dropdown.contains(event.target) ||
                (dropdownButton && dropdownButton.contains(event.target));
              if (!clickedInside) {
                dropdown.classList.add("hidden");
              }
            }
          });
        });

        // Initialize Apply Filters button
        const btnApplyFilters = document.getElementById("btnApplyFiltersModal");
        if (btnApplyFilters) {
          btnApplyFilters.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            console.log("🔵 Apply Filters button clicked");
            applyFiltersAndClose();
          });
        }

        // Initialize search functionality
        const searchInput = document.getElementById("searchInput");
        if (searchInput) {
          // Handle Enter key press
          searchInput.addEventListener("keypress", function (e) {
            if (e.key === "Enter") {
              handleMainSearch(this.value);
            }
          });

          // Handle input changes (detect when text is cleared/changed)
          let searchDebounceTimer = null;
          searchInput.addEventListener("input", function (e) {
            // Clear previous timer
            if (searchDebounceTimer) {
              clearTimeout(searchDebounceTimer);
            }

            // Debounce to avoid too many updates while typing
            searchDebounceTimer = setTimeout(() => {
              const currentValue = this.value.trim();
              // If search box is cleared or value changed significantly
              if (currentValue === "" && selectedSearchTerm !== "") {
                // Search was cleared
                handleMainSearch("");
              }
            }, 300); // 300ms debounce
          });
        }

        // Always seed dummy activity when enabled (Deferred / Waived / Deleted)
        if (
          ENABLE_DUMMY_ACTIVITY &&
          typeof generateDummyCovenantActivityData === "function"
        ) {
          covenantsActivityData = generateDummyCovenantActivityData();
          window.covenantsActivityData = covenantsActivityData;
          console.log(
            "✅ Using dummy covenant activity:",
            covenantsActivityData.length,
            "records"
          );
        }

        // Covenants: dummy only when ENABLE_DUMMY_DATA; otherwise Confluence
        if (ENABLE_DUMMY_DATA && covenantsData && covenantsData.length > 0) {
          console.log("DUMMY DATA MODE - Using covenant test data");
          if (typeof hideLoadingOverlay === "function") hideLoadingOverlay();
          setTimeout(() => {
            try {
              if (typeof populateFilterOptions === "function") populateFilterOptions();
              if (typeof updateReportDate === "function") updateReportDate();
              if (typeof refreshCovenantPageCharts === "function") {
                refreshCovenantPageCharts();
              }
              if (typeof showNotification === "function") {
                showNotification(
                  "Success",
                  `Loaded ${covenantsData.length} dummy covenant records for testing`,
                  "success"
                );
              }
            } catch (e) {
              console.error("Dummy data bootstrap failed:", e);
            }
          }, 150);
        } else {
          console.log("READ-ONLY mode - Loading covenants from Confluence");
          console.log("Page ID:", CONFLUENCE_PAGE_ID);
          console.log("File:", CONFLUENCE_COVENANTS_FILE);
          showLoadingOverlay("Loading Covenants Data...");
          loadDataFromCSV();
        }

        // Verify all required libraries are loaded
        if (typeof ApexCharts === "undefined") {
          console.error(
            "❌ ApexCharts library not loaded! Charts will not work."
          );
          showNotification(
            "Error",
            "ApexCharts library failed to load. Please refresh the page.",
            "error"
          );
        } else {
          console.log("✓ ApexCharts library loaded successfully");
        }

        if (typeof XLSX === "undefined") {
          console.warn(
            "⚠️  XLSX library not loaded. Excel file parsing may not work."
          );
        } else {
          console.log("✓ XLSX library loaded successfully");
        }

        // Setup search functionality with debouncing (increased for large datasets)
        const searchInputEl = document.getElementById("searchInput");
        if (searchInputEl) {
          searchInputEl.addEventListener("input", function () {
            if (searchDebounceTimer) {
              clearTimeout(searchDebounceTimer);
            }
            searchDebounceTimer = setTimeout(() => {
              if (typeof handleMainSearch === "function")
                handleMainSearch(document.getElementById("searchInput").value);
              else applyFilters();
            }, 500);
          });
        }
      };

      // Refresh data from Confluence (read-only, no write operations)
            async function refreshData() {
        // Covenants-only refresh
        await loadDataFromCSV();
      }

      // Load data from Confluence attachment (read-only)
            async function loadDataFromCSV() {
        console.log("========== loadDataFromCSV (covenants-only) ==========");
        const loadStartTime = performance.now();
        showLoadingOverlay("Loading Covenants Data...");

        try {
          showLoadingOverlay("Fetching covenant records...");
          const covenantResult = await fetchCovenantsFromConfluence();
          if (covenantResult && covenantResult.length > 0) {
            covenantsData = covenantResult;
            window.covenantsData = covenantResult;
            console.log(`Loaded ${covenantResult.length} covenant records from Confluence`);
          } else {
            console.warn(`No covenant data loaded from ${CONFLUENCE_COVENANTS_FILE}`);
            covenantsData = [];
            window.covenantsData = [];
          }

          // Activity stays dummy (Deferred / Waived / Deleted charts)
          if (
            ENABLE_DUMMY_ACTIVITY &&
            typeof generateDummyCovenantActivityData === "function"
          ) {
            covenantsActivityData = generateDummyCovenantActivityData();
            window.covenantsActivityData = covenantsActivityData;
            console.log(
              `Using ${covenantsActivityData.length} dummy covenant activity records`
            );
          } else if (
            !covenantsActivityData ||
            !covenantsActivityData.length
          ) {
            covenantsActivityData = [];
            window.covenantsActivityData = [];
          }

          // Keep empty portfolio arrays so any leftover shared helpers stay safe
          portfolioData = [];
          filteredData = [];
          ccmData = [];
          window.ccmData = [];
          ccmDataPrevious = [];
          window.ccmDataPrevious = [];

          if (!covenantsData || covenantsData.length === 0) {
            hideLoadingOverlay();
            showNotification(
              "Error",
              "No covenant data found in Confluence attachment",
              "error"
            );
            return;
          }

          showLoadingOverlay("Building covenant charts...");
          setTimeout(() => {
            try {
              if (typeof populateFilterOptions === "function") populateFilterOptions();
              if (typeof updateReportDate === "function") updateReportDate();
              refreshCovenantPageCharts();

              const loadTime = ((performance.now() - loadStartTime) / 1000).toFixed(1);
              showLoadingOverlay("Covenants Ready!");
              setTimeout(() => {
                hideLoadingOverlay();
                showNotification(
                  "Success",
                  `Loaded ${covenantsData.length.toLocaleString()} covenants in ${loadTime}s`,
                  "success"
                );
                console.log(`Covenants dashboard loaded in ${loadTime}s`);
              }, 200);
            } catch (chartError) {
              console.error("Error during covenants initialization:", chartError);
              hideLoadingOverlay();
              showNotification(
                "Warning",
                "Dashboard loaded with some errors. Please check console.",
                "warning"
              );
            }
          }, 50);
        } catch (error) {
          console.error("Error loading covenants data:", error);
          hideLoadingOverlay();
          showNotification(
            "Error",
            "Failed to load covenants data: " + (error.message || error),
            "error"
          );
        }
      }


async function fetchWithTimeout(url, options = {}, timeoutMs = 60000) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
          console.error(
            `❌ Fetch timed out after ${timeoutMs / 1000}s for: ${url}`
          );
        }, timeoutMs);

        try {
          const response = await fetch(url, {
            ...options,
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          return response;
        } catch (error) {
          clearTimeout(timeoutId);
          if (error.name === "AbortError") {
            throw new Error(
              `Network request timed out after ${timeoutMs / 1000}s`
            );
          }
          throw error;
        }
      }

async function parseCovenantExcelBlob(blob) {
        const FILE_READ_TIMEOUT = 60000; // 60 second timeout for file reading

        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          let timeoutId = null;

          // Set up timeout to prevent hanging
          timeoutId = setTimeout(() => {
            reader.abort();
            console.error("❌ Covenant file reading timed out after 60s");
            reject(new Error("File reading timed out"));
          }, FILE_READ_TIMEOUT);

          reader.onload = function (e) {
            clearTimeout(timeoutId);
            try {
              const data = new Uint8Array(e.target.result);

              const workbook = XLSX.read(data, {
                type: "array",
                cellDates: true,
                cellNF: false,
                cellText: false,
              });

              const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

              console.log(
                "📊 Covenant Excel Sheet Name:",
                workbook.SheetNames[0]
              );

              // Convert sheet to JSON (headers match Confluence covenants file columns)
              const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
                raw: false,
                defval: "",
                dateNF: "yyyy-mm-dd",
              });

              console.log(
                `📊 Total covenant rows in Excel: ${jsonData.length}`
              );

              // Filter empty rows, then normalize to internal field names
              const filteredData = jsonData
                .filter((row) =>
                  Object.values(row).some(
                    (val) => val !== null && val !== undefined && String(val).trim() !== ""
                  )
                )
                .map((row) => normalizeCovenantRecord(row));

              console.log(
                `✅ Parsed ${filteredData.length} valid covenant records from Excel`
              );

              if (filteredData.length > 0) {
                console.log(
                  "📋 Covenant record fields:",
                  Object.keys(filteredData[0])
                );
                console.log("📋 Sample covenant record:", filteredData[0]);
                const statusCounts = {};
                const catCounts = {};
                filteredData.forEach((r) => {
                  const s = r.Coming_Due_Past_Due || "(blank)";
                  const c = r.Past_Due_Category || "(blank)";
                  statusCounts[s] = (statusCounts[s] || 0) + 1;
                  if (s === "Past Due") catCounts[c] = (catCounts[c] || 0) + 1;
                });
                console.log("📋 Coming Due / Past Due value counts:", statusCounts);
                console.log("📋 Past Due Category counts (Past Due rows only):", catCounts);
              }

              resolve(filteredData);
            } catch (error) {
              console.error("Error parsing covenant Excel:", error);
              reject(error);
            }
          };
          reader.onerror = function (error) {
            clearTimeout(timeoutId);
            console.error("FileReader error:", error);
            reject(error);
          };
          reader.onabort = function () {
            clearTimeout(timeoutId);
            console.warn("FileReader aborted");
            reject(new Error("File reading was aborted"));
          };
          reader.readAsArrayBuffer(blob);
        });
      }

      // Map Confluence covenants Excel columns → internal keys used by charts/filters.
      // Expected columns (Sheet1):
      // As Of Date, Region, Product_Program, Originating Unit, Underwriting Team Lead,
      // Underwriter, Product Underwriter, OU Expense Code, CU Expense Code,
      // Relationship ID, Relationship Name, Borrowers Name, CA Number, Facility Number,
      // Product Program Name, Facility Type, Covenant Number, Periodicity / Frequency,
      // Covenant Due Date, Covenant Deferred Date, No of Days Past Due,
      // Coming Due / Past Due, Past Due Category, Covenant Description, Covenant Remarks,
      // 45 Days Past Due Date, Control Unit
      function covenantHeaderKey(name) {
        return String(name || "")
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "");
      }

      function pickCovenantField(row, candidates) {
        if (!row) return "";
        // Exact key first
        for (const name of candidates) {
          if (row[name] != null && String(row[name]).trim() !== "") {
            return row[name];
          }
        }
        // Fuzzy match (spaces / underscores / slashes)
        const wanted = candidates.map(covenantHeaderKey);
        for (const key of Object.keys(row)) {
          const norm = covenantHeaderKey(key);
          if (wanted.includes(norm) && row[key] != null && String(row[key]).trim() !== "") {
            return row[key];
          }
        }
        return "";
      }

      function normalizeCovenantRecord(row) {
        const asOf = pickCovenantField(row, [
          "As Of Date",
          "As_Of_Date",
          "Report_Date",
          "Report Date",
        ]);
        const productProgram = pickCovenantField(row, [
          "Product_Program",
          "Product Program",
        ]);
        const productProgramName = pickCovenantField(row, [
          "Product Program Name",
          "Product_Program_Name",
        ]);
        const underwriter = pickCovenantField(row, ["Underwriter"]);
        const leadUnderwriter = pickCovenantField(row, [
          "Lead_Underwriter",
          "Lead Underwriter",
        ]);
        const daysRaw = pickCovenantField(row, [
          "No of Days Past Due",
          "No_of_Days_Past_Due",
          "Days_Past_Due",
          "Days Past Due",
        ]);
        const daysPastDueNum = Number(String(daysRaw).replace(/[^0-9.-]/g, ""));
        const daysPastDue = Number.isFinite(daysPastDueNum) ? daysPastDueNum : 0;

        let comingDuePastDue = normalizeComingDuePastDueStatus(
          pickCovenantField(row, [
            "Coming Due / Past Due",
            "Coming_Due_Past_Due",
            "Coming Due Past Due",
          ])
        );

        let pastDueCategory = normalizePastDueCategoryValue(
          pickCovenantField(row, [
            "Past Due Category",
            "Past_Due_Category",
          ])
        );
        // Derive category from days ONLY when Past Due and category is blank
        if (comingDuePastDue === "Past Due" && !pastDueCategory && daysPastDue > 0) {
          if (daysPastDue > 90) pastDueCategory = ">90 Days";
          else if (daysPastDue > 60) pastDueCategory = "61-90 Days";
          else if (daysPastDue > 45) pastDueCategory = "46-60 Days";
          else if (daysPastDue > 30) pastDueCategory = "31-45 Days";
          else pastDueCategory = "0-30 Days";
        }

        const frequency = pickCovenantField(row, [
          "Periodicity / Frequency",
          "Periodic_Frequency",
          "Periodicity",
          "Frequency",
        ]);

        return {
          Report_Date: asOf,
          As_Of_Date: asOf,
          Region: pickCovenantField(row, ["Region"]),
          Product_Program: productProgram || productProgramName,
          Product_Program_Name: productProgramName || productProgram,
          Origination_Unit: pickCovenantField(row, [
            "Originating Unit",
            "Origination_Unit",
            "Origination Unit",
          ]),
          Underwriting_Team_Lead: pickCovenantField(row, [
            "Underwriting Team Lead",
            "Underwriting_Team_Lead",
          ]),
          Lead_Underwriter: leadUnderwriter || underwriter,
          Underwriter: underwriter || leadUnderwriter,
          Product_Underwriter: pickCovenantField(row, [
            "Product Underwriter",
            "Product_Underwriter",
          ]),
          OU_Expense_Code: pickCovenantField(row, [
            "OU Expense Code",
            "OU_Expense_Code",
          ]),
          CU_Expense_Code: pickCovenantField(row, [
            "CU Expense Code",
            "CU_Expense_Code",
          ]),
          Relationship_ID: pickCovenantField(row, [
            "Relationship ID",
            "Relationship_ID",
          ]),
          Relationship_Name: pickCovenantField(row, [
            "Relationship Name",
            "Relationship_Name",
          ]),
          Borrowers_Name: pickCovenantField(row, [
            "Borrowers Name",
            "Borrowers_Name",
            "Borrower Name",
          ]),
          CA_Number: pickCovenantField(row, ["CA Number", "CA_Number"]),
          Facility_Number: pickCovenantField(row, [
            "Facility Number",
            "Facility_Number",
          ]),
          Facility_Type: pickCovenantField(row, [
            "Facility Type",
            "Facility_Type",
          ]),
          Covenant_Number: pickCovenantField(row, [
            "Covenant Number",
            "Covenant_Number",
          ]),
          Periodic_Frequency: frequency,
          Covenant_Due_Date: pickCovenantField(row, [
            "Covenant Due Date",
            "Covenant_Due_Date",
          ]),
          Covenant_Deferred_Date: pickCovenantField(row, [
            "Covenant Deferred Date",
            "Covenant_Deferred_Date",
          ]),
          Days_Past_Due: daysPastDue,
          Coming_Due_Past_Due: comingDuePastDue,
          Past_Due_Category: pastDueCategory,
          Covenant_Description: pickCovenantField(row, [
            "Covenant Description",
            "Covenant_Description",
          ]),
          Covenant_Remarks: pickCovenantField(row, [
            "Covenant Remarks",
            "Covenant_Remarks",
          ]),
          "45_Days_Past_Due_Date": pickCovenantField(row, [
            "45 Days Past Due Date",
            "45_Days_Past_Due_Date",
          ]),
          Control_Unit: pickCovenantField(row, [
            "Control Unit",
            "Control_Unit",
          ]),
        };
      }

async function fetchCovenantsFromConfluence() {
        try {
          // Construct Confluence API URL for covenants file
          const url = `${CONFLUENCE_BASE_URL}/download/attachments/${CONFLUENCE_PAGE_ID}/${CONFLUENCE_COVENANTS_FILE}?api=v2`;

          console.log("Fetching covenant data from Confluence:", url);
          console.log("Covenants file name:", CONFLUENCE_COVENANTS_FILE);

          const response = await fetchWithTimeout(
            url,
            {
              headers: {
                "X-Atlassian-Token": "no-check",
              },
            },
            60000
          ); // 60 second timeout

          if (!response.ok) {
            console.warn(
              `Failed to fetch ${CONFLUENCE_COVENANTS_FILE}: ${response.status} ${response.statusText}. Covenants will not be available.`
            );
            return null;
          }

          console.log("Successfully fetched covenant file from Confluence");
          const blob = await response.blob();
          console.log("Covenant blob size:", blob.size, "bytes");

          // Parse Excel file (covenants are in .xlsx format)
          if (
            CONFLUENCE_COVENANTS_FILE.endsWith(".xlsx") ||
            CONFLUENCE_COVENANTS_FILE.endsWith(".xls")
          ) {
            console.log("Parsing covenant Excel file...");
            return await parseCovenantExcelBlob(blob);
          }

          throw new Error("Covenant file must be .xlsx or .xls format");
        } catch (error) {
          console.error(
            "Error fetching covenant data from Confluence:",
            error.message
          );
          return null;
        }
      }

      // Fetch CCM data from Confluence
      

      // Fetch previous month CCM from Confluence
      

      // Parse CCM Excel blob
      
      // Parse CSV blob (read-only)
      async function parseCSVBlob(blob) {
        const FILE_READ_TIMEOUT = 60000; // 60 second timeout for file reading

        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          let timeoutId = null;

          // Set up timeout to prevent hanging
          timeoutId = setTimeout(() => {
            reader.abort();
            console.error("❌ CSV file reading timed out after 60s");
            reject(new Error("File reading timed out"));
          }, FILE_READ_TIMEOUT);

          reader.onload = function (e) {
            clearTimeout(timeoutId);
            try {
              const text = e.target.result;
              const lines = text.split("\n");
              const headers = lines[0].split(",").map((h) => h.trim());

              console.log("CSV Headers:", headers);

              const data = [];
              for (let i = 1; i < lines.length; i++) {
                if (lines[i].trim()) {
                  const values = lines[i].split(",");
                  const row = {};
                  headers.forEach((header, index) => {
                    row[header] = values[index] ? values[index].trim() : "";
                  });
                  // Only add rows with Facility_ID
                  if (row.Facility_ID) {
                    data.push(row);
                  }
                }
              }

              console.log(`Parsed ${data.length} records from CSV`);
              resolve(data);
            } catch (error) {
              console.error("Error parsing CSV:", error);
              reject(error);
            }
          };
          reader.onerror = () => {
            clearTimeout(timeoutId);
            console.error("FileReader error while reading CSV");
            reject(new Error("Failed to read CSV file"));
          };
          reader.onabort = function () {
            clearTimeout(timeoutId);
            console.warn("CSV FileReader aborted");
            reject(new Error("File reading was aborted"));
          };
          reader.readAsText(blob);
        });
      }

      // Parse Excel blob (read-only) - OPTIMIZED for large files
      async function parseExcelBlob(blob, progressCallback = null) {
        const FILE_READ_TIMEOUT = 90000; // 90 second timeout for large Excel files

        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          let timeoutId = null;

          // Set up timeout to prevent hanging on large files
          timeoutId = setTimeout(() => {
            reader.abort();
            console.error("❌ Excel file reading timed out after 90s");
            reject(new Error("File reading timed out - file may be too large"));
          }, FILE_READ_TIMEOUT);

          reader.onprogress = function (e) {
            // Reset timeout on progress (file is actively being read)
            if (timeoutId) {
              clearTimeout(timeoutId);
              timeoutId = setTimeout(() => {
                reader.abort();
                console.error("❌ Excel file reading timed out");
                reject(new Error("File reading timed out"));
              }, FILE_READ_TIMEOUT);
            }

            if (e.lengthComputable && progressCallback) {
              const percent = Math.round((e.loaded / e.total) * 30);
              progressCallback(`Reading file...`, percent);
            }
          };

          reader.onload = function (e) {
            clearTimeout(timeoutId);
            try {
              if (progressCallback)
                progressCallback("Processing data structure...", 35);

              const data = new Uint8Array(e.target.result);
              const startTime = performance.now();

              // OPTIMIZED: Use minimal parsing options for speed
              const workbook = XLSX.read(data, {
                type: "array",
                cellDates: true,
                cellNF: false,
                cellText: false,
                cellStyles: false,
                sheetStubs: false,
              });

              const parseTime = performance.now() - startTime;
              console.log(`Excel parsed in ${(parseTime / 1000).toFixed(2)}s`);

              if (progressCallback)
                progressCallback("Converting to data rows...", 60);

              const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
              console.log("Excel Sheet Name:", workbook.SheetNames[0]);

              // OPTIMIZED: Convert sheet to JSON
              const convertStart = performance.now();
              const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
                raw: false,
                dateNF: "yyyy-mm-dd",
                defval: "",
              });
              const convertTime = performance.now() - convertStart;
              console.log(
                `Converted ${jsonData.length} rows in ${(
                  convertTime / 1000
                ).toFixed(2)}s`
              );

              if (progressCallback)
                progressCallback(
                  `Filtering ${jsonData.length.toLocaleString()} rows...`,
                  90
                );

              // Filter for rows with Facility_ID
              const filteredData = jsonData.filter((row) => row.Facility_ID);

              console.log(
                `Parsed ${filteredData.length} valid records from Excel`
              );

              // Log sample data for debugging
              if (filteredData.length > 0) {
                console.log(
                  "Sample record fields:",
                  Object.keys(filteredData[0])
                );
              }

              if (progressCallback)
                progressCallback(
                  `Portfolio data ready (${filteredData.length.toLocaleString()} records)`,
                  100
                );

              resolve(filteredData);
            } catch (error) {
              console.error("Error parsing Excel:", error);
              reject(error);
            }
          };
          reader.onerror = () => {
            clearTimeout(timeoutId);
            console.error("FileReader error while reading Excel file");
            reject(new Error("Failed to read Excel file"));
          };
          reader.onabort = function () {
            clearTimeout(timeoutId);
            console.warn("Excel FileReader aborted");
            reject(new Error("File reading was aborted"));
          };
          reader.readAsArrayBuffer(blob);
        });
      }

      // Global loading timeout tracker
      let loadingTimeoutId = null;
      const MAX_LOADING_TIME = 120000; // 2 minutes max loading time before auto-hide
      const LOADING_WATCHDOG_INTERVAL = 30000; // Check every 30 seconds
      let loadingStartTime = null;

      // Show loading overlay with title - completely non-blocking
      function showLoadingOverlay(
        title = "Please wait...",
        progress = null,
        percent = null
      ) {
        // Schedule all DOM operations on next animation frame to prevent blocking
        requestAnimationFrame(() => {
          const overlay = document.getElementById("loadingOverlay");
          const messageEl = document.getElementById("loadingMessage");

          if (!overlay) {
            console.error("❌ Loading overlay element not found!");
            return;
          }

          // Show overlay if hidden
          if (overlay.classList.contains("hidden")) {
            overlay.classList.remove("hidden");
            console.log("✅ Loading overlay displayed");
            loadingStartTime = Date.now();

            // Start safety timeout to prevent spinner from getting stuck
            startLoadingTimeout();
          }

          // Reset timeout on each message update (shows progress is being made)
          resetLoadingTimeout();

          // Update text only if changed - use separate animation frame to isolate from overlay show
          if (messageEl && messageEl.textContent !== title) {
            requestAnimationFrame(() => {
              // Double-buffer text update to completely isolate from animations
              messageEl.textContent = title;
              console.log("📝 Message updated:", title);
            });
          }
        });
      }

      // Start loading timeout watchdog
      function startLoadingTimeout() {
        clearLoadingTimeout();
        loadingTimeoutId = setTimeout(() => {
          const overlay = document.getElementById("loadingOverlay");
          if (overlay && !overlay.classList.contains("hidden")) {
            const elapsed = Date.now() - loadingStartTime;
            console.warn(
              `⚠️ Loading timeout reached after ${(elapsed / 1000).toFixed(
                1
              )}s - auto-hiding spinner`
            );
            hideLoadingOverlay();
            showNotification(
              "Warning",
              "Loading took too long. Please try refreshing the page if data didn't load.",
              "warning"
            );
          }
        }, MAX_LOADING_TIME);
      }

      // Reset loading timeout (called when progress is made)
      function resetLoadingTimeout() {
        if (loadingTimeoutId) {
          clearTimeout(loadingTimeoutId);
          loadingTimeoutId = setTimeout(() => {
            const overlay = document.getElementById("loadingOverlay");
            if (overlay && !overlay.classList.contains("hidden")) {
              const elapsed = Date.now() - loadingStartTime;
              console.warn(
                `⚠️ Loading timeout reached after ${(elapsed / 1000).toFixed(
                  1
                )}s - auto-hiding spinner`
              );
              hideLoadingOverlay();
              showNotification(
                "Warning",
                "Loading took too long. Please try refreshing the page if data didn't load.",
                "warning"
              );
            }
          }, MAX_LOADING_TIME);
        }
      }

      // Clear loading timeout
      function clearLoadingTimeout() {
        if (loadingTimeoutId) {
          clearTimeout(loadingTimeoutId);
          loadingTimeoutId = null;
        }
      }

      // Update just the loading percentage (legacy support - no longer needed with new loader)
      function updateLoadingPercent(percent) {
        // No-op for new loader design
      }

      // Hide loading overlay - non-blocking
      function hideLoadingOverlay() {
        // Clear the safety timeout
        clearLoadingTimeout();
        loadingStartTime = null;

        // Schedule hiding on next animation frame
        requestAnimationFrame(() => {
          const overlay = document.getElementById("loadingOverlay");

          if (!overlay) {
            console.error(
              "❌ Loading overlay element not found when trying to hide!"
            );
            return;
          }

          console.log("✅ Hiding loading overlay");
          overlay.classList.add("hidden");
        });
      }

      // Force hide loading overlay - use this as emergency escape hatch
      function forceHideLoadingOverlay() {
        clearLoadingTimeout();
        loadingStartTime = null;
        const overlay = document.getElementById("loadingOverlay");
        if (overlay) {
          overlay.classList.add("hidden");
          console.log("⚠️ Force-hidden loading overlay");
        }
      }

      // Expose forceHideLoadingOverlay globally for console access during debugging
      window.forceHideLoadingOverlay = forceHideLoadingOverlay;

      // Animation Protection System - ensures animations never pause regardless of file operations
      (function () {
        if (typeof window === "undefined") return;

        // Monitor and protect animations every 100ms
        const protectAnimations = () => {
          const overlay = document.getElementById("loadingOverlay");
          if (!overlay || overlay.classList.contains("hidden")) return;

          // Ensure all animation elements maintain running state
          const animatedElements = overlay.querySelectorAll(
            ".animate-bit, .loader-item"
          );
          animatedElements.forEach((el) => {
            const style = window.getComputedStyle(el);
            // Force animation to run if somehow paused
            if (style.animationPlayState === "paused") {
              el.style.animationPlayState = "running";
            }
          });
        };

        // Run protection check on animation frame loop for optimal timing
        const animationLoop = () => {
          protectAnimations();
          requestAnimationFrame(animationLoop);
        };

        // Start protection system when page loads
        if (document.readyState === "loading") {
          document.addEventListener("DOMContentLoaded", () => {
            requestAnimationFrame(animationLoop);
          });
        } else {
          requestAnimationFrame(animationLoop);
        }
      })();

      // Show notification (TailAdmin style - matching alerts.html)
      function showNotification(title, message, type = "success") {
        const configs = {
          success: {
            bgColor: "bg-success-50",
            borderColor: "border-success-500",
            textColor: "text-success-500",
            icon: `<svg class="fill-current" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M3.70186 12.0001C3.70186 7.41711 7.41711 3.70186 12.0001 3.70186C16.5831 3.70186 20.2984 7.41711 20.2984 12.0001C20.2984 16.5831 16.5831 20.2984 12.0001 20.2984C7.41711 20.2984 3.70186 16.5831 3.70186 12.0001ZM12.0001 1.90186C6.423 1.90186 1.90186 6.423 1.90186 12.0001C1.90186 17.5772 6.423 22.0984 12.0001 22.0984C17.5772 22.0984 22.0984 17.5772 22.0984 12.0001C22.0984 6.423 17.5772 1.90186 12.0001 1.90186ZM15.6197 10.7395C15.9712 10.388 15.9712 9.81819 15.6197 9.46672C15.2683 9.11525 14.6984 9.11525 14.347 9.46672L11.1894 12.6243L9.6533 11.0883C9.30183 10.7368 8.73198 10.7368 8.38051 11.0883C8.02904 11.4397 8.02904 12.0096 8.38051 12.3611L10.553 14.5335C10.7217 14.7023 10.9507 14.7971 11.1894 14.7971C11.428 14.7971 11.657 14.7023 11.8257 14.5335L15.6197 10.7395Z" fill=""/>
                    </svg>`,
          },
          error: {
            bgColor: "bg-error-50",
            borderColor: "border-error-500",
            textColor: "text-error-500",
            icon: `<svg class="fill-current" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M20.3499 12.0004C20.3499 16.612 16.6115 20.3504 11.9999 20.3504C7.38832 20.3504 3.6499 16.612 3.6499 12.0004C3.6499 7.38881 7.38833 3.65039 11.9999 3.65039C16.6115 3.65039 20.3499 7.38881 20.3499 12.0004ZM11.9999 22.1504C17.6056 22.1504 22.1499 17.6061 22.1499 12.0004C22.1499 6.3947 17.6056 1.85039 11.9999 1.85039C6.39421 1.85039 1.8499 6.3947 1.8499 12.0004C1.8499 17.6061 6.39421 22.1504 11.9999 22.1504ZM13.0008 16.4753C13.0008 15.923 12.5531 15.4753 12.0008 15.4753L11.9998 15.4753C11.4475 15.4753 10.9998 15.923 10.9998 16.4753C10.9998 17.0276 11.4475 17.4753 11.9998 17.4753L12.0008 17.4753C12.5531 17.4753 13.0008 17.0276 13.0008 16.4753ZM11.9998 6.62898C12.414 6.62898 12.7498 6.96476 12.7498 7.37898L12.7498 13.0555C12.7498 13.4697 12.414 13.8055 11.9998 13.8055C11.5856 13.8055 11.2498 13.4697 11.2498 13.0555L11.2498 7.37898C11.2498 6.96476 11.5856 6.62898 11.9998 6.62898Z" fill="#F04438"/>
                    </svg>`,
          },
          warning: {
            bgColor: "bg-warning-50",
            borderColor: "border-warning-500",
            textColor: "text-warning-500",
            icon: `<svg class="fill-current" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M3.6501 12.0001C3.6501 7.38852 7.38852 3.6501 12.0001 3.6501C16.6117 3.6501 20.3501 7.38852 20.3501 12.0001C20.3501 16.6117 16.6117 20.3501 12.0001 20.3501C7.38852 20.3501 3.6501 16.6117 3.6501 12.0001ZM12.0001 1.8501C6.39441 1.8501 1.8501 6.39441 1.8501 12.0001C1.8501 17.6058 6.39441 22.1501 12.0001 22.1501C17.6058 22.1501 22.1501 17.6058 22.1501 12.0001C22.1501 6.39441 17.6058 1.8501 12.0001 1.8501ZM10.9992 7.52517C10.9992 8.07746 11.4469 8.52517 11.9992 8.52517H12.0002C12.5525 8.52517 13.0002 8.07746 13.0002 7.52517C13.0002 6.97289 12.5525 6.52517 12.0002 6.52517H11.9992C11.4469 6.52517 10.9992 6.97289 10.9992 7.52517ZM12.0002 17.3715C11.586 17.3715 11.2502 17.0357 11.2502 16.6215V10.945C11.2502 10.5308 11.586 10.195 12.0002 10.195C12.4144 10.195 12.7502 10.5308 12.7502 10.945V16.6215C12.7502 17.0357 12.4144 17.3715 12.0002 17.3715Z" fill=""/>
                    </svg>`,
          },
          info: {
            bgColor: "bg-blue-light-50",
            borderColor: "border-blue-light-500",
            textColor: "text-blue-light-500",
            icon: `<svg class="fill-current" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M3.6501 11.9996C3.6501 7.38803 7.38852 3.64961 12.0001 3.64961C16.6117 3.64961 20.3501 7.38803 20.3501 11.9996C20.3501 16.6112 16.6117 20.3496 12.0001 20.3496C7.38852 20.3496 3.6501 16.6112 3.6501 11.9996ZM12.0001 1.84961C6.39441 1.84961 1.8501 6.39392 1.8501 11.9996C1.8501 17.6053 6.39441 22.1496 12.0001 22.1496C17.6058 22.1496 22.1501 17.6053 22.1501 11.9996C22.1501 6.39392 17.6058 1.84961 12.0001 1.84961ZM10.9992 7.52468C10.9992 8.07697 11.4469 8.52468 11.9992 8.52468H12.0002C12.5525 8.52468 13.0002 8.07697 13.0002 7.52468C13.0002 6.9724 12.5525 6.52468 12.0002 6.52468H11.9992C11.4469 6.52468 10.9992 6.9724 10.9992 7.52468ZM12.0002 17.371C11.586 17.371 11.2502 17.0352 11.2502 16.621V10.9445C11.2502 10.5303 11.586 10.1945 12.0002 10.1945C12.4144 10.1945 12.7502 10.5303 12.7502 10.9445V16.621C12.7502 17.0352 12.4144 17.371 12.0002 17.371Z" fill=""/>
                    </svg>`,
          },
        };

        const config = configs[type] || configs.success;
        const notification = document.createElement("div");

        // Create notification with TailAdmin alert styling with solid background
        notification.className = `fixed top-6 right-6 z-[9999] max-w-md rounded-xl border ${config.borderColor} bg-white p-4 shadow-lg transform transition-all duration-300 ease-out`;
        notification.style.animation = "slideInRight 0.3s ease-out";

        // Add background color overlay as inline style for solid appearance
        notification.style.position = "fixed";
        notification.style.backgroundColor = "white";

        notification.innerHTML = `
                <div class="flex items-start gap-3">
                    <div class="-mt-0.5 ${config.textColor}">
                        ${config.icon}
                    </div>
                    <div class="flex-1">
                        <h4 class="mb-1 text-sm font-semibold text-gray-800">
                            ${title}
                        </h4>
                        <p class="text-sm text-gray-500">
                            ${message}
                        </p>
                    </div>
                    <button onclick="this.parentElement.parentElement.remove()" class="text-gray-400 hover:text-gray-600 transition-colors -mt-0.5">
                        <svg class="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M4.29289 4.29289C4.68342 3.90237 5.31658 3.90237 5.70711 4.29289L10 8.58579L14.2929 4.29289C14.6834 3.90237 15.3166 3.90237 15.7071 4.29289C16.0976 4.68342 16.0976 5.31658 15.7071 5.70711L11.4142 10L15.7071 14.2929C16.0976 14.6834 16.0976 15.3166 15.7071 15.7071C15.3166 16.0976 14.6834 16.0976 14.2929 15.7071L10 11.4142L5.70711 15.7071C5.31658 16.0976 4.68342 16.0976 4.29289 15.7071C3.90237 15.3166 3.90237 14.6834 4.29289 14.2929L8.58579 10L4.29289 5.70711C3.90237 5.31658 3.90237 4.68342 4.29289 4.29289Z" fill=""/>
                        </svg>
                    </button>
                </div>
            `;

        document.body.appendChild(notification);

        // Auto-dismiss after 5 seconds with fade out animation
        setTimeout(() => {
          notification.style.opacity = "0";
          notification.style.transform = "translateX(100%)";
          setTimeout(() => {
            if (notification.parentElement) {
              notification.remove();
            }
          }, 300);
        }, 5000);
      }

      // Build indexes for fast filtering (one-time operation)
      
      // Generate hash of active filters for cache validation
      
      // Initialize dashboard with data (optimized for large datasets)
            function initializeDashboard() {
        console.log("Initializing covenants dashboard...");
        window.currentCovenantViewType = currentCovenantViewType || "pastDue";
        if (typeof populateFilterOptions === "function") populateFilterOptions();
        if (typeof updateReportDate === "function") updateReportDate();
        refreshCovenantPageCharts();
      }

      // Populate filter dropdowns with unique values from Confluence data (read-only)

      function getFilterSourceData() {
        if (covenantsData && covenantsData.length > 0) return covenantsData;
        return portfolioData || [];
      }

      function populateFilterOptions() {
        const filterSource = getFilterSourceData();
        if (!filterSource || filterSource.length === 0) {
          console.warn("No covenant data available to populate filters");
          return;
        }
        dropdownsPopulated = {
          region: false,
          product: false,
          underwriter: false,
          teamLead: false,
        };
        console.log(
          "Populating covenant filter options from",
          filterSource.length,
          "rows"
        );
        populateCovenantFilterDropdown("region");
        populateCovenantFilterDropdown("product");
        populateCovenantFilterDropdown("underwriter");
        populateCovenantFilterDropdown("teamLead");
      }

      // Helper to populate a select element
      
      // Refresh Alpine.js dropdowns after populating filters
      
      // Apply all filters (OPTIMIZED for 40K+ rows)
            function applyFilters() {
        // Covenants-only: badge update + refresh charts (no portfolio scan)
        activeFilters = {};
        if (typeof selectedRegions !== "undefined" && selectedRegions.length > 0) {
          activeFilters["Region"] =
            selectedRegions.length === 1
              ? selectedRegions[0]
              : `${selectedRegions.length} selected`;
        } else if (selectedRegion && selectedRegion !== "all" && selectedRegion !== "multi") {
          activeFilters["Region"] = selectedRegion;
        }
        if (typeof selectedProducts !== "undefined" && selectedProducts.length > 0) {
          activeFilters["Product"] =
            selectedProducts.length === 1
              ? selectedProducts[0]
              : `${selectedProducts.length} selected`;
        }
        if (typeof selectedUnderwriters !== "undefined" && selectedUnderwriters.length > 0) {
          activeFilters["Underwriter"] =
            selectedUnderwriters.length === 1
              ? selectedUnderwriters[0]
              : `${selectedUnderwriters.length} selected`;
        }
        if (typeof selectedTeamLeads !== "undefined" && selectedTeamLeads.length > 0) {
          activeFilters["Team Lead"] =
            selectedTeamLeads.length === 1
              ? selectedTeamLeads[0]
              : `${selectedTeamLeads.length} selected`;
        }
        if (selectedSearchTerm && String(selectedSearchTerm).trim() !== "") {
          activeFilters["Search"] = selectedSearchTerm;
        }
        if (typeof displayFilterBadges === "function") displayFilterBadges();
        refreshCovenantPageCharts();
      }

      function updateFilterCount() {
        // Advanced filters removed on covenants-only page
        const badge = document.getElementById("filterCountInline");
        if (badge) badge.classList.add("hidden");
      }

      function selectCommitmentFilter(_value) {
        // Portfolio commitment filter removed
      }



      // Apply chart-based filter (cross-filtering)
      
      // Clear chart filter
      
      // Display chart filter badge
      
      // Apply filters with chart filter included
      
      // Display filter badges
      function displayFilterBadges() {
        const badgesContainer = document.getElementById("activeFiltersBadges");

        if (badgesContainer) badgesContainer.innerHTML = "";

        // Check if there are any filters (including search and chart filter)
        const hasFilters =
          Object.keys(activeFilters).length > 0 ||
          selectedSearchTerm !== "" ||
          chartFilter.active;

        if (!hasFilters) {
          if (badgesContainer) badgesContainer.style.display = "none";
          return;
        }

        if (badgesContainer) badgesContainer.style.display = "flex";

        // Add chart filter badge first (if active)
        if (chartFilter.active) {
          const chartBadge = document.createElement("span");
          chartBadge.id = "chartFilterBadge";
          chartBadge.className =
            "inline-flex items-center bg-white text-sm text-gray-600 border border-gray-300 rounded-lg gap-x-2 py-1.5 pl-3 pr-1";

          // Get proper label for the filter type
          let filterTypeLabel =
            chartFilter.type.charAt(0).toUpperCase() +
            chartFilter.type.slice(1);
          if (chartFilter.type === "relationship")
            filterTypeLabel = "Relationship";
          if (chartFilter.type === "product") filterTypeLabel = "Product";
          if (chartFilter.type === "facilityType")
            filterTypeLabel = "Facility Type";
          if (chartFilter.type === "region") filterTypeLabel = "Region";
          if (chartFilter.type === "expiryMonth")
            filterTypeLabel = "Expiry Month";
          if (chartFilter.type === "pipelineType")
            filterTypeLabel = "Pipeline Type";
          if (chartFilter.type === "pipelineWeek")
            filterTypeLabel = "Pipeline Week";

          chartBadge.innerHTML = `
                    <span class="text-gray-600">${filterTypeLabel}</span>
                    <span class="h-4 w-px bg-gray-300"></span>
                    <span class="font-medium text-gray-800">${chartFilter.label}</span>
                    <button type="button" onclick="clearChartFilter()" 
                        class="flex h-5 w-5 items-center justify-center rounded text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                        aria-label="Remove">
                        <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                        </svg>
                    </button>
                `;
          badgesContainer.appendChild(chartBadge);
        }

        // Add search badge if search is active
        if (selectedSearchTerm !== "") {
          const searchBadge = document.createElement("span");
          searchBadge.className =
            "inline-flex items-center bg-white text-sm text-gray-600 border border-gray-300 rounded-lg gap-x-2 py-1.5 pl-3 pr-1";
          searchBadge.innerHTML = `
                    <span class="text-gray-600">Search</span>
                    <span class="h-4 w-px bg-gray-300"></span>
                    <span class="font-medium text-gray-800">"${selectedSearchTerm}"</span>
                    <button type="button" onclick="clearSearchFilter()" 
                        class="flex h-5 w-5 items-center justify-center rounded text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                        aria-label="Remove">
                        <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                        </svg>
                    </button>
                `;
          badgesContainer.appendChild(searchBadge);
        }

        // Add other filter badges (Search handled above)
        Object.entries(activeFilters).forEach(([label, value]) => {
          if (label === "Search") return;
          if (!badgesContainer) return;
          const safeLabel = String(label).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
          const badge = document.createElement("span");
          badge.className =
            "inline-flex items-center bg-white text-sm text-gray-600 border border-gray-300 rounded-lg gap-x-2 py-1.5 pl-3 pr-1";
          badge.innerHTML = `
                        <span class="text-gray-600">${label}</span>
                        <span class="h-4 w-px bg-gray-300"></span>
                        <span class="font-medium text-gray-800">${value}</span>
                        <button type="button" onclick="removeFilter('${safeLabel}')" 
                            class="flex h-5 w-5 items-center justify-center rounded text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                            aria-label="Remove">
                            <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                            </svg>
                        </button>
                    `;
          badgesContainer.appendChild(badge);
        });
      }

      function clearChartFilter() {
        if (typeof chartFilter !== "undefined") {
          chartFilter.active = false;
          chartFilter.type = null;
          chartFilter.value = null;
          chartFilter.label = null;
        }
        if (typeof displayFilterBadges === "function") displayFilterBadges();
        if (typeof applyFilters === "function") applyFilters();
      }

      // ===== Expand Modal (PAL-overview pattern) =====
      let currentExpandType = null;
      const expandChartInstances = {};

      const EXPAND_MODAL_META = {
        pastDue: {
          title: "Past Due Covenants",
          subtitle: "Aging, regional, and underwriter breakdown of past due covenants",
        },
        comingDue: {
          title: "Total Coming Due",
          subtitle: "All Coming Due covenants — Coming Due / Past Due = Coming Due",
        },
        actionNeeded: {
          title: "Action Needed",
          subtitle: "Past Due only — overdue covenants requiring follow-up",
        },
        totalActive: {
          title: "Total Covenants",
          subtitle: "All covenants in the filtered file — status, region, and product mix",
        },
        relationships: {
          title: "Relationships with Active Covenants",
          subtitle: "Unique relationships, concentration, and covenant intensity",
        },
        covenantMonitoring: {
          title: "Action Needed by Region",
          subtitle: "Past Due concentration by region, with product and relationship detail",
        },
        covenantRegional: {
          title: "Covenants by Region",
          subtitle: "Regional breakdown of covenant status and aging",
        },
        activity: {
          title: "Covenant Activity",
          subtitle: "Deferred / Waived / Deleted activity insights",
        },
        activityRegional: {
          title: "Covenant Activity by Region",
          subtitle: "Regional summary of covenant activity",
        },
        agingByRegion: {
          title: "Aging Severity by Region",
          subtitle: "Past due aging buckets stacked by region",
        },
        productDonut: {
          title: "Covenants by Product Program",
          subtitle: "Product Program donut with regional bar breakdown",
        },
        covenantDetails: {
          title: "Action Needed",
          subtitle: "Past Due covenant records for follow-up",
        },
      };

      function destroyExpandCharts() {
        Object.keys(expandChartInstances).forEach((key) => {
          try {
            if (expandChartInstances[key]) {
              expandChartInstances[key].destroy();
              expandChartInstances[key] = null;
            }
          } catch (e) {
            /* ignore */
          }
        });
      }

      function closeExpandModal() {
        const expandModal = document.getElementById("expandModal");
        if (expandModal) expandModal.classList.add("hidden");
        document.body.style.overflow = "";
        destroyExpandCharts();
        currentExpandType = null;
      }

      function switchExpandTab(tabName) {
        const insightsTab = document.getElementById("insightsTab");
        const insightsContent = document.getElementById("insightsContent");
        const activeClass =
          "inline-flex items-center gap-2 border-b-2 px-2.5 py-3 text-sm font-medium transition-colors duration-200 ease-in-out text-blue-600 border-blue-600";
        if (tabName === "insights" && insightsTab && insightsContent) {
          insightsTab.className = activeClass;
          insightsContent.classList.remove("hidden");
        }
      }

      function expandMetricCard(iconBg, iconColor, iconPath, label, value) {
        return `
          <div class="rounded-xl border border-gray-200 bg-white p-5">
            <div class="flex items-start gap-3">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}">
                <svg class="h-5 w-5 shrink-0 ${iconColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${iconPath}"></path>
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-500">${label}</p>
                <h3 class="text-2xl font-bold text-gray-900">${value}</h3>
              </div>
            </div>
          </div>`;
      }

      function expandCountBy(rows, keyFn) {
        const map = {};
        (rows || []).forEach((row) => {
          const key = keyFn(row) || "Unknown";
          map[key] = (map[key] || 0) + 1;
        });
        return Object.entries(map).sort((a, b) => b[1] - a[1]);
      }

      function expandAgingBucket(row) {
        const cat = normalizePastDueCategoryValue(row && row.Past_Due_Category);
        if (cat === ">90 Days") return ">90";
        if (cat === "61-90 Days") return "61-90";
        if (cat === "46-60 Days") return "46-60";
        if (cat === "31-45 Days") return "31-45";
        if (cat === "0-30 Days" || cat === "1-45 Days") return "1-30";
        return null;
      }

      function expandRegionalAgingTable(rows, allRows) {
        const regions = ["APAC", "EMEA", "NAM", "LATAM"];
        const aging = {};
        const pop = {};
        regions.forEach((r) => {
          aging[r] = { "1-30": 0, "31-45": 0, "46-60": 0, "61-90": 0, ">90": 0, comingDue: 0 };
          pop[r] = 0;
        });
        (allRows || rows || []).forEach((row) => {
          const region = String(row.Region || "").trim().toUpperCase();
          if (pop[region] !== undefined) pop[region]++;
        });
        (rows || []).forEach((row) => {
          const region = String(row.Region || "").trim().toUpperCase();
          if (!aging[region]) return;
          if (isCovenantComingDue(row)) {
            aging[region].comingDue++;
            return;
          }
          const bucket = expandAgingBucket(row);
          if (bucket && aging[region][bucket] !== undefined) aging[region][bucket]++;
        });

        const isPast = (rows || []).some((r) => isCovenantPastDue(r));
        const header = isPast
          ? `<th class="px-3 py-3 text-xs font-semibold text-gray-700 text-left">Region</th>
             <th class="px-2 py-3 text-xs font-semibold text-gray-700 text-center">1-45</th>
             <th class="px-2 py-3 text-xs font-semibold text-gray-700 text-center">46-90</th>
             <th class="px-2 py-3 text-xs font-semibold text-gray-700 text-center">&gt;90</th>
             <th class="px-2 py-3 text-xs font-semibold text-gray-700 text-center">Total PD</th>
             <th class="px-2 py-3 text-xs font-semibold text-gray-700 text-center">Total Cov</th>
             <th class="px-2 py-3 text-xs font-semibold text-gray-700 text-center">%</th>`
          : `<th class="px-3 py-3 text-xs font-semibold text-gray-700 text-left">Region</th>
             <th class="px-2 py-3 text-xs font-semibold text-gray-700 text-center">Upcoming</th>
             <th class="px-2 py-3 text-xs font-semibold text-gray-700 text-center">Total Cov</th>
             <th class="px-2 py-3 text-xs font-semibold text-gray-700 text-center">%</th>`;

        const body = regions
          .filter((r) => pop[r] > 0)
          .map((r) => {
            const c145 = aging[r]["1-30"] + aging[r]["31-45"];
            const c4690 = aging[r]["46-60"] + aging[r]["61-90"];
            const c90 = aging[r][">90"];
            const pd = c145 + c4690 + c90;
            const cd = aging[r].comingDue;
            if (isPast) {
              const pct = pop[r] > 0 ? ((pd / pop[r]) * 100).toFixed(1) : "0.0";
              return `<tr class="border-b border-gray-100 hover:bg-gray-50">
                <td class="px-3 py-3 text-xs font-medium text-gray-700">${r}</td>
                <td class="px-2 py-3 text-xs text-center font-semibold">${c145}</td>
                <td class="px-2 py-3 text-xs text-center font-semibold">${c4690}</td>
                <td class="px-2 py-3 text-xs text-center font-semibold">${c90}</td>
                <td class="px-2 py-3 text-xs text-center font-bold">${pd}</td>
                <td class="px-2 py-3 text-xs text-center font-bold">${pop[r]}</td>
                <td class="px-2 py-3 text-xs text-center font-semibold">${pct}%</td>
              </tr>`;
            }
            const totalCd = regions.reduce((s, x) => s + aging[x].comingDue, 0);
            const pct = totalCd > 0 ? ((cd / totalCd) * 100).toFixed(1) : "0.0";
            return `<tr class="border-b border-gray-100 hover:bg-gray-50">
              <td class="px-3 py-3 text-xs font-medium text-gray-700">${r}</td>
              <td class="px-2 py-3 text-xs text-center font-bold">${cd}</td>
              <td class="px-2 py-3 text-xs text-center font-bold">${pop[r]}</td>
              <td class="px-2 py-3 text-xs text-center font-semibold">${pct}%</td>
            </tr>`;
          })
          .join("");

        return `
          <div class="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div class="border-b border-gray-200 px-6 py-4">
              <h3 class="text-base font-semibold text-gray-900">${isPast ? "Past Due" : "Upcoming"} by Region</h3>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full"><thead><tr class="bg-gray-50">${header}</tr></thead>
              <tbody>${body || `<tr><td colspan="7" class="px-4 py-8 text-center text-sm text-gray-400">No regional data</td></tr>`}</tbody>
              </table>
            </div>
          </div>`;
      }

      const EXPAND_LEGEND_COLORS = [
        "#3641f5",
        "#7592ff",
        "#dde9ff",
        "#ff6b6b",
        "#ffd93d",
        "#6bcf7f",
        "#c084fc",
      ];

      function expandRankedList(title, subtitle, entries, total, colors) {
        const palette = colors || EXPAND_LEGEND_COLORS;
        const rows = (entries || []).slice(0, 12);
        return `
          <div class="rounded-xl border border-gray-200 bg-white">
            <div class="border-b border-gray-200 px-6 py-4">
              <h3 class="text-base font-semibold text-gray-900">${title}</h3>
            </div>
            <div class="p-6 space-y-3" id="expandRankedList">
              ${
                rows.length
                  ? rows
                      .map(([name, count], i) => {
                        const pct = total > 0 ? ((count / total) * 100).toFixed(1) : "0.0";
                        return `<div class="flex items-center gap-3 py-1">
                          <div class="w-4 h-4 rounded-sm flex-shrink-0" style="background-color:${palette[i % palette.length]}"></div>
                          <p class="text-sm font-medium text-gray-800 flex-1 truncate">${name}</p>
                          <p class="text-sm font-semibold text-gray-900">${count} <span class="text-gray-500 font-normal">• ${pct}%</span></p>
                        </div>`;
                      })
                      .join("")
                  : `<p class="text-sm text-gray-400 text-center py-6">No data</p>`
              }
            </div>
          </div>`;
      }

      function expandLegendHtml(entries, total, colors) {
        const palette = colors || EXPAND_LEGEND_COLORS;
        const rows = (entries || []).slice(0, 8);
        if (!rows.length) {
          return `<p class="text-sm text-gray-400 text-center py-6">No data</p>`;
        }
        return rows
          .map(([name, count], i) => {
            const pct = total > 0 ? ((count / total) * 100).toFixed(1) : "0.0";
            const color = palette[i % palette.length];
            return `<div class="flex items-center gap-3 py-2 min-w-0">
              <div class="w-4 h-4 rounded-sm flex-shrink-0" style="background-color: ${color};"></div>
              <p class="text-sm font-medium text-gray-800 flex-1 min-w-0 truncate" title="${escapeHtml(String(name))}">${escapeHtml(String(name))}</p>
              <p class="text-sm font-semibold text-gray-900 whitespace-nowrap flex-shrink-0">${count} <span class="text-gray-500 font-normal">• ${pct}%</span></p>
            </div>`;
          })
          .join("");
      }

      function expandDonutBlock(title, subtitle, entries, total, tooltipSubtitle, chartId, payloadKey, colors) {
        const display = (entries || []).slice(0, 8);
        const id = chartId || "expandProductDonut";
        const key = payloadKey || "__expandProductData";
        const palette = colors || EXPAND_LEGEND_COLORS;
        const payload = {
          total: total || 0,
          subtitle: tooltipSubtitle || subtitle || title || "Donut",
          colors: palette,
          items: display.map(([name, count]) => ({
            name,
            count,
          })),
        };
        return `
          <div class="rounded-xl border border-gray-200 bg-white p-4 overflow-hidden">
            <h3 class="text-base font-semibold text-gray-900 px-2 pt-2">${escapeHtml(title || "")}</h3>
            <div class="flex flex-col sm:flex-row items-center justify-center gap-6 mt-2 min-w-0">
              <div id="${id}" class="flex-shrink-0 overflow-hidden" style="width:280px;min-height:280px"></div>
              <div class="flex-1 w-full max-w-md min-w-0 px-2 overflow-hidden">${expandLegendHtml(display, total, palette)}</div>
            </div>
          </div>
          <script>window.${key}=${JSON.stringify(payload)};</script>`;
      }

      function expandProductDonutBlock(title, subtitle, entries, total, tooltipSubtitle) {
        return expandDonutBlock(
          title,
          subtitle,
          entries,
          total,
          tooltipSubtitle,
          "expandProductDonut",
          "__expandProductData"
        );
      }

      function expandFrequencyDonutBlock(title, subtitle, entries, total, tooltipSubtitle) {
        return expandDonutBlock(
          title || "By Periodicity / Frequency",
          subtitle,
          entries,
          total,
          tooltipSubtitle || "Periodicity / Frequency",
          "expandFrequencyDonut",
          "__expandFrequencyData"
        );
      }

      function expandUnderwriterBarBlock(title, subtitle, entries, total, tooltipSubtitle, baseColor) {
        const display = (entries || []).slice(0, 5);
        const counts = display.map((x) => x[1]);
        const base = baseColor || "#3641f5";
        const payload = {
          labels: display.map((x) => x[0]),
          counts,
          total: total || 0,
          name: "Underwriters",
          subtitle: tooltipSubtitle || subtitle || "By underwriter",
          colors: covCountIntensityColors(counts, base),
        };
        return `
          <div class="rounded-xl border border-gray-200 bg-white p-4">
            <h3 class="text-base font-semibold text-gray-900 px-2 pt-2">${escapeHtml(title || "Covenants by Underwriter Top 5")}</h3>
            <div class="mt-2 min-w-0">
              <div id="expandUnderwriterBar" class="w-full min-w-0" style="height:280px;width:100%"></div>
            </div>
          </div>
          <script>window.__expandUnderwriterBar=${JSON.stringify(payload)};</script>`;
      }

      function expandTopTable(title, subtitle, headers, rowHtml) {
        return `
          <div class="rounded-2xl border border-gray-200 bg-white mb-6">
            <div class="px-6 py-4 border-b border-gray-200">
              <h3 class="text-lg font-semibold text-gray-800">${title}</h3>
            </div>
            <div class="overflow-x-auto">
              <table class="min-w-full">
                <thead><tr class="bg-gray-50">${headers
                  .map(
                    (h) =>
                      `<th class="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-500 ${
                        h.center ? "text-center" : "text-left"
                      }">${h.label}</th>`
                  )
                  .join("")}</tr></thead>
                <tbody class="divide-y divide-gray-200">${rowHtml}</tbody>
              </table>
            </div>
          </div>`;
      }

      function generatePastDueExpandedView(dataSource) {
        const rows = (dataSource || []).filter((r) => isCovenantPastDue(r));
        const total = rows.length;
        const rels = new Set(rows.map((r) => getCovenantRelationshipKey(r)).filter(Boolean));
        const facs = new Set(
          rows.map((r) => String(r.Facility_Number || "").trim()).filter(Boolean)
        );
        const avgDays =
          total > 0
            ? Math.round(
                rows.reduce((s, r) => s + (parseFloat(r.Days_Past_Due) || 0), 0) / total
              )
            : 0;
        const aging = { "1-45": 0, "46-90": 0, ">90": 0 };
        rows.forEach((r) => {
          const b = expandAgingBucket(r);
          if (b === ">90") aging[">90"]++;
          else if (b === "46-60" || b === "61-90") aging["46-90"]++;
          else if (b) aging["1-45"]++;
        });
        const byProduct = expandCountBy(rows, (r) => getCovenantProductProgram(r));
        const byUw = expandCountBy(
          rows,
          (r) => r.Lead_Underwriter || r.Underwriter || "Unknown"
        );
        const regional = buildInsightRegionalAging(rows);

        return `
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            ${expandMetricCard("bg-red-100", "text-red-600", "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z", "Past Due", total.toLocaleString(), `${aging[">90"]} over 90 days`)}
            ${expandMetricCard("bg-purple-100", "text-purple-600", "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z", "Relationships", rels.size.toLocaleString(), "Unique clients")}
            ${expandMetricCard("bg-green-100", "text-green-600", "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4", "Facilities", facs.size.toLocaleString(), "Unique facilities")}
            ${expandMetricCard("bg-gray-100", "text-gray-700", "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", "Avg Days Past Due", avgDays + " days", `1-45: ${aging["1-45"]} · 46-90: ${aging["46-90"]}`)}
          </div>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div class="rounded-xl border border-gray-200 bg-white p-4">
              <h3 class="text-base font-semibold text-gray-900 px-2 pt-2">Aging Severity by Region</h3>
              <div id="expandAgingStacked" class="w-full" style="min-height:320px"></div>
            </div>
            <div class="rounded-xl border border-gray-200 bg-white p-4">
              <h3 class="text-base font-semibold text-gray-900 px-2 pt-2">Past Due Aging Mix</h3>
              <div id="expandAgingDonut" class="w-full" style="min-height:280px"></div>
            </div>
          </div>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            ${expandProductDonutBlock(
              "Covenants by Product Program",
              "Past Due concentration by Product_Program",
              byProduct,
              total,
              "Past Due by Product Program"
            )}
            ${expandUnderwriterBarBlock(
              "Covenants by Underwriter Top 5",
              "Past Due volume by underwriter",
              byUw,
              total,
              "Past Due by underwriter",
              "#dc2626"
            )}
          </div>
          <div class="grid grid-cols-1 gap-6 mb-6">
            ${expandRegionalAgingTable(rows, dataSource)}
          </div>
          <script>window.__expandAgingRegional=${JSON.stringify(regional)};</script>`;
      }

      function generateComingDueExpandedView(dataSource) {
        const rows = (dataSource || []).filter((r) => isCovenantComingDue(r));
        const total = rows.length;
        const asOf = getCovenantAsOfDate(dataSource);
        const byProduct = expandCountBy(rows, (r) => getCovenantProductProgram(r));
        const byUw = expandCountBy(
          rows,
          (r) => r.Lead_Underwriter || r.Underwriter || "Unknown"
        );
        const buckets = buildComingDueBucketCounts(rows, asOf);
        const regionBuckets = buildComingDueBucketsByRegion(rows, asOf);
        const bucketEntries = COMING_DUE_BUCKET_LABELS.map((label) => [
          label,
          buckets[label] || 0,
        ]);
        const soonest = rows
          .slice()
          .sort((a, b) =>
            String(a.Covenant_Due_Date || "").localeCompare(
              String(b.Covenant_Due_Date || "")
            )
          )
          .slice(0, 15);

        return `
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            ${expandMetricCard("bg-green-100", "text-green-600", "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", "Total Coming Due", total.toLocaleString())}
            ${expandMetricCard("bg-green-100", "text-green-700", "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", "1-45 Days", (buckets["1-45 Days"] || 0).toLocaleString())}
            ${expandMetricCard("bg-green-50", "text-green-600", "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", "46-60 Days", (buckets["46-60 Days"] || 0).toLocaleString())}
            ${expandMetricCard("bg-green-50", "text-green-600", "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", "61-90 Days", (buckets["61-90 Days"] || 0).toLocaleString())}
            ${expandMetricCard("bg-green-50", "text-green-500", "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", "90+ Days", (buckets["90+ Days"] || 0).toLocaleString())}
          </div>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            ${expandDonutBlock(
              "Coming Due Mix",
              "",
              bucketEntries,
              total,
              "Days until Covenant Due Date",
              "expandComingDueMixDonut",
              "__expandComingDueMix",
              COMING_DUE_BUCKET_COLORS
            )}
            <div class="rounded-xl border border-gray-200 bg-white p-4">
              <h3 class="text-base font-semibold text-gray-900 px-2 pt-2">Coming Due by Region</h3>
              <div id="expandComingDueRegionStacked" class="w-full" style="min-height:320px"></div>
            </div>
          </div>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            ${expandProductDonutBlock(
              "Covenants by Product Program",
              "Total Coming Due by Product_Program",
              byProduct,
              total,
              "Total Coming Due by Product Program"
            )}
            ${expandUnderwriterBarBlock(
              "Covenants by Underwriter Top 5",
              "Total Coming Due by underwriter",
              byUw,
              total,
              "Total Coming Due by underwriter",
              "#16a34a"
            )}
          </div>
          ${expandTopTable(
            "Soonest Upcoming Covenants",
            "Earliest Covenant Due Dates among Coming Due rows",
            [
              { label: "Relationship" },
              { label: "Covenant #" },
              { label: "Product Program" },
              { label: "Due Date", center: true },
              { label: "Region", center: true },
            ],
            soonest
              .map(
                (r) =>
                  `<tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 text-sm text-gray-900">${escapeHtml(r.Relationship_Name || r.Borrowers_Name || "—")}</td>
                    <td class="px-6 py-4 text-sm text-gray-700">${escapeHtml(r.Covenant_Number || "—")}</td>
                    <td class="px-6 py-4 text-sm text-gray-700">${escapeHtml(getCovenantProductProgram(r))}</td>
                    <td class="px-6 py-4 text-sm text-center font-semibold text-green-700">${escapeHtml(formatCovenantDate(r.Covenant_Due_Date))}</td>
                    <td class="px-6 py-4 text-sm text-center">${escapeHtml(String(r.Region || "—").toUpperCase())}</td>
                  </tr>`
              )
              .join("") ||
              `<tr><td colspan="5" class="px-6 py-8 text-center text-sm text-gray-400">No upcoming covenants</td></tr>`
          )}
          <script>window.__expandComingDueRegionStacked=${JSON.stringify(regionBuckets)};</script>`;
      }

      function generateActionNeededExpandedView(dataSource) {
        const rows = (dataSource || []).filter((r) => isCovenantActionNeeded(r));
        const total = rows.length;
        const rels = new Set(
          rows.map((r) => getCovenantRelationshipKey(r)).filter(Boolean)
        );
        const facs = new Set(
          rows.map((r) => String(r.Facility_Number || "").trim()).filter(Boolean)
        );
        const avgDays =
          total > 0
            ? Math.round(
                rows.reduce((s, r) => s + (parseFloat(r.Days_Past_Due) || 0), 0) / total
              )
            : 0;
        const byProduct = expandCountBy(rows, (r) => getCovenantProductProgram(r));
        const byRegion = expandCountBy(rows, (r) =>
          String(r.Region || "Unknown").trim().toUpperCase()
        );
        const byUw = expandCountBy(
          rows,
          (r) => r.Lead_Underwriter || r.Underwriter || "Unknown"
        );
        const byFreq = expandCountBy(rows, (r) => getCovenantFrequency(r));
        const regionChart = byRegion.slice(0, 8);
        const worst = rows
          .slice()
          .sort((a, b) => (Number(b.Days_Past_Due) || 0) - (Number(a.Days_Past_Due) || 0))
          .slice(0, 15);

        return `
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            ${expandMetricCard("bg-red-100", "text-red-600", "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z", "Action Needed", total.toLocaleString())}
            ${expandMetricCard("bg-gray-100", "text-gray-700", "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z", "Relationships", rels.size.toLocaleString())}
            ${expandMetricCard("bg-gray-100", "text-gray-700", "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4", "Facilities", facs.size.toLocaleString())}
            ${expandMetricCard("bg-red-50", "text-red-600", "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", "Avg Days Past Due", avgDays.toLocaleString())}
          </div>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div class="rounded-xl border border-gray-200 bg-white p-4">
              <h3 class="text-base font-semibold text-gray-900 px-2 pt-2">Action Needed by Region</h3>
              <div id="expandActionNeededBar" class="w-full" style="min-height:320px"></div>
            </div>
            ${expandFrequencyDonutBlock(
              "By Periodicity / Frequency",
              "",
              byFreq,
              total,
              "Action Needed by Periodicity / Frequency"
            )}
          </div>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            ${expandProductDonutBlock(
              "Covenants by Product Program",
              "Action Needed share by Product_Program",
              byProduct,
              total,
              "Action Needed by Product Program"
            )}
            ${expandUnderwriterBarBlock(
              "Covenants by Underwriter Top 5",
              "Action Needed by underwriter",
              byUw,
              total,
              "Action Needed by underwriter",
              "#dc2626"
            )}
          </div>
          ${expandTopTable(
            "Highest Days Past Due",
            "Investigate these Past Due covenants first",
            [
              { label: "Relationship" },
              { label: "Facility" },
              { label: "Covenant #" },
              { label: "Days", center: true },
              { label: "Category", center: true },
              { label: "Due Date", center: true },
            ],
            worst
              .map(
                (r) =>
                  `<tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 text-sm text-gray-900">${escapeHtml(r.Relationship_Name || r.Borrowers_Name || "—")}</td>
                    <td class="px-6 py-4 text-sm text-gray-700">${escapeHtml(r.Facility_Number || "—")}</td>
                    <td class="px-6 py-4 text-sm text-gray-700">${escapeHtml(r.Covenant_Number || "—")}</td>
                    <td class="px-6 py-4 text-sm text-center font-semibold text-red-600">${Number(r.Days_Past_Due) || 0}</td>
                    <td class="px-6 py-4 text-sm text-center">${escapeHtml(normalizePastDueCategoryValue(r.Past_Due_Category) || "—")}</td>
                    <td class="px-6 py-4 text-sm text-center">${escapeHtml(formatCovenantDate(r.Covenant_Due_Date))}</td>
                  </tr>`
              )
              .join("") ||
              `<tr><td colspan="6" class="px-6 py-8 text-center text-sm text-gray-400">No Action Needed covenants</td></tr>`
          )}
          ${expandRegionalAgingTable(rows, dataSource)}
          <script>window.__expandActionNeededBar=${JSON.stringify({
            labels: regionChart.map((x) => x[0]),
            counts: regionChart.map((x) => x[1]),
            total,
          })};</script>`;
      }

      function generateTotalActiveExpandedView(dataSource) {
        const rows = dataSource || [];
        const total = rows.length;
        const past = rows.filter((r) => isCovenantPastDue(r)).length;
        const coming = rows.filter((r) => isCovenantComingDue(r)).length;
        const other = Math.max(0, total - past - coming);
        const rels = new Set(rows.map((r) => getCovenantRelationshipKey(r)).filter(Boolean));
        const byProduct = expandCountBy(rows, (r) => getCovenantProductProgram(r));
        const byUw = expandCountBy(
          rows,
          (r) => r.Lead_Underwriter || r.Underwriter || "Unknown"
        );
        const byRegion = expandCountBy(rows, (r) =>
          String(r.Region || "Unknown").trim().toUpperCase()
        );

        return `
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            ${expandMetricCard("bg-blue-100", "text-blue-600", "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", "Total Active", total.toLocaleString(), "All filtered Excel rows")}
            ${expandMetricCard("bg-red-100", "text-red-600", "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z", "Past Due", past.toLocaleString(), total ? ((past / total) * 100).toFixed(1) + "% of total" : "0%")}
            ${expandMetricCard("bg-green-100", "text-green-600", "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", "Coming Due", coming.toLocaleString(), total ? ((coming / total) * 100).toFixed(1) + "% of total" : "0%")}
            ${expandMetricCard("bg-purple-100", "text-purple-600", "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z", "Relationships", rels.size.toLocaleString(), other ? other + " other status rows" : "Unique clients")}
          </div>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div class="rounded-xl border border-gray-200 bg-white p-4">
              <h3 class="text-base font-semibold text-gray-900 px-2 pt-2">Status Mix</h3>
              <div id="expandStatusDonut" style="min-height:280px"></div>
            </div>
            ${expandRankedList("By Region", "All active covenants by region", byRegion, total)}
          </div>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            ${expandProductDonutBlock(
              "Covenants by Product Program",
              "All active covenants by Product_Program",
              byProduct,
              total,
              "Total covenants by Product Program"
            )}
            ${expandUnderwriterBarBlock(
              "Covenants by Underwriter Top 5",
              "All active covenants by underwriter",
              byUw,
              total,
              "Total covenants by underwriter",
              "#3641f5"
            )}
          </div>
          <script>window.__expandStatusMix=${JSON.stringify({ past, coming, other })};</script>`;
      }

      function generateRelationshipsExpandedView(dataSource) {
        const rows = dataSource || [];
        const byRel = {};
        rows.forEach((row) => {
          const key = getCovenantRelationshipKey(row) || "Unknown";
          if (!byRel[key]) {
            byRel[key] = {
              name:
                row.Relationship_Name ||
                row.Borrowers_Name ||
                key,
              region: String(row.Region || "").trim().toUpperCase() || "—",
              total: 0,
              pastDue: 0,
              comingDue: 0,
            };
          }
          byRel[key].total++;
          if (isCovenantPastDue(row)) byRel[key].pastDue++;
          else if (isCovenantComingDue(row)) byRel[key].comingDue++;
        });
        const list = Object.values(byRel).sort((a, b) => b.total - a.total);
        const withPast = list.filter((r) => r.pastDue > 0).length;
        const withComing = list.filter((r) => r.comingDue > 0).length;
        const avg = list.length ? (rows.length / list.length).toFixed(1) : "0";
        const top10Share =
          rows.length > 0
            ? (
                (list.slice(0, 10).reduce((s, r) => s + r.total, 0) / rows.length) *
                100
              ).toFixed(1)
            : "0.0";

        return `
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            ${expandMetricCard("bg-purple-100", "text-purple-600", "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z", "Relationships", list.length.toLocaleString(), "Unique Relationship IDs")}
            ${expandMetricCard("bg-blue-100", "text-blue-600", "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", "Avg Covenants / Rel", avg, "Intensity")}
            ${expandMetricCard("bg-red-100", "text-red-600", "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z", "With Past Due", withPast.toLocaleString(), "Relationships")}
            ${expandMetricCard("bg-green-100", "text-green-600", "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", "Top 10 Concentration", top10Share + "%", `${withComing} with Coming Due`)}
          </div>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div class="rounded-xl border border-gray-200 bg-white p-4">
              <h3 class="text-base font-semibold text-gray-900 px-2 pt-2">Action Needed by Relationship Top 5</h3>
              <div id="expandRelationshipsBar" class="w-full" style="min-height:320px"></div>
            </div>
            <div class="rounded-xl border border-gray-200 bg-white p-4">
              <h3 class="text-base font-semibold text-gray-900 px-2 pt-2">By Relationship Volume Top 5</h3>
              <div id="expandRelationshipVolumeBar" class="w-full" style="min-height:320px"></div>
            </div>
          </div>
          ${expandTopTable(
            "Top Relationships by Covenant Count",
            "Highest covenant volume relationships in the filtered file",
            [
              { label: "Relationship" },
              { label: "Region", center: true },
              { label: "Total", center: true },
              { label: "Past Due", center: true },
              { label: "Coming Due", center: true },
            ],
            list
              .slice(0, 20)
              .map(
                (r) =>
                  `<tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 text-sm font-medium text-gray-900">${r.name}</td>
                    <td class="px-6 py-4 text-sm text-center">${r.region}</td>
                    <td class="px-6 py-4 text-sm text-center font-semibold">${r.total}</td>
                    <td class="px-6 py-4 text-sm text-center text-red-600 font-semibold">${r.pastDue}</td>
                    <td class="px-6 py-4 text-sm text-center text-green-600 font-semibold">${r.comingDue}</td>
                  </tr>`
              )
              .join("") ||
              `<tr><td colspan="5" class="px-6 py-8 text-center text-sm text-gray-400">No data</td></tr>`
          )}
          <script>window.__expandRelationshipsBar=${JSON.stringify({
            labels: list.filter((r) => r.pastDue > 0).slice(0, 5).map((r) => r.name),
            counts: list.filter((r) => r.pastDue > 0).slice(0, 5).map((r) => r.pastDue),
            total: list.reduce((s, r) => s + r.pastDue, 0),
          })};
          window.__expandRelationshipVolumeBar=${JSON.stringify({
            labels: list.slice(0, 5).map((r) => r.name),
            counts: list.slice(0, 5).map((r) => r.total),
            total: rows.length,
            color: "#3641f5",
            name: "Covenants",
          })};</script>`;
      }

      function generateMonitoringExpandedView(dataSource) {
        return generatePastDueExpandedView(dataSource);
      }

      function generateProductExpandedView(dataSource) {
        const rows = dataSource || [];
        const productData = buildInsightProductData(rows);
        const total = rows.length;
        const top = productData[0];
        const topShare =
          top && total ? ((top[1].count / total) * 100).toFixed(1) : "0.0";
        const byRegion = expandCountBy(rows, (r) =>
          String(r.Region || "Unknown").trim().toUpperCase()
        );
        const productColors = [
          "#3641f5",
          "#7592ff",
          "#dde9ff",
          "#ff6b6b",
          "#ffd93d",
          "#6bcf7f",
          "#c084fc",
        ];
        const displayProducts = productData.slice(0, 8);
        const productLegend = displayProducts
          .map(([program, data], index) => {
            const color = productColors[index % productColors.length];
            const percentage = total ? ((data.count / total) * 100).toFixed(1) : "0.0";
            return `<div class="flex items-center gap-3 py-1.5">
              <div class="w-4 h-4 rounded-sm flex-shrink-0" style="background-color: ${color};"></div>
              <p class="text-sm font-medium text-gray-800 flex-1">${escapeHtml(program)}</p>
              <p class="text-sm font-semibold text-gray-900">${data.count} <span class="text-gray-500 font-normal">• ${percentage}%</span></p>
            </div>`;
          })
          .join("");

        const detailRows = productData
          .slice(0, 20)
          .map(([name, d]) => {
            const pct = total ? ((d.count / total) * 100).toFixed(1) : "0.0";
            return `<tr class="hover:bg-gray-50">
              <td class="px-6 py-4 text-sm font-medium text-gray-900">${name}</td>
              <td class="px-6 py-4 text-sm text-center font-semibold">${d.count}</td>
              <td class="px-6 py-4 text-sm text-center text-red-600">${d.statusBreakdown.pastDue}</td>
              <td class="px-6 py-4 text-sm text-center text-green-600">${d.statusBreakdown.comingDue}</td>
              <td class="px-6 py-4 text-sm text-center">${d.regionalBreakdown.NAM || 0}</td>
              <td class="px-6 py-4 text-sm text-center">${d.regionalBreakdown.EMEA || 0}</td>
              <td class="px-6 py-4 text-sm text-center">${d.regionalBreakdown.APAC || 0}</td>
              <td class="px-6 py-4 text-sm text-center">${d.regionalBreakdown.LATAM || 0}</td>
              <td class="px-6 py-4 text-sm text-center">${pct}%</td>
            </tr>`;
          })
          .join("");

        return `
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            ${expandMetricCard("bg-blue-100", "text-blue-600", "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", "Total Active", total.toLocaleString(), "Filtered rows")}
            ${expandMetricCard("bg-indigo-100", "text-indigo-600", "M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z", "Product Programs", productData.length.toLocaleString(), "Distinct Product_Program")}
            ${expandMetricCard("bg-purple-100", "text-purple-600", "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z", "Top Program Share", topShare + "%", top ? top[0] : "—")}
            ${expandMetricCard("bg-red-100", "text-red-600", "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z", "Past Due in Top", top ? top[1].statusBreakdown.pastDue.toLocaleString() : "0", "Within leading program")}
          </div>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div class="rounded-xl border border-gray-200 bg-white p-4">
              <h3 class="text-base font-semibold text-gray-900 px-2 pt-2">Covenants by Product Program</h3>
              <div class="flex flex-col sm:flex-row items-center gap-4 mt-2">
                <div id="expandProductDonut" class="flex-shrink-0" style="width:280px;min-height:280px"></div>
                <div class="flex-1 w-full px-2">${productLegend}</div>
              </div>
            </div>
            <div class="rounded-xl border border-gray-200 bg-white p-4">
              <h3 class="text-base font-semibold text-gray-900 px-2 pt-2">Covenants by Region</h3>
              <div id="expandProductRegionBar" class="w-full" style="min-height:320px"></div>
            </div>
          </div>
          ${expandTopTable(
            "Product Program Detail",
            "Status and regional mix by Product_Program",
            [
              { label: "Product Program" },
              { label: "Total", center: true },
              { label: "Past Due", center: true },
              { label: "Coming Due", center: true },
              { label: "NAM", center: true },
              { label: "EMEA", center: true },
              { label: "APAC", center: true },
              { label: "LATAM", center: true },
              { label: "%", center: true },
            ],
            detailRows ||
              `<tr><td colspan="9" class="px-6 py-8 text-center text-sm text-gray-400">No data</td></tr>`
          )}
          <script>
            window.__expandProductData=${JSON.stringify({
              total,
              items: displayProducts.map(([n, d]) => ({
                name: n,
                count: d.count,
                pastDue: d.statusBreakdown.pastDue,
                comingDue: d.statusBreakdown.comingDue,
                other: d.statusBreakdown.other,
                relationships: d.relationships ? d.relationships.size : 0,
              })),
            })};
            window.__expandProductRegionBar=${JSON.stringify({
              labels: byRegion.map((x) => x[0]),
              counts: byRegion.map((x) => x[1]),
              total,
              color: "#3641f5",
              name: "Covenants",
            })};
          </script>`;
      }

      function generateAgingExpandedView(dataSource) {
        const pastDueRows = (dataSource || []).filter((r) => isCovenantPastDue(r));
        const regional = buildInsightRegionalAging(pastDueRows);
        const regions = ["APAC", "EMEA", "NAM", "LATAM"];
        let t145 = 0,
          t4690 = 0,
          t90 = 0;
        regions.forEach((r) => {
          const d = regional[r] || {};
          t145 += (d["1-30"] || 0) + (d["31-45"] || 0);
          t4690 += (d["46-60"] || 0) + (d["61-90"] || 0);
          t90 += d[">90"] || 0;
        });
        const total = t145 + t4690 + t90;

        return `
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            ${expandMetricCard("bg-red-100", "text-red-600", "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z", "Past Due Total", total.toLocaleString(), "Aging from Past Due Category")}
            ${expandMetricCard("bg-red-50", "text-red-400", "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", "1-45 Days", t145.toLocaleString(), total ? ((t145 / total) * 100).toFixed(1) + "%" : "0%")}
            ${expandMetricCard("bg-red-100", "text-red-600", "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", "46-90 Days", t4690.toLocaleString(), total ? ((t4690 / total) * 100).toFixed(1) + "%" : "0%")}
            ${expandMetricCard("bg-rose-100", "text-rose-600", "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z", ">90 Days", t90.toLocaleString(), total ? ((t90 / total) * 100).toFixed(1) + "%" : "0%")}
          </div>
          ${expandRegionalAgingTable(pastDueRows, dataSource)}
          <div class="rounded-xl border border-gray-200 bg-white p-4 mt-6">
            <h3 class="text-base font-semibold text-gray-900 px-2 pt-2 mb-2">Aging Severity Chart</h3>
            <div id="expandAgingStacked" style="min-height:320px"></div>
          </div>
          <script>window.__expandAgingRegional=${JSON.stringify(regional)};</script>`;
      }

      function generateActivityExpandedView() {
        const view = window.currentCovActivityView || "deferred";
        const meta =
          (typeof COV_ACTIVITY_VIEW_META !== "undefined" && COV_ACTIVITY_VIEW_META[view]) ||
          { title: "Deferred Covenants", subtitle: "Activity insights" };
        const raw =
          (window.covenantsActivityData && window.covenantsActivityData.length
            ? window.covenantsActivityData
            : null) ||
          covenantsActivityData ||
          [];
        const rows =
          typeof filterCovenantActivityRows === "function"
            ? filterCovenantActivityRows(raw)
            : raw;
        const matrix =
          typeof buildCovenantActivityMatrix === "function"
            ? buildCovenantActivityMatrix(rows, view)
            : { months: [], regions: [], series: {} };
        const months = matrix.months || [];
        const regions = matrix.regions || [];
        const byRegionMap = matrix.byRegion || {};
        let total = (matrix.totals || []).reduce((s, n) => s + (n || 0), 0);
        if (!total) {
          regions.forEach((r) => {
            (byRegionMap[r] || []).forEach((n) => {
              total += n || 0;
            });
          });
        }
        const byRegion = regions
          .map((r) => [
            r,
            (byRegionMap[r] || []).reduce((s, n) => s + (n || 0), 0),
          ])
          .sort((a, b) => b[1] - a[1]);
        const latestMonth = months.length
          ? typeof formatMonthLabel === "function"
            ? formatMonthLabel(months[months.length - 1])
            : months[months.length - 1]
          : "—";
        const latestTotal = regions.reduce((s, r) => {
          const arr = byRegionMap[r] || [];
          return s + (arr[arr.length - 1] || 0);
        }, 0);

        return `
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            ${expandMetricCard("bg-blue-100", "text-blue-600", "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", meta.title.replace(" Covenants", ""), total.toLocaleString(), "Across 3 months from visible months")}
            ${expandMetricCard("bg-indigo-100", "text-indigo-600", "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", "Months", months.length.toLocaleString(), "Visible months window")}
            ${expandMetricCard("bg-green-100", "text-green-600", "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064", "Regions", regions.length.toLocaleString(), "With activity")}
            ${expandMetricCard("bg-amber-100", "text-amber-600", "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6", "Latest Month", latestTotal.toLocaleString(), latestMonth)}
          </div>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            ${expandProductDonutBlock(
              "By Region",
              (meta.title || "Deferred Covenants") + " across 3 months from visible months",
              byRegion.filter((entry) => (entry && entry[1]) > 0),
              total,
              (meta.title || "Deferred Covenants") + " by region"
            )}
            <div class="rounded-xl border border-gray-200 bg-white p-4 overflow-hidden">
              <h3 class="text-base font-semibold text-gray-900 px-2 pt-2 mb-2">Monthly Trend</h3>
              <div id="expandActivityTrend" class="w-full min-w-0 overflow-hidden" style="min-height:300px"></div>
            </div>
          </div>
          <script>window.__expandActivityMatrix=${JSON.stringify({
            months,
            regions,
            series: byRegionMap,
            view,
          })};</script>`;
      }

      function generateDetailsExpandedView(dataSource) {
        const filter = window.covenantDetailsFilter || "actionNeeded";
        const isUpcoming = filter === "comingDue" || filter === "upcoming";
        const isPastDue = !isUpcoming;
        const rows = (dataSource || []).filter((r) =>
          isUpcoming ? isCovenantComingDue(r) : isCovenantPastDue(r)
        );
        const label = isUpcoming ? "Coming Due" : "Action Needed";
        const byUw = expandCountBy(
          rows,
          (r) => r.Lead_Underwriter || r.Underwriter || "Unknown"
        );
        const byRel = expandCountBy(rows, (r) =>
          r.Relationship_Name || getCovenantRelationshipKey(r) || "Unknown"
        );
        return `
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            ${expandMetricCard(isPastDue ? "bg-red-100" : "bg-green-100", isPastDue ? "text-red-600" : "text-green-600", "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", label + " Rows", rows.length.toLocaleString(), "One row per covenant")}
            ${expandMetricCard("bg-purple-100", "text-purple-600", "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z", "Relationships", byRel.length.toLocaleString(), "In details scope")}
            ${expandMetricCard("bg-blue-100", "text-blue-600", "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", "Underwriters", byUw.length.toLocaleString(), "Responsible")}
            ${expandMetricCard("bg-gray-100", "text-gray-700", "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", "Top UW Share", rows.length && byUw[0] ? ((byUw[0][1] / rows.length) * 100).toFixed(1) + "%" : "0%", byUw[0] ? byUw[0][0] : "—")}
          </div>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div class="rounded-xl border border-gray-200 bg-white p-4">
              <h3 class="text-base font-semibold text-gray-900 px-2 pt-2">${label} by Relationship Top 5</h3>
              <div id="expandDetailsBar" class="w-full" style="min-height:320px"></div>
            </div>
            ${expandUnderwriterBarBlock(
              "Covenants by Underwriter Top 5",
              "Highest covenant counts by underwriter",
              byUw,
              rows.length,
              label + " by underwriter",
              isPastDue ? "#dc2626" : "#16a34a"
            )}
          </div>
          ${expandRegionalAgingTable(rows, dataSource)}
          <script>window.__expandDetailsBar=${JSON.stringify({
            labels: byRel.slice(0, 5).map((x) => x[0]),
            counts: byRel.slice(0, 5).map((x) => x[1]),
            total: rows.length,
            color: isPastDue ? "#dc2626" : "#16a34a",
            name: label,
          })};</script>`;
      }

      function generateExpandedView(chartType, dataSource) {
        if (!dataSource || dataSource.length === 0) {
          if (chartType !== "activity" && chartType !== "activityRegional") {
            return `<div class="flex items-center justify-center min-h-[400px]">
              <div class="text-center">
                <h3 class="text-sm font-medium text-gray-900">No data available</h3>
                <p class="mt-1 text-sm text-gray-500">No covenants match your current filters.</p>
              </div>
            </div>`;
          }
        }
        switch (chartType) {
          case "pastDue":
            return generatePastDueExpandedView(dataSource);
          case "comingDue":
            return generateComingDueExpandedView(dataSource);
          case "actionNeeded":
            return generateActionNeededExpandedView(dataSource);
          case "totalActive":
            return generateTotalActiveExpandedView(dataSource);
          case "relationships":
            return generateRelationshipsExpandedView(dataSource);
          case "covenantMonitoring":
            return generatePastDueExpandedView(dataSource);
          case "covenantRegional":
            return generateAgingExpandedView(dataSource);
          case "productDonut":
            return generateProductExpandedView(dataSource);
          case "agingByRegion":
            return generateAgingExpandedView(dataSource);
          case "activity":
          case "activityRegional":
            return generateActivityExpandedView();
          case "covenantDetails":
            return generateDetailsExpandedView(dataSource);
          default:
            return '<p class="text-gray-500">No detailed view available for this chart.</p>';
        }
      }

      function initializeExpandCharts(chartType) {
        if (typeof ApexCharts === "undefined") return;
        destroyExpandCharts();

        // Status mix donut (Total Active)
        const statusEl = document.getElementById("expandStatusDonut");
        if (statusEl && window.__expandStatusMix) {
          const m = window.__expandStatusMix;
          const chart = new ApexCharts(statusEl, {
            chart: { type: "donut", height: 280, fontFamily: "Outfit, sans-serif" },
            labels: ["Past Due", "Upcoming", "Other"],
            series: [m.past || 0, m.coming || 0, m.other || 0],
            colors: ["#dc2626", "#16a34a", "#94a3b8"],
            legend: { position: "bottom" },
            dataLabels: { enabled: false },
          });
          chart.render();
          expandChartInstances.status = chart;
        }

        // Product / frequency donuts — same visual as the dashboard Product Program card
        const renderExpandDonut = (elId, payloadKey, instanceKey) => {
          const el = document.getElementById(elId);
          const payload = window[payloadKey];
          if (!el || !payload) return;
          const data = Array.isArray(payload) ? payload : payload.items || [];
          if (!data.length) return;
          const donutTotal =
            (payload && payload.total) ||
            data.reduce((s, d) => s + (d.count || 0), 0);
          const colors = (payload && payload.colors) || EXPAND_LEGEND_COLORS;
          const chart = new ApexCharts(el, {
            series: data.map((d) => d.count),
            labels: data.map((d) => d.name),
            colors: colors.slice(0, data.length),
            chart: {
              fontFamily: "Outfit, sans-serif",
              type: "donut",
              width: 280,
              height: 280,
            },
            stroke: { show: false },
            plotOptions: {
              pie: {
                donut: {
                  size: "65%",
                  background: "transparent",
                  labels: {
                    show: true,
                    name: {
                      show: true,
                      offsetY: -10,
                      color: "#1D2939",
                      fontSize: "14px",
                      fontWeight: "600",
                    },
                    value: {
                      show: true,
                      offsetY: 10,
                      color: "#667085",
                      fontSize: "16px",
                      fontWeight: "700",
                    },
                    total: {
                      show: true,
                      label: "Total",
                      color: "#111827",
                      fontSize: "16px",
                      fontWeight: "700",
                      formatter: function (w) {
                        return w.globals.seriesTotals.reduce((a, b) => a + b, 0);
                      },
                    },
                  },
                },
              },
            },
            dataLabels: { enabled: false },
            legend: { show: false },
            tooltip: {
              enabled: true,
              theme: "light",
              custom: function ({ series, seriesIndex }) {
                const entry = data[seriesIndex] || {};
                if (typeof buildCovenantStyleTooltip === "function") {
                  const hasStatus =
                    entry.pastDue != null ||
                    entry.comingDue != null ||
                    entry.other != null;
                  return buildCovenantStyleTooltip({
                    title: entry.name || "Item",
                    subtitle: payload.subtitle || "Breakdown",
                    count: series[seriesIndex] || 0,
                    total: donutTotal,
                    breakdownTitle: hasStatus ? "Status" : undefined,
                    breakdownRows: hasStatus
                      ? [
                          { label: "Past Due", value: entry.pastDue || 0 },
                          { label: "Coming Due", value: entry.comingDue || 0 },
                          { label: "Other", value: entry.other || 0 },
                        ]
                      : [],
                    col1: "Status",
                    relationships: entry.relationships || 0,
                  });
                }
                return (
                  "<div class='px-2 py-1 text-sm'>" +
                  (entry.name || "Item") +
                  ": " +
                  (series[seriesIndex] || 0) +
                  "</div>"
                );
              },
            },
          });
          chart.render();
          expandChartInstances[instanceKey] = chart;
        };
        renderExpandDonut("expandProductDonut", "__expandProductData", "product");
        renderExpandDonut("expandFrequencyDonut", "__expandFrequencyData", "frequency");
        renderExpandDonut("expandComingDueMixDonut", "__expandComingDueMix", "comingDueMix");

        // Underwriter bar — same color legends as Product Program, different chart type
        const uwEl = document.getElementById("expandUnderwriterBar");
        if (uwEl && window.__expandUnderwriterBar) {
          const p = window.__expandUnderwriterBar;
          const chart = new ApexCharts(uwEl, {
            chart: {
              type: "bar",
              height: 280,
              width: "100%",
              fontFamily: "Outfit, sans-serif",
              toolbar: { show: false },
              parentHeightOffset: 0,
              offsetX: 0,
              offsetY: 0,
            },
            series: [{ name: p.name || "Underwriters", data: p.counts || [] }],
            xaxis: covHBarXAxis(p.labels || [], p.counts),
            yaxis: {
              labels: {
                show: true,
                maxWidth: 140,
                trim: true,
                offsetX: 0,
                minWidth: 0,
                style: { fontSize: "11px", colors: "#6B7280" },
                formatter: function (val) {
                  const s = String(val == null ? "" : val);
                  return s.length > 22 ? s.slice(0, 21) + "…" : s;
                },
              },
            },
            colors: p.colors || covCountIntensityColors(p.counts, "#3641f5"),
            plotOptions: covSingleBarPlotOptions({
              horizontal: true,
              distributed: true,
              barHeight: "52%",
            }),
            dataLabels: covSingleBarDataLabels({ horizontal: true }),
            legend: { show: false },
            grid: covHBarGrid(),
            tooltip: {
              enabled: true,
              custom: function ({ dataPointIndex }) {
                const name = (p.labels || [])[dataPointIndex] || "Underwriter";
                const count = (p.counts || [])[dataPointIndex] || 0;
                if (typeof buildCovenantStyleTooltip === "function") {
                  return buildCovenantStyleTooltip({
                    title: name,
                    subtitle: p.subtitle || "By underwriter",
                    count,
                    total: p.total || 0,
                  });
                }
                return (
                  '<div class="px-3 py-2 text-sm"><strong>' +
                  name +
                  "</strong><br/>" +
                  count +
                  "</div>"
                );
              },
            },
          });
          chart.render();
          expandChartInstances.underwriter = chart;
        }

        // Aging stacked
        const agingEl = document.getElementById("expandAgingStacked");
        if (agingEl && window.__expandAgingRegional) {
          const regional = window.__expandAgingRegional;
          const cats = ["APAC", "EMEA", "NAM", "LATAM"].filter((r) => regional[r]);
          const chart = new ApexCharts(agingEl, {
            chart: { type: "bar", stacked: true, height: 320, fontFamily: "Outfit, sans-serif", toolbar: { show: false } },
            series: [
              { name: "1-45", data: cats.map((r) => (regional[r]["1-30"] || 0) + (regional[r]["31-45"] || 0)) },
              { name: "46-90", data: cats.map((r) => (regional[r]["46-60"] || 0) + (regional[r]["61-90"] || 0)) },
              { name: ">90", data: cats.map((r) => regional[r][">90"] || 0) },
            ],
            xaxis: { categories: cats },
            colors: ["#fecaca", "#f87171", "#dc2626"],
            plotOptions: covStackedBarPlotOptions(),
            legend: { position: "top" },
            dataLabels: covStackedBarDataLabels(),
            grid: { padding: { top: 16 } },
          });
          chart.render();
          expandChartInstances.aging = chart;
        }

        // Coming Due by Region — same 1-45 / 46-60 / 61-90 / 90+ buckets as the details table
        const comingDueRegionEl = document.getElementById("expandComingDueRegionStacked");
        if (comingDueRegionEl && window.__expandComingDueRegionStacked) {
          const regional = window.__expandComingDueRegionStacked;
          const cats = ["APAC", "EMEA", "NAM", "LATAM"].filter(
            (r) =>
              regional[r] &&
              COMING_DUE_BUCKET_LABELS.some((b) => (regional[r][b] || 0) > 0)
          );
          const regions = cats.length
            ? cats
            : ["APAC", "EMEA", "NAM", "LATAM"].filter((r) => regional[r]);
          const chart = new ApexCharts(comingDueRegionEl, {
            chart: {
              type: "bar",
              stacked: true,
              height: 320,
              fontFamily: "Outfit, sans-serif",
              toolbar: { show: false },
            },
            series: COMING_DUE_BUCKET_LABELS.map((label) => ({
              name: label,
              data: regions.map((r) => (regional[r] && regional[r][label]) || 0),
            })),
            xaxis: { categories: regions },
            colors: COMING_DUE_BUCKET_COLORS,
            plotOptions: covStackedBarPlotOptions(),
            legend: { position: "top" },
            dataLabels: covStackedBarDataLabels(),
            grid: { padding: { top: 16 } },
          });
          chart.render();
          expandChartInstances.comingDueRegion = chart;
        }

        // Past due aging donut (Past Due expand only — Action Needed is all >90)
        const agingDonutEl = document.getElementById("expandAgingDonut");
        if (agingDonutEl && chartType !== "actionNeeded") {
          const dataSource =
            typeof getCovenantPageDataSource === "function"
              ? getCovenantPageDataSource() || []
              : [];
          const past = dataSource.filter((r) => isCovenantPastDue(r));
          const buckets = { "1-45": 0, "46-90": 0, ">90": 0 };
          past.forEach((r) => {
            const b = expandAgingBucket(r);
            if (b === ">90") buckets[">90"]++;
            else if (b === "46-60" || b === "61-90") buckets["46-90"]++;
            else if (b) buckets["1-45"]++;
          });
          const chart = new ApexCharts(agingDonutEl, {
            chart: { type: "donut", height: 280, fontFamily: "Outfit, sans-serif" },
            labels: ["1-45 Days", "46-90 Days", ">90 Days"],
            series: [buckets["1-45"], buckets["46-90"], buckets[">90"]],
            colors: ["#fecaca", "#f87171", "#dc2626"],
            legend: { position: "bottom" },
            dataLabels: { enabled: false },
            title: { text: "Past Due Aging Mix", style: { fontSize: "14px", fontWeight: 600 } },
          });
          chart.render();
          expandChartInstances.agingDonut = chart;
        }

        // Upcoming timeline (Coming Due expanded view)
        const upcomingTlEl = document.getElementById("expandUpcomingTimeline");
        if (upcomingTlEl && window.__expandUpcomingTimeline) {
          const tl = window.__expandUpcomingTimeline;
          const chart = new ApexCharts(upcomingTlEl, {
            chart: {
              type: "bar",
              height: 320,
              fontFamily: "Outfit, sans-serif",
              toolbar: { show: false },
              parentHeightOffset: 0,
            },
            series: [{ name: "Total Coming Due", data: tl.counts || [] }],
            xaxis: {
              categories: tl.labels || [],
              labels: { style: { fontSize: "12px", colors: "#6B7280" } },
            },
            yaxis: {
              labels: { style: { fontSize: "11px", colors: "#6B7280" } },
            },
            colors: ["#16a34a"],
            plotOptions: covSingleBarPlotOptions({ columnWidth: "46%" }),
            dataLabels: covSingleBarDataLabels(),
            grid: { borderColor: "#F3F4F6", strokeDashArray: 4, padding: { top: 18 } },
            tooltip: {
              enabled: true,
              custom: function ({ dataPointIndex }) {
                const count = (tl.counts || [])[dataPointIndex] || 0;
                const label = (tl.labels || [])[dataPointIndex] || "";
                const rels = (tl.relCounts || [])[dataPointIndex] || 0;
                const grand = tl.total || 0;
                if (typeof buildCovenantStyleTooltip === "function") {
                  return buildCovenantStyleTooltip({
                    title: label,
                    subtitle: "Total Coming Due",
                    count,
                    total: grand,
                    relationships: rels,
                  });
                }
                return (
                  '<div class="px-3 py-2 text-sm"><strong>' +
                  label +
                  "</strong><br/>Total Coming Due: " +
                  count +
                  "</div>"
                );
              },
            },
          });
          chart.render();
          expandChartInstances.upcomingTimeline = chart;
        }

        // Horizontal bar helper used by several expand views
        const renderExpandHBar = (elId, payloadKey, instanceKey, color, seriesName, intensity) => {
          const el = document.getElementById(elId);
          const payload = window[payloadKey];
          if (!el || !payload || !payload.labels || !payload.labels.length) return;
          const base = payload.color || color;
          const barColors = intensity
            ? covCountIntensityColors(payload.counts, base)
            : [base];
          const chart = new ApexCharts(el, {
            chart: {
              type: "bar",
              height: 320,
              fontFamily: "Outfit, sans-serif",
              toolbar: { show: false },
              parentHeightOffset: 0,
            },
            series: [{ name: payload.name || seriesName, data: payload.counts || [] }],
            xaxis: covHBarXAxis(payload.labels, payload.counts),
            yaxis: {
              labels: {
                maxWidth: 110,
                trim: true,
                style: { fontSize: "11px", colors: "#6B7280" },
              },
            },
            colors: barColors,
            plotOptions: covSingleBarPlotOptions({
              horizontal: true,
              distributed: !!intensity,
              barHeight: "58%",
            }),
            dataLabels: covSingleBarDataLabels({ horizontal: true }),
            grid: covHBarGrid({ padding: { left: 8, right: 52 } }),
            legend: { show: false },
          });
          chart.render();
          expandChartInstances[instanceKey] = chart;
        };
        renderExpandHBar("expandActionNeededBar", "__expandActionNeededBar", "actionNeeded", "#dc2626", "Action Needed");
        renderExpandHBar("expandComingDueRegionBar", "__expandComingDueRegionBar", "comingDueRegion", "#16a34a", "Total Coming Due");
        renderExpandHBar("expandProductRegionBar", "__expandProductRegionBar", "productRegion", "#3641f5", "Covenants");
        renderExpandHBar("expandRelationshipsBar", "__expandRelationshipsBar", "relationships", "#dc2626", "Action Needed", true);
        renderExpandHBar("expandRelationshipVolumeBar", "__expandRelationshipVolumeBar", "relVolume", "#3641f5", "Covenants", true);
        renderExpandHBar("expandDetailsBar", "__expandDetailsBar", "details", "#dc2626", "Covenants", true);

        // Activity trend
        const actEl = document.getElementById("expandActivityTrend");
        if (actEl && window.__expandActivityMatrix) {
          const m = window.__expandActivityMatrix;
          const chart = new ApexCharts(actEl, {
            chart: { type: "bar", stacked: true, height: 300, fontFamily: "Outfit, sans-serif", toolbar: { show: false } },
            series: (m.regions || []).map((r) => ({
              name: r,
              data: m.series[r] || [],
            })),
            xaxis: {
              categories: (m.months || []).map((k) =>
                typeof formatMonthLabel === "function" ? formatMonthLabel(k) : k
              ),
            },
            colors: ["#3641f5", "#7592ff", "#10b981", "#f59e0b", "#94a3b8"],
            plotOptions: covStackedBarPlotOptions(),
            legend: { position: "top" },
            dataLabels: covStackedBarDataLabels(),
            grid: { padding: { top: 16 } },
          });
          chart.render();
          expandChartInstances.activity = chart;
        }
      }

      function populateExpandModalValues(chartType) {
        const insightsContent = document.getElementById("insightsContent");
        if (!insightsContent) return;

        const dataSource =
          typeof getCovenantPageDataSource === "function"
            ? getCovenantPageDataSource() || []
            : covenantsData || [];

        insightsContent.innerHTML = `
          <div class="flex items-center justify-center py-12 text-gray-400">
            <svg class="animate-spin h-8 w-8 mr-3" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading insights...
          </div>`;

        setTimeout(() => {
          try {
            const html = generateExpandedView(chartType, dataSource);
            insightsContent.innerHTML = html;
            // Execute embedded scripts for chart data payloads
            const scripts = insightsContent.querySelectorAll("script");
            scripts.forEach((s) => {
              try {
                // eslint-disable-next-line no-eval
                eval(s.textContent);
              } catch (e) {
                console.warn("Expand script eval failed", e);
              }
            });
            initializeExpandCharts(chartType);
          } catch (error) {
            console.error("Error generating expanded view:", chartType, error);
            insightsContent.innerHTML = `
              <div class="flex items-center justify-center min-h-[400px]">
                <div class="text-center">
                  <h3 class="text-sm font-medium text-gray-900">Error loading expanded view</h3>
                  <p class="mt-1 text-sm text-gray-500">${error.message || error}</p>
                </div>
              </div>`;
          }
        }, 40);
      }

      function openExpandModal(chartType) {
        currentExpandType = chartType;
        const modal = document.getElementById("expandModal");
        const modalTitle = document.getElementById("expandModalTitle");
        const modalSubtitle = document.getElementById("expandModalSubtitle");
        if (!modal) {
          console.error("Expand modal element not found");
          return;
        }

        let meta = EXPAND_MODAL_META[chartType] || {
          title: chartType,
          subtitle: "Expanded view with additional details",
        };

        if (chartType === "covenantMonitoring") {
          meta = {
            title: "Past Due Covenants",
            subtitle: "Aging mix, regional table, and product concentration",
          };
        }
        if (chartType === "covenantRegional") {
          meta = {
            title: "Past Due Covenants by Region",
            subtitle: "Regional aging buckets from Past Due Category",
          };
        }

        if (chartType === "covenantDetails") {
          const filter = window.covenantDetailsFilter || "actionNeeded";
          if (filter === "comingDue" || filter === "upcoming") {
            meta = {
              title: "Coming Due Covenants",
              subtitle: "Underlying Coming Due records from the details table",
            };
          } else {
            meta = {
              title: "Past Due Covenants",
              subtitle: "Past Due covenant records for follow-up",
            };
          }
        }

        if (chartType === "activity" || chartType === "activityRegional") {
          const view = window.currentCovActivityView || "deferred";
          const viewMeta =
            (typeof COV_ACTIVITY_VIEW_META !== "undefined" &&
              COV_ACTIVITY_VIEW_META[view]) ||
            {};
          meta = {
            title: viewMeta.title || meta.title,
            subtitle: viewMeta.subtitle || meta.subtitle,
          };
        }

        if (modalTitle) modalTitle.textContent = meta.title;
        if (modalSubtitle) modalSubtitle.textContent = meta.subtitle;
        switchExpandTab("insights");
        populateExpandModalValues(chartType);
        modal.classList.remove("hidden");
        document.body.style.overflow = "hidden";
      }

      // ESC closes expand modal
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
          const modal = document.getElementById("expandModal");
          if (modal && !modal.classList.contains("hidden")) closeExpandModal();
        }
      });

      window.openExpandModal = openExpandModal;
      window.closeExpandModal = closeExpandModal;
      window.switchExpandTab = switchExpandTab;



      // Remove a specific filter
            function removeFilter(label) {
        const key = String(label || "").trim();
        if (key === "Region") {
          clearTopFilter("region");
          return;
        }
        if (key === "Product" || key === "Product Program") {
          clearTopFilter("product");
          return;
        }
        if (key === "Underwriter") {
          clearTopFilter("underwriter");
          return;
        }
        if (key === "Team Lead") {
          clearTopFilter("teamLead");
          return;
        }
        if (key === "Search") {
          if (typeof clearSearchFilter === "function") clearSearchFilter();
          return;
        }
        // Fallback: drop from activeFilters and refresh
        if (activeFilters && Object.prototype.hasOwnProperty.call(activeFilters, key)) {
          delete activeFilters[key];
        }
        if (typeof displayFilterBadges === "function") displayFilterBadges();
        if (typeof applyFilters === "function") applyFilters();
      }
      window.removeFilter = removeFilter;
      window.clearTopFilter = clearTopFilter;

      // Clear all filters
      function clearAllFilters() {
        // Clear all modal filter selections
        selectedModalFilters.originationUnit = [];
        selectedModalFilters.extendingUnit = [];
        selectedModalFilters.facilityType = [];
        selectedModalFilters.creditClassification = [];
        selectedModalFilters.teamLead = [];
        selectedModalFilters.caReview = [];
        selectedModalFilters.caMaturity = [];
        selectedModalFilters.facilityMaturity = [];
        selectedModalFilters.relationship = [];
        selectedModalFilters.dealStatus = [];
        selectedModalFilters.amountRange = [];
        selectedModalFilters.rotceRange = [];

        // Update all modal filter button labels
        const allFilterTypes = [
          "originationUnit",
          "extendingUnit",
          "facilityType",
          "creditClassification",
          "teamLead",
          "caReview",
          "caMaturity",
          "facilityMaturity",
          "relationship",
          "dealStatus",
          "amountRange",
          "rotceRange",
        ];

        const defaultLabels = {
          originationUnit: "Select unit",
          extendingUnit: "Select unit",
          facilityType: "Select type",
          creditClassification: "Select classification",
          teamLead: "Select lead",
          caReview: "Select review",
          caMaturity: "Select period",
          facilityMaturity: "Select period",
          relationship: "Select relationship",
          dealStatus: "Select status",
          amountRange: "Select range",
          rotceRange: "Select range",
        };

        allFilterTypes.forEach((filterType) => {
          const labelId = filterType + "ModalLabel";
          const btnId =
            "btn" +
            filterType.charAt(0).toUpperCase() +
            filterType.slice(1) +
            "Modal";
          const label = document.getElementById(labelId);
          const btn = document.getElementById(btnId);

          if (label && btn) {
            label.textContent = defaultLabels[filterType];
            btn.classList.remove(
              "border-blue-500",
              "text-blue-600",
              "bg-blue-50"
            );
            btn.classList.add("border-gray-200", "text-gray-600");
          }
        });

        // Reset PSE to default (All)
        /* PSE filter removed */

        activeFilters = {};
        applyFilters();
        updateFilterCount();
      }

      // Store temporary filter state when opening popover
      let tempFilterState = {};

      // Toggle filter popover
      
      // Apply filters and close popover
      
      // Update filter count badge
      
      // Calculate metrics from filtered data (OPTIMIZED)
      
      // Calculate Facilities Expired and CAs Expired metrics from filtered data
      
      // Create expiration chart from filtered data
      
      // Create relationship chart from filtered data (OPTIMIZED)
      
      // Smart Filter Functions

      // Flag to prevent multiple filter applications during batch operations
      let isResettingFilters = false;

      // Multi-select filter states (arrays)
      let selectedRegions = []; // Empty means all
      let selectedStatuses = []; // Empty means all
      let selectedProducts = []; // Empty means all
      let selectedSubProducts = []; // Empty means all
      let selectedPSEs = []; // Empty means all (PSE/non-PSE)
      let selectedUnderwriters = []; // Empty means all
      let selectedTeamLeads = []; // Empty means all

      // Temporary selection states (before Apply is clicked)
      let tempSelectedRegions = [];
      let tempSelectedStatuses = [];
      let tempSelectedProducts = [];
      let tempSelectedSubProducts = [];
      let tempSelectedPSEs = [];
      let tempSelectedUnderwriters = [];
      let tempSelectedTeamLeads = [];

      // Track which top filter dropdown is open
      let openTopFilter = null;

      // Toggle top filter dropdown
      function toggleTopFilter(filterType) {
        const dropdownId = filterType + "FilterDropdown";
        const dropdown = document.getElementById(dropdownId);

        if (!dropdown) return;

        // Close other dropdowns
        ["region", "product", "subproduct", "underwriter", "teamLead"].forEach((type) => {
          if (type !== filterType) {
            const otherDropdown = document.getElementById(
              type + "FilterDropdown"
            );
            if (otherDropdown) otherDropdown.classList.add("hidden");
          }
        });

        // Toggle current dropdown
        const isHidden = dropdown.classList.contains("hidden");
        if (isHidden) {
          if (
            filterType === "region" ||
            filterType === "product" ||
            filterType === "underwriter" ||
            filterType === "teamLead"
          ) {
            populateCovenantFilterDropdown(filterType);
          }
          dropdown.classList.remove("hidden");
          openTopFilter = filterType;

          // Initialize temp selection from current selection
          if (filterType === "region") {
            tempSelectedRegions = [...selectedRegions];
          } else if (filterType === "status") {
            tempSelectedStatuses = [...selectedStatuses];
          } else if (filterType === "product") {
            tempSelectedProducts = [...selectedProducts];
          } else if (filterType === "subproduct") {
            tempSelectedSubProducts = [...selectedSubProducts];
          } else if (filterType === "pse") {
            tempSelectedPSEs = [...selectedPSEs];
          } else if (filterType === "underwriter") {
            tempSelectedUnderwriters = [...selectedUnderwriters];
          } else if (filterType === "teamLead") {
            tempSelectedTeamLeads = [...selectedTeamLeads];
          }

          // Update visual states based on current selection
          updateFilterItemsUI(filterType);

          // Focus search input
          const searchInput = document.getElementById(
            filterType + "FilterSearch"
          );
          if (searchInput) {
            setTimeout(() => searchInput.focus(), 100);
          }
        } else {
          dropdown.classList.add("hidden");
          openTopFilter = null;
        }
      }

      // Toggle a filter item selection (click handler)
      function toggleFilterItem(element, filterType) {
        const value = element.getAttribute("data-value");
        if (!value) return;

        let tempArray;
        if (filterType === "region") {
          tempArray = tempSelectedRegions;
        } else if (filterType === "status") {
          tempArray = tempSelectedStatuses;
        } else if (filterType === "product") {
          tempArray = tempSelectedProducts;
        } else if (filterType === "subproduct") {
          tempArray = tempSelectedSubProducts;
        } else if (filterType === "pse") {
          tempArray = tempSelectedPSEs;
        } else if (filterType === "underwriter") {
          tempArray = tempSelectedUnderwriters;
        } else if (filterType === "teamLead") {
          tempArray = tempSelectedTeamLeads;
        }

        const index = tempArray.indexOf(value);
        if (index === -1) {
          tempArray.push(value);
        } else {
          tempArray.splice(index, 1);
        }

        // Update visual state
        const checkIcon = element.querySelector(".check-icon");
        if (index === -1) {
          // Was not selected, now is selected
          element.classList.add("text-blue-600", "bg-blue-50");
          element.classList.remove("text-gray-600");
          if (checkIcon) checkIcon.classList.remove("hidden");
        } else {
          // Was selected, now is not selected
          element.classList.remove("text-blue-600", "bg-blue-50");
          element.classList.add("text-gray-600");
          if (checkIcon) checkIcon.classList.add("hidden");
        }
      }

      // Update filter items UI based on selection state
      function updateFilterItemsUI(filterType) {
        const containerId = filterType + "FilterValues";
        const container = document.getElementById(containerId);
        if (!container) return;

        let selectedValues;
        if (filterType === "region") {
          selectedValues = tempSelectedRegions;
        } else if (filterType === "status") {
          selectedValues = tempSelectedStatuses;
        } else if (filterType === "product") {
          selectedValues = tempSelectedProducts;
        } else if (filterType === "subproduct") {
          selectedValues = tempSelectedSubProducts;
        } else if (filterType === "pse") {
          selectedValues = tempSelectedPSEs;
        } else if (filterType === "underwriter") {
          selectedValues = tempSelectedUnderwriters;
        } else if (filterType === "teamLead") {
          selectedValues = tempSelectedTeamLeads;
        }

        const items = container.querySelectorAll(".filter-item");
        items.forEach((item) => {
          const value = item.getAttribute("data-value");
          const checkIcon = item.querySelector(".check-icon");
          const isSelected = selectedValues.includes(value);

          if (isSelected) {
            item.classList.add("text-blue-600", "bg-blue-50");
            item.classList.remove("text-gray-600");
            if (checkIcon) checkIcon.classList.remove("hidden");
          } else {
            item.classList.remove("text-blue-600", "bg-blue-50");
            item.classList.add("text-gray-600");
            if (checkIcon) checkIcon.classList.add("hidden");
          }
        });
      }

      // Apply top filter (multi-select) - Overview tab only
      function applyTopFilter(filterType) {
        console.log("applyTopFilter called for:", filterType);
        
        let labelId = "";
        let values = [];

        if (filterType === "region") {
          labelId = "regionFilterLabel";
          values = [...tempSelectedRegions];
          selectedRegions = values;
          // Update legacy single-select for compatibility
          selectedRegion =
            values.length === 1
              ? values[0]
              : values.length === 0
              ? "all"
              : "multi";
        } else if (filterType === "status") {
          labelId = "statusFilterLabel";
          values = [...tempSelectedStatuses];
          selectedStatuses = values;
          selectedStatus =
            values.length === 1
              ? values[0]
              : values.length === 0
              ? "all"
              : "multi";
        } else if (filterType === "product") {
          labelId = "productFilterLabel";
          values = [...tempSelectedProducts];
          selectedProducts = values;
        } else if (filterType === "subproduct") {
          labelId = "subProductFilterLabel";
          values = [...tempSelectedSubProducts];
          selectedSubProducts = values;
        } else if (filterType === "underwriter") {
          labelId = "underwriterFilterLabel";
          values = [...tempSelectedUnderwriters];
          selectedUnderwriters = values;
        } else if (filterType === "teamLead") {
          labelId = "teamLeadFilterLabel";
          values = [...tempSelectedTeamLeads];
          selectedTeamLeads = values;
        } else if (filterType === "pse") {
          labelId = "pseFilterLabel";
          values = [...tempSelectedPSEs];
          selectedPSEs = values;
          // Update legacy single-select for compatibility
          selectedPSE =
            values.length === 1
              ? values[0]
              : values.length === 0
              ? "all"
              : "multi";
        }

        // Update label
        const labelEl = document.getElementById(labelId);
        if (labelEl) {
          if (values.length === 0) {
            labelEl.textContent =
              filterType === "region"
                ? "Select region"
                : filterType === "status"
                ? "Select status"
                : filterType === "pse"
                ? "Select PSE"
                : filterType === "underwriter"
                ? "Select underwriter"
                : filterType === "teamLead"
                ? "Select lead"
                : filterType === "subproduct"
                ? "Select sub product"
                : "Select product";
          } else if (values.length === 1) {
            labelEl.textContent = values[0];
          } else {
            labelEl.textContent = `${values.length} selected`;
          }
        }

        // Update button style to show active filter
        const btnId =
          "btn" +
          filterType.charAt(0).toUpperCase() +
          filterType.slice(1) +
          "Dropdown";
        const btn = document.getElementById(btnId);
        if (btn) {
          if (values.length > 0) {
            btn.classList.remove("border-gray-200", "text-gray-600");
            btn.classList.add("border-blue-500", "text-blue-600", "bg-blue-50");
          } else {
            btn.classList.remove(
              "border-blue-500",
              "text-blue-600",
              "bg-blue-50"
            );
            btn.classList.add("border-gray-200", "text-gray-600");
          }
        }

        // Close dropdown
        const dropdown = document.getElementById(filterType + "FilterDropdown");
        if (dropdown) dropdown.classList.add("hidden");
        openTopFilter = null;

        // Clear search input
        const searchInput = document.getElementById(
          filterType + "FilterSearch"
        );
        if (searchInput) searchInput.value = "";

        // Reset visibility of items
        const container = document.getElementById(filterType + "FilterValues");
        if (container) {
          const items = container.querySelectorAll(".filter-item");
          items.forEach((item) => (item.style.display = "flex"));
        }

        // Apply filters
        updateFilterCount();
        applyFilters();
      }

      // Clear top filter
            function clearTopFilter(filterType) {
        let labelId = filterType + "FilterLabel";
        let defaultLabel = "Select";

        if (filterType === "region") {
          selectedRegions = [];
          tempSelectedRegions = [];
          selectedRegion = "all";
          defaultLabel = "Select region";
        } else if (filterType === "product") {
          selectedProducts = [];
          tempSelectedProducts = [];
          defaultLabel = "Select product";
        } else if (filterType === "underwriter") {
          selectedUnderwriters = [];
          tempSelectedUnderwriters = [];
          defaultLabel = "Select underwriter";
        } else if (filterType === "teamLead") {
          selectedTeamLeads = [];
          tempSelectedTeamLeads = [];
          defaultLabel = "Select team lead";
        } else if (filterType === "status") {
          selectedStatuses = [];
          tempSelectedStatuses = [];
          selectedStatus = "all";
          defaultLabel = "Select status";
        } else if (filterType === "pse" || filterType === "subproduct") {
          // Removed portfolio-only filters
          applyFilters();
          return;
        }

        const container = document.getElementById(filterType + "FilterValues");
        if (container) {
          container.querySelectorAll(".filter-item").forEach((item) => {
            item.classList.remove("text-blue-600", "bg-blue-50");
            item.classList.add("text-gray-600");
            const checkIcon = item.querySelector(".check-icon");
            if (checkIcon) checkIcon.classList.add("hidden");
          });
        }

        const labelEl = document.getElementById(labelId);
        if (labelEl) labelEl.textContent = defaultLabel;

        const btn = document.getElementById(
          "btn" + filterType.charAt(0).toUpperCase() + filterType.slice(1) + "Dropdown"
        );
        if (btn) {
          btn.classList.remove("border-blue-500", "text-blue-600", "bg-blue-50");
          btn.classList.add("border-gray-200", "text-gray-600");
        }

        const dropdown = document.getElementById(filterType + "FilterDropdown");
        if (dropdown) dropdown.classList.add("hidden");
        openTopFilter = null;

        const searchInput = document.getElementById(filterType + "FilterSearch");
        if (searchInput) searchInput.value = "";

        updateFilterCount();
        applyFilters();
      }

      // Filter region dropdown values based on search
      function filterRegionDropdownValues() {
        const searchInput = document.getElementById("regionFilterSearch");
        if (!searchInput) return;

        const searchTerm = searchInput.value.toLowerCase();
        const container = document.getElementById("regionFilterValues");
        if (!container) return;

        const items = container.querySelectorAll(".filter-item");
        let visibleCount = 0;
        items.forEach((item) => {
          const value = item.getAttribute("data-value");
          const text = item.querySelector("span")?.textContent || value;
          if (text && text.toLowerCase().includes(searchTerm)) {
            item.style.display = "flex";
            visibleCount++;
          } else {
            item.style.display = "none";
          }
        });
      }

      // Filter status dropdown values based on search
      
      // Filter product dropdown values based on search
      function filterProductDropdownValues() {
        const searchInput = document.getElementById("productFilterSearch");
        if (!searchInput) return;

        const searchTerm = searchInput.value.toLowerCase();
        const container = document.getElementById("productFilterValues");
        if (!container) return;

        const items = container.querySelectorAll(".filter-item");
        items.forEach((item) => {
          const value = item.getAttribute("data-value");
          const text = item.querySelector("span")?.textContent || value;
          if (text && text.toLowerCase().includes(searchTerm)) {
            item.style.display = "flex";
          } else {
            item.style.display = "none";
          }
        });
      }

      // Filter underwriter dropdown values based on search
      function filterUnderwriterDropdownValues() {
        const searchInput = document.getElementById("underwriterFilterSearch");
        if (!searchInput) return;

        const searchTerm = searchInput.value.toLowerCase();
        const container = document.getElementById("underwriterFilterValues");
        if (!container) return;

        const items = container.querySelectorAll(".filter-item");
        items.forEach((item) => {
          const value = item.getAttribute("data-value");
          const text = item.querySelector("span")?.textContent || value;
          if (text && text.toLowerCase().includes(searchTerm)) {
            item.style.display = "flex";
          } else {
            item.style.display = "none";
          }
        });
      }

      function filterTeamLeadDropdownValues() {
        const searchInput = document.getElementById("teamLeadFilterSearch");
        if (!searchInput) return;

        const searchTerm = searchInput.value.toLowerCase();
        const container = document.getElementById("teamLeadFilterValues");
        if (!container) return;

        const items = container.querySelectorAll(".filter-item");
        items.forEach((item) => {
          const value = item.getAttribute("data-value");
          const text = item.querySelector("span")?.textContent || value;
          if (text && text.toLowerCase().includes(searchTerm)) {
            item.style.display = "flex";
          } else {
            item.style.display = "none";
          }
        });
      }

      // Filter PSE dropdown values based on search
      
      // Cache for dropdown population
      let dropdownsPopulated = {
        region: false,
        product: false,
        subproduct: false,
        underwriter: false,
        teamLead: false,
      };

      function covUniqueSorted(rows, getter) {
        const set = new Set();
        (rows || []).forEach((row) => {
          const v = String(getter(row) || "").trim();
          if (v) set.add(v);
        });
        return Array.from(set).sort((a, b) =>
          a.localeCompare(b, undefined, { sensitivity: "base" })
        );
      }

      function covRenderFilterItems(container, values, selectedList, filterType) {
        if (!container) return;
        if (!values.length) {
          container.innerHTML =
            '<div class="px-3 py-2 text-gray-500">No values available.</div>';
          return;
        }
        const selected = selectedList || [];
        container.innerHTML = values
          .map((value) => {
            const escaped = String(value)
              .replace(/&/g, "&amp;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#39;")
              .replace(/</g, "&lt;");
            const isSelected = selected.indexOf(value) !== -1;
            const selectedClass = isSelected
              ? "text-blue-600 bg-blue-50"
              : "text-gray-600";
            const checkHidden = isSelected ? "" : "hidden";
            return (
              '<div class="filter-item flex items-center justify-between px-3 py-2.5 cursor-pointer ' +
              selectedClass +
              ' hover:text-blue-600 hover:bg-blue-50 transition-colors duration-150" data-value="' +
              escaped +
              "\" onclick=\"toggleFilterItem(this, '" +
              filterType +
              "')\">" +
              '<span class="pr-4 line-clamp-1">' +
              escaped +
              "</span>" +
              '<div class="w-5 h-5 check-icon ' +
              checkHidden +
              ' flex-shrink-0">' +
              '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">' +
              '<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />' +
              "</svg></div></div>"
            );
          })
          .join("");
      }

      function populateCovenantFilterDropdown(filterType) {
        const idMap = {
          region: "regionFilterValues",
          product: "productFilterValues",
          underwriter: "underwriterFilterValues",
          teamLead: "teamLeadFilterValues",
        };
        const container = document.getElementById(idMap[filterType]);
        const source = getFilterSourceData();
        if (!container) return;
        if (!source || !source.length) {
          container.innerHTML =
            '<div class="px-3 py-2 text-gray-500">No values available.</div>';
          return;
        }
        let getter;
        let selected;
        if (filterType === "region") {
          getter = getCovenantRegion;
          selected = selectedRegions;
        } else if (filterType === "product") {
          getter = getCovenantProductProgramName;
          selected = selectedProducts;
        } else if (filterType === "underwriter") {
          getter = getCovenantUnderwriter;
          selected = selectedUnderwriters;
        } else if (filterType === "teamLead") {
          getter = getCovenantTeamLead;
          selected = selectedTeamLeads;
        } else {
          return;
        }
        covRenderFilterItems(
          container,
          covUniqueSorted(source, getter),
          selected,
          filterType
        );
        dropdownsPopulated[filterType] = true;
      }

      function populateProductFilterDropdown() {
        populateCovenantFilterDropdown("product");
      }

      function populateUnderwriterFilterDropdown() {
        populateCovenantFilterDropdown("underwriter");
      }

      function populateTeamLeadFilterDropdown() {
        populateCovenantFilterDropdown("teamLead");
      }

      // Populate sub product filter dropdown from data
      function populateSubProductFilterDropdown() {
        const container = document.getElementById("subProductFilterValues");
        if (!container || !portfolioData || portfolioData.length === 0) return;
        
        // Skip if already populated (performance optimization for 42K+ rows)
        if (dropdownsPopulated.subproduct && container.children.length > 0) {
          console.log("Sub product dropdown already populated, skipping");
          return;
        }

        console.log("Populating sub product dropdown from", portfolioData.length, "rows");
        const startTime = performance.now();

        // Get unique sub products
        const subProducts = [
          ...new Set(
            portfolioData.map((row) => row.Product_Sub_Program).filter(Boolean)
          ),
        ].sort();
        
        console.log("Found", subProducts.length, "unique sub products in", (performance.now() - startTime).toFixed(2), "ms");

        // Generate HTML with Radix UI style items
        let html = "";
        if (subProducts.length === 0) {
          html =
            '<div class="px-3 py-2 text-gray-500">No sub products available.</div>';
        } else {
          subProducts.forEach((subProduct) => {
            const escapedSubProduct = subProduct
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#39;");
            const isSelected = selectedSubProducts.includes(subProduct);
            const selectedClass = isSelected
              ? "text-blue-600 bg-blue-50"
              : "text-gray-600";
            const checkHidden = isSelected ? "" : "hidden";
            html += `
                        <div class="filter-item flex items-center justify-between px-3 py-2.5 cursor-pointer ${selectedClass} hover:text-blue-600 hover:bg-blue-50 transition-colors duration-150" data-value="${escapedSubProduct}" onclick="toggleFilterItem(this, 'subproduct')">
                            <span class="pr-4 line-clamp-1">${subProduct}</span>
                            <div class="w-5 h-5 check-icon ${checkHidden} flex-shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                </svg>
                            </div>
                        </div>
                    `;
          });
        }

        container.innerHTML = html;
        dropdownsPopulated.subproduct = true;
        console.log("✅ Sub product dropdown populated in", (performance.now() - startTime).toFixed(2), "ms");
      }

      // Close top filter dropdowns when clicking outside (only for actual dropdowns - region, product, underwriter, and teamLead)
      document.addEventListener("click", function (e) {
        if (
          !e.target.closest("#regionFilterContainer") &&
          !e.target.closest("#productFilterContainer") &&
          !e.target.closest("#subProductFilterContainer") &&
          !e.target.closest("#underwriterFilterContainer") &&
          !e.target.closest("#teamLeadFilterContainer")
        ) {
          ["region", "product", "subproduct", "underwriter", "teamLead"].forEach((type) => {
            const dropdown = document.getElementById(type + "FilterDropdown");
            if (dropdown) dropdown.classList.add("hidden");
          });
          openTopFilter = null;
        }
      });

      // Legacy: Select Region Filter (for compatibility - now redirects to multi-select)
            function selectRegionFilter(region) {
        if (region === "all") {
          selectedRegions = [];
          selectedRegion = "all";
        } else {
          selectedRegions = [region];
          selectedRegion = region;
        }
        if (!isResettingFilters) {
          updateFilterCount();
          applyFilters();
        }
      }

      // Handle Main Search (Enter key or search button)
      function handleMainSearch(searchTerm) {
        const trimmedSearch = searchTerm ? searchTerm.trim() : "";
        console.log("🔍 Main search triggered:", trimmedSearch);

        selectedSearchTerm = trimmedSearch;

        // Update active filters badges
        updateFilterCount();

        // Apply filters
        applyFilters();
      }

      // Clear search filter
      function clearSearchFilter() {
        selectedSearchTerm = "";
        const searchInput = document.getElementById("searchInput");
        if (searchInput) {
          searchInput.value = "";
        }
        updateFilterCount();
        applyFilters();
      }

      // Select PSE Filter (optimized) - Overview tab only
            // Make it globally accessible for Alpine.js
      // Select Status Filter (CM/DM) - optimized - Overview tab only
            // Make it globally accessible for Alpine.js
      // Select Commitment Status Filter (Committed/Uncommitted) - optimized - Overview tab only
            // Make it globally accessible for Alpine.js
      // Select Amount Type Filter (Direct/Contingent/PSE/OSUC/Unused/TFA) - optimized
      
      // Helper: Update amount type chart titles
      
      // Reset All Filters (OPTIMIZED - batch UI updates, single filter application)
            function resetAllFilters() {
        isResettingFilters = true;
        selectedRegion = "all";
        selectedSearchTerm = "";
        selectedRegions = [];
        selectedProducts = [];
        selectedUnderwriters = [];
        selectedTeamLeads = [];
        tempSelectedRegions = [];
        tempSelectedProducts = [];
        tempSelectedUnderwriters = [];
        tempSelectedTeamLeads = [];
        activeFilters = {};

        ["region", "product", "underwriter", "teamLead"].forEach((type) => {
          const labelEl = document.getElementById(type + "FilterLabel");
          if (labelEl) {
            labelEl.textContent =
              type === "region"
                ? "Select region"
                : type === "underwriter"
                ? "Select underwriter"
                : type === "teamLead"
                ? "Select team lead"
                : "Select product";
          }
          const btn = document.getElementById(
            "btn" + type.charAt(0).toUpperCase() + type.slice(1) + "Dropdown"
          );
          if (btn) {
            btn.classList.remove("border-blue-500", "text-blue-600", "bg-blue-50");
            btn.classList.add("border-gray-200", "text-gray-600");
          }
          const container = document.getElementById(type + "FilterValues");
          if (container) {
            container.querySelectorAll(".filter-item").forEach((item) => {
              item.classList.remove("text-blue-600", "bg-blue-50");
              item.classList.add("text-gray-600");
              const checkIcon = item.querySelector(".check-icon");
              if (checkIcon) checkIcon.classList.add("hidden");
            });
          }
          const search = document.getElementById(type + "FilterSearch");
          if (search) search.value = "";
        });

        const searchInput = document.getElementById("searchInput");
        if (searchInput) searchInput.value = "";

        isResettingFilters = false;
        if (typeof displayFilterBadges === "function") displayFilterBadges();
        if (typeof updateFilterCount === "function") updateFilterCount();
        applyFilters();
        console.log("All covenant filters reset");
      }

      // ========== MODAL FILTER MANAGEMENT ==========
      // Temporary storage for multi-select modal filter selections
      let tempSelectedModalFilters = {
        originationUnit: [],
        extendingUnit: [],
        facilityType: [],
        creditClassification: [],
        teamLead: [],
        caReview: [],
        caMaturity: [],
        facilityMaturity: [],
        relationship: [],
        dealStatus: [],
        amountRange: [],
        rotceRange: [],
      };

      // Actual applied modal filter selections
      let selectedModalFilters = {
        originationUnit: [],
        extendingUnit: [],
        facilityType: [],
        creditClassification: [],
        teamLead: [],
        caReview: [],
        caMaturity: [],
        facilityMaturity: [],
        relationship: [],
        dealStatus: [],
        amountRange: [],
        rotceRange: [],
      };

      // Toggle modal filter dropdown
      
      // Toggle individual filter item in modal
      
      // Update modal filter items UI based on current temp selections
      function updateModalFilterItemsUI(filterType) {
        const containerId = filterType + "ModalValues";
        const container = document.getElementById(containerId);
        if (!container) return;

        const items = container.querySelectorAll(".filter-item");
        items.forEach((item) => {
          const value = item.getAttribute("data-value");
          const checkIcon = item.querySelector(".check-icon");

          if (
            tempSelectedModalFilters[filterType] &&
            tempSelectedModalFilters[filterType].includes(value)
          ) {
            item.classList.add("text-blue-600", "bg-blue-50");
            item.classList.remove("text-gray-600");
            if (checkIcon) checkIcon.classList.remove("hidden");
          } else {
            item.classList.remove("text-blue-600", "bg-blue-50");
            item.classList.add("text-gray-600");
            if (checkIcon) checkIcon.classList.add("hidden");
          }
        });
      }

      // Apply modal filter selections
      
      // Filter modal dropdown values based on search
      
      // Populate modal filter dropdowns with data
      
      // Helper to populate a single modal filter dropdown
      
      // Close modal filter dropdowns when clicking outside
      document.addEventListener("click", function (e) {
        const allFilterTypes = [
          "originationUnit",
          "extendingUnit",
          "facilityType",
          "creditClassification",
          "teamLead",
          "caReview",
          "caMaturity",
          "facilityMaturity",
          "relationship",
          "dealStatus",
          "amountRange",
          "rotceRange",
        ];

        // Check if click is inside any filter container (button or dropdown) or modal footer buttons
        let clickedInsideAny = false;

        // Check filter buttons and dropdowns
        for (const type of allFilterTypes) {
          const btnId =
            "btn" + type.charAt(0).toUpperCase() + type.slice(1) + "Modal";
          const btn = document.getElementById(btnId);
          const dropdown = document.getElementById(type + "ModalDropdown");

          if (
            (btn && btn.contains(e.target)) ||
            (dropdown && dropdown.contains(e.target))
          ) {
            clickedInsideAny = true;
            break;
          }
        }

        // Don't close dropdowns if clicking on modal action buttons (they handle closing themselves)
        if (
          e.target.closest('button[onclick*="applyFiltersAndClose"]') ||
          e.target.closest('button[onclick*="clearAllFilters"]')
        ) {
          clickedInsideAny = true;
        }

        // If clicked outside all filter dropdowns and footer buttons, close all dropdowns
        if (!clickedInsideAny) {
          allFilterTypes.forEach((type) => {
            const dropdown = document.getElementById(type + "ModalDropdown");
            if (dropdown && !dropdown.classList.contains("hidden")) {
              dropdown.classList.add("hidden");
            }
          });
        }
      });

      // Helper: Update region buttons UI only (no filter application) - Portfolio Overview only
      
      // Helper: Update PSE buttons UI only (no filter application)
      
      // Helper: Update status buttons UI only (no filter application) - Portfolio Overview only
      
      // Helper: Update commitment status buttons UI only (no filter application)
      
      // Helper: Update amount type buttons UI only (no filter application) - Portfolio Overview only
      
      // Export Functions

            function exportToExcel() {
        try {
          if (typeof XLSX === "undefined") {
            showNotification("Export Failed", "Excel library not loaded.", "error");
            return;
          }
          const dataSource =
            typeof getCovenantPageDataSource === "function"
              ? getCovenantPageDataSource()
              : covenantsData || [];
          if (!dataSource.length) {
            showNotification("Export Failed", "No covenant data to export.", "warning");
            return;
          }
          const exportData = dataSource.map((row) => ({
            "Report Date": row.Report_Date || "",
            Region: row.Region || "",
            "Relationship Name": row.Relationship_Name || "",
            "Relationship ID": row.Relationship_ID || "",
            "Borrower Name": row.Borrowers_Name || "",
            "CA Number": row.CA_Number || "",
            "Facility Number": row.Facility_Number || "",
            "Covenant Number": row.Covenant_Number || "",
            "Product Program": row.Product_Program || row.Product_Program_Name || "",
            "Lead Underwriter": row.Lead_Underwriter || "",
            "Team Lead": row.Underwriting_Team_Lead || row.Team_Lead || "",
            Status: row.Coming_Due_Past_Due || "",
            "Past Due Category": row.Past_Due_Category || "",
            "Covenant Due Date": row.Covenant_Due_Date || "",
            "Days Past Due": row.Days_Past_Due || "",
            "Periodic Frequency": row.Periodic_Frequency || "",
            Description: row.Covenant_Description || "",
          }));
          const ws = XLSX.utils.json_to_sheet(exportData);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "Covenants");
          const timestamp = new Date().toISOString().split("T")[0];
          XLSX.writeFile(wb, `covenants_export_${timestamp}.xlsx`);
          showNotification("Success", `Exported ${exportData.length.toLocaleString()} covenants`, "success");
        } catch (error) {
          console.error("Excel export error:", error);
          showNotification("Error", "Failed to export Excel file", "error");
        }
      }

      function exportToPDF() {
        showNotification(
          "Info",
          "PDF export is not available on the covenants page. Use Excel export or SVG download instead.",
          "warning"
        );
      }

      
      
      function exportToPNG() {
        try {
          const dashboard = document.querySelector(".p-4.md\\:p-6");
          html2canvas(dashboard, {
            scale: 2,
            backgroundColor: "#f9fafb",
            logging: false,
          }).then((canvas) => {
            const link = document.createElement("a");
            const timestamp = new Date().toISOString().split("T")[0];
            link.download = `portfolio_dashboard_${timestamp}.png`;
            link.href = canvas.toDataURL();
            link.click();
            showNotification("Success", "Dashboard exported as PNG", "success");
          });
        } catch (error) {
          console.error("PNG export error:", error);
          showNotification("Error", "Failed to export as PNG", "error");
        }
      }

      // Update Report Date
            function updateReportDate() {
        const source =
          (covenantsData && covenantsData.length > 0 && covenantsData) ||
          (portfolioData && portfolioData.length > 0 && portfolioData) ||
          [];
        if (!source.length) {
          setTextById("reportDate", "--");
          setTextById("lastUpdated", "--");
          return;
        }
        let maxDate = null;
        for (let i = 0; i < source.length; i++) {
          const row = source[i];
          const dateStr =
            row.Report_Date ||
            row.As_Of_Date ||
            row.Snapshot_Date ||
            row.Data_Date ||
            row.Last_Updated;
          if (!dateStr) continue;
          const date = typeof parseDate === "function" ? parseDate(dateStr) : null;
          if (date && (!maxDate || date > maxDate)) maxDate = date;
        }
        if (!maxDate) {
          setTextById("reportDate", "--");
          setTextById("lastUpdated", new Date().toLocaleDateString());
          return;
        }
        const formatted = maxDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
        setTextById("reportDate", formatted);
        setTextById("lastUpdated", formatted);
      }

      // Calculate top metrics (OPTIMIZED with caching)
      
      // Calculate Facilities Expired and CAs Expired metrics
      
      // Calculate New Deals Closed YTD and MTD metrics
      
      // Helper function to update variance display with colors and icons
      
      // Calculate New Deals Closed YTD and MTD metrics from filtered data
      
      
      // Pipeline Details Table - Status Filter (DM/CM)
      let pipelineStatusFilter = "all"; // Global variable to track selected status filter
      let pipelineTableSearchTerm = ""; // Global variable for search term
      let pipelineTableCurrentPage = 1;
      let pipelineTablePerPage = 10;
      let pipelineTableData = []; // Store filtered data

      
      
      
      
      
      
      
      
      
      
      
      
      
      // Create Covenant Monitoring Chart (Radial Gauge Style)
      let covenantMonitoringChartInstance = null;
      let currentCovenantData = {
        pastDue: {
          count: 0,
          categories: [],
        },
        comingDue: {
          count: 0,
          categories: [],
        },
      };

      // Function to populate covenant monitoring data from live data
      function populateCovenantMonitoringData() {
        console.log(
          "📊 Populating Covenant Monitoring Data from Covenants file"
        );

        // Prefer filter-aware covenant source; fallback to raw covenants / portfolio
        const dataSource =
          typeof getCovenantPageDataSource === "function" && covenantsData.length > 0
            ? getCovenantPageDataSource()
            : covenantsData.length > 0
            ? covenantsData
            : filteredData.length > 0
            ? filteredData
            : portfolioData;

        console.log("Using data source with", dataSource.length, "records");
        console.log(
          "Covenant data available:",
          covenantsData.length > 0 ? "Yes" : "No"
        );

        // Initialize category buckets - Breakdown shows ALL categories
        const pastDueBuckets = {
          "1-45 Days": {
            count: 0,
            regionalBreakdown: { NAM: 0, LATAM: 0, EMEA: 0, APAC: 0 },
            relationships: new Set(),
          },
          "46-90 Days": {
            count: 0,
            regionalBreakdown: { NAM: 0, LATAM: 0, EMEA: 0, APAC: 0 },
            relationships: new Set(),
          },
          ">90 Days": {
            count: 0,
            regionalBreakdown: { NAM: 0, LATAM: 0, EMEA: 0, APAC: 0 },
            relationships: new Set(),
          },
        };

        // For gauge - only track 46-90 and >90
        const pastDueGaugeBuckets = {
          "46-90 Days": {
            count: 0,
            regionalBreakdown: { NAM: 0, LATAM: 0, EMEA: 0, APAC: 0 },
            relationships: new Set(),
          },
          ">90 Days": {
            count: 0,
            regionalBreakdown: { NAM: 0, LATAM: 0, EMEA: 0, APAC: 0 },
            relationships: new Set(),
          },
        };

        // Coming Due only shows next 30 days
        const comingDueBuckets = {
          "Next 30 Days": {
            count: 0,
            regionalBreakdown: { NAM: 0, LATAM: 0, EMEA: 0, APAC: 0 },
            relationships: new Set(),
          },
        };

        let pastDueTotalAll = 0; // Total including 1-45 days (for breakdown)
        let pastDueTotalGauge = 0; // Total for gauge (46-90 + >90 only)
        let comingDueTotal = 0;

        const addRel = (bucket, row) => {
          const key = getCovenantRelationshipKey(row);
          if (key && bucket && bucket.relationships) bucket.relationships.add(key);
        };

        dataSource.forEach((row) => {
          const status = normalizeComingDuePastDueStatus(row.Coming_Due_Past_Due);
          const pastDueCategory = normalizePastDueCategoryValue(
            row.Past_Due_Category
          );
          const region = String(row.Region || "")
            .trim()
            .toUpperCase();

          if (
            selectedRegion &&
            selectedRegion !== "all" &&
            selectedRegion !== "multi" &&
            region !== selectedRegion.toUpperCase()
          )
            return;

          // Past Due — exact Excel "Coming Due / Past Due"
          if (status === "Past Due") {
            pastDueTotalAll++;

            if (pastDueTotalAll <= 3) {
              console.log("DEBUG Past Due Record", pastDueTotalAll, {
                status: row.Coming_Due_Past_Due,
                category: row.Past_Due_Category,
                categoryNorm: pastDueCategory,
                region: region,
              });
            }

            // Aging buckets ONLY from Excel Past Due Category (no Days fallback)
            if (pastDueCategory === ">90 Days") {
              pastDueBuckets[">90 Days"].count++;
              pastDueGaugeBuckets[">90 Days"].count++;
              addRel(pastDueBuckets[">90 Days"], row);
              addRel(pastDueGaugeBuckets[">90 Days"], row);
              if (
                region &&
                pastDueBuckets[">90 Days"].regionalBreakdown[region] !==
                  undefined
              ) {
                pastDueBuckets[">90 Days"].regionalBreakdown[region]++;
                pastDueGaugeBuckets[">90 Days"].regionalBreakdown[region]++;
              }
              pastDueTotalGauge++;
            } else if (
              pastDueCategory === "61-90 Days" ||
              pastDueCategory === "46-60 Days"
            ) {
              pastDueBuckets["46-90 Days"].count++;
              pastDueGaugeBuckets["46-90 Days"].count++;
              addRel(pastDueBuckets["46-90 Days"], row);
              addRel(pastDueGaugeBuckets["46-90 Days"], row);
              if (
                region &&
                pastDueBuckets["46-90 Days"].regionalBreakdown[region] !==
                  undefined
              ) {
                pastDueBuckets["46-90 Days"].regionalBreakdown[region]++;
                pastDueGaugeBuckets["46-90 Days"].regionalBreakdown[region]++;
              }
              pastDueTotalGauge++;
            } else if (
              pastDueCategory === "0-30 Days" ||
              pastDueCategory === "31-45 Days" ||
              pastDueCategory === "1-45 Days"
            ) {
              pastDueBuckets["1-45 Days"].count++;
              addRel(pastDueBuckets["1-45 Days"], row);
              if (
                region &&
                pastDueBuckets["1-45 Days"].regionalBreakdown[region] !==
                  undefined
              ) {
                pastDueBuckets["1-45 Days"].regionalBreakdown[region]++;
              }
            } else if (pastDueTotalAll <= 5) {
              console.warn(
                'Unmatched Past_Due_Category (not counted in aging):',
                row.Past_Due_Category
              );
            }
          }

          // Coming Due — exact Excel status only
          if (status === "Coming Due") {
            comingDueBuckets["Next 30 Days"].count++;
            addRel(comingDueBuckets["Next 30 Days"], row);
            if (
              region &&
              comingDueBuckets["Next 30 Days"].regionalBreakdown[region] !==
                undefined
            ) {
              comingDueBuckets["Next 30 Days"].regionalBreakdown[region]++;
            }
            comingDueTotal++;
          }
        });

        console.log("Covenant KPI totals from Excel rows:", {
          totalActiveRows: dataSource.length,
          pastDue: pastDueTotalAll,
          comingDue: comingDueTotal,
          gt90FromCategory: pastDueBuckets[">90 Days"].count,
        });

        // Convert buckets to categories with percentages (for breakdown display)
        const pastDueCategories = Object.entries(pastDueBuckets).map(
          ([label, data]) => ({
            label: label,
            count: data.count,
            percentage:
              pastDueTotalAll > 0
                ? parseFloat(((data.count / pastDueTotalAll) * 100).toFixed(1))
                : 0,
            regionalBreakdown: data.regionalBreakdown,
            relationships: data.relationships ? data.relationships.size : 0,
          })
        );

        // Gauge data for donut chart (only 46-90 and >90)
        const pastDueGaugeCategories = Object.entries(pastDueGaugeBuckets).map(
          ([label, data]) => ({
            label: label,
            count: data.count,
            percentage:
              pastDueTotalGauge > 0
                ? parseFloat(
                    ((data.count / pastDueTotalGauge) * 100).toFixed(1)
                  )
                : 0,
            regionalBreakdown: data.regionalBreakdown,
          })
        );

        const comingDueCategories = Object.entries(comingDueBuckets).map(
          ([label, data]) => ({
            label: label,
            count: data.count,
            percentage:
              comingDueTotal > 0
                ? parseFloat(((data.count / comingDueTotal) * 100).toFixed(1))
                : 0,
            regionalBreakdown: data.regionalBreakdown,
            relationships: data.relationships ? data.relationships.size : 0,
          })
        );

        // Update global covenant data
        currentCovenantData.pastDue = {
          count: pastDueTotalGauge, // Gauge shows only 46-90 + >90
          totalAll: pastDueTotalAll, // Total including 1-45 days
          categories: pastDueCategories, // All categories for breakdown
          gaugeCategories: pastDueGaugeCategories, // Only 46-90 and >90 for donut chart
        };

        currentCovenantData.comingDue = {
          count: comingDueTotal,
          categories: comingDueCategories,
        };

        console.log(
          `✅ Covenant Monitoring: ${pastDueTotalGauge} Past Due in gauge (46+ days), ${pastDueTotalAll} total past due, ${comingDueTotal} Coming Due (next 30 days)`
        );
        if (typeof updateCovenantTopMetrics === "function") updateCovenantTopMetrics();
        if (typeof renderCovenantDetailsTable === "function") renderCovenantDetailsTable();
      }

      function createCovenantMonitoringChart(viewType = "pastDue") {
        console.log("Creating Covenant Monitoring Chart:", viewType);

        const data = currentCovenantData[viewType] || {};
        const isPastDue = viewType === "pastDue";

        let series, labels, colors, totalCount;

        if (isPastDue) {
          // For Past Due: Show ALL categories (1-45, 46-90, >90) with matching colors
          const categories = data.categories || [];
          // Color mapping for each category
          const colorMap = {
            "1-45 Days": "#dde9ff",
            "46-90 Days": "#7592ff",
            ">90 Days": "#3641f5",
          };
          // Filter out categories with zero count
          const filteredCategories = categories.filter((cat) => cat.count > 0);
          series = filteredCategories.map((cat) => cat.count);
          labels = filteredCategories.map((cat) => cat.label);
          colors = filteredCategories.map(
            (cat) => colorMap[cat.label] || "#7592ff"
          );
          totalCount = data.totalAll || data.count;
        } else {
          // For Coming Due: Show next 30 days (only if count > 0)
          if (data.count > 0) {
            series = [data.count];
            labels = ["Next 30 Days"];
            colors = ["#10B981"]; // Keep green for Coming Due
          } else {
            series = [];
            labels = [];
            colors = [];
          }
          totalCount = data.count;
        }

        // Handle empty data - show centered empty state on the full host
        if (series.length === 0 || totalCount === 0) {
          console.log("No covenant data available for", viewType);
          if (covenantMonitoringChartInstance) {
            covenantMonitoringChartInstance.destroy();
            covenantMonitoringChartInstance = null;
          }
          const host = document.getElementById("covenantMonitoringHost");
          if (host) {
            renderCenteredEmptyState(
              host,
              isPastDue ? "Past Due Covenants" : "Coming Due Covenants"
            );
          } else {
            const chartElement = document.getElementById(
              "covenantMonitoringChart"
            );
            const legendElement = document.getElementById(
              "covenantMonitoringLegend"
            );
            if (legendElement) legendElement.innerHTML = "";
            if (chartElement) {
              chartElement.innerHTML = generateNoDataMessage(
                isPastDue ? "Past Due Covenants" : "Coming Due Covenants"
              );
            }
          }
          return;
        }

        const monitoringParts = ensureMonitoringStructure();
        const liveChartEl = monitoringParts && monitoringParts.chart;
        if (!liveChartEl) {
          console.error('Chart element "covenantMonitoringChart" not found');
          return;
        }
        const chartElement = liveChartEl;

        const options = {
          series: series,
          colors: colors,
          labels: labels,
          chart: {
            fontFamily: "Outfit, sans-serif",
            type: "donut",
            width: 280,
            height: 280,
            offsetX: 0,
            offsetY: 0,
          },
          stroke: {
            show: false,
            width: 4,
            colors: "transparent",
          },
          plotOptions: {
            pie: {
              donut: {
                size: "65%",
                background: "transparent",
                labels: {
                  show: true,
                  name: {
                    show: true,
                    offsetY: 0,
                    color: "#1D2939",
                    fontSize: "12px",
                    fontWeight: "normal",
                  },
                  value: {
                    show: true,
                    offsetY: 10,
                    color: "#667085",
                    fontSize: "14px",
                    formatter: (val) => val.toLocaleString(),
                  },
                  total: {
                    show: true,
                    label: isPastDue ? "Past Due" : "Coming Due",
                    color: "#000000",
                    fontSize: "20px",
                    fontWeight: "bold",
                    formatter: () => totalCount.toLocaleString(),
                  },
                },
              },
            },
          },
          dataLabels: {
            enabled: false,
          },
          tooltip: {
            enabled: true,
            theme: "light",
            followCursor: false,
            fixed: {
              enabled: false,
            },
            offsetX: 0,
            offsetY: 0,
            custom: function ({ series, seriesIndex }) {
              const label = labels[seriesIndex];
              const count = series[seriesIndex];
              const categoryData = (data.categories || []).find(
                (cat) => cat.label === label
              );
              const regionalBreakdown = categoryData?.regionalBreakdown || {
                NAM: 0,
                LATAM: 0,
                EMEA: 0,
                APAC: 0,
              };
              return buildCovenantStyleTooltip({
                title: label,
                subtitle: isPastDue
                  ? "Covenants past their due date"
                  : "Covenants due in the next 30 days",
                count,
                total: totalCount,
                relationships:
                  (categoryData && categoryData.relationships) || 0,
                breakdownTitle: "Regional Distribution",
                breakdownRows: regionalBreakdownRows(regionalBreakdown),
                col1: "Region",
                col2: "Count",
              });
            },
          },
          legend: {
            show: false,
          },
          responsive: [
            {
              breakpoint: 2600,
              options: {
                chart: {
                  width: 240,
                  height: 240,
                },
              },
            },
            {
              breakpoint: 640,
              options: {
                chart: {
                  width: 280,
                  height: 280,
                },
              },
            },
          ],
        };

        // Destroy existing chart if it exists
        if (covenantMonitoringChartInstance) {
          covenantMonitoringChartInstance.destroy();
        }

        chartElement.innerHTML = "";
        covenantMonitoringChartInstance = new ApexCharts(chartElement, options);
        covenantMonitoringChartInstance.render();
        console.log("Covenant Monitoring chart rendered successfully");

        // Update custom legend
        updateCovenantMonitoringLegend(labels, series, totalCount, colors);
      }

      // Update the legend for covenant monitoring chart
      function updateCovenantMonitoringLegend(
        labels,
        series,
        totalCount,
        colors
      ) {
        const legendElement = document.getElementById(
          "covenantMonitoringLegend"
        );
        if (!legendElement) return;

        if (!labels || !labels.length || !totalCount) {
          legendElement.innerHTML = "";
          return;
        }

        let legendHTML = "";
        for (let i = 0; i < labels.length; i++) {
          const color = colors[i] || "#3641f5";
          const count = series[i] || 0;
          if (!count) continue;

          legendHTML += `
                    <div class="flex flex-col items-center gap-2">
                            <div class="flex items-center gap-2">
                            <div class="h-2.5 w-2.5 rounded-full flex-shrink-0" style="background-color: ${color};"></div>
                            <span class="text-xs font-medium text-gray-700">${labels[i]}</span>
                    </div>
                        <div class="text-lg font-bold text-gray-900">${count}</div>
                </div>
            `;
        }

        legendElement.innerHTML = legendHTML;
      }

      // Update region distribution for covenant monitoring
      // Removed updateCovenantRegionDistribution - region data now integrated in legends

      function updateCovenantChart(viewType) {
        console.log("Updating covenant chart to:", viewType);
        if (viewType === "comingDue") {
          if (typeof openExpandModal === "function") openExpandModal("comingDue");
          return;
        }
        currentCovenantViewType = viewType; // Update local variable
        window.currentCovenantViewType = viewType; // Update global state
        createCovenantMonitoringChart(viewType);
        updateCovenantRegionalTable(viewType);
      }

      // Update the regional distribution table based on view type
      function updateCovenantRegionalTable(viewType = "pastDue") {
        console.log("Updating regional table for:", viewType);

        const titleEl = document.getElementById("covenantRegionalTableTitle");
        const subtitleEl = document.getElementById(
          "covenantRegionalTableSubtitle"
        );
        const headerEl = document.getElementById("covenantRegionalTableHeader");
        const tableBody = document.getElementById("covenantRegionalTableBody");

        if (!tableBody) return;

        const isPastDue = viewType === "pastDue";

        // Update title and subtitle
        if (titleEl) {
          titleEl.textContent = isPastDue
            ? "Past Due Covenants by Region"
            : "Coming Due Covenants by Region (Next 30 Days)";
        }
        if (subtitleEl) {
          subtitleEl.textContent = isPastDue
            ? "Regional breakdown of past due covenants"
            : "Regional breakdown of covenants due in the next 30 days";
        }

        // Update table headers
        if (headerEl) {
          if (isPastDue) {
            headerEl.innerHTML = `
                        <th class="px-3 py-3 text-xs font-semibold text-gray-700 tracking-wider text-left">Region</th>
                        <th class="px-2 py-3 text-xs font-semibold text-gray-700 tracking-wider text-center">1-45 Days</th>
                        <th class="px-2 py-3 text-xs font-semibold text-gray-700 tracking-wider text-center">46-90 Days</th>
                        <th class="px-2 py-3 text-xs font-semibold text-gray-700 tracking-wider text-center">&gt;90 Days</th>
                        <th class="px-2 py-3 text-xs font-semibold text-gray-700 tracking-wider text-center">Total Past Dues</th>
                        <th class="px-2 py-3 text-xs font-semibold text-gray-700 tracking-wider text-center">Total Covenants</th>
                        <th class="px-2 py-3 text-xs font-semibold text-gray-700 tracking-wider text-center">% of Total</th>
                    `;
          } else {
            headerEl.innerHTML = `
                        <th class="px-3 py-3 text-xs font-semibold text-gray-700 tracking-wider text-left">Region</th>
                        <th class="px-2 py-3 text-xs font-semibold text-gray-700 tracking-wider text-center">Coming Due</th>
                        <th class="px-2 py-3 text-xs font-semibold text-gray-700 tracking-wider text-center">Total Covenants</th>
                        <th class="px-2 py-3 text-xs font-semibold text-gray-700 tracking-wider text-center">% of Total</th>
                    `;
          }
        }

        // Calculate regional distribution
        const dataSource =
          typeof getCovenantPageDataSource === "function" && covenantsData.length > 0
            ? getCovenantPageDataSource()
            : covenantsData.length > 0
            ? covenantsData
            : portfolioData;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const regions = ["APAC", "EMEA", "NAM", "LATAM"];
        const regionalData = {};
        const regionPopulation = {}; // Total covenants per region (no status filter)

        regions.forEach((region) => {
          regionalData[region] = {
            "1-30": 0,
            "31-45": 0,
            "46-60": 0,
            "61-90": 0,
            ">90": 0,
            comingDue: 0,
          };
          regionPopulation[region] = 0;
        });

        // FIRST PASS: Count total covenants per region (Population - no status filter)
        let totalPopulation = 0;

        dataSource.forEach((row) => {
          const region = String(row.Region || "")
            .trim()
            .toUpperCase();

          if (!regions.includes(region)) return;

          // Apply region filter only for legacy single-select (multi already applied in getCovenantPageDataSource)
          if (
            selectedRegion &&
            selectedRegion !== "all" &&
            selectedRegion !== "multi" &&
            region !== selectedRegion.toUpperCase()
          )
            return;

          regionPopulation[region]++;
          totalPopulation++;
        });

        // SECOND PASS: Count by status categories using dataLoader fields
        let regionalDebugCount = 0;
        dataSource.forEach((row) => {
          // Use exact field names from dataLoader export
          const status = normalizeComingDuePastDueStatus(row.Coming_Due_Past_Due);
          const region = String(row.Region || "")
            .trim()
            .toUpperCase();
          const pastDueCategory = normalizePastDueCategoryValue(
            row.Past_Due_Category
          );

          if (!regions.includes(region)) return;

          if (
            selectedRegion &&
            selectedRegion !== "all" &&
            selectedRegion !== "multi" &&
            region !== selectedRegion.toUpperCase()
          )
            return;

          if (status === "Past Due") {
            regionalDebugCount++;

            // Debug: Log first few regional past due records
            if (regionalDebugCount <= 3) {
              console.log(
                `DEBUG Regional Past Due Record ${regionalDebugCount}:`,
                {
                  status: row.Coming_Due_Past_Due,
                  category: row.Past_Due_Category,
                  categoryTrimmed: pastDueCategory,
                  region: region,
                }
              );
            }

            if (pastDueCategory === ">90 Days") {
              regionalData[region][">90"]++;
            } else if (pastDueCategory === "61-90 Days") {
              regionalData[region]["61-90"]++;
            } else if (pastDueCategory === "46-60 Days") {
              regionalData[region]["46-60"]++;
            } else if (pastDueCategory === "31-45 Days") {
              regionalData[region]["31-45"]++;
            } else if (
              pastDueCategory === "0-30 Days" ||
              pastDueCategory === "1-45 Days"
            ) {
              regionalData[region]["1-30"]++;
            } else if (regionalDebugCount <= 5) {
              console.warn(
                "Regional: Unmatched Past_Due_Category:",
                row.Past_Due_Category
              );
            }
          }

          if (status === "Coming Due") {
            regionalData[region]["comingDue"]++;
          }
        });

        // Calculate totals for percentage calculation
        let grandTotalPastDue = 0;
        let grandTotalComingDue = 0;

        regions.forEach((region) => {
          const pastDueCount =
            regionalData[region]["1-30"] +
            regionalData[region]["31-45"] +
            regionalData[region]["46-60"] +
            regionalData[region]["61-90"] +
            regionalData[region][">90"];
          grandTotalPastDue += pastDueCount;
          grandTotalComingDue += regionalData[region]["comingDue"];
        });

        const grandTotal = grandTotalPastDue + grandTotalComingDue;

        // Build table rows - only for regions that have data
        let html = "";
        let total145 = 0;
        let total4690 = 0;
        let totalOver90 = 0;
        let totalComingDue = 0;

        // Filter regions to only include those with population > 0
        const regionsWithData = regions.filter(
          (region) => regionPopulation[region] > 0
        );

        const viewTotal = isPastDue ? grandTotalPastDue : grandTotalComingDue;
        const regionalTitle = isPastDue
          ? "Past Due Covenants by Region"
          : "Coming Due Covenants by Region";
        if (regionsWithData.length === 0 || viewTotal === 0) {
          tableBody.innerHTML = generateTableEmptyStateRow(
            isPastDue ? 7 : 4,
            regionalTitle
          );
          window.covenantRegionalData = regionalData;
          return;
        }

        regionsWithData.forEach((region) => {
          // Calculate combined columns
          const count145 =
            regionalData[region]["1-30"] + regionalData[region]["31-45"];
          const count4690 =
            regionalData[region]["46-60"] + regionalData[region]["61-90"];
          const countOver90 = regionalData[region][">90"];
          const countComingDue = regionalData[region]["comingDue"];

          total145 += count145;
          total4690 += count4690;
          totalOver90 += countOver90;
          totalComingDue += countComingDue;

          // Calculate region totals
          const regionPastDueTotal = count145 + count4690 + countOver90;
          // Population is the total unique covenants for this region (calculated in first pass, no status filter)
          const regPopulation = regionPopulation[region];

          if (isPastDue) {
            // % of Total = Past Due Total for this region / Region's Total Covenants (region-specific)
            const percentOfTotal =
              regPopulation > 0
                ? ((regionPastDueTotal / regPopulation) * 100).toFixed(1)
                : 0;

            html += `
                        <tr class="border-b border-gray-100 hover:bg-gray-50">
                            <td class="px-3 py-3 text-xs font-medium text-gray-700">${region}</td>
                            <td class="px-2 py-3 text-xs text-gray-700 text-center font-semibold">${count145}</td>
                            <td class="px-2 py-3 text-xs text-gray-700 text-center font-semibold">${count4690}</td>
                            <td class="px-2 py-3 text-xs text-gray-700 text-center font-semibold">${countOver90}</td>
                            <td class="px-2 py-3 text-xs text-gray-900 text-center font-bold">${regionPastDueTotal}</td>
                            <td class="px-2 py-3 text-xs text-gray-900 text-center font-bold">${regPopulation}</td>
                            <td class="px-2 py-3 text-xs text-gray-900 text-center font-semibold">${percentOfTotal}%</td>
                        </tr>
                    `;
          } else {
            // % of Total = Coming Due for this region / Total Coming Due (across all regions)
            const percentOfTotal =
              totalComingDue > 0
                ? ((countComingDue / totalComingDue) * 100).toFixed(1)
                : 0;

            html += `
                        <tr class="border-b border-gray-100 hover:bg-gray-50">
                            <td class="px-3 py-3 text-xs font-medium text-gray-700">${region}</td>
                            <td class="px-2 py-3 text-xs text-gray-900 text-center font-bold">${countComingDue}</td>
                            <td class="px-2 py-3 text-xs text-gray-900 text-center font-bold">${regPopulation}</td>
                            <td class="px-2 py-3 text-xs text-gray-900 text-center font-semibold">${percentOfTotal}%</td>
                        </tr>
                    `;
          }
        });

        // Add total row
        const totalPastDue = total145 + total4690 + totalOver90;

        if (isPastDue) {
          const totalPercentOfTotal =
            totalPopulation > 0
              ? ((totalPastDue / totalPopulation) * 100).toFixed(1)
              : 0;
          html += `
                    <tr class="bg-gray-50 font-bold border-t-2 border-gray-200">
                        <td class="px-3 py-3 text-xs text-gray-900">Total</td>
                        <td class="px-2 py-3 text-xs text-gray-900 text-center">${total145}</td>
                        <td class="px-2 py-3 text-xs text-gray-900 text-center">${total4690}</td>
                        <td class="px-2 py-3 text-xs text-gray-900 text-center">${totalOver90}</td>
                        <td class="px-2 py-3 text-xs text-gray-900 text-center">${totalPastDue}</td>
                        <td class="px-2 py-3 text-xs text-gray-900 text-center">${totalPopulation}</td>
                        <td class="px-2 py-3 text-xs text-gray-900 text-center font-bold">${totalPercentOfTotal}%</td>
                    </tr>
                `;
        } else {
          html += `
                    <tr class="bg-gray-50 font-bold border-t-2 border-gray-200">
                        <td class="px-3 py-3 text-xs text-gray-900">Total</td>
                        <td class="px-2 py-3 text-xs text-gray-900 text-center">${totalComingDue}</td>
                        <td class="px-2 py-3 text-xs text-gray-900 text-center">${totalPopulation}</td>
                        <td class="px-2 py-3 text-xs text-gray-900 text-center font-bold">100%</td>
                    </tr>
                `;
        }

        tableBody.innerHTML = html;

        // Store regional data globally for potential use elsewhere
        window.covenantRegionalData = regionalData;
      }

      // Create the CCM regional stacked bar chart
      let ccmRegionalChartInstance = null;

      
      // Make it globally accessible for Alpine.js
      window.updateCovenantChart = updateCovenantChart;

      // Parse number that might be formatted (e.g., "5.5M", "1.2K", "1,000,000")
      function parseNumber(value) {
        if (!value) return 0;

        // If already a number, return it
        if (typeof value === "number") return value;

        // Convert to string and clean
        let str = String(value).trim().toUpperCase();

        // Remove currency symbols and commas
        str = str.replace(/[$,]/g, "");

        // Handle K (thousands)
        if (str.endsWith("K")) {
          return parseFloat(str.replace("K", "")) * 1000;
        }

        // Handle M (millions)
        if (str.endsWith("M")) {
          return parseFloat(str.replace("M", "")) * 1000000;
        }

        // Handle B (billions)
        if (str.endsWith("B")) {
          return parseFloat(str.replace("B", "")) * 1000000000;
        }

        // Regular number
        return parseFloat(str) || 0;
      }

      // Parse percentage values (handles "0.1%", "12.5%", or decimal 0.001)
      
      // Get active filters text for display in no-data messages
      
      // Generate consistent "no data" HTML message with active filters
                  function getActiveFiltersText() {
        const parts = [];
        if (typeof selectedRegions !== "undefined" && selectedRegions.length > 0) {
          parts.push("Region: " + selectedRegions.join(", "));
        } else if (selectedRegion && selectedRegion !== "all" && selectedRegion !== "multi") {
          parts.push("Region: " + selectedRegion);
        }
        if (typeof selectedProducts !== "undefined" && selectedProducts.length > 0) {
          parts.push("Product: " + selectedProducts.join(", "));
        }
        if (typeof selectedUnderwriters !== "undefined" && selectedUnderwriters.length > 0) {
          parts.push("Underwriter: " + selectedUnderwriters.join(", "));
        }
        if (typeof selectedTeamLeads !== "undefined" && selectedTeamLeads.length > 0) {
          parts.push("Team Lead: " + selectedTeamLeads.join(", "));
        }
        if (selectedSearchTerm && String(selectedSearchTerm).trim() !== "") {
          parts.push('Search: "' + selectedSearchTerm + '"');
        }
        return parts;
      }

            function generateNoDataMessage(chartTitle = "") {
        let filters = [];
        try {
          if (typeof getActiveFiltersText === "function") {
            filters = getActiveFiltersText() || [];
          }
        } catch (e) {
          filters = [];
        }

        let html = '<div class="covenant-empty-state">';
        html +=
          '<svg width="48" height="48" style="margin-bottom: 12px; flex-shrink: 0;" fill="none" stroke="#d1d5db" viewBox="0 0 24 24">';
        html +=
          '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>';
        html += "</svg>";
        html +=
          '<p style="font-size: 14px; font-weight: 500; color: #4b5563; margin: 0 0 4px 0;">No data available' +
          (chartTitle ? " for " + chartTitle : "") +
          "</p>";

        if (filters.length > 0) {
          html +=
            '<p style="font-size: 12px; color: #9ca3af; max-width: 280px; margin: 0;">Applied filters: ' +
            filters.join(", ") +
            "</p>";
        } else {
          html +=
            '<p style="font-size: 12px; color: #9ca3af; margin: 0;">Try adjusting your filters</p>';
        }

        html += "</div>";
        return html;
      }

      function renderCenteredEmptyState(host, title) {
        const el =
          typeof host === "string" ? document.getElementById(host) : host;
        if (!el) return;
        el.classList.add("covenant-empty-host");
        el.style.display = "flex";
        el.style.alignItems = "center";
        el.style.justifyContent = "center";
        el.style.flex = "1 1 auto";
        el.style.alignSelf = "stretch";
        el.style.width = "100%";
        el.style.minHeight = "320px";
        el.style.boxSizing = "border-box";
        el.innerHTML = generateNoDataMessage(title || "");
      }

      function clearCenteredEmptyHost(host) {
        const el =
          typeof host === "string" ? document.getElementById(host) : host;
        if (!el) return;
        el.classList.remove("covenant-empty-host");
        el.style.display = "";
        el.style.alignItems = "";
        el.style.justifyContent = "";
        el.style.flex = "";
        el.style.alignSelf = "";
        el.style.width = "";
        el.style.minHeight = "";
        el.style.boxSizing = "";
      }

      function generateTableEmptyStateRow(colSpan, title) {
        const cols = Math.max(1, Number(colSpan) || 1);
        return (
          `<tr><td colspan="${cols}" class="covenant-empty-state-cell">` +
          generateNoDataMessage(title || "") +
          `</td></tr>`
        );
      }

      function ensureInsightProductStructure() {
        const host = document.getElementById("covInsightProductHost");
        if (!host) return null;
        clearCenteredEmptyHost(host);
        if (!document.getElementById("covInsightProductDonutChart")) {
          host.innerHTML = `
            <div id="covInsightProductInner" class="flex flex-row items-center justify-center gap-8 w-full">
              <div class="flex-shrink-0">
                <div id="covInsightProductDonutChart"></div>
              </div>
              <div class="flex-1 max-w-md">
                <div id="covInsightProductList" class="space-y-3"></div>
              </div>
            </div>`;
        }
        return {
          host,
          donut: document.getElementById("covInsightProductDonutChart"),
          list: document.getElementById("covInsightProductList"),
        };
      }

      function ensureInsightAgingStructure() {
        const host = document.getElementById("covInsightAgingHost");
        if (!host) return null;
        clearCenteredEmptyHost(host);
        if (!document.getElementById("covInsightAgingByRegionChart")) {
          host.innerHTML =
            '<div id="covInsightAgingByRegionChart" class="w-full" style="width:100%;min-height:320px"></div>';
        }
        return {
          host,
          chart: document.getElementById("covInsightAgingByRegionChart"),
        };
      }

      function ensureActivityChartStructure() {
        const host = document.getElementById("covActivityChartHost");
        if (!host) {
          return { chart: document.getElementById("covActivityChart") };
        }
        clearCenteredEmptyHost(host);
        if (!document.getElementById("covActivityChart")) {
          host.innerHTML =
            '<div id="covActivityChart" class="w-full flex-1" style="width:100%;min-height:340px;height:100%"></div>';
        }
        return {
          host,
          chart: document.getElementById("covActivityChart"),
        };
      }

      function ensureMonitoringStructure() {
        const host = document.getElementById("covenantMonitoringHost");
        if (!host) {
          return {
            chart: document.getElementById("covenantMonitoringChart"),
            legend: document.getElementById("covenantMonitoringLegend"),
          };
        }
        clearCenteredEmptyHost(host);
        if (!document.getElementById("covenantMonitoringChart")) {
          host.innerHTML = `
            <div class="flex items-center justify-center w-full">
              <div id="covenantMonitoringChart" class="chartDarkStyle"></div>
            </div>
            <div id="covenantMonitoringLegend" class="flex flex-row items-center justify-center gap-4 sm:gap-6 mt-6 flex-wrap w-full"></div>`;
        }
        return {
          host,
          chart: document.getElementById("covenantMonitoringChart"),
          legend: document.getElementById("covenantMonitoringLegend"),
        };
      }

      // Format currency with M/B notation
      function formatCurrency(value) {
        if (!value || value === 0) return "$0";

        const absValue = Math.abs(value);

        // Billions
        if (absValue >= 1000000000) {
          return "$" + (value / 1000000000).toFixed(2) + "B";
        }

        // Millions
        if (absValue >= 1000000) {
          return "$" + (value / 1000000).toFixed(2) + "M";
        }

        // Thousands
        if (absValue >= 1000) {
          return "$" + (value / 1000).toFixed(2) + "K";
        }

        // Less than 1000
        return "$" + value.toFixed(2);
      }

      // Format currency for detailed display (with commas)
      function formatCurrencyDetailed(value) {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value);
      }

      // Format date
      function formatDate(dateString) {
        if (!dateString) return "N/A";
        const date = parseDate(dateString);
        if (!date) return "N/A";
        return date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      }

      // Check if covenant is due within next 30 days
      function isWithinNext30Days(covenantDueDate) {
        if (!covenantDueDate) return false;

        const dueDate = parseDate(covenantDueDate);
        if (!dueDate) return false;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const thirtyDaysFromNow = new Date(today);
        thirtyDaysFromNow.setDate(today.getDate() + 30);

        return dueDate >= today && dueDate <= thirtyDaysFromNow;
      }

      // Create expiration timeline chart (Area chart for Facilities only)
      
      // Create combined chart for CAs Coming Due & Facilities Expiring
      
      // Create combined chart for CAs Coming Due & Facilities Expiring from filtered data
      
      // Parse date in multiple formats (YYYY-MM-DD, DD/MM/YYYY, etc.)
      function parseDate(dateStr) {
        if (!dateStr) return null;

        // If it's already a Date object (from Excel parsing), return it
        if (dateStr instanceof Date) {
          return !isNaN(dateStr.getTime()) ? dateStr : null;
        }

        // Convert to string for parsing
        const str = String(dateStr).trim();
        if (!str) return null;

        try {
          // Handle YYYY-MM-DD format (most common in CSV)
          if (str.includes("-")) {
            const parts = str.split("-");
            if (parts.length === 3) {
              // Check if it's YYYY-MM-DD
              if (parts[0].length === 4) {
                const year = parseInt(parts[0]);
                const month = parseInt(parts[1]) - 1; // JavaScript months are 0-indexed
                const day = parseInt(parts[2]);
                const date = new Date(year, month, day);
                if (!isNaN(date.getTime())) {
                  return date;
                }
              }
            }
          }

          // Handle DD/MM/YYYY format
          if (str.includes("/")) {
            const parts = str.split("/");
            if (parts.length === 3) {
              const day = parseInt(parts[0]);
              const month = parseInt(parts[1]) - 1; // JavaScript months are 0-indexed
              const year = parseInt(parts[2]);
              const date = new Date(year, month, day);
              if (!isNaN(date.getTime())) {
                return date;
              }
            }
          }

          // Handle "MMM DD, YYYY" format (e.g., "Jan 15, 2024" or "Dec 1, 2023")
          // This also handles "MMMM DD, YYYY" (e.g., "January 15, 2024")
          const monthDayYearPattern = /^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/;
          const match = str.match(monthDayYearPattern);
          if (match) {
            const monthStr = match[1];
            const day = parseInt(match[2]);
            const year = parseInt(match[3]);

            // Parse month name to number
            const date = new Date(`${monthStr} ${day}, ${year}`);
            if (!isNaN(date.getTime())) {
              return date;
            }
          }

          // Try standard date parsing as fallback (handles many formats)
          const date = new Date(str);
          if (!isNaN(date.getTime())) {
            return date;
          }
        } catch (e) {
          // Only log occasionally to avoid console spam
          if (Math.random() < 0.01) {
            console.warn("Invalid date:", str);
          }
        }
        return null;
      }

      // Format Date object to DD/MM/YYYY string
      
      // Aggregate expiration data for the next 3 months (counts unique Facilities only, excludes DM)
      
      // Aggregate data by month and year
      
      // Aggregate data by date
      
      // Create relationship bar chart (OPTIMIZED)
      
      // Helper function to check if any filters are active
      
      // Update bar chart
      
      // Filter New Facilities by Period (Current Month or Previous Month)
      
      // Create New Facilities Approved Donut Chart from all data
      
      // Create New Facilities Approved Donut Chart from filtered data
      
      // Update the legend for New Facilities Approved chart
      

      function filterData() {
        refreshCovenantPageCharts();
      }

      function getCovenantPageDataSource() {
        const raw = covenantsData.length > 0 ? covenantsData : [];
        if (typeof applyCovenantFilters === "function") {
          try {
            return applyCovenantFilters(raw) || raw;
          } catch (e) {
            console.warn("applyCovenantFilters failed, using raw covenant data", e);
          }
        }
        return raw;
      }

      function applyCovenantFilters(dataSource) {
        if (!dataSource || dataSource.length === 0) {
          return [];
        }

        let filtered = dataSource;

        // Region: multi-select preferred, fallback to single selectedRegion
        const regionSet =
          typeof selectedRegions !== "undefined" && selectedRegions.length > 0
            ? selectedRegions.map((r) => String(r).toUpperCase())
            : selectedRegion && selectedRegion !== "all" && selectedRegion !== "multi"
            ? [String(selectedRegion).toUpperCase()]
            : [];
        if (regionSet.length > 0) {
          filtered = filtered.filter((row) =>
            regionSet.includes(getCovenantRegion(row))
          );
        }

        // Product — Excel "Product Program Name"
        if (typeof selectedProducts !== "undefined" && selectedProducts.length > 0) {
          const products = selectedProducts.map((p) => String(p).toLowerCase());
          filtered = filtered.filter((row) => {
            const val = getCovenantProductProgramName(row).toLowerCase();
            return val && products.includes(val);
          });
        }

        // Underwriter — Excel "Underwriter"
        if (
          typeof selectedUnderwriters !== "undefined" &&
          selectedUnderwriters.length > 0
        ) {
          const uws = selectedUnderwriters.map((u) => String(u).toLowerCase());
          filtered = filtered.filter((row) =>
            uws.includes(getCovenantUnderwriter(row).toLowerCase())
          );
        }

        // Team Lead — Excel "Underwriting Team Lead"
        if (
          typeof selectedTeamLeads !== "undefined" &&
          selectedTeamLeads.length > 0
        ) {
          const leads = selectedTeamLeads.map((u) => String(u).toLowerCase());
          filtered = filtered.filter((row) =>
            leads.includes(getCovenantTeamLead(row).toLowerCase())
          );
        }

        // Search across key covenant fields
        if (selectedSearchTerm && String(selectedSearchTerm).trim() !== "") {
          const searchLower = String(selectedSearchTerm).toLowerCase();
          filtered = filtered.filter((row) => {
            const hay = [
              row.Relationship_Name,
              row.Relationship_ID,
              row.Borrowers_Name,
              row.Covenant_Number,
              row.CA_Number,
              row.Facility_Number,
              row.Lead_Underwriter,
              row.Underwriter,
              row.Underwriting_Team_Lead,
              row.Product_Program,
              row.Product_Program_Name,
              row.Region,
              row.Coming_Due_Past_Due,
              row.Past_Due_Category,
              row.Covenant_Description,
            ]
              .map((v) => String(v || "").toLowerCase())
              .join(" ");
            return hay.includes(searchLower);
          });
        }

        return filtered;
      }



// Expose handlers for inline onclick= in covenantsHTMLPage.js (Confluence)
if (typeof openExpandModal === "function") window.openExpandModal = openExpandModal;
if (typeof closeExpandModal === "function") window.closeExpandModal = closeExpandModal;
if (typeof switchExpandTab === "function") window.switchExpandTab = switchExpandTab;
if (typeof loadDataFromCSV === "function") window.loadDataFromCSV = loadDataFromCSV;
if (typeof resetAllFilters === "function") window.resetAllFilters = resetAllFilters;
if (typeof toggleUiMenu === "function") window.toggleUiMenu = toggleUiMenu;
if (typeof exportToExcel === "function") window.exportToExcel = exportToExcel;
if (typeof exportToPDF === "function") window.exportToPDF = exportToPDF;
if (typeof toggleTopFilter === "function") window.toggleTopFilter = toggleTopFilter;
if (typeof toggleFilterItem === "function") window.toggleFilterItem = toggleFilterItem;
if (typeof applyTopFilter === "function") window.applyTopFilter = applyTopFilter;
if (typeof clearTopFilter === "function") window.clearTopFilter = clearTopFilter;
if (typeof filterRegionDropdownValues === "function") window.filterRegionDropdownValues = filterRegionDropdownValues;
if (typeof filterProductDropdownValues === "function") window.filterProductDropdownValues = filterProductDropdownValues;
if (typeof filterUnderwriterDropdownValues === "function") window.filterUnderwriterDropdownValues = filterUnderwriterDropdownValues;
if (typeof filterTeamLeadDropdownValues === "function") window.filterTeamLeadDropdownValues = filterTeamLeadDropdownValues;
if (typeof removeFilter === "function") window.removeFilter = removeFilter;
if (typeof applyFilters === "function") window.applyFilters = applyFilters;
if (typeof setActiveInGroup === "function") window.setActiveInGroup = setActiveInGroup;
if (typeof updateCovenantChart === "function") window.updateCovenantChart = updateCovenantChart;
if (typeof updateCovenantActivityView === "function") window.updateCovenantActivityView = updateCovenantActivityView;
if (typeof filterCovenantDetailsTable === "function") window.filterCovenantDetailsTable = filterCovenantDetailsTable;
if (typeof changeCovenantDetailsTablePage === "function") window.changeCovenantDetailsTablePage = changeCovenantDetailsTablePage;
if (typeof updateCovenantDetailsTablePerPage === "function") window.updateCovenantDetailsTablePerPage = updateCovenantDetailsTablePerPage;
if (typeof handleMainSearch === "function") window.handleMainSearch = handleMainSearch;
if (typeof refreshData === "function") window.refreshData = refreshData;
if (typeof showLoadingOverlay === "function") window.showLoadingOverlay = showLoadingOverlay;
if (typeof hideLoadingOverlay === "function") window.hideLoadingOverlay = hideLoadingOverlay;

// Confluence bootstrap: HTMLPage.js calls this after injecting markup.
(function () {
  function runWhenReady() {
    if (typeof window.bootstrapCovenantsPage !== "function") return;
    if (!document.getElementById("globalRiskCovenants") && !document.getElementById("loadingOverlay")) {
      return;
    }
    var host = document.getElementById("globalRiskCovenants");
    if (host && !host.innerHTML.trim() && !document.getElementById("loadingOverlay")) {
      return;
    }
    if (window.__covenantsBootstrapped) return;
    window.__covenantsBootstrapped = true;
    window.bootstrapCovenantsPage();
  }

  if (window.__covenantsHtmlReady) {
    runWhenReady();
  } else if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      if (document.getElementById("loadingOverlay") && !window.__covenantsBootstrapped) {
        window.__covenantsBootstrapped = true;
        window.bootstrapCovenantsPage();
      }
    });
  } else if (document.getElementById("loadingOverlay") && !document.getElementById("globalRiskCovenants")) {
    window.__covenantsBootstrapped = true;
    window.bootstrapCovenantsPage();
  }
})();
