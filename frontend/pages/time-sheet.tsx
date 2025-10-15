import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useQuery, useMutation } from "@apollo/client";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
} from "date-fns";
import Layout from "../components/Layout";
import {
  GET_TIME_ENTRIES,
  CREATE_TIME_ENTRY,
  UPDATE_TIME_ENTRY,
  DELETE_TIME_ENTRY,
} from "../src/queries/time-entries";
import {
  TimeEntry as ApiTimeEntry,
  CreateTimeEntryInput,
  UpdateTimeEntryInput,
} from "../src/types/timeEntry";

interface DayEntry {
  date: string;
  hours: number | null;
  description: string | null;
  isMissing: boolean;
}

interface FormData {
  date: string;
  hours: number;
  description: string;
  entryType: "work" | "holiday" | "leave";
}

export default function TimeSheet() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);

  // Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ApiTimeEntry | null>(null);
  const [formData, setFormData] = useState<FormData>({
    date: "",
    hours: 8,
    description: "",
    entryType: "work",
  });
  const [entryType, setEntryType] = useState<"work" | "holiday" | "leave">(
    "work"
  );

  // Generate month string for GraphQL query
  const currentMonth = format(new Date(selectedYear, selectedMonth), "yyyy-MM");

  // GraphQL queries and mutations
  const { data, loading, error, refetch } = useQuery(GET_TIME_ENTRIES, {
    variables: { year: selectedYear, month: selectedMonth },
    errorPolicy: "all",
  });

  const [createTimeEntry, { loading: createLoading }] = useMutation(
    CREATE_TIME_ENTRY,
    {
      onCompleted: () => {
        refetch();
        setIsModalOpen(false);
        resetForm();
      },
      onError: (error) => {
        console.error("Create error:", error);
        alert(error.message);
      },
    }
  );

  const [updateTimeEntry, { loading: updateLoading }] = useMutation(
    UPDATE_TIME_ENTRY,
    {
      onCompleted: () => {
        refetch();
        setIsModalOpen(false);
        resetForm();
      },
      onError: (error) => {
        console.error("Update error:", error);
        alert(error.message);
      },
    }
  );

  const [deleteTimeEntry] = useMutation(DELETE_TIME_ENTRY, {
    onCompleted: () => refetch(),
  });

  const timeEntries: ApiTimeEntry[] = data?.getTimeEntries || [];

  // Helper functions
  const resetForm = () => {
    setFormData({
      date: "",
      hours: 8,
      description: "",
      entryType: "work",
    });
    setEntryType("work");
    setEditingEntry(null);
  };

  const handleAddEntry = (dateString: string) => {
    const date = format(parseISO(dateString), "yyyy-MM-dd");
    setFormData({
      date,
      hours: 9,
      description: "",
      entryType: "work",
    });
    setEntryType("work");
    setEditingEntry(null);
    setIsModalOpen(true);
  };

  const handleEditEntry = (entry: ApiTimeEntry) => {
    setFormData({
      date: entry.date,
      hours: entry.hours,
      description: entry.description,
      entryType: entry.entryType || "work",
    });
    setEntryType(entry.entryType || "work");
    setEditingEntry(entry);
    setIsModalOpen(true);
  };

  const handleDeleteEntry = async (entry: ApiTimeEntry) => {
    if (
      window.confirm(
        `Are you sure you want to delete the time entry for ${format(
          parseISO(entry.date),
          "MMM d, yyyy"
        )}?`
      )
    ) {
      try {
        await deleteTimeEntry({
          variables: { id: entry.id },
        });
      } catch (error) {
        console.error("Delete error:", error);
        alert("Failed to delete time entry. Please try again.");
      }
    }
  };

  const handleEntryTypeChange = (type: "work" | "holiday" | "leave") => {
    setEntryType(type);
    if (type === "holiday") {
      setFormData((prev) => ({
        ...prev,
        hours: 0,
        description: "Persistent Holiday",
        entryType: "holiday",
      }));
    } else if (type === "leave") {
      setFormData((prev) => ({
        ...prev,
        hours: 0,
        description: "Leave",
        entryType: "leave",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        hours: editingEntry?.hours || 8,
        description: editingEntry?.description || "",
        entryType: "work",
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.date) {
      alert("Date is required");
      return;
    }

    if (formData.entryType === "work") {
      if (formData.hours <= 0 || formData.hours > 9) {
        alert("Hours must be between 0.25 and 9");
        return;
      }
      if (!formData.description.trim()) {
        alert("Description is required for work entries");
        return;
      }
    }

    try {
      if (editingEntry) {
        await updateTimeEntry({
          variables: {
            input: {
              id: editingEntry.id,
              date: formData.date,
              hours: formData.hours,
              description: formData.description,
              entryType: formData.entryType,
            },
          },
        });
      } else {
        await createTimeEntry({
          variables: {
            input: {
              date: formData.date,
              hours: formData.hours,
              description: formData.description,
              entryType: formData.entryType,
            },
          },
        });
      }
    } catch (error) {
      console.error("Submit error:", error);
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

  const years = Array.from(
    { length: 2 },
    (_, i) => new Date().getFullYear() - 1 + i
  );

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }
    document.title = "Time Sheet - TimeSheet App";
    setIsLoading(false);
  }, [router]);

  // Refetch data when month or year changes
  useEffect(() => {
    if (!isLoading) {
      refetch();
    }
  }, [selectedMonth, selectedYear, isLoading, refetch]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".dropdown-container")) {
        setIsMonthDropdownOpen(false);
        setIsYearDropdownOpen(false);
      }
    };

    if (isMonthDropdownOpen || isYearDropdownOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [isMonthDropdownOpen, isYearDropdownOpen]);

  // Generate all days for the selected month including missing entries
  const generateDaysForMonth = (): DayEntry[] => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const allDays: DayEntry[] = [];

    // Create a map of entries by date for quick lookup
    const entriesByDate = timeEntries.reduce((acc, entry) => {
      acc[entry.date] = entry;
      return acc;
    }, {} as Record<string, ApiTimeEntry>);

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(selectedYear, selectedMonth, day);
      const dateString = format(currentDate, "yyyy-MM-dd");

      const existingEntry = entriesByDate[dateString];

      if (existingEntry) {
        allDays.push({
          date: currentDate.toISOString(),
          hours: existingEntry.hours,
          description: existingEntry.description,
          isMissing: false,
        });
      } else {
        allDays.push({
          date: currentDate.toISOString(),
          hours: null,
          description: null,
          isMissing: true,
        });
      }
    }

    return allDays.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  };

  const dayEntries = generateDaysForMonth();
  const totalHours = dayEntries
    .filter((entry) => !entry.isMissing)
    .reduce((sum, entry) => sum + (entry.hours || 0), 0);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
    });
  };

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-600 text-xl mb-4">
              Error loading time entries
            </div>
            <p className="text-gray-600 mb-4">{error.message}</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
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
          <div className="glass-card rounded-2xl p-6 mb-8 bg-gradient-to-r from-green-50 to-blue-50 border border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
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
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Time Sheet
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Track and manage your daily work hours
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {months[selectedMonth]} {selectedYear}
                    </span>
                    {dayEntries.length > 0 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {dayEntries.filter((d: any) => !d.isMissing).length} /{" "}
                        {dayEntries.length} Days Tracked
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="hidden md:flex items-center gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {dayEntries.reduce(
                      (sum: number, day: any) => sum + (day.hours || 0),
                      0
                    )}
                    h
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">
                    Total Hours
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {dayEntries.filter((d: any) => !d.isMissing).length}
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">
                    Days Logged
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {dayEntries.filter((d: any) => d.isMissing).length}
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">
                    Missing
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="glass-card rounded-2xl p-6 mb-6 shadow-lg relative z-50">
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
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                >
                  <span className="text-sm font-medium text-gray-700">
                    {months[selectedMonth]}
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
                          setSelectedMonth(index);
                          setIsMonthDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-100 first:rounded-t-xl last:rounded-b-xl transition-colors ${
                          selectedMonth === index
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

              {/* Summary */}
              <div className="ml-auto bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 rounded-xl shadow-md">
                <span className="text-sm font-medium">
                  Total Hours: {totalHours.toFixed(1)}h
                </span>
              </div>
            </div>
          </div>

          {/* Time Entries Table */}
          <div className="glass-card rounded-2xl overflow-hidden shadow-lg">
            {dayEntries.length === 0 ? (
              <div className="p-12 text-center">
                <svg
                  className="w-16 h-16 text-gray-300 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-gray-500 text-lg">No time entries found</p>
                <p className="text-gray-400 text-sm">
                  Select a different month or start your time sheet
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Hours
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider w-40">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {dayEntries.map((entry, index) => (
                      <tr
                        key={entry.date}
                        className={`hover:bg-gray-50 transition-colors ${
                          entry.isMissing ? "bg-red-50/30" : ""
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div
                              className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-semibold text-sm ${
                                entry.isMissing ? "bg-red-400" : "bg-blue-500"
                              }`}
                            >
                              {new Date(entry.date).getDate()}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm text-gray-900">
                                {formatDateShort(entry.date)}
                              </div>
                              <div className="text-sm font-medium text-gray-500">
                                {formatDate(entry.date)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {entry.isMissing ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <svg
                                className="w-3 h-3 mr-1"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Missing
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <svg
                                className="w-3 h-3 mr-1"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Added
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {entry.isMissing ? (
                            <span className="text-gray-400 text-sm">--</span>
                          ) : (
                            <div className="flex items-center">
                              <div className="flex-shrink-0 w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                              <span className="text-sm font-semibold text-gray-900">
                                {entry.hours}h
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {entry.isMissing ? (
                            <span className="text-gray-400 text-sm italic">
                              No entry recorded
                            </span>
                          ) : (
                            <div className="text-sm text-gray-900 max-w-md">
                              {entry.description &&
                              entry.description?.length > 50
                                ? entry.description.slice(0, 50) + "..."
                                : entry.description}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          {entry.isMissing ? (
                            <button
                              onClick={() => handleAddEntry(entry.date)}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-lg text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors"
                            >
                              <svg
                                className="w-4 h-4 mr-1"
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
                              Add Entry
                            </button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  const apiEntry = timeEntries.find(
                                    (te) =>
                                      te.date ===
                                      format(parseISO(entry.date), "yyyy-MM-dd")
                                  );
                                  if (apiEntry) handleEditEntry(apiEntry);
                                }}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-lg text-green-700 bg-green-100 hover:bg-green-200 transition-colors"
                              >
                                <svg
                                  className="w-4 h-4 mr-1"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                                Edit
                              </button>
                              <button
                                onClick={() => {
                                  const apiEntry = timeEntries.find(
                                    (te) =>
                                      te.date ===
                                      format(parseISO(entry.date), "yyyy-MM-dd")
                                  );
                                  if (apiEntry) handleDeleteEntry(apiEntry);
                                }}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-lg text-red-700 bg-red-100 hover:bg-red-200 transition-colors"
                              >
                                <svg
                                  className="w-4 h-4 mr-1"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H9a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Modal for Add/Edit Entry */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {editingEntry ? "Edit Time Entry" : "Add Time Entry"}
                    </h3>
                    <button
                      onClick={() => {
                        setIsModalOpen(false);
                        resetForm();
                      }}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
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
                    {/* Entry Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Entry Type
                      </label>
                      <div className="flex gap-3">
                        {/* Work Radio Button */}
                        <label className="relative flex-1 cursor-pointer">
                          <input
                            type="radio"
                            value="work"
                            checked={entryType === "work"}
                            onChange={() => handleEntryTypeChange("work")}
                            className="sr-only peer"
                          />
                          <div className="flex items-center justify-center px-4 py-3 bg-white border-2 border-gray-200 rounded-xl transition-all duration-200 peer-checked:border-blue-500 peer-checked:bg-gradient-to-r peer-checked:from-blue-50 peer-checked:to-purple-50 hover:border-blue-300 hover:shadow-md">
                            <div className="flex items-center gap-2">
                              <div className="relative w-5 h-5 rounded-full border-2 border-gray-300 peer-checked:border-blue-500 transition-all duration-200 flex items-center justify-center peer-checked:bg-gradient-to-br peer-checked:from-blue-500 peer-checked:to-purple-600">
                                {entryType === "work" && (
                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                )}
                              </div>
                              <span className="text-sm font-medium text-gray-700 peer-checked:text-blue-700">
                                Work
                              </span>
                            </div>
                          </div>
                        </label>

                        {/* Holiday Radio Button */}
                        <label className="relative flex-1 cursor-pointer">
                          <input
                            type="radio"
                            value="holiday"
                            checked={entryType === "holiday"}
                            onChange={() => handleEntryTypeChange("holiday")}
                            className="sr-only peer"
                          />
                          <div className="flex items-center justify-center px-4 py-3 bg-white border-2 border-gray-200 rounded-xl transition-all duration-200 peer-checked:border-green-500 peer-checked:bg-gradient-to-r peer-checked:from-green-50 peer-checked:to-emerald-50 hover:border-green-300 hover:shadow-md">
                            <div className="flex items-center gap-2">
                              <div className="relative w-5 h-5 rounded-full border-2 border-gray-300 peer-checked:border-green-500 transition-all duration-200 flex items-center justify-center peer-checked:bg-gradient-to-br peer-checked:from-green-500 peer-checked:to-emerald-600">
                                {entryType === "holiday" && (
                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                )}
                              </div>
                              <span className="text-sm font-medium text-gray-700 peer-checked:text-green-700">
                                Holiday
                              </span>
                            </div>
                          </div>
                        </label>

                        {/* Leave Radio Button */}
                        <label className="relative flex-1 cursor-pointer">
                          <input
                            type="radio"
                            value="leave"
                            checked={entryType === "leave"}
                            onChange={() => handleEntryTypeChange("leave")}
                            className="sr-only peer"
                          />
                          <div className="flex items-center justify-center px-4 py-3 bg-white border-2 border-gray-200 rounded-xl transition-all duration-200 peer-checked:border-orange-500 peer-checked:bg-gradient-to-r peer-checked:from-orange-50 peer-checked:to-amber-50 hover:border-orange-300 hover:shadow-md">
                            <div className="flex items-center gap-2">
                              <div className="relative w-5 h-5 rounded-full border-2 border-gray-300 peer-checked:border-orange-500 transition-all duration-200 flex items-center justify-center peer-checked:bg-gradient-to-br peer-checked:from-orange-500 peer-checked:to-amber-600">
                                {entryType === "leave" && (
                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                )}
                              </div>
                              <span className="text-sm font-medium text-gray-700 peer-checked:text-orange-700">
                                Leave
                              </span>
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date
                      </label>
                      <div>{formatDateShort(formData.date)}</div>
                      {/* <input
                        type="date"
                        value={formData.date}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            date: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      /> */}
                    </div>

                    {/* Hours */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hours
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="9"
                        step="0.25"
                        value={formData.hours}
                        disabled={entryType === "holiday"}
                        onChange={(e) => {
                          const hours = parseFloat(e.target.value);
                          if (hours <= 9) {
                            setFormData((prev) => ({ ...prev, hours }));
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Maximum 9 hours per day
                      </p>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        disabled={entryType === "holiday"}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                        rows={3}
                        placeholder={
                          entryType === "holiday"
                            ? "Holiday"
                            : "Work description..."
                        }
                        required={entryType === "work"}
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                      <button
                        type="submit"
                        disabled={createLoading || updateLoading}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {createLoading || updateLoading ? (
                          <div className="flex items-center justify-center">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            {editingEntry ? "Updating..." : "Creating..."}
                          </div>
                        ) : editingEntry ? (
                          "Update Entry"
                        ) : (
                          "Create Entry"
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsModalOpen(false);
                          resetForm();
                        }}
                        className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
