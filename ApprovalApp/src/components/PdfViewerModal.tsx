import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    useWindowDimensions,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    X,
    Download,
    Printer,
    ZoomIn,
    ZoomOut,
    Moon,
    Sun,
    FileText,
} from 'lucide-react-native';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';

// Lazy-load native modules so they don't crash the bridge on startup
let NativePdf: any = null;
try {
    NativePdf = require('react-native-pdf').default;
} catch {
    NativePdf = null;
}

let RNBlobUtil: any = null;
try {
    RNBlobUtil = require('react-native-blob-util').default;
} catch {
    RNBlobUtil = null;
}

interface PdfViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    pdfData?: string;       // Base64 PDF (for uploaded docs)
    htmlContent?: string;   // Raw HTML (for generated invoices)
    title: string;
}

const PdfViewerModal: React.FC<PdfViewerModalProps> = ({ isOpen, onClose, pdfData = '', htmlContent = '', title }) => {
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const [isNightMode, setIsNightMode] = useState(false);
    const [zoom, setZoom] = useState(100);
    const [hasPdfError, setHasPdfError] = useState(false);
    const [pdfJsFailed, setPdfJsFailed] = useState(false);
    const [totalPages, setTotalPages] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoadingContent, setIsLoadingContent] = useState(true);
    const webviewRef = useRef<WebView>(null);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    const isHtmlMode = !!htmlContent;

    // ── Download state (DownloadResumable pattern) ─────────────────
    type DlStatus = 'idle' | 'downloading' | 'paused' | 'done' | 'error';
    const [dlStatus, setDlStatus] = useState<DlStatus>('idle');
    const [dlProgress, setDlProgress] = useState(0);   // 0–1
    const [dlSavedUri, setDlSavedUri] = useState('');
    const downloadRef = useRef<FileSystem.DownloadResumable | null>(null);
    const STORAGE_KEY = `dl_snapshot_${title}`;

    useEffect(() => {
        setHasPdfError(false);
        setPdfJsFailed(false);
        setCurrentPage(1);
        setTotalPages(1);
        setIsLoadingContent(true);
    }, [pdfData, htmlContent, isOpen]);

    const isUriPdf =
        !!pdfData &&
        (pdfData.startsWith('http://') ||
            pdfData.startsWith('https://') ||
            pdfData.startsWith('file://') ||
            pdfData.startsWith('content://'));

    const normalizedBase64Pdf = useMemo(() => {
        if (!pdfData || isUriPdf || isHtmlMode) return '';
        if (pdfData.startsWith('data:application/pdf')) {
            const split = pdfData.split('base64,');
            return split[1] || '';
        }
        return pdfData;
    }, [pdfData, isUriPdf, isHtmlMode]);

    const pdfSource = useMemo(() => {
        if (!pdfData || isHtmlMode) return null;
        const isUri =
            pdfData.startsWith('http://') ||
            pdfData.startsWith('https://') ||
            pdfData.startsWith('file://') ||
            pdfData.startsWith('content://') ||
            pdfData.startsWith('data:application/pdf');
        const uri = isUri ? pdfData : `data:application/pdf;base64,${pdfData}`;
        return { uri, cache: true };
    }, [pdfData, isHtmlMode]);

    const pdfJsHtml = useMemo(() => {
        if (!normalizedBase64Pdf) return '';
        const safeBase64 = normalizedBase64Pdf
            .replace(/\\/g, '\\\\')
            .replace(/`/g, '\\`')
            .replace(/\$/g, '\\$');

        return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
  <style>
    html, body { margin: 0; padding: 0; background: ${isNightMode ? '#0b1220' : '#f5f5f5'}; width: 100%; height: 100%; overflow: hidden; }
    #status { position: sticky; top: 0; z-index: 10; font-family: sans-serif; color: ${isNightMode ? '#cbd5e1' : '#374151'}; padding: 10px 14px; background: ${isNightMode ? '#111827' : '#e5e7eb'}; font-size: 13px; }
    #container { width: 100vw; height: 100vh; overflow: auto; }
    #viewer { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 12px; min-width: 100%; box-sizing: border-box; }
    .page { background: white; box-shadow: 0 1px 10px rgba(0,0,0,0.15); }
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
</head>
<body>
  <div id="status">Loading PDF...</div>
  <div id="container"><div id="viewer"></div></div>
  <script>
    (function() {
      try {
        const b64 = \`${safeBase64}\`;
        const bin = atob(b64);
        const len = bin.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);

        pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        const loadingTask = pdfjsLib.getDocument({ data: bytes });
        loadingTask.promise.then(async function(pdf) {
          const viewer = document.getElementById("viewer");
          const status = document.getElementById("status");
          status.textContent = "Pages: " + pdf.numPages;
          window.ReactNativeWebView && window.ReactNativeWebView.postMessage("PDFJS_PAGES:" + pdf.numPages);
          const zoomFactor = ${Math.max(0.5, Math.min(4, zoom / 100))};
          const pixelRatio = Math.max(1, window.devicePixelRatio || 1);
          const availableWidth = Math.max(280, window.innerWidth - 28);
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const base = page.getViewport({ scale: 1 });
            const fitScale = (availableWidth / base.width) * zoomFactor;
            const viewport = page.getViewport({ scale: fitScale });
            const canvas = document.createElement("canvas");
            canvas.className = "page";
            const context = canvas.getContext("2d");
            canvas.height = Math.floor(viewport.height * pixelRatio);
            canvas.width = Math.floor(viewport.width * pixelRatio);
            canvas.style.width = Math.floor(viewport.width) + "px";
            canvas.style.height = Math.floor(viewport.height) + "px";
            viewer.appendChild(canvas);
            await page.render({
              canvasContext: context,
              viewport,
              transform: pixelRatio !== 1 ? [pixelRatio, 0, 0, pixelRatio, 0, 0] : null
            }).promise;
          }
          window.ReactNativeWebView && window.ReactNativeWebView.postMessage("PDFJS_LOADED");
        }).catch(function(err) {
          document.getElementById("status").textContent = "Failed to load PDF";
          window.ReactNativeWebView && window.ReactNativeWebView.postMessage("PDFJS_ERROR:" + err.message);
        });
      } catch (e) {
        document.getElementById("status").textContent = "Failed to render PDF";
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage("PDFJS_ERROR:runtime");
      }
    })();
  </script>
</body>
</html>`;
    }, [normalizedBase64Pdf, isNightMode, zoom]);

    const viewerHeight = useMemo(() => {
        const reserved = 56 + 52 + 36;
        return Math.max(220, screenHeight - reserved);
    }, [screenHeight]);

    const viewerBgColor = isNightMode ? '#0b1220' : '#ffffff';
    const loaderColor = isNightMode ? '#94A3B8' : '#334155';

    // ── DownloadResumable helpers ───────────────────────────────────
    const getFileUri = useCallback(() => {
        const ext = isHtmlMode ? '.html' : '.pdf';
        const filename = title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + ext;
        return `${FileSystem.documentDirectory}${filename}`;
    }, [title, isHtmlMode]);

    const handleDownload = useCallback(async () => {
        const isRemoteUrl = !isHtmlMode && isUriPdf &&
            (pdfData.startsWith('http://') || pdfData.startsWith('https://'));

        // ── 1. Remote URL: Handle Download/Pause/Resume ────────────────
        if (isRemoteUrl) {
            try {
                if (dlStatus === 'downloading' && downloadRef.current) {
                    await downloadRef.current.pauseAsync();
                    const snapshot = downloadRef.current.savable();
                    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
                    setDlStatus('paused');
                    return;
                }

                if (dlStatus === 'paused' && downloadRef.current) {
                    setDlStatus('downloading');
                    const result = await downloadRef.current.resumeAsync();
                    if (result) {
                        setDlStatus('done');
                        setDlSavedUri(result.uri);
                        await AsyncStorage.removeItem(STORAGE_KEY);
                        await saveToPublicStore(result.uri);
                    }
                    return;
                }

                const fileUri = getFileUri();
                const saved = await AsyncStorage.getItem(STORAGE_KEY);
                if (saved) {
                    const snap = JSON.parse(saved);
                    downloadRef.current = new FileSystem.DownloadResumable(
                        snap.url, snap.fileUri, snap.options,
                        (prog) => setDlProgress(prog.totalBytesExpectedToWrite > 0 ? prog.totalBytesWritten / prog.totalBytesExpectedToWrite : 0),
                        snap.resumeData
                    );
                    setDlStatus('downloading');
                    const result = await downloadRef.current.resumeAsync();
                    if (result) {
                        setDlStatus('done');
                        setDlSavedUri(result.uri);
                        await AsyncStorage.removeItem(STORAGE_KEY);
                        await saveToPublicStore(result.uri);
                    }
                    return;
                }

                setDlProgress(0);
                setDlStatus('downloading');
                downloadRef.current = FileSystem.createDownloadResumable(
                    pdfData, fileUri, {},
                    (prog) => setDlProgress(prog.totalBytesExpectedToWrite > 0 ? prog.totalBytesWritten / prog.totalBytesExpectedToWrite : 0)
                );
                const result = await downloadRef.current.downloadAsync();
                if (result) {
                    setDlStatus('done');
                    setDlSavedUri(result.uri);
                    await AsyncStorage.removeItem(STORAGE_KEY);
                    await saveToPublicStore(result.uri);
                }
            } catch (err: any) {
                setDlStatus('error');
                Alert.alert('Download Failed', err?.message || 'Unable to download file.');
            }
            return;
        }

        // ── 2. Local base64 / HTML: Handle Direct Saving ───────────────
        if (isHtmlMode) {
            // ALWAYS trigger conversion for HTML
            setIsGeneratingPdf(true);
            setDlStatus('downloading');
            setDlProgress(0.2);
            // Give it a tiny bit of time for script to load if it just opened
            setTimeout(() => {
                webviewRef.current?.injectJavaScript('window.generatePDF(); true;');
            }, 500);
        } else {
            try {
                setDlStatus('downloading');
                setDlProgress(0.5);
                const fileUri = getFileUri();
                const cleanBase64 = normalizedBase64Pdf || pdfData;
                await FileSystem.writeAsStringAsync(fileUri, cleanBase64, { encoding: FileSystem.EncodingType.Base64 });

                setDlProgress(1);
                setDlStatus('done');
                await saveToPublicStore(fileUri);
            } catch (err: any) {
                setDlStatus('error');
                Alert.alert('Download Failed', err?.message || 'Unable to download the file.');
            }
        }
    }, [isHtmlMode, isUriPdf, pdfData, htmlContent, dlStatus, normalizedBase64Pdf, getFileUri, STORAGE_KEY]);

    // helper to save to public folder on Android via SAF
    const saveToPublicStore = async (uri: string, isFromHtmlConversion: boolean = false) => {
        try {
            const ext = '.pdf'; // Strictly enforce .pdf as requested
            const filename = title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + ext;
            const mimeType = 'application/pdf';

            if (Platform.OS === 'android') {
                // Try direct download to Download folder using RNBlobUtil for a better "Download" feel
                if (RNBlobUtil) {
                    try {
                        const { fs, android } = RNBlobUtil;
                        const destPath = `${fs.dirs.DownloadDir}/${filename}`;
                        let content: string;
                        if (isFromHtmlConversion) {
                            content = uri;
                        } else {
                            content = await FileSystem.readAsStringAsync(uri, {
                                encoding: FileSystem.EncodingType.Base64
                            });
                        }
                        await fs.writeFile(destPath, content, 'base64');
                        android.addCompleteDownload({
                            title: filename,
                            description: 'Document downloaded',
                            mime: mimeType,
                            path: destPath,
                            showNotification: true,
                        });
                        Alert.alert('Download Complete \u2713', `File saved directly to your Downloads folder.`);
                        return;
                    } catch (nativeErr) {
                        console.warn('Native download failed, using SAF fallback:', nativeErr);
                    }
                }

                const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
                if (permissions.granted) {
                    let content: string;
                    if (isFromHtmlConversion) {
                        content = uri; // Received directly as base64
                    } else {
                        content = await FileSystem.readAsStringAsync(uri, {
                            encoding: FileSystem.EncodingType.Base64
                        });
                    }

                    const newUri = await FileSystem.StorageAccessFramework.createFileAsync(
                        permissions.directoryUri,
                        filename,
                        mimeType
                    );

                    await FileSystem.writeAsStringAsync(newUri, content, {
                        encoding: FileSystem.EncodingType.Base64
                    });

                    Alert.alert('Download Complete \u2713', `File successfully saved to your selected folder.`);
                } else {
                    Alert.alert('Permission Denied', 'Saved locally to app folder only.');
                }
            } else {
                Alert.alert('Download Complete \u2713', `Saved successfully to app documents.`);
            }
        } catch (error: any) {
            Alert.alert('Export Error', error?.message || 'Could not export to public folder.');
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const handleWebviewMessage = async (event: any) => {
        const data = event.nativeEvent.data;
        if (data === 'GEN_READY') {
            console.log('PDF Generator Ready');
        } else if (typeof data === 'string' && data.startsWith('PDF_BASE64:')) {
            const base64 = data.replace('PDF_BASE64:', '');
            setDlProgress(1);
            setDlStatus('done');
            await saveToPublicStore(base64, true);
        } else if (typeof data === 'string' && data.startsWith('PDF_ERROR:')) {
            const errMsg = data.replace('PDF_ERROR:', '');
            setDlStatus('error');
            setIsGeneratingPdf(false);
            Alert.alert('Download Error', `Failed to generate PDF: ${errMsg}`);
        }
    };

    // Reset download state when content or visibility changes
    useEffect(() => {
        setDlStatus('idle');
        setDlProgress(0);
        setDlSavedUri('');
        downloadRef.current = null;
    }, [pdfData, htmlContent, isOpen]);

    return (
        <Modal
            visible={isOpen}
            animationType="slide"
            presentationStyle="fullScreen"
            onRequestClose={onClose}
        >
            <View style={{ flex: 1, backgroundColor: isNightMode ? '#0b1220' : '#f8fafc' }}>
                <SafeAreaView style={{ flex: 1 }}>
                    {/* Header */}
                    <View style={{
                        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                        paddingHorizontal: 16, paddingVertical: 12,
                        borderBottomWidth: 1, borderBottomColor: isNightMode ? '#1e293b' : '#e2e8f0',
                        backgroundColor: isNightMode ? '#0b1220' : '#ffffff',
                    }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
                            <View style={{ backgroundColor: isHtmlMode ? '#dbeafe' : '#d1fae5', padding: 6, borderRadius: 8, marginRight: 10 }}>
                                {isHtmlMode
                                    ? <FileText size={20} color="#2563EB" />
                                    : <Printer size={20} color="#10B981" />
                                }
                            </View>
                            <Text numberOfLines={1} style={{
                                fontSize: 16, fontWeight: '700', flex: 1,
                                color: isNightMode ? '#f1f5f9' : '#0f172a',
                            }}>{title}</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={{
                            padding: 8, borderRadius: 20,
                            backgroundColor: isNightMode ? '#1e293b' : '#f1f5f9',
                        }}>
                            <X size={20} color={isNightMode ? '#94a3b8' : '#64748b'} />
                        </TouchableOpacity>
                    </View>

                    {/* Toolbar */}
                    <View style={{
                        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                        paddingHorizontal: 16, paddingVertical: 8,
                        borderBottomWidth: 1, borderBottomColor: isNightMode ? '#1e293b' : '#e2e8f0',
                        backgroundColor: isNightMode ? '#0f172a' : '#f8fafc',
                    }}>
                        {!isHtmlMode && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <TouchableOpacity onPress={() => setZoom(z => Math.max(60, z - 10))} style={{ padding: 6 }}>
                                    <ZoomOut size={20} color={isNightMode ? '#94a3b8' : '#64748b'} />
                                </TouchableOpacity>
                                <Text style={{
                                    fontWeight: '600', minWidth: 44, textAlign: 'center', fontSize: 13,
                                    color: isNightMode ? '#cbd5e1' : '#475569',
                                }}>{zoom}%</Text>
                                <TouchableOpacity onPress={() => setZoom(z => Math.min(300, z + 10))} style={{ padding: 6 }}>
                                    <ZoomIn size={20} color={isNightMode ? '#94a3b8' : '#64748b'} />
                                </TouchableOpacity>
                            </View>
                        )}
                        {isHtmlMode && <View />}

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <TouchableOpacity
                                onPress={() => setIsNightMode(!isNightMode)}
                                style={{
                                    padding: 8, borderRadius: 8,
                                    backgroundColor: isNightMode ? '#1e293b' : '#e2e8f0',
                                }}>
                                {isNightMode ? <Sun size={20} color="#818cf8" /> : <Moon size={20} color="#64748b" />}
                            </TouchableOpacity>
                            {/* ── Download button with progress ── */}
                            {(() => {
                                const isRemoteUrl = !isHtmlMode && isUriPdf &&
                                    (pdfData.startsWith('http://') || pdfData.startsWith('https://'));
                                const btnColor =
                                    dlStatus === 'done' ? '#10b981' :
                                        dlStatus === 'error' ? '#ef4444' :
                                            dlStatus === 'paused' ? '#f59e0b' : '#4f46e5';
                                const btnLabel =
                                    isGeneratingPdf ? 'Generating...' :
                                        dlStatus === 'done' ? 'Done \u2713' :
                                            dlStatus === 'error' ? 'Retry' :
                                                dlStatus === 'paused' ? 'Resume' :
                                                    dlStatus === 'downloading' && isRemoteUrl ? 'Pause' : 'Download';

                                return (
                                    <TouchableOpacity
                                        onPress={handleDownload}
                                        disabled={(dlStatus === 'downloading' && !isRemoteUrl) || isGeneratingPdf}
                                        style={{
                                            backgroundColor: btnColor,
                                            paddingHorizontal: 14, paddingVertical: 8,
                                            borderRadius: 8, alignItems: 'center',
                                            minWidth: 90, overflow: 'hidden',
                                            opacity: ((dlStatus === 'downloading' && !isRemoteUrl) || isGeneratingPdf) ? 0.7 : 1,
                                        }}
                                    >
                                        {/* Progress bar track */}
                                        {(dlStatus === 'downloading' || isGeneratingPdf) && (
                                            <View style={{
                                                position: 'absolute', left: 0, top: 0, bottom: 0,
                                                width: isGeneratingPdf ? '100%' : `${Math.round(dlProgress * 100)}%`,
                                                backgroundColor: 'rgba(255,255,255,0.25)',
                                            }} />
                                        )}
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                            {(dlStatus === 'downloading' || isGeneratingPdf) && !isRemoteUrl
                                                ? <ActivityIndicator size="small" color="#fff" />
                                                : <Download size={15} color="#ffffff" />
                                            }
                                            <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 13 }}>
                                                {dlStatus === 'downloading' && isRemoteUrl
                                                    ? `${Math.round(dlProgress * 100)}%`
                                                    : btnLabel
                                                }
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })()}
                        </View>
                    </View>

                    {/* Content Area */}
                    <View style={{ flex: 1, width: screenWidth, backgroundColor: viewerBgColor }}>
                        {isHtmlMode ? (
                            <WebView
                                ref={webviewRef}
                                key={`html-${screenWidth}`}
                                source={{
                                    html: `
                                        <!DOCTYPE html>
                                        <html>
                                        <head>
                                            <meta charset="utf-8" />
                                            <meta name="viewport" content="width=device-width, initial-scale=1" />
                                            <style>body { margin: 0; padding: 0; }</style>
                                            <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
                                        </head>
                                        <body>
                                            ${htmlContent}
                                            <script>
                                                // Signal when script is loaded and ready
                                                window.onload = function() {
                                                    window.ReactNativeWebView.postMessage('GEN_READY');
                                                };

                                                window.generatePDF = function() {
                                                    try {
                                                        const element = document.body;
                                                        const opt = {
                                                            margin:       [0.5, 0.5],
                                                            filename:     'invoice.pdf',
                                                            image:        { type: 'jpeg', quality: 0.98 },
                                                            html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
                                                            jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
                                                        };
                                                        
                                                        html2pdf().set(opt).from(element).outputPdf('datauristring')
                                                            .then(pdfBase64 => {
                                                                const base64 = pdfBase64.split(',')[1];
                                                                if (!base64) throw new Error("Empty PDF data");
                                                                window.ReactNativeWebView.postMessage('PDF_BASE64:' + base64);
                                                            })
                                                            .catch(err => {
                                                                window.ReactNativeWebView.postMessage('PDF_ERROR:' + err.message);
                                                            });
                                                    } catch (e) {
                                                        window.ReactNativeWebView.postMessage('PDF_ERROR:' + e.message);
                                                    }
                                                };
                                            </script>
                                        </body>
                                        </html>
                                    `
                                }}
                                style={{ flex: 1, width: screenWidth, backgroundColor: viewerBgColor }}
                                onMessage={handleWebviewMessage}
                                originWhitelist={['*']}
                                javaScriptEnabled
                                domStorageEnabled
                                startInLoadingState
                                renderLoading={() => (
                                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: viewerBgColor }}>
                                        <ActivityIndicator size="large" color={loaderColor} />
                                        <Text style={{ marginTop: 12, color: loaderColor, fontWeight: '600' }}>Preparing Invoice...</Text>
                                    </View>
                                )}
                                onLoad={() => setIsLoadingContent(false)}
                            />
                        ) : pdfSource && !hasPdfError && NativePdf ? (
                            <NativePdf
                                key={`native-${zoom}-${screenWidth}`}
                                source={pdfSource}
                                style={{ width: screenWidth, height: viewerHeight, backgroundColor: viewerBgColor }}
                                scale={zoom / 100}
                                minScale={1}
                                maxScale={5}
                                fitPolicy={2}
                                spacing={4}
                                enableAntialiasing
                                trustAllCerts={false}
                                onLoadComplete={(pages: number) => {
                                    setTotalPages(pages || 1);
                                    setCurrentPage(1);
                                    setIsLoadingContent(false);
                                }}
                                onPageChanged={(page: number) => setCurrentPage(page || 1)}
                                onScaleChanged={(scale: number) => {
                                    const next = Math.round((scale || 1) * 100);
                                    setZoom(Math.max(60, Math.min(300, next)));
                                }}
                                onError={() => setHasPdfError(true)}
                            />
                        ) : normalizedBase64Pdf && !pdfJsFailed ? (
                            <WebView
                                key={`pdfjs-${zoom}-${screenWidth}`}
                                source={{ html: pdfJsHtml, baseUrl: 'https://cdnjs.cloudflare.com' }}
                                style={{ width: screenWidth, height: viewerHeight, backgroundColor: viewerBgColor }}
                                originWhitelist={['*']}
                                javaScriptEnabled
                                domStorageEnabled
                                startInLoadingState
                                renderLoading={() => (
                                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: viewerBgColor }}>
                                        <ActivityIndicator size="large" color={loaderColor} />
                                        <Text style={{ marginTop: 12, color: loaderColor, fontWeight: '600' }}>Loading PDF...</Text>
                                    </View>
                                )}
                                onMessage={(event) => {
                                    const message = event?.nativeEvent?.data || '';
                                    if (message === 'PDFJS_LOADED') setIsLoadingContent(false);
                                    else if (message.startsWith('PDFJS_ERROR:')) setPdfJsFailed(true);
                                    else if (message.startsWith('PDFJS_PAGES:')) {
                                        const pages = Number(message.replace('PDFJS_PAGES:', '')) || 1;
                                        setTotalPages(pages);
                                    }
                                }}
                            />
                        ) : (
                            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                                {(pdfData || htmlContent) ? (
                                    <Text style={{ color: '#64748b', fontWeight: '600', textAlign: 'center' }}>
                                        Unable to render preview. Use Save to download.
                                    </Text>
                                ) : (
                                    <ActivityIndicator size="large" color={loaderColor} />
                                )}
                            </View>
                        )}
                    </View>

                    {/* Footer */}
                    <View style={{
                        paddingHorizontal: 16, paddingVertical: 8,
                        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                        backgroundColor: isNightMode ? '#0b1220' : '#f1f5f9',
                    }}>
                        <Text style={{ fontSize: 11, color: isNightMode ? '#475569' : '#94a3b8' }}>
                            {isHtmlMode ? 'Invoice Preview' : `Page ${currentPage} of ${totalPages}`}
                        </Text>
                        <Text style={{ fontSize: 11, color: isNightMode ? '#475569' : '#94a3b8' }}>
                            {isHtmlMode ? 'Generated Invoice' : 'Secure Document'}
                        </Text>
                    </View>
                </SafeAreaView>
            </View>
        </Modal>
    );
};

export default PdfViewerModal;
