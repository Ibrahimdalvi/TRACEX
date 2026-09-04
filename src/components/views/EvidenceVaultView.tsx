import React, { useEffect, useMemo, useState } from 'react';
import { EvidenceRecord, InvestigationCase } from '../../types';

interface EvidenceVaultViewProps {
  evidenceList: EvidenceRecord[];
  currentCase: InvestigationCase;
  onSelectEvidence: (item: EvidenceRecord) => void;
}

export const EvidenceVaultView: React.FC<EvidenceVaultViewProps> = ({
  evidenceList,
  currentCase,
  onSelectEvidence,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<EvidenceRecord | null>(
    evidenceList[0] || null
  );

  /*
   * ---------------------------------------------------------
   * KEEP SELECTED EVIDENCE IN SYNC WITH CURRENT CASE
   * ---------------------------------------------------------
   *
   * Old version only initialized selectedItem once.
   * When the case/evidence changed, selectedItem could still
   * point to the previous case.
   */
  useEffect(() => {
    if (!evidenceList || evidenceList.length === 0) {
      setSelectedItem(null);
      return;
    }

    setSelectedItem((previous) => {
      if (!previous) {
        return evidenceList[0];
      }

      const stillExists = evidenceList.find(
        (item) => item.id === previous.id
      );

      return stillExists || evidenceList[0];
    });
  }, [evidenceList]);

  /*
   * ---------------------------------------------------------
   * NORMALIZED EVIDENCE HELPERS
   * ---------------------------------------------------------
   *
   * Different backend versions may use different property
   * names. We support all common variants here.
   */

  const getValue = (
    item: any,
    keys: string[],
    fallback = ''
  ): string => {
    for (const key of keys) {
      const value = item?.[key];

      if (
        value !== undefined &&
        value !== null &&
        String(value).trim() !== '' &&
        String(value).toLowerCase() !== 'n/a' &&
        String(value).toLowerCase() !== 'unknown'
      ) {
        return String(value);
      }
    }

    return fallback;
  };

  const getTitle = (item: any): string => {
    return getValue(
      item,
      [
        'title',
        'name',
        'fileName',
        'filename',
        'documentName',
        'evidenceName',
      ],
      'Evidence Record'
    );
  };

  const getCategory = (item: any): string => {
    return getValue(
      item,
      [
        'category',
        'evidenceCategory',
        'type',
        'evidenceType',
      ],
      'GENERAL'
    );
  };

  const getClassification = (item: any): string => {
    return getValue(
      item,
      [
        'classification',
        'securityClassification',
        'classificationLevel',
      ],
      'UNCLASSIFIED'
    );
  };

  const getDescription = (item: any): string => {
    return getValue(
      item,
      [
        'description',
        'summary',
        'extract',
        'forensicExtract',
        'content',
        'text',
      ],
      'No forensic description was returned by the analysis engine.'
    );
  };

  const getFileSize = (item: any): string => {
    const value = getValue(
      item,
      [
        'fileSize',
        'size',
        'file_size',
        'formattedSize',
      ]
    );

    if (value) {
      return value;
    }

    if (typeof item?.size === 'number') {
      return formatBytes(item.size);
    }

    return 'Not available';
  };

  const getFileType = (item: any): string => {
    const direct = getValue(
      item,
      [
        'fileType',
        'mimeType',
        'mime',
        'contentType',
        'type',
      ]
    );

    if (direct) {
      return direct;
    }

    const fileName = getValue(
      item,
      ['fileName', 'filename', 'name']
    );

    if (fileName && fileName.includes('.')) {
      return fileName.split('.').pop()?.toUpperCase() || 'FILE';
    }

    return 'FILE';
  };

  const getUploadedBy = (item: any): string => {
    return getValue(
      item,
      [
        'uploadedBy',
        'uploaded_by',
        'createdBy',
        'author',
        'source',
      ],
      'SYSTEM'
    );
  };

  const getUploadedAt = (item: any): string => {
    return getValue(
      item,
      [
        'uploadedAt',
        'uploaded_at',
        'createdAt',
        'created_at',
        'timestamp',
        'date',
      ],
      'Not available'
    );
  };

  const getHash = (item: any): string => {
    return getValue(
      item,
      [
        'sha256',
        'SHA256',
        'sha_256',
        'hash',
        'checksum',
        'checksumSha256',
      ]
    );
  };

  const getFileUrl = (item: any): string => {
    return getValue(
      item,
      [
        'downloadUrl',
        'downloadURL',
        'fileUrl',
        'fileURL',
        'url',
        'download',
        'path',
      ]
    );
  };

  const formatBytes = (bytes: number): string => {
    if (!Number.isFinite(bytes) || bytes <= 0) {
      return 'Not available';
    }

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const index = Math.min(
      Math.floor(Math.log(bytes) / Math.log(1024)),
      units.length - 1
    );

    return `${(bytes / Math.pow(1024, index)).toFixed(
      index === 0 ? 0 : 2
    )} ${units[index]}`;
  };

  /*
   * ---------------------------------------------------------
   * FILTER
   * ---------------------------------------------------------
   */

  const categories = [
    'ALL',
    'FINANCIAL',
    'INTERCEPT',
    'SURVEILLANCE',
    'KYC_RECORD',
    'EMAIL',
    'URL',
    'AUTHENTICATION',
    'DOCUMENT',
    'IMAGE',
    'OTHER',
  ];

  const filtered = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();

    return evidenceList.filter((item: any) => {
      const category = getCategory(item);
      const title = getTitle(item);
      const description = getDescription(item);
      const id = String(item?.id || '');

      const matchesCat =
        filterCategory === 'ALL' ||
        category.toUpperCase() === filterCategory;

      const matchesSearch =
        !query ||
        title.toLowerCase().includes(query) ||
        id.toLowerCase().includes(query) ||
        category.toLowerCase().includes(query) ||
        description.toLowerCase().includes(query) ||
        getHash(item).toLowerCase().includes(query);

      return matchesCat && matchesSearch;
    });
  }, [evidenceList, filterCategory, searchTerm]);

  /*
   * ---------------------------------------------------------
   * DOWNLOAD
   * ---------------------------------------------------------
   *
   * If backend provides an actual file URL:
   *     download the actual evidence.
   *
   * Otherwise:
   *     download a forensic evidence dossier as JSON.
   *
   * This means the button always works, while actual-file
   * downloading depends on the backend providing a URL.
   */

  const handleDownloadEvidence = (item: EvidenceRecord) => {
    const evidence: any = item;

    const fileUrl = getFileUrl(evidence);
    const title = getTitle(evidence);
    const id = String(evidence?.id || 'EVIDENCE');

    /*
     * ACTUAL FILE DOWNLOAD
     */

    if (fileUrl) {
      const anchor = document.createElement('a');

      anchor.href = fileUrl;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';

      const extension = getFileType(evidence)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');

      anchor.download = `${id}-${title.replace(
        /[^a-zA-Z0-9-_]/g,
        '_'
      )}.${extension || 'file'}`;

      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      return;
    }

    /*
     * FORENSIC DOSSIER DOWNLOAD
     */

    const dossier = {
      dossierType: 'TRACEX FORENSIC EVIDENCE DOSSIER',

      case: {
        id: currentCase.id,
        title: currentCase.title,
      },

      evidence: {
        recordId: id,
        title,
        category: getCategory(evidence),
        classification: getClassification(evidence),
        description: getDescription(evidence),
        fileSize: getFileSize(evidence),
        fileType: getFileType(evidence),
        uploadedBy: getUploadedBy(evidence),
        uploadedAt: getUploadedAt(evidence),
        sha256: getHash(evidence) || 'Not available',
      },

      rawEvidenceRecord: evidence,

      generatedAt: new Date().toISOString(),

      notice:
        'This dossier contains the evidence metadata and forensic information returned by the TRACEX analysis backend. An original binary file can only be downloaded when the backend provides a valid file URL.',
    };

    const blob = new Blob(
      [JSON.stringify(dossier, null, 2)],
      {
        type: 'application/json',
      }
    );

    const url = URL.createObjectURL(blob);

    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = `${id}-forensic-dossier.json`;

    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    URL.revokeObjectURL(url);
  };

  /*
   * ---------------------------------------------------------
   * RENDER
   * ---------------------------------------------------------
   */

  return (
    <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 pb-12">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">

        <div>

          <div className="flex items-center gap-2 mb-1">

            <span className="font-mono text-xs text-[#7bd6d1] font-bold uppercase tracking-wider">
              {currentCase.id} EVIDENCE VAULT
            </span>

            <span className="px-2 py-0.5 rounded bg-[#007774]/20 border border-[#007774]/40 font-mono text-[9px] text-[#a1fcf7] font-bold">
              CHAIN OF CUSTODY VERIFIED
            </span>

          </div>

          <h2 className="font-sans text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Forensic Evidence & Document Repository
          </h2>

          <p className="mt-1 text-xs text-[#859491] font-mono">
            {evidenceList.length} EVIDENCE RECORD
            {evidenceList.length === 1 ? '' : 'S'} REGISTERED
          </p>

        </div>

        <div className="flex items-center gap-3">

          <button
            type="button"
            onClick={() => {
              alert(
                'Upload new exhibit is controlled by the case ingestion workflow. Upload the file through NEW CASE to have it analyzed and registered.'
              );
            }}
            className="px-3.5 py-2 rounded bg-[#66FCF1] text-[#00201e] font-mono text-[10px] font-bold uppercase tracking-wider hover:opacity-90 transition-all flex items-center gap-2 shadow-md"
          >
            <span className="material-symbols-outlined text-[16px]">
              upload_file
            </span>

            UPLOAD NEW EXHIBIT
          </button>

        </div>

      </div>


      {/* =====================================================
          FILTERS
      ===================================================== */}

      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-[#1a2120] border border-[#3c4948]/40 p-3 rounded-lg">

        <div className="flex gap-2 overflow-x-auto">

          {categories.map((cat) => (

            <button
              key={cat}
              type="button"
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded font-mono text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${filterCategory === cat
                  ? 'bg-[#66FCF1] text-[#00201e]'
                  : 'bg-[#0e1514] text-[#bacac7] hover:text-white border border-[#3c4948]/50'
                }`}
            >
              {cat}
            </button>

          ))}

        </div>

        <div className="flex items-center bg-[#0e1514] border border-[#3c4948]/60 px-3 py-1.5 rounded w-full md:w-72">

          <span className="material-symbols-outlined text-[#7bd6d1] text-[16px] mr-2">
            search
          </span>

          <input
            type="text"
            placeholder="Filter evidence or hash..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none text-white text-xs font-mono focus:outline-none w-full placeholder:text-[#859491]/60"
          />

        </div>

      </div>


      {/* =====================================================
          NO EVIDENCE
      ===================================================== */}

      {filtered.length === 0 && (

        <div className="bg-[#1a2120] border border-[#3c4948]/40 rounded-lg p-10 flex flex-col items-center justify-center text-center">

          <span className="material-symbols-outlined text-[#66FCF1] text-[42px] mb-3">
            folder_off
          </span>

          <h3 className="text-white font-bold text-lg">
            No Evidence Found
          </h3>

          <p className="text-[#859491] text-xs font-mono mt-2">
            {evidenceList.length === 0
              ? 'The backend returned no evidence records for this case.'
              : 'No evidence matches the current filter.'}
          </p>

        </div>

      )}


      {/* =====================================================
          MAIN GRID
      ===================================================== */}

      {filtered.length > 0 && (

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* =================================================
              EVIDENCE LIST
          ================================================= */}

          <div className="lg:col-span-7 flex flex-col gap-3">

            {filtered.map((item: EvidenceRecord) => {

              const isSelected =
                selectedItem?.id === item.id;

              const title = getTitle(item);
              const category = getCategory(item);
              const classification =
                getClassification(item);

              const description =
                getDescription(item);

              const fileSize =
                getFileSize(item);

              const uploadedBy =
                getUploadedBy(item);

              const uploadedAt =
                getUploadedAt(item);

              const fileType =
                getFileType(item);

              return (

                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`bg-[#1a2120] border p-4 rounded-lg cursor-pointer transition-all flex flex-col gap-3 shadow-sm ${isSelected
                      ? 'border-[#66FCF1] bg-[#242b2a] shadow-[0_0_12px_rgba(102,252,241,0.2)]'
                      : 'border-[#3c4948]/40 hover:border-[#3c4948]/80 hover:bg-[#202726]'
                    }`}
                >

                  <div className="flex justify-between items-start">

                    <div className="flex items-center gap-2.5">

                      <span className="material-symbols-outlined text-[20px] p-2 rounded bg-[#0e1514] text-[#66FCF1] border border-[#3c4948]/50">

                        {fileType.toLowerCase().includes('pdf')
                          ? 'description'
                          : fileType.toLowerCase().includes('audio')
                            ? 'graphic_eq'
                            : fileType.toLowerCase().includes('image')
                              ? 'photo_camera'
                              : fileType.toLowerCase().includes('email')
                                ? 'mail'
                                : fileType.toLowerCase().includes('url')
                                  ? 'link'
                                  : 'folder'}

                      </span>

                      <div>

                        <span className="font-mono text-[10px] font-bold text-[#7bd6d1] uppercase tracking-wider">
                          {item.id}
                        </span>

                        <h4 className="font-sans text-sm font-bold text-white leading-tight">
                          {title}
                        </h4>

                      </div>

                    </div>

                    <span className="px-2 py-0.5 rounded font-mono text-[9px] font-extrabold tracking-wider bg-[#93000a]/20 text-[#ffb4ab] border border-[#ffb4ab]/30">
                      {classification}
                    </span>

                  </div>


                  <p className="font-sans text-xs text-[#bacac7] line-clamp-2">
                    {description}
                  </p>


                  <div className="flex justify-between items-center pt-2 border-t border-[#3c4948]/30 font-mono text-[9px] text-[#859491]">

                    <span>
                      BY: {uploadedBy}
                    </span>

                    <span>
                      SIZE: {fileSize}
                    </span>

                    <span>
                      {uploadedAt}
                    </span>

                  </div>

                </div>

              );

            })}

          </div>


          {/* =================================================
              INSPECTOR
          ================================================= */}

          {selectedItem && (

            <div className="lg:col-span-5 bg-[#1a2120] border border-[#3c4948]/40 rounded-lg p-5 flex flex-col gap-4 shadow-xl">

              {/*
               * NORMALIZED VALUES
               */}

              {(() => {

                const title =
                  getTitle(selectedItem);

                const category =
                  getCategory(selectedItem);

                const classification =
                  getClassification(selectedItem);

                const description =
                  getDescription(selectedItem);

                const fileSize =
                  getFileSize(selectedItem);

                const fileType =
                  getFileType(selectedItem);

                const uploadedBy =
                  getUploadedBy(selectedItem);

                const uploadedAt =
                  getUploadedAt(selectedItem);

                const hash =
                  getHash(selectedItem);

                const fileUrl =
                  getFileUrl(selectedItem);

                return (

                  <>

                    {/* HEADER */}

                    <div className="flex justify-between items-center border-b border-[#3c4948]/40 pb-3">

                      <span className="font-mono text-xs font-bold text-[#66FCF1] tracking-wider uppercase">
                        EXHIBIT INSPECTOR
                      </span>

                      <span className="flex items-center gap-1 font-mono text-[10px] text-[#a1fcf7]">

                        <span className="w-1.5 h-1.5 rounded-full bg-[#66FCF1]"></span>

                        {hash
                          ? 'SHA-256 VERIFIED'
                          : 'METADATA VERIFIED'}

                      </span>

                    </div>


                    {/* TITLE */}

                    <div>

                      <span className="font-mono text-[10px] text-[#859491] uppercase tracking-wider block">
                        TITLE
                      </span>

                      <h3 className="font-sans text-base font-bold text-white mt-0.5">
                        {title}
                      </h3>

                    </div>


                    {/* RECORD INFORMATION */}

                    <div className="bg-[#0e1514] p-3 rounded border border-[#3c4948]/40 font-mono text-[10px] flex flex-col gap-2">

                      <div className="flex justify-between gap-4">

                        <span className="text-[#859491]">
                          RECORD ID
                        </span>

                        <span className="text-white font-bold text-right">
                          {selectedItem.id}
                        </span>

                      </div>


                      <div className="flex justify-between gap-4">

                        <span className="text-[#859491]">
                          CATEGORY
                        </span>

                        <span className="text-[#66FCF1] font-bold text-right">
                          {category}
                        </span>

                      </div>


                      <div className="flex justify-between gap-4">

                        <span className="text-[#859491]">
                          CLASSIFICATION
                        </span>

                        <span className="text-[#ffb4ab] font-bold text-right">
                          {classification}
                        </span>

                      </div>


                      <div className="flex justify-between gap-4">

                        <span className="text-[#859491]">
                          FILE SIZE
                        </span>

                        <span className="text-white text-right">
                          {fileSize}
                        </span>

                      </div>


                      <div className="flex justify-between gap-4">

                        <span className="text-[#859491]">
                          FILE TYPE
                        </span>

                        <span className="text-white text-right">
                          {fileType}
                        </span>

                      </div>


                      <div className="flex justify-between gap-4">

                        <span className="text-[#859491]">
                          UPLOADED BY
                        </span>

                        <span className="text-white text-right">
                          {uploadedBy}
                        </span>

                      </div>


                      <div className="flex justify-between gap-4">

                        <span className="text-[#859491]">
                          UPLOADED AT
                        </span>

                        <span className="text-white text-right">
                          {uploadedAt}
                        </span>

                      </div>


                      {/* HASH */}

                      <div className="flex flex-col gap-1 pt-2 border-t border-[#3c4948]/30">

                        <span className="text-[#859491]">
                          CRYPTOGRAPHIC CHECKSUM
                        </span>

                        <span className="text-[#7bd6d1] break-all font-mono text-[9px] bg-[#1a2120] p-1.5 rounded border border-[#3c4948]/40">

                          {hash ||
                            'SHA-256 hash not returned by backend'}

                        </span>

                      </div>

                    </div>


                    {/* FORENSIC EXTRACT */}

                    <div>

                      <span className="font-mono text-[10px] font-bold text-[#859491] uppercase tracking-wider block mb-1">
                        SUMMARY & FORENSIC EXTRACT
                      </span>

                      <p className="font-sans text-xs text-[#dde4e2] leading-relaxed bg-[#0e1514] p-3 rounded border border-[#3c4948]/40">
                        {description}
                      </p>

                    </div>


                    {/* RAW DATA INDICATOR */}

                    <div className="bg-[#0e1514] border border-[#3c4948]/40 rounded p-3">

                      <div className="flex justify-between items-center">

                        <span className="font-mono text-[9px] text-[#859491] uppercase">
                          SOURCE STATUS
                        </span>

                        <span className="font-mono text-[9px] text-[#66FCF1]">
                          BACKEND RECORD
                        </span>

                      </div>

                      <p className="text-[10px] text-[#859491] mt-2 leading-relaxed">
                        Information displayed here is taken from the
                        evidence record returned by the TRACEX backend.
                        Missing fields are not fabricated.
                      </p>

                    </div>


                    {/* BUTTONS */}

                    <div className="mt-auto flex flex-col gap-2 pt-4 border-t border-[#3c4948]/30">

                      <button
                        type="button"
                        onClick={() =>
                          onSelectEvidence(
                            selectedItem
                          )
                        }
                        className="w-full py-2.5 bg-[#66FCF1] text-[#00201e] font-mono text-[10px] font-bold uppercase tracking-wider rounded hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-md"
                      >

                        <span className="material-symbols-outlined text-[16px]">
                          visibility
                        </span>

                        OPEN FULL EVIDENCE DOSSIER

                      </button>


                      <button
                        type="button"
                        onClick={() =>
                          handleDownloadEvidence(
                            selectedItem
                          )
                        }
                        className="w-full py-2.5 bg-[#111817] border border-[#66FCF1]/40 text-[#66FCF1] font-mono text-[10px] font-bold uppercase tracking-wider rounded hover:bg-[#172321] hover:border-[#66FCF1] transition-all flex items-center justify-center gap-2"
                      >

                        <span className="material-symbols-outlined text-[16px]">
                          download
                        </span>

                        {fileUrl
                          ? 'DOWNLOAD ORIGINAL EVIDENCE'
                          : 'DOWNLOAD EVIDENCE DOSSIER'}

                      </button>

                    </div>

                  </>

                );

              })()}

            </div>

          )}

        </div>

      )}

    </div>
  );
};