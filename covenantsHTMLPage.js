/**
 * Covenant Monitoring — HTML markup injector for Confluence
 *
 * Required macro order:
 *   1) <div id="globalRiskCovenants"></div>
 *   2) apexcharts, xlsx, html2canvas
 *   3) covenants-style.css, covenants-page-style.css
 *   4) covenants.js
 *   5) covenantsHTMLPage.js  (this file)
 *
 * Injects page HTML into #globalRiskCovenants, then bootstraps covenants.js.
 */
(function () {
  var host = document.getElementById("globalRiskCovenants");
  if (!host) {
    console.error(
      "[Covenants] #globalRiskCovenants not found. Paste the macro div first."
    );
    return;
  }

  // Avoid double-inject if macro re-runs
  if (host.getAttribute("data-covenants-mounted") === "1") {
    if (
      typeof window.bootstrapCovenantsPage === "function" &&
      !window.__covenantsBootstrapped
    ) {
      window.__covenantsBootstrapped = true;
      window.bootstrapCovenantsPage();
    }
    return;
  }
  host.setAttribute("data-covenants-mounted", "1");

  var expandSvg =
    '<svg class="fill-current" width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" stroke-width="0.5" stroke="currentColor"><path d="M4,7.5 C4,7.77614237 3.77614237,8 3.5,8 C3.22385763,8 3,7.77614237 3,7.5 L3,5.5 C3,4.11928813 4.11928813,3 5.5,3 L7.5,3 C7.77614237,3 8,3.22385763 8,3.5 C8,3.77614237 7.77614237,4 7.5,4 L5.5,4 C4.67157288,4 4,4.67157288 4,5.5 L4,7.5 Z M16.5,4 C16.2238576,4 16,3.77614237 16,3.5 C16,3.22385763 16.2238576,3 16.5,3 L18.5,3 C19.8807119,3 21,4.11928813 21,5.5 L21,7.5 C21,7.77614237 20.7761424,8 20.5,8 C20.2238576,8 20,7.77614237 20,7.5 L20,5.5 C20,4.67157288 19.3284271,4 18.5,4 L16.5,4 Z M20,16.5 C20,16.2238576 20.2238576,16 20.5,16 C20.7761424,16 21,16.2238576 21,16.5 L21,18.5 C21,19.8807119 19.8807119,21 18.5,21 L16.5,21 C16.2238576,21 16,20.7761424 16,20.5 C16,20.2238576 16.2238576,20 16.5,20 L18.5,20 C19.3284271,20 20,19.3284271 20,18.5 L20,16.5 Z M7.5,20 C7.77614237,20 8,20.2238576 8,20.5 C8,20.7761424 7.77614237,21 7.5,21 L5.5,21 C4.11928813,21 3,19.8807119 3,18.5 L3,16.5 C3,16.2238576 3.22385763,16 3.5,16 C3.77614237,16 4,16.2238576 4,16.5 L4,18.5 C4,19.3284271 4.67157288,20 5.5,20 L7.5,20 Z" fill=""/></svg>';
  var downloadSvg =
    '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>';
  function expandBtn(type) {
    return (
      '<button type="button" onclick="event.stopPropagation(); openExpandModal(\'' +
      type +
      '\')" class="text-gray-600 hover:text-gray-900 transition-colors p-1" title="Expand">' +
      expandSvg +
      "</button>"
    );
  }
  function downloadBtn(key, name) {
    return (
      '<button type="button" onclick="event.stopPropagation(); downloadCovenantSVG(\'' +
      key +
      "','" +
      name +
      '\')" class="text-gray-400 hover:text-gray-700 transition-colors p-1" title="Download SVG">' +
      downloadSvg +
      "</button>"
    );
  }

  host.innerHTML = `
<div class="covenants-page-root mx-auto w-full">
<!-- Loading Overlay -->
    <div
      id="loadingOverlay"
      class="fixed inset-0 bg-gray-100 z-[10000] flex items-center justify-center hidden"
    >
      <div
        class="w-[450px] h-[250px] rounded-[10px] bg-white flex flex-col items-center justify-evenly p-[30px] shadow-[2px_2px_10px_-5px_lightgrey] aspect-square"
      >
        <!-- Text animation layer - isolated from state changes -->
        <label
          id="loadingMessage"
          class="text-gray-900 text-lg font-semibold animate-bit"
          >Please wait...</label
        >

        <!-- Spinner animation layer - runs independently on GPU -->
        <div class="loader-container inline-block relative w-20 h-20">
          <div class="loader-item"></div>
          <div class="loader-item"></div>
          <div class="loader-item"></div>
          <div class="loader-item"></div>
          <div class="loader-item"></div>
          <div class="loader-item"></div>
          <div class="loader-item"></div>
          <div class="loader-item"></div>
          <div class="loader-item"></div>
          <div class="loader-item"></div>
          <div class="loader-item"></div>
          <div class="loader-item"></div>
        </div>
      </div>
    </div>

    <div class="covenants-page-inner mx-auto w-full p-4 md:p-6">
      <!-- Covenants Overview Content -->
      <div id="overviewContent">
        <!-- Page Header -->
        <div class="mb-6 rounded-2xl border border-gray-200 bg-white p-5 overflow-visible">
          <!-- First Row: Search Bar and Action Buttons -->
          <div class="flex flex-wrap items-center gap-3 mb-5">
            <!-- Left: Search Input -->
            <div class="relative flex-1 max-w-md">
              <span
                class="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2"
              >
                <svg
                  class="fill-gray-500"
                  width="18"
                  height="18"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M3.04199 9.37381C3.04199 5.87712 5.87735 3.04218 9.37533 3.04218C12.8733 3.04218 15.7087 5.87712 15.7087 9.37381C15.7087 12.8705 12.8733 15.7055 9.37533 15.7055C5.87735 15.7055 3.04199 12.8705 3.04199 9.37381ZM9.37533 1.54218C5.04926 1.54218 1.54199 5.04835 1.54199 9.37381C1.54199 13.6993 5.04926 17.2055 9.37533 17.2055C11.2676 17.2055 13.0032 16.5346 14.3572 15.4178L17.1773 18.2381C17.4702 18.531 17.945 18.5311 18.2379 18.2382C18.5308 17.9453 18.5309 17.4704 18.238 17.1775L15.4182 14.3575C16.5367 13.0035 17.2087 11.2671 17.2087 9.37381C17.2087 5.04835 13.7014 1.54218 9.37533 1.54218Z"
                    fill=""
                  ></path>
                </svg>
              </span>
              <input
                type="text"
                id="searchInput"
                placeholder="Search covenants, relationships..."
                class="h-10 w-full rounded-lg border border-gray-300 bg-white py-2.5 pr-4 pl-11 text-sm text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none shadow-sm"
              />
            </div>

            <!-- Center: Action Buttons -->
            <div class="flex flex-wrap items-center gap-2 shrink-0">
              <!-- Refresh Button -->
              <button
                onclick="loadDataFromCSV()"
                class="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                title="Refresh data"
              >
                <svg
                  class="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  ></path>
                </svg>
                <span>Refresh</span>
              </button>

              <!-- Reset Filters Button -->
              <button
                onclick="resetAllFilters()"
                class="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <svg
                  class="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
                <span>Clear</span>
              </button>

              <!-- Divider -->
              <div class="h-6 w-px bg-gray-300"></div>

              <!-- Export Dropdown -->
              <div data-ui-root class="relative">
                <button
                  type="button"
                  onclick="toggleUiMenu('exportDropdownMenu')"
                  class="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-2 text-xs font-medium text-white transition-colors"
                >
                  <svg
                    class="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    ></path>
                  </svg>
                  <span>Export</span>
                  <svg
                    data-ui-chevron
                    id="exportDropdownChevron"
                    class="w-3 h-3 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 9l-7 7-7-7"
                    ></path>
                  </svg>
                </button>

                <!-- Dropdown Menu -->
                <div
                  id="exportDropdownMenu"
                  data-ui-menu
                  class="hidden absolute right-0 mt-2 w-44 rounded-lg border border-gray-200 bg-white shadow-xl z-10"
                >
                  <div class="py-1">
                    <button
                      onclick="exportToExcel()"
                      class="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <svg
                        class="w-4 h-4 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        ></path>
                      </svg>
                      <span class="font-medium">Excel (.xlsx)</span>
                    </button>
                    <button
                      onclick="exportToPDF()"
                      class="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <svg
                        class="w-4 h-4 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        ></path>
                      </svg>
                      <span class="font-medium">PDF (.pdf)</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right: Last Updated -->
            <div class="text-right shrink-0 ml-auto">
              <p class="text-xs text-gray-400 font-medium">Last Updated</p>
              <p class="text-sm font-semibold text-gray-600" id="reportDate">
                --
              </p>
            </div>
          </div>

          <!-- Second Row: All Filter Tabs -->
          <div class="covenants-filter-bar relative z-30 flex flex-wrap items-end gap-4 overflow-visible">
            <!-- Region Multi-Select Dropdown -->
            <div class="flex flex-col gap-1.5">
              <span
                class="!text-sm !font-medium text-gray-700 tracking-wide text-center"
                >Region</span
              >
              <div class="relative" id="regionFilterContainer">
                <button
                  onclick="toggleTopFilter('region')"
                  id="btnRegionDropdown"
                  class="inline-flex items-center justify-between min-w-[140px] gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 !text-sm text-gray-600 shadow-sm outline-none hover:border-gray-300 focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-all"
                >
                  <span id="regionFilterLabel" class="!text-sm"
                    >Select region</span
                  >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-5 h-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8 9l4-4 4 4m0 6l-4 4-4-4"
                    />
                  </svg>
                </button>
                <div
                  id="regionFilterDropdown"
                  class="hidden absolute left-0 top-full z-[9999] w-72 mt-3 bg-white border border-gray-200 rounded-lg shadow-lg !text-sm overflow-hidden"
                >
                  <!-- Search Input -->
                  <div
                    class="flex items-center border-b border-gray-100 shadow-sm"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5 mx-3 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    <input
                      type="text"
                      id="regionFilterSearch"
                      oninput="filterRegionDropdownValues()"
                      placeholder="Search"
                      class="flex-1 p-2.5 !text-sm text-gray-600 outline-none bg-transparent"
                    />
                  </div>
                  <!-- Options List -->
                  <div id="regionFilterValues" class="max-h-64 overflow-y-auto">
                    <!-- Populated from Excel Region column -->
                  </div>
                  <!-- Apply Button -->
                  <div class="p-3 border-t border-gray-100 bg-gray-50">
                    <button
                      onclick="applyTopFilter('region')"
                      class="w-full py-2.5 !text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                    >
                      Apply Filter
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Product Program Multi-Select Dropdown -->
            <div class="flex flex-col gap-1.5">
              <span
                class="!text-sm !font-medium text-gray-700 tracking-wide text-center"
                >Product</span
              >
              <div class="relative" id="productFilterContainer">
                <button
                  onclick="toggleTopFilter('product')"
                  id="btnProductDropdown"
                  class="inline-flex items-center justify-between min-w-[150px] gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 !text-sm text-gray-600 shadow-sm outline-none hover:border-gray-300 focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-all"
                >
                  <span id="productFilterLabel" class="!text-sm"
                    >Select product</span
                  >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-5 h-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8 9l4-4 4 4m0 6l-4 4-4-4"
                    />
                  </svg>
                </button>
                <div
                  id="productFilterDropdown"
                  class="hidden absolute left-0 top-full z-[9999] w-80 mt-3 bg-white border border-gray-200 rounded-lg shadow-lg !text-sm overflow-hidden"
                >
                  <!-- Search Input -->
                  <div
                    class="flex items-center border-b border-gray-100 shadow-sm"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5 mx-3 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    <input
                      type="text"
                      id="productFilterSearch"
                      oninput="filterProductDropdownValues()"
                      placeholder="Search"
                      class="flex-1 p-2.5 !text-sm text-gray-600 outline-none bg-transparent"
                    />
                  </div>
                  <!-- Options List -->
                  <div
                    id="productFilterValues"
                    class="max-h-64 overflow-y-auto"
                  >
                    <!-- Will be populated dynamically -->
                  </div>
                  <!-- Apply Button -->
                  <div class="p-3 border-t border-gray-100 bg-gray-50">
                    <button
                      onclick="applyTopFilter('product')"
                      class="w-full py-2.5 !text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                    >
                      Apply Filter
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Underwriter Multi-Select Dropdown -->
            <div class="flex flex-col gap-1.5">
              <span
                class="!text-sm !font-medium text-gray-700 tracking-wide text-center"
                >Underwriter</span
              >
              <div class="relative" id="underwriterFilterContainer">
                <button
                  onclick="toggleTopFilter('underwriter')"
                  id="btnUnderwriterDropdown"
                  class="inline-flex items-center justify-between min-w-[160px] gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 !text-sm text-gray-600 shadow-sm outline-none hover:border-gray-300 focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-all"
                >
                  <span id="underwriterFilterLabel" class="!text-sm"
                    >Select underwriter</span
                  >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-5 h-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8 9l4-4 4 4m0 6l-4 4-4-4"
                    />
                  </svg>
                </button>
                <div
                  id="underwriterFilterDropdown"
                  class="hidden absolute left-0 top-full z-[9999] w-80 mt-3 bg-white border border-gray-200 rounded-lg shadow-lg !text-sm overflow-hidden"
                >
                  <!-- Search Input -->
                  <div
                    class="flex items-center border-b border-gray-100 shadow-sm"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5 mx-3 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    <input
                      type="text"
                      id="underwriterFilterSearch"
                      oninput="filterUnderwriterDropdownValues()"
                      placeholder="Search"
                      class="flex-1 p-2.5 !text-sm text-gray-600 outline-none bg-transparent"
                    />
                  </div>
                  <!-- Options List -->
                  <div
                    id="underwriterFilterValues"
                    class="max-h-64 overflow-y-auto"
                  >
                    <!-- Will be populated dynamically -->
                  </div>
                  <!-- Apply Button -->
                  <div class="p-3 border-t border-gray-100 bg-gray-50">
                    <button
                      onclick="applyTopFilter('underwriter')"
                      class="w-full py-2.5 !text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                    >
                      Apply Filter
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Divider -->
            <div class="h-12 w-px bg-gray-300"></div>

            <!-- Team Lead Multi-Select Dropdown -->
            <div class="flex flex-col gap-1.5">
              <span
                class="!text-sm !font-medium text-gray-700 tracking-wide text-center"
                >Team Lead</span
              >
              <div class="relative" id="teamLeadFilterContainer">
                <button
                  onclick="toggleTopFilter('teamLead')"
                  id="btnTeamLeadDropdown"
                  class="inline-flex items-center justify-between min-w-[160px] gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 !text-sm text-gray-600 shadow-sm outline-none hover:border-gray-300 focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-all"
                >
                  <span id="teamLeadFilterLabel" class="!text-sm"
                    >Select lead</span
                  >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-5 h-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8 9l4-4 4 4m0 6l-4 4-4-4"
                    />
                  </svg>
                </button>
                <div
                  id="teamLeadFilterDropdown"
                  class="hidden absolute left-0 top-full z-[9999] w-80 mt-3 bg-white border border-gray-200 rounded-lg shadow-lg !text-sm overflow-hidden"
                >
                  <!-- Search Input -->
                  <div
                    class="flex items-center border-b border-gray-100 shadow-sm"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5 mx-3 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    <input
                      type="text"
                      id="teamLeadFilterSearch"
                      oninput="filterTeamLeadDropdownValues()"
                      placeholder="Search"
                      class="flex-1 p-2.5 !text-sm text-gray-600 outline-none bg-transparent"
                    />
                  </div>
                  <!-- Options List -->
                  <div
                    id="teamLeadFilterValues"
                    class="max-h-64 overflow-y-auto"
                  >
                    <!-- Will be populated dynamically -->
                  </div>
                  <!-- Apply Button -->
                  <div class="p-3 border-t border-gray-100 bg-gray-50">
                    <button
                      onclick="applyTopFilter('teamLead')"
                      class="w-full py-2.5 !text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                    >
                      Apply Filter
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <!-- Active Filters Badges -->
          <div
            id="activeFiltersBadges"
            class="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200"
            style="display: none"
          >
            <!-- Badges will be dynamically added here -->
          </div>

          <!-- Footnote -->
          <p class="text-sm text-gray-400 mt-4 pt-3 border-t border-gray-100">
            Covenants reports are generated from the New Covenants Module for all Regions
            <button
              type="button"
              onclick="openExpandModal('methodology')"
              class="ml-1.5 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Learn more
            </button>
          </p>
        </div>

        <!-- Covenant Top Metric Cards -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6 mb-6">
          <!-- Total Covenants -->
          <div class="rounded-2xl border border-gray-200 bg-white p-5 flex flex-col relative min-h-[148px]">
            <div class="absolute top-2 right-2 flex items-center gap-0.5 z-10">${expandBtn("totalActive")}</div>
            <div class="flex items-start gap-3 pr-10 flex-1">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100">
                <svg class="h-5 w-5 shrink-0 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              </div>
              <div>
                <h3 class="text-sm font-medium text-gray-500">Total Covenants</h3>
                <p class="text-xs text-gray-400 truncate whitespace-nowrap" id="covMetricTotalSub">Past Due + Coming Due (3 mo)</p>
              </div>
            </div>
            <p class="text-2xl font-bold text-gray-900 text-center mt-3" id="covMetricTotal">0</p>
          </div>

          <!-- Action Needed = Past Due only -->
          <div class="rounded-2xl border border-gray-200 bg-white p-5 flex flex-col relative min-h-[148px]">
            <div class="absolute top-2 right-2 flex items-center gap-0.5 z-10">${expandBtn("actionNeeded")}</div>
            <div class="flex items-start gap-3 pr-10 flex-1">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100">
                <svg class="h-5 w-5 shrink-0 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              </div>
              <div>
                <h3 class="text-sm font-medium text-gray-500">Action Needed</h3>
                <p class="text-xs text-gray-400 truncate whitespace-nowrap" id="covMetricActionSub">Past Due only</p>
              </div>
            </div>
            <p class="text-2xl font-bold text-red-600 text-center mt-3" id="covMetricActionNeeded">0</p>
          </div>

          <!-- Coming Due -->
          <div class="rounded-2xl border border-gray-200 bg-white p-5 flex flex-col relative min-h-[148px] cursor-pointer hover:border-green-200 transition-colors" onclick="openExpandModal('comingDue')" title="Open Total Coming Due charts">
            <div class="absolute top-2 right-2 flex items-center gap-0.5 z-10">${expandBtn("comingDue")}</div>
            <div class="flex items-start gap-3 pr-10 flex-1">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100">
                <svg class="h-5 w-5 shrink-0 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <div>
                <h3 class="text-sm font-medium text-gray-500">Coming Due</h3>
                <p class="text-xs text-gray-400 truncate whitespace-nowrap" id="covMetricComingDueSub">Next 3 months</p>
              </div>
            </div>
            <p class="text-2xl font-bold text-green-600 text-center mt-3" id="covMetricComingDue">0</p>
          </div>

          <!-- Distinct Relationships -->
          <div class="rounded-2xl border border-gray-200 bg-white p-5 flex flex-col relative min-h-[148px]">
            <div class="absolute top-2 right-2 flex items-center gap-0.5 z-10">${expandBtn("relationships")}</div>
            <div class="flex items-start gap-3 pr-10 flex-1">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100">
                <svg class="h-5 w-5 shrink-0 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              </div>
              <div>
                <h3 class="text-sm font-medium text-gray-500">Distinct Relationships</h3>
                <p class="text-xs text-gray-400 truncate whitespace-nowrap" id="covMetricRelationshipsSub">Unique Relationship ID</p>
              </div>
            </div>
            <p class="text-2xl font-bold text-gray-900 text-center mt-3" id="covMetricRelationships">0</p>
          </div>
        </div>

        <!-- Past Due Covenants donut + Past Due Covenants by Region table -->
        <div class="grid grid-cols-12 gap-4 md:gap-6 mb-6 items-stretch">
          <div class="col-span-12 xl:col-span-5 flex">
            <div class="rounded-2xl border border-gray-200 bg-white w-full h-full min-h-[480px] flex flex-col relative" style="overflow: visible">
              <div class="flex items-start justify-between gap-3 px-5 pt-5 sm:px-6 sm:pt-6 pb-4">
                <div class="min-w-0">
                  <h3 class="text-lg font-semibold text-gray-800" id="covenantViewTitle">Past Due Covenants</h3>
                  <p class="mt-1 text-sm text-gray-500" id="covenantViewSubtitle">Covenants past their due date</p>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <div class="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                    <button type="button" onclick="event.stopPropagation(); setActiveInGroup(this, 'bg-white shadow-sm text-gray-900 font-medium', 'text-gray-600', 'px-2 py-1 text-xs rounded-md transition-all duration-200'); var t=document.getElementById('covenantViewTitle'); var s=document.getElementById('covenantViewSubtitle'); if(t)t.textContent='Past Due Covenants'; if(s)s.textContent='Covenants past their due date'; updateCovenantChart('pastDue')" class="px-2 py-1 text-xs rounded-md transition-all duration-200 bg-white shadow-sm text-gray-900 font-medium">Past Due</button>
                    <button type="button" onclick="event.stopPropagation(); setActiveInGroup(this, 'bg-white shadow-sm text-gray-900 font-medium', 'text-gray-600', 'px-2 py-1 text-xs rounded-md transition-all duration-200'); var t=document.getElementById('covenantViewTitle'); var s=document.getElementById('covenantViewSubtitle'); if(t)t.textContent='Coming Due Covenants'; if(s)s.textContent='Covenants due in the next 3 months'; updateCovenantChart('comingDue')" class="px-2 py-1 text-xs rounded-md transition-all duration-200 text-gray-600">Coming Due</button>
                  </div>
                  <div class="flex items-center gap-0.5">
                    <button type="button" onclick="event.stopPropagation(); openExpandModal(window.currentCovenantViewType === 'comingDue' ? 'comingDue' : 'pastDue')" class="text-gray-600 hover:text-gray-900 transition-colors p-1" title="Expand">${expandSvg}</button>
                    ${downloadBtn("monitoring", "Past-Due-Covenants")}
                  </div>
                </div>
              </div>
              <div
                id="covenantMonitoringHost"
                class="flex flex-col items-center justify-center px-5 py-6 flex-1 min-h-0 w-full"
                style="overflow: visible; min-height: 320px; align-self: stretch"
              >
                <div id="covenantMonitoringChart" class="chartDarkStyle"></div>
                <div id="covenantMonitoringLegend" class="flex flex-row items-center justify-center gap-4 sm:gap-6 mt-6 flex-wrap w-full"></div>
              </div>
            </div>
          </div>

          <div class="col-span-12 xl:col-span-7 flex">
            <div class="rounded-2xl border border-gray-200 bg-white w-full h-full min-h-[480px] flex flex-col relative overflow-hidden">
              <div class="absolute top-2 right-2 flex items-center gap-0.5 z-10">
                ${expandBtn("covenantRegional")}
                ${downloadBtn("table:covenantRegionalTableBody", "Past-Due-Covenants-by-Region")}
              </div>
              <div class="px-5 pt-5 sm:px-6 sm:pt-6 pb-4 pr-14 shrink-0">
                <h3 class="text-lg font-semibold text-gray-800" id="covenantRegionalTableTitle">Past Due Covenants by Region</h3>
                <p class="mt-1 text-sm text-gray-500" id="covenantRegionalTableSubtitle">Regional breakdown of past due covenants</p>
              </div>
              <div class="flex-1 min-h-0 flex flex-col overflow-hidden">
                <div class="flex-1 min-h-0 overflow-auto border-t border-gray-100">
                  <table class="regional-summary-table w-full h-full">
                    <thead class="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                      <tr id="covenantRegionalTableHeader">
                        <th class="px-3 py-3 text-xs font-semibold text-gray-700 tracking-wider text-left">Region</th>
                        <th class="px-2 py-3 text-xs font-semibold text-gray-700 tracking-wider text-center">1-45 Days</th>
                        <th class="px-2 py-3 text-xs font-semibold text-gray-700 tracking-wider text-center">46-90 Days</th>
                        <th class="px-2 py-3 text-xs font-semibold text-gray-700 tracking-wider text-center">&gt;90 Days</th>
                        <th class="px-2 py-3 text-xs font-semibold text-gray-700 tracking-wider text-center">Total Past Dues</th>
                        <th class="px-2 py-3 text-xs font-semibold text-gray-700 tracking-wider text-center">Total Covenants</th>
                        <th class="px-2 py-3 text-xs font-semibold text-gray-700 tracking-wider text-center">% of Total</th>
                      </tr>
                    </thead>
                    <tbody id="covenantRegionalTableBody" class="divide-y divide-gray-100 bg-white">
                      <tr><td colspan="7" class="px-4 py-8 text-center text-sm text-gray-400">Loading regional covenant data...</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Deferred / Waived / Deleted Covenants (from Covenants_Activity_Report.xlsx) -->
        <div class="grid grid-cols-12 gap-4 md:gap-6 mb-6 items-stretch">
          <!-- Left: Activity bar chart with status toggle -->
          <div class="col-span-12 xl:col-span-6 flex">
            <div
              class="rounded-2xl border border-gray-200 bg-white w-full h-full min-h-[480px] flex flex-col relative"
              style="overflow: visible"
            >
              <div class="flex items-start justify-between gap-3 px-5 pt-5 sm:px-6 sm:pt-6 pb-4">
                <div class="min-w-0 pr-2">
                  <h3
                    class="text-lg font-semibold text-gray-800"
                    id="covActivityViewTitle"
                  >
                    Deferred Covenants
                  </h3>
                  <p
                    class="mt-1 text-sm text-gray-500"
                    id="covActivityViewSubtitle"
                  >
                    Across 3 months from visible months
                  </p>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <div class="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                    <button
                      type="button"
                      onclick="event.stopPropagation(); setActiveInGroup(this, 'bg-white shadow-sm text-gray-900 font-medium', 'text-gray-600', 'px-2 py-1 text-xs rounded-md transition-all duration-200'); updateCovenantActivityView('deferred')"
                      class="px-2 py-1 text-xs rounded-md transition-all duration-200 bg-white shadow-sm text-gray-900 font-medium"
                    >
                      Deferred
                    </button>
                    <button
                      type="button"
                      onclick="event.stopPropagation(); setActiveInGroup(this, 'bg-white shadow-sm text-gray-900 font-medium', 'text-gray-600', 'px-2 py-1 text-xs rounded-md transition-all duration-200'); updateCovenantActivityView('waived')"
                      class="px-2 py-1 text-xs rounded-md transition-all duration-200 text-gray-600"
                    >
                      Waived
                    </button>
                    <button
                      type="button"
                      onclick="event.stopPropagation(); setActiveInGroup(this, 'bg-white shadow-sm text-gray-900 font-medium', 'text-gray-600', 'px-2 py-1 text-xs rounded-md transition-all duration-200'); updateCovenantActivityView('deleted')"
                      class="px-2 py-1 text-xs rounded-md transition-all duration-200 text-gray-600"
                    >
                      Deleted
                    </button>
                  </div>
                  <div class="flex items-center gap-0.5">
                    <button type="button" onclick="event.stopPropagation(); openExpandModal('activity')" class="text-gray-600 hover:text-gray-900 transition-colors p-1" title="Expand">
                      <svg class="fill-current" width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" stroke-width="0.5" stroke="currentColor"><path d="M4,7.5 C4,7.77614237 3.77614237,8 3.5,8 C3.22385763,8 3,7.77614237 3,7.5 L3,5.5 C3,4.11928813 4.11928813,3 5.5,3 L7.5,3 C7.77614237,3 8,3.22385763 8,3.5 C8,3.77614237 7.77614237,4 7.5,4 L5.5,4 C4.67157288,4 4,4.67157288 4,5.5 L4,7.5 Z M16.5,4 C16.2238576,4 16,3.77614237 16,3.5 C16,3.22385763 16.2238576,3 16.5,3 L18.5,3 C19.8807119,3 21,4.11928813 21,5.5 L21,7.5 C21,7.77614237 20.7761424,8 20.5,8 C20.2238576,8 20,7.77614237 20,7.5 L20,5.5 C20,4.67157288 19.3284271,4 18.5,4 L16.5,4 Z M20,16.5 C20,16.2238576 20.2238576,16 20.5,16 C20.7761424,16 21,16.2238576 21,16.5 L21,18.5 C21,19.8807119 19.8807119,21 18.5,21 L16.5,21 C16.2238576,21 16,20.7761424 16,20.5 C16,20.2238576 16.2238576,20 16.5,20 L18.5,20 C19.3284271,20 20,19.3284271 20,18.5 L20,16.5 Z M7.5,20 C7.77614237,20 8,20.2238576 8,20.5 C8,20.7761424 7.77614237,21 7.5,21 L5.5,21 C4.11928813,21 3,19.8807119 3,18.5 L3,16.5 C3,16.2238576 3.22385763,16 3.5,16 C3.77614237,16 4,16.2238576 4,16.5 L4,18.5 C4,19.3284271 4.67157288,20 5.5,20 L7.5,20 Z" fill=""/></svg>
                    </button>
                    <button type="button" onclick="event.stopPropagation(); downloadCovenantSVG('activity','Covenant-Activity')" class="text-gray-400 hover:text-gray-700 transition-colors p-1" title="Download SVG">
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                    </button>
                  </div>
                </div>
              </div>
              <div
                id="covActivityChartHost"
                class="flex-1 min-h-0 flex flex-col items-stretch justify-center px-3 sm:px-5 pb-5"
                style="overflow: visible; min-height: 340px"
              >
                <div
                  id="covActivityChart"
                  class="w-full flex-1"
                  style="width: 100%; min-height: 340px; height: 100%"
                ></div>
              </div>
            </div>
          </div>


          <!-- Right: Regional summary table (synced with chart status) -->
          <div class="col-span-12 xl:col-span-6 flex">
            <div
              class="rounded-2xl border border-gray-200 bg-white w-full h-full min-h-[480px] flex flex-col relative overflow-hidden"
            >
              <div class="absolute top-2 right-2 flex items-center gap-0.5 z-10">
                <button type="button" onclick="openExpandModal('activityRegional')" class="text-gray-600 hover:text-gray-900 transition-colors p-1" title="Expand">
                  <svg class="fill-current" width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" stroke-width="0.5" stroke="currentColor"><path d="M4,7.5 C4,7.77614237 3.77614237,8 3.5,8 C3.22385763,8 3,7.77614237 3,7.5 L3,5.5 C3,4.11928813 4.11928813,3 5.5,3 L7.5,3 C7.77614237,3 8,3.22385763 8,3.5 C8,3.77614237 7.77614237,4 7.5,4 L5.5,4 C4.67157288,4 4,4.67157288 4,5.5 L4,7.5 Z M16.5,4 C16.2238576,4 16,3.77614237 16,3.5 C16,3.22385763 16.2238576,3 16.5,3 L18.5,3 C19.8807119,3 21,4.11928813 21,5.5 L21,7.5 C21,7.77614237 20.7761424,8 20.5,8 C20.2238576,8 20,7.77614237 20,7.5 L20,5.5 C20,4.67157288 19.3284271,4 18.5,4 L16.5,4 Z M20,16.5 C20,16.2238576 20.2238576,16 20.5,16 C20.7761424,16 21,16.2238576 21,16.5 L21,18.5 C21,19.8807119 19.8807119,21 18.5,21 L16.5,21 C16.2238576,21 16,20.7761424 16,20.5 C16,20.2238576 16.2238576,20 16.5,20 L18.5,20 C19.3284271,20 20,19.3284271 20,18.5 L20,16.5 Z M7.5,20 C7.77614237,20 8,20.2238576 8,20.5 C8,20.7761424 7.77614237,21 7.5,21 L5.5,21 C4.11928813,21 3,19.8807119 3,18.5 L3,16.5 C3,16.2238576 3.22385763,16 3.5,16 C3.77614237,16 4,16.2238576 4,16.5 L4,18.5 C4,19.3284271 4.67157288,20 5.5,20 L7.5,20 Z" fill=""/></svg>
                </button>
                <button type="button" onclick="downloadCovenantSVG('table:covActivityTableBody','Covenant-Activity-Regional')" class="text-gray-400 hover:text-gray-700 transition-colors p-1" title="Download SVG">
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                </button>
              </div>
              <div class="px-5 pt-5 sm:px-6 sm:pt-6 pb-4 pr-14 shrink-0">
                <h3
                  class="text-lg font-semibold text-gray-800"
                  id="covActivityTableTitle"
                >
                  Deferred Covenants by Region
                </h3>
                <p
                  class="mt-1 text-sm text-gray-500"
                  id="covActivityTableSubtitle"
                >
                  Regional breakdown of deferred covenant activity
                </p>
              </div>
              <div class="flex-1 min-h-0 flex flex-col overflow-hidden">
                <div class="flex-1 min-h-0 overflow-auto border-t border-gray-100">
                  <table class="regional-summary-table w-full h-full">
                    <thead class="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                      <tr id="covActivityTableHeader">
                        <th class="px-3 py-3 text-xs font-semibold text-gray-700 tracking-wider whitespace-nowrap">Region</th>
                      </tr>
                    </thead>
                    <tbody id="covActivityTableBody" class="divide-y divide-gray-100 bg-white">
                      <tr>
                        <td colspan="6" class="px-4 py-8 text-center text-sm text-gray-400">
                          Loading regional activity summary...
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

        </div>



        <!-- Aging Severity by Region + Covenants by Product Program -->
        <div class="grid grid-cols-12 gap-4 md:gap-6 mb-6 items-stretch">
          <div class="col-span-12 xl:col-span-6 flex">
            <div class="rounded-2xl border border-gray-200 bg-white w-full h-full min-h-[400px] flex flex-col relative" style="overflow: visible">
              <div class="absolute top-2 right-2 flex items-center gap-0.5 z-10">
                ${expandBtn("agingByRegion")}
                ${downloadBtn("agingByRegion", "Aging-Severity-by-Region")}
              </div>
              <div class="border-b border-gray-200 px-5 sm:px-6 py-4 pr-14 shrink-0">
                <h3 class="text-base font-semibold text-gray-900">Aging Severity by Region</h3>
                <p class="text-sm font-medium text-gray-500 mt-1">Stacked aging profile — chart view (table is on the dashboard)</p>
                <p class="cov-insight-text" id="covInsightAgingByRegionInsight"></p>
              </div>
              <div
                id="covInsightAgingHost"
                class="p-4 flex-1 flex items-center justify-center min-h-0"
                style="min-height:320px; overflow: visible; align-self: stretch"
              >
                <div id="covInsightAgingByRegionChart" class="w-full" style="width:100%;min-height:320px"></div>
              </div>
            </div>
          </div>
          <div class="col-span-12 xl:col-span-6 flex">
            <div class="rounded-2xl border border-gray-200 bg-white w-full h-full min-h-[400px] flex flex-col relative" style="overflow: visible">
              <div class="absolute top-2 right-2 flex items-center gap-0.5 z-10">
                ${expandBtn("productDonut")}
                ${downloadBtn("productDonut", "Covenants-by-Product-Program")}
              </div>
              <div class="border-b border-gray-200 px-5 sm:px-6 py-4 pr-14 shrink-0">
                <h3 class="text-base font-semibold text-gray-900">Covenants by Product Program</h3>
                <p class="text-sm font-medium text-gray-500 mt-1">Distribution by Product_Program</p>
                <p class="cov-insight-text" id="covInsightProductInsight"></p>
              </div>
              <div
                id="covInsightProductHost"
                class="flex-1 min-h-0 p-4 sm:p-5 flex items-center justify-center"
                style="min-height:320px; overflow: visible"
              >
                <div id="covInsightProductInner" class="flex flex-row items-center justify-center gap-6 w-full h-full min-h-0">
                  <div class="flex-shrink-0 h-full flex items-center">
                    <div id="covInsightProductDonutChart" class="cov-chart-fill" style="width:260px;height:260px"></div>
                  </div>
                  <div class="flex-1 min-w-0 max-w-md overflow-auto">
                    <div id="covInsightProductList" class="space-y-2"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Details table -->
        <div id="covenantDetailsTableSection" class="rounded-2xl border border-gray-200 bg-white mb-6">
          <div class="px-5 sm:px-6 py-4 border-b border-gray-200">
            <div class="flex items-center justify-between gap-4">
              <div class="min-w-0 flex-1">
                <h3 class="text-lg font-semibold text-gray-800 truncate" id="covenantDetailsTableTitle">Past Due Covenants</h3>
                <p class="text-sm font-medium text-gray-500 mt-1 truncate" id="covenantDetailsTableSubtitle">Comprehensive breakdown with aging buckets</p>
              </div>
              <div class="flex items-center justify-end gap-2 shrink-0 ml-auto">
                <div class="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 whitespace-nowrap">
                  <button
                    type="button"
                    id="covenantDetailsBtnActionNeeded"
                    onclick="setActiveInGroup(this, 'bg-white shadow-sm text-gray-900 font-medium', 'text-gray-600', 'px-2.5 py-1.5 text-xs rounded-md transition-all duration-200'); filterCovenantDetailsTable('actionNeeded')"
                    class="px-2.5 py-1.5 text-xs rounded-md transition-all duration-200 bg-white shadow-sm text-gray-900 font-medium"
                  >
                    Past Due
                  </button>
                  <button
                    type="button"
                    id="covenantDetailsBtnComingDue"
                    onclick="setActiveInGroup(this, 'bg-white shadow-sm text-gray-900 font-medium', 'text-gray-600', 'px-2.5 py-1.5 text-xs rounded-md transition-all duration-200'); filterCovenantDetailsTable('comingDue')"
                    class="px-2.5 py-1.5 text-xs rounded-md transition-all duration-200 text-gray-600"
                  >
                    Coming Due
                  </button>
                </div>
                <div class="relative w-80 shrink-0">
                  <span class="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-gray-400">
                    <svg
                      class="fill-gray-500"
                      width="18"
                      height="18"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                        d="M3.04199 9.37381C3.04199 5.87712 5.87735 3.04218 9.37533 3.04218C12.8733 3.04218 15.7087 5.87712 15.7087 9.37381C15.7087 12.8705 12.8733 15.7055 9.37533 15.7055C5.87735 15.7055 3.04199 12.8705 3.04199 9.37381ZM9.37533 1.54218C5.04926 1.54218 1.54199 5.04835 1.54199 9.37381C1.54199 13.6993 5.04926 17.2055 9.37533 17.2055C11.2676 17.2055 13.0032 16.5346 14.3572 15.4178L17.1773 18.2381C17.4702 18.531 17.945 18.5311 18.2379 18.2382C18.5308 17.9453 18.5309 17.4704 18.238 17.1775L15.4182 14.3575C16.5367 13.0035 17.2087 11.2671 17.2087 9.37381C17.2087 5.04835 13.7014 1.54218 9.37533 1.54218Z"
                        fill=""
                      ></path>
                    </svg>
                  </span>
                  <input
                    type="text"
                    id="covenantDetailsSearch"
                    placeholder="Search relationship, underwriter, region..."
                    oninput="onCovenantDetailsSearchInput()"
                    autocomplete="off"
                    class="h-10 w-full rounded-lg border border-gray-300 bg-white py-2.5 pr-4 pl-11 text-sm text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none shadow-sm"
                  />
                </div>
                <button type="button" onclick="openExpandModal('covenantDetails')" class="text-gray-600 hover:text-gray-900 transition-colors p-1 shrink-0" title="Expand">
                  <svg class="fill-current" width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" stroke-width="0.5" stroke="currentColor"><path d="M4,7.5 C4,7.77614237 3.77614237,8 3.5,8 C3.22385763,8 3,7.77614237 3,7.5 L3,5.5 C3,4.11928813 4.11928813,3 5.5,3 L7.5,3 C7.77614237,3 8,3.22385763 8,3.5 C8,3.77614237 7.77614237,4 7.5,4 L5.5,4 C4.67157288,4 4,4.67157288 4,5.5 L4,7.5 Z M16.5,4 C16.2238576,4 16,3.77614237 16,3.5 C16,3.22385763 16.2238576,3 16.5,3 L18.5,3 C19.8807119,3 21,4.11928813 21,5.5 L21,7.5 C21,7.77614237 20.7761424,8 20.5,8 C20.2238576,8 20,7.77614237 20,7.5 L20,5.5 C20,4.67157288 19.3284271,4 18.5,4 L16.5,4 Z M20,16.5 C20,16.2238576 20.2238576,16 20.5,16 C20.7761424,16 21,16.2238576 21,16.5 L21,18.5 C21,19.8807119 19.8807119,21 18.5,21 L16.5,21 C16.2238576,21 16,20.7761424 16,20.5 C16,20.2238576 16.2238576,20 16.5,20 L18.5,20 C19.3284271,20 20,19.3284271 20,18.5 L20,16.5 Z M7.5,20 C7.77614237,20 8,20.2238576 8,20.5 C8,20.7761424 7.77614237,21 7.5,21 L5.5,21 C4.11928813,21 3,19.8807119 3,18.5 L3,16.5 C3,16.2238576 3.22385763,16 3.5,16 C3.77614237,16 4,16.2238576 4,16.5 L4,18.5 C4,19.3284271 4.67157288,20 5.5,20 L7.5,20 Z" fill=""/></svg>
                </button>
                <button type="button" onclick="downloadCovenantSVG('table:covenantDetailsTableBody','Covenant-Details')" class="text-gray-400 hover:text-gray-700 transition-colors p-1 shrink-0" title="Download SVG">
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                </button>
              </div>
            </div>
          </div>

          <div class="custom-scrollbar overflow-x-auto">
            <table class="min-w-full">
              <thead>
                <tr id="covenantDetailsTableHeader">
                  <th class="px-6 py-4 text-left text-sm font-medium whitespace-nowrap text-gray-500">Relationship ID</th>
                  <th class="px-6 py-4 text-left text-sm font-medium whitespace-nowrap text-gray-500">Relationship Name</th>
                  <th class="px-6 py-4 text-left text-sm font-medium whitespace-nowrap text-gray-500">Underwriter</th>
                  <th class="px-6 py-4 text-center text-sm font-medium whitespace-nowrap text-gray-500">Region</th>
                  <th class="px-6 py-4 text-center text-sm font-medium whitespace-nowrap text-gray-500">1-45 Days</th>
                  <th class="px-6 py-4 text-center text-sm font-medium whitespace-nowrap text-gray-500">46-60 Days</th>
                  <th class="px-6 py-4 text-center text-sm font-medium whitespace-nowrap text-gray-500">61-90 Days</th>
                  <th class="px-6 py-4 text-center text-sm font-medium whitespace-nowrap text-gray-500">90+ Days</th>
                </tr>
              </thead>
              <tbody id="covenantDetailsTableBody" class="divide-y divide-gray-200">
                <tr>
                  <td colspan="8" class="px-6 py-8 text-center text-sm text-gray-400">Loading Past Due covenants...</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-5 sm:px-6 py-4 border-t border-gray-200">
            <div class="flex flex-wrap items-center gap-3 text-sm text-gray-700">
              <div>
                Showing <span class="font-medium" id="covenantDetailsTableStart">0</span>
                to <span class="font-medium" id="covenantDetailsTableEnd">0</span>
                of <span class="font-medium" id="covenantDetailsTableTotal">0</span> items
              </div>
              <select
                id="covenantDetailsTablePerPage"
                onchange="updateCovenantDetailsTablePerPage(parseInt(this.value, 10))"
                class="text-sm border border-gray-300 rounded-lg px-2 py-1.5 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="10" selected>10 per page</option>
                <option value="20">20 per page</option>
                <option value="50">50 per page</option>
                <option value="100">100 per page</option>
              </select>
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                id="covenantDetailsTablePrevBtn"
                onclick="changeCovenantDetailsTablePage('prev')"
                disabled
                class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <div class="text-sm text-gray-700">
                Page <span class="font-medium" id="covenantDetailsTableCurrentPage">1</span>
                of <span class="font-medium" id="covenantDetailsTableTotalPages">1</span>
              </div>
              <button
                type="button"
                id="covenantDetailsTableNextBtn"
                onclick="changeCovenantDetailsTablePage('next')"
                disabled
                class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Expand / Insights Modal (PAL-overview pattern) -->
    <div
      id="expandModal"
      class="fixed inset-0 z-[9999] hidden overflow-y-auto"
      aria-labelledby="expand-modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div
        class="fixed inset-0 bg-gray-400/50 backdrop-blur-[32px] transition-opacity"
        onclick="closeExpandModal()"
      ></div>
      <div class="flex min-h-full items-center justify-center p-4">
        <div
          class="relative mx-auto w-full max-w-none h-[90vh] transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all flex flex-col"
        >
          <div class="border-b border-gray-200 bg-white px-6 py-4 flex-shrink-0">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div id="modalTitleSection">
                  <h3 class="text-lg font-semibold text-gray-900" id="expandModalTitle">Details</h3>
                  <p class="mt-1 text-sm text-gray-500 hidden" id="expandModalSubtitle"></p>
                </div>
              </div>
              <button
                onclick="closeExpandModal()"
                type="button"
                class="flex h-9.5 w-9.5 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700 sm:h-11 sm:w-11 cursor-pointer ml-4"
              >
                <svg class="fill-current" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M6.04289 16.5413C5.65237 16.9318 5.65237 17.565 6.04289 17.9555C6.43342 18.346 7.06658 18.346 7.45711 17.9555L11.9987 13.4139L16.5408 17.956C16.9313 18.3466 17.5645 18.3466 17.955 17.956C18.3455 17.5655 18.3455 16.9323 17.955 16.5418L13.4129 11.9997L17.955 7.4576C18.3455 7.06707 18.3455 6.43391 17.955 6.04338C17.5645 5.65286 16.9313 5.65286 16.5408 6.04338L11.9987 10.5855L7.45711 6.0439C7.06658 5.65338 6.43342 5.65338 6.04289 6.0439C5.65237 6.43442 5.65237 7.06759 6.04289 7.45811L10.5845 11.9997L6.04289 16.5413Z" fill=""/>
                </svg>
              </button>
            </div>
          </div>
          <div class="border-b border-gray-200 px-6 flex-shrink-0">
            <nav class="-mb-px flex space-x-2 overflow-x-auto">
              <button
                id="insightsTab"
                onclick="switchExpandTab('insights')"
                class="inline-flex items-center gap-2 border-b-2 px-2.5 py-3 text-sm font-medium transition-colors duration-200 ease-in-out text-blue-600 border-blue-600"
              >
                <svg class="size-5" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M9.85954 4.0835C9.5834 4.0835 9.35954 4.30735 9.35954 4.5835V15.4161C9.35954 15.6922 9.5834 15.9161 9.85954 15.9161H10.1373C10.4135 15.9161 10.6373 15.6922 10.6373 15.4161V4.5835C10.6373 4.30735 10.4135 4.0835 10.1373 4.0835H9.85954ZM7.85954 4.5835C7.85954 3.47893 8.75497 2.5835 9.85954 2.5835H10.1373C11.2419 2.5835 12.1373 3.47893 12.1373 4.5835V15.4161C12.1373 16.5206 11.2419 17.4161 10.1373 17.4161H9.85954C8.75497 17.4161 7.85954 16.5206 7.85954 15.4161V4.5835ZM4.58203 8.9598C4.30589 8.9598 4.08203 9.18366 4.08203 9.4598V15.4168C4.08203 15.693 4.30589 15.9168 4.58203 15.9168H4.85981C5.13595 15.9168 5.35981 15.693 5.35981 15.4168V9.4598C5.35981 9.18366 5.13595 8.9598 4.85981 8.9598H4.58203ZM2.58203 9.4598C2.58203 8.35523 3.47746 7.4598 4.58203 7.4598H4.85981C5.96438 7.4598 6.85981 8.35523 6.85981 9.4598V15.4168C6.85981 16.5214 5.96438 17.4168 4.85981 17.4168H4.58203C3.47746 17.4168 2.58203 16.5214 2.58203 15.4168V9.4598ZM14.637 12.435C14.637 12.1589 14.8609 11.935 15.137 11.935H15.4148C15.691 11.935 15.9148 12.1589 15.9148 12.435V15.4168C15.9148 15.693 15.691 15.9168 15.4148 15.9168H15.137C14.8609 15.9168 14.637 15.693 14.637 15.4168V12.435ZM15.137 10.435C14.0325 10.435 13.137 11.3304 13.137 12.435V15.4168C13.137 16.5214 14.0325 17.4168 15.137 17.4168H15.4148C16.5194 17.4168 17.4148 16.5214 17.4148 15.4168V12.435C17.4148 11.3304 16.5194 10.435 15.4148 10.435H15.137Z" fill="currentColor"/>
                </svg>
                <span id="insightsTabLabel">Insights</span>
              </button>
            </nav>
          </div>
          <div class="flex-1 overflow-auto">
            <div id="insightsContent" class="p-6 bg-white">
              <div class="flex items-center justify-center py-12 text-gray-400">
                <svg class="animate-spin h-8 w-8 mr-3" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading insights...
              </div>
            </div>
          </div>
          <div id="expandModalFooter" class="border-t border-gray-200 bg-gray-50 px-6 py-3 flex-shrink-0">
            <div class="flex items-center justify-between">
              <p id="expandModalFooterText" class="text-sm text-gray-500">Click outside or press ESC to close</p>
            </div>
          </div>
        </div>
      </div>
    </div>
</div>
`;

  function startCovenants() {
    console.log("[Covenants] HTML injected (Past Due donut + regional table)");
    if (typeof window.bootstrapCovenantsPage === "function") {
      try {
        if (!window.__covenantsBootstrapped) {
          window.__covenantsBootstrapped = true;
          window.bootstrapCovenantsPage();
        }
      } catch (err) {
        console.error("[Covenants] bootstrap failed:", err);
        window.__covenantsBootstrapped = false;
      }
      var paint = function () {
        if (typeof window.refreshCovenantPageCharts === "function") {
          window.refreshCovenantPageCharts();
        } else if (typeof window.updateCovenantChart === "function") {
          window.updateCovenantChart("pastDue");
        }
      };
      setTimeout(paint, 200);
      setTimeout(paint, 800);
      return;
    }
    window.__covenantsHtmlReady = true;
    console.warn(
      "[Covenants] covenants.js missing bootstrapCovenantsPage. Check macro script order."
    );
  }

  function waitForLibs(attempts) {
    var ready =
      typeof window.ApexCharts !== "undefined" &&
      typeof window.XLSX !== "undefined";
    if (ready || attempts <= 0) {
      if (!ready) {
        console.warn(
          "[Covenants] ApexCharts/XLSX not ready after wait — starting anyway."
        );
      }
      startCovenants();
      return;
    }
    setTimeout(function () {
      waitForLibs(attempts - 1);
    }, 50);
  }

  waitForLibs(60);
})();
