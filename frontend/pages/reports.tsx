import { useState, useEffect } from "react";
import { useQuery } from "@apollo/client";
import Layout from "../components/Layout";
import { GET_ALL_USERS_TIME_ENTRIES_REPORT } from "../src/queries/time-entries";
import { LIST_PROJECTS } from "../src/queries/projects";
import {
  UserTimeEntriesReport,
  MonthlyReportStats,
} from "../src/types/timeEntry";

export default function Reports() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );
  const [filterType, setFilterType] = useState<"all" | "missing" | "complete">(
    "all"
  );

  // Dropdown states
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);

  const { data, loading, error, refetch } = useQuery(
    GET_ALL_USERS_TIME_ENTRIES_REPORT,
    {
      variables: {
        month: selectedMonth,
        year: selectedYear,
        projectId: selectedProjectId,
      },
    }
  );

  // Fetch projects list
  const { data: projectsData } = useQuery(LIST_PROJECTS, {
    errorPolicy: "all",
  });

  // Calculate working days in the selected month (exclude weekends)
  const getWorkingDaysInMonth = (month: number, year: number): number => {
    const daysInMonth = new Date(year, month, 0).getDate();
    let workingDays = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dayOfWeek = date.getDay();
      // Skip Saturday (6) and Sunday (0)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDays++;
      }
    }

    return workingDays;
  };

  // Calculate statistics
  const calculateStats = (
    reports: UserTimeEntriesReport[]
  ): MonthlyReportStats => {
    const workingDaysInMonth = getWorkingDaysInMonth(
      selectedMonth,
      selectedYear
    );
    const totalUsers = reports.length;

    let usersWithMissingEntries = 0;
    let usersWithCompleteEntries = 0;

    reports.forEach((report) => {
      const workEntries = report.entries.filter(
        (entry) => entry.entryType === "work"
      );
      const uniqueWorkDays = new Set(workEntries.map((entry) => entry.date))
        .size;

      if (uniqueWorkDays != workingDaysInMonth) {
        usersWithMissingEntries++;
      } else {
        usersWithCompleteEntries++;
      }
    });

    return {
      totalUsers,
      usersWithMissingEntries,
      usersWithCompleteEntries,
      workingDaysInMonth,
    };
  };

  // Filter users based on filter type
  const filterUsers = (reports: UserTimeEntriesReport[]) => {
    if (!reports) return [];

    const workingDaysInMonth = getWorkingDaysInMonth(
      selectedMonth,
      selectedYear
    );

    return reports.filter((report) => {
      const workEntries = report.entries.filter(
        (entry) => entry.entryType === "work"
      );
      const uniqueWorkDays = new Set(workEntries.map((entry) => entry.date))
        .size;

      switch (filterType) {
        case "missing":
          return uniqueWorkDays < workingDaysInMonth;
        case "complete":
          return uniqueWorkDays >= workingDaysInMonth;
        default:
          return true;
      }
    });
  };

  const handleMonthYearChange = () => {
    refetch({
      month: selectedMonth,
      year: selectedYear,
    });
  };

  useEffect(() => {
    document.title = "Reports - TimeSheet App";
  }, []);

  useEffect(() => {
    handleMonthYearChange();
  }, [selectedMonth, selectedYear, selectedProjectId]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".dropdown-container")) {
        setIsMonthDropdownOpen(false);
        setIsYearDropdownOpen(false);
        setIsProjectDropdownOpen(false);
      }
    };

    if (isMonthDropdownOpen || isYearDropdownOpen || isProjectDropdownOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [isMonthDropdownOpen, isYearDropdownOpen, isProjectDropdownOpen]);

  const reports: UserTimeEntriesReport[] =
    data?.getAllUsersTimeEntriesReport || [];
  const stats = calculateStats(reports);
  const filteredUsers = filterUsers(reports);
  const [exportStatus, setExportStatus] = useState<"idle" | "done">("idle");
  const [fullExportStatus, setFullExportStatus] = useState<
    "idle" | "loading" | "done"
  >("idle");

  const projects = projectsData?.listProjects || [];
  const selectedProject = projects.find((p: any) => p.id === selectedProjectId);

  const escapeCsvField = (s?: string | number | null) => {
    if (s === null || s === undefined) return '""';
    return '"' + String(s).replace(/"/g, '""') + '"';
  };

  const exportCsv = (
    users: typeof filteredUsers,
    month: number,
    year: number
  ) => {
    // Build CSV with headers: Name, entries
    const rows: string[] = [];
    rows.push(["Name", "entries"].map(escapeCsvField).join(","));

    users.forEach((u) => {
      const name =
        u.userFirstName && u.userLastName
          ? `${u.userFirstName} ${u.userLastName}`
          : u.userEmail.split("@")[0];
      const entriesCount = u.entries?.length ?? 0;
      rows.push([escapeCsvField(name), escapeCsvField(entriesCount)].join(","));
    });

    const csvContent = "\uFEFF" + rows.join("\n"); // prepend BOM for Excel compatibility
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${month}-${year}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    setExportStatus("done");
    setTimeout(() => setExportStatus("idle"), 2000);
  };

  const exportFullReport = async (month: number, year: number) => {
    setFullExportStatus("loading");

    try {
      const token = localStorage.getItem("token");
      const projectParam = selectedProjectId
        ? `&projectId=${selectedProjectId}`
        : "";
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_GRAPHQL_URL?.replace("/graphql", "") ||
          "http://localhost:8181"
        }/time-entries/export-csv?month=${month}&year=${year}${projectParam}`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to export full report");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `timesheet-report-${month}-${year}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setFullExportStatus("done");
      setTimeout(() => setFullExportStatus("idle"), 2000);
    } catch (error) {
      console.error("Export failed:", error);
      setFullExportStatus("idle");
    }
  };

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64 bg-gray-50">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg font-medium">
              Loading reports...
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="p-6 min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="glass-card rounded-2xl p-8 bg-gradient-to-r from-red-50 to-pink-50 border border-white/20">
              <div className="text-center">
                <div className="text-red-600 text-xl mb-4">
                  ⚠️ Error loading reports
                </div>
                <p className="text-gray-600 mb-4">{error.message}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {/* Enhanced Header */}
          <div className="glass-card rounded-2xl p-6 mb-8 bg-gradient-to-r from-purple-50 to-blue-50 border border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
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
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Time Tracking Reports
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Admin view of user time tracking statistics and entries
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {months[selectedMonth - 1]} {selectedYear}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {stats.totalUsers} Users Tracked
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="hidden md:flex items-center gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.totalUsers}
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">
                    Total Users
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.usersWithCompleteEntries}
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">
                    Complete
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {stats.usersWithMissingEntries}
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">
                    Incomplete
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Month/Year/Project Selector */}
          <div className="glass-card rounded-2xl p-6 mb-8 shadow-lg relative z-50">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Filter by:
                </label>
              </div>

              {/* Month Dropdown */}
              <div className="relative z-[70] dropdown-container">
                <button
                  onClick={() => {
                    setIsMonthDropdownOpen(!isMonthDropdownOpen);
                    setIsYearDropdownOpen(false);
                    setIsProjectDropdownOpen(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                >
                  <span className="text-sm font-medium text-gray-700">
                    {months[selectedMonth - 1]}
                  </span>
                  <svg
                    className={`w-4 h-4 text-gray-500 transform transition-transform ${
                      isMonthDropdownOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {isMonthDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-[100] max-h-60 overflow-y-auto">
                    {months.map((month, index) => (
                      <button
                        key={month}
                        onClick={() => {
                          setSelectedMonth(index + 1);
                          setIsMonthDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-100 first:rounded-t-xl last:rounded-b-xl transition-colors ${
                          selectedMonth === index + 1
                            ? "bg-blue-50 text-blue-700 font-medium"
                            : "text-gray-700"
                        }`}
                      >
                        {month}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Year Dropdown */}
              <div className="relative z-[70] dropdown-container">
                <button
                  onClick={() => {
                    setIsYearDropdownOpen(!isYearDropdownOpen);
                    setIsMonthDropdownOpen(false);
                    setIsProjectDropdownOpen(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                >
                  <span className="text-sm font-medium text-gray-700">
                    {selectedYear}
                  </span>
                  <svg
                    className={`w-4 h-4 text-gray-500 transform transition-transform ${
                      isYearDropdownOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {isYearDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-28 bg-white border border-gray-200 rounded-xl shadow-xl z-[100]">
                    {years.map((year) => (
                      <button
                        key={year}
                        onClick={() => {
                          setSelectedYear(year);
                          setIsYearDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-100 first:rounded-t-xl last:rounded-b-xl transition-colors ${
                          selectedYear === year
                            ? "bg-blue-50 text-blue-700 font-medium"
                            : "text-gray-700"
                        }`}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Project Dropdown */}
              <div className="relative z-[70] dropdown-container">
                <button
                  onClick={() => {
                    setIsProjectDropdownOpen(!isProjectDropdownOpen);
                    setIsMonthDropdownOpen(false);
                    setIsYearDropdownOpen(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                >
                  <span className="text-sm font-medium text-gray-700">
                    {selectedProject ? selectedProject.name : "All Projects"}
                  </span>
                  <svg
                    className={`w-4 h-4 text-gray-500 transform transition-transform ${
                      isProjectDropdownOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {isProjectDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-[100] max-h-60 overflow-y-auto">
                    <button
                      onClick={() => {
                        setSelectedProjectId(null);
                        setIsProjectDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-100 first:rounded-t-xl transition-colors ${
                        selectedProjectId === null
                          ? "bg-blue-50 text-blue-700 font-medium"
                          : "text-gray-700"
                      }`}
                    >
                      All Projects
                    </button>
                    {projects.map((project: any) => (
                      <button
                        key={project.id}
                        onClick={() => {
                          setSelectedProjectId(project.id);
                          setIsProjectDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-100 last:rounded-b-xl transition-colors ${
                          selectedProjectId === project.id
                            ? "bg-blue-50 text-blue-700 font-medium"
                            : "text-gray-700"
                        }`}
                      >
                        {project.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="text-sm text-gray-600">
                Showing report for {months[selectedMonth - 1]} {selectedYear}
                {selectedProject && ` • ${selectedProject.name}`}
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg
                      className="w-5 h-5 text-white"
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
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-600 truncate">
                      Total Users
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900">
                      {stats.totalUsers}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-red-50 to-pink-50">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg
                      className="w-5 h-5 text-white"
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
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-600 truncate">
                      Incomplete Entries
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900">
                      {stats.usersWithMissingEntries}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-green-50 to-emerald-50">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-600 truncate">
                      Complete Entries
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900">
                      {stats.usersWithCompleteEntries}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-purple-50 to-violet-50">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-600 truncate">
                      Working Days
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900">
                      {stats.workingDaysInMonth}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="glass-card rounded-2xl p-6 mb-8 shadow-lg">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">
                Filter Users:
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => setFilterType("all")}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    filterType === "all"
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:shadow-md"
                  }`}
                >
                  All Users ({stats.totalUsers})
                </button>
                <button
                  onClick={() => setFilterType("missing")}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    filterType === "missing"
                      ? "bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:shadow-md"
                  }`}
                >
                  Incomplete Entries ({stats.usersWithMissingEntries})
                </button>
                <button
                  onClick={() => setFilterType("complete")}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    filterType === "complete"
                      ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:shadow-md"
                  }`}
                >
                  Complete Entries ({stats.usersWithCompleteEntries})
                </button>
              </div>
            </div>
          </div>

          {/* User List */}
          <div className="glass-card rounded-2xl shadow-lg overflow-hidden">
            <div className="px-6 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    User Time Entries ({filteredUsers.length} users)
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Overview of user attendance and hours tracked
                  </p>
                </div>

                <div className="ml-4 flex gap-2">
                  <button
                    onClick={() =>
                      exportCsv(filteredUsers, selectedMonth, selectedYear)
                    }
                    className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
                  >
                    {exportStatus === "done" ? "Exported" : `Export entries`}
                  </button>

                  <button
                    onClick={() =>
                      exportFullReport(selectedMonth, selectedYear)
                    }
                    disabled={fullExportStatus === "loading"}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 border border-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {fullExportStatus === "loading"
                      ? "Exporting..."
                      : fullExportStatus === "done"
                      ? "Exported!"
                      : "Export Full Report"}
                  </button>
                </div>
              </div>
            </div>

            {filteredUsers.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No users found
                </h3>
                <p className="text-sm text-gray-500">
                  No users match the current filter criteria.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Total Entries
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Work Days
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Total Hours
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredUsers.map((user) => {
                      const workEntries = user.entries.filter(
                        (entry) => entry.entryType === "work"
                      );
                      const uniqueWorkDays = new Set(
                        workEntries.map((entry) => entry.date)
                      ).size;
                      const totalHours = workEntries.reduce(
                        (sum, entry) => sum + entry.hours,
                        0
                      );
                      const isComplete =
                        uniqueWorkDays == stats.workingDaysInMonth;

                      return (
                        <tr
                          key={user.userId}
                          className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 transition-all duration-200"
                        >
                          <td className="px-6 py-6 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-12 w-12">
                                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg">
                                  {user.userEmail.charAt(0).toUpperCase()}
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-bold text-gray-900">
                                  {user.userFirstName && user.userLastName
                                    ? `${user.userFirstName} ${user.userLastName}`
                                    : user.userEmail.split("@")[0]}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {user.userEmail}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-6 whitespace-nowrap">
                            <div className="text-sm font-bold text-gray-900">
                              {user.entries.length}
                            </div>
                          </td>
                          <td className="px-6 py-6 whitespace-nowrap">
                            <div className="text-sm font-bold text-gray-900">
                              {uniqueWorkDays} / {stats.workingDaysInMonth}
                            </div>
                          </td>
                          <td className="px-6 py-6 whitespace-nowrap">
                            <div className="text-sm font-bold text-gray-900">
                              {totalHours.toFixed(1)}h
                            </div>
                          </td>
                          <td className="px-6 py-6 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-3 py-1 text-xs font-bold rounded-full shadow-sm ${
                                isComplete
                                  ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                                  : "bg-gradient-to-r from-red-500 to-pink-600 text-white"
                              }`}
                            >
                              {isComplete ? "✓ Complete" : "⚠ Incomplete"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
