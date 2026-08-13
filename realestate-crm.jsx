import * as XLSX from "xlsx";
import { useState, useEffect, useRef } from "react";
import {
  Home, Users, Building2, ListChecks, Plus, X, Phone, Mail,
  IndianRupee, Trash2, Pencil, MapPin, Bed, Ruler, Check,
  ChevronDown, LayoutGrid, KeyRound, MessageCircle, CalendarCheck, CalendarClock,
  MessageSquare, PhoneCall, Search, Flame, Thermometer, Snowflake, Table2, Upload, TrendingUp,
} from "lucide-react";

/* ---------- tokens ---------- */
const INK = "#1B2A41";
const PAPER = "#EFEAE0";
const PAPER_LIGHT = "#F7F4EC";
const BRASS = "#A9782F";
const BRASS_LIGHT = "#C79A4B";
const SAGE = "#5C6E58";
const RUST = "#A0503C";
const SLATE = "#5B6B76";

const STAGES = ["Generated", "New", "Contacted", "Qualified", "Negotiation", "Won", "Lost"];
const STAGE_COLOR = {
  Generated: "#8C8275", New: SLATE, Contacted: BRASS, Qualified: "#7E8F4C",
  Negotiation: "#C08A2E", Won: SAGE, Lost: RUST,
};
const PROP_STATUS = ["Available", "Under Offer", "Sold", "Rented"];
const PROP_STATUS_COLOR = {
  Available: SAGE, "Under Offer": BRASS, Sold: RUST, Rented: SLATE,
};

const SITE_VISIT = ["Not scheduled", "Planned", "Done"];
const SITE_VISIT_COLOR = { "Not scheduled": SLATE, Planned: BRASS, Done: SAGE };

const TEMPS = ["Hot", "Warm", "Cold"];
const TEMP_COLOR = { Hot: RUST, Warm: BRASS, Cold: "#5A7A94" };

const uid = () => Math.random().toString(36).slice(2, 10);
const waLink = (phone, message) => {
  if (!phone) return null;
  let digits = phone.replace(/[^\d]/g, "");
  if (digits.length === 10) digits = "91" + digits; // default to India country code
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
};
const waTemplates = (lead) => {
  const name = lead.name?.split(" ")[0] || "there";
  return [
    { label: "Introduce myself", text: `Hi ${name}, this is regarding the property you enquired about. Do you have a few minutes to talk?` },
    { label: "Follow up", text: `Hi ${name}, just following up on our last conversation. Any update on your side?` },
    { label: "Confirm site visit", text: `Hi ${name}, confirming your site visit${lead.siteVisitDate ? ` on ${lead.siteVisitDate}` : ""}. Let me know if the timing works for you.` },
    { label: "Share details", text: `Hi ${name}, sharing the details of ${lead.interest || "the property"} as discussed. Let me know your thoughts.` },
  ];
};
const callLink = (phone) => (phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : null);
const smsLink = (phone) => (phone ? `sms:${phone.replace(/[^\d+]/g, "")}` : null);
const mailLink = (email) => (email ? `mailto:${email}` : null);
const initials = (name) =>
  (name || "?").trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
const fmtINR = (n) => {
  if (!n && n !== 0) return "—";
  const num = Number(n);
  if (isNaN(num)) return n;
  return "₹" + num.toLocaleString("en-IN");
};

/* ---------- storage ---------- */
const STORAGE_KEY = "crm-data-v1";
const EMPTY = { leads: [], properties: [], tasks: [] };

const demoData = () => {
  const today = new Date();
  const iso = (offsetDays) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().slice(0, 10);
  };
  return {
    leads: [
      { id: uid(), name: "Karthik Rajeev", phone: "8860073924", email: "karthik.rajeev@gmail.com", stage: "Negotiation", temperature: "Hot", source: "Facebook", budget: "8500000", interest: "3BHK in Whitefield", siteVisit: "Planned", siteVisitDate: iso(2), remark: "Wants to see the clubhouse before deciding.", notes: "Prefers weekend visits.", createdAt: Date.now() },
      { id: uid(), name: "Ananya Iyer", phone: "9845012233", email: "ananya.iyer@gmail.com", stage: "Qualified", temperature: "Warm", source: "MagicBricks", budget: "6200000", interest: "2BHK near ORR", siteVisit: "Done", siteVisitDate: iso(-3), remark: "Liked the layout, comparing with one more project.", notes: "", createdAt: Date.now() },
      { id: uid(), name: "Suresh Menon", phone: "9900011122", email: "", stage: "New", temperature: "Cold", source: "Referral", budget: "4500000", interest: "1BHK for investment", siteVisit: "Not scheduled", siteVisitDate: "", remark: "", notes: "Referred by Karthik.", createdAt: Date.now() },
      { id: uid(), name: "Divya Prakash", phone: "9741122334", email: "divya.p@gmail.com", stage: "Contacted", temperature: "Warm", source: "99acres", budget: "9800000", interest: "Villa in Sarjapur", siteVisit: "Planned", siteVisitDate: iso(5), remark: "Following up after loan pre-approval.", notes: "", createdAt: Date.now() },
      { id: uid(), name: "Ramesh Bhat", phone: "9880099776", email: "ramesh.bhat@yahoo.com", stage: "Won", temperature: "Hot", source: "Direct", budget: "7200000", interest: "3BHK in Indiranagar", siteVisit: "Done", siteVisitDate: iso(-10), remark: "Deal closed, token amount received.", notes: "", createdAt: Date.now() },
      { id: uid(), name: "Meera Krishnan", phone: "9741133445", email: "", stage: "Lost", temperature: "Cold", source: "Gmail", budget: "5000000", interest: "2BHK in Electronic City", siteVisit: "Not scheduled", siteVisitDate: "", remark: "Went with a competitor project.", notes: "", createdAt: Date.now() },
    ],
    properties: [
      { id: uid(), title: "Sunrise Residency, 3BHK", address: "Whitefield, Bengaluru", price: "8500000", type: "Apartment", status: "Available", bedrooms: "3", area: "1450", notes: "", createdAt: Date.now() },
      { id: uid(), title: "Palm Meadows Villa", address: "Sarjapur Road, Bengaluru", price: "9800000", type: "Villa", status: "Available", bedrooms: "4", area: "2600", notes: "Corner plot, east-facing.", createdAt: Date.now() },
      { id: uid(), title: "Green Court, 2BHK", address: "Outer Ring Road, Bengaluru", price: "6200000", type: "Apartment", status: "Under Offer", bedrooms: "2", area: "1120", notes: "", createdAt: Date.now() },
      { id: uid(), title: "Orchid Heights, 3BHK", address: "Indiranagar, Bengaluru", price: "7200000", type: "Apartment", status: "Sold", bedrooms: "3", area: "1600", notes: "", createdAt: Date.now() },
    ],
    tasks: [
      { id: uid(), title: "Call Karthik about clubhouse tour", dueDate: iso(0), leadId: null, done: false },
      { id: uid(), title: "Send loan documents checklist to Divya", dueDate: iso(1), leadId: null, done: false },
      { id: uid(), title: "Follow up with Suresh on budget", dueDate: iso(3), leadId: null, done: false },
      { id: uid(), title: "Collect registration papers for Ramesh's deal", dueDate: iso(-1), leadId: null, done: true },
    ],
  };
};

async function loadData() {
  try {
    const r = await window.storage.get(STORAGE_KEY, false);
    if (r) return JSON.parse(r.value);
    const seeded = demoData();
    await saveData(seeded);
    return seeded;
  } catch (e) {
    return EMPTY;
  }
}
async function saveData(data) {
  try {
    await window.storage.set(STORAGE_KEY, JSON.stringify(data), false);
  } catch (e) {
    console.error("save failed", e);
  }
}

/* ---------- small UI atoms ---------- */
function Stamp({ text, color }) {
  return (
    <span
      className="inline-block text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 -rotate-3 select-none"
      style={{
        color,
        border: `1.5px dashed ${color}`,
        borderRadius: "3px",
        background: "transparent",
      }}
    >
      {text}
    </span>
  );
}

function TagHole() {
  return (
    <div className="absolute -top-2 left-5 w-4 h-4 rounded-full" style={{ background: PAPER, border: `1.5px solid ${INK}30` }} />
  );
}

function IconBtn({ onClick, children, title, danger }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="p-1.5 rounded hover:bg-black/5 transition-colors"
      style={{ color: danger ? RUST : SLATE }}
    >
      {children}
    </button>
  );
}

function StatCard({ label, value, icon, color, onClick }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className="flex items-center gap-3 p-4 rounded-lg text-left w-full"
      style={{ background: PAPER_LIGHT, border: `1px solid ${INK}14`, cursor: onClick ? "pointer" : "default" }}
    >
      <div className="p-2 rounded-md" style={{ background: `${color}1A`, color }}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-serif font-semibold" style={{ color: INK }}>{value}</div>
        <div className="text-[11px] uppercase tracking-wide" style={{ color: SLATE }}>{label}</div>
      </div>
    </Tag>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "#1B2A41CC" }}>
      <div className="w-full max-w-md rounded-lg shadow-xl overflow-hidden" style={{ background: PAPER_LIGHT }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${INK}14` }}>
          <h3 className="font-serif text-lg" style={{ color: INK }}>{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-black/5"><X size={18} color={SLATE} /></button>
        </div>
        <div className="p-5 max-h-[70vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block mb-3">
      <span className="block text-[11px] uppercase tracking-wide mb-1" style={{ color: SLATE }}>{label}</span>
      {children}
    </label>
  );
}

const inputCls = "w-full px-3 py-2 rounded-md text-sm outline-none";
const inputStyle = { background: "#fff", border: `1px solid ${INK}20`, color: INK };

/* ---------- lead form ---------- */
function LeadForm({ initial, onSave, onClose }) {
  const [f, setF] = useState(
    initial || {
      name: "", phone: "", email: "", stage: "New", source: "", budget: "", interest: "",
      temperature: "Warm", siteVisit: "Not scheduled", siteVisitDate: "", remark: "", notes: "",
    }
  );
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <Modal title={initial ? "Edit lead" : "Add lead"} onClose={onClose}>
      <Field label="Full name"><input className={inputCls} style={inputStyle} value={f.name} onChange={set("name")} placeholder="Priya Sharma" /></Field>
      <Field label="Phone"><input className={inputCls} style={inputStyle} value={f.phone} onChange={set("phone")} placeholder="+91 98765 43210" /></Field>
      <Field label="Email"><input className={inputCls} style={inputStyle} value={f.email} onChange={set("email")} placeholder="priya@email.com" /></Field>
      <Field label="Client is">
        <select className={inputCls} style={inputStyle} value={f.temperature} onChange={set("temperature")}>
          {TEMPS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </Field>
      <Field label="Stage">
        <select className={inputCls} style={inputStyle} value={f.stage} onChange={set("stage")}>
          {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </Field>
      <Field label="Source"><input className={inputCls} style={inputStyle} value={f.source} onChange={set("source")} placeholder="Referral, Website, Walk-in..." /></Field>
      <Field label="Budget (₹)"><input className={inputCls} style={inputStyle} value={f.budget} onChange={set("budget")} placeholder="7500000" /></Field>
      <Field label="Interested in"><input className={inputCls} style={inputStyle} value={f.interest} onChange={set("interest")} placeholder="3BHK in Whitefield" /></Field>
      <Field label="Site visit">
        <select className={inputCls} style={inputStyle} value={f.siteVisit} onChange={set("siteVisit")}>
          {SITE_VISIT.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </Field>
      <Field label="Site visit date"><input type="date" className={inputCls} style={inputStyle} value={f.siteVisitDate} onChange={set("siteVisitDate")} /></Field>
      <Field label="Remark"><input className={inputCls} style={inputStyle} value={f.remark} onChange={set("remark")} placeholder="Interested, needs loan approval..." /></Field>
      <Field label="Notes"><textarea className={inputCls} style={{ ...inputStyle, minHeight: 70 }} value={f.notes} onChange={set("notes")} /></Field>
      <button
        onClick={() => f.name.trim() && onSave(f)}
        className="w-full mt-2 py-2.5 rounded-md text-sm font-medium tracking-wide"
        style={{ background: INK, color: PAPER_LIGHT }}
      >
        Save lead
      </button>
    </Modal>
  );
}

/* ---------- property form ---------- */
function PropertyForm({ initial, onSave, onClose }) {
  const [f, setF] = useState(
    initial || { title: "", address: "", price: "", type: "Apartment", status: "Available", bedrooms: "", area: "", notes: "" }
  );
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <Modal title={initial ? "Edit property" : "Add property"} onClose={onClose}>
      <Field label="Title"><input className={inputCls} style={inputStyle} value={f.title} onChange={set("title")} placeholder="Sunrise Residency, 3BHK" /></Field>
      <Field label="Address"><input className={inputCls} style={inputStyle} value={f.address} onChange={set("address")} placeholder="Whitefield, Bengaluru" /></Field>
      <Field label="Price (₹)"><input className={inputCls} style={inputStyle} value={f.price} onChange={set("price")} placeholder="8500000" /></Field>
      <Field label="Type">
        <select className={inputCls} style={inputStyle} value={f.type} onChange={set("type")}>
          {["Apartment", "House", "Villa", "Plot", "Commercial"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </Field>
      <Field label="Status">
        <select className={inputCls} style={inputStyle} value={f.status} onChange={set("status")}>
          {PROP_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </Field>
      <Field label="Bedrooms"><input className={inputCls} style={inputStyle} value={f.bedrooms} onChange={set("bedrooms")} placeholder="3" /></Field>
      <Field label="Area (sq.ft)"><input className={inputCls} style={inputStyle} value={f.area} onChange={set("area")} placeholder="1450" /></Field>
      <Field label="Notes"><textarea className={inputCls} style={{ ...inputStyle, minHeight: 70 }} value={f.notes} onChange={set("notes")} /></Field>
      <button
        onClick={() => f.title.trim() && onSave(f)}
        className="w-full mt-2 py-2.5 rounded-md text-sm font-medium tracking-wide"
        style={{ background: INK, color: PAPER_LIGHT }}
      >
        Save property
      </button>
    </Modal>
  );
}

/* ---------- task form ---------- */
function TaskForm({ leads, onSave, onClose }) {
  const [f, setF] = useState({ title: "", dueDate: "", leadId: "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <Modal title="Add task" onClose={onClose}>
      <Field label="Task"><input className={inputCls} style={inputStyle} value={f.title} onChange={set("title")} placeholder="Call about site visit" /></Field>
      <Field label="Due date"><input type="date" className={inputCls} style={inputStyle} value={f.dueDate} onChange={set("dueDate")} /></Field>
      <Field label="Related lead (optional)">
        <select className={inputCls} style={inputStyle} value={f.leadId} onChange={set("leadId")}>
          <option value="">— none —</option>
          {leads.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </Field>
      <button
        onClick={() => f.title.trim() && onSave(f)}
        className="w-full mt-2 py-2.5 rounded-md text-sm font-medium tracking-wide"
        style={{ background: INK, color: PAPER_LIGHT }}
      >
        Add task
      </button>
    </Modal>
  );
}

function TempIcon({ temp, size = 12 }) {
  if (temp === "Hot") return <Flame size={size} color={TEMP_COLOR.Hot} />;
  if (temp === "Cold") return <Snowflake size={size} color={TEMP_COLOR.Cold} />;
  return <Thermometer size={size} color={TEMP_COLOR.Warm} />;
}

/* ---------- lead card ---------- */
function LeadCard({ lead, onEdit, onDelete, onStageChange, onOpen }) {
  const wa = waLink(lead.phone);
  return (
    <div className="relative mt-3 p-3.5 rounded-md shadow-sm" style={{ background: "#fff", border: `1px solid ${INK}14` }}>
      <TagHole />
      <div className="flex items-start justify-between gap-2">
        <button onClick={() => onOpen(lead)} className="text-left">
          <div className="flex items-center gap-1.5">
            <TempIcon temp={lead.temperature} />
            <span className="font-serif text-[15px] hover:underline" style={{ color: INK }}>{lead.name}</span>
          </div>
          {lead.interest && <div className="text-xs mt-0.5" style={{ color: SLATE }}>{lead.interest}</div>}
        </button>
        <div className="flex shrink-0">
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" title="Chat on WhatsApp" className="p-1.5 rounded hover:bg-black/5">
              <MessageCircle size={14} color={SAGE} />
            </a>
          )}
          <IconBtn onClick={() => onEdit(lead)} title="Edit"><Pencil size={14} /></IconBtn>
          <IconBtn onClick={() => onDelete(lead.id)} title="Delete" danger><Trash2 size={14} /></IconBtn>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mt-2 text-xs" style={{ color: SLATE }}>
        {lead.phone && <span className="flex items-center gap-1"><Phone size={11} />{lead.phone}</span>}
        {lead.budget && <span className="flex items-center gap-1"><IndianRupee size={11} />{fmtINR(lead.budget)}</span>}
      </div>
      {lead.siteVisit && lead.siteVisit !== "Not scheduled" && (
        <div className="flex items-center gap-1 mt-2 text-xs" style={{ color: SITE_VISIT_COLOR[lead.siteVisit] }}>
          {lead.siteVisit === "Done" ? <CalendarCheck size={12} /> : <CalendarClock size={12} />}
          Site visit {lead.siteVisit.toLowerCase()}{lead.siteVisitDate ? ` · ${lead.siteVisitDate}` : ""}
        </div>
      )}
      {lead.remark && (
        <div className="mt-2 text-xs italic px-2 py-1 rounded" style={{ color: INK, background: `${BRASS}14` }}>
          "{lead.remark}"
        </div>
      )}
      <div className="flex items-center justify-between mt-3">
        <Stamp text={lead.stage} color={STAGE_COLOR[lead.stage]} />
        <select
          value={lead.stage}
          onChange={(e) => onStageChange(lead.id, e.target.value)}
          className="text-xs rounded px-1.5 py-1 outline-none"
          style={{ border: `1px solid ${INK}20`, color: SLATE, background: PAPER_LIGHT }}
        >
          {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
    </div>
  );
}

/* ---------- lead detail modal ---------- */
function LeadDetailModal({ lead, onClose, onEdit, onStageChange, onTempChange, onDelete }) {
  const [showWaTemplates, setShowWaTemplates] = useState(false);
  const [toast, setToast] = useState("");
  const wa = waLink(lead.phone);
  const mail = mailLink(lead.email);
  const templates = waTemplates(lead);

  const copyNumber = async (label) => {
    if (!lead.phone) return;
    try {
      await navigator.clipboard.writeText(lead.phone);
      setToast(`Number copied — paste it into your ${label} app`);
    } catch (e) {
      setToast(lead.phone);
    }
    setTimeout(() => setToast(""), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "#1B2A41CC" }}>
      <div className="w-full max-w-md rounded-lg shadow-xl overflow-hidden relative" style={{ background: PAPER_LIGHT }}>
        {toast && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 rounded-full text-xs shadow" style={{ background: INK, color: PAPER_LIGHT }}>
            {toast}
          </div>
        )}
        <div className="p-5" style={{ background: INK, color: PAPER_LIGHT }}>
          <div className="flex items-center justify-between mb-4">
            <button onClick={onClose} className="p-1 rounded hover:bg-white/10"><X size={18} /></button>
            <button onClick={() => onEdit(lead)} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs" style={{ border: `1px solid ${PAPER_LIGHT}40` }}>
              <Pencil size={12} /> Edit
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full flex items-center justify-center font-serif text-lg shrink-0" style={{ background: BRASS_LIGHT, color: INK }}>
              {initials(lead.name)}
            </div>
            <div className="min-w-0">
              <div className="font-serif text-lg truncate">{lead.name}</div>
              {lead.email && <div className="text-xs flex items-center gap-1 truncate" style={{ color: `${PAPER_LIGHT}B0` }}><Mail size={11} />{lead.email}</div>}
              {lead.phone && <div className="text-xs flex items-center gap-1" style={{ color: `${PAPER_LIGHT}B0` }}><Phone size={11} />{lead.phone}</div>}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-4">
            <button onClick={() => copyNumber("phone")} className="flex flex-col items-center gap-1 py-2 rounded-md text-[10px]" style={{ border: `1px solid ${PAPER_LIGHT}30`, opacity: lead.phone ? 1 : 0.4 }}>
              <PhoneCall size={15} /> Call
            </button>
            <button onClick={() => copyNumber("messages")} className="flex flex-col items-center gap-1 py-2 rounded-md text-[10px]" style={{ border: `1px solid ${PAPER_LIGHT}30`, opacity: lead.phone ? 1 : 0.4 }}>
              <MessageSquare size={15} /> SMS
            </button>
            <a
              href={wa || "#"}
              target="_blank" rel="noopener noreferrer"
              className="relative flex flex-col items-center gap-1 py-2 rounded-md text-[10px]"
              style={{ background: wa ? "#25D36630" : "transparent", border: `1px solid ${wa ? "#25D366" : PAPER_LIGHT + "30"}`, opacity: wa ? 1 : 0.4, pointerEvents: wa ? "auto" : "none" }}
            >
              <MessageCircle size={15} color="#25D366" /> WhatsApp
            </a>
            <a href={mail || "#"} className="flex flex-col items-center gap-1 py-2 rounded-md text-[10px]" style={{ border: `1px solid ${PAPER_LIGHT}30`, opacity: mail ? 1 : 0.4 }}>
              <Mail size={15} /> Email
            </a>
          </div>
          {wa && (
            <button
              onClick={() => setShowWaTemplates((s) => !s)}
              className="mt-2 text-[10px] underline"
              style={{ color: `${PAPER_LIGHT}80` }}
            >
              {showWaTemplates ? "Hide quick messages" : "Or send with a ready-made message"}
            </button>
          )}
          {showWaTemplates && wa && (
            <div className="mt-3 p-3 rounded-md" style={{ background: `${PAPER_LIGHT}15`, border: `1px solid ${PAPER_LIGHT}25` }}>
              <div className="text-[10px] uppercase tracking-wide mb-2" style={{ color: `${PAPER_LIGHT}90` }}>Send with a quick message</div>
              <div className="space-y-1.5">
                {templates.map((t) => (
                  <a
                    key={t.label}
                    href={waLink(lead.phone, t.text)}
                    target="_blank" rel="noopener noreferrer"
                    onClick={() => setShowWaTemplates(false)}
                    className="block px-2.5 py-2 rounded text-xs"
                    style={{ background: "#25D36620", color: PAPER_LIGHT }}
                  >
                    <span className="font-medium">{t.label}</span>
                    <div className="text-[10px] mt-0.5 truncate" style={{ color: `${PAPER_LIGHT}90` }}>{t.text}</div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-5 max-h-[50vh] overflow-y-auto">
          <div className="text-[11px] uppercase tracking-wide mb-2" style={{ color: SLATE }}>Client is</div>
          <div className="flex gap-2 mb-5">
            {TEMPS.map((t) => (
              <button
                key={t}
                onClick={() => onTempChange(lead.id, t)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
                style={{
                  background: lead.temperature === t ? `${TEMP_COLOR[t]}20` : "transparent",
                  border: `1.5px solid ${lead.temperature === t ? TEMP_COLOR[t] : INK + "20"}`,
                  color: lead.temperature === t ? TEMP_COLOR[t] : SLATE,
                }}
              >
                <TempIcon temp={t} size={13} /> {t}
              </button>
            ))}
          </div>

          <div className="text-[11px] uppercase tracking-wide mb-2" style={{ color: SLATE }}>Lead status</div>
          <div className="flex items-center gap-2 mb-1">
            <Stamp text={lead.stage} color={STAGE_COLOR[lead.stage]} />
            <select
              value={lead.stage}
              onChange={(e) => onStageChange(lead.id, e.target.value)}
              className="text-xs rounded px-1.5 py-1 outline-none"
              style={{ border: `1px solid ${INK}20`, color: SLATE, background: "#fff" }}
            >
              {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {lead.remark && (
            <div className="mt-2 text-sm italic px-3 py-2 rounded" style={{ color: INK, background: `${BRASS}14` }}>
              "{lead.remark}"
            </div>
          )}

          {lead.siteVisit && lead.siteVisit !== "Not scheduled" && (
            <div className="flex items-center gap-1.5 mt-3 text-sm" style={{ color: SITE_VISIT_COLOR[lead.siteVisit] }}>
              {lead.siteVisit === "Done" ? <CalendarCheck size={14} /> : <CalendarClock size={14} />}
              Site visit {lead.siteVisit.toLowerCase()}{lead.siteVisitDate ? ` · ${lead.siteVisitDate}` : ""}
            </div>
          )}

          {lead.interest && (
            <div className="mt-4 text-sm" style={{ color: INK }}>
              <span className="text-[11px] uppercase tracking-wide block mb-1" style={{ color: SLATE }}>Interested in</span>
              {lead.interest}{lead.budget ? ` · ${fmtINR(lead.budget)}` : ""}
            </div>
          )}
          {lead.notes && (
            <div className="mt-4 text-sm" style={{ color: INK }}>
              <span className="text-[11px] uppercase tracking-wide block mb-1" style={{ color: SLATE }}>Notes</span>
              {lead.notes}
            </div>
          )}
          {lead.source && (
            <div className="mt-4 text-xs" style={{ color: SLATE }}>Source: {lead.source}</div>
          )}

          <button
            onClick={() => { onDelete(lead.id); onClose(); }}
            className="w-full mt-6 py-2 rounded-md text-xs font-medium flex items-center justify-center gap-1.5"
            style={{ border: `1px solid ${RUST}50`, color: RUST }}
          >
            <Trash2 size={13} /> Delete lead
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- property card ---------- */
function PropertyCard({ p, onEdit, onDelete }) {
  return (
    <div className="relative p-4 rounded-md shadow-sm" style={{ background: "#fff", border: `1px solid ${INK}14` }}>
      <TagHole />
      <div
        className="h-20 rounded mb-3 flex items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${BRASS}22, ${SAGE}22)` }}
      >
        <KeyRound size={26} color={BRASS} />
      </div>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-serif text-[15px]" style={{ color: INK }}>{p.title}</div>
          <div className="text-xs mt-0.5 flex items-center gap-1" style={{ color: SLATE }}><MapPin size={11} />{p.address}</div>
        </div>
        <div className="flex shrink-0">
          <IconBtn onClick={() => onEdit(p)} title="Edit"><Pencil size={14} /></IconBtn>
          <IconBtn onClick={() => onDelete(p.id)} title="Delete" danger><Trash2 size={14} /></IconBtn>
        </div>
      </div>
      <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: SLATE }}>
        {p.bedrooms && <span className="flex items-center gap-1"><Bed size={11} />{p.bedrooms} BHK</span>}
        {p.area && <span className="flex items-center gap-1"><Ruler size={11} />{p.area} sqft</span>}
      </div>
      <div className="flex items-center justify-between mt-3">
        <span className="text-sm font-medium" style={{ color: INK }}>{fmtINR(p.price)}</span>
        <Stamp text={p.status} color={PROP_STATUS_COLOR[p.status]} />
      </div>
    </div>
  );
}

/* ---------- views ---------- */
function FollowUpRow({ lead }) {
  const wa = waLink(lead.phone);
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-md" style={{ background: "#fff", border: `1px solid ${INK}14` }}>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate" style={{ color: INK }}>{lead.name}</div>
        <div className="text-[11px] truncate" style={{ color: SLATE }}>
          {lead.siteVisit && lead.siteVisit !== "Not scheduled" && `Site visit ${lead.siteVisit.toLowerCase()}${lead.siteVisitDate ? ` · ${lead.siteVisitDate}` : ""}`}
          {lead.remark && <span className="italic">{lead.siteVisit && lead.siteVisit !== "Not scheduled" ? " · " : ""}"{lead.remark}"</span>}
        </div>
      </div>
      {wa && (
        <a
          href={wa} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium shrink-0"
          style={{ background: `${SAGE}1A`, color: SAGE }}
          title="Chat on WhatsApp"
        >
          <MessageCircle size={13} /> WhatsApp
        </a>
      )}
    </div>
  );
}

function Dashboard({ leads, properties, tasks, onNavigate }) {
  const openTasks = tasks.filter((t) => !t.done);
  const today = new Date().toISOString().slice(0, 10);
  const dueToday = openTasks.filter((t) => t.dueDate === today);
  const active = leads.filter((l) => !["Won", "Lost"].includes(l.stage));
  const won = leads.filter((l) => l.stage === "Won");
  const available = properties.filter((p) => p.status === "Available");

  const visitsPlanned = leads.filter((l) => l.siteVisit === "Planned");
  const visitsDone = leads.filter((l) => l.siteVisit === "Done");
  const withRemarks = leads.filter((l) => l.remark);

  const max = Math.max(1, ...STAGES.map((s) => leads.filter((l) => l.stage === s).length));

  const followUpFeed = leads
    .filter((l) => l.siteVisit === "Planned" || l.remark)
    .slice(0, 8);

  return (
    <div>
      <h2 className="font-serif text-2xl mb-1" style={{ color: INK }}>Dashboard</h2>
      <p className="text-sm mb-5" style={{ color: SLATE }}>Today's snapshot of the pipeline.</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <StatCard label="Active leads" value={active.length} icon={<Users size={18} />} color={BRASS} onClick={() => onNavigate("leads", "Active")} />
        <StatCard label="Deals won" value={won.length} icon={<Check size={18} />} color={SAGE} onClick={() => onNavigate("leads", "Won")} />
        <StatCard label="Listings available" value={available.length} icon={<Building2 size={18} />} color={SLATE} onClick={() => onNavigate("properties")} />
        <StatCard label="Tasks due today" value={dueToday.length} icon={<ListChecks size={18} />} color={RUST} onClick={() => onNavigate("tasks")} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatCard label="Site visit plan" value={visitsPlanned.length} icon={<CalendarClock size={18} />} color={BRASS} onClick={() => onNavigate("leads", "All")} />
        <StatCard label="Site visit done" value={visitsDone.length} icon={<CalendarCheck size={18} />} color={SAGE} onClick={() => onNavigate("leads", "All")} />
        <StatCard label="Follow-ups open" value={openTasks.length} icon={<ListChecks size={18} />} color={SLATE} onClick={() => onNavigate("tasks")} />
        <StatCard label="Leads with remarks" value={withRemarks.length} icon={<Pencil size={18} />} color={RUST} onClick={() => onNavigate("leads", "All")} />
      </div>

      {followUpFeed.length > 0 && (
        <div className="mb-8">
          <h3 className="font-serif text-base mb-3" style={{ color: INK }}>Site visits & follow-ups</h3>
          <div className="space-y-2">
            {followUpFeed.map((l) => <FollowUpRow key={l.id} lead={l} />)}
          </div>
        </div>
      )}

      <div className="p-5 rounded-lg" style={{ background: PAPER_LIGHT, border: `1px solid ${INK}14` }}>
        <h3 className="font-serif text-base mb-4" style={{ color: INK }}>Pipeline by stage</h3>
        <div className="space-y-2.5">
          {STAGES.map((s) => {
            const count = leads.filter((l) => l.stage === s).length;
            return (
              <div key={s} className="flex items-center gap-3">
                <span className="w-24 text-xs uppercase tracking-wide" style={{ color: SLATE }}>{s}</span>
                <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: `${INK}0D` }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${(count / max) * 100}%`, background: STAGE_COLOR[s] }}
                  />
                </div>
                <span className="w-5 text-xs text-right font-medium" style={{ color: INK }}>{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function LeadTableRow({ lead, onOpen, onEdit, onDelete }) {
  const wa = waLink(lead.phone);
  const copyNumber = () => lead.phone && navigator.clipboard.writeText(lead.phone).catch(() => {});
  return (
    <tr style={{ borderBottom: `1px solid ${INK}12` }}>
      <td className="py-2.5 pr-3">
        <button onClick={() => onOpen(lead)} className="flex items-center gap-2 text-left">
          <TempIcon temp={lead.temperature} />
          <span className="text-sm font-medium hover:underline" style={{ color: INK }}>{lead.name}</span>
        </button>
      </td>
      <td className="py-2.5 pr-3 text-xs" style={{ color: SLATE }}>{lead.phone || "—"}</td>
      <td className="py-2.5 pr-3"><Stamp text={lead.stage} color={STAGE_COLOR[lead.stage]} /></td>
      <td className="py-2.5 pr-3 text-xs" style={{ color: SLATE }}>{lead.source || "—"}</td>
      <td className="py-2.5 pr-3 text-xs" style={{ color: SLATE }}>
        {lead.siteVisit && lead.siteVisit !== "Not scheduled" ? `${lead.siteVisit}${lead.siteVisitDate ? ` · ${lead.siteVisitDate}` : ""}` : "—"}
      </td>
      <td className="py-2.5">
        <div className="flex items-center gap-1">
          {wa && <a href={wa} target="_blank" rel="noopener noreferrer" title="WhatsApp" className="p-1.5 rounded hover:bg-black/5"><MessageCircle size={14} color="#25D366" /></a>}
          {lead.phone && <IconBtn onClick={copyNumber} title="Copy number to call"><PhoneCall size={14} /></IconBtn>}
          <IconBtn onClick={() => onEdit(lead)} title="Edit"><Pencil size={14} /></IconBtn>
          <IconBtn onClick={() => onDelete(lead.id)} title="Delete" danger><Trash2 size={14} /></IconBtn>
        </div>
      </td>
    </tr>
  );
}

function LeadsView({ leads, onAdd, onEdit, onDelete, onStageChange, onOpen, onImport, presetTab }) {
  const [layout, setLayout] = useState(presetTab ? "table" : "kanban"); // kanban | table
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState(presetTab || "All");
  const [importMsg, setImportMsg] = useState("");
  const fileInputRef = useRef(null);

  const HEADER_MAP = {
    name: ["name", "full name", "lead name", "client name"],
    phone: ["phone", "phone number", "mobile", "contact", "contact number"],
    email: ["email", "email address", "e-mail"],
    source: ["source", "lead source"],
    budget: ["budget", "price", "budget (₹)"],
    interest: ["interest", "interested in", "property", "requirement"],
  };
  const normalizeKey = (k) => String(k || "").trim().toLowerCase();
  const findField = (row, aliases) => {
    for (const key of Object.keys(row)) {
      if (aliases.includes(normalizeKey(key))) return row[key];
    }
    return "";
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        const mapped = rows
          .map((r) => ({
            name: String(findField(r, HEADER_MAP.name) || "").trim(),
            phone: String(findField(r, HEADER_MAP.phone) || "").trim(),
            email: String(findField(r, HEADER_MAP.email) || "").trim(),
            source: String(findField(r, HEADER_MAP.source) || "").trim(),
            budget: String(findField(r, HEADER_MAP.budget) || "").trim(),
            interest: String(findField(r, HEADER_MAP.interest) || "").trim(),
          }))
          .filter((r) => r.name || r.phone);
        if (mapped.length === 0) {
          setImportMsg("No usable rows found — make sure your sheet has a Name or Phone column.");
        } else {
          onImport(mapped);
          setImportMsg(`Imported ${mapped.length} lead${mapped.length === 1 ? "" : "s"} into "Generated."`);
        }
      } catch (err) {
        setImportMsg("Couldn't read that file — please upload a .xlsx, .xls, or .csv file.");
      }
      setTimeout(() => setImportMsg(""), 5000);
      e.target.value = "";
    };
    reader.readAsArrayBuffer(file);
  };

  const TABS = ["All", "Active", "Generated", "New", "Contacted", "Qualified", "Negotiation", "Won", "Lost"];

  const filtered = leads.filter((l) => {
    const matchesTab =
      tab === "All" ||
      (tab === "Active" ? !["Won", "Lost"].includes(l.stage) : l.stage === tab);
    const q = query.trim().toLowerCase();
    const matchesQuery = !q || l.name.toLowerCase().includes(q) || (l.phone || "").includes(q) || (l.interest || "").toLowerCase().includes(q);
    return matchesTab && matchesQuery;
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="font-serif text-2xl" style={{ color: INK }}>Leads</h2>
          <p className="text-sm" style={{ color: SLATE }}>{layout === "kanban" ? "Kanban view — move a lead by changing its stage." : "Table view — search, filter, and act in one place."}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md overflow-hidden" style={{ border: `1px solid ${INK}20` }}>
            <button onClick={() => setLayout("kanban")} className="p-2" style={{ background: layout === "kanban" ? INK : "transparent", color: layout === "kanban" ? PAPER_LIGHT : SLATE }} title="Kanban view">
              <LayoutGrid size={15} />
            </button>
            <button onClick={() => setLayout("table")} className="p-2" style={{ background: layout === "table" ? INK : "transparent", color: layout === "table" ? PAPER_LIGHT : SLATE }} title="Table view">
              <Table2 size={15} />
            </button>
          </div>
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 px-3.5 py-2 rounded-md text-sm font-medium" style={{ background: "#fff", color: INK, border: `1px solid ${INK}20` }}>
            <Upload size={15} /> Import Excel
          </button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="hidden" />
          <button onClick={onAdd} className="flex items-center gap-1.5 px-3.5 py-2 rounded-md text-sm font-medium" style={{ background: INK, color: PAPER_LIGHT }}>
            <Plus size={15} /> Add lead
          </button>
        </div>
      </div>

      {importMsg && (
        <div className="mb-4 px-3 py-2 rounded-md text-xs" style={{ background: `${SAGE}1A`, color: SAGE, border: `1px solid ${SAGE}40` }}>
          {importMsg}
        </div>
      )}

      {layout === "table" && (
        <div className="mb-4">
          <div className="relative mb-3 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" color={SLATE} />
            <input
              value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search leads..."
              className="w-full pl-8 pr-3 py-2 rounded-md text-sm outline-none" style={{ background: "#fff", border: `1px solid ${INK}20`, color: INK }}
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {TABS.map((t) => (
              <button
                key={t} onClick={() => setTab(t)}
                className="px-3 py-1.5 rounded-full text-xs font-medium"
                style={{ background: tab === t ? INK : "#fff", color: tab === t ? PAPER_LIGHT : SLATE, border: `1px solid ${INK}20` }}
              >
                {t} {t === "All" ? `(${leads.length})` : t === "Active" ? `(${leads.filter((l) => !["Won", "Lost"].includes(l.stage)).length})` : `(${leads.filter((l) => l.stage === t).length})`}
              </button>
            ))}
          </div>
        </div>
      )}

      {layout === "kanban" ? (
        <div className="flex gap-4 overflow-x-auto pb-3">
          {STAGES.map((stage) => {
            const items = leads.filter((l) => l.stage === stage);
            return (
              <div key={stage} className="min-w-[240px] w-[240px] shrink-0">
                <div className="flex items-center gap-2 px-1">
                  <span className="w-2 h-2 rounded-full" style={{ background: STAGE_COLOR[stage] }} />
                  <span className="text-xs uppercase tracking-wide font-medium" style={{ color: SLATE }}>{stage}</span>
                  <span className="text-xs" style={{ color: `${SLATE}99` }}>({items.length})</span>
                </div>
                {items.map((l) => (
                  <LeadCard key={l.id} lead={l} onEdit={onEdit} onDelete={onDelete} onStageChange={onStageChange} onOpen={onOpen} />
                ))}
                {items.length === 0 && <div className="mt-3 text-xs italic" style={{ color: `${SLATE}80` }}>No leads here yet.</div>}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg overflow-x-auto" style={{ background: PAPER_LIGHT, border: `1px solid ${INK}14` }}>
          {filtered.length === 0 ? (
            <div className="p-6 text-sm italic" style={{ color: `${SLATE}90` }}>No leads match this view.</div>
          ) : (
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide" style={{ color: SLATE }}>
                  <th className="py-2.5 px-4">Lead</th>
                  <th className="py-2.5">Phone</th>
                  <th className="py-2.5">Status</th>
                  <th className="py-2.5">Source</th>
                  <th className="py-2.5">Site visit</th>
                  <th className="py-2.5">Actions</th>
                </tr>
              </thead>
              <tbody className="px-4">
                {filtered.map((l) => (
                  <LeadTableRow key={l.id} lead={l} onOpen={onOpen} onEdit={onEdit} onDelete={onDelete} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

function PropertiesView({ properties, onAdd, onEdit, onDelete }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-serif text-2xl" style={{ color: INK }}>Properties</h2>
          <p className="text-sm" style={{ color: SLATE }}>Every listing on the books.</p>
        </div>
        <button onClick={onAdd} className="flex items-center gap-1.5 px-3.5 py-2 rounded-md text-sm font-medium" style={{ background: INK, color: PAPER_LIGHT }}>
          <Plus size={15} /> Add property
        </button>
      </div>
      {properties.length === 0 ? (
        <div className="text-sm italic" style={{ color: `${SLATE}90` }}>No properties listed yet — add your first one.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((p) => <PropertyCard key={p.id} p={p} onEdit={onEdit} onDelete={onDelete} />)}
        </div>
      )}
    </div>
  );
}

function TasksView({ tasks, leads, onAdd, onToggle, onDelete }) {
  const sorted = [...tasks].sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"));
  const leadName = (id) => leads.find((l) => l.id === id)?.name;
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-serif text-2xl" style={{ color: INK }}>Tasks</h2>
          <p className="text-sm" style={{ color: SLATE }}>Follow-ups and reminders.</p>
        </div>
        <button onClick={onAdd} className="flex items-center gap-1.5 px-3.5 py-2 rounded-md text-sm font-medium" style={{ background: INK, color: PAPER_LIGHT }}>
          <Plus size={15} /> Add task
        </button>
      </div>
      {sorted.length === 0 ? (
        <div className="text-sm italic" style={{ color: `${SLATE}90` }}>Nothing on the list — add a task to follow up on.</div>
      ) : (
        <div className="space-y-2">
          {sorted.map((t) => (
            <div key={t.id} className="flex items-center gap-3 p-3 rounded-md" style={{ background: "#fff", border: `1px solid ${INK}14` }}>
              <button
                onClick={() => onToggle(t.id)}
                className="w-5 h-5 rounded flex items-center justify-center shrink-0"
                style={{ border: `1.5px solid ${t.done ? SAGE : INK + "40"}`, background: t.done ? SAGE : "transparent" }}
              >
                {t.done && <Check size={13} color="#fff" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className={`text-sm ${t.done ? "line-through" : ""}`} style={{ color: t.done ? SLATE : INK }}>{t.title}</div>
                {(t.dueDate || t.leadId) && (
                  <div className="text-[11px] mt-0.5" style={{ color: SLATE }}>
                    {t.dueDate && <span>Due {t.dueDate}</span>}
                    {t.dueDate && t.leadId && " · "}
                    {t.leadId && leadName(t.leadId) && <span>{leadName(t.leadId)}</span>}
                  </div>
                )}
              </div>
              <IconBtn onClick={() => onDelete(t.id)} title="Delete" danger><Trash2 size={14} /></IconBtn>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- app ---------- */
export default function App() {
  const [data, setData] = useState(null);
  const [view, setView] = useState("dashboard");
  const [modal, setModal] = useState(null); // { type: 'lead'|'property'|'task', item? }
  const [leadsPresetTab, setLeadsPresetTab] = useState(null);
  const [leadsViewKey, setLeadsViewKey] = useState(0);

  const navigate = (v, tab) => {
    if (v === "leads") {
      setLeadsPresetTab(tab || "All");
      setLeadsViewKey((k) => k + 1); // force LeadsView to re-init with the new preset
    }
    setView(v);
  };

  useEffect(() => {
    loadData().then((d) => setData(d));
  }, []);

  const persist = (next) => {
    setData(next);
    saveData(next);
  };

  if (!data) {
    return (
      <div className="min-h-[400px] flex items-center justify-center" style={{ background: PAPER, color: SLATE }}>
        Loading your CRM…
      </div>
    );
  }

  const addOrUpdateLead = (form) => {
    if (form.id) {
      persist({ ...data, leads: data.leads.map((l) => (l.id === form.id ? { ...l, ...form } : l)) });
    } else {
      persist({ ...data, leads: [...data.leads, { ...form, id: uid(), createdAt: Date.now() }] });
    }
    setModal(null);
  };
  const deleteLead = (id) => persist({ ...data, leads: data.leads.filter((l) => l.id !== id) });
  const changeStage = (id, stage) => persist({ ...data, leads: data.leads.map((l) => (l.id === id ? { ...l, stage } : l)) });
  const changeTemp = (id, temperature) => persist({ ...data, leads: data.leads.map((l) => (l.id === id ? { ...l, temperature } : l)) });
  const importLeads = (rows) => {
    const newLeads = rows.map((r) => ({
      id: uid(),
      name: r.name || "Unnamed lead",
      phone: r.phone || "",
      email: r.email || "",
      stage: "Generated",
      temperature: "Warm",
      source: r.source || "Excel import",
      budget: r.budget || "",
      interest: r.interest || "",
      siteVisit: "Not scheduled",
      siteVisitDate: "",
      remark: "",
      notes: "",
      createdAt: Date.now(),
    }));
    persist({ ...data, leads: [...data.leads, ...newLeads] });
  };

  const addOrUpdateProperty = (form) => {
    if (form.id) {
      persist({ ...data, properties: data.properties.map((p) => (p.id === form.id ? { ...p, ...form } : p)) });
    } else {
      persist({ ...data, properties: [...data.properties, { ...form, id: uid(), createdAt: Date.now() }] });
    }
    setModal(null);
  };
  const deleteProperty = (id) => persist({ ...data, properties: data.properties.filter((p) => p.id !== id) });

  const addTask = (form) => {
    persist({ ...data, tasks: [...data.tasks, { ...form, id: uid(), done: false }] });
    setModal(null);
  };
  const toggleTask = (id) => persist({ ...data, tasks: data.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) });
  const deleteTask = (id) => persist({ ...data, tasks: data.tasks.filter((t) => t.id !== id) });

  const nav = [
    { id: "dashboard", label: "Dashboard", icon: <Home size={17} /> },
    { id: "leads", label: "Leads", icon: <Users size={17} /> },
    { id: "properties", label: "Properties", icon: <Building2 size={17} /> },
    { id: "tasks", label: "Tasks", icon: <ListChecks size={17} /> },
  ];

  return (
    <div className="min-h-[600px] flex flex-col md:flex-row" style={{ background: PAPER, fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
        .font-serif { font-family: 'Fraunces', serif; }
      `}</style>

      {/* mobile top bar */}
      <div className="flex md:hidden items-center justify-between px-4 py-3" style={{ background: INK, color: PAPER_LIGHT }}>
        <div>
          <span className="font-serif text-lg align-middle">ABHIRA REALTORS</span>
          <span className="text-[10px] ml-2 tracking-wide align-middle" style={{ color: `${PAPER_LIGHT}80` }}>CRM</span>
        </div>
        <button
          onClick={() => { if (confirm("Clear all leads, properties, and tasks? This can't be undone.")) persist(EMPTY); }}
          className="text-[10px] underline"
          style={{ color: `${PAPER_LIGHT}75` }}
        >
          Clear data
        </button>
      </div>

      <aside className="hidden md:flex w-56 shrink-0 flex-col" style={{ background: INK, color: PAPER_LIGHT }}>
        <div className="px-5 py-6">
          <div className="font-serif text-xl" style={{ color: PAPER_LIGHT }}>ABHIRA REALTORS</div>
          <div className="text-[11px] tracking-wide" style={{ color: `${PAPER_LIGHT}80` }}>CRM</div>
        </div>
        <nav className="flex-1 px-2">
          {nav.map((n) => (
            <button
              key={n.id}
              onClick={() => navigate(n.id)}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-md text-sm mb-1 transition-colors"
              style={{
                background: view === n.id ? `${BRASS_LIGHT}26` : "transparent",
                color: view === n.id ? BRASS_LIGHT : `${PAPER_LIGHT}B0`,
              }}
            >
              {n.icon}{n.label}
            </button>
          ))}
        </nav>
        <div className="px-5 py-4 text-[11px]" style={{ color: `${PAPER_LIGHT}55` }}>
          Data saved automatically.
          <button
            onClick={() => { if (confirm("Clear all leads, properties, and tasks? This can't be undone.")) persist(EMPTY); }}
            className="block mt-1 underline hover:no-underline"
            style={{ color: `${PAPER_LIGHT}75` }}
          >
            Clear all data
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4 pb-24 md:p-8 md:pb-8 overflow-x-auto">
        {view === "dashboard" && <Dashboard leads={data.leads} properties={data.properties} tasks={data.tasks} onNavigate={navigate} />}
        {view === "leads" && (
          <LeadsView
            key={leadsViewKey}
            leads={data.leads}
            onAdd={() => setModal({ type: "lead" })}
            onEdit={(l) => setModal({ type: "lead", item: l })}
            onDelete={deleteLead}
            onStageChange={changeStage}
            onOpen={(l) => setModal({ type: "leadDetail", item: l })}
            onImport={importLeads}
            presetTab={leadsPresetTab}
          />
        )}
        {view === "properties" && (
          <PropertiesView
            properties={data.properties}
            onAdd={() => setModal({ type: "property" })}
            onEdit={(p) => setModal({ type: "property", item: p })}
            onDelete={deleteProperty}
          />
        )}
        {view === "tasks" && (
          <TasksView
            tasks={data.tasks}
            leads={data.leads}
            onAdd={() => setModal({ type: "task" })}
            onToggle={toggleTask}
            onDelete={deleteTask}
          />
        )}
      </main>

      {/* mobile bottom tab bar */}
      <nav
        className="flex md:hidden fixed bottom-0 left-0 right-0 z-40 items-center justify-around py-2"
        style={{ background: INK, borderTop: `1px solid ${PAPER_LIGHT}20` }}
      >
        {nav.map((n) => (
          <button
            key={n.id}
            onClick={() => navigate(n.id)}
            className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-md text-[10px]"
            style={{ color: view === n.id ? BRASS_LIGHT : `${PAPER_LIGHT}90` }}
          >
            {n.icon}
            {n.label}
          </button>
        ))}
      </nav>

      {modal?.type === "lead" && (
        <LeadForm initial={modal.item} onSave={addOrUpdateLead} onClose={() => setModal(null)} />
      )}
      {modal?.type === "leadDetail" && (
        <LeadDetailModal
          lead={data.leads.find((l) => l.id === modal.item.id) || modal.item}
          onClose={() => setModal(null)}
          onEdit={(l) => setModal({ type: "lead", item: l })}
          onStageChange={changeStage}
          onTempChange={changeTemp}
          onDelete={deleteLead}
        />
      )}
      {modal?.type === "property" && (
        <PropertyForm initial={modal.item} onSave={addOrUpdateProperty} onClose={() => setModal(null)} />
      )}
      {modal?.type === "task" && (
        <TaskForm leads={data.leads} onSave={addTask} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
