const fs = require('node:fs');
const path = 'outputs/clingo-platform/apps/provider/components/provider-service-config-page.tsx';
let source = fs.readFileSync(path, 'utf8');
const needle = '<h2 id="add-on-title">Dodaj usługę dodatkową</h2>';
const picker = '<label className="settings-live-field"><span>Wybierz usługę</span><select aria-label="Wybierz usługę dodatkową" value={addOnTemplate} onChange={event => { const id = event.target.value; setAddOnTemplate(id); const template = availableAddOns.find(row => row.id === id); setNewAddOn(template ? { title: template.title, price: minorInput(template.priceMinor), billingUnit: template.billingUnit } : { title: "", price: "", billingUnit: "piece" }); }}><option value="">Własna usługa</option>{availableAddOns.map(row => <option value={row.id} key={row.id}>{row.title}</option>)}</select></label>';
if (!source.includes(needle)) throw Error('Missing add-on dialog');
source = source.replace(needle, needle + picker);
const start = source.indexOf('    if (draft.areaTiers.some');
const end = source.indexOf('\n', start);
if (start < 0) throw Error('Missing tier validator');
source = source.slice(0, start) + '    if (draft.areaTiers.length > 12 || draft.areaTiers.some((tier, index) => !Number.isSafeInteger(tier.minSquareMeters) || !Number.isSafeInteger(tier.workers) || tier.minSquareMeters < 1 || tier.minSquareMeters > 10000 || tier.workers < 1 || tier.workers > 50 || (tier.maxSquareMeters !== null && (!Number.isSafeInteger(tier.maxSquareMeters) || tier.maxSquareMeters < tier.minSquareMeters || tier.maxSquareMeters > 10000)) || (index > 0 && tier.minSquareMeters !== (draft.areaTiers[index - 1].maxSquareMeters ?? -2) + 1))) { setError("Sprawdź ciągłość przedziałów powierzchni i liczbę pracowników."); return null; }' + source.slice(end);
fs.writeFileSync(path, source);

