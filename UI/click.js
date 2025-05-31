/**
 * SmartHub - AI powered Smart Home
 * Browser click on room handler
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.6.4
 * @license MIT
 */

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });
    document.getElementById(sectionId).style.display = 'block';
}

function entryClicked(roomDiv) {
    const titleLabel = "dataModalLabel";
    const titleElem = document.getElementById(titleLabel);

    const l = roomDiv.getAttribute('data-location');
    const f = roomDiv.getAttribute('data-floor');
    const r = roomDiv.getAttribute('data-room');
    titleElem.innerText = `home/${l}/${f}/${r}`;

    const contentDiv = roomDiv.querySelector('#content');
    if (!contentDiv) {
        titleElem.innerText = "No content found!";
        return;
    }

    const nestedDivs = Array.from(contentDiv.querySelectorAll('div[id]'));
    if (nestedDivs.length === 0) {
        titleElem.innerText = "No variables found!";
        return;
    }

    const modalContent = document.getElementById('modalContent');

    // Group by data-tab attribute
    const tabGroups = {};
    nestedDivs.forEach(div => {
        const tab = div.getAttribute('data-tab') || '0'; // fallback to "0" if not present
        if (!tabGroups[tab]) { tabGroups[tab] = []; }
        tabGroups[tab].push(div);
    });

    const tabKeys = Object.keys(tabGroups);

    if (tabKeys.length <= 1) {
        // Only one tab — render as plain table
        const group = tabGroups[tabKeys[0]];
        let tableRows = '';
        group.forEach(div => {
            const id = div.id;
            let payload = { value: "", type: "", timestamp: "" };
            const value = div.getAttribute('data-value');
            if (value) {
                try {
                    payload = JSON.parse(value);
                } catch (e) {
                    payload.value = value;
                }
            }

            let valueText = String(payload.value ?? "");

            if (payload.type?.toLowerCase() === "random") {
                valueText = `<b style="color: #d3d3d3;">${valueText}</b>`;
            }
            if (payload.type?.toLowerCase() === "web") {
                valueText = `<b class="text-success">${valueText}</b>`;
            }
            if (payload.type?.toLowerCase() === "sensor") {
                valueText = `<b class="text-primary">${valueText}</b>`;
            }

            //if (valueText !== "") {
                tableRows += `<tr><td>${id}</td><td>${valueText}</td></tr>`;
            //}
        });

        modalContent.innerHTML = `
      <table class="table table-sm mt-3">
        <tbody>${tableRows}</tbody>
      </table>
    `;
    } else {
        // Render with tabs based on data-tab values
        let tabsNav = `<ul class="nav nav-tabs" id="entryTabs" role="tablist">`;
        let tabsContent = `<div class="tab-content" id="entryTabsContent">`;

        tabKeys.forEach((tabKey, i) => {
            const tabId = `tab${tabKey}`;
            const activeClass = i === 0 ? 'active' : '';
            const selected = i === 0 ? 'true' : 'false';

            tabsNav += `
        <li class="nav-item" role="presentation">
          <button class="nav-link ${activeClass}" id="${tabId}-tab" data-bs-toggle="tab" data-bs-target="#${tabId}" type="button" role="tab" aria-controls="${tabId}" aria-selected="${selected}">
            Tab ${tabKey}
          </button>
        </li>
      `;

            let tableRows = '';
            tabGroups[tabKey].forEach(div => {
                const id = div.id;
                let payload = {
                    value: "",
                    type: "",
                    timestamp: ""
                };
                const value = div.getAttribute('data-value');
                if (value) {
                    try {
                        payload = JSON.parse(value);
                    } catch (e) {
                        payload.value = value;
                    }
                }

                let valueText = String(payload.value ?? "");

                if (payload.type?.toLowerCase() === "random") {
                    valueText = `<b style="color: #d3d3d3;">${valueText}</b>`;
                }
                if (payload.type?.toLowerCase() === "web") {
                    valueText = `<b class="text-success">${valueText}</b>`;
                }
                if (payload.type?.toLowerCase() === "sensor") {
                    valueText = `<b class="text-primary">${valueText}</b>`;
                }

                if (valueText !== "") {
                    tableRows += `<tr><td>${id}</td><td>${valueText}</td></tr>`;
                }
            });

            tabsContent += `
        <div class="tab-pane fade ${activeClass ? 'show active' : ''}" id="${tabId}" role="tabpanel" aria-labelledby="${tabId}-tab">
          <table class="table table-sm mt-3">
            <tbody>${tableRows}</tbody>
          </table>
        </div>
      `;
        });

        tabsNav += `</ul>`;
        tabsContent += `</div>`;

        modalContent.innerHTML = tabsNav + tabsContent;
    }

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('dataModal'));
    modal.show();
}