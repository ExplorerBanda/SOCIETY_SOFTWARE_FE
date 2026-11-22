import { Search, SlidersHorizontal, ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { screenCategories, screenPath, screenSummaries } from "../data/legacy";
import { slugLabel } from "./screenUtils";

export default function ScreenCatalogPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All groups");
  const visible = useMemo(() => screenSummaries.filter((screen) => {
    const matchesQuery = (screen.name + " " + screen.title + " " + screen.category).toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (category === "All groups" || screen.category === category);
  }), [query, category]);

  return <div className="page-stack">
    <div className="page-heading"><div className="breadcrumbs"><Link to="/app">Home</Link><span><ArrowRight size={12} />Development tools</span><span><ArrowRight size={12} />Screen inventory</span></div><div className="heading-row"><div className="heading-icon"><SlidersHorizontal size={18} /></div><div><h1>Recovered screen inventory</h1><p>Search and browse original forms without filling the module navigation.</p></div><span className="screen-class-tag">{screenSummaries.length} forms</span></div></div>
    <section className="content-card catalog-controls">
      <label className="catalog-search"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search screen name, title, or module" /></label>
      <label className="catalog-category"><span>Module / functional group</span><select value={category} onChange={(e) => setCategory(e.target.value)}><option>All groups</option>{screenCategories.map((item) => <option key={item}>{item}</option>)}</select></label>
      <div className="catalog-summary"><strong>{visible.length}</strong> of {screenSummaries.length} screens · all routes are local preview only</div>
    </section>
    <div className="catalog-grid">{visible.map((screen) => <Link key={screen.id} to={screenPath(screen.id)} className="catalog-card">
      <span className="catalog-card-top"><span className="area-count">{screen.actionCount.toString().padStart(2,"0")}</span><ArrowRight size={15} /></span>
      <strong>{screen.title || slugLabel(screen.name)}</strong><small className="catalog-class">{screen.name}</small><span className="catalog-category">{screen.category}</span>
      <span className="catalog-card-meta"><span>{screen.fieldCount} fields</span><span>{screen.gridCount} grids</span><span>{screen.actionCount} actions</span></span>
      <code className="catalog-route">{screenPath(screen.id)}</code>
    </Link>)}</div>
    {visible.length === 0 && <div className="content-card"><p className="empty-state-text">No source screens match the current filter.</p></div>}
  </div>;
}
