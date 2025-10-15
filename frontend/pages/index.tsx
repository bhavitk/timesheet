import { useState, useEffect } from "react";
import { useRouter } from "next/router";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Real-time validation states
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  // Simple email regex for basic validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  useEffect(() => {
    try {
      const t = localStorage.getItem("token");
      if (t) {
        router.replace("/time-sheet");
        return;
      }
      document.title = "Login - TimeSheet App";
    } catch (e) {
      // ignore
    }
    setIsChecking(false);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark fields as touched on submit
    setEmailTouched(true);
    setPasswordTouched(true);

    // Validate fields
    let hasError = false;
    if (!email.trim()) {
      setEmailError("Email is required");
      hasError = true;
    } else if (!emailRegex.test(email.trim())) {
      setEmailError("Please enter a valid email address");
      hasError = true;
    }
    if (!password) {
      setPasswordError("Password is required");
      hasError = true;
    }

    if (hasError) {
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || data?.message || "Login failed");
        setIsLoading(false);
        return;
      }
      const token = data.access_token;
      if (!token) {
        setError("No token returned");
        setIsLoading(false);
        return;
      }
      localStorage.setItem("token", token);
      localStorage.setItem("userEmail", email);
      setIsLoading(false);
      router.push("/welcome");
    } catch (err: any) {
      setError(err?.message || "Network error");
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg font-medium">
            Checking authentication…
          </p>
          <p className="text-blue-200 text-sm mt-2">Please wait</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg p-6">
      <div className="glass-card rounded-3xl shadow-2xl max-w-md w-full p-8 animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-2xl w-16 h-16 mx-auto mb-4 shadow-lg animate-fade-in">
            <svg
              className="w-8 h-8"
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome</h1>
          <p className="text-gray-600">Sign in to manage your timesheet</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label
              className="block text-sm font-semibold text-gray-700"
              htmlFor="email"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                const val = e.target.value;
                setEmail(val);
                setEmailTouched(true);
                // Real-time validation: clear error if field is no longer empty
                if (!val.trim()) {
                  setEmailError("Email is required");
                } else if (!emailRegex.test(val.trim())) {
                  setEmailError("Please enter a valid email address");
                } else {
                  setEmailError("");
                }
              }}
              onBlur={() => {
                setEmailTouched(true);
                if (!email.trim()) {
                  setEmailError("Email is required");
                } else if (!emailRegex.test(email.trim())) {
                  setEmailError("Please enter a valid email address");
                }
              }}
              placeholder="you@example.com"
              className={`input-field ${
                emailTouched && emailError
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : ""
              }`}
            />
            {emailTouched && emailError && (
              <p className="text-red-600 text-sm mt-1 animate-fade-in">
                {emailError}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label
              className="block text-sm font-semibold text-gray-700"
              htmlFor="password"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                const val = e.target.value;
                setPassword(val);
                setPasswordTouched(true);
                // Real-time validation: clear error if field is no longer empty
                if (val) {
                  setPasswordError("");
                } else {
                  setPasswordError("Password is required");
                }
              }}
              onBlur={() => {
                setPasswordTouched(true);
                if (!password) {
                  setPasswordError("Password is required");
                }
              }}
              placeholder="Enter your password"
              className={`input-field ${
                passwordTouched && passwordError
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : ""
              }`}
            />
            {passwordTouched && passwordError && (
              <p className="text-red-600 text-sm mt-1 animate-fade-in">
                {passwordError}
              </p>
            )}
          </div>

          {error && (
            <div className="text-red-700 bg-red-50 border border-red-200 p-3 rounded-xl text-sm animate-fade-in">
              {error}
            </div>
          )}

          <button type="submit" disabled={isLoading} className="btn-primary">
            {isLoading && (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
