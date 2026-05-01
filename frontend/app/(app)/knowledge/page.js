"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Plus, Trash2, Edit2, Search, BookOpen, Film, Quote, User,
  FileText, Hash, X, Tv, Star, Heart, Palette, Smile,
} from "lucide-react";
import { useKnowledge, useKnowledgeCounts } from "@/hooks/useKnowledge";
import { Button, Badge, Spinner, EmptyState, Input, Select, Textarea } from "@/components/ui";
import Modal from "@/components/ui/Modal";
import PageWrapper from "@/components/layout/PageWrapper";
import clsx from "clsx";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: "book",       label: "Books",      icon: BookOpen, color: "bg-blue-500/15 text-blue-400",      border: "border-blue-500/20"   },
  { value: "movie",      label: "Movies",     icon: Film,     color: "bg-pink-500/15 text-pink-400",      border: "border-pink-500/20"   },
  { value: "web_series", label: "Web Series", icon: Tv,       color: "bg-orange-500/15 text-orange-400",  border: "border-orange-500/20" },
  { value: "anime",      label: "Anime",      icon: Star,     color: "bg-rose-500/15 text-rose-400",      border: "border-rose-500/20"   },
  { value: "quote",      label: "Quotes",     icon: Quote,    color: "bg-violet-500/15 text-violet-400",  border: "border-violet-500/20" },
  { value: "person",     label: "People",     icon: User,     color: "bg-emerald-500/15 text-emerald-400",border: "border-emerald-500/20"},
  { value: "article",    label: "Articles",   icon: FileText, color: "bg-cyan-500/15 text-cyan-400",      border: "border-cyan-500/20"   },
  { value: "other",      label: "Other",      icon: Hash,     color: "bg-slate-500/15 text-slate-400",    border: "border-slate-500/20"  },
];

// Accent colour definitions — key matches the backend enum
const ACCENT_COLOURS = {
  default:  { label: "Default",  ring: "ring-slate-500",   bg: "bg-slate-500",   cardBorder: "",                          gradient: ""                                          },
  rose:     { label: "Rose",     ring: "ring-rose-500",    bg: "bg-rose-500",    cardBorder: "border-rose-500/40",         gradient: "from-rose-500/10"                          },
  amber:    { label: "Amber",    ring: "ring-amber-400",   bg: "bg-amber-400",   cardBorder: "border-amber-400/40",        gradient: "from-amber-400/10"                         },
  emerald:  { label: "Emerald",  ring: "ring-emerald-500", bg: "bg-emerald-500", cardBorder: "border-emerald-500/40",      gradient: "from-emerald-500/10"                       },
  sky:      { label: "Sky",      ring: "ring-sky-400",     bg: "bg-sky-400",     cardBorder: "border-sky-400/40",          gradient: "from-sky-400/10"                           },
  violet:   { label: "Violet",   ring: "ring-violet-500",  bg: "bg-violet-500",  cardBorder: "border-violet-500/40",       gradient: "from-violet-500/10"                        },
  pink:     { label: "Pink",     ring: "ring-pink-400",    bg: "bg-pink-400",    cardBorder: "border-pink-400/40",         gradient: "from-pink-400/10"                          },
  orange:   { label: "Orange",   ring: "ring-orange-400",  bg: "bg-orange-400",  cardBorder: "border-orange-400/40",       gradient: "from-orange-400/10"                        },
};

const DISPLAY_STYLES = [
  { value: "default", label: "Default",  desc: "Standard card"       },
  { value: "compact", label: "Compact",  desc: "Minimal, info-dense" },
  { value: "poster",  label: "Poster",   desc: "Big emoji + title"   },
];

const QUICK_EMOJIS = ["📚","🎬","📺","⛩️","💬","🌟","📰","✨","🧠","🎭","🎵","🏆","💡","🌸","🔥","🎯","🎪","💎","🌙","☀️"];

const STATUS_OPTIONS = {
  book:       [{ value: "", label: "All" }, { value: "want", label: "Yet to Read"    }, { value: "in-progress", label: "Reading"  }, { value: "done", label: "Finished" }],
  movie:      [{ value: "", label: "All" }, { value: "want", label: "Want to Watch"  }, { value: "in-progress", label: "Watching" }, { value: "done", label: "Watched"  }],
  web_series: [{ value: "", label: "All" }, { value: "want", label: "Want to Watch"  }, { value: "in-progress", label: "Watching" }, { value: "done", label: "Finished" }],
  anime:      [{ value: "", label: "All" }, { value: "want", label: "Plan to Watch"  }, { value: "in-progress", label: "Watching" }, { value: "done", label: "Completed"}],
  article:    [{ value: "", label: "All" }, { value: "want", label: "Want to Read"   }, { value: "in-progress", label: "Reading"  }, { value: "done", label: "Read"     }],
};

function catMeta(value) {
  return CATEGORIES.find((c) => c.value === value) || CATEGORIES[7];
}
function accentMeta(key = "default") {
  return ACCENT_COLOURS[key] ?? ACCENT_COLOURS.default;
}

// ─────────────────────────────────────────────────────────────────────────────
// Star Rating
// ─────────────────────────────────────────────────────────────────────────────
function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div>
      <p className="text-xs font-medium text-slate-400 mb-1.5">Your Rating</p>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button"
            onClick={() => onChange(n === value ? null : n)}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            className={clsx("text-2xl transition-colors", (hovered || value) >= n ? "text-amber-400" : "text-slate-700")}>
            ★
          </button>
        ))}
        {value && (
          <button type="button" onClick={() => onChange(null)}
            className="text-xs text-slate-600 hover:text-slate-400 ml-1">clear</button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-category extra fields (unchanged from original)
// ─────────────────────────────────────────────────────────────────────────────
function ExtraFields({ category, form, setForm }) {
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  switch (category) {
    case "book":
      return (<>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Author" value={form.author || ""} onChange={set("author")} placeholder="Author name" />
          <Select label="Status" value={form.status || "want"} onChange={set("status")}>
            <option value="want">Yet to Read</option>
            <option value="in-progress">Currently Reading</option>
            <option value="done">Finished</option>
          </Select>
        </div>
        <StarRating value={form.rating} onChange={(v) => setForm((f) => ({ ...f, rating: v }))} />
        <Textarea label="Key Takeaways / Notes" value={form.content || ""} onChange={set("content")} rows={4} placeholder="What did you learn? Key ideas, memorable passages…" />
        <Input label="Genre / Tags" value={form.tags || ""} onChange={set("tags")} placeholder="fiction, psychology, sci-fi, biography" />
      </>);
    case "movie":
      return (<>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Director" value={form.author || ""} onChange={set("author")} placeholder="Director's name" />
          <Select label="Status" value={form.status || "want"} onChange={set("status")}>
            <option value="want">Want to Watch</option>
            <option value="in-progress">Watching</option>
            <option value="done">Watched</option>
          </Select>
        </div>
        <StarRating value={form.rating} onChange={(v) => setForm((f) => ({ ...f, rating: v }))} />
        <Textarea label="Review / Thoughts" value={form.content || ""} onChange={set("content")} rows={4} placeholder="What did you think? What stuck with you?" />
        <Input label="Genre / Tags" value={form.tags || ""} onChange={set("tags")} placeholder="thriller, sci-fi, bollywood, must-watch" />
      </>);
    case "web_series":
      return (<>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Creator / Network" value={form.author || ""} onChange={set("author")} placeholder="e.g. Netflix, HBO, Creator" />
          <Select label="Status" value={form.status || "want"} onChange={set("status")}>
            <option value="want">Want to Watch</option>
            <option value="in-progress">Watching</option>
            <option value="done">Finished</option>
          </Select>
        </div>
        <StarRating value={form.rating} onChange={(v) => setForm((f) => ({ ...f, rating: v }))} />
        <Textarea label="Review / Thoughts" value={form.content || ""} onChange={set("content")} rows={4} placeholder="What did you think? Favourite moments, characters…" />
        <Input label="Genre / Tags" value={form.tags || ""} onChange={set("tags")} placeholder="thriller, drama, sci-fi, binge-worthy" />
      </>);
    case "anime":
      return (<>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Studio / Author" value={form.author || ""} onChange={set("author")} placeholder="e.g. MAPPA, Ghibli, Mangaka" />
          <Select label="Status" value={form.status || "want"} onChange={set("status")}>
            <option value="want">Plan to Watch</option>
            <option value="in-progress">Watching</option>
            <option value="done">Completed</option>
          </Select>
        </div>
        <StarRating value={form.rating} onChange={(v) => setForm((f) => ({ ...f, rating: v }))} />
        <Textarea label="Review / Thoughts" value={form.content || ""} onChange={set("content")} rows={4} placeholder="What did you love? Arcs, characters, animation…" />
        <Input label="Genre / Tags" value={form.tags || ""} onChange={set("tags")} placeholder="shonen, isekai, slice-of-life, must-watch" />
      </>);
    case "quote":
      return (<>
        <Input label="Who said it" value={form.author || ""} onChange={set("author")} placeholder="Person, book, movie…" />
        <Textarea label="The Quote *" value={form.content || ""} onChange={set("content")} rows={4} placeholder="Write the full quote here…" />
        <Textarea label="Why it resonates" value={form.notes || ""} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} placeholder="What does this mean to you?" />
        <Input label="Tags" value={form.tags || ""} onChange={set("tags")} placeholder="life, stoicism, motivation" />
      </>);
    case "person":
      return (<>
        <Input label="Who are they / Role" value={form.author || ""} onChange={set("author")} placeholder="e.g. Entrepreneur, Mentor, Author" />
        <Textarea label="Why they inspire you" value={form.content || ""} onChange={set("content")} rows={3} placeholder="What have they accomplished? What can you learn from them?" />
        <Input label="Links / Resources" value={form.link || ""} onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))} placeholder="Twitter, website, book, YouTube…" />
        <Input label="Tags" value={form.tags || ""} onChange={set("tags")} placeholder="tech, entrepreneurship, design" />
      </>);
    case "article":
      return (<>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Author / Source" value={form.author || ""} onChange={set("author")} placeholder="Author or publication" />
          <Select label="Status" value={form.status || "want"} onChange={set("status")}>
            <option value="want">Want to Read</option>
            <option value="in-progress">Reading</option>
            <option value="done">Read</option>
          </Select>
        </div>
        <Input label="URL" value={form.link || ""} onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))} placeholder="https://…" />
        <Textarea label="Key Points / Summary" value={form.content || ""} onChange={set("content")} rows={4} placeholder="What are the main ideas?" />
        <Input label="Tags" value={form.tags || ""} onChange={set("tags")} placeholder="AI, productivity, design" />
      </>);
    default:
      return (<>
        <Input label="Source / Reference" value={form.author || ""} onChange={set("author")} placeholder="Where is this from?" />
        <Textarea label="Notes" value={form.content || ""} onChange={set("content")} rows={5} placeholder="Whatever you want to capture…" />
        <Input label="Tags" value={form.tags || ""} onChange={set("tags")} placeholder="Add tags…" />
      </>);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Card Style Panel (inside the modal)
// ─────────────────────────────────────────────────────────────────────────────
function CardStylePanel({ cardStyle, onChange }) {
  const [open, setOpen] = useState(false);
  const [emojiInput, setEmojiInput] = useState(cardStyle.coverEmoji || "");

  const set = (key, val) => onChange({ ...cardStyle, [key]: val });

  const applyEmoji = (e) => {
    setEmojiInput(e);
    set("coverEmoji", e);
  };

  return (
    <div className="border border-surface-3 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-surface-2 text-sm font-medium text-slate-300 hover:text-slate-100 transition-colors">
        <div className="flex items-center gap-2">
          <Palette size={14} className="text-slate-500" />
          Customise Card
          {(cardStyle.accentColour !== "default" || cardStyle.coverEmoji || cardStyle.displayStyle !== "default") && (
            <span className="w-1.5 h-1.5 rounded-full bg-brand" />
          )}
        </div>
        <span className="text-slate-600 text-xs">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="px-4 py-4 space-y-5 bg-surface/50">

          {/* Emoji / Cover Icon */}
          <div>
            <p className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-1.5"><Smile size={12} /> Cover Emoji</p>
            <div className="flex items-center gap-2 mb-2">
              <input
                value={emojiInput}
                onChange={(e) => { setEmojiInput(e.target.value); set("coverEmoji", e.target.value.slice(0, 4)); }}
                placeholder="e.g. 📚"
                className="input-base w-20 text-center text-lg"
              />
              {emojiInput && (
                <button type="button" onClick={() => applyEmoji("")} className="text-xs text-slate-600 hover:text-danger">clear</button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_EMOJIS.map((em) => (
                <button key={em} type="button" onClick={() => applyEmoji(em)}
                  className={clsx(
                    "w-8 h-8 rounded-lg text-base transition-all hover:scale-110",
                    cardStyle.coverEmoji === em ? "bg-brand/20 ring-1 ring-brand" : "bg-surface-2 hover:bg-surface-3"
                  )}>
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Accent Colour */}
          <div>
            <p className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-1.5"><Palette size={12} /> Accent Colour</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(ACCENT_COLOURS).map(([key, meta]) => (
                <button key={key} type="button" onClick={() => set("accentColour", key)}
                  title={meta.label}
                  className={clsx(
                    "w-7 h-7 rounded-full border-2 transition-all hover:scale-110",
                    meta.bg,
                    cardStyle.accentColour === key ? "border-white scale-110" : "border-transparent opacity-70"
                  )} />
              ))}
            </div>
          </div>

          {/* Display Style */}
          <div>
            <p className="text-xs font-medium text-slate-400 mb-2">Display Style</p>
            <div className="flex gap-2">
              {DISPLAY_STYLES.map(({ value, label, desc }) => (
                <button key={value} type="button" onClick={() => set("displayStyle", value)}
                  className={clsx(
                    "flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-all text-left",
                    cardStyle.displayStyle === value
                      ? "bg-brand/15 border-brand/40 text-brand"
                      : "bg-surface-2 border-surface-3 text-slate-400 hover:text-slate-200"
                  )}>
                  <p className="font-semibold">{label}</p>
                  <p className="opacity-60 mt-0.5">{desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Entry Modal
// ─────────────────────────────────────────────────────────────────────────────
function EntryModal({ open, onClose, onSave, initial }) {
  const blankStyle = { coverEmoji: "", accentColour: "default", displayStyle: "default" };
  const blank = { title: "", category: "book", content: "", notes: "", tags: "", author: "", link: "", rating: null, status: "want", isFavourite: false, cardStyle: blankStyle };
  const [form, setForm]     = useState(blank);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(initial
      ? { ...blank, ...initial, tags: (initial.tags || []).join(", "), rating: initial.rating || null, cardStyle: { ...blankStyle, ...(initial.cardStyle || {}) } }
      : blank);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.title.trim()) return;
    try {
      setSaving(true);
      const contentFinal = form.category === "quote" && form.notes
        ? `${form.content}\n\n---\n${form.notes}`.trim()
        : form.content;
      await onSave({
        title:       form.title.trim(),
        category:    form.category,
        content:     contentFinal,
        author:      form.author || "",
        rating:      form.rating ? Number(form.rating) : null,
        status:      form.status || "want",
        isFavourite: form.isFavourite,
        tags:        form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        cardStyle:   form.cardStyle,
      });
      onClose();
    } finally { setSaving(false); }
  };

  const titlePlaceholders = { book: "Book title…", movie: "Movie title…", web_series: "Series title…", anime: "Anime title…", quote: "Short label for this quote…", person: "Person's name…", article: "Article title…", other: "Title / Name…" };

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Edit Entry" : "New Entry"} size="lg">
      <div className="space-y-4">
        {/* Category selector */}
        <div>
          <p className="text-xs font-medium text-slate-400 mb-2">Category</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(({ value, label, icon: CatIcon, color }) => (
              <button key={value} type="button" onClick={() => setForm((f) => ({ ...f, category: value }))}
                className={clsx("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                  form.category === value ? `${color} border-current` : "bg-surface-2 text-slate-500 border-transparent hover:text-slate-300")}>
                <CatIcon size={12} />{label}
              </button>
            ))}
          </div>
        </div>

        <Input label="Title *" value={form.title} onChange={set("title")} placeholder={titlePlaceholders[form.category] || "Title…"} />
        <ExtraFields category={form.category} form={form} setForm={setForm} />

        {/* Favourite toggle */}
        <button type="button" onClick={() => setForm((f) => ({ ...f, isFavourite: !f.isFavourite }))}
          className={clsx("flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-all w-full",
            form.isFavourite
              ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
              : "bg-surface-2 border-surface-3 text-slate-400 hover:text-slate-200")}>
          <Heart size={14} className={form.isFavourite ? "fill-rose-400" : ""} />
          {form.isFavourite ? "Saved to Favourites" : "Add to Favourites"}
        </button>

        {/* Card style */}
        <CardStylePanel
          cardStyle={form.cardStyle}
          onChange={(cs) => setForm((f) => ({ ...f, cardStyle: cs }))}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={!form.title.trim() || saving}>
            {saving ? "Saving…" : initial ? "Save Changes" : "Add to Vault"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Entry Card — supports default / compact / poster display styles
// ─────────────────────────────────────────────────────────────────────────────
function EntryCard({ entry, onEdit, onDelete, onClick, onToggleFavourite }) {
  const cat    = catMeta(entry.category);
  const Icon   = cat.icon;
  const style  = entry.cardStyle || {};
  const accent = accentMeta(style.accentColour);
  const emoji  = style.coverEmoji || "";
  const display = style.displayStyle || "default";

  const accentBorder = accent.cardBorder || cat.border;

  // ── Poster style ───────────────────────────────────────────────────────────
  if (display === "poster") {
    return (
      <div
        className={clsx("card-hover group cursor-pointer flex flex-col border overflow-hidden", accentBorder)}
        onClick={() => onClick(entry)}>
        {/* Poster header */}
        <div className={clsx("flex items-center justify-center py-8 bg-gradient-to-b", accent.gradient || "from-white/5", "to-transparent")}>
          <span className="text-5xl leading-none select-none">{emoji || "✨"}</span>
        </div>
        <div className="px-4 pb-4 flex flex-col gap-2 flex-1">
          <div className="flex items-start justify-between">
            <p className="font-bold text-slate-100 text-base leading-snug flex-1 pr-2">{entry.title}</p>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => onToggleFavourite(entry._id, entry.isFavourite)}
                className={clsx("p-1.5 rounded transition-colors", entry.isFavourite ? "text-rose-400" : "text-slate-600 hover:text-rose-400")}>
                <Heart size={13} className={entry.isFavourite ? "fill-rose-400" : ""} />
              </button>
              <button onClick={() => onEdit(entry)} className="p-1.5 rounded text-slate-500 hover:text-brand hover:bg-white/5"><Edit2 size={13} /></button>
              <button onClick={() => onDelete(entry._id)} className="p-1.5 rounded text-slate-500 hover:text-danger hover:bg-danger/5"><Trash2 size={13} /></button>
            </div>
          </div>
          {entry.author && <p className="text-xs text-slate-500">{entry.author}</p>}
          {entry.rating && (
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map((n) => <span key={n} className={n <= entry.rating ? "text-amber-400 text-sm" : "text-slate-700 text-sm"}>★</span>)}
            </div>
          )}
          <div className="flex items-center gap-1.5 mt-auto pt-1 flex-wrap">
            <div className={clsx("flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium", cat.color)}>
              <Icon size={10} />{cat.label}
            </div>
            {entry.isFavourite && <span className="text-[10px] text-rose-400">♥ Fav</span>}
          </div>
        </div>
      </div>
    );
  }

  // ── Compact style ──────────────────────────────────────────────────────────
  if (display === "compact") {
    return (
      <div
        className={clsx("card-hover group cursor-pointer flex items-center gap-3 px-4 py-3 border", accentBorder)}
        onClick={() => onClick(entry)}>
        {emoji
          ? <span className="text-xl leading-none shrink-0">{emoji}</span>
          : <div className={clsx("p-1.5 rounded-lg shrink-0", cat.color)}><Icon size={13} /></div>}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-200 text-sm truncate">{entry.title}</p>
          {entry.author && <p className="text-[11px] text-slate-600 truncate">{entry.author}</p>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {entry.isFavourite && <Heart size={11} className="text-rose-400 fill-rose-400" />}
          {entry.rating && <span className="text-[11px] text-amber-400">{"★".repeat(entry.rating)}</span>}
          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => onToggleFavourite(entry._id, entry.isFavourite)}
              className={clsx("p-1 rounded", entry.isFavourite ? "text-rose-400" : "text-slate-600 hover:text-rose-400")}>
              <Heart size={12} className={entry.isFavourite ? "fill-rose-400" : ""} />
            </button>
            <button onClick={() => onEdit(entry)} className="p-1 rounded text-slate-500 hover:text-brand"><Edit2 size={12} /></button>
            <button onClick={() => onDelete(entry._id)} className="p-1 rounded text-slate-500 hover:text-danger"><Trash2 size={12} /></button>
          </div>
        </div>
      </div>
    );
  }

  // ── Default style ──────────────────────────────────────────────────────────
  return (
    <div
      className={clsx("card-hover p-5 group cursor-pointer flex flex-col gap-3 border", accentBorder)}
      onClick={() => onClick(entry)}>
      {/* Top row */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {emoji && <span className="text-2xl leading-none">{emoji}</span>}
          <div className={clsx("flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium", cat.color)}>
            <Icon size={12} />{cat.label}
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => onToggleFavourite(entry._id, entry.isFavourite)}
            className={clsx("p-1.5 rounded transition-colors", entry.isFavourite ? "text-rose-400" : "text-slate-600 hover:text-rose-400")}>
            <Heart size={13} className={entry.isFavourite ? "fill-rose-400" : ""} />
          </button>
          <button onClick={() => onEdit(entry)} className="p-1.5 rounded text-slate-500 hover:text-brand hover:bg-white/5"><Edit2 size={13} /></button>
          <button onClick={() => onDelete(entry._id)} className="p-1.5 rounded text-slate-500 hover:text-danger hover:bg-danger/5"><Trash2 size={13} /></button>
        </div>
      </div>

      <div>
        <p className="font-semibold text-slate-200 leading-snug">{entry.title}</p>
        {entry.author && <p className="text-xs text-slate-500 mt-0.5">{entry.author}</p>}
      </div>

      {entry.rating && (
        <div className="flex gap-0.5">
          {[1,2,3,4,5].map((n) => <span key={n} className={n <= entry.rating ? "text-amber-400 text-sm" : "text-slate-700 text-sm"}>★</span>)}
        </div>
      )}
      {entry.content && <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">{entry.content}</p>}

      <div className="flex flex-wrap gap-1.5 mt-auto">
        {entry.isFavourite && (
          <Badge className="bg-rose-500/10 text-rose-400 text-[10px] flex items-center gap-1">
            <Heart size={8} className="fill-rose-400" /> Favourite
          </Badge>
        )}
        {entry.status && entry.status !== "want" && (
          <Badge className={clsx("text-[10px]", entry.status === "done" ? "bg-success/15 text-success" : "bg-blue-500/15 text-blue-400")}>
            {entry.status === "in-progress" ? "In Progress" : "Done"}
          </Badge>
        )}
        {entry.tags?.slice(0, 3).map((t) => <Badge key={t} className="bg-surface-3 text-slate-600 text-[10px]">#{t}</Badge>)}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Entry Detail Drawer
// ─────────────────────────────────────────────────────────────────────────────
function EntryDetail({ entry, onClose, onEdit, onToggleFavourite }) {
  if (!entry) return null;
  const cat   = catMeta(entry.category);
  const Icon  = cat.icon;
  const style = entry.cardStyle || {};
  const emoji = style.coverEmoji || "";
  const accent = accentMeta(style.accentColour);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full z-50 w-full max-w-lg bg-surface shadow-2xl flex flex-col overflow-hidden">
        <div className={clsx("px-6 py-5 border-b border-white/[0.06] flex items-start gap-3", accent.gradient && `bg-gradient-to-r ${accent.gradient} to-transparent`)}>
          {emoji
            ? <span className="text-3xl leading-none mt-1">{emoji}</span>
            : <div className={clsx("p-2.5 rounded-xl", cat.color)}><Icon size={18} /></div>}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-slate-100 leading-snug">{entry.title}</h2>
            {entry.author && <p className="text-sm text-slate-500 mt-0.5">{entry.author}</p>}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onToggleFavourite(entry._id, entry.isFavourite)}
              className={clsx("p-2 rounded-lg transition-colors", entry.isFavourite ? "text-rose-400 bg-rose-500/10" : "text-slate-500 hover:text-rose-400 hover:bg-white/5")}>
              <Heart size={16} className={entry.isFavourite ? "fill-rose-400" : ""} />
            </button>
            <button onClick={onClose} className="p-2 text-slate-500 hover:text-slate-200 rounded-lg hover:bg-white/5"><X size={16} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {entry.rating && (
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map((n) => <span key={n} className={n <= entry.rating ? "text-amber-400 text-2xl" : "text-slate-700 text-2xl"}>★</span>)}
            </div>
          )}
          {entry.content && (
            <div className="bg-surface-2 rounded-xl p-4">
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{entry.content}</p>
            </div>
          )}
          {entry.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {entry.tags.map((t) => <Badge key={t} className="bg-surface-3 text-slate-400">#{t}</Badge>)}
            </div>
          )}
          {entry.isFavourite && (
            <div className="flex items-center gap-2 text-rose-400 text-xs">
              <Heart size={12} className="fill-rose-400" /> Saved to Favourites
            </div>
          )}
          <p className="text-xs text-slate-700">Added {new Date(entry.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>

        <div className="px-6 py-4 border-t border-white/[0.06]">
          <Button variant="primary" className="w-full" onClick={() => { onClose(); setTimeout(() => onEdit(entry), 100); }}>
            <Edit2 size={14} /> Edit Entry
          </Button>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────
export default function KnowledgePage() {
  const [activeCategory,  setActiveCategory]  = useState("");
  const [showFavourites,  setShowFavourites]  = useState(false);
  const [search,          setSearch]          = useState("");
  const [statusFilter,    setStatusFilter]    = useState("");
  const [authorFilter,    setAuthorFilter]    = useState("");
  const [modalOpen,       setModal]           = useState(false);
  const [editing,         setEditing]         = useState(null);
  const [viewing,         setViewing]         = useState(null);

  // Reset sub-filters when category changes
  useEffect(() => { setStatusFilter(""); setAuthorFilter(""); }, [activeCategory]);

  // Accurate counts
  const { counts: allCounts, total: allTotal, refetch: refetchCounts } = useKnowledgeCounts();

  // Build server-side params
  const params = useMemo(() => {
    const p = {};
    if (activeCategory)   p.category   = activeCategory;
    if (search)           p.search     = search;
    if (showFavourites)   p.favourites = "1";
    return p;
  }, [activeCategory, search, showFavourites]);

  const { entries: rawEntries, loading, loadingMore, hasMore, loadMore, createEntry, updateEntry, deleteEntry } = useKnowledge(params);

  // Client-side sub-filters
  const entries = useMemo(() => {
    let result = rawEntries;
    if (statusFilter)       result = result.filter((e) => e.status === statusFilter);
    if (authorFilter.trim()) result = result.filter((e) =>
      e.author?.toLowerCase().includes(authorFilter.toLowerCase()) ||
      e.tags?.some((t) => t.toLowerCase().includes(authorFilter.toLowerCase()))
    );
    return result;
  }, [rawEntries, statusFilter, authorFilter]);

  const openEdit   = (e) => { setViewing(null); setEditing(e); setModal(true); };
  const openCreate = ()  => { setEditing(null); setModal(true); };

  const handleSave = async (payload) => {
    if (editing) await updateEntry(editing._id, payload);
    else         await createEntry(payload);
    // Update viewing state if the entry being viewed was edited
    if (editing && viewing?._id === editing._id) {
      setViewing((prev) => ({ ...prev, ...payload }));
    }
    refetchCounts();
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this entry?")) return;
    if (viewing?._id === id) setViewing(null);
    await deleteEntry(id);
    refetchCounts();
  };

  // Optimistic favourite toggle — updates local state instantly
  const handleToggleFavourite = useCallback(async (id, current) => {
    // Optimistically update list
    if (viewing?._id === id) setViewing((prev) => ({ ...prev, isFavourite: !current }));
    await updateEntry(id, { isFavourite: !current });
    refetchCounts();
  }, [viewing, updateEntry, refetchCounts]);

  const hasSubFilters   = STATUS_OPTIONS[activeCategory];
  const activeFilterCount = [statusFilter, authorFilter.trim()].filter(Boolean).length;

  const authorFilterLabel = activeCategory === "movie"      ? "Filter by director…"
    : activeCategory === "web_series" ? "Filter by creator / network…"
    : activeCategory === "anime"      ? "Filter by studio / author…"
    : activeCategory === "book"       ? "Filter by author…"
    : "Filter by author / tag…";

  return (
    <PageWrapper className="p-0 overflow-hidden">
      <div className="flex h-full">

        {/* ── Left sidebar ──────────────────────────────────────────────────── */}
        <div className="hidden md:flex flex-col w-52 shrink-0 border-r border-surface-3 p-4 gap-1 overflow-y-auto">
          <p className="section-title mb-2 px-2">Categories</p>

          {/* Favourites */}
          <button
            onClick={() => { setShowFavourites((s) => !s); setActiveCategory(""); }}
            className={clsx("flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              showFavourites ? "bg-rose-500/15 text-rose-400" : "text-slate-400 hover:bg-surface-2 hover:text-slate-200")}>
            <div className="flex items-center gap-2">
              <Heart size={13} className={showFavourites ? "fill-rose-400" : ""} />
              Favourites
            </div>
            {allCounts._favouriteCount != null && <span className="text-xs opacity-60">{allCounts._favouriteCount}</span>}
          </button>

          <div className="w-full h-px bg-surface-3 my-1" />

          {/* All */}
          <button onClick={() => { setActiveCategory(""); setShowFavourites(false); }}
            className={clsx("flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              !activeCategory && !showFavourites ? "bg-brand/15 text-brand" : "text-slate-400 hover:bg-surface-2 hover:text-slate-200")}>
            <span>All</span>
            <span className="text-xs opacity-60">{allTotal}</span>
          </button>

          {CATEGORIES.map(({ value, label, icon: Icon }) => (
            <button key={value} onClick={() => { setActiveCategory(value === activeCategory ? "" : value); setShowFavourites(false); }}
              className={clsx("flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                activeCategory === value ? "bg-brand/15 text-brand" : "text-slate-400 hover:bg-surface-2 hover:text-slate-200")}>
              <div className="flex items-center gap-2"><Icon size={13} />{label}</div>
              {allCounts[value] ? <span className="text-xs opacity-60">{allCounts[value]}</span> : null}
            </button>
          ))}
        </div>

        {/* ── Main content ─────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Header */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h1 className="page-title flex items-center gap-2">
                {showFavourites && <Heart size={20} className="text-rose-400 fill-rose-400" />}
                {showFavourites ? "Favourites" : activeCategory ? catMeta(activeCategory).label : "Knowledge Vault"}
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {entries.length} {entries.length === 1 ? "entry" : "entries"}
                {activeFilterCount > 0 && <span className="text-brand ml-1">· {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active</span>}
              </p>
            </div>
            <Button variant="primary" onClick={openCreate}><Plus size={15} /> Add Entry</Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input className="input-base pl-9" placeholder="Search by title, notes or tags…"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          {/* Sub-filters */}
          {activeCategory && (
            <div className="flex flex-wrap gap-3 p-3 bg-surface-2 rounded-xl border border-surface-3">
              <div className="flex-1 min-w-[160px]">
                <input className="input-base text-sm w-full" placeholder={authorFilterLabel}
                  value={authorFilter} onChange={(e) => setAuthorFilter(e.target.value)} />
              </div>
              {hasSubFilters && (
                <div className="flex gap-1 flex-wrap">
                  {STATUS_OPTIONS[activeCategory].map(({ value, label }) => (
                    <button key={value} onClick={() => setStatusFilter(value === statusFilter ? "" : value)}
                      className={clsx("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
                        statusFilter === value
                          ? "bg-brand/15 text-brand border-brand/30"
                          : "bg-surface-3 text-slate-400 border-transparent hover:text-slate-200")}>
                      {label}
                    </button>
                  ))}
                </div>
              )}
              {activeFilterCount > 0 && (
                <button onClick={() => { setStatusFilter(""); setAuthorFilter(""); }}
                  className="text-xs text-slate-500 hover:text-danger flex items-center gap-1">
                  <X size={11} /> Clear
                </button>
              )}
            </div>
          )}

          {/* Mobile chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 md:hidden">
            <button onClick={() => { setShowFavourites(true); setActiveCategory(""); }}
              className={clsx("shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium",
                showFavourites ? "bg-rose-500/15 text-rose-400" : "bg-surface-2 text-slate-400")}>
              <Heart size={11} className={showFavourites ? "fill-rose-400" : ""} /> Favs
            </button>
            <button onClick={() => { setActiveCategory(""); setShowFavourites(false); }}
              className={clsx("shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium",
                !activeCategory && !showFavourites ? "bg-brand/15 text-brand" : "bg-surface-2 text-slate-400")}>
              All ({allTotal})
            </button>
            {CATEGORIES.map(({ value, label }) => (
              <button key={value} onClick={() => { setActiveCategory(value === activeCategory ? "" : value); setShowFavourites(false); }}
                className={clsx("shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium",
                  activeCategory === value ? "bg-brand/15 text-brand" : "bg-surface-2 text-slate-400")}>
                {label}{allCounts[value] ? ` (${allCounts[value]})` : ""}
              </button>
            ))}
          </div>

          {/* Grid */}
          {loading ? (
            <div className="flex justify-center py-20"><Spinner size="lg" /></div>
          ) : entries.length === 0 ? (
            <EmptyState icon={showFavourites ? Heart : BookOpen}
              title={showFavourites ? "No favourites yet" : activeFilterCount > 0 ? "No entries match these filters" : "Vault is empty"}
              description={showFavourites ? "Heart any entry to save it here." : activeFilterCount > 0 ? "Try adjusting your filters" : "Capture books, movies, quotes, people, and articles."}
              action={showFavourites
                ? <Button variant="outline" onClick={() => setShowFavourites(false)}>Browse All</Button>
                : activeFilterCount > 0
                ? <Button variant="outline" onClick={() => { setStatusFilter(""); setAuthorFilter(""); }}>Clear Filters</Button>
                : <Button variant="primary" onClick={openCreate}><Plus size={15} />Add Entry</Button>}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {entries.map((e) => (
                  <EntryCard key={e._id} entry={e} onEdit={openEdit} onDelete={handleDelete} onClick={setViewing} onToggleFavourite={handleToggleFavourite} />
                ))}
              </div>
              {hasMore && (
                <div className="flex justify-center pt-2">
                  <Button variant="outline" onClick={loadMore} disabled={loadingMore}>{loadingMore ? <><Spinner size="sm" />Loading…</> : "Load More"}</Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {viewing && <EntryDetail entry={viewing} onClose={() => setViewing(null)} onEdit={openEdit} onToggleFavourite={handleToggleFavourite} />}
      <EntryModal open={modalOpen} onClose={() => setModal(false)} onSave={handleSave} initial={editing} />
    </PageWrapper>
  );
}