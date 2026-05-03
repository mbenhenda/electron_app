import { authFetch } from "./auth";

const API = "http://localhost:8000";

export interface UserPublic {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  is_superuser: boolean;
}

export interface UserCreate {
  email: string;
  password: string;
  full_name?: string;
  is_superuser?: boolean;
  is_active?: boolean;
}

export interface UserUpdate {
  email?: string;
  full_name?: string;
  password?: string;
  is_superuser?: boolean;
  is_active?: boolean;
}

export async function getUsers(skip = 0, limit = 50): Promise<{ data: UserPublic[]; count: number }> {
  const res = await authFetch(`${API}/users/?skip=${skip}&limit=${limit}`);
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

export async function createUser(data: UserCreate): Promise<UserPublic> {
  const res = await authFetch(`${API}/users/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).detail ?? "Failed to create user");
  }
  return res.json();
}

export async function updateUser(id: string, data: UserUpdate): Promise<UserPublic> {
  const res = await authFetch(`${API}/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).detail ?? "Failed to update user");
  }
  return res.json();
}

export async function deleteUser(id: string): Promise<void> {
  const res = await authFetch(`${API}/users/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).detail ?? "Failed to delete user");
  }
}
