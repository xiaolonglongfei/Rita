"use client";

interface User {
  id: string;
  full_name: string;
  email: string;
  is_admin: boolean;
  created_at: string;
}

export function UserAdminTable({ users }: { users: User[] }) {
  if (users.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-100 p-8 text-center">
        <p className="text-sm text-slate-400">No users yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
          <tr>
            <th className="text-left px-4 py-3">Name</th>
            <th className="text-left px-4 py-3">Email</th>
            <th className="text-left px-4 py-3">Role</th>
            <th className="text-left px-4 py-3">Joined</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-800">
                {u.full_name || "—"}
              </td>
              <td className="px-4 py-3 text-slate-500">{u.email}</td>
              <td className="px-4 py-3">
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{
                    background: u.is_admin ? "#fff7ed" : "#f1f5f9",
                    color: u.is_admin ? "#f97316" : "#64748b",
                  }}
                >
                  {u.is_admin ? "Admin" : "Student"}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-400">
                {new Date(u.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
