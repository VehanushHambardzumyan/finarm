import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import "./AdminUsers.css";

type UserStatus = "active" | "blocked";

type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: "user" | "admin";
  status: UserStatus;
  joinedAt: string;
};

const initialUsers: AdminUser[] = [
  {
    id: 1,
    name: "Anna Mkrtchyan",
    email: "anna@mail.com",
    role: "user",
    status: "active",
    joinedAt: "2026-03-20",
  },
  {
    id: 2,
    name: "David Petrosyan",
    email: "david@mail.com",
    role: "user",
    status: "blocked",
    joinedAt: "2026-03-18",
  },
  {
    id: 3,
    name: "Mariam Sargsyan",
    email: "mariam@mail.com",
    role: "admin",
    status: "active",
    joinedAt: "2026-03-17",
  },
  {
    id: 4,
    name: "Gor Hakobyan",
    email: "gor@mail.com",
    role: "user",
    status: "active",
    joinedAt: "2026-03-15",
  },
];

export default function AdminUsers() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | UserStatus>("all");
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ? true : user.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [users, search, statusFilter]);

  const toggleUserStatus = (id: number) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === id
          ? {
              ...user,
              status: user.status === "active" ? "blocked" : "active",
            }
          : user
      )
    );
  };

  const deleteUser = (id: number) => {
    setUsers((prev) => prev.filter((user) => user.id !== id));
  };

  return (
    <div className="admin-users-page">
      <div className="admin-users-header">
        <div>
          <h1>{t("admin.usersPage.title")}</h1>
          <p>{t("admin.usersPage.subtitle")}</p>
        </div>

        <button className="admin-primary-btn">
          {t("admin.usersPage.addUser")}
        </button>
      </div>

      <div className="admin-users-toolbar">
        <input
          type="text"
          className="admin-users-search"
          placeholder={t("admin.usersPage.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="admin-users-filter"
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as "all" | UserStatus)
          }
        >
          <option value="all">
            {t("admin.usersPage.filters.allStatuses")}
          </option>
          <option value="active">{t("admin.status.active")}</option>
          <option value="blocked">{t("admin.status.blocked")}</option>
        </select>
      </div>

      <div className="admin-users-stats">
        <div className="admin-users-stat-card">
          <span>{t("admin.usersPage.stats.totalUsers")}</span>
          <strong>{users.length}</strong>
        </div>

        <div className="admin-users-stat-card">
          <span>{t("admin.usersPage.stats.activeUsers")}</span>
          <strong>{users.filter((u) => u.status === "active").length}</strong>
        </div>

        <div className="admin-users-stat-card">
          <span>{t("admin.usersPage.stats.blockedUsers")}</span>
          <strong>{users.filter((u) => u.status === "blocked").length}</strong>
        </div>
      </div>

      <div className="admin-users-table-card">
        <table className="admin-users-table">
          <thead>
            <tr>
              <th>{t("admin.table.name")}</th>
              <th>{t("admin.table.email")}</th>
              <th>{t("admin.usersPage.table.role")}</th>
              <th>{t("admin.table.status")}</th>
              <th>{t("admin.table.joined")}</th>
              <th>{t("admin.usersPage.table.actions")}</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    {user.role === "admin"
                      ? t("admin.usersPage.roles.admin")
                      : t("admin.usersPage.roles.user")}
                  </td>
                  <td>
                    <span
                      className={`admin-user-status ${
                        user.status === "active" ? "active" : "blocked"
                      }`}
                    >
                      {user.status === "active"
                        ? t("admin.status.active")
                        : t("admin.status.blocked")}
                    </span>
                  </td>
                  <td>{user.joinedAt}</td>
                  <td>
                    <div className="admin-users-actions">
                      <button
                        className="admin-table-btn secondary"
                        onClick={() => toggleUserStatus(user.id)}
                      >
                        {user.status === "active"
                          ? t("admin.actions.block")
                          : t("admin.actions.unblock")}
                      </button>

                      <button className="admin-table-btn">
                        {t("admin.actions.edit")}
                      </button>

                      <button
                        className="admin-table-btn danger"
                        onClick={() => deleteUser(user.id)}
                      >
                        {t("admin.actions.delete")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="admin-users-empty">
                  {t("admin.empty.noUsers")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}