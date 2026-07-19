/* Librarian — Add-to-Collection popup, Collections, and combined Catalogue shelf */
import React from "react";
import { Icon } from "../../components/icons";
import { Btn, Card, Empty, Field, Modal, ModalHead, PageHead, Seg, Tag } from "../../components/ui";
import {
  BOOKS, ISBN_DB, LIB_CATEGORIES, LIB_COLLECTIONS, LIB_STATS, SAMPLE_SCANS,
} from "../../data/campus-data";
import type { Book, Collection } from "../../data/campus-data";
import type { Store, StoreCollection, StoreLibBook } from "../../store/types";
import type { Actions } from "../../store/store";
import type { IconName } from "../../types";

/** A book as shown on the shelf: a seed book, or a librarian-added one. */
type ShelfBook = Book & { addedAt?: string; collections?: string[] };
/** A collection: a seed one or a librarian-created one (same shape). */
type ShelfCollection = Collection | StoreCollection;

/* merge seed catalogue with librarian-added books from the store */
export function allLibBooks(store: Store): ShelfBook[] {
  const added: StoreLibBook[] = (store.campus && store.campus.libBooks) || [];
  return [...added, ...BOOKS];
}
export function allCollections(store: Store): ShelfCollection[] {
  const extra = (store.campus && store.campus.libNewColl) || [];
  return [...LIB_COLLECTIONS, ...extra];
}
export function collectionBookIds(store: Store, coll: ShelfCollection): string[] {
  const added = (store.campus && store.campus.libColl && store.campus.libColl[coll.id]) || [];
  return [...(coll.seed || []), ...added];
}

interface AddForm {
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  year: string;
  cat: string;
  call: string;
  copies: string;
  shelf: string;
}

type ScanState = "idle" | "scanning" | "found" | "notfound";

interface SavedBook {
  title: string;
  author: string;
  publisher: string;
  year: number;
  cat: string;
  call: string;
  isbn: string;
  copies: number;
  available: number;
  shelf: string;
  collections: string[];
}

/* ---------------- ADD TO COLLECTION (popup) ---------------- */
export interface AddToCollectionModalProps {
  store: Store;
  actions: Actions;
  onClose: () => void;
}

export function AddToCollectionModal({ store, actions, onClose }: AddToCollectionModalProps) {
  const [mode, setMode] = React.useState<"scan" | "manual">("scan");
  const blank: AddForm = { isbn: "", title: "", author: "", publisher: "", year: "", cat: "Computer Science", call: "", copies: "2", shelf: "" };
  const [form, setForm] = React.useState<AddForm>(blank);
  const [scanState, setScanState] = React.useState<ScanState>("idle");
  const [scanInput, setScanInput] = React.useState("");
  const [colls, setColls] = React.useState<string[]>(["new"]);
  const [saved, setSaved] = React.useState<SavedBook | null>(null);

  const set = <K extends keyof AddForm>(k: K, v: AddForm[K]) => setForm((f) => ({ ...f, [k]: v }));
  const toggleColl = (id: string) => setColls((c) => c.includes(id) ? c.filter((x) => x !== id) : [...c, id]);

  const runScan = (code?: string) => {
    const isbn = (code || scanInput).replace(/[^0-9X]/gi, "");
    if (!isbn) return;
    setScanState("scanning");
    setScanInput(isbn);
    setTimeout(() => {
      const hit = ISBN_DB[isbn];
      if (hit) { setForm({ ...blank, isbn, title: hit.title, author: hit.author, publisher: hit.publisher, year: String(hit.year), cat: hit.cat, call: hit.call, copies: "2", shelf: "" }); setScanState("found"); setColls(["new"]); }
      else { setScanState("notfound"); setForm({ ...blank, isbn }); }
    }, 900);
  };

  const canSave = form.title.trim() && form.author.trim();
  const save = () => {
    const copies = Number(form.copies) || 1;
    const book = {
      title: form.title.trim(), author: form.author.trim(), publisher: form.publisher.trim(),
      year: Number(form.year) || new Date().getFullYear(), cat: form.cat,
      call: form.call.trim() || "—", isbn: form.isbn,
      copies, available: copies, shelf: form.shelf.trim(),
    };
    actions.addLibraryBook(book, colls);
    setSaved({ ...book, collections: colls });
  };
  const reset = () => { setForm(blank); setScanState("idle"); setScanInput(""); setColls(["new"]); setSaved(null); };

  const collections = allCollections(store);
  const formVisible = mode === "manual" || scanState === "found" || scanState === "notfound";

  return (
    <Modal onClose={onClose} lg>
      <ModalHead title="Add to Collection" sub="Scan a barcode to auto-fill, or enter a book manually" onClose={onClose} />

      {saved ? (
        <div className="u-pad">
          <div className="u-row" style={{ gap: 12, padding: "12px 14px", background: "var(--success-soft)", borderRadius: "var(--r-md)", marginBottom: 16 }}>
            <Icon name="check" size={18} style={{ color: "var(--success)" }} />
            <div className="u-grow"><div className="u-h3" style={{ color: "oklch(from var(--success) calc(l - 0.12) c h)" }}>Added to catalogue</div><div className="u-meta">{saved.copies} {saved.copies > 1 ? "copies" : "copy"} catalogued and shelved.</div></div>
          </div>
          <div style={{ marginBottom: 4 }}>
            {([["Title", saved.title], ["Author", saved.author], ["Publisher", saved.publisher || "—"], ["Year", saved.year], ["Call number", saved.call], ["Copies", saved.copies], ["Shelf", saved.shelf || "Unassigned"]] as [string, React.ReactNode][]).map(([k, v]) => (
              <div key={k} className="u-slip__row" style={{ borderTop: "1px solid var(--border)" }}><span className="k">{k}</span><span className="v">{v}</span></div>
            ))}
          </div>
          <div className="u-row u-wrap" style={{ gap: 6, marginTop: 12 }}>
            {saved.collections.map((cid) => { const c = collections.find((x) => x.id === cid); return c ? <Tag key={cid} variant="accent"><Icon name={c.icon as IconName} size={12} /> {c.name}</Tag> : null; })}
          </div>
          <div className="u-row u-wrap" style={{ gap: 8, marginTop: 18 }}>
            <Btn variant="accent" icon="plus" onClick={reset}>Add another</Btn>
            <Btn variant="secondary" onClick={onClose}>Done</Btn>
          </div>
        </div>
      ) : (
        <div className="u-pad u-stack" style={{ gap: 16 }}>
          <Seg value={mode} onChange={setMode} options={[{ value: "scan", label: "Scan barcode" }, { value: "manual", label: "Manual entry" }]} />

          {mode === "scan" && (
            <div>
              <div className={"u-scanner" + (scanState === "scanning" ? " is-scanning" : "")}>
                <div className="u-scanner__icon"><Icon name="barcode" size={30} /><div className="u-scanner__laser" /></div>
                <div className="u-grow">
                  <div className="u-h3">{scanState === "scanning" ? "Looking up ISBN…" : "Scan or type an ISBN barcode"}</div>
                  <div className="u-meta" style={{ marginTop: 2 }}>Point the desk scanner at the barcode, or enter the 13-digit ISBN.</div>
                  <div className="u-row u-wrap" style={{ gap: 8, marginTop: 12 }}>
                    <input className="fb-input fb-input--mono" style={{ maxWidth: 240 }} placeholder="978…"
                      value={scanInput} onChange={(e) => setScanInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") runScan(); }} />
                    <Btn variant="accent" icon="scan" disabled={scanState === "scanning"} onClick={() => runScan()}>Look up</Btn>
                  </div>
                </div>
              </div>
              <div className="u-meta" style={{ marginTop: 14, marginBottom: 8 }}>No scanner handy? Tap a sample barcode to simulate a scan:</div>
              <div className="u-row u-wrap" style={{ gap: 8 }}>
                {SAMPLE_SCANS.map((code) => (
                  <button key={code} className="u-barcode-chip" onClick={() => runScan(code)}><Icon name="barcode" size={16} /><span className="fb-mono">{code}</span></button>
                ))}
              </div>
              {scanState === "found" && (
                <div className="u-row" style={{ gap: 10, marginTop: 16, padding: "10px 14px", background: "var(--success-soft)", borderRadius: "var(--r-md)" }}>
                  <Icon name="check" size={16} style={{ color: "var(--success)" }} /><span style={{ fontSize: 13, color: "oklch(from var(--success) calc(l - 0.15) c h)" }}>Match found — review the details below and save.</span>
                </div>
              )}
              {scanState === "notfound" && (
                <div className="u-row" style={{ gap: 10, marginTop: 16, padding: "10px 14px", background: "var(--warning-soft)", borderRadius: "var(--r-md)" }}>
                  <Icon name="info" size={16} style={{ color: "oklch(from var(--warning) calc(l - 0.2) c h)" }} /><span style={{ fontSize: 13, color: "oklch(from var(--warning) calc(l - 0.28) c h)" }}>Not in the lookup database. Fill the details below — the ISBN is kept.</span>
                </div>
              )}
            </div>
          )}

          {formVisible && (
            <div>
              <div className="u-h3" style={{ marginBottom: 14 }}>Book details</div>
              <div className="u-grid u-grid--2" style={{ gap: 14 }}>
                <Field label="Title"><input className="fb-input" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Book title" /></Field>
                <Field label="Author(s)"><input className="fb-input" value={form.author} onChange={(e) => set("author", e.target.value)} placeholder="Author name" /></Field>
                <Field label="Publisher"><input className="fb-input" value={form.publisher} onChange={(e) => set("publisher", e.target.value)} placeholder="Publisher" /></Field>
                <Field label="Year"><input className="fb-input" type="number" value={form.year} onChange={(e) => set("year", e.target.value)} placeholder="2024" /></Field>
                <Field label="Category">
                  <select className="fb-input" value={form.cat} onChange={(e) => set("cat", e.target.value)}>
                    {LIB_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Call number"><input className="fb-input fb-input--mono" value={form.call} onChange={(e) => set("call", e.target.value)} placeholder="QA76.6 .C66" /></Field>
                <Field label="Number of copies"><input className="fb-input" type="number" min="1" value={form.copies} onChange={(e) => set("copies", e.target.value)} /></Field>
                <Field label="Shelf / location"><input className="fb-input" value={form.shelf} onChange={(e) => set("shelf", e.target.value)} placeholder="e.g. Floor 2 · Bay 14" /></Field>
              </div>
            </div>
          )}

          {formVisible && (
            <div>
              <div className="u-h3" style={{ marginBottom: 4 }}>File under collections</div>
              <div className="u-meta" style={{ marginBottom: 12 }}>Choose where this title appears on the shelves and in the portal.</div>
              <div className="u-grid u-grid--2" style={{ gap: 10 }}>
                {collections.map((c) => {
                  const on = colls.includes(c.id);
                  return (
                    <button key={c.id} className="u-coll-pick" data-on={on} onClick={() => toggleColl(c.id)}>
                      <span className="u-icon" style={{ width: 30, height: 30 }}><Icon name={c.icon as IconName} size={15} /></span>
                      <div className="u-grow" style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div>
                        <div className="u-meta" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.desc}</div>
                      </div>
                      <span className="fb-check" data-on={on} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {formVisible && (
            <div className="u-row u-wrap" style={{ gap: 8, justifyContent: "space-between", borderTop: "1px solid var(--border)", paddingTop: 14 }}>
              <Btn variant="ghost" onClick={reset}>Clear</Btn>
              <Btn variant="accent" size="lg" icon="check" disabled={!canSave} onClick={save}>Add to catalogue</Btn>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

/* ---------------- COMBINED CATALOGUE + COLLECTIONS ---------------- */
export interface LibraryShelfProps {
  store: Store;
  actions: Actions;
  go?: (route: string) => void;
}

export function LibraryShelf({ store, actions }: LibraryShelfProps) {
  const [tab, setTab] = React.useState<"catalogue" | "collections">("catalogue");
  const [adding, setAdding] = React.useState(false);
  const [openColl, setOpenColl] = React.useState<string | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [name, setName] = React.useState("");
  const [desc, setDesc] = React.useState("");
  const [q, setQ] = React.useState("");

  const books = allLibBooks(store);
  const collections = allCollections(store);
  const byId = (id: string) => books.find((b) => b.id === id);
  const addedCount = ((store.campus && store.campus.libBooks) || []).length;
  const titleCount = (LIB_STATS.titles + addedCount).toLocaleString();

  const create = () => { if (!name.trim()) return; actions.createCollection(name.trim(), desc.trim()); setName(""); setDesc(""); setCreating(false); };
  const active = openColl ? collections.find((c) => c.id === openColl) : null;
  const rows = books.filter((b) => b.title.toLowerCase().includes(q.toLowerCase()) || b.author.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="u-content">
      <PageHead title="Catalogue" sub={titleCount + " titles · " + LIB_STATS.copies.toLocaleString() + " copies"}>
        <Seg value={tab} onChange={(v) => { setTab(v); setOpenColl(null); }} options={[{ value: "catalogue", label: "All books" }, { value: "collections", label: "Collections" }]} />
        <Btn variant="accent" icon="barcode" onClick={() => setAdding(true)}>Add to collection</Btn>
      </PageHead>

      {tab === "catalogue" && (
        <div>
          <div style={{ marginBottom: 14, maxWidth: 360, position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--fg-subtle)" }}><Icon name="search" size={15} /></span>
            <input className="fb-input" style={{ paddingLeft: 36 }} placeholder="Search catalogue…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Card>
            <div style={{ overflowX: "auto" }}>
              <table className="u-table">
                <thead><tr><th>Title</th><th>Author</th><th>Category</th><th>Call no.</th><th className="u-right">Available</th></tr></thead>
                <tbody>
                  {rows.map((b) => (
                    <tr key={b.id}>
                      <td style={{ fontWeight: 500 }}>{b.title}{b.addedAt && <Tag variant="success">New</Tag>}</td>
                      <td className="u-muted">{b.author}</td>
                      <td><Tag>{b.cat}</Tag></td>
                      <td className="fb-mono u-meta">{b.call}</td>
                      <td className="u-right"><Tag variant={b.available > 0 ? "success" : "danger"} dot>{b.available} / {b.copies}</Tag></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {tab === "collections" && !active && (
        <div className="u-grid u-grid--3">
          {collections.map((c) => {
            const ids = collectionBookIds(store, c);
            return (
              <Card key={c.id} className="u-pad" style={{ cursor: "pointer" }} onClick={() => setOpenColl(c.id)}>
                <div className="u-row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
                  <span className="u-icon"><Icon name={c.icon as IconName} size={16} /></span>
                  <Tag>{ids.length} {ids.length === 1 ? "title" : "titles"}</Tag>
                </div>
                <div className="u-h3">{c.name}</div>
                <div className="u-meta" style={{ marginTop: 4 }}>{c.desc}</div>
                <div className="u-row" style={{ gap: 5, marginTop: 14, color: "var(--accent-soft-fg)", fontSize: 12.5, fontWeight: 500 }}>Open shelf <Icon name="arrowRight" size={13} /></div>
              </Card>
            );
          })}
          <Card className="u-pad" style={{ cursor: "pointer", borderStyle: "dashed", display: "grid", placeItems: "center", minHeight: 140 }} onClick={() => setCreating(true)}>
            <div className="u-stack" style={{ alignItems: "center", gap: 8, color: "var(--fg-muted)" }}><Icon name="plus" size={20} /><span style={{ fontWeight: 500, fontSize: 13 }}>New collection</span></div>
          </Card>
        </div>
      )}

      {tab === "collections" && active && (
        <div>
          <button className="u-filelink" style={{ marginBottom: 14 }} onClick={() => setOpenColl(null)}><Icon name="arrowLeft" size={14} /> All collections</button>
          <Card className="u-pad" style={{ marginBottom: 16 }}>
            <div className="u-row" style={{ gap: 12 }}>
              <span className="u-icon" style={{ width: 40, height: 40 }}><Icon name={active.icon as IconName} size={19} /></span>
              <div className="u-grow"><div className="u-h2">{active.name}</div><div className="u-meta">{active.desc}</div></div>
              <Btn variant="accent" size="sm" icon="plus" onClick={() => setAdding(true)}>Add book</Btn>
            </div>
          </Card>
          <Card>
            {collectionBookIds(store, active).length === 0 ? (
              <Empty icon="book" title="No titles yet" sub="Add a book and file it under this collection." />
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="u-table">
                  <thead><tr><th>Title</th><th>Author</th><th>Category</th><th>Call no.</th><th className="u-right">Copies</th></tr></thead>
                  <tbody>
                    {collectionBookIds(store, active).map((id, i) => { const b = byId(id); if (!b) return null; return (
                      <tr key={id + i}>
                        <td style={{ fontWeight: 500 }}>{b.title}{b.addedAt && <Tag variant="success">New</Tag>}</td>
                        <td className="u-muted">{b.author}</td>
                        <td><Tag>{b.cat}</Tag></td>
                        <td className="fb-mono u-meta">{b.call}</td>
                        <td className="u-right u-num">{b.copies}</td>
                      </tr>
                    ); })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {adding && <AddToCollectionModal store={store} actions={actions} onClose={() => setAdding(false)} />}

      {creating && (
        <Modal onClose={() => setCreating(false)}>
          <ModalHead title="New collection" sub="Create a shelf to group titles" onClose={() => setCreating(false)} />
          <div className="u-pad u-stack" style={{ gap: 14 }}>
            <Field label="Name"><input className="fb-input" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. 100-Level Recommended Reading" /></Field>
            <Field label="Description (optional)"><input className="fb-input" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Short note about this shelf" /></Field>
            <Btn variant="accent" size="lg" icon="check" disabled={!name.trim()} onClick={create} style={{ width: "100%" }}>Create collection</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
