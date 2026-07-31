/**
 * Covenant Monitoring — HTML markup for Confluence
 * Injects into #globalRiskCovenants then bootstraps the app (if covenants.js loaded first).
 */
(function () {
  var host = document.getElementById("globalRiskCovenants");
  if (!host) {
    console.error('Element #globalRiskCovenants not found. Add <div id="globalRiskCovenants"></div> in the macro.');
    return;
  }

  host.innerHTML = `
<div class="bg-gray-50 covenants-page-root">
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

    <div class="p-4 md:p-6">
      <!-- Covenants Overview Content -->
      <div id="overviewContent">
        <!-- Page Header -->
        <div class="mb-6 rounded-2xl border border-gray-200 bg-white p-5">
          <!-- First Row: Search Bar and Action Buttons -->
          <div class="flex items-center gap-3 mb-5">
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
            <div class="flex items-center gap-2">
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
          <div class="flex flex-wrap items-end gap-4">
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
                    <div
                      class="filter-item flex items-center justify-between px-3 py-2.5 cursor-pointer !text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-150"
                      data-value="APAC"
                      onclick="toggleFilterItem(this, 'region')"
                    >
                      <span class="pr-4 !text-sm">APAC</span>
                      <div class="w-5 h-5 check-icon hidden">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="w-5 h-5 text-blue-600"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clip-rule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                    <div
                      class="filter-item flex items-center justify-between px-3 py-2.5 cursor-pointer !text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-150"
                      data-value="EMEA"
                      onclick="toggleFilterItem(this, 'region')"
                    >
                      <span class="pr-4 !text-sm">EMEA</span>
                      <div class="w-5 h-5 check-icon hidden">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="w-5 h-5 text-blue-600"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clip-rule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                    <div
                      class="filter-item flex items-center justify-between px-3 py-2.5 cursor-pointer !text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-150"
                      data-value="LATAM"
                      onclick="toggleFilterItem(this, 'region')"
                    >
                      <span class="pr-4 !text-sm">LATAM</span>
                      <div class="w-5 h-5 check-icon hidden">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="w-5 h-5 text-blue-600"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clip-rule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                    <div
                      class="filter-item flex items-center justify-between px-3 py-2.5 cursor-pointer !text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-150"
                      data-value="NAM"
                      onclick="toggleFilterItem(this, 'region')"
                    >
                      <span class="pr-4 !text-sm">NAM</span>
                      <div class="w-5 h-5 check-icon hidden">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="w-5 h-5 text-blue-600"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clip-rule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
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
          </p>
        </div>

        <!-- Covenant Top Metric Cards -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6 mb-6">
          <!-- Past Due -->
          <div class="rounded-2xl border border-gray-200 bg-white p-5 flex flex-col relative">
            <div class="flex items-start gap-3 flex-1">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100">
                <svg class="h-5 w-5 shrink-0 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              </div>
              <div>
                <h3 class="text-sm font-medium text-gray-500">Past Due</h3>
                <p class="text-xs text-gray-400">All past due covenants</p>
              </div>
            </div>
            <p class="text-2xl font-bold text-red-600 text-center mt-3" id="covMetricPastDue">0</p>
          </div>

          <!-- Coming Due -->
          <div class="rounded-2xl border border-gray-200 bg-white p-5 flex flex-col relative">
            <div class="flex items-start gap-3 flex-1">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100">
                <svg class="h-5 w-5 shrink-0 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <div>
                <h3 class="text-sm font-medium text-gray-500">Coming Due</h3>
                <p class="text-xs text-gray-400">Next 30 days</p>
              </div>
            </div>
            <p class="text-2xl font-bold text-amber-600 text-center mt-3" id="covMetricComingDue">0</p>
          </div>

          <!-- Total -->
          <div class="rounded-2xl border border-gray-200 bg-white p-5 flex flex-col relative">
            <div class="flex items-start gap-3 flex-1">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100">
                <svg class="h-5 w-5 shrink-0 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              </div>
              <div>
                <h3 class="text-sm font-medium text-gray-500">Total Active</h3>
                <p class="text-xs text-gray-400">Past due + coming due</p>
              </div>
            </div>
            <p class="text-2xl font-bold text-blue-600 text-center mt-3" id="covMetricTotal">0</p>
          </div>

          <!-- Relationships -->
          <div class="rounded-2xl border border-gray-200 bg-white p-5 flex flex-col relative">
            <div class="flex items-start gap-3 flex-1">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100">
                <svg class="h-5 w-5 shrink-0 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              </div>
              <div>
                <h3 class="text-sm font-medium text-gray-500">Relationships</h3>
                <p class="text-xs text-gray-400">With active covenants</p>
              </div>
            </div>
            <p class="text-2xl font-bold text-gray-900 text-center mt-3" id="covMetricRelationships">0</p>
          </div>
        </div>

        <!-- Covenants Dashboard Grid -->
        <div class="grid grid-cols-12 gap-4 md:gap-6 mb-6 items-stretch">
          <!-- Covenant Monitoring Chart -->
          <div class="col-span-12 xl:col-span-5 flex">
            <div class="rounded-2xl border border-gray-200 bg-white w-full h-full min-h-[480px] flex flex-col relative" style="overflow: visible">
              <div class="absolute top-2 right-2 flex items-center gap-0.5 z-10">
                <button type="button" onclick="downloadCovenantSVG('monitoring','Covenant-Monitoring')" class="text-gray-400 hover:text-gray-700 transition-colors p-1" title="Download SVG">
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                </button>
              </div>
              <div class="flex items-center justify-between px-5 pt-5 sm:px-6 sm:pt-6 pb-4">
                <div class="pr-14">
                  <h3 class="text-lg font-semibold text-gray-800" id="covenantViewTitle">Past Due Covenants</h3>
                  <p class="mt-1 text-sm text-gray-500" id="covenantViewSubtitle">Covenants past their due date</p>
                </div>
                <div class="flex items-center gap-2">
                  <div class="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                    <button type="button" onclick="setActiveInGroup(this, 'bg-white shadow-sm text-gray-900 font-medium', 'text-gray-600', 'px-2 py-1 text-xs rounded-md transition-all duration-200'); var t=document.getElementById('covenantViewTitle'); var s=document.getElementById('covenantViewSubtitle'); if(t)t.textContent='Past Due Covenants'; if(s)s.textContent='Covenants past their due date'; updateCovenantChart('pastDue')" class="px-2 py-1 text-xs rounded-md transition-all duration-200 bg-white shadow-sm text-gray-900 font-medium">Past Due</button>
                    <button type="button" onclick="setActiveInGroup(this, 'bg-white shadow-sm text-gray-900 font-medium', 'text-gray-600', 'px-2 py-1 text-xs rounded-md transition-all duration-200'); var t=document.getElementById('covenantViewTitle'); var s=document.getElementById('covenantViewSubtitle'); if(t)t.textContent='Coming Due Covenants (Next 30 Days)'; if(s)s.textContent='Covenants due in the next 30 days'; updateCovenantChart('comingDue')" class="px-2 py-1 text-xs rounded-md transition-all duration-200 text-gray-600">Coming Due</button>
                  </div>
                </div>
              </div>
              <div
                id="covenantMonitoringHost"
                class="flex flex-col items-center justify-center px-5 py-6 flex-1 min-h-0"
                style="overflow: visible; min-height: 320px; align-self: stretch"
              >
                <div id="covenantMonitoringChart" class="chartDarkStyle"></div>
                <div id="covenantMonitoringLegend" class="flex flex-row items-center justify-center gap-4 sm:gap-6 mt-6 flex-wrap"></div>
              </div>
            </div>
          </div>

          <!-- Regional Distribution Table -->
          <div class="col-span-12 xl:col-span-7 flex">
            <div class="rounded-2xl border border-gray-200 bg-white w-full h-full min-h-[480px] flex flex-col relative overflow-hidden">
              <div class="absolute top-2 right-2 flex items-center gap-0.5 z-10">
                <button type="button" onclick="downloadCovenantSVG('table:covenantRegionalTableBody','Covenant-Regional-Table')" class="text-gray-400 hover:text-gray-700 transition-colors p-1" title="Download SVG">
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                </button>
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
              <div class="absolute top-2 right-2 flex items-center gap-0.5 z-10">
                <button type="button" onclick="downloadCovenantSVG('activity','Covenant-Activity')" class="text-gray-400 hover:text-gray-700 transition-colors p-1" title="Download SVG">
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                </button>
              </div>
              <div class="flex items-center justify-between px-5 pt-5 sm:px-6 sm:pt-6 pb-4 pr-12">
                <div class="pr-4">
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
                    Monthly deferred covenants by region
                  </p>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <div class="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                    <button
                      type="button"
                      onclick="setActiveInGroup(this, 'bg-white shadow-sm text-gray-900 font-medium', 'text-gray-600', 'px-2 py-1 text-xs rounded-md transition-all duration-200'); updateCovenantActivityView('deferred')"
                      class="px-2 py-1 text-xs rounded-md transition-all duration-200 bg-white shadow-sm text-gray-900 font-medium"
                    >
                      Deferred
                    </button>
                    <button
                      type="button"
                      onclick="setActiveInGroup(this, 'bg-white shadow-sm text-gray-900 font-medium', 'text-gray-600', 'px-2 py-1 text-xs rounded-md transition-all duration-200'); updateCovenantActivityView('waived')"
                      class="px-2 py-1 text-xs rounded-md transition-all duration-200 text-gray-600"
                    >
                      Waived
                    </button>
                    <button
                      type="button"
                      onclick="setActiveInGroup(this, 'bg-white shadow-sm text-gray-900 font-medium', 'text-gray-600', 'px-2 py-1 text-xs rounded-md transition-all duration-200'); updateCovenantActivityView('deleted')"
                      class="px-2 py-1 text-xs rounded-md transition-all duration-200 text-gray-600"
                    >
                      Deleted
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
                <button type="button" onclick="downloadCovenantSVG('table:covActivityTableBody','Covenant-Activity-Regional')" class="text-gray-400 hover:text-gray-700 transition-colors p-1" title="Download SVG">
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                </button>
              </div>
              <div class="px-5 pt-5 sm:px-6 sm:pt-6 pb-4 pr-12 shrink-0">
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



        <!-- Covenant Insights: Aging Severity by Region + Product Program -->
        <div class="grid grid-cols-12 gap-4 md:gap-6 mb-6 items-stretch">
          <div class="col-span-12 xl:col-span-6 flex">
            <div class="rounded-2xl border border-gray-200 bg-white w-full h-full min-h-[400px] flex flex-col relative" style="overflow: visible">
              <div class="absolute top-2 right-2 flex items-center gap-0.5 z-10">
                <button type="button" onclick="downloadCovenantSVG('agingByRegion','Aging-Severity-by-Region')" class="text-gray-400 hover:text-gray-700 transition-colors p-1" title="Download SVG">
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                </button>
              </div>
              <div class="border-b border-gray-200 px-5 sm:px-6 py-4 pr-12 shrink-0">
                <h3 class="text-base font-semibold text-gray-900">Aging Severity by Region</h3>
                <p class="text-sm font-medium text-gray-500 mt-1">Stacked aging profile — chart view (table is on the dashboard)</p>
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
                <button type="button" onclick="downloadCovenantSVG('productDonut','Covenants-by-Product-Program')" class="text-gray-400 hover:text-gray-700 transition-colors p-1" title="Download SVG">
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                </button>
              </div>
              <div class="border-b border-gray-200 px-5 sm:px-6 py-4 pr-12 shrink-0">
                <h3 class="text-base font-semibold text-gray-900">Covenants by Product Program</h3>
                <p class="text-sm font-medium text-gray-500 mt-1">Distribution across product programs</p>
              </div>
              <div
                id="covInsightProductHost"
                class="p-6 flex-1 flex items-center justify-center min-h-0"
                style="min-height:320px; overflow: visible; align-self: stretch"
              >
                <div id="covInsightProductInner" class="flex flex-row items-center justify-center gap-8 w-full">
                  <div class="flex-shrink-0">
                    <div id="covInsightProductDonutChart"></div>
                  </div>
                  <div class="flex-1 max-w-md">
                    <div id="covInsightProductList" class="space-y-3"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Covenant Details by Relationship & Underwriter -->
        <div id="covenantDetailsTableSection" class="rounded-2xl border border-gray-200 bg-white mb-6">
          <div class="px-5 sm:px-6 py-4 border-b border-gray-200">
            <div class="flex items-center justify-between gap-4">
              <div class="min-w-0 flex-1">
                <h3 class="text-lg font-semibold text-gray-800 truncate">Covenant Details by Relationship &amp; Underwriter</h3>
                <p class="text-sm font-medium text-gray-500 mt-1 truncate" id="covenantDetailsTableSubtitle">Comprehensive breakdown with aging buckets</p>
              </div>
              <div class="flex items-center justify-end gap-2 shrink-0 ml-auto">
                <div class="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 whitespace-nowrap">
                  <button
                    type="button"
                    id="covenantDetailsBtnPastDue"
                    onclick="setActiveInGroup(this, 'bg-white shadow-sm text-gray-900 font-medium', 'text-gray-600', 'px-2.5 py-1.5 text-xs rounded-md transition-all duration-200'); filterCovenantDetailsTable('pastDue')"
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
                <button type="button" onclick="downloadCovenantSVG('table:covenantDetailsTableBody','Covenant-Details')" class="text-gray-400 hover:text-gray-700 transition-colors p-1 shrink-0" title="Download SVG">
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                </button>
              </div>
            </div>
          </div>

          <div class="custom-scrollbar overflow-x-auto">
            <table class="min-w-full">
              <thead>
                <tr class="bg-gray-50" id="covenantDetailsTableHeader">
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
                  <td colspan="8" class="px-6 py-8 text-center text-sm text-gray-400">Loading covenant details...</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-5 sm:px-6 py-4 border-t border-gray-200 bg-gray-50">
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
`;

  // Bootstrap after HTML is in the DOM (works with covenants.js loaded before this file).
  // Wait briefly for CDN libs (ApexCharts / XLSX) if the macro loads them after these scripts.
  function startCovenants() {
    if (typeof window.bootstrapCovenantsPage === "function") {
      if (window.__covenantsBootstrapped) return;
      window.__covenantsBootstrapped = true;
      window.bootstrapCovenantsPage();
      return;
    }
    window.__covenantsHtmlReady = true;
  }

  function waitForLibs(attempts) {
    var ready =
      typeof window.ApexCharts !== "undefined" &&
      typeof window.XLSX !== "undefined";
    if (ready || attempts <= 0) {
      startCovenants();
      return;
    }
    setTimeout(function () {
      waitForLibs(attempts - 1);
    }, 50);
  }

  waitForLibs(60); // up to ~3s
})();
