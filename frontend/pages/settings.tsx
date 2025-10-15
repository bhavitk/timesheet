import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "../components/Layout";

export default function Settings() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }
    document.title = "Settings - TimeSheet App";
    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
            <p className="text-gray-600">
              Manage your account and application preferences
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Account Settings */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white">
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
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-900 ml-3">
                  Account Settings
                </h2>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Manage your profile and account information
              </p>
              <button className="btn-primary">Edit Profile</button>
            </div>

            {/* Notification Settings */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center text-white">
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
                      d="M15 17h5l-5 5v-5zM11 21H6a2 2 0 01-2-2V7a2 2 0 012-2h5m0 16v-5a2 2 0 012-2h5V7a2 2 0 00-2-2h-5v16z"
                    />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-900 ml-3">
                  Notifications
                </h2>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Configure your notification preferences
              </p>
              <button className="btn-primary">Manage Notifications</button>
            </div>

            {/* Security Settings */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center text-white">
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
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-900 ml-3">
                  Security
                </h2>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Manage password and security settings
              </p>
              <button className="btn-primary">Change Password</button>
            </div>

            {/* App Preferences */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center text-white">
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
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-900 ml-3">
                  Preferences
                </h2>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Customize your app experience
              </p>
              <button className="btn-primary">Edit Preferences</button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
