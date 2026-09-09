import React, { useState, useEffect, useMemo } from 'react';
import {
  DeficitRequest,
  User,
  SystemSettings,
  ManagementFollowUp,
  SystemAlert,
  RelocationStatus,
} from './types';
import {
  getStoredRequests,
  saveStoredRequests,
  getStoredSettings,
  saveStoredSettings,
  getStoredUsers,
  getStoredFollowups,
  saveStoredFollowups,
  getStoredAlerts,
  saveStoredAlerts,
  getActiveUser,
  setActiveUser,
  resetStorageToDefaults,
} from './services/storage';

// Components
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { NewRequestWizard } from './components/NewRequestWizard';
import { RequestsListView } from './components/RequestsListView';
import { DENFQueueView } from './components/DENFQueueView';
import { RelocationsRealtimeView } from './components/RelocationsRealtimeView';
import { ManagementFollowUpView } from './components/ManagementFollowUpView';
import { SectorDemandMapView } from './components/SectorDemandMapView';
import { RankingsView } from './components/RankingsView';
import { IndicatorsView } from './components/IndicatorsView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';

// Modals
import { RequestDetailsModal } from './components/RequestDetailsModal';
import { DecisionModal } from './components/DecisionModal';
import { ImpactModal } from './components/ImpactModal';
import { ClosureModal } from './components/ClosureModal';
import { CancelModal } from './components/CancelModal';
import { TabletBottomBar } from './components/TabletBottomBar';
import { InstallTabletModal } from './components/InstallTabletModal';
import { OfflineIndicator } from './components/OfflineIndicator';

export type NavigationTab =
  | 'dashboard'
  | 'new_request'
  | 'requests'
  | 'denf_queue'
  | 'relocations'
  | 'followup'
  | 'sector_demand'
  | 'rankings'
  | 'indicators'
  | 'reports'
  | 'settings';

export default function App() {
  // App state
  const [currentUser, setCurrentUserState] = useState<User>(getActiveUser);
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');

  const [requests, setRequests] = useState<DeficitRequest[]>(getStoredRequests);
  const [settings, setSettings] = useState<SystemSettings>(getStoredSettings);
  const [followUps, setFollowUps] = useState<ManagementFollowUp[]>(getStoredFollowups);
  const [alerts, setAlerts] = useState<SystemAlert[]>(getStoredAlerts);

  // Modal active states
  const [detailsRequest, setDetailsRequest] = useState<DeficitRequest | null>(null);
  const [decisionRequest, setDecisionRequest] = useState<DeficitRequest | null>(null);
  const [impactRequest, setImpactRequest] = useState<DeficitRequest | null>(null);
  const [closureRequest, setClosureRequest] = useState<DeficitRequest | null>(null);
  const [cancelRequest, setCancelRequest] = useState<DeficitRequest | null>(null);

  // Tablet & Mobile drawer and PWA installation states
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Persist requests on change
  useEffect(() => {
    saveStoredRequests(requests);
  }, [requests]);

  // Persist settings on change
  useEffect(() => {
    saveStoredSettings(settings);
  }, [settings]);

  // Persist follow-ups on change
  useEffect(() => {
    saveStoredFollowups(followUps);
  }, [followUps]);

  // Persist alerts on change
  useEffect(() => {
    saveStoredAlerts(alerts);
  }, [alerts]);

  // Handle user switch
  const handleSwitchUser = (newUser: User) => {
    setCurrentUserState(newUser);
    setActiveUser(newUser);
  };

  // Reset demo data handler
  const handleResetDemoData = () => {
    resetStorageToDefaults();
    setRequests(getStoredRequests());
    setSettings(getStoredSettings());
    setFollowUps(getStoredFollowups());
    setAlerts(getStoredAlerts());
    setCurrentUserState(getActiveUser());
  };

  // Create new request handler (from Wizard)
  const handleCreateRequest = (newRequest: DeficitRequest) => {
    setRequests((prev) => [newRequest, ...prev]);

    // Create system alert for DENF if critical or emergency
    if (newRequest.criticality === 'critica' || newRequest.classification === 'emergencial') {
      const newAlert: SystemAlert = {
        id: `alert-${Date.now()}`,
        requestId: newRequest.id,
        protocol: newRequest.protocol,
        title: `NOVO DÉFICIT CRÍTICO: ${newRequest.solicitorSector}`,
        message: `${newRequest.absentQuantity}x ${newRequest.absentCategory} ausente no plantão ${newRequest.affectedShift}.`,
        severity: 'critical',
        timestamp: new Date().toTimeString().slice(0, 5),
        read: false,
      };
      setAlerts((prev) => [newAlert, ...prev]);
    }

    // Navigate to requests or DENF queue
    if (currentUser.role === 'denf' || currentUser.role === 'admin' || currentUser.role === 'coordenador') {
      setCurrentTab('denf_queue');
    } else {
      setCurrentTab('requests');
    }
  };

  // Update request when decision is registered
  const handleSaveDecision = (updatedRequest: DeficitRequest) => {
    setRequests((prev) => prev.map((r) => (r.id === updatedRequest.id ? updatedRequest : r)));
    setDecisionRequest(null);
    if (detailsRequest?.id === updatedRequest.id) {
      setDetailsRequest(updatedRequest);
    }
  };

  // Update request when impact assessment is saved
  const handleSaveImpact = (updatedRequest: DeficitRequest) => {
    setRequests((prev) => prev.map((r) => (r.id === updatedRequest.id ? updatedRequest : r)));
    setImpactRequest(null);
    if (detailsRequest?.id === updatedRequest.id) {
      setDetailsRequest(updatedRequest);
    }
  };

  // Confirm closure handler
  const handleConfirmClosure = (
    updatedRequest: DeficitRequest,
    newFollowUp?: ManagementFollowUp
  ) => {
    setRequests((prev) => prev.map((r) => (r.id === updatedRequest.id ? updatedRequest : r)));
    if (newFollowUp) {
      setFollowUps((prev) => [newFollowUp, ...prev]);
    }
    setClosureRequest(null);
    if (detailsRequest?.id === updatedRequest.id) {
      setDetailsRequest(updatedRequest);
    }
  };

  // Confirm cancellation handler
  const handleConfirmCancel = (updatedRequest: DeficitRequest) => {
    setRequests((prev) => prev.map((r) => (r.id === updatedRequest.id ? updatedRequest : r)));
    setCancelRequest(null);
    if (detailsRequest?.id === updatedRequest.id) {
      setDetailsRequest(updatedRequest);
    }
  };

  // Update relocation movement status in real-time
  const handleUpdateRelocationStatus = (
    relocationId: string,
    newStatus: RelocationStatus,
    notes?: string
  ) => {
    setRequests((prev) =>
      prev.map((req) => {
        const found = req.relocations.some((rel) => rel.id === relocationId);
        if (!found) return req;

        const updatedRelocations = req.relocations.map((rel) => {
          if (rel.id !== relocationId) return rel;
          return {
            ...rel,
            status: newStatus,
            notes: notes || rel.notes,
          };
        });

        // Add timeline event
        const nowTime = new Date().toTimeString().slice(0, 5);
        const statusLabels: Record<RelocationStatus, string> = {
          aguardando_inicio: 'Aguardando Início',
          em_deslocamento: 'Em Deslocamento',
          em_cobertura: 'Em Cobertura Assistencial',
          finalizado: 'Remanejamento Finalizado',
          cancelado: 'Remanejamento Cancelado',
        };

        return {
          ...req,
          relocations: updatedRelocations,
          timeline: [
            ...req.timeline,
            {
              id: `tl-rel-stat-${Date.now()}`,
              timestamp: nowTime,
              title: `Status do Remanejamento: ${statusLabels[newStatus]}`,
              description: `Atualizado por ${currentUser.name} (${currentUser.roleTitle}).`,
              user: currentUser.name,
              userRole: currentUser.roleTitle,
              type: 'relocation',
            },
          ],
        };
      })
    );
  };

  // Update management follow-up
  const handleUpdateFollowUp = (updatedItem: ManagementFollowUp) => {
    setFollowUps((prev) => prev.map((f) => (f.id === updatedItem.id ? updatedItem : f)));
  };

  // Aggregate all relocation movements across requests
  const allRelocations = useMemo(() => {
    return requests.flatMap((r) => r.relocations);
  }, [requests]);

  // Navigate to specific request details from anywhere
  const handleNavigateToRequest = (reqId: string) => {
    const target = requests.find((r) => r.id === reqId);
    if (target) {
      setDetailsRequest(target);
    }
  };

  // Dynamic badge counts for sidebar
  const pendingQueueCount = requests.filter(
    (r) =>
      r.status === 'aguardando_analise' ||
      r.status === 'em_analise' ||
      r.status === 'aguardando_informacao' ||
      r.status === 'cobertura_parcial'
  ).length;

  const activeRelocationsCount = allRelocations.filter(
    (rel) =>
      rel.status === 'aguardando_inicio' ||
      rel.status === 'em_deslocamento' ||
      rel.status === 'em_cobertura'
  ).length;

  const openFollowUpsCount = followUps.filter((f) => f.status !== 'concluido').length;

  const allUsersList = useMemo(() => getStoredUsers(), []);

  return (
    <div className="min-h-screen bg-[#F9F7F2] flex flex-col font-sans text-[#2D2D2A] antialiased selection:bg-[#8C9C82] selection:text-white">
      {/* Top Navigation Bar */}
      <Navbar
        currentUser={currentUser}
        allUsers={allUsersList}
        onSwitchUser={handleSwitchUser}
        onSelectUser={handleSwitchUser}
        alerts={alerts}
        onOpenAlerts={() => {
          // Open details of first unread or navigate to denf queue
          const firstUnread = alerts.find((a) => !a.read);
          if (firstUnread?.requestId) {
            handleNavigateToRequest(firstUnread.requestId);
          } else {
            setCurrentTab('denf_queue');
          }
        }}
        onNavigateToRequest={handleNavigateToRequest}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
      />

      {/* Main Layout Container */}
      <div className="flex-1 flex w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 gap-6 pb-28 lg:pb-8">
        {/* Left Structural Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          currentUser={currentUser}
          userRole={currentUser.role}
          pendingQueueCount={pendingQueueCount}
          activeRelocationsCount={activeRelocationsCount}
          followUpCount={openFollowUpsCount}
          counts={{
            pendingAnalysis: pendingQueueCount,
            critical: requests.filter((r) => r.criticality === 'critica' && r.status !== 'encerrada' && r.status !== 'cancelada').length,
            activeRelocations: activeRelocationsCount,
            managementFollowUps: openFollowUpsCount,
          }}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          onOpenInstallModal={() => setIsInstallModalOpen(true)}
        />

        {/* Center / Right Content Stage */}
        <main className="flex-1 min-w-0">
          {/* TAB 1: DASHBOARD */}
          {currentTab === 'dashboard' && (
            <DashboardView
              requests={requests}
              currentUser={currentUser}
              onNavigateTab={setCurrentTab}
              onOpenNewRequest={() => setCurrentTab('new_request')}
              onOpenDetails={setDetailsRequest}
              onOpenDecision={setDecisionRequest}
            />
          )}

          {/* TAB 2: NOVO DÉFICIT (8-STEP WIZARD) */}
          {currentTab === 'new_request' && (
            <NewRequestWizard
              currentUser={currentUser}
              settings={settings}
              existingRequests={requests}
              onCreateRequest={handleCreateRequest}
              onCancel={() => setCurrentTab('dashboard')}
            />
          )}

          {/* TAB 3: TODAS AS SOLICITAÇÕES */}
          {currentTab === 'requests' && (
            <RequestsListView
              requests={requests}
              currentUser={currentUser}
              onOpenDetails={setDetailsRequest}
              onOpenDecision={setDecisionRequest}
            />
          )}

          {/* TAB 4: FILA DENF DE TRIAGEM */}
          {currentTab === 'denf_queue' && (
            <DENFQueueView
              requests={requests}
              currentUser={currentUser}
              onOpenDecision={setDecisionRequest}
              onOpenDetails={setDetailsRequest}
            />
          )}

          {/* TAB 5: REMANEJAMENTOS EM TEMPO REAL */}
          {currentTab === 'relocations' && (
            <RelocationsRealtimeView
              relocations={allRelocations}
              currentUser={currentUser}
              onUpdateStatus={handleUpdateRelocationStatus}
              onNavigateToRequest={handleNavigateToRequest}
            />
          )}

          {/* TAB 6: ACOMPANHAMENTO GERENCIAL */}
          {currentTab === 'followup' && (
            <ManagementFollowUpView
              followUps={followUps}
              currentUser={currentUser}
              onUpdateFollowUp={handleUpdateFollowUp}
              onNavigateToRequest={handleNavigateToRequest}
            />
          )}

          {/* TAB 7: MAPA DE DEMANDA (ORIGEM -> DESTINO) */}
          {currentTab === 'sector_demand' && <SectorDemandMapView requests={requests} />}

          {/* TAB 8: RANKINGS GERENCIAIS */}
          {currentTab === 'rankings' && <RankingsView requests={requests} />}

          {/* TAB 9: INDICADORES ESTATÍSTICOS & EFICIÊNCIA */}
          {currentTab === 'indicators' && <IndicatorsView requests={requests} />}

          {/* TAB 10: RELATÓRIOS & EXPORTAÇÃO */}
          {currentTab === 'reports' && <ReportsView requests={requests} />}

          {/* TAB 11: CONFIGURAÇÕES & PARAMETRIZAÇÃO */}
          {currentTab === 'settings' && (
            <SettingsView
              settings={settings}
              currentUser={currentUser}
              onSaveSettings={setSettings}
              onResetDemoData={handleResetDemoData}
            />
          )}
        </main>
      </div>

      {/* MODAL 1: REQUEST DETAILS MODAL (9 TABS) */}
      {detailsRequest && (
        <RequestDetailsModal
          request={detailsRequest}
          currentUser={currentUser}
          settings={settings}
          onClose={() => setDetailsRequest(null)}
          onOpenDecision={(req) => {
            setDetailsRequest(null);
            setDecisionRequest(req);
          }}
          onOpenImpact={(req) => {
            setDetailsRequest(null);
            setImpactRequest(req);
          }}
          onOpenClosure={(req) => {
            setDetailsRequest(null);
            setClosureRequest(req);
          }}
          onOpenCancel={(req) => {
            setDetailsRequest(null);
            setCancelRequest(req);
          }}
        />
      )}

      {/* MODAL 2: DENF DECISION MODAL */}
      {decisionRequest && (
        <DecisionModal
          request={decisionRequest}
          currentUser={currentUser}
          settings={settings}
          onSaveDecision={handleSaveDecision}
          onClose={() => setDecisionRequest(null)}
        />
      )}

      {/* MODAL 3: IMPACT ASSESSMENT MODAL */}
      {impactRequest && (
        <ImpactModal
          request={impactRequest}
          currentUser={currentUser}
          onSaveImpact={handleSaveImpact}
          onClose={() => setImpactRequest(null)}
        />
      )}

      {/* MODAL 4: OCCURRENCE CLOSURE MODAL */}
      {closureRequest && (
        <ClosureModal
          request={closureRequest}
          currentUser={currentUser}
          onConfirmClosure={handleConfirmClosure}
          onClose={() => setClosureRequest(null)}
        />
      )}

      {/* MODAL 5: CANCELLATION MODAL */}
      {cancelRequest && (
        <CancelModal
          request={cancelRequest}
          currentUser={currentUser}
          onConfirmCancel={handleConfirmCancel}
          onClose={() => setCancelRequest(null)}
        />
      )}

      {/* TABLET / MOBILE QUICK NAVIGATION BOTTOM BAR */}
      <TabletBottomBar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onToggleMenu={() => setIsMobileMenuOpen(true)}
        pendingCount={pendingQueueCount}
        activeRelocationsCount={activeRelocationsCount}
      />

      {/* TABLET / STANDALONE PWA INSTALLATION MODAL */}
      <InstallTabletModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        deferredPrompt={deferredInstallPrompt}
      />

      {/* OFFLINE STATUS INDICATOR FOR TABLET/MOBILE */}
      <OfflineIndicator />
    </div>
  );
}
