import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, Text, TextInput, View } from 'react-native';
import { Check, CheckCircle2, Eye, EyeOff, Info, Loader, Lock, LogIn, User, XCircle } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { useAppDispatch } from '../redux/hooks';
import { loginUser } from '../redux/slices/authSlice';
import { REMEMBERED_USERNAME_KEY, REMEMBER_ME_KEY } from '../constants/storage';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from '../utils/notifications';

type ToastType = 'success' | 'error' | 'info';

export default function LoginScreen() {
    const dispatch = useAppDispatch();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [toast, setToast] = useState<{ visible: boolean; type: ToastType; message: string }>({
        visible: false,
        type: 'info',
        message: '',
    });
    const [pushToken, setPushToken] = useState<string | null>(null);

    const toastOpacity = useRef(new Animated.Value(0)).current;
    const toastTranslateY = useRef(new Animated.Value(-16)).current;
    const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const spinValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        let mounted = true;

        const hydrateRememberState = async () => {
            try {
                const [savedRememberMe, savedUsername] = await Promise.all([
                    AsyncStorage.getItem(REMEMBER_ME_KEY),
                    AsyncStorage.getItem(REMEMBERED_USERNAME_KEY),
                ]);

                if (!mounted) {
                    return;
                }

                const shouldRemember = savedRememberMe === 'true';
                setRememberMe(shouldRemember);
                if (shouldRemember && savedUsername) {
                    setUsername(savedUsername);
                }
            } catch {
                // Ignore storage read errors and continue with defaults.
            }
        };

        void hydrateRememberState();

        // Fetch push token on mount
        registerForPushNotificationsAsync().then(token => {
            if (token) setPushToken(token);
        });

        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        let loop: Animated.CompositeAnimation | null = null;

        if (loading) {
            spinValue.setValue(0);
            loop = Animated.loop(
                Animated.timing(spinValue, {
                    toValue: 1,
                    duration: 800,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
            );
            loop.start();
        }

        return () => {
            if (loop) {
                loop.stop();
            }
            spinValue.setValue(0);
        };
    }, [loading, spinValue]);

    const showToast = (message: string, type: ToastType) => {
        if (toastTimerRef.current) {
            clearTimeout(toastTimerRef.current);
        }

        setToast({ visible: true, message, type });

        Animated.parallel([
            Animated.timing(toastOpacity, {
                toValue: 1,
                duration: 180,
                useNativeDriver: true,
            }),
            Animated.timing(toastTranslateY, {
                toValue: 0,
                duration: 180,
                useNativeDriver: true,
            }),
        ]).start();

        toastTimerRef.current = setTimeout(() => {
            Animated.parallel([
                Animated.timing(toastOpacity, {
                    toValue: 0,
                    duration: 180,
                    useNativeDriver: true,
                }),
                Animated.timing(toastTranslateY, {
                    toValue: -16,
                    duration: 180,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                setToast((prev) => ({ ...prev, visible: false }));
            });
        }, 2200);
    };



    const handleLogin = async () => {
        setError('');
        if (!username.trim() || !password.trim()) {
            setError('Please fill in all fields');
            showToast('Please fill in all fields', 'error');
            return;
        }

        setLoading(true);
        try {
            const result = await dispatch(
                loginUser({
                    username: username.trim(),
                    password,
                    rememberMe,
                    fcmToken: pushToken
                }),
            ).unwrap();

            showToast(`Welcome back ${result.user.name}! Redirecting...`, 'success');
        } catch (err: any) {
            const message = err?.message || err || 'Invalid username or password';
            setError(String(message));
            showToast(String(message), 'error');
        } finally {
            setLoading(false);
        }
    };

    const toastStyles =
        toast.type === 'success'
            ? 'border-emerald-200 bg-emerald-50'
            : toast.type === 'error'
                ? 'border-rose-200 bg-rose-50'
                : 'border-sky-200 bg-sky-50';

    const toastTextColor =
        toast.type === 'success' ? '#047857' : toast.type === 'error' ? '#be123c' : '#0369a1';

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <>
            <StatusBar style="dark" />
            <View className="flex-1 items-center justify-center bg-[#f0f0f0] px-4">
                {toast.visible && (
                    <Animated.View
                        style={{
                            opacity: toastOpacity,
                            transform: [{ translateY: toastTranslateY }],
                            position: 'absolute',
                            top: 56,
                            zIndex: 50,
                            width: '92%',
                            maxWidth: 420,
                        }}
                        className={`rounded-2xl border px-4 py-3 shadow-sm ${toastStyles}`}
                    >
                        <View className="flex-row items-center">
                            {toast.type === 'success' ? (
                                <CheckCircle2 size={18} color={toastTextColor} />
                            ) : toast.type === 'error' ? (
                                <XCircle size={18} color={toastTextColor} />
                            ) : (
                                <Info size={18} color={toastTextColor} />
                            )}
                            <Text className="ml-2 text-sm font-semibold" style={{ color: toastTextColor }}>
                                {toast.message}
                            </Text>
                        </View>
                    </Animated.View>
                )}

                <View className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
                    <View className="items-center">
                        <View className="mb-4 rounded-2xl bg-indigo-50 p-3">
                            <LogIn size={28} color="#4f46e5" />
                        </View>
                        <Text className="text-center text-3xl font-extrabold text-gray-900">Admin Portal</Text>
                        <Text className="mt-2 text-center text-sm text-gray-500">Secure access to administrative tools</Text>
                    </View>

                    <View className="mt-8 gap-4">
                        <View className="gap-1">
                            <Text className="ml-1 text-sm font-semibold text-gray-700">Username</Text>
                            <View className="relative">
                                <View className="absolute left-4 top-3.5 z-10">
                                    <User size={18} color="#9ca3af" />
                                </View>
                                <TextInput
                                    value={username}
                                    onChangeText={setUsername}
                                    editable={!loading}
                                    placeholder="Enter your username"
                                    autoCapitalize="none"
                                    className="rounded-2xl border border-gray-200 bg-gray-50 py-3.5 pl-12 pr-4 text-gray-800"
                                    placeholderTextColor="#9ca3af"
                                />
                            </View>
                        </View>

                        <View className="gap-1">
                            <Text className="ml-1 text-sm font-semibold text-gray-700">Password</Text>
                            <View className="relative">
                                <View className="absolute left-4 top-3.5 z-10">
                                    <Lock size={18} color="#9ca3af" />
                                </View>
                                <TextInput
                                    value={password}
                                    onChangeText={setPassword}
                                    editable={!loading}
                                    placeholder="Enter your password"
                                    secureTextEntry={!showPassword}
                                    className="rounded-2xl border border-gray-200 bg-gray-50 py-3.5 pl-12 pr-24 text-gray-800"
                                    placeholderTextColor="#9ca3af"
                                />
                                <Pressable
                                    onPress={() => setShowPassword((prev) => !prev)}
                                    disabled={loading}
                                    className="absolute right-3 top-2.5 rounded-xl border border-gray-200 bg-white p-2"
                                >
                                    {showPassword ? <EyeOff size={16} color="#4b5563" /> : <Eye size={16} color="#4b5563" />}
                                </Pressable>
                            </View>
                        </View>

                        <View className="flex-row items-center justify-between px-1">
                            <Pressable onPress={() => setRememberMe((prev) => !prev)} className="flex-row items-center">
                                <View
                                    className={`h-5 w-5 items-center justify-center rounded border ${rememberMe ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300 bg-white'
                                        }`}
                                >
                                    {rememberMe && <Check size={12} color="#ffffff" strokeWidth={3} />}
                                </View>
                                <Text className="ml-2 text-sm font-medium text-gray-600">Remember me</Text>
                            </Pressable>
                            <Pressable onPress={() => showToast('Forgot password flow is not connected yet.', 'info')}>
                                <Text className="text-sm font-bold text-indigo-600">Forgot Password?</Text>
                            </Pressable>
                        </View>

                        <Pressable
                            onPress={handleLogin}
                            disabled={loading}
                            className="items-center rounded-2xl bg-indigo-600 py-4 disabled:opacity-70"
                        >
                            {loading ? (
                                <View className="flex-row items-center">
                                    <Animated.View style={{ transform: [{ rotate: spin }] }}>
                                        <Loader size={18} color="#ffffff" />
                                    </Animated.View>
                                    <Text className="ml-2 text-base font-bold text-white">Signing in...</Text>
                                </View>
                            ) : (
                                <Text className="text-base font-bold text-white">Sign In</Text>
                            )}
                        </Pressable>


                        {!!error && (
                            <View className="rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                                <Text className="text-center text-sm font-semibold text-red-600">{error}</Text>
                            </View>
                        )}

                        <Text className="text-center text-xs font-medium text-gray-400">
                            © Copyright {new Date().getFullYear()} Vision Infotech Ltd. All rights reserved.
                        </Text>
                    </View>
                </View>
            </View>
        </>
    );
}
