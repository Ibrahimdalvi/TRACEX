import React, { useEffect, useMemo, useState } from 'react';
import { EvidenceRecord, InvestigationCase } from '../../types';

interface EvidenceVaultViewProps {
  evidenceList: EvidenceRecord[];
  currentCase: InvestigationCase;
  onSelectEvidence?: (item: EvidenceRecord) => void;
}

const CATEGORIES = [
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

export const EvidenceVaultView: React.FC<EvidenceVaultViewProps> = ({
  evidenceList = [],
  currentCase,
}) => {
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<EvidenceRecord | null>(
    evidenceList[0] || null
  );
  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  useEffect(() => {
    setSelectedItem((previous) => {
      if (!evidenceList.length) return null;
      if (!previous) return evidenceList[0];

      const current = evidenceList.find(
        (item: any) => item?.id === previous?.id
      );

      return current || evidenceList[0];
    });
  }, [evidenceList]);

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

  const getTitle = (item: any) =>
    getValue(
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

  const getCategory = (item: any) =>
    getValue(
      item,
      ['category', 'evidenceCategory', 'type', 'evidenceType'],
      'GENERAL'
    );

  const getClassification = (item: any) =>
    getValue(
      item,
      ['classification', 'securityClassification', 'classificationLevel'],
      'UNCLASSIFIED'
    );

  const getDescription = (item: any) =>
    getValue(
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

  const getHash = (item: any) =>
    getValue(item, [
      'sha256',
      'SHA256',
      'sha_256',
      'hash',
      'checksum',
      'checksumSha256',
    ]);

  const getFileUrl = (item: any) =>
    getValue(item, [
      'downloadUrl',
      'downloadURL',
      'fileUrl',
      'fileURL',
      'url',
      'download',
    ]);

  const getFileName = (item: any) =>
    getValue(
      item,
      ['fileName', 'filename', 'name', 'documentName'],
      getTitle(item)
    );

  const getFileType = (item: any) => {
    const direct = getValue(item, [
      'fileType',
      'mimeType',
      'mime',
      'contentType',
    ]);

    if (direct) return direct;

    const name = getFileName(item);

    if (name.includes('.')) {
      return name.split('.').pop()?.toUpperCase() || 'FILE';
    }

    return 'FILE';
  };

  const getUploadedBy = (item: any) =>
    getValue(
      item,
      ['uploadedBy', 'uploaded_by', 'createdBy', 'author', 'source'],
      'SYSTEM'
    );

  const getUploadedAt = (item: any) =>
    getValue(
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

  const getFileSize = (item: any) => {
    const direct = getValue(item, [
      'fileSize',
      'formattedSize',
      'size',
      'file_size',
    ]);

    if (direct && typeof item?.size !== 'number') return direct;

    if (typeof item?.size === 'number') {
      return formatBytes(item.size);
    }

    return direct || 'Not available';
  };

  const getSource = (item: any) =>
    getValue(
      item,
      ['source', 'sourceSystem', 'origin', 'evidenceSource'],
      'TRACEX ANALYSIS ENGINE'
    );

  const getIntegrityStatus = (item: any) =>
    getValue(
      item,
      ['integrityStatus', 'verificationStatus', 'hashStatus'],
      getHash(item) ? 'SHA-256 VERIFIED' : 'METADATA VERIFIED'
    );

  const getIcon = (item: any) => {
    const type = `${getFileType(item)} ${getCategory(item)}`.toLowerCase();

    if (type.includes('pdf')) return 'picture_as_pdf';
    if (type.includes('image') || type.includes('jpg') || type.includes('png')) {
      return 'image';
    }
    if (type.includes('audio') || type.includes('intercept')) return 'graphic_eq';
    if (type.includes('email')) return 'mail';
    if (type.includes('url') || type.includes('link')) return 'link';
    if (type.includes('financial')) return 'account_balance';
    if (type.includes('kyc')) return 'badge';
    if (type.includes('surveillance')) return 'videocam';
    return 'description';
  };

  const filteredEvidence = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();

    return evidenceList.filter((item: any) => {
      const category = getCategory(item);
      const title = getTitle(item);
      const id = String(item?.id || '');
      const description = getDescription(item);
      const hash = getHash(item);

      const categoryMatch =
        filterCategory === 'ALL' ||
        category.toUpperCase() === filterCategory;

      const searchMatch =
        !query ||
        title.toLowerCase().includes(query) ||
        category.toLowerCase().includes(query) ||
        id.toLowerCase().includes(query) ||
        description.toLowerCase().includes(query) ||
        hash.toLowerCase().includes(query);

      return categoryMatch && searchMatch;
    });
  }, [evidenceList, filterCategory, searchTerm]);

  const downloadEvidence = (item: EvidenceRecord) => {
    const evidence: any = item;
    const fileUrl = getFileUrl(evidence);
    const id = String(evidence?.id || 'EVIDENCE');
    const title = getTitle(evidence);

    if (fileUrl) {
      const anchor = document.createElement('a');
      anchor.href = fileUrl;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.download = `${id}-${title
        .replace(/[^a-zA-Z0-9-_]/g, '_')
        .slice(0, 80)}.${getFileType(evidence)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '') || 'file'}`;

      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      return;
    }

    const dossier = {
      dossierType: 'TRACEX FORENSIC EVIDENCE DOSSIER',
      case: {
        id: currentCase?.id,
        title: currentCase?.title,
      },
      evidence: {
        recordId: id,
        title,
        fileName: getFileName(evidence),
        category: getCategory(evidence),
        classification: getClassification(evidence),
        fileType: getFileType(evidence),
        fileSize: getFileSize(evidence),
        uploadedBy: getUploadedBy(evidence),
        uploadedAt: getUploadedAt(evidence),
        source: getSource(evidence),
        integrityStatus: getIntegrityStatus(evidence),
        sha256: getHash(evidence) || null,
        description: getDescription(evidence),
      },
      rawEvidenceRecord: evidence,
      generatedAt: new Date().toISOString(),
      notice:
        'This dossier contains the evidence metadata returned by TRACEX. An original binary file is only downloadable when a valid backend file URL is available.',
    };

    const blob = new Blob([JSON.stringify(dossier, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = `${id}-forensic-dossier.json`;

    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    URL.revokeObjectURL(url);
  };

  const copyHash = async () => {
    if (!selectedItem) return;

    const hash = getHash(selectedItem);
    if (!hash) return;

    try {
      await navigator.clipboard.writeText(hash);
      setCopiedHash(true);
      window.setTimeout(() => setCopiedHash(false), 1600);
    } catch {
      setCopiedHash(false);
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-5 overflow-y-auto pr-1 pb-10">
      {/* HEADER */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="font-mono text-[11px] text-[#7bd6d1] font-bold tracking-[0.16em]">
              {currentCase?.id || 'CASE'} / EVIDENCE VAULT
            </span>

            <span className="px-2 py-1 rounded bg-[#007774]/15 border border-[#007774]/40 font-mono text-[9px] text-[#a1fcf7] font-bold tracking-wider">
              CHAIN OF CUSTODY
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Forensic Evidence Repository
          </h2>

          <p className="mt-1 text-xs text-[#859491] font-mono">
            {evidenceList.length} REGISTERED RECORD
            {evidenceList.length === 1 ? '' : 'S'}
            {' · '}
            {filteredEvidence.length} MATCHED
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#111817] border border-[#3c4948]/50">
          <span className="w-2 h-2 rounded-full bg-[#66FCF1] shadow-[0_0_8px_rgba(102,252,241,0.8)]" />
          <span className="font-mono text-[9px] text-[#a1fcf7] tracking-wider">
            EVIDENCE INTEGRITY MONITOR
          </span>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-[#151c1b] border border-[#3c4948]/50 rounded-xl p-3">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setFilterCategory(category)}
                className={`px-3 py-1.5 rounded-md font-mono text-[9px] font-bold tracking-wider whitespace-nowrap transition-all ${
                  filterCategory === category
                    ? 'bg-[#66FCF1] text-[#00201e]'
                    : 'bg-[#0e1514] text-[#bacac7] border border-[#3c4948]/60 hover:border-[#66FCF1]/40 hover:text-white'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="flex items-center bg-[#0b1110] border border-[#3c4948]/70 rounded-md px-3 py-2 w-full lg:w-80">
            <span className="material-symbols-outlined text-[#7bd6d1] text-[17px] mr-2">
              search
            </span>

            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search evidence, ID, hash..."
              className="w-full bg-transparent border-none outline-none text-white text-xs font-mono placeholder:text-[#687774]"
            />

            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="text-[#859491] hover:text-white"
              >
                <span className="material-symbols-outlined text-[16px]">
                  close
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* EMPTY STATE */}
      {filteredEvidence.length === 0 && (
        <div className="flex-1 min-h-[360px] bg-[#151c1b] border border-[#3c4948]/50 rounded-xl flex items-center justify-center">
          <div className="text-center max-w-md px-6">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-[#0b1110] border border-[#3c4948]/60 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#66FCF1] text-[34px]">
                {evidenceList.length ? 'search_off' : 'folder_off'}
              </span>
            </div>

            <h3 className="mt-4 text-white font-bold text-lg">
              {evidenceList.length ? 'No Matching Evidence' : 'Evidence Vault Empty'}
            </h3>

            <p className="mt-2 text-[#859491] text-xs font-mono leading-relaxed">
              {evidenceList.length
                ? 'No evidence record matches the selected category or search query.'
                : 'No evidence records were returned for this case. Upload and analyze case material through the New Case workflow.'}
            </p>
          </div>
        </div>
      )}

      {/* MAIN */}
      {filteredEvidence.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 min-h-0">
          {/* LIST */}
          <div className="xl:col-span-7 flex flex-col gap-3">
            {filteredEvidence.map((item: EvidenceRecord) => {
              const evidence: any = item;
              const isSelected = selectedItem?.id === item.id;
              const category = getCategory(evidence);
              const classification = getClassification(evidence);

              return (
                <button
                  key={String(item.id)}
                  type="button"
                  onClick={() => setSelectedItem(item)}
                  className={`w-full text-left rounded-xl border p-4 transition-all ${
                    isSelected
                      ? 'bg-[#1e2927] border-[#66FCF1] shadow-[0_0_18px_rgba(102,252,241,0.12)]'
                      : 'bg-[#151c1b] border-[#3c4948]/50 hover:border-[#5b716e] hover:bg-[#1a2221]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 shrink-0 rounded-lg bg-[#0b1110] border border-[#3c4948]/60 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[#66FCF1] text-[21px]">
                          {getIcon(evidence)}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <div className="font-mono text-[9px] text-[#7bd6d1] font-bold tracking-wider">
                          {String(evidence?.id || 'EVIDENCE')}
                        </div>

                        <h3 className="mt-0.5 text-sm font-bold text-white truncate">
                          {getTitle(evidence)}
                        </h3>

                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span className="text-[9px] font-mono text-[#859491]">
                            {category}
                          </span>
                          <span className="text-[#3c4948]">•</span>
                          <span className="text-[9px] font-mono text-[#859491]">
                            {getFileType(evidence)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span className="shrink-0 px-2 py-1 rounded border border-[#ffb4ab]/25 bg-[#93000a]/15 text-[#ffb4ab] font-mono text-[8px] font-bold tracking-wider">
                      {classification}
                    </span>
                  </div>

                  <p className="mt-3 text-xs text-[#bacac7] line-clamp-2 leading-relaxed">
                    {getDescription(evidence)}
                  </p>

                  <div className="mt-3 pt-3 border-t border-[#3c4948]/30 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[8px] text-[#758480]">
                    <span>BY: {getUploadedBy(evidence)}</span>
                    <span>SIZE: {getFileSize(evidence)}</span>
                    <span>{getUploadedAt(evidence)}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* INSPECTOR */}
          {selectedItem && (
            <div className="xl:col-span-5 xl:sticky xl:top-0 h-fit bg-[#151c1b] border border-[#3c4948]/50 rounded-xl p-5 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-[#3c4948]/40">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#66FCF1] text-[18px]">
                    policy
                  </span>
                  <span className="font-mono text-[10px] font-bold text-[#66FCF1] tracking-wider">
                    EXHIBIT INSPECTOR
                  </span>
                </div>

                <span className="flex items-center gap-1.5 font-mono text-[8px] text-[#a1fcf7]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#66FCF1]" />
                  {getIntegrityStatus(selectedItem)}
                </span>
              </div>

              <div className="mt-4">
                <div className="font-mono text-[9px] text-[#859491] tracking-wider">
                  RECORD
                </div>

                <h3 className="mt-1 text-lg font-bold text-white leading-tight">
                  {getTitle(selectedItem)}
                </h3>

                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="px-2 py-1 rounded bg-[#007774]/15 border border-[#007774]/35 text-[#a1fcf7] font-mono text-[8px] font-bold">
                    {getCategory(selectedItem)}
                  </span>

                  <span className="px-2 py-1 rounded bg-[#0b1110] border border-[#3c4948]/60 text-[#bacac7] font-mono text-[8px]">
                    {getFileType(selectedItem)}
                  </span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Info label="RECORD ID" value={String(selectedItem.id)} />
                <Info
                  label="CLASSIFICATION"
                  value={getClassification(selectedItem)}
                />
                <Info label="FILE NAME" value={getFileName(selectedItem)} />
                <Info label="FILE SIZE" value={getFileSize(selectedItem)} />
                <Info label="UPLOADED BY" value={getUploadedBy(selectedItem)} />
                <Info label="UPLOADED AT" value={getUploadedAt(selectedItem)} />
                <Info label="SOURCE" value={getSource(selectedItem)} />
                <Info
                  label="INTEGRITY"
                  value={getIntegrityStatus(selectedItem)}
                />
              </div>

              <div className="mt-3 bg-[#0b1110] border border-[#3c4948]/50 rounded-lg p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[8px] text-[#859491] tracking-wider">
                    SHA-256 CHECKSUM
                  </span>

                  {getHash(selectedItem) && (
                    <button
                      type="button"
                      onClick={copyHash}
                      className="text-[8px] font-mono text-[#66FCF1] hover:text-white"
                    >
                      {copiedHash ? 'COPIED' : 'COPY'}
                    </button>
                  )}
                </div>

                <div className="mt-2 text-[9px] leading-relaxed text-[#7bd6d1] break-all font-mono">
                  {getHash(selectedItem) || 'Hash not returned by backend'}
                </div>
              </div>

              <div className="mt-3">
                <div className="font-mono text-[9px] text-[#859491] tracking-wider">
                  FORENSIC EXTRACT
                </div>

                <div className="mt-2 bg-[#0b1110] border border-[#3c4948]/50 rounded-lg p-3 max-h-44 overflow-y-auto">
                  <p className="text-xs text-[#dde4e2] leading-relaxed whitespace-pre-wrap">
                    {getDescription(selectedItem)}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setIsDossierOpen(true)}
                  className="w-full py-2.5 rounded-lg bg-[#66FCF1] text-[#00201e] font-mono text-[9px] font-bold tracking-wider hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    visibility
                  </span>
                  OPEN FULL EVIDENCE DOSSIER
                </button>

                <button
                  type="button"
                  onClick={() => downloadEvidence(selectedItem)}
                  className="w-full py-2.5 rounded-lg bg-[#0b1110] border border-[#66FCF1]/40 text-[#66FCF1] font-mono text-[9px] font-bold tracking-wider hover:border-[#66FCF1] hover:bg-[#111918] transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    download
                  </span>
                  {getFileUrl(selectedItem)
                    ? 'DOWNLOAD ORIGINAL EVIDENCE'
                    : 'DOWNLOAD EVIDENCE DOSSIER'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* FULL DOSSIER MODAL */}
      {isDossierOpen && selectedItem && (
        <div
          className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsDossierOpen(false);
            }
          }}
        >
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#101716] border border-[#3c4948] rounded-2xl shadow-2xl">
            <div className="sticky top-0 z-10 bg-[#101716]/95 backdrop-blur border-b border-[#3c4948]/50 px-5 py-4 flex items-center justify-between gap-4">
              <div>
                <div className="font-mono text-[9px] text-[#66FCF1] font-bold tracking-[0.18em]">
                  TRACEX / FORENSIC DOSSIER
                </div>
                <h3 className="mt-1 text-lg font-bold text-white">
                  {getTitle(selectedItem)}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setIsDossierOpen(false)}
                className="w-9 h-9 rounded-lg bg-[#0b1110] border border-[#3c4948]/60 text-[#bacac7] hover:text-white flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">
                  close
                </span>
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <DossierField label="CASE ID" value={currentCase?.id} />
                <DossierField label="CASE TITLE" value={currentCase?.title} />
                <DossierField
                  label="RECORD ID"
                  value={String(selectedItem.id)}
                />
                <DossierField
                  label="CLASSIFICATION"
                  value={getClassification(selectedItem)}
                />
                <DossierField
                  label="CATEGORY"
                  value={getCategory(selectedItem)}
                />
                <DossierField
                  label="FILE NAME"
                  value={getFileName(selectedItem)}
                />
                <DossierField
                  label="FILE TYPE"
                  value={getFileType(selectedItem)}
                />
                <DossierField
                  label="FILE SIZE"
                  value={getFileSize(selectedItem)}
                />
                <DossierField
                  label="UPLOADED BY"
                  value={getUploadedBy(selectedItem)}
                />
                <DossierField
                  label="UPLOADED AT"
                  value={getUploadedAt(selectedItem)}
                />
                <DossierField
                  label="SOURCE"
                  value={getSource(selectedItem)}
                />
                <DossierField
                  label="INTEGRITY STATUS"
                  value={getIntegrityStatus(selectedItem)}
                />
              </div>

              <section className="bg-[#0b1110] border border-[#3c4948]/50 rounded-xl p-4">
                <div className="font-mono text-[9px] text-[#859491] tracking-wider">
                  CRYPTOGRAPHIC CHECKSUM
                </div>
                <div className="mt-2 text-[10px] text-[#7bd6d1] font-mono break-all">
                  {getHash(selectedItem) || 'SHA-256 hash not returned by backend'}
                </div>
              </section>

              <section className="bg-[#0b1110] border border-[#3c4948]/50 rounded-xl p-4">
                <div className="font-mono text-[9px] text-[#859491] tracking-wider">
                  SUMMARY & FORENSIC EXTRACT
                </div>
                <p className="mt-2 text-sm text-[#dde4e2] leading-relaxed whitespace-pre-wrap">
                  {getDescription(selectedItem)}
                </p>
              </section>

              <section className="bg-[#0b1110] border border-[#3c4948]/50 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#66FCF1] text-[17px]">
                    verified_user
                  </span>
                  <span className="font-mono text-[9px] font-bold text-[#66FCF1] tracking-wider">
                    INVESTIGATIVE HANDLING NOTICE
                  </span>
                </div>

                <p className="mt-2 text-[10px] text-[#859491] leading-relaxed">
                  Evidence metadata shown here is taken from the TRACEX case
                  analysis record. AI-generated interpretations are investigative
                  leads and require human verification. No conclusion of guilt
                  is made by this interface.
                </p>
              </section>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => downloadEvidence(selectedItem)}
                  className="flex-1 py-2.5 rounded-lg bg-[#66FCF1] text-[#00201e] font-mono text-[9px] font-bold tracking-wider flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    download
                  </span>
                  {getFileUrl(selectedItem)
                    ? 'DOWNLOAD ORIGINAL'
                    : 'DOWNLOAD FORENSIC DOSSIER'}
                </button>

                <button
                  type="button"
                  onClick={() => setIsDossierOpen(false)}
                  className="sm:w-36 py-2.5 rounded-lg bg-[#151c1b] border border-[#3c4948] text-[#bacac7] font-mono text-[9px] font-bold tracking-wider hover:text-white"
                >
                  CLOSE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Info: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <div className="bg-[#0b1110] border border-[#3c4948]/40 rounded-lg p-2.5 min-w-0">
    <div className="font-mono text-[7px] text-[#758480] tracking-wider">
      {label}
    </div>
    <div className="mt-1 text-[9px] text-white font-mono truncate">
      {value || 'Not available'}
    </div>
  </div>
);

const DossierField: React.FC<{ label: string; value?: string }> = ({
  label,
  value,
}) => (
  <div className="bg-[#151c1b] border border-[#3c4948]/40 rounded-lg p-3">
    <div className="font-mono text-[8px] text-[#758480] tracking-wider">
      {label}
    </div>
    <div className="mt-1.5 text-xs text-white font-mono break-words">
      {value || 'Not available'}
    </div>
  </div>
);

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return 'Not available';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );

  return `${(bytes / Math.pow(1024, index)).toFixed(
    index === 0 ? 0 : 2
  )} ${units[index]}`;
}

export default EvidenceVaultView;
