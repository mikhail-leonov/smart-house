          function generateConfigSection(location, floor) {
            let elements = document.querySelectorAll(`div[data-location="${location}"][data-floor="${floor}"]`);
            let section = {};
            elements.forEach(el => {
              sectionName = el.getAttribute('data-room');
              if (!section[sectionName]) { section[sectionName] = {}; }
              Object.assign(section[sectionName], generateSectionVariables(el) );
            });
            return section;
          }

          function generateConfig() {
            let config = {};
            config.home = {};
            config.home.inside = {};
            config.home.inside.house = {};
            config.home.inside.first_floor = generateConfigSection("inside", "first_floor");
            config.home.inside.second_floor = generateConfigSection("inside", "second_floor");
            config.home.outside = {};
            config.home.outside.first_floor = generateConfigSection("outside", "first_floor");
            const configText = document.getElementById('config_text');
            configText.innerText = formatJSON(config);
          }

          function formatJSON(obj, indentLevel = 0) {
            const indent = '  '.repeat(indentLevel);

            function isLeafObject(o) {
              return typeof o === 'object' && o !== null && !Array.isArray(o) && Object.values(o).every(val => typeof val !== 'object' || val === null || Array.isArray(val));
            }
            if (Array.isArray(obj)) {
              const items = obj.map(item => formatJSON(item, indentLevel + 1));
              return `[\n${items.map(i => indent + '  ' + i).join(',\n')}\n${indent}]`;
            } else if (typeof obj === 'object' && obj !== null) {
              if (isLeafObject(obj)) {
                const inline = Object.entries(obj).map(
                  ([k, v]) => `"${k}": ${JSON.stringify(v)}`).join(', ');
                return `{ ${inline} }`;
              } else {
                const entries = Object.entries(obj).map(
                  ([k, v]) => `${indent}  "${k}": ${formatJSON(v, indentLevel + 1)}`);
                return `{\n${entries.join(',\n')}\n${indent}}`;
              }
            } else {
              return JSON.stringify(obj);
            }
          }

          function generateSectionVariables(element) {
            let result = {};
            let contentNodes = element.querySelectorAll('div#content');
            if (contentNodes) {
              contentNodes.forEach(div => {
                Array.from(div.children).forEach(child => {
                  if (child.id) {
                    result[child.id] = getSettingsObject(child);
                  }
                });
              });
            }
            return result;
          }

          function convertStringsToNumbers(arr) {
            return arr.map(item => {
              if (typeof item === 'string') {
                // Try to convert string to number
                const num = Number(item);
                // Check if conversion is successful and not NaN
                if (!isNaN(num)) {
                  return num;
                }
              }
              // Otherwise return original item
              return item;
            });
          }

          function getSettingsObject(el) {
            let result = {
              value: "",
              description: "",
              min_value: "",
              max_value: ""
            };
            childType = el.getAttribute('data-type');
            if (childType) {
              if (childType === "1") {
                let min = el.getAttribute('data-min');
                let max = el.getAttribute('data-max');
                if (min) {
                  if (max) {
                    min = Number(min);
                    max = Number(max);
                    let value = Math.round(Math.random() * (max - min) + min);
                    let descr = "";
                    if (el.getAttribute('data-descr')) {
                      descr = el.getAttribute('data-descr');
                    }
                    result = {
                      value: value,
                      description: descr,
                      min_value: min,
                      max_value: max
                    };
                  }
                }
              }
              if (childType === "2") {
                let values = el.getAttribute('data-values');
                if (!values) {
                  values = [0, 1];
                } else {
                  values = values.split(",").map(s => s.trim());
                  values = convertStringsToNumbers(values);
                }
                let value = values[Math.floor(Math.random() * values.length)];
                let descr = "";
                if (el.getAttribute('data-descr')) {
                  descr = el.getAttribute('data-descr');
                }
                result = {
                  value: value,
                  description: descr,
                  values: values
                };
              }
            }
            return result;
          }

          function selectTextAndCopy(elementId) {
            const element = document.getElementById(elementId);
            if (!element) return;
            const range = document.createRange();
            range.selectNodeContents(element);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            try {
              document.execCommand('copy');
              alert('Copied to clipboard!');
            } catch (err) {
              alert('Failed to copy text.');
            }
            selection.removeAllRanges();
          }
