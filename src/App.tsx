import React, { useState, useEffect, useMemo } from 'react';
import {
  DeficitRequest,
  User,
  SystemSettings,
  ManagementFollowUp,
  SystemAlert,
  RelocationStatus,
  RelocationMovement,
  isAlertRelevantToUser,
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
import { ArrivalConfirmationModal } from './components/ArrivalConfirmationModal';
import { FloatingAlertBanner } from './components/FloatingAlertBanner';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import {
  triggerFullAlert,
  playHospitalChime,
  triggerHapticAlert,
  sendNativePushNotification,
} from './services/soundEngine';

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
  const [arrivalModalData, setArrivalModalData] = useState<{
    relocation: RelocationMovement;
    request?: DeficitRequest;
  } | null>(null);

  // Push & sound notification states for duty nurse & hospital personnel
  const [activeFloatingAlert, setActiveFloatingAlert] = useState<SystemAlert | null>(null);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);

  // Responsive mobile drawer state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    if (newUser.role === 'solicitante') {
      const restrictedTabs = [
        'denf_queue',
        'followup',
        'sector_demand',
        'rankings',
        'indicators',
        'reports',
        'settings',
      ];
      if (restrictedTabs.includes(currentTab)) {
        setCurrentTab('dashboard');
      }
    }
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
      const nowTime = new Date().toTimeString().slice(0, 5);
      const newAlert: SystemAlert = {
        id: `alert-${Date.now()}`,
        requestId: newRequest.id,
        protocol: newRequest.protocol,
        title: `NOVO DÉFICIT CRÍTICO: ${newRequest.solicitorSector}`,
        message: `${newRequest.absentQuantity}x ${newRequest.absentCategory} ausente no plantão ${newRequest.affectedShift}. Risco assistencial iminente!`,
        severity: 'critical',
        timestamp: nowTime,
        read: false,
        targetRole: 'denf',
        targetSector: newRequest.solicitorSector,
        type: 'critical_new',
      };
      setAlerts((prev) => [newAlert, ...prev]);

      // Only alert active screen if the current user is the target recipient (DENF or Admin)
      if (isAlertRelevantToUser(newAlert, currentUser)) {
        setActiveFloatingAlert(newAlert);
        triggerFullAlert(
          'urgent',
          `DÉFICIT CRÍTICO: ${newRequest.solicitorSector}`,
          `${newRequest.absentQuantity}x ${newRequest.absentCategory} ausente. Avaliação prioritária necessária.`,
          newRequest.protocol
        );
      }
    }

    // Navigate to requests or DENF queue
    if (currentUser.role === 'denf' || currentUser.role === 'admin' || currentUser.role === 'coordenador') {
      setCurrentTab('denf_queue');
    } else {
      setCurrentTab('requests');
    }
  };

  // Update request when decision is registered by DENF
  const handleSaveDecision = (updatedRequest: DeficitRequest) => {
    setRequests((prev) => prev.map((r) => (r.id === updatedRequest.id ? updatedRequest : r)));
    setDecisionRequest(null);
    if (detailsRequest?.id === updatedRequest.id) {
      setDetailsRequest(updatedRequest);
    }

    // MULTI-MODAL NURSE NOTIFICATION (Audio Chime + Vibration + Floating Push Banner + Native Notification)
    const nowTime = new Date().toTimeString().slice(0, 5);
    const conduct = updatedRequest.denfDecision?.conduct;
    const isAuthorized =
      conduct === 'remanejamento_interno' ||
      conduct === 'redistribuicao_profissionais' ||
      conduct === 'sobreaviso' ||
      conduct === 'convocacao';
    const isDenied = conduct === 'nao_realizado';

    const professionalName =
      updatedRequest.denfDecision?.nominalProfessionalName ||
      updatedRequest.relocations[0]?.professionalName ||
      'Técnico(a) de Enfermagem';
    const originSector =
      updatedRequest.denfDecision?.originSector ||
      updatedRequest.relocations[0]?.originSector ||
      'Setor Doador';

    let alertTitle = '';
    let alertMessage = '';
    let alertSeverity: 'info' | 'warning' | 'critical' = 'info';
    let alertType: 'deliberation' | 'displacement' | 'contingency' = 'deliberation';

    if (isAuthorized) {
      alertTitle = 'DENF AUTORIZOU: Profissional em Deslocamento!';
      alertMessage = `DENF autorizou: ${professionalName} está em deslocamento de ${originSector} para o seu setor (${updatedRequest.solicitorSector}). Previsão de chegada: ~15 min.`;
      alertSeverity = 'info';
      alertType = 'displacement';

      const deliberationAlert: SystemAlert = {
        id: `alert-denf-${Date.now()}`,
        requestId: updatedRequest.id,
        protocol: updatedRequest.protocol,
        title: alertTitle,
        message: alertMessage,
        severity: alertSeverity,
        timestamp: nowTime,
        read: false,
        targetRole: 'solicitante',
        targetSector: updatedRequest.solicitorSector,
        type: alertType,
        professionalName,
        originSector,
        destinationSector: updatedRequest.solicitorSector,
        etaMinutes: 15,
      };

      setAlerts((prev) => [deliberationAlert, ...prev]);

      // Only trigger audible/pop-up alert if active user is the nurse waiting in that sector
      if (isAlertRelevantToUser(deliberationAlert, currentUser)) {
        setActiveFloatingAlert(deliberationAlert);
        triggerFullAlert(
          'dispatch',
          'DENF AUTORIZOU REMANEJAMENTO!',
          alertMessage,
          updatedRequest.protocol
        );
      }
    } else if (isDenied) {
      alertTitle = 'DELIBERAÇÃO DENF: Remanejamento Não Autorizado';
      alertMessage = `DENF analisou o protocolo ${updatedRequest.protocol}: Não foi possível disponibilizar remanejamento por escassez hospitalar geral. Justificativa: ${updatedRequest.denfDecision?.denialJustification || 'Acionar plano de contingência e redistribuição interna de cuidados.'}`;
      alertSeverity = 'warning';
      alertType = 'contingency';

      const deliberationAlert: SystemAlert = {
        id: `alert-denf-${Date.now()}`,
        requestId: updatedRequest.id,
        protocol: updatedRequest.protocol,
        title: alertTitle,
        message: alertMessage,
        severity: alertSeverity,
        timestamp: nowTime,
        read: false,
        targetRole: 'solicitante',
        targetSector: updatedRequest.solicitorSector,
        type: alertType,
        destinationSector: updatedRequest.solicitorSector,
      };

      setAlerts((prev) => [deliberationAlert, ...prev]);

      // Only trigger audible/pop-up alert if active user is the nurse waiting in that sector
      if (isAlertRelevantToUser(deliberationAlert, currentUser)) {
        setActiveFloatingAlert(deliberationAlert);
        triggerFullAlert(
          'warning',
          'DELIBERAÇÃO DENF: Não Autorizado',
          alertMessage,
          updatedRequest.protocol
        );
      }
    } else {
      alertTitle = 'DELIBERAÇÃO DENF: Parecer Técnico Registrado';
      alertMessage = `A DENF deliberou a conduta no protocolo ${updatedRequest.protocol}: ${updatedRequest.denfDecision?.decisionNotes || 'Acompanhar orientações do protocolo assistencial.'}`;
      alertSeverity = 'info';
      alertType = 'deliberation';

      const deliberationAlert: SystemAlert = {
        id: `alert-denf-${Date.now()}`,
        requestId: updatedRequest.id,
        protocol: updatedRequest.protocol,
        title: alertTitle,
        message: alertMessage,
        severity: alertSeverity,
        timestamp: nowTime,
        read: false,
        targetRole: 'solicitante',
        targetSector: updatedRequest.solicitorSector,
        type: alertType,
        destinationSector: updatedRequest.solicitorSector,
      };

      setAlerts((prev) => [deliberationAlert, ...prev]);

      if (isAlertRelevantToUser(deliberationAlert, currentUser)) {
        setActiveFloatingAlert(deliberationAlert);
        triggerFullAlert(
          'info',
          'PARECER DENF REGISTRADO',
          alertMessage,
          updatedRequest.protocol
        );
      }
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

  // Open Closure / Fechamento modal - exclusive to Enfermeiro de Plantão (solicitante)
  const handleOpenClosure = (req: DeficitRequest) => {
    if (currentUser.role !== 'solicitante') {
      return;
    }
    setDetailsRequest(null);
    setClosureRequest(req);
  };

  // Open Arrival Confirmation Modal
  const handleOpenArrivalModal = (relocation: RelocationMovement, request?: DeficitRequest) => {
    const matchedReq =
      request || requests.find((r) => r.relocations.some((rel) => rel.id === relocation.id));
    setArrivalModalData({ relocation, request: matchedReq });
  };

  // Update relocation movement status in real-time
  const handleUpdateRelocationStatus = (
    relocationId: string,
    newStatus: RelocationStatus,
    notes?: string
  ) => {
    const nowTime = new Date().toTimeString().slice(0, 5);
    const isArrival = newStatus === 'em_cobertura';

    setRequests((prev) =>
      prev.map((req) => {
        const found = req.relocations.some((rel) => rel.id === relocationId);
        if (!found) return req;

        const updatedRelocations = req.relocations.map((rel) => {
          if (rel.id !== relocationId) return rel;
          return {
            ...rel,
            status: newStatus,
            startTime: rel.startTime || nowTime,
            ...(isArrival && {
              confirmedArrivalBy: currentUser.name,
              confirmedArrivalRole: `${currentUser.roleTitle} (${currentUser.sector})`,
              confirmedArrivalAt: nowTime,
            }),
            notes: notes || rel.notes,
          };
        });

        // Add timeline event
        const statusLabels: Record<RelocationStatus, string> = {
          aguardando_inicio: 'Aguardando Início',
          em_deslocamento: 'Em Deslocamento',
          em_cobertura: 'Em Cobertura Assistencial',
          finalizado: 'Remanejamento Finalizado',
          cancelado: 'Remanejamento Cancelado',
        };

        const timelineTitle = isArrival
          ? 'Chegada Confirmada no Setor: Início de Cobertura'
          : `Status do Remanejamento: ${statusLabels[newStatus]}`;

        const timelineDesc = isArrival
          ? `Apresentação e chegada confirmadas no posto por ${currentUser.name} (${currentUser.roleTitle} - ${currentUser.sector}). O profissional iniciou a assistência imediata.${notes ? ` Obs: ${notes}` : ''}`
          : `Atualizado por ${currentUser.name} (${currentUser.roleTitle}).${notes ? ` Notas: ${notes}` : ''}`;

        return {
          ...req,
          relocations: updatedRelocations,
          timeline: [
            ...req.timeline,
            {
              id: `tl-rel-stat-${Date.now()}`,
              timestamp: nowTime,
              title: timelineTitle,
              description: timelineDesc,
              user: currentUser.name,
              userRole: currentUser.roleTitle,
              type: 'relocation',
            },
          ],
        };
      })
    );

    // Audio & Visual notification on displacement / arrival
    const targetReq = requests.find((r) => r.relocations.some((rel) => rel.id === relocationId));
    const targetRel = targetReq?.relocations.find((rel) => rel.id === relocationId);
    const profName = targetRel?.professionalName || 'Profissional Remanejado';
    const destSector = targetRel?.destinationSector || targetReq?.solicitorSector || 'Posto de Enfermagem';

    if (newStatus === 'em_deslocamento') {
      const dispAlert: SystemAlert = {
        id: `alert-disp-${Date.now()}`,
        requestId: targetReq?.id || 'req-disp',
        protocol: targetReq?.protocol || 'REMANEJAMENTO',
        title: 'EM DESLOCAMENTO: Profissional a Caminho',
        message: `${profName} saiu de ${targetRel?.originSector || 'Origem'} e está a caminho do seu posto (${destSector}). Previsão: ~10-15 min.`,
        severity: 'info',
        timestamp: nowTime,
        read: false,
        targetRole: 'solicitante',
        targetSector: destSector,
        type: 'displacement',
        professionalName: profName,
        originSector: targetRel?.originSector,
        destinationSector: destSector,
        etaMinutes: 12,
      };
      setAlerts((prev) => [dispAlert, ...prev]);
      if (isAlertRelevantToUser(dispAlert, currentUser)) {
        setActiveFloatingAlert(dispAlert);
        triggerFullAlert('dispatch', 'PROFISSIONAL A CAMINHO!', dispAlert.message, targetReq?.protocol);
      }
    } else if (isArrival) {
      const arrAlert: SystemAlert = {
        id: `alert-arr-${Date.now()}`,
        requestId: targetReq?.id || 'req-arr',
        protocol: targetReq?.protocol || 'REMANEJAMENTO',
        title: 'CHEGADA CONFIRMADA NO POSTO!',
        message: `${profName} apresentou-se no posto (${destSector}) e iniciou cobertura assistencial ativa.`,
        severity: 'info',
        timestamp: nowTime,
        read: false,
        targetRole: 'all',
        targetSector: destSector,
        type: 'arrival',
        professionalName: profName,
        destinationSector: destSector,
      };
      setAlerts((prev) => [arrAlert, ...prev]);
      if (isAlertRelevantToUser(arrAlert, currentUser)) {
        setActiveFloatingAlert(arrAlert);
        triggerFullAlert('success', 'CHEGADA CONFIRMADA!', arrAlert.message, targetReq?.protocol);
      }
    }

    setDetailsRequest((prev) => {
      if (!prev) return null;
      const found = prev.relocations.some((rel) => rel.id === relocationId);
      if (!found) return prev;
      return {
        ...prev,
        relocations: prev.relocations.map((rel) =>
          rel.id === relocationId
            ? {
                ...rel,
                status: newStatus,
                startTime: rel.startTime || nowTime,
                ...(isArrival && {
                  confirmedArrivalBy: currentUser.name,
                  confirmedArrivalRole: `${currentUser.roleTitle} (${currentUser.sector})`,
                  confirmedArrivalAt: nowTime,
                }),
                notes: notes || rel.notes,
              }
            : rel
        ),
      };
    });
  };

  // Alert management handlers
  const handleMarkAlertAsRead = (alertId: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, read: true } : a)));
  };

  const handleMarkAllAlertsAsRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  };

  const handleClearReadAlerts = () => {
    setAlerts((prev) => prev.filter((a) => !a.read));
  };

  // Instant simulation of DENF deliberation for testing audio, vibration and push banner
  const handleTriggerSimulatedAlert = () => {
    const nowTime = new Date().toTimeString().slice(0, 5);
    const targetSector = currentUser.role === 'solicitante' ? currentUser.sector : 'UTI Adulto';
    const firstReq = requests[0] || { id: 'req-125', protocol: 'DEF-2026-000125' };

    const simulatedAlert: SystemAlert = {
      id: `alert-sim-${Date.now()}`,
      requestId: firstReq.id,
      protocol: firstReq.protocol,
      title: 'DENF AUTORIZOU: Profissional em Deslocamento!',
      message: `A Diretoria de Enfermagem autorizou: Tec. Ana Paula Lima está em deslocamento da Clínica Médica (3º Andar) para o seu setor (${targetSector}). Previsão de chegada: ~15 min.`,
      severity: 'info',
      timestamp: nowTime,
      read: false,
      targetRole: 'solicitante',
      targetSector: targetSector,
      type: 'displacement',
      professionalName: 'Tec. Ana Paula Lima (COREN-SP 489.120)',
      originSector: 'Clínica Médica (3º Andar)',
      destinationSector: targetSector,
      etaMinutes: 15,
    };

    setAlerts((prev) => [simulatedAlert, ...prev]);
    setActiveFloatingAlert(simulatedAlert);
    triggerFullAlert(
      'dispatch',
      'DENF AUTORIZOU REMANEJAMENTO!',
      `Tec. Ana Paula Lima está a caminho de ${targetSector}. Previsão: 15 min.`,
      firstReq.protocol
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
  const canAccessDENF =
    currentUser.role === 'denf' || currentUser.role === 'admin' || currentUser.role === 'coordenador';

  return (
    <div className="min-h-screen bg-[#F9F7F2] flex flex-col font-sans text-[#2D2D2A] antialiased selection:bg-[#8C9C82] selection:text-white">
      {/* Top Navigation Bar */}
      <Navbar
        currentUser={currentUser}
        allUsers={allUsersList}
        onSwitchUser={handleSwitchUser}
        onSelectUser={handleSwitchUser}
        alerts={alerts}
        onOpenAlerts={() => setIsNotificationCenterOpen(true)}
        onNavigateToRequest={handleNavigateToRequest}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      {/* Main Layout Container */}
      <div className="flex-1 flex w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 gap-6 pb-8">
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
              onOpenClosure={handleOpenClosure}
              onOpenArrivalModal={handleOpenArrivalModal}
              onOpenNotifications={() => setIsNotificationCenterOpen(true)}
              onTriggerSimulatedAlert={handleTriggerSimulatedAlert}
              unreadAlertsCount={alerts.filter((a) => !a.read).length}
            />
          )}

          {/* TAB 2: NOVO DÉFICIT (8-STEP WIZARD) */}
          {currentTab === 'new_request' && (
            <NewRequestWizard
              currentUser={currentUser}
              settings={settings}
              existingRequests={requests}
              onCreateRequest={handleCreateRequest}
              onNavigateToRequest={handleNavigateToRequest}
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
              onOpenArrivalModal={handleOpenArrivalModal}
              onOpenClosure={handleOpenClosure}
            />
          )}

          {/* TAB 4: FILA DENF DE TRIAGEM */}
          {currentTab === 'denf_queue' && canAccessDENF && (
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
              requests={requests}
              currentUser={currentUser}
              onUpdateStatus={handleUpdateRelocationStatus}
              onNavigateToRequest={handleNavigateToRequest}
              onOpenArrivalModal={handleOpenArrivalModal}
              onOpenClosure={handleOpenClosure}
            />
          )}

          {/* TAB 6: ACOMPANHAMENTO GERENCIAL */}
          {currentTab === 'followup' && canAccessDENF && (
            <ManagementFollowUpView
              followUps={followUps}
              currentUser={currentUser}
              onUpdateFollowUp={handleUpdateFollowUp}
              onNavigateToRequest={handleNavigateToRequest}
            />
          )}

          {/* TAB 7: MAPA DE DEMANDA (ORIGEM -> DESTINO) */}
          {currentTab === 'sector_demand' && canAccessDENF && <SectorDemandMapView requests={requests} />}

          {/* TAB 8: RANKINGS GERENCIAIS */}
          {currentTab === 'rankings' && canAccessDENF && <RankingsView requests={requests} />}

          {/* TAB 9: INDICADORES ESTATÍSTICOS & EFICIÊNCIA */}
          {currentTab === 'indicators' && canAccessDENF && <IndicatorsView requests={requests} />}

          {/* TAB 10: RELATÓRIOS & EXPORTAÇÃO */}
          {currentTab === 'reports' && canAccessDENF && <ReportsView requests={requests} />}

          {/* TAB 11: CONFIGURAÇÕES & PARAMETRIZAÇÃO */}
          {currentTab === 'settings' && (
            <SettingsView
              settings={settings}
              currentUser={currentUser}
              onSaveSettings={setSettings}
              onResetDemoData={handleResetDemoData}
              onSwitchUser={handleSwitchUser}
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
          onOpenClosure={handleOpenClosure}
          onOpenCancel={(req) => {
            setDetailsRequest(null);
            setCancelRequest(req);
          }}
          onUpdateRelocationStatus={handleUpdateRelocationStatus}
          onOpenArrivalModal={handleOpenArrivalModal}
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

      {/* MODAL 6: ARRIVAL CONFIRMATION MODAL */}
      {arrivalModalData && (
        <ArrivalConfirmationModal
          relocation={arrivalModalData.relocation}
          request={arrivalModalData.request}
          currentUser={currentUser}
          onConfirmArrival={(relId, _time, notes) => {
            handleUpdateRelocationStatus(relId, 'em_cobertura', notes);
            setArrivalModalData(null);
          }}
          onClose={() => setArrivalModalData(null)}
        />
      )}

      {/* REAL-TIME FLOATING ALERT BANNER (TOP-RIGHT PUSH TOAST) */}
      <FloatingAlertBanner
        alert={activeFloatingAlert}
        onDismiss={() => setActiveFloatingAlert(null)}
        onOpenRequestDetails={(reqId) => {
          setActiveFloatingAlert(null);
          handleNavigateToRequest(reqId);
        }}
        onOpenArrivalModal={(req) => {
          setActiveFloatingAlert(null);
          const inTransit = req.relocations.find((r) => r.status === 'em_deslocamento') || req.relocations[0];
          if (inTransit) {
            handleOpenArrivalModal(inTransit, req);
          }
        }}
        relatedRequest={
          activeFloatingAlert?.requestId
            ? requests.find((r) => r.id === activeFloatingAlert.requestId)
            : undefined
        }
      />

      {/* CENTRAL DE NOTIFICAÇÕES & CONFIGURAÇÕES DE ALERTAS MODAL */}
      <NotificationCenterModal
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        alerts={alerts}
        currentUser={currentUser}
        onMarkAsRead={handleMarkAlertAsRead}
        onMarkAllAsRead={handleMarkAllAlertsAsRead}
        onClearReadAlerts={handleClearReadAlerts}
        onNavigateToRequest={(reqId) => {
          setIsNotificationCenterOpen(false);
          handleNavigateToRequest(reqId);
        }}
        onTriggerSimulatedAlert={handleTriggerSimulatedAlert}
      />
    </div>
  );
}
