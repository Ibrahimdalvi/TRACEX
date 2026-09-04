import React, { useRef, useState } from 'react';
import { CasePriority, CaseStatus } from '../../types';

export interface NewCaseFormData {
    title: string;
    summary: string;
    priority: CasePriority;
    leadInvestigator: string;
    status: CaseStatus;
    files: File[];
}

interface NewCaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateCase: (data: NewCaseFormData) => void | Promise<void>;
}

const ACCEPTED_FILE_TYPES = [
    '.pdf',
    '.xlsx',
    '.xls',
    '.csv',
    '.doc',
    '.docx',
    '.txt',
    '.png',
    '.jpg',
    '.jpeg',
];

const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (fileName: string) => {
    const extension = fileName
        .split('.')
        .pop()
        ?.toLowerCase();

    switch (extension) {
        case 'pdf':
            return 'picture_as_pdf';
        case 'xlsx':
        case 'xls':
        case 'csv':
            return 'table_chart';
        case 'png':
        case 'jpg':
        case 'jpeg':
            return 'image';
        case 'doc':
        case 'docx':
        case 'txt':
            return 'description';
        default:
            return 'attach_file';
    }
};

export const NewCaseModal: React.FC<NewCaseModalProps> = ({
    isOpen,
    onClose,
    onCreateCase,
}) => {
    const [title, setTitle] = useState('');
    const [summary, setSummary] = useState('');
    const [priority, setPriority] =
        useState<CasePriority>('MEDIUM');
    const [leadInvestigator, setLeadInvestigator] =
        useState('');
    const [status, setStatus] =
        useState<CaseStatus>('ACTIVE');

    const [files, setFiles] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState(false);

    const fileInputRef =
        useRef<HTMLInputElement | null>(null);

    if (!isOpen) return null;

    const isValid =
        title.trim() !== '' &&
        summary.trim() !== '' &&
        leadInvestigator.trim() !== '';

    const addFiles = (incomingFiles: FileList | File[]) => {
        const selectedFiles = Array.from(incomingFiles);

        const validFiles = selectedFiles.filter((file) => {
            const extension =
                '.' +
                (file.name.split('.').pop()?.toLowerCase() || '');

            return ACCEPTED_FILE_TYPES.includes(extension);
        });

        setFiles((previousFiles) => {
            const combined = [
                ...previousFiles,
                ...validFiles,
            ];

            const uniqueFiles = combined.filter(
                (file, index, array) =>
                    index ===
                    array.findIndex(
                        (existingFile) =>
                            existingFile.name === file.name &&
                            existingFile.size === file.size &&
                            existingFile.lastModified ===
                            file.lastModified
                    )
            );

            return uniqueFiles;
        });
    };

    const handleFileChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        if (e.target.files) {
            addFiles(e.target.files);
        }

        e.target.value = '';
    };

    const handleDrop = (
        e: React.DragEvent<HTMLDivElement>
    ) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files.length > 0) {
            addFiles(e.dataTransfer.files);
        }
    };

    const removeFile = (indexToRemove: number) => {
        setFiles((previousFiles) =>
            previousFiles.filter(
                (_, index) => index !== indexToRemove
            )
        );
    };

    const clearFiles = () => {
        setFiles([]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!isValid || files.length === 0) {
            return;
        }

        const payload: NewCaseFormData = {
            title: title.trim(),
            summary: summary.trim(),
            priority,
            leadInvestigator: leadInvestigator.trim(),
            status,
            files,
        };

        // Start ingestion first. App.tsx owns the async analysis lifecycle.
        // Close the modal immediately so the user never has to press CANCEL.
        void onCreateCase(payload);
        onClose();

        // Clear the form for the next investigation.
        setTitle('');
        setSummary('');
        setPriority('MEDIUM');
        setLeadInvestigator('');
        setStatus('ACTIVE');
        setFiles([]);
    };

    const handleClose = () => {
        setTitle('');
        setSummary('');
        setPriority('MEDIUM');
        setLeadInvestigator('');
        setStatus('ACTIVE');
        setFiles([]);
        setIsDragging(false);
        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) {
                    handleClose();
                }
            }}
        >
            <div className="w-full max-w-3xl max-h-[92vh] bg-[#111817] border border-[#3c4948] rounded-xl shadow-2xl overflow-hidden flex flex-col">

                {/* =================================================
                    HEADER
                ================================================= */}

                <div className="px-6 py-5 border-b border-[#3c4948]/60 bg-[#18201f] flex items-center justify-between flex-shrink-0">
                    <div>
                        <p className="font-mono text-[10px] font-bold tracking-[0.2em] text-[#66FCF1] uppercase">
                            CASE MANAGEMENT / DATA INGESTION
                        </p>

                        <h2 className="text-xl font-bold text-white mt-1">
                            Create New Investigation
                        </h2>

                        <p className="text-xs text-[#859491] mt-1">
                            Register a case and upload source material for analysis.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleClose}
                        className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#3c4948] text-[#859491] hover:text-white hover:border-[#66FCF1] transition-colors"
                        aria-label="Close"
                    >
                        <span className="material-symbols-outlined text-[18px]">
                            close
                        </span>
                    </button>
                </div>

                {/* =================================================
                    FORM BODY
                ================================================= */}

                <form
                    onSubmit={handleSubmit}
                    className="flex flex-col min-h-0"
                >
                    <div className="p-6 space-y-5 overflow-y-auto">

                        {/* =================================================
                            CASE INFORMATION
                        ================================================= */}

                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="w-5 h-5 rounded bg-[#66FCF1]/10 border border-[#66FCF1]/30 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[12px] text-[#66FCF1]">
                                        folder_open
                                    </span>
                                </span>

                                <h3 className="font-mono text-[10px] font-bold tracking-widest text-[#66FCF1] uppercase">
                                    CASE INFORMATION
                                </h3>
                            </div>

                            <div className="space-y-4">
                                {/* Case Title */}
                                <div>
                                    <label className="block font-mono text-[10px] font-bold tracking-widest text-[#bacac7] uppercase mb-2">
                                        Case Title *
                                    </label>

                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) =>
                                            setTitle(e.target.value)
                                        }
                                        placeholder="e.g. Coordinated Digital Fraud Network"
                                        className="w-full bg-[#0b0f0f] border border-[#3c4948] rounded-lg px-4 py-3 text-sm text-white placeholder:text-[#596563] outline-none focus:border-[#66FCF1] transition-colors"
                                    />

                                    {!title.trim() && (
                                        <p className="text-[10px] text-[#ff9b91] mt-1">
                                            Case title is required.
                                        </p>
                                    )}
                                </div>

                                {/* Summary */}
                                <div>
                                    <label className="block font-mono text-[10px] font-bold tracking-widest text-[#bacac7] uppercase mb-2">
                                        Case Description / Objective *
                                    </label>

                                    <textarea
                                        value={summary}
                                        onChange={(e) =>
                                            setSummary(e.target.value)
                                        }
                                        placeholder="Describe the purpose, background, incident context, or initial intelligence..."
                                        rows={4}
                                        className="w-full resize-none bg-[#0b0f0f] border border-[#3c4948] rounded-lg px-4 py-3 text-sm text-white placeholder:text-[#596563] outline-none focus:border-[#66FCF1] transition-colors"
                                    />

                                    {!summary.trim() && (
                                        <p className="text-[10px] text-[#ff9b91] mt-1">
                                            Case description is required.
                                        </p>
                                    )}
                                </div>

                                {/* Priority + Status */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block font-mono text-[10px] font-bold tracking-widest text-[#bacac7] uppercase mb-2">
                                            Priority
                                        </label>

                                        <select
                                            value={priority}
                                            onChange={(e) =>
                                                setPriority(
                                                    e.target.value as CasePriority
                                                )
                                            }
                                            className="w-full bg-[#0b0f0f] border border-[#3c4948] rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-[#66FCF1]"
                                        >
                                            <option value="HIGH">
                                                HIGH
                                            </option>

                                            <option value="MEDIUM">
                                                MEDIUM
                                            </option>

                                            <option value="LOW">
                                                LOW
                                            </option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block font-mono text-[10px] font-bold tracking-widest text-[#bacac7] uppercase mb-2">
                                            Initial Status
                                        </label>

                                        <select
                                            value={status}
                                            onChange={(e) =>
                                                setStatus(
                                                    e.target.value as CaseStatus
                                                )
                                            }
                                            className="w-full bg-[#0b0f0f] border border-[#3c4948] rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-[#66FCF1]"
                                        >
                                            <option value="ACTIVE">
                                                ACTIVE
                                            </option>

                                            <option value="PENDING_REVIEW">
                                                PENDING REVIEW
                                            </option>
                                        </select>
                                    </div>
                                </div>

                                {/* Investigator */}
                                <div>
                                    <label className="block font-mono text-[10px] font-bold tracking-widest text-[#bacac7] uppercase mb-2">
                                        Lead Investigator *
                                    </label>

                                    <input
                                        type="text"
                                        value={leadInvestigator}
                                        onChange={(e) =>
                                            setLeadInvestigator(
                                                e.target.value
                                            )
                                        }
                                        placeholder="e.g. Inspector A. Khan"
                                        className="w-full bg-[#0b0f0f] border border-[#3c4948] rounded-lg px-4 py-3 text-sm text-white placeholder:text-[#596563] outline-none focus:border-[#66FCF1] transition-colors"
                                    />

                                    {!leadInvestigator.trim() && (
                                        <p className="text-[10px] text-[#ff9b91] mt-1">
                                            Lead investigator is required.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* =================================================
                            DATA INGESTION
                        ================================================= */}

                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded bg-[#F6B352]/10 border border-[#F6B352]/30 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-[12px] text-[#F6B352]">
                                            upload_file
                                        </span>
                                    </span>

                                    <h3 className="font-mono text-[10px] font-bold tracking-widest text-[#F6B352] uppercase">
                                        DATA / EVIDENCE INGESTION
                                    </h3>
                                </div>

                                {files.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={clearFiles}
                                        className="font-mono text-[9px] font-bold text-[#ff9b91] hover:text-white uppercase tracking-wider"
                                    >
                                        CLEAR ALL
                                    </button>
                                )}
                            </div>

                            {/* Drop Zone */}
                            <div
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setIsDragging(true);
                                }}
                                onDragLeave={() =>
                                    setIsDragging(false)
                                }
                                onDrop={handleDrop}
                                onClick={() =>
                                    fileInputRef.current?.click()
                                }
                                className={`border border-dashed rounded-xl p-7 cursor-pointer transition-all ${isDragging
                                        ? 'border-[#66FCF1] bg-[#66FCF1]/10'
                                        : 'border-[#3c4948] bg-[#0b0f0f] hover:border-[#66FCF1]/70 hover:bg-[#66FCF1]/5'
                                    }`}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept={ACCEPTED_FILE_TYPES.join(',')}
                                    onChange={handleFileChange}
                                    className="hidden"
                                />

                                <div className="flex flex-col items-center justify-center text-center">
                                    <div className="w-12 h-12 rounded-full bg-[#66FCF1]/10 border border-[#66FCF1]/25 flex items-center justify-center mb-3">
                                        <span className="material-symbols-outlined text-[24px] text-[#66FCF1]">
                                            cloud_upload
                                        </span>
                                    </div>

                                    <p className="text-sm font-semibold text-white">
                                        Drop evidence files here
                                    </p>

                                    <p className="text-xs text-[#859491] mt-1">
                                        or click to browse files
                                    </p>

                                    <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                                        {[
                                            'PDF',
                                            'XLSX',
                                            'CSV',
                                            'DOCX',
                                            'TXT',
                                            'PNG',
                                            'JPG',
                                        ].map((type) => (
                                            <span
                                                key={type}
                                                className="px-2 py-1 bg-[#18201f] border border-[#3c4948] rounded font-mono text-[8px] text-[#bacac7]"
                                            >
                                                {type}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <p className="font-mono text-[8px] text-[#596563] mt-2 uppercase tracking-wider">
                                Synthetic/demo evidence recommended. Files will be analyzed after backend ingestion is connected.
                            </p>

                            {/* Selected Files */}
                            {files.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-mono text-[9px] font-bold tracking-widest text-[#bacac7] uppercase">
                                            SELECTED FILES
                                        </span>

                                        <span className="font-mono text-[9px] text-[#7bd6d1]">
                                            {files.length} FILE
                                            {files.length === 1
                                                ? ''
                                                : 'S'}
                                        </span>
                                    </div>

                                    <div className="space-y-2">
                                        {files.map(
                                            (file, index) => (
                                                <div
                                                    key={`${file.name}-${file.lastModified}-${index}`}
                                                    className="flex items-center gap-3 px-3 py-2.5 bg-[#0b0f0f] border border-[#3c4948]/70 rounded-lg"
                                                >
                                                    <div className="w-8 h-8 rounded bg-[#18201f] border border-[#3c4948] flex items-center justify-center flex-shrink-0">
                                                        <span className="material-symbols-outlined text-[16px] text-[#66FCF1]">
                                                            {getFileIcon(
                                                                file.name
                                                            )}
                                                        </span>
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-mono text-[10px] font-semibold text-white truncate">
                                                            {file.name}
                                                        </p>

                                                        <p className="font-mono text-[8px] text-[#859491] mt-0.5">
                                                            {formatFileSize(
                                                                file.size
                                                            )}
                                                        </p>
                                                    </div>

                                                    <span className="font-mono text-[8px] text-[#7bd6d1] uppercase">
                                                        READY
                                                    </span>

                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            removeFile(
                                                                index
                                                            );
                                                        }}
                                                        className="w-7 h-7 flex items-center justify-center rounded border border-[#3c4948] text-[#859491] hover:text-[#ff9b91] hover:border-[#ff9b91]/50 transition-colors"
                                                        aria-label={`Remove ${file.name}`}
                                                    >
                                                        <span className="material-symbols-outlined text-[14px]">
                                                            close
                                                        </span>
                                                    </button>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* =================================================
                        FOOTER
                    ================================================= */}

                    <div className="px-6 py-4 border-t border-[#3c4948]/60 bg-[#0e1312] flex items-center justify-between gap-3 flex-shrink-0">
                        <div className="font-mono text-[8px] text-[#596563] uppercase tracking-wider">
                            {files.length > 0
                                ? `${files.length} source file${files.length === 1 ? '' : 's'} attached`
                                : 'No source files attached'}
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="px-5 py-2.5 rounded-lg border border-[#3c4948] text-[#bacac7] font-mono text-[10px] font-bold tracking-widest hover:text-white hover:border-[#859491] transition-colors"
                            >
                                CANCEL
                            </button>

                            <button
                                type="submit"
                                disabled={!isValid || files.length === 0}
                                className="px-5 py-2.5 rounded-lg bg-[#66FCF1] text-[#06100f] font-mono text-[10px] font-bold tracking-widest hover:bg-[#8afff7] disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[15px]">
                                    auto_awesome
                                </span>

                                ANALYZE & CREATE CASE
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};