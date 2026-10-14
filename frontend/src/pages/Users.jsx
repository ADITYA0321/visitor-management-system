import { useEffect, useState, useMemo, useCallback } from "react";
import axios from "../axios";
import { Search, Filter, Pencil, Trash2, Key, X, AlertTriangle, Eye, EyeOff } from "lucide-react";

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 🔔 Success Notification State
  const [successMessage, setSuccessMessage] = useState("");

  const [error, setError] = useState("");
  const [modalError, setModalError] = useState("");
  const [deleteModalError, setDeleteModalError] = useState("");
  const [resetModalError, setResetModalError] = useState("");
  const [resetSuccessMsg, setResetSuccessMsg] = useState("");

  // 🔍 Search & Filter States
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // ✏️ Edit Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // 🗑️ Delete Modal States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // 🔑 Reset Password Modal States
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [userToReset, setUserToReset] = useState(null);
  const [newPassword, setNewPassword] = useState("");

  // 📝 Controlled Edit Form State
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "",
  });

  // Safe memoized current user check
  const currentUser = useMemo(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, []);

  const isAdmin = currentUser?.role === "admin";

  // Helper to retrieve auth header securely
  const getAuthHeader = useCallback(() => {
    try {
      const stored = localStorage.getItem("user");
      const userData = stored ? JSON.parse(stored) : null;
      return userData?.token ? { Authorization: `Bearer ${userData.token}` } : {};
    } catch {
      return {};
    }
  }, []);

  // Edit Button Click Handler
  const handleEdit = (user) => {
    setSuccessMessage("");
    setSelectedUser(user);
    setModalError("");

    setEditForm({
      name: user.name || "",
      email: user.email || "",
      role: user.role || "visitor",
    });

    setIsModalOpen(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const closeModal = () => {
    if (saving) return;
    setIsModalOpen(false);
    setSelectedUser(null);
    setModalError("");
  };

  // 💾 Save Changes Handler
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setModalError("");

      const response = await axios.patch(
        `/api/users/${selectedUser._id}`,
        editForm,
        { headers: getAuthHeader() }
      );

      const updatedUser = response.data.user || response.data;
      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u._id === selectedUser._id
            ? { ...u, ...editForm, ...updatedUser }
            : u
        )
      );

      setSuccessMessage("User updated successfully");
      closeModal();

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err) {
      console.error("Error updating user:", err);
      setModalError(
        err.response?.data?.error || "Failed to update user. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // 🗑️ Delete Modal Handlers
  const openDeleteModal = (user) => {
    setUserToDelete(user);
    setDeleteModalError("");
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    if (deleting) return;
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
    setDeleteModalError("");
  };

  const handleDeleteUser = async (e) => {
    e.preventDefault();
    if (!userToDelete) return;

    try {
      setDeleting(true);
      setDeleteModalError("");

      await axios.delete(`/api/users/${userToDelete._id}`, {
        headers: getAuthHeader(),
      });

      setUsers((prevUsers) =>
        prevUsers.filter((u) => u._id !== userToDelete._id)
      );

      closeDeleteModal();
    } catch (err) {
      console.error("Error deleting user:", err);
      setDeleteModalError(
        err.response?.data?.error || "Failed to delete user. Please try again."
      );
    } finally {
      setDeleting(false);
    }
  };

  // 🔑 Reset Password Modal Handlers
  const openResetModal = (user) => {
    setUserToReset(user);
    setNewPassword("");
    setResetModalError("");
    setResetSuccessMsg("");
    setShowPassword(false);
    setIsResetModalOpen(true);
  };

  const closeResetModal = () => {
    if (resetting) return;
    setIsResetModalOpen(false);
    setUserToReset(null);
    setNewPassword("");
    setResetModalError("");
    setResetSuccessMsg("");
    setShowPassword(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setResetModalError("Password must be at least 6 characters long.");
      return;
    }

    try {
      setResetting(true);
      setResetModalError("");

      await axios.patch(
        `/api/users/${userToReset._id}/password`,
        { password: newPassword },
        { headers: getAuthHeader() }
      );

      setResetSuccessMsg("Password reset successfully!");

      if (currentUser?._id === userToReset._id) {
        setTimeout(() => {
          localStorage.removeItem("user");
          window.location.href = "/";
        }, 1500);
      } else {
        setTimeout(() => {
          closeResetModal();
        }, 1500);
      }
    } catch (err) {
      console.error("Error resetting password:", err);
      setResetModalError(
        err.response?.data?.error || "Failed to reset password. Try again."
      );
    } finally {
      setResetting(false);
    }
  };

  // Fetch Users with debounce handling for text search
  useEffect(() => {
    const controller = new AbortController();

    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await axios.get("/api/users", {
          params: {
            search: search,
            role: roleFilter === "all" ? "" : roleFilter,
          },
          headers: getAuthHeader(),
          signal: controller.signal,
        });

        setUsers(response.data.users || []);
      } catch (err) {
        if (axios.isCancel(err)) return;
        console.error("Error fetching users:", err);
        setError(
          err.response?.data?.error || "Failed to fetch users list"
        );
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);

    return () => {
      clearTimeout(timer); // Fix: Fixed cleanup syntax
      controller.abort();
    };
  }, [search, roleFilter, getAuthHeader]);

  return (
    <div className="space-y-6">
      {/* 🟢 Top Success Banner */}
      {successMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-xl text-sm">
          {successMessage}
        </div>
      )}

      {/* 🔮 Page Header + Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-gray-800/80">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            User Management
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Manage system users, roles, and administrative access.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#161b22] border border-gray-800/80 focus:border-purple-500/50 text-gray-200 text-sm rounded-xl pl-9 pr-4 py-2 outline-none transition placeholder-gray-500 focus:ring-1 focus:ring-purple-500/30"
            />
          </div>

          <div className="relative w-full sm:w-44">
            <Filter
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full bg-[#161b22] border border-gray-800/80 focus:border-purple-500/50 text-gray-200 text-sm rounded-xl pl-9 pr-3 py-2 outline-none transition cursor-pointer appearance-none"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="security">Security</option>
              <option value="employee">Employee</option>
              <option value="visitor">Visitor</option>
            </select>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center p-12 bg-[#161b22]/60 border border-gray-800/80 rounded-2xl backdrop-blur-md">
          <div className="text-purple-400 text-sm font-medium animate-pulse flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
            Loading users...
          </div>
        </div>
      )}

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="text-gray-300 text-sm bg-[#161b22]/40 border border-gray-800/60 p-3.5 rounded-xl flex items-center justify-between">
          <span className="text-gray-400">Total System Users:</span>
          <span className="text-purple-400 font-bold text-base px-2.5 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded-md">
            {users.length}
          </span>
        </div>
      )}

      {/* 📋 Table Structure */}
      {!loading && !error && (
        <div className="bg-[#161b22]/80 border border-gray-800/80 rounded-2xl overflow-hidden backdrop-blur-md shadow-xl shadow-black/40">
          <div className="p-5 border-b border-gray-800/80 flex items-center justify-between">
            <h2 className="text-base font-semibold text-white tracking-wide">
              All Users
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-purple-950/20 border-b border-gray-800/80 text-gray-400 uppercase text-[11px] font-semibold tracking-wider">
                  <th className="py-3.5 px-5">Name</th>
                  <th className="py-3.5 px-5">Email</th>
                  <th className="py-3.5 px-5">Role</th>
                  <th className="py-3.5 px-5">Created</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-800/60 text-sm text-gray-300">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500 text-sm">
                      No users match the search criteria.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr
                      key={user._id}
                      className="hover:bg-purple-950/10 transition-colors duration-150"
                    >
                      <td className="py-4 px-5 font-medium text-white">
                        {user.name}
                      </td>

                      <td className="py-4 px-5 text-gray-400">
                        {user.email}
                      </td>

                      <td className="py-4 px-5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                            user.role === "admin"
                              ? "bg-purple-500/10 text-purple-400 border border-purple-500/30"
                              : "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                          }`}
                        >
                          {user.role || "user"}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-gray-400 text-xs">
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString()
                          : "N/A"}
                      </td>

                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => openResetModal(user)}
                              title="Reset Password"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-400 border border-amber-500/30 rounded-lg hover:bg-amber-500/10 transition cursor-pointer"
                            >
                              <Key size={14} />
                              Reset Pass
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleEdit(user)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-400 border border-purple-500/30 rounded-lg hover:bg-purple-500/10 transition cursor-pointer"
                          >
                            <Pencil size={14} />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => openDeleteModal(user)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-400 border border-rose-500/30 rounded-lg hover:bg-rose-500/10 transition cursor-pointer"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 🪟 Edit User Modal */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161b22] border border-gray-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                Edit User Details
              </h3>
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800/60 transition cursor-pointer disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div className="mx-5 mt-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-lg">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSave}>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1 font-medium">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={editForm.name}
                    onChange={handleEditChange}
                    disabled={saving}
                    className="w-full bg-[#0d1117] border border-gray-800 focus:border-purple-500/50 rounded-lg px-3.5 py-2.5 text-white outline-none text-sm transition disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1 font-medium">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={editForm.email}
                    onChange={handleEditChange}
                    disabled={saving}
                    className="w-full bg-[#0d1117] border border-gray-800 focus:border-purple-500/50 rounded-lg px-3.5 py-2.5 text-white outline-none text-sm transition disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1 font-medium">
                    Role
                  </label>
                  <select
                    name="role"
                    value={editForm.role}
                    onChange={handleEditChange}
                    disabled={saving}
                    className="w-full bg-[#0d1117] border border-gray-800 focus:border-purple-500/50 rounded-lg px-3.5 py-2.5 text-white outline-none text-sm transition cursor-pointer disabled:opacity-50"
                  >
                    <option value="admin">Admin</option>
                    <option value="security">Security</option>
                    <option value="employee">Employee</option>
                    <option value="visitor">Visitor</option>
                  </select>
                </div>
              </div>

              <div className="p-5 border-t border-gray-800 flex justify-end gap-3 bg-[#161b22]/50">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white transition cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ⚠️ Delete User Modal */}
      {isDeleteModalOpen && userToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161b22] border border-gray-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-400 font-semibold">
                <AlertTriangle size={20} />
                <span>Delete User</span>
              </div>
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleting}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800/60 transition cursor-pointer disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            {deleteModalError && (
              <div className="mx-5 mt-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-lg">
                {deleteModalError}
              </div>
            )}

            <form onSubmit={handleDeleteUser}>
              <div className="p-5 text-sm text-gray-300 space-y-2">
                <p>
                  Are you sure you want to delete{" "}
                  <span className="font-bold text-white">{userToDelete.name}</span>?
                </p>
                <p className="text-xs text-gray-400">
                  This action cannot be undone. All associated data for{" "}
                  <span className="text-gray-300">{userToDelete.email}</span> will be removed.
                </p>
              </div>

              <div className="p-5 border-t border-gray-800 flex justify-end gap-3 bg-[#161b22]/50">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  disabled={deleting}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white transition cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleting}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium rounded-lg transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {deleting ? "Deleting..." : "Delete User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🔑 Reset Password Modal */}
      {isResetModalOpen && userToReset && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161b22] border border-gray-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400 font-semibold">
                <Key size={18} />
                <span>Reset User Password</span>
              </div>
              <button
                type="button"
                onClick={closeResetModal}
                disabled={resetting}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800/60 transition cursor-pointer disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            {resetModalError && (
              <div className="mx-5 mt-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-lg">
                {resetModalError}
              </div>
            )}

            {resetSuccessMsg && (
              <div className="mx-5 mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-lg">
                {resetSuccessMsg}
              </div>
            )}

            <form onSubmit={handleResetPassword}>
              <div className="p-5 space-y-4">
                <p className="text-sm text-gray-300">
                  Set a new password for{" "}
                  <span className="font-semibold text-white">{userToReset.name}</span> (
                  <span className="text-gray-400">{userToReset.email}</span>).
                </p>

                <div>
                  <label className="block text-sm text-gray-400 mb-1 font-medium">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password (min. 6 characters)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={resetting}
                      className="w-full bg-[#0d1117] border border-gray-800 focus:border-amber-500/50 rounded-lg px-3.5 py-2.5 pr-10 text-white outline-none text-sm transition disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-gray-800 flex justify-end gap-3 bg-[#161b22]/50">
                <button
                  type="button"
                  onClick={closeResetModal}
                  disabled={resetting}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white transition cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetting}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium rounded-lg transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {resetting ? "Resetting..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Users;