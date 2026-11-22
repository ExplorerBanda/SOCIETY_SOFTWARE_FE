import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  Activity, ArrowLeft, ArrowRight, Bell, BookOpen, BriefcaseBusiness, Calculator,
  CalendarCheck, CalendarClock, ChevronRight, CircleHelp, Command,
  Crown, FileBarChart, HandCoins, Inbox, Landmark, LayoutDashboard, LockKeyhole,
  LogOut, Menu, PanelRightClose, PiggyBank, PieChart, RefreshCw, Scale, Search,
  Send, ShieldCheck, Undo2, UserPlus, Wallet, X, ArrowDownLeft, ArrowUpRight, FilePlus2,
} from "lucide-react";
import {
  Link, Navigate, Outlet, Route, Routes, useLocation, useNavigate, useParams,
} from "react-router-dom";
import {
  actionPath, browsePath, findNodeByEntryId, loadScreen, loadScreens, navigation, navigationById, navigationEntries,
  screenPath, screenSummaries, screenSummariesById, type LegacyScreen, type NavigationEntry, type NavigationNode,
} from "./data/legacy";
import { FeedbackContext, useFeedback, type DialogRequest } from "./components/feedback";
import DashboardPage from "./pages/DashboardPage";
import ScreenCatalogPage from "./pages/ScreenCatalogPage";
import ScreenPage from "./pages/ScreenPage";
import { slugLabel } from "./pages/screenUtils";

interface FeedbackState {
  notify: (message: string, tone?: "info" | "warning" | "success") => void;
  showDialog: (request: DialogRequest) => void;
  closeDialog: () => void;
}

const prototypeTabs = [
  { label: "Society", group: "Society" },
  { label: "Register", group: "Deposit/Loan Registers" },
  { label: "Transaction", group: "Transaction" },
  { label: "Reports", group: "Reports" },
  { label: "Utilities", group: "Utilities" },
  { label: "Display", group: "Display" },
] as const;

const prototypeModuleGroups = [
  { label: "Member Services", items: [
    { label: "Membership Form", icon: UserPlus, entryId: "nav-quick-actions-other-shell-controls-membership-form-button1-click-button1" },
    { label: "Member's Balance", icon: Wallet, entryId: "nav-display-member-s-balance-membersbalancetoolstripmenuitem-click-membersbalancetoolstripmenuitem" },
    { label: "Member's Shares", icon: PieChart, entryId: "nav-quick-actions-other-shell-controls-member-s-shares-button3-click-1-button3" },
    { label: "Member Surety", icon: ShieldCheck, entryId: "nav-quick-actions-other-shell-controls-member-surety-membersurety-click-membersurety" },
  ] },
  { label: "Deposits & Loans", items: [
    { label: "Ordinary Deposit", icon: PiggyBank, entryId: "nav-quick-actions-other-shell-controls-ordinary-deposit-button6-click-1-button6" },
    { label: "Fixed Deposit", icon: LockKeyhole, entryId: "nav-deposit-loan-registers-fixed-deposites-fixeddepositestoolstripmenuitem-click-fixeddeposites" },
    { label: "Daily Deposit", icon: CalendarCheck, entryId: "nav-deposit-loan-registers-daily-deposites-dailydepositestoolstripmenuitem-click-dailydeposites" },
    { label: "Loan and Advances", icon: HandCoins, entryId: "nav-deposit-loan-registers-all-loans-loanandadvancestoolstripmenuitem-click-loanandadvances" },
    { label: "Ledger Account", icon: BookOpen, entryId: "nav-quick-actions-other-shell-controls-ledger-account-button9-click-button9" },
    { label: "Arbitration Cases", icon: Scale, entryId: "nav-transaction-arbitration-cases-arbitrationcasestoolstripmenuitem-click-arbitrationcases" },
  ] },
  { label: "Accounting & Vouchers", items: [
    { label: "Receipt Entry", icon: ArrowDownLeft, entryId: "nav-transaction-receipt-entry-cash-upi-cheque-recieptentrytoolstripmenuitem-click-receiptentrycash" },
    { label: "Payment Entry", icon: ArrowUpRight, entryId: "nav-transaction-payment-entry-paymententrytoolstripmenuitem-click-paymententry" },
    { label: "Voucher Entry", icon: FilePlus2, entryId: "nav-transaction-voucher-entry-voucherentrytoolstripmenuitem-click-voucherentry" },
    { label: "Reverse Voucher", icon: Undo2, entryId: "nav-quick-actions-other-shell-controls-reverse-voucher-button19-click-button19" },
    { label: "Repayment Schedule", icon: CalendarClock, entryId: "nav-quick-actions-other-shell-controls-repayment-schedule-button16-click-button16" },
  ] },
  { label: "Correspondence & Sync", items: [
    { label: "Dispatch Letter", icon: Send, entryId: "nav-quick-actions-other-shell-controls-dispatch-letter-ddform-click-ddform" },
    { label: "Received Letter", icon: Inbox, entryId: "nav-quick-actions-other-shell-controls-received-letter-inmaster-click-inmaster" },
  ] },
];

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/app" element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="screens" element={<ScreenCatalogPage />} />
        <Route path="screens/:id" element={<ScreenRoute />} />
        <Route path="actions/:id" element={<ActionRoute />} />
        <Route path="browse/:id" element={<BrowseRoute />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  function submit(event: FormEvent) {
    event.preventDefault();
    navigate("/app", { replace: true });
  }
  return (
    <main className="login-page">
      <div className="login-brand">
        <div className="brand-mark"><Landmark size={23} /></div>
        <div><strong>EasyBook</strong><span>Cooperative Society Suite</span></div>
      </div>
      <section className="login-card">
        <div className="login-heading">
          <span className="eyebrow">Frontend preview</span>
          <h1>Welcome back</h1>
          <p>Review the recovered EasyBook screen structure in a safe demo workspace.</p>
        </div>
        <form onSubmit={submit} className="login-form">
          <label>User name<input autoComplete="off" placeholder="Preview only" /></label>
          <label>Password<input autoComplete="new-password" type={showPassword ? "text" : "password"} placeholder="Not sent anywhere" /></label>
          <button className="show-password" type="button" onClick={() => setShowPassword((v) => !v)}>{showPassword ? "Hide" : "Show"} password</button>
          <div className="form-row">
            <label>Transaction date<input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
            <label>Financial year<select defaultValue=""><option value="">Choose preview year</option><option>Preview year A</option><option>Preview year B</option></select></label>
          </div>
          <label>Branch (optional)<select defaultValue=""><option value="">Not selected</option><option>Demo branch</option></select></label>
          <button type="submit" className="primary-button login-submit">Open frontend preview <ArrowRight size={16} /></button>
        </form>
        <div className="preview-note"><ShieldCheck size={16} /><span>This preview does not authenticate, connect to a database, or save the entered values.</span></div>
      </section>
      <footer className="login-footer"><span>EasyBook · UI parity workspace</span><span>Development demo · no society data</span></footer>
    </main>
  );
}

function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeGroup, setActiveGroup] = useState(navigation.topLevel[0] ?? "Society");
  const [query, setQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: "info" | "warning" | "success" } | null>(null);
  const [dialog, setDialog] = useState<DialogRequest | null>(null);

  const feedback = useMemo<FeedbackState>(() => ({
    notify: (message, tone = "info") => {
      setToast({ message, tone });
      window.setTimeout(() => setToast(null), 3600);
    },
    showDialog: (request) => setDialog(request),
    closeDialog: () => setDialog(null),
  }), []);

  const activeEntryId = location.pathname.match(/\/app\/(?:actions|browse)\/([^/]+)/)?.[1];
  const activeEntry = activeEntryId ? navigationById.get(activeEntryId) : undefined;
  const activeScreenId = location.pathname.match(/\/app\/screens\/([^/]+)/)?.[1];
  const activeScreen = activeScreenId ? screenSummariesById.get(activeScreenId) : undefined;

  useEffect(() => {
    if (activeEntry?.group && navigation.topLevel.includes(activeEntry.group)) setActiveGroup(activeEntry.group);
    else if (activeScreen?.category) {
      const categoryEntry = navigationEntries.find((e) => e.kind === "action" && e.destinationScreenIds.includes(activeScreen.id));
      if (categoryEntry && navigation.topLevel.includes(categoryEntry.group)) setActiveGroup(categoryEntry.group);
    }
  }, [activeEntry, activeScreen, location.pathname]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        setShowSearch(true);
      }
      if (event.key === "Escape") setShowSearch(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const matches = query.trim()
    ? [
        ...navigationEntries.filter((e) => e.label.toLowerCase().includes(query.toLowerCase())).slice(0, 6).map((e) => ({ label: e.label, group: e.group, path: e.kind === "group" ? browsePath(e.id) : actionPath(e.id), id: e.id })),
        ...screenSummaries.filter((s) => (s.name + " " + s.title).toLowerCase().includes(query.toLowerCase())).slice(0, 5).map((s) => ({ label: s.title || slugLabel(s.name), group: s.category, path: screenPath(s.id), id: s.id })),
      ]
    : [];

  function chooseGroup(group: string) {
    setActiveGroup(group);
    const node = navigation.tree.find((n) => n.label === group);
    if (node?.entryId) navigate(browsePath(node.entryId));
  }

  function signOut() {
    setDialog({
      title: "Leave the preview?",
      message: "This exits the frontend preview only. No login session or data is stored.",
      confirmLabel: "Return to preview login",
      onConfirm: () => navigate("/login"),
    });
  }

  return (
    <FeedbackContext.Provider value={feedback}>
      <div className="app-shell">
        <header className="topbar">
          <div className="brand-lockup">
            <button className="icon-button mobile-only" aria-label="Open modules" onClick={() => setLeftOpen(true)}><Menu size={19} /></button>
            <Link to="/app" className="brand-link">
              <span className="brand-mark small"><Crown size={17} /></span>
              <span className="brand-copy"><strong>EasyBook <em>v1.0.0</em></strong><small>Crown Software</small></span>
            </Link>
          </div>
          <nav className="primary-tabs" aria-label="Primary top navigation">
            {prototypeTabs.map((tab) => (
              <button key={tab.label} className={activeGroup === tab.group ? "primary-tab active" : "primary-tab"} onClick={() => chooseGroup(tab.group)}>{tab.label}</button>
            ))}
          </nav>
          <div className="topbar-actions">
            <div className="global-search">
              <Search size={15} />
              <input ref={inputRef} value={query} onFocus={() => setShowSearch(true)} onChange={(e) => setQuery(e.target.value)} placeholder="Quick search modules..." />
              <kbd><Command size={10} /> K</kbd>
              {showSearch && query && <div className="search-popover">
                {matches.length ? matches.map((item) => <Link key={item.id + item.path} to={item.path} onClick={() => { setShowSearch(false); setQuery(""); }}><span>{item.label}</span><small>{item.group}</small></Link>) : <p>No matching source feature.</p>}
              </div>}
            </div>
            <span className="branch-status" title="Synthetic preview workspace"><i />Main Branch <b /> FY 2026–27</span>
            <span className="demo-status" title="Frontend preview only"><i />Preview</span>
            <button className="icon-button" aria-label="Open utilities" title="Calculators and helpers" onClick={() => setRightOpen(true)}><Calculator size={18} /></button>
            <button className="icon-button" aria-label="Notifications" title="Notifications" onClick={() => feedback.notify("There are no connected notifications in this preview.")}><Bell size={17} /></button>
          </div>
        </header>
        {showSearch && query && <button className="search-dismiss" aria-label="Close search results" onClick={() => setShowSearch(false)} />}
        <div className="mobile-tabs">
          {prototypeTabs.map((tab) => <button key={tab.label} className={activeGroup === tab.group ? "active" : ""} onClick={() => chooseGroup(tab.group)}>{tab.label}</button>)}
        </div>
        <div className="workspace-grid">
          <button className={leftOpen ? "drawer-backdrop visible" : "drawer-backdrop"} aria-label="Close navigation" onClick={() => setLeftOpen(false)} />
          <aside className={leftOpen ? "sidebar left-drawer open" : "sidebar left-drawer"}>
            <div className="sidebar-heading">
              <div><span className="eyebrow">EasyBook modules</span><h2>Society Modules</h2></div>
              <button className="icon-button mobile-only" aria-label="Close modules" onClick={() => setLeftOpen(false)}><X size={17} /></button>
            </div>
            <div className="menu-tree">
              {prototypeModuleGroups.map((group) => <section className="prototype-nav-group" key={group.label}>
                <div className="prototype-nav-heading">{group.label}</div>
                {group.items.map((item) => {
                  const entry = navigationById.get(item.entryId);
                  const Icon = item.icon;
                  const active = activeEntryId === item.entryId || Boolean(activeScreenId && entry?.destinationScreenIds.includes(activeScreenId));
                  return <Link key={item.entryId} to={entry ? actionPath(entry.id) : "/app/screens"} onClick={() => setLeftOpen(false)} title={item.label} className={active ? "prototype-nav-item active" : "prototype-nav-item"}>
                    <Icon size={15} /><span>{item.label}</span>
                  </Link>;
                })}
              </section>)}
            </div>
            <div className="sidebar-bottom">
              <Link to={actionPath("nav-quick-actions-other-shell-controls-refresh-balance-refreshbalance-click-refreshbalance")} onClick={() => setLeftOpen(false)}><RefreshCw size={15} /><span>Refresh Balance</span></Link>
              <Link to="/app/screens" onClick={() => setLeftOpen(false)}><LayoutDashboard size={16} /><span>Screen inventory · dev</span><b>{screenSummaries.length}</b></Link>
              <button onClick={signOut}><LogOut size={16} /><span>Exit preview</span></button>
            </div>
          </aside>

          <main className="main-workspace">
            <Outlet />
          </main>

          <UtilityPanel open={rightOpen} onClose={() => setRightOpen(false)} />
        </div>
        {toast && <div className={"toast " + toast.tone}><Activity size={16} /><span>{toast.message}</span><button onClick={() => setToast(null)} aria-label="Dismiss"><X size={14} /></button></div>}
        {dialog && <DialogHost request={dialog} onCancel={() => setDialog(null)} />}
      </div>
    </FeedbackContext.Provider>
  );
}

const calculatorNames = ["Calculator", "RD Calculator", "FD Calculator", "Rate Calculator", "EMI Calculator", "RMI Calculator", "Date Diff."];
const calculatorScreen: Record<string, string> = {
  "FD Calculator": "fdcalc",
  "EMI Calculator": "emiform",
  "Date Diff.": "datediff",
  "RMI Calculator": "mdcalc",
};
const calculatorInputs: Record<string, string[]> = {
  "RD Calculator": ["Monthly installment", "Rate (% p.a.)", "Months"],
  "FD Calculator": ["Deposit principal", "Rate (% p.a.)", "Tenure (months)"],
  "Rate Calculator": ["Principal", "Maturity amount", "Duration (years)"],
  "EMI Calculator": ["Loan principal", "Interest (% p.a.)", "Months"],
  "RMI Calculator": ["Loan principal", "Interest (% p.a.)", "Months"],
  "Date Diff.": ["Start / value date", "Maturity / end date"],
};

function UtilityPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [active, setActive] = useState<string | null>(null);
  const { notify } = useFeedback();
  const target = active ? screenSummariesById.get(calculatorScreen[active] ?? "") : undefined;
  return (
    <>
      <button className={open ? "drawer-backdrop visible utility-backdrop" : "drawer-backdrop utility-backdrop"} aria-label="Close utilities" onClick={onClose} />
      <aside className={open ? "utility-panel right-drawer open" : "utility-panel right-drawer"}>
        <div className="utility-header"><div><span className="eyebrow">Quick desk</span><h2>Utilities</h2></div><button className="icon-button" aria-label="Close utilities" onClick={onClose}><PanelRightClose size={17} /></button></div>
        <div className="utility-brand"><div className="globe-mark"><Landmark size={21} /></div><div><strong>EasyBook</strong><small>Cooperative society</small></div></div>
        <div className="utility-section-head"><span>Calculators & helpers</span><b>7</b></div>
        <div className="calculator-list">
          {calculatorNames.map((name, index) => <button key={name} className={active === name ? "calculator-link active" : "calculator-link"} onClick={() => setActive(active === name ? null : name)}>
            <span className={"calc-icon icon-tone-" + index}><Calculator size={15} /></span><span>{name}</span><ChevronRight size={14} />
          </button>)}
        </div>
        {active && <div className="calculator-widget">
          <div className="widget-title"><strong>{active}</strong><button className="icon-button" aria-label="Close calculator preview" onClick={() => setActive(null)}><X size={14} /></button></div>
          {target ? <div className="widget-source"><span>Related recovered form</span><Link to={screenPath(target.id)}>{target.name} <ArrowRight size={13} /></Link></div> : <p className="muted-small">Calculator layout is shown for navigation parity. Calculation is not enabled in this frontend preview.</p>}
          {active === "Calculator" ? <div className="mini-keypad">{["C","(",")","÷","7","8","9","×","4","5","6","−","1","2","3","+","0",".","="].map((key) => <button key={key} onClick={() => notify("Calculator operations are disabled in this preview.", "warning")}>{key}</button>)}</div> :
            <div className="widget-fields">
              {(calculatorInputs[active] ?? []).map((label) => <label key={label}>{label}<input type={active.includes("Date") ? "date" : "number"} placeholder="Preview input" /></label>)}
              <button className="secondary-button full-width" onClick={() => notify("No financial or date calculation was run.", "warning")}>Calculate · disabled</button>
            </div>}
        </div>}
        <div className="utility-note"><CircleHelp size={15} /><span>All actions are preview-only. Nothing is posted, calculated, printed or exported.</span></div>
      </aside>
    </>
  );
}

function ScreenRoute() {
  const { id = "" } = useParams();
  const [screen, setScreen] = useState<LegacyScreen>();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    setLoading(true);
    loadScreen(id).then((value) => { if (active) { setScreen(value); setLoading(false); } });
    return () => { active = false; };
  }, [id]);
  if (loading) return <div className="content-card"><p>Loading recovered screen metadata…</p></div>;
  return screen ? <ScreenPage screen={screen} /> : <MissingPage title="Screen not found" />;
}

function ActionRoute() {
  const { id = "" } = useParams();
  const entry = navigationById.get(id);
  if (!entry) return <MissingPage title="Navigation entry not found" />;
  if (entry.kind === "group") {
    const node = findNodeByEntryId(navigation.tree, id);
    return <BrowsePage entry={entry} children={node?.children ?? []} />;
  }
  const { targetScreens, loading } = useLoadedScreens(entry.destinationScreenIds);
  return <ActionPage entry={entry} targetScreens={targetScreens} loading={loading} />;
}

function useLoadedScreens(ids: string[]) {
  const key = ids.join("|");
  const [result, setResult] = useState<{ key: string; targetScreens: LegacyScreen[]; loading: boolean }>({ key: "", targetScreens: [], loading: false });
  useEffect(() => {
    let active = true;
    if (!key) { setResult({ key, targetScreens: [], loading: false }); return () => { active = false; }; }
    setResult({ key, targetScreens: [], loading: true });
    loadScreens(ids).then((targetScreens) => { if (active) setResult({ key, targetScreens, loading: false }); });
    return () => { active = false; };
  }, [key]);
  return result.key === key ? result : { key, targetScreens: [], loading: Boolean(key) };
}

function BrowseRoute() {
  const { id = "" } = useParams();
  const entry = navigationById.get(id);
  if (!entry) return <MissingPage title="Menu group not found" />;
  const node = findNodeByEntryId(navigation.tree, id);
  return <BrowsePage entry={entry} children={node?.children ?? []} />;
}

function BrowsePage({ entry, children }: { entry: NavigationEntry; children: NavigationNode[] }) {
  const crumbs = entry.menuPath;
  return (
    <div className="page-stack">
      <PageHeading title={entry.label} subtitle="Recovered menu group" crumbs={crumbs} icon={<BookOpen size={18} />} />
      <section className="content-card">
        <div className="section-title"><div><h2>Features in this section</h2><p>Items and destinations recovered from MainForm menu wiring.</p></div><span className="chip">{children.length} entries</span></div>
        {children.length ? <div className="destination-grid">{children.map((node) => <NodeCard key={node.field} node={node} />)}</div> : <EmptyState title="No child entries found" text="The recovered source does not list children for this menu group." />}
      </section>
    </div>
  );
}

function NodeCard({ node }: { node: NavigationNode }) {
  const entry = node.entryId ? navigationById.get(node.entryId) : undefined;
  const path = entry ? (entry.kind === "group" ? browsePath(entry.id) : actionPath(entry.id)) : "/app/screens";
  const destinationCount = entry?.destinationScreenIds.length ?? 0;
  return <Link to={path} className="destination-card">
    <span className="destination-icon">{node.children.length ? <BookOpen size={17} /> : <FileBarChart size={17} />}</span>
    <span className="destination-copy"><strong>{node.label}</strong><small>{node.children.length ? node.children.length + " submenu entries" : destinationCount ? "Opens " + destinationCount + " recovered screen(s)" : "Source action · preview only"}</small></span>
    <ArrowRight size={15} />
  </Link>;
}

function ActionPage({ entry, targetScreens, loading }: { entry: NavigationEntry; targetScreens: LegacyScreen[]; loading: boolean }) {
  const crumbs = entry.menuPath;
  return (
    <div className="page-stack">
      <PageHeading title={entry.label} subtitle="Legacy navigation action" crumbs={crumbs} icon={<BriefcaseBusiness size={18} />} />
      {loading ? <section className="content-card"><p>Loading source-backed destination…</p></section> : targetScreens.length === 1 ? <ScreenPage screen={targetScreens[0]} titleOverride={entry.label} crumbs={crumbs} embedded /> :
       targetScreens.length > 1 ? <section className="content-card"><div className="section-title"><div><h2>Source destinations</h2><p>This handler can open more than one recovered screen.</p></div></div><div className="destination-grid">{targetScreens.map((screen) => <Link key={screen.id} to={screenPath(screen.id)} className="destination-card"><span className="destination-icon"><BookOpen size={17} /></span><span className="destination-copy"><strong>{screen.title || slugLabel(screen.name)}</strong><small>{screen.name}</small></span><ArrowRight size={15} /></Link>)}</div></section> :
       <section className="content-card source-action-card">
         <div className="action-status"><FileBarChart size={19} /><div><strong>Source action identified</strong><p>The handler exists, but no direct WinForms destination was found during static extraction.</p></div></div>
         {entry.reportTargets?.length ? <p>Report classes referenced: {entry.reportTargets.join(", ")}</p> : <p>No report class or form destination was captured. The underlying helper path must be traced before adding speculative fields or buttons.</p>}
         <div className="source-code-note"><span>Handler</span><code>{entry.handler ?? "Submenu group"}</code><span>Source</span><code>{entry.source}:{entry.line}</code></div>
         <div className="callout warning"><CircleHelp size={16} /><span>This route is reachable and traceable. Its screen-level UI is marked unverified in the feature matrix.</span></div>
       </section>}
    </div>
  );
}

function PageHeading({ title, subtitle, crumbs, icon }: { title: string; subtitle?: string; crumbs?: string[]; icon?: ReactNode }) {
  const navigate = useNavigate();
  return <div className="page-heading">
    <div className="breadcrumbs"><Link to="/app">Home</Link>{(crumbs ?? []).map((crumb, index) => <span key={crumb + index}><ChevronRight size={12} />{crumb}</span>)}</div>
    <div className="heading-row"><div className="heading-icon">{icon ?? <LayoutDashboard size={18} />}</div><div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div><button className="secondary-button heading-back" onClick={() => navigate(-1)}><ArrowLeft size={14} />Back</button></div>
  </div>;
}

function MissingPage({ title }: { title: string }) {
  return <div className="page-stack"><PageHeading title={title} subtitle="This route is not present in the recovered feature map."/><Link className="primary-button" to="/app/screens">Open recovered screen catalog</Link></div>;
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return <div className="empty-state"><div className="empty-icon"><Search size={20} /></div><strong>{title}</strong><p>{text}</p></div>;
}

function DialogHost({ request, onCancel }: { request: DialogRequest; onCancel: () => void }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
    <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-icon"><ShieldCheck size={19} /></div><button className="modal-close" aria-label="Close" onClick={onCancel}><X size={16} /></button>
      <h2 id="modal-title">{request.title}</h2><p>{request.message}</p>
      <div className="modal-actions"><button className="secondary-button" onClick={onCancel}>Cancel</button><button className="primary-button" onClick={() => { request.onConfirm?.(); onCancel(); }}>{request.confirmLabel ?? "Acknowledge"}</button></div>
    </section>
  </div>;
}

export default App;
