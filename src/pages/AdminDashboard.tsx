import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { apiClient } from "../api/client";
import { useAppStore } from "../store/StoreProvider";
import "./AdminDashboard.css";

// ---- Types ----

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalTransactions: number;
  totalRevenue: number;
  totalExpenses: number;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  createdAt: string;
  profile: Record<string, unknown> | null;
}

interface AdminTransaction {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  type: string;
  amount: number;
  currency: string;
  category: string | null;
  note: string | null;
  txDate: string;
  createdAt: string;
}

// ---- Helpers ----

function LoadingSpinner() {
  const { t } = useTranslation();
  return (
    <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>
      {t("admin.loading")}
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div
      style={{
        padding: "20px",
        background: "#fee2e2",
        color: "#b91c1c",
        borderRadius: "14px",
        margin: "16px 0",
      }}
    >
      {message}
    </div>
  );
}

function ComingSoon({ label }: { label: string }) {
  const { t } = useTranslation();
  return (
    <div
      style={{
        padding: "60px 40px",
        textAlign: "center",
        color: "#6b7280",
        background: "#fff",
        borderRadius: "20px",
        boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
      }}
    >
      <div style={{ fontSize: "48px", marginBottom: "16px" }}>🚧</div>
      <h2 style={{ margin: "0 0 8px", color: "#1f2937" }}>{label}</h2>
      <p style={{ margin: 0 }}>{t("admin.comingSoon")}</p>
    </div>
  );
}

function TxTypeBadge({ type }: { type: string }) {
  const { t } = useTranslation();
  const className =
    type === "income" ? "success" : type === "transfer" ? "warning" : "danger";
  const label =
    type === "income"
      ? t("admin.income")
      : type === "transfer"
      ? t("admin.transfer")
      : t("admin.expense");
  return <span className={`status-badge ${className}`}>{label}</span>;
}

// ---- Dashboard section ----

function DashboardSection() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      apiClient.getAdminStats(),
      apiClient.getAdminUsers(),
      apiClient.getAdminTransactions(),
    ])
      .then(([s, u, tx]) => {
        setStats(s);
        setUsers(Array.isArray(u) ? u : []);
        setTransactions(Array.isArray(tx) ? tx : []);
      })
      .catch((err) => setError(err?.message ?? t("admin.loading")))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  const recentUsers = users.slice(0, 5);
  const recentTxs = transactions.slice(0, 8);

  return (
    <>
      <section className="admin-stats-grid">
        <div className="admin-stat-card">
          <span className="stat-label">{t("admin.stats.totalUsers")}</span>
          <strong className="stat-value">{stats?.totalUsers ?? 0}</strong>
        </div>
        <div className="admin-stat-card">
          <span className="stat-label">{t("admin.stats.activeUsers")}</span>
          <strong className="stat-value">{stats?.activeUsers ?? 0}</strong>
        </div>
        <div className="admin-stat-card">
          <span className="stat-label">{t("admin.stats.transactions")}</span>
          <strong className="stat-value">{stats?.totalTransactions ?? 0}</strong>
        </div>
        <div className="admin-stat-card">
          <span className="stat-label">{t("admin.stats.totalExpense")}</span>
          <strong className="stat-value">
            {(stats?.totalExpenses ?? 0).toLocaleString()} AMD
          </strong>
        </div>
      </section>

      <section className="admin-content-grid">
        <div className="admin-panel">
          <div className="panel-header">
            <h2>{t("admin.recentUsers")}</h2>
          </div>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t("admin.table.name")}</th>
                  <th>{t("admin.table.email")}</th>
                  <th>{t("admin.table.role")}</th>
                  <th>{t("admin.table.joined")}</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email ?? user.phone ?? "-"}</td>
                    <td>
                      <span
                        className={`status-badge ${
                          user.role === "admin" ? "warning" : "success"
                        }`}
                      >
                        {user.role === "admin"
                          ? t("admin.usersPage.roles.admin")
                          : t("admin.usersPage.roles.user")}
                      </span>
                    </td>
                    <td>{user.createdAt?.slice(0, 10)}</td>
                  </tr>
                ))}
                {recentUsers.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", color: "#6b7280" }}>
                      {t("admin.noUsers")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-panel">
          <div className="panel-header">
            <h2>{t("admin.revenueSummary")}</h2>
          </div>
          <div className="summary-list">
            <div className="summary-item">
              <span>{t("admin.totalRevenue")}</span>
              <strong>{(stats?.totalRevenue ?? 0).toLocaleString()} AMD</strong>
            </div>
            <div className="summary-item">
              <span>{t("admin.totalExpensesLabel")}</span>
              <strong>{(stats?.totalExpenses ?? 0).toLocaleString()} AMD</strong>
            </div>
            <div className="summary-item">
              <span>{t("admin.netBalance")}</span>
              <strong>
                {((stats?.totalRevenue ?? 0) - (stats?.totalExpenses ?? 0)).toLocaleString()} AMD
              </strong>
            </div>
            <div className="summary-item">
              <span>{t("admin.stats.activeUsers")}</span>
              <strong>{stats?.activeUsers ?? 0}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="admin-panel admin-transactions-panel">
        <div className="panel-header">
          <h2>{t("admin.recentTransactions")}</h2>
        </div>
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t("admin.table.user")}</th>
                <th>{t("admin.table.type")}</th>
                <th>{t("admin.table.category")}</th>
                <th>{t("admin.table.amount")}</th>
                <th>{t("admin.table.date")}</th>
              </tr>
            </thead>
            <tbody>
              {recentTxs.map((tx) => (
                <tr key={tx.id}>
                  <td>{tx.userName ?? tx.userEmail ?? t("admin.unknown")}</td>
                  <td>
                    <TxTypeBadge type={tx.type} />
                  </td>
                  <td>{tx.category ?? "-"}</td>
                  <td>
                    {Number(tx.amount).toLocaleString()} {tx.currency}
                  </td>
                  <td>{tx.txDate?.slice(0, 10)}</td>
                </tr>
              ))}
              {recentTxs.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "#6b7280" }}>
                    {t("admin.noTransactionsData")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

// ---- Users section ----

function UsersSection() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = () => {
    setLoading(true);
    setError(null);
    apiClient
      .getAdminUsers()
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch((err) => setError(err?.message ?? t("admin.loading")))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q);
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const handleRoleChange = async (user: AdminUser, newRole: "admin" | "user") => {
    setActionLoading(user.id);
    try {
      await apiClient.updateUserRole(user.id, newRole);
      fetchUsers();
    } catch (err: any) {
      alert(err?.message ?? t("admin.failedUpdateRole"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (user: AdminUser) => {
    if (!window.confirm(t("admin.deleteUserConfirm", { name: user.name }))) {
      return;
    }
    setActionLoading(user.id);
    try {
      await apiClient.deleteAdminUser(user.id);
      fetchUsers();
    } catch (err: any) {
      alert(err?.message ?? t("admin.failedDeleteUser"));
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="admin-panel">
      <div className="panel-header">
        <h2>{t("admin.menu.users")}</h2>
        <span style={{ color: "#6b7280", fontSize: "14px" }}>
          {t("admin.ofUsers", { filtered: filtered.length, total: users.length })}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "18px",
          flexWrap: "wrap",
        }}
      >
        <input
          className="admin-search"
          type="text"
          placeholder={t("admin.usersPage.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: "200px" }}
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as "all" | "admin" | "user")}
          style={{
            padding: "10px 14px",
            border: "1px solid #dbe2ea",
            borderRadius: "12px",
            background: "#fff",
            cursor: "pointer",
          }}
        >
          <option value="all">{t("admin.allRoles")}</option>
          <option value="admin">{t("admin.usersPage.roles.admin")}</option>
          <option value="user">{t("admin.usersPage.roles.user")}</option>
        </select>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t("admin.table.name")}</th>
              <th>{t("admin.table.email")}</th>
              <th>{t("admin.table.phone")}</th>
              <th>{t("admin.table.role")}</th>
              <th>{t("admin.table.joined")}</th>
              <th>{t("admin.table.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email ?? "-"}</td>
                <td>{user.phone ?? "-"}</td>
                <td>
                  <span
                    className={`status-badge ${
                      user.role === "admin" ? "warning" : "success"
                    }`}
                  >
                    {user.role === "admin"
                      ? t("admin.usersPage.roles.admin")
                      : t("admin.usersPage.roles.user")}
                  </span>
                </td>
                <td>{user.createdAt?.slice(0, 10)}</td>
                <td>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {user.role !== "admin" ? (
                      <button
                        className="panel-action"
                        disabled={actionLoading === user.id}
                        onClick={() => handleRoleChange(user, "admin")}
                        style={{ padding: "6px 10px", fontSize: "12px" }}
                      >
                        {t("admin.makeAdmin")}
                      </button>
                    ) : (
                      <button
                        className="panel-action"
                        disabled={actionLoading === user.id}
                        onClick={() => handleRoleChange(user, "user")}
                        style={{ padding: "6px 10px", fontSize: "12px" }}
                      >
                        {t("admin.revokeAdmin")}
                      </button>
                    )}
                    <button
                      disabled={actionLoading === user.id}
                      onClick={() => handleDelete(user)}
                      style={{
                        padding: "6px 10px",
                        fontSize: "12px",
                        border: "none",
                        borderRadius: "12px",
                        background: "#fee2e2",
                        color: "#b91c1c",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      {t("admin.actions.delete")}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "#6b7280" }}>
                  {t("admin.noUsersFound")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---- Transactions section ----

function TransactionsSection() {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense" | "transfer">("all");

  useEffect(() => {
    setLoading(true);
    apiClient
      .getAdminTransactions()
      .then((data) => setTransactions(Array.isArray(data) ? data : []))
      .catch((err) => setError(err?.message ?? t("admin.loading")))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        (tx.userName ?? "").toLowerCase().includes(q) ||
        (tx.userEmail ?? "").toLowerCase().includes(q) ||
        (tx.category ?? "").toLowerCase().includes(q);
      const matchesType = typeFilter === "all" || tx.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [transactions, search, typeFilter]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="admin-panel">
      <div className="panel-header">
        <h2>{t("admin.menu.transactions")}</h2>
        <span style={{ color: "#6b7280", fontSize: "14px" }}>
          {t("admin.total", { count: filtered.length })}
        </span>
      </div>

      <div style={{ display: "flex", gap: "12px", marginBottom: "18px", flexWrap: "wrap" }}>
        <input
          className="admin-search"
          type="text"
          placeholder={t("admin.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: "200px" }}
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
          style={{
            padding: "10px 14px",
            border: "1px solid #dbe2ea",
            borderRadius: "12px",
            background: "#fff",
            cursor: "pointer",
          }}
        >
          <option value="all">{t("admin.allCategories")}</option>
          <option value="income">{t("admin.income")}</option>
          <option value="expense">{t("admin.expense")}</option>
          <option value="transfer">{t("admin.transfer")}</option>
        </select>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t("admin.table.user")}</th>
              <th>{t("admin.table.type")}</th>
              <th>{t("admin.table.category")}</th>
              <th>{t("admin.table.amount")}</th>
              <th>{t("admin.table.currency")}</th>
              <th>{t("admin.table.date")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((tx) => (
              <tr key={tx.id}>
                <td>
                  <div>{tx.userName ?? t("admin.unknown")}</div>
                  {tx.userEmail && (
                    <div style={{ fontSize: "12px", color: "#6b7280" }}>
                      {tx.userEmail}
                    </div>
                  )}
                </td>
                <td>
                  <TxTypeBadge type={tx.type} />
                </td>
                <td>{tx.category ?? "-"}</td>
                <td>{Number(tx.amount).toLocaleString()}</td>
                <td>{tx.currency}</td>
                <td>{tx.txDate?.slice(0, 10)}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "#6b7280" }}>
                  {t("admin.noTransactionsData")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---- Categories section ----

function CategoriesSection() {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<"expense" | "income">("expense");

  useEffect(() => {
    setLoading(true);
    apiClient
      .getAdminTransactions()
      .then((data) => setTransactions(Array.isArray(data) ? data : []))
      .catch((err) => setError(err?.message ?? t("admin.loading")))
      .finally(() => setLoading(false));
  }, []);

  const categoryStats = useMemo(() => {
    const byCategory: Record<string, { total: number; count: number }> = {};
    for (const tx of transactions.filter((tx) => tx.type === typeFilter)) {
      const cat = tx.category ?? t("admin.unknown");
      if (!byCategory[cat]) byCategory[cat] = { total: 0, count: 0 };
      byCategory[cat].total += Number(tx.amount);
      byCategory[cat].count += 1;
    }
    return Object.entries(byCategory)
      .sort((a, b) => b[1].total - a[1].total);
  }, [transactions, typeFilter]);

  const grandTotal = categoryStats.reduce((sum, [, v]) => sum + v.total, 0);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="admin-panel">
      <div className="panel-header">
        <h2>{t("admin.categoryStats")}</h2>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            className={`panel-action${typeFilter === "expense" ? " active" : ""}`}
            onClick={() => setTypeFilter("expense")}
            style={{ padding: "6px 14px", fontSize: "13px" }}
          >
            {t("admin.expense")}
          </button>
          <button
            className={`panel-action${typeFilter === "income" ? " active" : ""}`}
            onClick={() => setTypeFilter("income")}
            style={{ padding: "6px 14px", fontSize: "13px" }}
          >
            {t("admin.income")}
          </button>
        </div>
      </div>

      {categoryStats.length === 0 ? (
        <p style={{ color: "#6b7280", textAlign: "center", padding: "40px 0" }}>
          {t("admin.noData")}
        </p>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t("admin.table.category")}</th>
                <th>{t("admin.table.transactions")}</th>
                <th>{t("admin.table.amount")}</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              {categoryStats.map(([cat, { total, count }]) => (
                <tr key={cat}>
                  <td>{cat}</td>
                  <td>{count}</td>
                  <td>{total.toLocaleString()}</td>
                  <td>
                    {grandTotal > 0 ? ((total / grandTotal) * 100).toFixed(1) : "0"}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---- Reports section ----

function ReportsSection() {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    apiClient
      .getAdminTransactions()
      .then((data) => setTransactions(Array.isArray(data) ? data : []))
      .catch((err) => setError(err?.message ?? t("admin.loading")))
      .finally(() => setLoading(false));
  }, []);

  const aggregates = useMemo(() => {
    const totalIncome = transactions
      .filter((tx) => tx.type === "income")
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

    const totalExpenses = transactions
      .filter((tx) => tx.type === "expense")
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

    const byCurrency: Record<string, { income: number; expense: number }> = {};
    for (const tx of transactions) {
      if (!byCurrency[tx.currency]) {
        byCurrency[tx.currency] = { income: 0, expense: 0 };
      }
      if (tx.type === "income") {
        byCurrency[tx.currency].income += Number(tx.amount);
      } else if (tx.type === "expense") {
        byCurrency[tx.currency].expense += Number(tx.amount);
      }
    }

    const byCategory: Record<string, number> = {};
    for (const tx of transactions.filter((tx) => tx.type === "expense")) {
      const cat = tx.category ?? t("admin.unknown");
      byCategory[cat] = (byCategory[cat] ?? 0) + Number(tx.amount);
    }
    const topCategories = Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    return { totalIncome, totalExpenses, byCurrency, topCategories };
  }, [transactions]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <>
      <section className="admin-stats-grid">
        <div className="admin-stat-card">
          <span className="stat-label">{t("admin.totalIncome")}</span>
          <strong className="stat-value" style={{ color: "#15803d" }}>
            {aggregates.totalIncome.toLocaleString()}
          </strong>
        </div>
        <div className="admin-stat-card">
          <span className="stat-label">{t("admin.totalExpensesLabel")}</span>
          <strong className="stat-value" style={{ color: "#b91c1c" }}>
            {aggregates.totalExpenses.toLocaleString()}
          </strong>
        </div>
        <div className="admin-stat-card">
          <span className="stat-label">{t("admin.netBalance")}</span>
          <strong
            className="stat-value"
            style={{
              color:
                aggregates.totalIncome - aggregates.totalExpenses >= 0
                  ? "#15803d"
                  : "#b91c1c",
            }}
          >
            {(aggregates.totalIncome - aggregates.totalExpenses).toLocaleString()}
          </strong>
        </div>
        <div className="admin-stat-card">
          <span className="stat-label">{t("admin.stats.transactions")}</span>
          <strong className="stat-value">{transactions.length}</strong>
        </div>
      </section>

      <section className="admin-content-grid">
        <div className="admin-panel">
          <div className="panel-header">
            <h2>{t("admin.topExpenseCategories")}</h2>
          </div>
          <div className="summary-list">
            {aggregates.topCategories.length === 0 ? (
              <p style={{ color: "#6b7280", textAlign: "center" }}>
                {t("admin.noExpenseData")}
              </p>
            ) : (
              aggregates.topCategories.map(([cat, amount]) => (
                <div className="summary-item" key={cat}>
                  <span>{cat}</span>
                  <strong>{amount.toLocaleString()}</strong>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="admin-panel">
          <div className="panel-header">
            <h2>{t("admin.byCurrency")}</h2>
          </div>
          <div className="summary-list">
            {Object.entries(aggregates.byCurrency).length === 0 ? (
              <p style={{ color: "#6b7280", textAlign: "center" }}>
                {t("admin.noData")}
              </p>
            ) : (
              Object.entries(aggregates.byCurrency).map(
                ([currency, { income, expense }]) => (
                  <div className="summary-item" key={currency}>
                    <span>{currency}</span>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ color: "#15803d", fontSize: "12px" }}>
                        +{income.toLocaleString()}
                      </div>
                      <div style={{ color: "#b91c1c", fontSize: "12px" }}>
                        -{expense.toLocaleString()}
                      </div>
                    </div>
                  </div>
                )
              )
            )}
          </div>
        </div>
      </section>
    </>
  );
}

// ---- Logs section ----

function LogsSection() {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([apiClient.getAdminTransactions(), apiClient.getAdminUsers()])
      .then(([tx, u]) => {
        setTransactions(Array.isArray(tx) ? tx : []);
        setUsers(Array.isArray(u) ? u : []);
      })
      .catch((err) => setError(err?.message ?? t("admin.loading")))
      .finally(() => setLoading(false));
  }, []);

  const recentActivity = useMemo(() => {
    const txEvents = transactions.slice(0, 30).map((tx) => ({
      id: `tx-${tx.id}`,
      time: tx.createdAt ?? tx.txDate,
      actor: tx.userName ?? tx.userEmail ?? t("admin.unknown"),
      action: tx.type,
      detail: `${Number(tx.amount).toLocaleString()} ${tx.currency}${tx.category ? ` — ${tx.category}` : ""}`,
    }));

    const userEvents = users.slice(0, 10).map((u) => ({
      id: `user-${u.id}`,
      time: u.createdAt,
      actor: u.name ?? u.email,
      action: "register",
      detail: u.email ?? u.phone ?? "",
    }));

    return [...txEvents, ...userEvents]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 40);
  }, [transactions, users]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="admin-panel">
      <div className="panel-header">
        <h2>{t("admin.activityLog")}</h2>
        <span style={{ color: "#6b7280", fontSize: "14px" }}>
          {t("admin.total", { count: recentActivity.length })}
        </span>
      </div>
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t("admin.table.date")}</th>
              <th>{t("admin.table.user")}</th>
              <th>{t("admin.table.type")}</th>
              <th>{t("admin.table.amount")}</th>
            </tr>
          </thead>
          <tbody>
            {recentActivity.map((ev) => (
              <tr key={ev.id}>
                <td>{ev.time?.slice(0, 16).replace("T", " ")}</td>
                <td>{ev.actor}</td>
                <td>
                  {ev.action === "income" || ev.action === "expense" || ev.action === "transfer" ? (
                    <TxTypeBadge type={ev.action} />
                  ) : (
                    <span className="status-badge success">{ev.action}</span>
                  )}
                </td>
                <td style={{ fontSize: "13px", color: "#6b7280" }}>{ev.detail}</td>
              </tr>
            ))}
            {recentActivity.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", color: "#6b7280" }}>
                  {t("admin.noData")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---- Accounts section ----

interface AdminAccount {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  name: string;
  type: string;
  balance: number;
  currency: string;
  isArchived: boolean;
  createdAt: string;
}

function AccountsSection() {
  const { t } = useTranslation();
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    apiClient
      .getAdminAccounts()
      .then((data) => setAccounts(Array.isArray(data) ? data : []))
      .catch((err) => setError(err?.message ?? t("admin.loading")))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return accounts.filter(
      (a) =>
        !q ||
        a.name.toLowerCase().includes(q) ||
        (a.userName ?? "").toLowerCase().includes(q) ||
        (a.userEmail ?? "").toLowerCase().includes(q),
    );
  }, [accounts, search]);

  const totalBalance = useMemo(() => {
    const byCurrency: Record<string, number> = {};
    for (const a of accounts.filter((a) => !a.isArchived)) {
      byCurrency[a.currency] = (byCurrency[a.currency] ?? 0) + Number(a.balance);
    }
    return byCurrency;
  }, [accounts]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="admin-panel">
      <div className="panel-header">
        <h2>{t("admin.menu.accounts")}</h2>
        <span style={{ color: "#6b7280", fontSize: "14px" }}>
          {t("admin.total", { count: filtered.length })}
        </span>
      </div>

      <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
        {Object.entries(totalBalance).map(([currency, balance]) => (
          <div key={currency} className="admin-stat-card" style={{ flex: "0 0 auto", minWidth: "120px" }}>
            <span className="stat-label">{currency}</span>
            <strong className="stat-value">{Number(balance).toLocaleString()}</strong>
          </div>
        ))}
      </div>

      <input
        className="admin-search"
        type="text"
        placeholder={t("admin.searchPlaceholder")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: "100%", marginBottom: "16px" }}
      />

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t("admin.table.user")}</th>
              <th>{t("admin.table.name")}</th>
              <th>{t("admin.table.type")}</th>
              <th>{t("admin.table.amount")}</th>
              <th>{t("admin.table.currency")}</th>
              <th>{t("admin.table.status")}</th>
              <th>{t("admin.table.date")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.id}>
                <td>
                  <div>{a.userName ?? t("admin.unknown")}</div>
                  {a.userEmail && (
                    <div style={{ fontSize: "12px", color: "#6b7280" }}>{a.userEmail}</div>
                  )}
                </td>
                <td>{a.name}</td>
                <td>{a.type}</td>
                <td>{Number(a.balance).toLocaleString()}</td>
                <td>{a.currency}</td>
                <td>
                  <span className={`status-badge ${a.isArchived ? "danger" : "success"}`}>
                    {a.isArchived ? t("accounts.archived") : t("admin.status.active")}
                  </span>
                </td>
                <td>{a.createdAt?.slice(0, 10)}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "#6b7280" }}>
                  {t("admin.noData")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---- Budgets section ----

interface AdminBudget {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  period: string;
  totalLimit: number;
  categoriesCount: number;
  createdAt: string;
}

function BudgetsSection() {
  const { t } = useTranslation();
  const [budgets, setBudgets] = useState<AdminBudget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    apiClient
      .getAdminBudgets()
      .then((data) => setBudgets(Array.isArray(data) ? data : []))
      .catch((err) => setError(err?.message ?? t("admin.loading")))
      .finally(() => setLoading(false));
  }, []);

  const totalLimit = budgets.reduce((s, b) => s + Number(b.totalLimit), 0);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="admin-panel">
      <div className="panel-header">
        <h2>{t("admin.menu.budgets")}</h2>
        <span style={{ color: "#6b7280", fontSize: "14px" }}>
          {t("admin.total", { count: budgets.length })}
        </span>
      </div>

      <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
        <div className="admin-stat-card" style={{ flex: 1 }}>
          <span className="stat-label">{t("budgets.monthlyTotal")}</span>
          <strong className="stat-value">{totalLimit.toLocaleString()}</strong>
        </div>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t("admin.table.user")}</th>
              <th>{t("budgets.period")}</th>
              <th>{t("budgets.limit")}</th>
              <th>{t("budgets.category")}</th>
              <th>{t("admin.table.date")}</th>
            </tr>
          </thead>
          <tbody>
            {budgets.map((b) => (
              <tr key={b.id}>
                <td>
                  <div>{b.userName ?? t("admin.unknown")}</div>
                  {b.userEmail && (
                    <div style={{ fontSize: "12px", color: "#6b7280" }}>{b.userEmail}</div>
                  )}
                </td>
                <td>
                  <span className="status-badge success">{b.period}</span>
                </td>
                <td>{Number(b.totalLimit).toLocaleString()}</td>
                <td>{b.categoriesCount}</td>
                <td>{b.createdAt?.slice(0, 10)}</td>
              </tr>
            ))}
            {budgets.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", color: "#6b7280" }}>
                  {t("admin.noData")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---- Goals section ----

interface AdminGoal {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
  createdAt: string;
}

function GoalsSection() {
  const { t } = useTranslation();
  const [goals, setGoals] = useState<AdminGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    apiClient
      .getAdminGoals()
      .then((data) => setGoals(Array.isArray(data) ? data : []))
      .catch((err) => setError(err?.message ?? t("admin.loading")))
      .finally(() => setLoading(false));
  }, []);

  const totalTarget = goals.reduce((s, g) => s + Number(g.targetAmount), 0);
  const totalSaved = goals.reduce((s, g) => s + Number(g.currentAmount), 0);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="admin-panel">
      <div className="panel-header">
        <h2>{t("admin.menu.goals")}</h2>
        <span style={{ color: "#6b7280", fontSize: "14px" }}>
          {t("admin.total", { count: goals.length })}
        </span>
      </div>

      <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
        <div className="admin-stat-card" style={{ flex: 1 }}>
          <span className="stat-label">{t("goals.totalTarget")}</span>
          <strong className="stat-value">{totalTarget.toLocaleString()}</strong>
        </div>
        <div className="admin-stat-card" style={{ flex: 1 }}>
          <span className="stat-label">{t("goals.totalSaved")}</span>
          <strong className="stat-value" style={{ color: "#15803d" }}>{totalSaved.toLocaleString()}</strong>
        </div>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t("admin.table.user")}</th>
              <th>{t("goals.name")}</th>
              <th>{t("goals.target")}</th>
              <th>{t("goals.saved")}</th>
              <th>{t("goals.progress")}</th>
              <th>{t("goals.deadline")}</th>
              <th>{t("admin.table.date")}</th>
            </tr>
          </thead>
          <tbody>
            {goals.map((g) => {
              const progress =
                Number(g.targetAmount) > 0
                  ? Math.min((Number(g.currentAmount) / Number(g.targetAmount)) * 100, 100)
                  : 0;
              return (
                <tr key={g.id}>
                  <td>
                    <div>{g.userName ?? t("admin.unknown")}</div>
                    {g.userEmail && (
                      <div style={{ fontSize: "12px", color: "#6b7280" }}>{g.userEmail}</div>
                    )}
                  </td>
                  <td>{g.title}</td>
                  <td>{Number(g.targetAmount).toLocaleString()}</td>
                  <td>{Number(g.currentAmount).toLocaleString()}</td>
                  <td>
                    <span
                      className={`status-badge ${progress >= 100 ? "success" : progress >= 80 ? "warning" : "danger"}`}
                    >
                      {Math.round(progress)}%
                    </span>
                  </td>
                  <td>{g.deadline?.slice(0, 10) ?? "-"}</td>
                  <td>{g.createdAt?.slice(0, 10)}</td>
                </tr>
              );
            })}
            {goals.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "#6b7280" }}>
                  {t("admin.noData")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---- Settings section ----

function SettingsSection() {
  const { t } = useTranslation();
  return (
    <div className="admin-panel">
      <div className="panel-header">
        <h2>{t("admin.menu.settings")}</h2>
      </div>
      <div className="summary-list">
        <div className="summary-item">
          <span>{t("admin.systemStatus")}</span>
          <span className="status-badge success">{t("admin.operational")}</span>
        </div>
        <div className="summary-item">
          <span>{t("admin.version")}</span>
          <strong>1.0.0</strong>
        </div>
        <div className="summary-item">
          <span>{t("admin.environment")}</span>
          <strong>{import.meta.env.MODE}</strong>
        </div>
        <div className="summary-item">
          <span>{t("admin.database")}</span>
          <span className="status-badge success">{t("admin.connected")}</span>
        </div>
      </div>
    </div>
  );
}

// ---- Main component ----

export default function AdminDashboard() {
  const { t } = useTranslation();
  const useStore = useAppStore();
  const currentUser = useStore((state) => state.currentUser);
  const [activeMenu, setActiveMenu] = useState("dashboard");

  const sidebarItems = [
    { key: "dashboard", label: t("admin.menu.dashboard") },
    { key: "users", label: t("admin.menu.users") },
    { key: "accounts", label: t("admin.menu.accounts") },
    { key: "transactions", label: t("admin.menu.transactions") },
    { key: "budgets", label: t("admin.menu.budgets") },
    { key: "goals", label: t("admin.menu.goals") },
    { key: "categories", label: t("admin.menu.categories") },
    { key: "notifications", label: t("admin.menu.notifications") },
    { key: "reports", label: t("admin.menu.reports") },
    { key: "settings", label: t("admin.menu.settings") },
    { key: "logs", label: t("admin.menu.logs") },
  ];

  const userInitials = currentUser?.name
    ? currentUser.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "AU";

  const renderContent = () => {
    switch (activeMenu) {
      case "dashboard":
        return <DashboardSection />;
      case "users":
        return <UsersSection />;
      case "transactions":
        return <TransactionsSection />;
      case "accounts":
        return <AccountsSection />;
      case "budgets":
        return <BudgetsSection />;
      case "goals":
        return <GoalsSection />;
      case "categories":
        return <CategoriesSection />;
      case "reports":
        return <ReportsSection />;
      case "logs":
        return <LogsSection />;
      case "settings":
        return <SettingsSection />;
      default:
        return (
          <ComingSoon
            label={
              sidebarItems.find((i) => i.key === activeMenu)?.label ?? activeMenu
            }
          />
        );
    }
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-logo">FinArm Admin</div>

        <nav className="admin-nav">
          {sidebarItems.map((item) => (
            <button
              key={item.key}
              className={`admin-nav-item ${activeMenu === item.key ? "active" : ""}`}
              onClick={() => setActiveMenu(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h1 className="admin-title">{t("admin.title")}</h1>
            <p className="admin-subtitle">{t("admin.subtitle")}</p>
          </div>

          <div className="admin-header-right">
            <input
              className="admin-search"
              type="text"
              placeholder={t("admin.searchPlaceholder")}
            />
            <div className="admin-profile" title={currentUser?.name ?? "Admin"}>
              {userInitials}
            </div>
          </div>
        </header>

        {renderContent()}
      </main>
    </div>
  );
}
