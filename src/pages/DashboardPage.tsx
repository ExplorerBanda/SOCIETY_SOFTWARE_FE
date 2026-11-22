import { ArrowDownLeft, ArrowRight, ArrowUpRight, BookOpen, CalendarClock, Landmark, LockKeyhole, PieChart, ShieldCheck, Users, WalletCards } from "lucide-react";
import { Link } from "react-router-dom";
import { actionPath, navigationById } from "../data/legacy";

const destinations = {
  member: "nav-quick-actions-other-shell-controls-membership-form-button1-click-button1",
  balance: "nav-display-member-s-balance-membersbalancetoolstripmenuitem-click-membersbalancetoolstripmenuitem",
  shares: "nav-quick-actions-other-shell-controls-member-s-shares-button3-click-1-button3",
  ordinary: "nav-quick-actions-other-shell-controls-ordinary-deposit-button6-click-1-button6",
  fixed: "nav-deposit-loan-registers-fixed-deposites-fixeddepositestoolstripmenuitem-click-fixeddeposites",
  daily: "nav-deposit-loan-registers-daily-deposites-dailydepositestoolstripmenuitem-click-dailydeposites",
  receipt: "nav-transaction-receipt-entry-cash-upi-cheque-recieptentrytoolstripmenuitem-click-receiptentrycash",
  payment: "nav-transaction-payment-entry-paymententrytoolstripmenuitem-click-paymententry",
  voucher: "nav-transaction-voucher-entry-voucherentrytoolstripmenuitem-click-voucherentry",
  repayment: "nav-quick-actions-other-shell-controls-repayment-schedule-button16-click-button16",
};

const quickActions = [
  { label: "Membership Form", icon: Users, target: destinations.member },
  { label: "Fixed Deposit", icon: LockKeyhole, target: destinations.fixed },
  { label: "Daily Deposit", icon: WalletCards, target: destinations.daily },
  { label: "Receipt Entry", icon: ArrowDownLeft, target: destinations.receipt },
  { label: "Payment Entry", icon: ArrowUpRight, target: destinations.payment },
  { label: "Repayment Schedule", icon: CalendarClock, target: destinations.repayment },
];

const voucherRows = [
  { id: "VCH-2026-8841", member: "Demo member M-1042", type: "Receipt Entry", account: "Fixed Deposit", amount: "₹2,50,000.00", status: "Posted" },
  { id: "VCH-2026-8840", member: "Demo member M-0891", type: "Payment Entry", account: "Ordinary Deposit", amount: "₹45,000.00", status: "Posted" },
  { id: "VCH-2026-8839", member: "Demo member M-1420", type: "Voucher Entry", account: "Loan & Advances", amount: "₹1,20,000.00", status: "Verified" },
  { id: "VCH-2026-8838", member: "Demo member M-0512", type: "Receipt Entry", account: "Daily Deposit", amount: "₹15,000.00", status: "Posted" },
];

export default function DashboardPage() {
  const linkTo = (id: string) => {
    const entry = navigationById.get(id);
    return entry ? actionPath(entry.id) : "/app/screens";
  };

  return (
    <div className="page-stack workspace-home prototype-overview">
      <div className="prototype-page-heading">
        <div>
          <div className="breadcrumbs"><Link to="/app">Society</Link><span><ArrowRight size={12} />Society Overview</span></div>
          <h1>Cooperative Society Overview</h1>
        </div>
        <Link to={linkTo(destinations.receipt)} className="primary-button"><ArrowDownLeft size={14} />New Receipt</Link>
      </div>

      <section className="dashboard-hero">
        <div className="hero-copy">
          <span className="eyebrow light"><i className="status-dot" />Core Cooperative Banking Ledger · Day Open</span>
          <h2>Welcome to EasyBook Enterprise Suite</h2>
          <p>Manage member shares, fixed and daily deposits, loan advances, arbitration records and day-book vouchers from one workspace.</p>
          <div className="hero-actions">
            <Link to={linkTo(destinations.member)} className="hero-button light-button"><Users size={14} />New Member</Link>
            <Link to={linkTo("nav-deposit-loan-registers-all-loans-loanandadvancestoolstripmenuitem-click-loanandadvances")} className="hero-button"><Landmark size={14} />Loan Sanction</Link>
            <span className="hero-preview-badge">Synthetic preview data</span>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true"><div className="globe-orbit orbit-one" /><div className="globe-orbit orbit-two" /><div className="hero-building"><Landmark size={47} /></div></div>
      </section>

      <section className="kpi-grid" aria-label="Synthetic preview summary">
        <Metric icon={Users} tone="blue" label="Active Members" value="4,820" note="+38 demo members this month" href={linkTo(destinations.balance)} />
        <Metric icon={WalletCards} tone="green" label="Active Deposits (FD/RD/OD)" value="₹14.82 Cr" note="+6.4% demo portfolio growth" href={linkTo(destinations.fixed)} />
        <Metric icon={PieChart} tone="amber" label="Loans & Advances" value="₹11.24 Cr" note="98.2% demo recovery rate" href={linkTo("nav-deposit-loan-registers-all-loans-loanandadvancestoolstripmenuitem-click-loanandadvances")} />
        <Metric icon={Landmark} tone="violet" label="Cash & Ledger Balance" value="₹1.84 Cr" note="Demo ledger · zero variance" href={linkTo("nav-society-ledger-accounts-ledgeraccountstoolstripmenuitem-click-ledgeraccounts")} />
      </section>

      <section className="content-card prototype-shortcuts">
        <div className="section-title"><div><h2>Quick Operation Shortcuts</h2><p>Direct access to common teller and society operations</p></div><BookOpen size={17} /></div>
        <div className="quick-grid prototype-quick-grid">
          {quickActions.map(({ label, icon: Icon, target }) => <Link to={linkTo(target)} className="quick-tile" key={label}><span><Icon size={16} /></span><strong>{label}</strong><ArrowRight size={13} /></Link>)}
        </div>
      </section>

      <section className="content-card activity-card prototype-activity">
        <div className="section-title"><div><h2>Recent Voucher & Ledger Activity</h2><p>Example day-book entries shown in the supplied HTML prototype</p></div><Link to={linkTo(destinations.voucher)} className="secondary-button">View Day Book</Link></div>
        <div className="table-scroll"><table className="activity-table"><thead><tr><th>Voucher No.</th><th>Member / Party</th><th>Entry Type</th><th>Account Head</th><th className="text-right">Amount</th><th>Status</th></tr></thead><tbody>
          {voucherRows.map((row) => <tr key={row.id}><td><strong>{row.id}</strong></td><td>{row.member}</td><td>{row.type}</td><td>{row.account}</td><td className="text-right">{row.amount}</td><td><span className="status-badge">{row.status}</span></td></tr>)}
        </tbody></table></div>
        <p className="prototype-data-note"><ShieldCheck size={13} />All dashboard amounts and voucher rows are synthetic prototype examples. No society database is connected.</p>
      </section>
    </div>
  );
}

function Metric({ icon: Icon, tone, label, value, note, href }: { icon: typeof Users; tone: string; label: string; value: string; note: string; href: string }) {
  return <Link to={href} className="metric-card prototype-metric"><span className={`metric-icon ${tone}`}><Icon size={16} /></span><span className="metric-copy"><span>{label}</span><strong>{value}</strong><small>{note}</small></span></Link>;
}
