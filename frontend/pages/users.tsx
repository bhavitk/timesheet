import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import { gql, useQuery, useMutation } from "@apollo/client";
import { useUser } from "@/context/UserContext";

const LIST_USERS = gql`
  query ListUsers {
    listUsers {
      id
      email
      name
      isAdmin
      project {
        id
        name
      }
      projectId
    }
  }
`;

const CREATE_USER = gql`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      email
      name
      isAdmin
      project {
        id
        name
      }
      projectId
    }
  }
`;

const UPDATE_USER = gql`
  mutation UpdateUser($input: UpdateUserInput!) {
    updateUser(input: $input) {
      id
      email
      name
      isAdmin
      project {
        id
        name
      }
      projectId
    }
  }
`;

const DELETE_USER = gql`
  mutation DeleteUser($id: String!) {
    deleteUser(id: $id) {
      id
      email
    }
  }
`;

const LIST_PROJECTS = gql`
  query ListProjects {
    listProjects {
      id
      name
    }
  }
`;

interface User {
  id: string;
  email: string;
  name?: string;
  isAdmin: boolean;
  project?: {
    id: string;
    name: string;
  };
  projectId?: string;
}

export default function Users() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const user = useUser().user;

  // Form state
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    password: "",
    isAdmin: false,
    projectId: "",
  });

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.push("/");
      return;
    }
    document.title = "Users - TimeSheet App";
    setIsChecking(false);
  }, [router]);

  const { data, loading, error, refetch } = useQuery(LIST_USERS, {
    skip: isChecking,
    fetchPolicy: "network-only",
  });

  const { data: projectsData } = useQuery(LIST_PROJECTS, {
    skip: isChecking,
  });

  const [createUser] = useMutation(CREATE_USER);
  const [updateUser] = useMutation(UPDATE_USER);
  const [deleteUser] = useMutation(DELETE_USER);

  const openAddModal = () => {
    setModalMode("add");
    setFormData({
      email: "",
      name: "",
      password: "",
      isAdmin: false,
      projectId: "",
    });
    setEditUser(null);
    setShowModal(true);
  };

  const openEditModal = (user: User) => {
    setModalMode("edit");
    setFormData({
      email: user.email,
      name: user.name || "",
      password: "",
      isAdmin: user.isAdmin,
      projectId: user.projectId || "",
    });
    setEditUser(user);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditUser(null);
    setFormData({
      email: "",
      name: "",
      password: "",
      isAdmin: false,
      projectId: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modalMode === "add") {
        await createUser({
          variables: {
            input: {
              email: formData.email,
              password: formData.password,
              name: formData.name || null,
              isAdmin: formData.isAdmin,
              projectId: formData.projectId || null,
            },
          },
        });
      } else if (editUser) {
        const input: any = {
          id: editUser.id,
          email: formData.email,
          name: formData.name || null,
          isAdmin: formData.isAdmin,
          projectId: formData.projectId || null,
        };
        if (formData.password) {
          input.password = formData.password;
        }
        await updateUser({ variables: { input } });
      }
      closeModal();
      refetch();
    } catch (err: any) {
      alert("Error: " + (err.message || "Unknown error"));
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      await deleteUser({ variables: { id: userId } });
      setDeleteConfirm(null);
      refetch();
    } catch (err: any) {
      alert("Error deleting user: " + (err.message || "Unknown error"));
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg font-medium">Checking auth...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Enhanced Header */}
          <div className="glass-card rounded-2xl p-6 mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Users Management
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Manage team members and user accounts
                  </p>
                  {data?.listUsers && (
                    <div className="flex items-center gap-4 mt-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {data.listUsers.length}{" "}
                        {data.listUsers.length === 1 ? "User" : "Users"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              {user?.isAdmin && (
                <div className="flex gap-3">
                  <button
                    className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-medium transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
                    onClick={openAddModal}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Add User
                  </button>
                  <button
                    className="px-4 py-2.5 bg-white/80 hover:bg-white text-gray-700 rounded-xl font-medium transition-all duration-200 border border-gray-200 shadow-sm hover:shadow-md"
                    onClick={() => refetch()}
                  >
                    <svg
                      className="w-4 h-4 inline mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Refresh
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Users Table */}
          <div className="glass-card rounded-2xl overflow-hidden">
            {loading && (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading users...</p>
              </div>
            )}

            {error && (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="text-red-600 font-medium">Error loading users</p>
                <p className="text-gray-600 text-sm mt-1">{error.message}</p>
              </div>
            )}

            {!loading && data?.listUsers && data.listUsers.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Project
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.listUsers.map((user: User, index: number) => (
                      <tr
                        key={user.id}
                        className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                              {(user.name || user.email)
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.name || "Unnamed User"}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {user.id.slice(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {user.email}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {user.project ? (
                              user.project.name
                            ) : (
                              <span className="text-gray-400 italic">
                                No project assigned
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.isAdmin
                                ? "bg-purple-100 text-purple-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {user.isAdmin ? "Admin" : "User"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-medium text-sm transition-colors duration-200"
                              onClick={() => openEditModal(user)}
                            >
                              Edit
                            </button>
                            <button
                              className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium text-sm transition-colors duration-200"
                              onClick={() => setDeleteConfirm(user.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!loading &&
              (!data || data.listUsers.length === 0) &&
              user?.isAdmin && (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No users found
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Get started by adding your first user.
                  </p>
                  <button className="btn-primary" onClick={openAddModal}>
                    Add First User
                  </button>
                </div>
              )}
          </div>

          {/* Add/Edit Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="glass-card rounded-2xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    {modalMode === "add" ? "Add User" : "Edit User"}
                  </h2>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Password{" "}
                      {modalMode === "edit" && "(leave blank to keep current)"}
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="input-field"
                      required={modalMode === "add"}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Project
                    </label>
                    <select
                      value={formData.projectId}
                      onChange={(e) =>
                        setFormData({ ...formData, projectId: e.target.value })
                      }
                      className="input-field"
                    >
                      <option value="">No project assigned</option>
                      {projectsData?.listProjects?.map((project: any) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.isAdmin}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            isAdmin: e.target.checked,
                          })
                        }
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-sm font-semibold text-gray-700">
                        Admin User
                      </span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Admin users have additional privileges and access to
                      management features.
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="flex-1 btn-primary">
                      {modalMode === "add" ? "Add User" : "Update User"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {deleteConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="glass-card rounded-2xl max-w-sm w-full p-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Delete User
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Are you sure you want to delete this user? This action
                    cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDelete(deleteConfirm)}
                      className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors duration-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
