import { useCallback, useEffect, useRef, useState } from "react";
import {
  createUser,
  deleteUser,
  getUsers,
  updateUser,
  type UserCreate,
  type UserPublic,
  type UserUpdate,
} from "../lib/api";
import {
  logout as authLogout,
  type UserPublic as CurrentUser,
} from "../lib/auth";

// ─── Utilities ───────────────────────────────────────────────────────────────

function initials(u: UserPublic) {
  if (u.full_name?.trim()) {
    return u.full_name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }
  return u.email.slice(0, 2).toUpperCase();
}

const AVATAR_PALETTE = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#f43f5e",
  "#22d3ee",
];
function avatarColor(email: string) {
  let h = 0;
  for (let i = 0; i < email.length; i++)
    h = (h * 31 + email.charCodeAt(i)) & 0xffffffff;
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
}

// ─── Toast ───────────────────────────────────────────────────────────────────

interface Toast {
  id: number;
  msg: string;
  kind: "ok" | "err";
}

function Toasts({
  toasts,
  remove,
}: {
  toasts: Toast[];
  remove: (id: number) => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="toast-item"
          style={{
            background:
              t.kind === "ok"
                ? "rgba(16,185,129,0.12)"
                : "rgba(244,63,94,0.12)",
            border: `1px solid ${t.kind === "ok" ? "rgba(16,185,129,0.35)" : "rgba(244,63,94,0.35)"}`,
            color: t.kind === "ok" ? "#34d399" : "#fb7185",
            borderRadius: 8,
            padding: "10px 16px",
            fontSize: 13,
            fontFamily: "'DM Sans', sans-serif",
            display: "flex",
            alignItems: "center",
            gap: 10,
            minWidth: 260,
            cursor: "pointer",
            animation: "toastIn 0.25s cubic-bezier(0.16,1,0.3,1)",
          }}
          onClick={() => remove(t.id)}
        >
          <span style={{ fontSize: 16 }}>{t.kind === "ok" ? "✓" : "✕"}</span>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ─── Drawer ──────────────────────────────────────────────────────────────────

interface DrawerProps {
  open: boolean;
  editing: UserPublic | null;
  onClose: () => void;
  onSave: (data: UserCreate | UserUpdate) => Promise<void>;
}

function Drawer({ open, editing, onClose, onSave }: DrawerProps) {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    is_superuser: false,
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setForm({
        full_name: editing.full_name ?? "",
        email: editing.email,
        password: "",
        is_superuser: editing.is_superuser,
        is_active: editing.is_active,
      });
    } else {
      setForm({
        full_name: "",
        email: "",
        password: "",
        is_superuser: false,
        is_active: true,
      });
    }
    setError("");
    if (open) setTimeout(() => firstRef.current?.focus(), 80);
  }, [open, editing]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload: any = {
        email: form.email,
        full_name: form.full_name || undefined,
        is_superuser: form.is_superuser,
        is_active: form.is_active,
      };
      if (!editing || form.password) payload.password = form.password;
      await onSave(payload);
      onClose();
    } catch (err: any) {
      setError(err.message ?? "Error");
    } finally {
      setSaving(false);
    }
  }

  function field(label: string, props: InputProps) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
          }}
        >
          {label}
        </label>
        <input
          {...props}
          style={{
            background: "var(--bg)",
            border: "1px solid var(--border-strong)",
            borderRadius: 8,
            color: "var(--text)",
            padding: "10px 12px",
            fontSize: 14,
            fontFamily: "'DM Sans', sans-serif",
            outline: "none",
            transition: "border-color 0.15s",
            width: "100%",
            boxSizing: "border-box",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
          onBlur={(e) =>
            (e.currentTarget.style.borderColor = "var(--border-strong)")
          }
        />
      </div>
    );
  }

  function toggle(
    label: string,
    desc: string,
    value: boolean,
    onChange: (v: boolean) => void,
  ) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 0",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>
            {label}
          </div>
          <div
            style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}
          >
            {desc}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onChange(!value)}
          style={{
            width: 44,
            height: 24,
            borderRadius: 12,
            border: "none",
            background: value ? "var(--accent)" : "var(--border-strong)",
            cursor: "pointer",
            position: "relative",
            transition: "background 0.2s",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              position: "absolute",
              top: 2,
              left: value ? 22 : 2,
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: "#fff",
              transition: "left 0.2s",
              boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
            }}
          />
        </button>
      </div>
    );
  }

  type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
    ref?: React.Ref<HTMLInputElement>;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(2px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.25s",
          zIndex: 100,
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100%",
          width: 440,
          background: "var(--surface)",
          borderLeft: "1px solid var(--border-strong)",
          zIndex: 101,
          display: "flex",
          flexDirection: "column",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.16,1,0.3,1)",
          boxShadow: "-24px 0 80px rgba(0,0,0,0.5)",
        }}
      >
        {/* Drawer header */}
        <div
          style={{
            padding: "24px 28px 20px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                fontFamily: "'Syne', sans-serif",
                color: "var(--text)",
              }}
            >
              {editing ? "Edit User" : "New User"}
            </div>
            <div
              style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}
            >
              {editing
                ? `Editing ${editing.email}`
                : "Add a new user to the system"}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              fontSize: 20,
              lineHeight: 1,
              padding: 4,
              borderRadius: 6,
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--text-muted)")
            }
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={submit}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px 28px",
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          {error && (
            <div
              style={{
                background: "rgba(244,63,94,0.1)",
                border: "1px solid rgba(244,63,94,0.3)",
                borderRadius: 8,
                padding: "10px 14px",
                fontSize: 13,
                color: "#fb7185",
              }}
            >
              {error}
            </div>
          )}

          {field("Full Name", {
            ref: firstRef,
            type: "text",
            placeholder: "Jane Doe",
            value: form.full_name,
            onChange: (e) =>
              setForm((f) => ({ ...f, full_name: e.target.value })),
          })}
          {field("Email Address", {
            type: "email",
            required: true,
            placeholder: "jane@example.com",
            value: form.email,
            onChange: (e) => setForm((f) => ({ ...f, email: e.target.value })),
          })}
          {field(editing ? "New Password (leave blank to keep)" : "Password", {
            type: "password",
            required: !editing,
            minLength: 8,
            placeholder: editing ? "••••••••" : "Min. 8 characters",
            value: form.password,
            onChange: (e) =>
              setForm((f) => ({ ...f, password: e.target.value })),
          })}

          <div style={{ marginTop: 8 }}>
            {toggle(
              "Superuser",
              "Full administrative access to all resources",
              form.is_superuser,
              (v) => setForm((f) => ({ ...f, is_superuser: v })),
            )}
            {toggle(
              "Active Account",
              "User can log in and access the system",
              form.is_active,
              (v) => setForm((f) => ({ ...f, is_active: v })),
            )}
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              marginTop: "auto",
              paddingTop: 16,
            }}
          >
            <button
              type="submit"
              disabled={saving}
              style={{
                flex: 1,
                padding: "12px 0",
                background: "var(--accent)",
                border: "none",
                color: "#fff",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.7 : 1,
                fontFamily: "'DM Sans', sans-serif",
                transition: "opacity 0.15s, transform 0.1s",
              }}
            >
              {saving ? "Saving…" : editing ? "Save Changes" : "Create User"}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "12px 20px",
                background: "var(--surface-hover)",
                border: "1px solid var(--border-strong)",
                color: "var(--text-muted)",
                borderRadius: 8,
                fontSize: 14,
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--text)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--text-muted)")
              }
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

interface Props {
  currentUser: CurrentUser;
}

export default function UsersPage({ currentUser }: Props) {
  const [users, setUsers] = useState<UserPublic[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<UserPublic | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserPublic | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  function toast(msg: string, kind: "ok" | "err" = "ok") {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUsers();
      setUsers(res.data);
      setCount(res.count);
    } catch {
      toast("Failed to load users", "err");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave(data: UserCreate | UserUpdate) {
    if (editing) {
      const updated = await updateUser(editing.id, data as UserUpdate);
      setUsers((u) => u.map((x) => (x.id === updated.id ? updated : x)));
      toast("User updated successfully");
    } else {
      const created = await createUser(data as UserCreate);
      setUsers((u) => [created, ...u]);
      setCount((c) => c + 1);
      toast("User created successfully");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteUser(deleteTarget.id);
      setUsers((u) => u.filter((x) => x.id !== deleteTarget.id));
      setCount((c) => c - 1);
      setDeleteTarget(null);
      toast("User deleted");
    } catch (err: any) {
      toast(err.message ?? "Delete failed", "err");
    } finally {
      setDeleting(false);
    }
  }

  const filtered = users.filter(
    (u) =>
      !search ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.full_name ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500;600&family=DM+Mono&display=swap');

        :root {
          --bg: #0a0a10;
          --surface: #111118;
          --surface-hover: #18181f;
          --border: rgba(120,120,180,0.09);
          --border-strong: rgba(120,120,180,0.18);
          --text: #e0e0f0;
          --text-muted: #606080;
          --accent: #6366f1;
          --accent-soft: rgba(99,102,241,0.12);
          --amber: #f59e0b;
          --danger: #f43f5e;
          --danger-soft: rgba(244,63,94,0.1);
          --success: #10b981;
        }

        *, *::before, *::after { box-sizing: border-box; }

        body {
          background: var(--bg);
          color: var(--text);
          font-family: 'DM Sans', sans-serif;
          margin: 0;
          min-height: 100vh;
        }

        .users-table tr.row-enter {
          animation: rowIn 0.3s cubic-bezier(0.16,1,0.3,1) both;
        }
        @keyframes rowIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes toastIn {
          from { opacity: 0; transform: translateX(16px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .users-table td, .users-table th {
          border-bottom: 1px solid var(--border);
        }

        .row-action-btn {
          opacity: 0;
          transform: scale(0.9);
          transition: opacity 0.15s, transform 0.15s, background 0.15s;
        }
        .users-table tr:hover .row-action-btn {
          opacity: 1;
          transform: scale(1);
        }
        .users-table tr:hover td {
          background: var(--surface-hover) !important;
        }
        .users-table tr:hover td:first-child {
          box-shadow: inset 3px 0 0 var(--accent);
        }

        input::placeholder { color: var(--text-muted); opacity: 0.7; }
        input:focus { outline: none; }

        .delete-confirm {
          animation: confirmIn 0.2s cubic-bezier(0.16,1,0.3,1);
        }
        @keyframes confirmIn {
          from { opacity: 0; scale: 0.97; }
          to   { opacity: 1; scale: 1; }
        }

        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 3px; }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* ── Top bar ──────────────────────────────────── */}
        <header
          style={{
            height: 60,
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 28px",
            position: "sticky",
            top: 0,
            zIndex: 50,
            background: "rgba(10,10,16,0.85)",
            backdropFilter: "blur(16px)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 14 14">
                <rect x="1" y="1" width="5" height="5" rx="1.5" fill="white" />
                <rect
                  x="8"
                  y="1"
                  width="5"
                  height="5"
                  rx="1.5"
                  fill="white"
                  opacity="0.6"
                />
                <rect
                  x="1"
                  y="8"
                  width="5"
                  height="5"
                  rx="1.5"
                  fill="white"
                  opacity="0.6"
                />
                <rect
                  x="8"
                  y="8"
                  width="5"
                  height="5"
                  rx="1.5"
                  fill="white"
                  opacity="0.3"
                />
              </svg>
            </div>
            <span
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                fontSize: 16,
                color: "var(--text)",
                letterSpacing: "-0.01em",
              }}
            >
              Axiom
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: avatarColor(currentUser.email),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#fff",
                }}
              >
                {initials({ ...currentUser, id: "" })}
              </div>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                {currentUser.email}
              </span>
            </div>
            <button
              onClick={async () => {
                await authLogout();
                window.location.reload();
              }}
              style={{
                background: "transparent",
                border: "1px solid var(--border-strong)",
                color: "var(--text-muted)",
                borderRadius: 7,
                padding: "6px 14px",
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                transition: "color 0.15s, border-color 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--text)";
                e.currentTarget.style.borderColor = "var(--border-strong)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--text-muted)";
              }}
            >
              Sign out
            </button>
          </div>
        </header>

        {/* ── Page content ─────────────────────────────── */}
        <main
          style={{
            flex: 1,
            padding: "32px 28px",
            maxWidth: 1200,
            width: "100%",
            margin: "0 auto",
          }}
        >
          {/* Page heading */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              marginBottom: 28,
            }}
          >
            <div>
              <h1
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 28,
                  fontWeight: 800,
                  color: "var(--text)",
                  margin: 0,
                  letterSpacing: "-0.03em",
                }}
              >
                Users
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 500,
                    color: "var(--text-muted)",
                    marginLeft: 10,
                    fontFamily: "'DM Sans', sans-serif",
                    letterSpacing: 0,
                  }}
                >
                  {count}
                </span>
              </h1>
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: 13,
                  color: "var(--text-muted)",
                }}
              >
                Manage accounts, roles, and access permissions.
              </p>
            </div>

            <button
              onClick={() => {
                setEditing(null);
                setDrawerOpen(true);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                background: "var(--accent)",
                border: "none",
                color: "#fff",
                borderRadius: 9,
                padding: "10px 18px",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                transition: "opacity 0.15s, transform 0.1s",
                boxShadow: "0 0 0 0 rgba(99,102,241,0)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.9";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <svg
                width="14"
                height="14"
                fill="none"
                viewBox="0 0 14 14"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path d="M7 1v12M1 7h12" strokeLinecap="round" />
              </svg>
              New User
            </button>
          </div>

          {/* Search bar */}
          <div style={{ position: "relative", marginBottom: 20 }}>
            <svg
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                opacity: 0.35,
              }}
              width="16"
              height="16"
              fill="none"
              viewBox="0 0 16 16"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <circle cx="7" cy="7" r="5" />
              <path d="M11 11l2.5 2.5" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                background: "var(--surface)",
                border: "1px solid var(--border-strong)",
                borderRadius: 10,
                color: "var(--text)",
                padding: "10px 14px 10px 40px",
                fontSize: 14,
                fontFamily: "'DM Sans', sans-serif",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = "var(--accent)")
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = "var(--border-strong)")
              }
            />
          </div>

          {/* Table */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            <table
              className="users-table"
              style={{ width: "100%", borderCollapse: "collapse" }}
            >
              <thead>
                <tr>
                  {["User", "Role", "Status", "ID", ""].map((h, i) => (
                    <th
                      key={h + i}
                      style={{
                        textAlign: "left",
                        padding: "13px 16px",
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "var(--text-muted)",
                        background: "var(--surface)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {[1, 2, 3, 4, 5].map((j) => (
                        <td key={j} style={{ padding: "14px 16px" }}>
                          <div
                            style={{
                              height: 14,
                              borderRadius: 4,
                              background: "var(--border-strong)",
                              width: ["60%", "30%", "20%", "45%", "10%"][j - 1],
                              animation: "pulse 1.5s ease-in-out infinite",
                            }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        textAlign: "center",
                        padding: "60px 16px",
                        color: "var(--text-muted)",
                        fontSize: 14,
                      }}
                    >
                      {search
                        ? `No users matching "${search}"`
                        : "No users found"}
                    </td>
                  </tr>
                ) : (
                  filtered.map((u, i) => (
                    <tr
                      key={u.id}
                      className="row-enter"
                      style={{
                        animationDelay: `${i * 30}ms`,
                        cursor: "default",
                      }}
                    >
                      {/* Avatar + Name/Email */}
                      <td style={{ padding: "12px 16px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: "50%",
                              flexShrink: 0,
                              background: avatarColor(u.email),
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 12,
                              fontWeight: 700,
                              color: "#fff",
                            }}
                          >
                            {initials(u)}
                          </div>
                          <div>
                            <div
                              style={{
                                fontSize: 14,
                                fontWeight: 500,
                                color: "var(--text)",
                                lineHeight: 1.3,
                              }}
                            >
                              {u.full_name ?? (
                                <span
                                  style={{
                                    color: "var(--text-muted)",
                                    fontStyle: "italic",
                                  }}
                                >
                                  No name
                                </span>
                              )}
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                color: "var(--text-muted)",
                                fontFamily: "'DM Mono', monospace",
                                marginTop: 1,
                              }}
                            >
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            fontSize: 11,
                            fontWeight: 600,
                            letterSpacing: "0.06em",
                            padding: "4px 10px",
                            borderRadius: 20,
                            background: u.is_superuser
                              ? "rgba(245,158,11,0.12)"
                              : "rgba(120,120,180,0.08)",
                            color: u.is_superuser
                              ? "#f59e0b"
                              : "var(--text-muted)",
                            border: `1px solid ${u.is_superuser ? "rgba(245,158,11,0.25)" : "var(--border)"}`,
                          }}
                        >
                          {u.is_superuser ? "⬡ SUPERUSER" : "USER"}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: 13,
                          }}
                        >
                          <span
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: "50%",
                              flexShrink: 0,
                              background: u.is_active
                                ? "var(--success)"
                                : "var(--text-muted)",
                              boxShadow: u.is_active
                                ? "0 0 6px rgba(16,185,129,0.5)"
                                : "none",
                            }}
                          />
                          <span
                            style={{
                              color: u.is_active
                                ? "var(--text)"
                                : "var(--text-muted)",
                              fontSize: 13,
                            }}
                          >
                            {u.is_active ? "Active" : "Inactive"}
                          </span>
                        </span>
                      </td>

                      {/* ID */}
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontFamily: "'DM Mono', monospace",
                            color: "var(--text-muted)",
                          }}
                        >
                          {u.id.slice(0, 8)}…
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            gap: 4,
                          }}
                        >
                          <button
                            className="row-action-btn"
                            onClick={() => {
                              setEditing(u);
                              setDrawerOpen(true);
                            }}
                            title="Edit"
                            style={{
                              background: "var(--surface-hover)",
                              border: "1px solid var(--border-strong)",
                              color: "var(--text-muted)",
                              borderRadius: 7,
                              padding: "6px 10px",
                              cursor: "pointer",
                              fontSize: 13,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = "var(--accent)";
                              e.currentTarget.style.borderColor =
                                "var(--accent)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = "var(--text-muted)";
                              e.currentTarget.style.borderColor =
                                "var(--border-strong)";
                            }}
                          >
                            <svg
                              width="13"
                              height="13"
                              fill="none"
                              viewBox="0 0 13 13"
                              stroke="currentColor"
                              strokeWidth={1.8}
                            >
                              <path d="M2 9.5V11h1.5l4.4-4.4-1.5-1.5L2 9.5zm7.7-5.7a.4.4 0 000-.57L8.77 2.3a.4.4 0 00-.57 0L7.25 3.25l1.5 1.5.95-.95z" />
                            </svg>
                          </button>
                          <button
                            className="row-action-btn"
                            onClick={() => setDeleteTarget(u)}
                            title="Delete"
                            style={{
                              background: "var(--surface-hover)",
                              border: "1px solid var(--border-strong)",
                              color: "var(--text-muted)",
                              borderRadius: 7,
                              padding: "6px 10px",
                              cursor: "pointer",
                              fontSize: 13,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = "var(--danger)";
                              e.currentTarget.style.borderColor =
                                "rgba(244,63,94,0.4)";
                              e.currentTarget.style.background =
                                "rgba(244,63,94,0.08)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = "var(--text-muted)";
                              e.currentTarget.style.borderColor =
                                "var(--border-strong)";
                              e.currentTarget.style.background =
                                "var(--surface-hover)";
                            }}
                          >
                            <svg
                              width="13"
                              height="13"
                              fill="none"
                              viewBox="0 0 13 13"
                              stroke="currentColor"
                              strokeWidth={1.8}
                            >
                              <path
                                d="M2 3.5h9M5 3.5v-1.5h3v1.5M4.5 3.5v7h4v-7"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && filtered.length > 0 && (
            <div
              style={{
                marginTop: 16,
                textAlign: "right",
                fontSize: 12,
                color: "var(--text-muted)",
              }}
            >
              Showing {filtered.length} of {count} users
            </div>
          )}
        </main>
      </div>

      {/* ── Create/Edit Drawer ───────────────────────── */}
      <Drawer
        open={drawerOpen}
        editing={editing}
        onClose={() => {
          setDrawerOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
      />

      {/* ── Delete confirmation modal ────────────────── */}
      {deleteTarget && (
        <>
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.65)",
              backdropFilter: "blur(3px)",
              zIndex: 200,
            }}
            onClick={() => setDeleteTarget(null)}
          />
          <div
            className="delete-confirm"
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%,-50%)",
              background: "var(--surface)",
              border: "1px solid var(--border-strong)",
              borderRadius: 14,
              padding: 28,
              width: 380,
              zIndex: 201,
              boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "var(--danger-soft)",
                border: "1px solid rgba(244,63,94,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
                fontSize: 20,
              }}
            >
              🗑
            </div>
            <div
              style={{
                fontSize: 17,
                fontWeight: 700,
                fontFamily: "'Syne', sans-serif",
                color: "var(--text)",
                marginBottom: 8,
              }}
            >
              Delete user?
            </div>
            <div
              style={{
                fontSize: 14,
                color: "var(--text-muted)",
                lineHeight: 1.5,
                marginBottom: 24,
              }}
            >
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  color: "var(--text)",
                  fontSize: 13,
                }}
              >
                {deleteTarget.email}
              </span>{" "}
              will be permanently removed. This cannot be undone.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  flex: 1,
                  padding: "11px 0",
                  background: "var(--danger)",
                  border: "none",
                  color: "#fff",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: deleting ? "not-allowed" : "pointer",
                  opacity: deleting ? 0.7 : 1,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                style={{
                  padding: "11px 20px",
                  background: "transparent",
                  border: "1px solid var(--border-strong)",
                  color: "var(--text-muted)",
                  borderRadius: 8,
                  fontSize: 14,
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}

      <Toasts
        toasts={toasts}
        remove={(id) => setToasts((t) => t.filter((x) => x.id !== id))}
      />
    </>
  );
}
