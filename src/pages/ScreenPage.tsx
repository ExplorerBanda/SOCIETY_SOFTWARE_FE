import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { ArrowRight, Check, ChevronDown, Database, Filter, Layers3, List, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { screenPath, type LegacyScreen, type ScreenAction, type ScreenField, type ScreenGrid } from "../data/legacy";
import { useFeedback } from "../components/feedback";
import { slugLabel } from "./screenUtils";

export default function ScreenPage({ screen, titleOverride, crumbs, embedded = false }: { screen: LegacyScreen; titleOverride?: string; crumbs?: string[]; embedded?: boolean }) {
  const pageTitle = titleOverride || screen.title || slugLabel(screen.name);
  return (
    <div className="page-stack">
      {!embedded && <ScreenHeading screen={screen} title={pageTitle} crumbs={crumbs} />}
      <ScreenCanvas screen={screen} title={pageTitle} />
    </div>
  );
}

function ScreenHeading({ screen, title, crumbs }: { screen: LegacyScreen; title: string; crumbs?: string[] }) {
  return <div className="page-heading">
    <div className="breadcrumbs"><Link to="/app">Home</Link>{(crumbs ?? [screen.category, title]).map((crumb, index) => <span key={crumb + index}><ChevronDown size={12} />{crumb}</span>)}</div>
    <div className="heading-row"><div className="heading-icon"><Layers3 size={18} /></div><div><span className="eyebrow">{screen.category}</span><h1>{title}</h1></div></div>
  </div>;
}

function ScreenCanvas({ screen, title }: { screen: LegacyScreen; title: string }) {
  const navigate = useNavigate();
  const { notify, showDialog } = useFeedback();
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [activeTab, setActiveTab] = useState(screen.tabs[0]?.label ?? "");
  const [gridQuery, setGridQuery] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ column: string; direction: "asc" | "desc" } | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const fields = screen.fields.filter((field) => field.visibleByDefault !== false && (!field.tab || !activeTab || field.tab === activeTab));
  const conditionallyHidden = screen.fields.filter((field) => field.visibleByDefault === false);
  const fieldGroups = useMemo(() => {
    const groups = new Map<string, ScreenField[]>();
    for (const section of screen.sections) {
      groups.set(section.label, []);
    }
    for (const field of fields) {
      const key = field.section || "General information";
      groups.set(key, [...(groups.get(key) ?? []), field]);
    }
    return Array.from(groups.entries()).filter(([label, groupFields]) => groupFields.length > 0 || screen.sections.some(s => s.label === label));
  }, [fields, screen.sections]);

  const structuredSections = useMemo(() => {
    const result: Array<{ type: "single"; group: string; fields: ScreenField[] } | { type: "address-row"; sections: Array<{ group: string; fields: ScreenField[] }> }> = [];
    const isAddressSection = (label: string) => /postal address|permanent address|office address/i.test(label);
    
    let pendingAddressSections: Array<{ group: string; fields: ScreenField[] }> = [];

    for (const [group, groupFields] of fieldGroups) {
      if (isAddressSection(group)) {
        pendingAddressSections.push({ group, fields: groupFields });
      } else {
        if (pendingAddressSections.length > 0) {
          result.push({ type: "address-row", sections: pendingAddressSections });
          pendingAddressSections = [];
        }
        result.push({ type: "single", group, fields: groupFields });
      }
    }
    if (pendingAddressSections.length > 0) {
      result.push({ type: "address-row", sections: pendingAddressSections });
    }
    return result;
  }, [fieldGroups]);
  const hasFields = screen.fields.length > 0;
  const hasGrid = screen.grids.length > 0;
  const sourceActions = screen.actions;
  const reset = () => { setValues({}); setSubmitted(false); };
  const notifyUnavailable = (label: string) => notify(label + " is preview-only; nothing was saved or posted.", "warning");

  function actionClick(action: ScreenAction) {
    const label = (action.label || action.name || "").trim().toLowerCase();
    if (action.destinationScreenIds?.length === 1) {
      navigate(screenPath(action.destinationScreenIds[0]));
      return;
    }
    if (action.destinationScreenIds && action.destinationScreenIds.length > 1) {
      showDialog({ title: action.label || action.name, message: "This legacy action has multiple source-backed destinations. Open the matching recovered screen from the catalog.", confirmLabel: "Open screen catalog", onConfirm: () => navigate("/app/screens") });
      return;
    }
    if (/^(exit|close|back|quit|return)$/.test(label)) {
      navigate(-1);
      return;
    }
    if (/^(cancel|clear|reset)$/.test(label)) {
      reset();
      notify(action.label + " preview state cleared. No record was created.");
      return;
    }
    if (/^(new|add)$/.test(label)) {
      reset();
      notify(action.label + " form cleared for new record entry in preview mode.");
      return;
    }
    if (/search|find|list|view|refresh/.test(label)) {
      document.getElementById("legacy-grid-search")?.focus();
      setPage(1);
      notify("The local demo grid is ready for filtering. No database query was sent.");
      return;
    }
    if (/print|preview|export/.test(label)) {
      showDialog({ title: action.label + " preview", message: "This is a frontend-only preview. No report was generated, printed, or exported.", confirmLabel: "Close preview" });
      return;
    }
    if (/delete|reverse|close year|restore|detach|post|submit|approve|reject|save|update|execute|transfer|clear cheque/i.test(action.label)) {
      showDialog({ title: "Preview action: " + action.label, message: "The legacy action is represented here, but this preview has no backend. Confirming will not change records or financial data.", confirmLabel: "Acknowledge only" });
      return;
    }
    if (!action.handler) {
      notify("No click handler was recovered for this control.", "warning");
      return;
    }
    notifyUnavailable(action.label);
  }

  function submitForm(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    notify("Preview only. No data was saved or posted.", "warning");
  }

  return (
    <div className="screen-canvas">
      {screen.tabs.length > 0 && <div className="screen-tabs" role="tablist" aria-label={title + " sections"}>
        {screen.tabs.map((tab) => <button key={tab.field} role="tab" aria-selected={activeTab === tab.label} className={activeTab === tab.label ? "active" : ""} onClick={() => setActiveTab(tab.label)}>{tab.label}</button>)}
      </div>}

      <form className="screen-form" onSubmit={submitForm}>
        {hasFields ? <div className="form-groups">
          {structuredSections.map((item, idx) => {
            if (item.type === "address-row") {
              return (
                <div className="address-section-row" key={"address-row-" + idx}>
                  {item.sections.map(({ group, fields: groupFields }) => (
                    <section className="form-section address-section" key={group}>
                      <div className="form-section-title"><h2>{group}</h2><span>{groupFields.length} fields</span></div>
                      <div className="field-grid address-field-grid">
                        {groupFields.map((field) => <FieldControl key={field.name} field={field} value={values[field.name]} onChange={(value) => setValues((current) => ({ ...current, [field.name]: value }))} submitted={submitted} />)}
                      </div>
                    </section>
                  ))}
                </div>
              );
            }
            return (
              <section className="form-section" key={item.group}>
                <div className="form-section-title"><h2>{item.group}</h2><span>{item.fields.length} fields</span></div>
                {item.fields.length ? <div className="field-grid">{item.fields.map((field) => <FieldControl key={field.name} field={field} value={values[field.name]} onChange={(value) => setValues((current) => ({ ...current, [field.name]: value }))} submitted={submitted} />)}</div> : <p className="source-section-empty">Section container recovered; no editable fields could be assigned to it statically.</p>}
              </section>
            );
          })}
        </div> : <section className="content-card"><div className="callout warning"><Database size={16} /><span>No editable fields were recovered from this form’s source declaration. The original screen may populate dynamically or require additional decompilation review.</span></div></section>}
        {conditionallyHidden.length > 0 && <details className="conditional-controls"><summary>Controls hidden by default in source ({conditionallyHidden.length})</summary><div className="field-grid">{conditionallyHidden.map((field) => <FieldControl key={field.name} field={field} value={values[field.name]} onChange={(value) => setValues((current) => ({ ...current, [field.name]: value }))} submitted={submitted} />)}</div><small>Shown collapsed because the recovered form marks these controls hidden at initialization.</small></details>}

        {sourceActions.length > 0 && <div className="source-action-bar">
          <div className="action-label"><span>Form Actions</span></div>
          <div className="action-buttons">{sourceActions.map((action, index) => <button key={action.name + index} type="button" className={actionStyle(action.label)} onClick={() => actionClick(action)} title={action.handler ? action.handler : "No Click handler recovered"}>
            {action.label || action.name}{action.destinationScreenIds?.length ? <ArrowRight size={13} /> : null}
          </button>)}</div>
        </div>}

        {screen.grids.map((grid) => <DataGridPreview key={grid.name} grid={grid} query={gridQuery} setQuery={setGridQuery} page={page} setPage={setPage} sort={sort} setSort={setSort} selected={selected} setSelected={setSelected} />)}
        {!hasGrid && <div className="form-submit-row"><button type="submit" className="primary-button">Validate form inputs</button></div>}
      </form>
    </div>
  );
}

function actionStyle(label: string) {
  if (/delete|reverse|detach|restore|logout/i.test(label)) return "source-action danger";
  if (/save|submit|post|update|new|add|calculate|execute/i.test(label)) return "source-action primary";
  return "source-action";
}

function FieldControl({ field, value, onChange, submitted }: { field: ScreenField; value: string | boolean | undefined; onChange: (value: string | boolean) => void; submitted: boolean }) {
  const fieldId = "field-" + field.name.replace(/[^a-z0-9]/gi, "-");
  const item = field as ScreenField & { multiline?: boolean; maxLength?: number | null; readOnly?: boolean; visibleByDefault?: boolean };
  const note = field.required === true && submitted && !value ? "This value is required according to recovered validation." : "";
  let control: ReactNode;
  if (field.type === "select") {
    control = <select id={fieldId} value={typeof value === "string" ? value : ""} onChange={(e) => onChange(e.target.value)}><option value="">{field.options?.length ? "Choose an option" : "Options load from source data"}</option>{field.options?.map((option) => <option key={option}>{option}</option>)}</select>;
  } else if (field.type === "checkbox" || field.type === "radio") {
    control = <input id={fieldId} type={field.type} checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />;
  } else if (field.type === "textarea" || item.multiline) {
    control = <textarea id={fieldId} value={typeof value === "string" ? value : ""} onChange={(e) => onChange(e.target.value)} maxLength={item.maxLength ?? undefined} readOnly={item.readOnly} placeholder="Preview input" />;
  } else {
    const inputType = field.type === "date" ? "date" : field.type === "number" ? "number" : "text";
    control = <input id={fieldId} type={inputType} value={typeof value === "string" ? value : ""} onChange={(e) => onChange(e.target.value)} maxLength={item.maxLength ?? undefined} readOnly={item.readOnly} placeholder={field.type === "date" ? "" : "Preview input"} />;
  }
  const multiline = field.type === "textarea" || item.multiline;
  const isCheck = field.type === "checkbox" || field.type === "radio";
  const spanFull = multiline || (typeof item.maxLength === "number" && item.maxLength > 80);
  const controlClass = ["field-control", isCheck ? "check-field" : "", spanFull ? "span-full" : ""].filter(Boolean).join(" ");
  return <label className={controlClass} htmlFor={fieldId}>
    <span>{field.label}{field.required === true && <b className="required-mark"> *</b>}{field.required === null && <i className="unknown-required" title="Requiredness not determined from source">?</i>}</span>
    {control}
    {note && <small className="field-error">{note}</small>}
  </label>;
}

function DataGridPreview({ grid, query, setQuery, page, setPage, sort, setSort, selected, setSelected }: { grid: ScreenGrid; query: string; setQuery: (value: string) => void; page: number; setPage: (value: number) => void; sort: { column: string; direction: "asc" | "desc" } | null; setSort: (value: { column: string; direction: "asc" | "desc" } | null) => void; selected: number | null; setSelected: (value: number | null) => void }) {
  const columns = grid.columns;
  const rows = useMemo(() => columns.length ? Array.from({ length: 13 }, (_, index) => columns.map((column) => demoCell(column.label, index))) : [], [columns]);
  const filtered = rows.filter((row) => row.some((value) => value.toLowerCase().includes(query.toLowerCase())));
  const sorted = sort && columns.length ? [...filtered].sort((a, b) => a[columns.findIndex((col) => col.label === sort.column)].localeCompare(b[columns.findIndex((col) => col.label === sort.column)]) * (sort.direction === "asc" ? 1 : -1)) : filtered;
  const pageSize = 6;
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const visible = sorted.slice((page - 1) * pageSize, page * pageSize);
  return <section className="grid-preview-card">
    <div className="grid-title-row"><div><h2><List size={16} />{grid.name}</h2><p>Source-defined grid · synthetic rows only</p></div><span className="demo-pill">DEMO DATA</span></div>
    <div className="grid-toolbar"><label className="table-search"><Search size={14} /><input id="legacy-grid-search" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Filter synthetic rows" /></label><button type="button" className="table-filter" onClick={() => setQuery("")}><Filter size={14} />Reset filter</button></div>
    {columns.length ? <div className="table-scroll"><table><thead><tr>{columns.map((column) => <th key={column.name}><button type="button" onClick={() => setSort(sort?.column === column.label ? { column: column.label, direction: sort.direction === "asc" ? "desc" : "asc" } : { column: column.label, direction: "asc" })}>{column.label}<ChevronDown size={12} /></button></th>)}</tr></thead><tbody>{visible.map((row, index) => <tr key={(page - 1) * pageSize + index} className={selected === (page - 1) * pageSize + index ? "selected" : ""} onClick={() => setSelected((page - 1) * pageSize + index)}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table></div> :
      <div className="grid-unresolved"><Database size={18} /><strong>Grid columns depend on runtime source data</strong><span>Column metadata was not declared in the recovered form file. No data was loaded.</span></div>}
    <div className="grid-footer"><span>Development sample · no member or financial data</span><div className="pagination"><button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><span>{page} / {pageCount}</span><button type="button" disabled={page >= pageCount} onClick={() => setPage(page + 1)}>Next</button></div></div>
    {selected !== null && columns.length > 0 && <div className="selected-row-note"><Check size={13} />Synthetic row selected for UI interaction only.</div>}
  </section>;
}

function demoCell(label: string, index: number) {
  const lower = label.toLowerCase();
  if (/memno|member no|member number/.test(lower)) return "DEMO-" + String(index + 1).padStart(3, "0");
  if (/name/.test(lower)) return "Demo sample " + String.fromCharCode(65 + (index % 13));
  if (/date|wef|vdate|memdate/.test(lower)) return "01/01/2026";
  if (/status|active|closed/.test(lower)) return "Preview";
  if (/amount|balance|debit|credit|rate|interest/.test(lower)) return "Not loaded";
  return "Synthetic value";
}

export function actionCountLabel(actions: ScreenAction[]) {
  return actions.length + " source action" + (actions.length === 1 ? "" : "s");
}
