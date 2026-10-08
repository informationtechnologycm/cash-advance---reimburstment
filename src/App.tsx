/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { TopNav } from './components/TopNav';
import { CompanyHeaderCard } from './components/CompanyHeaderCard';
import { DashboardView } from './components/DashboardView';
import { CostAdvanceView } from './components/CostAdvanceView';
import { ReimbursementView } from './components/ReimbursementView';
import { SettlementView } from './components/SettlementView';
import { ReportsView } from './components/ReportsView';
import { DraftsView } from './components/DraftsView';
import { LoginPage } from './components/LoginPage';
import { FormDraft } from './types/finance';

// Modals
import { NewAdvanceModal } from './components/modals/NewAdvanceModal';
import { NewReimbursementModal } from './components/modals/NewReimbursementModal';
import { NewSettlementModal } from './components/modals/NewSettlementModal';
import { AdvanceDetailModal } from './components/modals/AdvanceDetailModal';
import { ReimbursementDetailModal } from './components/modals/ReimbursementDetailModal';
import { SettlementDetailModal } from './components/modals/SettlementDetailModal';
import { VoucherPrintModal } from './components/modals/VoucherPrintModal';
import { RealTimeNotificationToast } from './components/RealTimeNotificationToast';

const MainAppContent: React.FC = () => {
  const { activeTab, setActiveTab, isAuthenticated } = useFinance();

  // If not logged in, render dedicated enterprise login screen
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Modal states
  const [isNewAdvanceOpen, setIsNewAdvanceOpen] = useState(false);
  const [isNewReimbursementOpen, setIsNewReimbursementOpen] = useState(false);
  const [resumingDraft, setResumingDraft] = useState<FormDraft | null>(null);
  
  // Settlement modal with target advanceId
  const [settleAdvanceId, setSettleAdvanceId] = useState<string | null>(null);

  // Detail modals
  const [selectedAdvanceId, setSelectedAdvanceId] = useState<string | null>(null);
  const [selectedReimbursementId, setSelectedReimbursementId] = useState<string | null>(null);
  const [selectedSettlementId, setSelectedSettlementId] = useState<string | null>(null);

  // Print voucher modal
  const [voucherPrintState, setVoucherPrintState] = useState<{
    isOpen: boolean;
    type: 'ADVANCE' | 'REIMBURSEMENT' | 'SETTLEMENT';
    id: string | null;
  }>({
    isOpen: false,
    type: 'ADVANCE',
    id: null,
  });

  const handleOpenPrintVoucher = (
    type: 'ADVANCE' | 'REIMBURSEMENT' | 'SETTLEMENT',
    id: string
  ) => {
    setVoucherPrintState({
      isOpen: true,
      type,
      id,
    });
  };

  const handleResumeAdvanceDraft = (draft: FormDraft) => {
    setResumingDraft(draft);
    setIsNewAdvanceOpen(true);
  };

  const handleResumeReimbursementDraft = (draft: FormDraft) => {
    setResumingDraft(draft);
    setIsNewReimbursementOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Bar strictly following design constitution */}
      <TopNav
        onOpenNewAdvance={() => {
          setResumingDraft(null);
          setIsNewAdvanceOpen(true);
        }}
        onOpenNewReimbursement={() => {
          setResumingDraft(null);
          setIsNewReimbursementOpen(true);
        }}
        onSelectAdvance={id => setSelectedAdvanceId(id)}
        onSelectReimbursement={id => setSelectedReimbursementId(id)}
        onSelectSettlement={id => setSelectedSettlementId(id)}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Dynamic Context Header Card for Selected Entity */}
        <CompanyHeaderCard />

        {/* View Switcher */}
        {activeTab === 'dashboard' && (
          <DashboardView
            onOpenNewAdvance={() => setIsNewAdvanceOpen(true)}
            onOpenNewReimbursement={() => setIsNewReimbursementOpen(true)}
            onSelectAdvance={id => setSelectedAdvanceId(id)}
            onSelectReimbursement={id => setSelectedReimbursementId(id)}
            onSelectSettlement={id => setSelectedSettlementId(id)}
          />
        )}

        {activeTab === 'advances' && (
          <CostAdvanceView
            onOpenNewAdvance={() => setIsNewAdvanceOpen(true)}
            onSelectAdvance={id => setSelectedAdvanceId(id)}
            onOpenSettlement={id => setSettleAdvanceId(id)}
            onPrintVoucher={handleOpenPrintVoucher}
          />
        )}

        {activeTab === 'reimbursements' && (
          <ReimbursementView
            onOpenNewReimbursement={() => setIsNewReimbursementOpen(true)}
            onSelectReimbursement={id => setSelectedReimbursementId(id)}
            onPrintVoucher={handleOpenPrintVoucher}
          />
        )}

        {activeTab === 'settlements' && (
          <SettlementView
            onOpenSettlement={id => setSettleAdvanceId(id)}
            onSelectSettlement={id => setSelectedSettlementId(id)}
            onSelectAdvance={id => setSelectedAdvanceId(id)}
            onPrintVoucher={handleOpenPrintVoucher}
          />
        )}

        {activeTab === 'reports' && <ReportsView />}

        {activeTab === 'drafts' && (
          <DraftsView
            onResumeAdvanceDraft={handleResumeAdvanceDraft}
            onResumeReimbursementDraft={handleResumeReimbursementDraft}
            onOpenNewAdvance={() => {
              setResumingDraft(null);
              setIsNewAdvanceOpen(true);
            }}
            onOpenNewReimbursement={() => {
              setResumingDraft(null);
              setIsNewReimbursementOpen(true);
            }}
          />
        )}
      </main>

      {/* Quiet Corporate Footer */}
      <footer className="no-print mt-auto border-t border-slate-200 bg-white py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-semibold text-slate-800">
              Sistem Cost Advance &amp; Reimbursement Terpadu
            </span>
            <span className="mx-2">·</span>
            <span>PT Artha Mandiri Sejahtera (AMS) &amp; PT Anugerah Mitra Industri (AMI)</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Standar Akuntansi &amp; Pajak Indonesia (PSAK)</span>
            <span>·</span>
            <span>Tahun Anggaran 2026</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <NewAdvanceModal
        isOpen={isNewAdvanceOpen}
        initialDraft={resumingDraft}
        onClose={() => {
          setIsNewAdvanceOpen(false);
          setResumingDraft(null);
        }}
        onDraftSaved={() => {
          setIsNewAdvanceOpen(false);
          setResumingDraft(null);
          setActiveTab('drafts');
        }}
        onSuccess={newId => {
          setIsNewAdvanceOpen(false);
          setResumingDraft(null);
          setSelectedAdvanceId(newId);
          setActiveTab('advances');
        }}
      />

      <NewReimbursementModal
        isOpen={isNewReimbursementOpen}
        initialDraft={resumingDraft}
        onClose={() => {
          setIsNewReimbursementOpen(false);
          setResumingDraft(null);
        }}
        onDraftSaved={() => {
          setIsNewReimbursementOpen(false);
          setResumingDraft(null);
          setActiveTab('drafts');
        }}
        onSuccess={newId => {
          setIsNewReimbursementOpen(false);
          setResumingDraft(null);
          setSelectedReimbursementId(newId);
          setActiveTab('reimbursements');
        }}
      />

      <NewSettlementModal
        isOpen={!!settleAdvanceId}
        advanceId={settleAdvanceId}
        onClose={() => setSettleAdvanceId(null)}
        onSuccess={newSettlementId => {
          setSettleAdvanceId(null);
          setSelectedSettlementId(newSettlementId);
          setActiveTab('settlements');
        }}
      />

      <AdvanceDetailModal
        isOpen={!!selectedAdvanceId}
        advanceId={selectedAdvanceId}
        onClose={() => setSelectedAdvanceId(null)}
        onOpenSettlement={id => {
          setSelectedAdvanceId(null);
          setSettleAdvanceId(id);
        }}
        onPrintVoucher={handleOpenPrintVoucher}
      />

      <ReimbursementDetailModal
        isOpen={!!selectedReimbursementId}
        reimbursementId={selectedReimbursementId}
        onClose={() => setSelectedReimbursementId(null)}
        onPrintVoucher={handleOpenPrintVoucher}
      />

      <SettlementDetailModal
        isOpen={!!selectedSettlementId}
        settlementId={selectedSettlementId}
        onClose={() => setSelectedSettlementId(null)}
        onPrintVoucher={handleOpenPrintVoucher}
      />

      <VoucherPrintModal
        isOpen={voucherPrintState.isOpen}
        voucherType={voucherPrintState.type}
        documentId={voucherPrintState.id}
        onClose={() => setVoucherPrintState(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Floating Real-Time Notification Toast Alert */}
      <RealTimeNotificationToast
        onSelectAdvance={id => setSelectedAdvanceId(id)}
        onSelectReimbursement={id => setSelectedReimbursementId(id)}
        onSelectSettlement={id => setSelectedSettlementId(id)}
      />
    </div>
  );
};

export default function App() {
  return (
    <FinanceProvider>
      <MainAppContent />
    </FinanceProvider>
  );
}
