"use client";
// app/login/page.tsx
import React, { useState, useEffect } from "react";
import { Lock, ArrowRight, Github, Chrome, LogIn, User, Eye, EyeOff, Loader } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [username, setUserName] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState("");

    // Redirect if already logged in
    useEffect(() => {
        const token = localStorage.getItem("tbgs_access_token");
        if (token) {
            router.push("/dashboard");
        }
    }, [router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!username || !password) {
            toast.error("Please fill in all fields");
            setError("Please fill in all fields");
            return;
        }

        setLoading(true);

        try {
            // Mock Login Implementation
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Import MOCK_USERS dynamically or assume it's available via import
            const { MOCK_USERS } = require("../config/mockData");

            const foundUser = MOCK_USERS.find((u: any) =>
                u.username.toLowerCase() === username.toLowerCase() &&
                u.password === password
            );

            if (foundUser) {
                const mockToken = `mock_tbgs_access_token_${foundUser.id}`;

                // Success
                toast.success(`Welcome back ${foundUser.name}! Redirecting...`);

                // Store token and user data
                localStorage.setItem("tbgs_access_token", mockToken);
                localStorage.setItem("tbgs_user", JSON.stringify(foundUser));

                // Redirect to dashboard
                router.push("/dashboard");
            } else {
                toast.error("Invalid credentials. Use '123' as password.");
                setError("Invalid username or password");
            }

        } catch (err: any) {
            console.error("Login Error:", err);
            setError("Something went wrong");
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md">
                <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-2xl border border-gray-100 transition-all duration-500 hover:shadow-indigo-500/10">
                    {/* Header */}
                    <div className="flex flex-col items-center">
                        <div className="p-3 bg-indigo-50 rounded-2xl mb-4">
                            <LogIn className="w-8 h-8 text-indigo-600" />
                        </div>
                        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
                            Admin Portal
                        </h2>
                        <p className="text-sm text-gray-500">
                            Secure access to administrative tools
                        </p>
                    </div>

                    {/* Form */}
                    <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                        {/* Username */}
                        <div className="space-y-1">
                            <label className="block text-sm font-semibold text-gray-700 ml-1">
                                Username
                            </label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUserName(e.target.value)}
                                    disabled={loading}
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-600 focus:bg-white transition-all outline-none disabled:opacity-50"
                                    placeholder="Enter your username"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-1">
                            <label className="block text-sm font-semibold text-gray-700 ml-1">
                                Password
                            </label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading}
                                    className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-600 focus:bg-white transition-all outline-none disabled:opacity-50"
                                    placeholder="Enter your password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((p) => !p)}
                                    disabled={loading}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword ? (
                                        <Eye className="w-5 h-5" />
                                    ) : (
                                        <EyeOff className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Options */}
                        <div className="flex items-center justify-between px-1">
                            <label className="flex items-center cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="accent-indigo-600 w-4 h-4 rounded"
                                />
                                <span className="ml-2 text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">
                                    Remember me
                                </span>
                            </label>

                            <button type="button" className="text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
                                Forgot Password?
                            </button>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center items-center py-4 rounded-2xl text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader className="animate-spin h-5 w-5 mr-3" />
                                    Signing in...
                                </>
                            ) : (
                                "Sign In"
                            )}
                        </button>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 text-red-600 text-sm font-semibold py-3 px-4 rounded-xl text-center border border-red-100">
                                {error}
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}

