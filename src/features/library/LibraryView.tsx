import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Archive,
  ArrowUpRight,
  CalendarDays,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Tags } from "../../components/Tags";
import { Dialog } from "../../components/Dialog";
import { pb } from "../../lib/pocketbase";
import { errorMessage } from "../../lib/records";
import { kinds, listItems, safeUrl, type Item, type Kind } from "./records";
export function LibraryView() {
  const [items, setItems] = useState<Item[]>([]),
    [query, setQuery] = useState(""),
    [kind, setKind] = useState("");
  const [page, setPage] = useState(1),
    [pages, setPages] = useState(0),
    [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [revision, setRevision] = useState(0);
  const [editing, setEditing] = useState<Item | "new" | null>(null);
  const generation = useRef(0);
  useEffect(() => {
    const token = ++generation.current;
    setLoading(true);
    setError("");
    setItems([]);
    setPage(1);
    const timer = setTimeout(() => {
      listItems(1, query, kind)
        .then((result) => {
          if (token !== generation.current) {
            return;
          }
          setItems(result.items);
          setTotal(result.totalItems);
          setPages(result.totalPages);
        })
        .catch((e) => {
          if (token === generation.current) {
            setError(
              e.status === 404
                ? "Library is not set up yet. Create the items collection using the included PocketBase setup guide."
                : errorMessage(e),
            );
          }
        })
        .finally(() => {
          if (token === generation.current) {
            setLoading(false);
          }
        });
    }, 200);
    return () => {
      clearTimeout(timer);
      generation.current++;
    };
  }, [query, kind, revision]);
  async function more() {
    const token = generation.current;
    setLoading(true);
    try {
      const result = await listItems(page + 1, query, kind);
      if (token !== generation.current) {
        return;
      }
      setItems((x) => [...x, ...result.items]);
      setPage(result.page);
    } catch (e) {
      if (token === generation.current) {
        setError(errorMessage(e));
      }
    } finally {
      if (token === generation.current) {
        setLoading(false);
      }
    }
  }
  function renderItems() {
    if (loading && !items.length) {
      return <output className="glass empty">Gathering your library…</output>;
    }
    if (!error && !items.length) {
      return (
        <div className="glass empty">
          <Archive size={30} />
          <h3>A place for everything.</h3>
          <p>Keep personal details, upcoming events, lists, links, and more.</p>
          <button
            type="button"
            className="text-button peach"
            onClick={() => setEditing("new")}
          >
            Add your first item <Plus size={16} />
          </button>
        </div>
      );
    }
    return (
      <div className="notes-grid">
        {items.map((item, index) => (
          <button
            type="button"
            className="glass note-card ascend"
            style={{ animationDelay: `${Math.min(index, 5) * 35}ms` }}
            key={item.id}
            onClick={() => setEditing(item)}
          >
            <div className="note-top">
              <span className="eyebrow">{kinds[item.kind] || "Other"}</span>
              <ArrowUpRight size={17} />
            </div>
            <h3>{item.title}</h3>
            <p className="preview">{item.content}</p>
            {item.starts_at && (
              <p className="event-time">
                <CalendarDays size={13} />
                {new Date(item.starts_at).toLocaleString()}
              </p>
            )}
            {item.kind === "checklist" && (
              <p className="event-time">
                {item.data?.checklist?.filter((x) => x.done).length || 0} /{" "}
                {item.data?.checklist?.length || 0} complete
              </p>
            )}
            <Tags value={item.tags} />
          </button>
        ))}
      </div>
    );
  }
  return (
    <section className="collection library">
      <div className="section-heading">
        <div>
          <p className="eyebrow">EVERYTHING, CONNECTED</p>
          <h2>
            Your library <span className="count">{total}</span>
          </h2>
        </div>
        <button
          type="button"
          className="primary compact"
          onClick={() => setEditing("new")}
        >
          <Plus size={18} />
          Add item
        </button>
      </div>
      <div className="library-tools">
        <label className="library-search">
          <span className="sr-only">Search library</span>
          <Search size={17} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search titles, content, tags…"
          />
        </label>
        <label>
          <span className="sr-only">Item type filter</span>
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="">All types</option>
            {Object.entries(kinds).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {error && (
        <div className="glass error-box" role="alert">
          {error}
          <button type="button" onClick={() => setRevision((x) => x + 1)}>
            Retry
          </button>
        </div>
      )}
      {renderItems()}
      {page < pages && (
        <button
          type="button"
          className="load-more"
          disabled={loading}
          onClick={() => void more()}
        >
          Load more
        </button>
      )}
      {editing && (
        <ItemForm
          key={typeof editing === "string" ? "new" : editing.id}
          item={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            setRevision((x) => x + 1);
          }}
        />
      )}
    </section>
  );
}
function localDate(value: string) {
  if (!value) {
    return "";
  }
  const d = new Date(value);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
function ItemForm({
  item,
  onClose,
  onSaved,
}: Readonly<{
  item?: Item;
  onClose: () => void;
  onSaved: () => void;
}>) {
  const [title, setTitle] = useState(item?.title || ""),
    [kind, setKind] = useState<Kind>(item?.kind || "information");
  const [content, setContent] = useState(item?.content || ""),
    [tags, setTags] = useState(item?.tags || ""),
    [date, setDate] = useState(localDate(item?.starts_at || ""));
  const [fields, setFields] = useState(() =>
      (item?.data?.fields || []).map((row) => ({
        ...row,
        id: crypto.randomUUID(),
      })),
    ),
    [checklist, setChecklist] = useState(() =>
      (item?.data?.checklist || []).map((row) => ({
        ...row,
        id: crypto.randomUUID(),
      })),
    ),
    [url, setUrl] = useState(item?.data?.url || "");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [confirmDelete, setConfirmDelete] = useState(false);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  async function save(e: FormEvent) {
    e.preventDefault();
    if (busy || !title.trim()) {
      return;
    }
    if (kind === "link" && url && !safeUrl(url)) {
      setError("Use a complete http:// or https:// link.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const data = {
        ...item?.data,
        fields: fields
          .filter((x) => x.key.trim())
          .map(({ key, value }) => ({ key, value })),
        checklist: checklist
          .filter((x) => x.text.trim())
          .map(({ text, done }) => ({ text, done })),
        url,
      };
      const payload = {
        title: title.trim(),
        kind,
        content,
        tags,
        starts_at: kind === "event" && date ? new Date(date).toISOString() : "",
        data,
      };
      if (item) {
        await pb.collection("items").update(item.id, payload);
      } else {
        await pb
          .collection("items")
          .create({ ...payload, owner: pb.authStore.record?.id });
      }
      if (alive.current) {
        onSaved();
      }
    } catch (e) {
      if (alive.current) {
        setError(errorMessage(e));
      }
    } finally {
      if (alive.current) {
        setBusy(false);
      }
    }
  }
  async function remove() {
    if (!item || busy) {
      return;
    }
    setBusy(true);
    try {
      await pb.collection("items").delete(item.id);
      if (alive.current) {
        onSaved();
      }
    } catch (e) {
      if (alive.current) {
        setError(errorMessage(e));
      }
    } finally {
      if (alive.current) {
        setBusy(false);
      }
    }
  }
  return (
    <Dialog
      title={item ? "Your saved item" : "Everything has a place."}
      onClose={onClose}
    >
      <form onSubmit={save}>
        <label>
          Title
          <input
            required
            maxLength={250}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label>
          Item type
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as Kind)}
          >
            {Object.entries(kinds).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Details
          <textarea
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What would you like to remember?"
          />
        </label>
        {kind === "event" && (
          <label>
            Event date and time
            <input
              required
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <span className="field-help">
              Your local time. Saved with its timezone offset.
            </span>
          </label>
        )}
        {kind === "link" && (
          <label>
            URL
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://"
            />
            {safeUrl(url) && (
              <a
                className="text-button peach"
                href={safeUrl(url)!}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open link <ArrowUpRight size={14} />
              </a>
            )}
          </label>
        )}
        {kind === "checklist" && (
          <fieldset>
            <legend>Checklist</legend>
            {checklist.map((row, i) => (
              <div className="checklist-row" key={row.id}>
                <input
                  aria-label={`Complete item ${i + 1}`}
                  type="checkbox"
                  checked={row.done}
                  onChange={(e) =>
                    setChecklist(
                      checklist.map((r) =>
                        r.id === row.id ? { ...r, done: e.target.checked } : r,
                      ),
                    )
                  }
                />
                <input
                  aria-label={`Checklist item ${i + 1}`}
                  value={row.text}
                  onChange={(e) =>
                    setChecklist(
                      checklist.map((r) =>
                        r.id === row.id ? { ...r, text: e.target.value } : r,
                      ),
                    )
                  }
                />
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`Remove checklist item ${i + 1}`}
                  onClick={() =>
                    setChecklist(checklist.filter((r) => r.id !== row.id))
                  }
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            <button
              type="button"
              className="text-button peach"
              onClick={() =>
                setChecklist([
                  ...checklist,
                  { id: crypto.randomUUID(), text: "", done: false },
                ])
              }
            >
              <Plus size={16} />
              Add checklist item
            </button>
          </fieldset>
        )}
        <fieldset>
          <legend>Extra details</legend>
          <p className="field-help">
            Add labeled facts, such as location, phone, or preference.
          </p>
          {fields.map((row, i) => (
            <div className="custom-field" key={row.id}>
              <input
                aria-label={`Field name ${i + 1}`}
                placeholder="Label"
                value={row.key}
                onChange={(e) =>
                  setFields(
                    fields.map((r) =>
                      r.id === row.id ? { ...r, key: e.target.value } : r,
                    ),
                  )
                }
              />
              <input
                aria-label={`Field value ${i + 1}`}
                placeholder="Value"
                value={row.value}
                onChange={(e) =>
                  setFields(
                    fields.map((r) =>
                      r.id === row.id ? { ...r, value: e.target.value } : r,
                    ),
                  )
                }
              />
              <button
                type="button"
                className="icon-button"
                aria-label={`Remove field ${i + 1}`}
                onClick={() => setFields(fields.filter((r) => r.id !== row.id))}
              >
                <X size={16} />
              </button>
            </div>
          ))}
          <button
            type="button"
            className="text-button peach"
            onClick={() =>
              setFields([
                ...fields,
                { id: crypto.randomUUID(), key: "", value: "" },
              ])
            }
          >
            <Plus size={16} />
            Add detail
          </button>
        </fieldset>
        <label>
          Tags
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="personal, work, travel"
          />
        </label>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <button
          type="submit"
          className="primary"
          disabled={busy || !title.trim()}
        >
          {busy ? "Saving…" : "Save item"}
          <ArrowUpRight size={17} />
        </button>
        {item &&
          (confirmDelete ? (
            <div className="delete-confirm">
              <p>Delete this item permanently?</p>
              <button
                disabled={busy}
                type="button"
                className="text-button error"
                onClick={() => void remove()}
              >
                Delete permanently
              </button>
              <button
                type="button"
                className="text-button"
                onClick={() => setConfirmDelete(false)}
              >
                Keep item
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="text-button error"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 size={15} />
              Delete item
            </button>
          ))}
      </form>
    </Dialog>
  );
}
