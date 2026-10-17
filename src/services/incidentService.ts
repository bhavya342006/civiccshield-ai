import { INITIAL_SEED_INCIDENTS, SUPPORTED_REGIONS } from '../data/seedIncidents';
import {
  Incident,
  IncidentLifecycleStage,
  IncidentPriority,
  SupportedRegion,
  TriageQueueType,
  PotholeDimensionData,
} from '../types/incident';
import { voiceAssistantService } from './voiceAssistantService';

const STORAGE_KEY = 'civicshield_incidents_v3';
const GENUINE_STORAGE_KEY = 'civicshield_genuine_reports_v3';

type Listener = () => void;

class IncidentService {
  private incidents: Incident[] = [];
  private listeners: Set<Listener> = new Set();
  private simTimer: any = null;
  private isSimActive: boolean = false;

  constructor() {
    this.init();
  }

  private init() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.incidents = JSON.parse(stored);
      } else {
        this.incidents = [...INITIAL_SEED_INCIDENTS];
        this.save();
      }
    } catch {
      this.incidents = [...INITIAL_SEED_INCIDENTS];
    }
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.incidents));
      const genuineOnly = this.incidents.filter((inc) => !inc.isDemo);
      localStorage.setItem(GENUINE_STORAGE_KEY, JSON.stringify(genuineOnly));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
    this.notify();
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('Error notifying incident listener:', err);
      }
    });
  }

  public getIncidents(): Incident[] {
    return [...this.incidents];
  }

  public getIncidentById(id: string): Incident | undefined {
    return this.incidents.find((inc) => inc.id === id);
  }

  public createIncident(
    input: Omit<Incident, 'id' | 'timestamp' | 'history'>
  ): Incident {
    const regionCode = (input.location.region || 'HYD').slice(0, 3).toUpperCase();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newId = `CS-${regionCode}-${randomSuffix}`;
    const timestamp = new Date().toISOString();

    const newIncident: Incident = {
      ...input,
      id: newId,
      timestamp,
      history: [
        {
          id: 'evt-' + Math.random().toString(36).substring(2, 9),
          timestamp,
          actor: input.reporter.name || 'Citizen Reporter',
          role: 'CITIZEN',
          action: 'Incident Reported',
          details: `Coordinates: [${input.location.lat.toFixed(5)}, ${input.location.lng.toFixed(5)}] at ${input.location.name}`,
          toStage: input.status,
        },
      ],
    };

    if (input.aiDetection) {
      newIncident.history.push({
        id: 'evt-' + Math.random().toString(36).substring(2, 9),
        timestamp: new Date(Date.now() + 1000).toISOString(),
        actor: input.aiDetection.modelSource || 'CivicShield AI Vision',
        role: 'SYSTEM',
        action: 'Computer Vision Defect Analysis Attached',
        details: `${input.aiDetection.detectedCategory} with ${(input.aiDetection.confidence * 100).toFixed(0)}% visual confidence. Severity score ${input.aiDetection.severityScore}/10.`,
      });
    }

    this.incidents = [newIncident, ...this.incidents];
    this.save();
    voiceAssistantService.speak(`New citizen report ${newId} logged for ${input.category}.`);
    return newIncident;
  }

  public updateIncidentStage(
    id: string,
    toStage: IncidentLifecycleStage,
    actorName: string,
    role: 'AUTHORITY' | 'VOLUNTEER' | 'SYSTEM' = 'AUTHORITY',
    notes?: string
  ): Incident | null {
    const idx = this.incidents.findIndex((inc) => inc.id === id);
    if (idx === -1) return null;

    const incident = { ...this.incidents[idx] };
    const fromStage = incident.status;
    incident.status = toStage;

    incident.history = [
      ...incident.history,
      {
        id: 'evt-' + Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toISOString(),
        actor: actorName,
        role,
        action: `Lifecycle Advanced: ${fromStage.replace('_', ' ').toUpperCase()} → ${toStage.replace('_', ' ').toUpperCase()}`,
        details: notes || 'Status updated via CivicShield Command Centre.',
        fromStage,
        toStage,
      },
    ];

    this.incidents[idx] = incident;
    this.save();
    return incident;
  }

  public updateIncidentStatus(
    id: string,
    status: IncidentLifecycleStage,
    officerName: string,
    notes?: string
  ): Incident | null {
    return this.updateIncidentStage(id, status, officerName, 'AUTHORITY', notes);
  }

  // Triage: override priority with recorded rationale
  public changePriority(
    id: string,
    officerName: string,
    newPriority: IncidentPriority,
    rationale: string
  ): Incident | null {
    const idx = this.incidents.findIndex((inc) => inc.id === id);
    if (idx === -1) return null;

    const inc = { ...this.incidents[idx] };
    const prevPriority = inc.priority;
    inc.priority = newPriority;
    inc.triagePriorityRationale = rationale;

    inc.history.push({
      id: 'evt-' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      actor: officerName,
      role: 'AUTHORITY',
      action: `Priority Overridden: ${prevPriority.toUpperCase()} → ${newPriority.toUpperCase()}`,
      details: `Rationale: ${rationale}`,
    });

    this.incidents[idx] = inc;
    this.save();
    voiceAssistantService.speak(`Incident ${id} priority adjusted to ${newPriority}.`);
    return inc;
  }

  // Triage: Flag duplicate
  public flagDuplicate(id: string, officerName: string, duplicateOfId?: string): Incident | null {
    const idx = this.incidents.findIndex((inc) => inc.id === id);
    if (idx === -1) return null;

    const inc = { ...this.incidents[idx] };
    inc.isDuplicateSuspected = true;
    inc.history.push({
      id: 'evt-' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      actor: officerName,
      role: 'AUTHORITY',
      action: 'Flagged as Suspected Duplicate',
      details: duplicateOfId ? `Suspected duplicate of ${duplicateOfId}` : 'Similar hazard detected within 25m proximity.',
    });

    this.incidents[idx] = inc;
    this.save();
    return inc;
  }

  // Assign volunteer or municipal field worker
  public assignVolunteer(
    incidentId: string,
    volunteer: { id: string; name: string; phone?: string }
  ): { success: boolean; message: string; incident?: Incident } {
    const idx = this.incidents.findIndex((inc) => inc.id === incidentId);
    if (idx === -1) return { success: false, message: 'Incident not found' };

    const inc = this.incidents[idx];

    if (
      inc.assignedVolunteer &&
      inc.assignedVolunteer.status !== 'completed' &&
      inc.assignedVolunteer.id !== volunteer.id
    ) {
      return {
        success: false,
        message: `Task is already claimed by ${inc.assignedVolunteer.name}. Concurrent lock active.`,
        incident: inc,
      };
    }

    const updated: Incident = {
      ...inc,
      status: 'assigned',
      assignedVolunteer: {
        id: volunteer.id,
        name: volunteer.name,
        phone: volunteer.phone,
        assignedAt: new Date().toISOString(),
        status: 'assigned',
      },
      history: [
        ...inc.history,
        {
          id: 'evt-' + Math.random().toString(36).substring(2, 9),
          timestamp: new Date().toISOString(),
          actor: volunteer.name,
          role: 'VOLUNTEER',
          action: 'Task Claimed for Field Inspection',
          details: `Volunteer responder ${volunteer.name} accepted field dispatch.`,
          fromStage: inc.status,
          toStage: 'assigned',
        },
      ],
    };

    this.incidents[idx] = updated;
    this.save();
    voiceAssistantService.speak(`Incident ${incidentId} has been assigned for field inspection.`);
    return { success: true, message: 'Task claimed successfully!', incident: updated };
  }

  public releaseAssignment(incidentId: string, volunteerId: string): boolean {
    const idx = this.incidents.findIndex((inc) => inc.id === incidentId);
    if (idx === -1) return false;

    const inc = this.incidents[idx];
    if (inc.assignedVolunteer?.id !== volunteerId) return false;

    const updated: Incident = {
      ...inc,
      status: 'inspection_required',
      assignedVolunteer: undefined,
      history: [
        ...inc.history,
        {
          id: 'evt-' + Math.random().toString(36).substring(2, 9),
          timestamp: new Date().toISOString(),
          actor: inc.assignedVolunteer.name,
          role: 'VOLUNTEER',
          action: 'Task Released Back to Triage Queue',
          fromStage: 'assigned',
          toStage: 'inspection_required',
        },
      ],
    };

    this.incidents[idx] = updated;
    this.save();
    return true;
  }

  // Submit volunteer inspection findings
  public submitInspection(
    incidentId: string,
    inspection: {
      inspectorId: string;
      inspectorName: string;
      notes: string;
      photoUrl?: string;
      severityConfirmed: IncidentPriority;
      recommendsClosure: boolean;
    }
  ): Incident | null {
    const idx = this.incidents.findIndex((inc) => inc.id === incidentId);
    if (idx === -1) return null;

    const inc = this.incidents[idx];
    const timestamp = new Date().toISOString();

    const updated: Incident = {
      ...inc,
      status: 'inspection_submitted',
      priority: inspection.severityConfirmed,
      assignedVolunteer: inc.assignedVolunteer
        ? { ...inc.assignedVolunteer, status: 'completed' }
        : undefined,
      inspection: {
        inspectorId: inspection.inspectorId,
        inspectorName: inspection.inspectorName,
        inspectionDate: timestamp,
        notes: inspection.notes,
        photoUrl: inspection.photoUrl || inc.photoUrl,
        severityConfirmed: inspection.severityConfirmed,
        recommendsClosure: inspection.recommendsClosure,
      },
      history: [
        ...inc.history,
        {
          id: 'evt-' + Math.random().toString(36).substring(2, 9),
          timestamp,
          actor: inspection.inspectorName,
          role: 'VOLUNTEER',
          action: 'Inspection Evidence Submitted',
          details: `Notes: "${inspection.notes}". Severity verified as ${inspection.severityConfirmed.toUpperCase()}.`,
          fromStage: inc.status,
          toStage: 'inspection_submitted',
        },
      ],
    };

    this.incidents[idx] = updated;
    this.save();
    voiceAssistantService.speak(`Inspection evidence has been submitted for incident ${incidentId}.`);
    return updated;
  }

  // Record or update calibrated/manual pothole dimensions
  public updatePotholeDimensions(
    incidentId: string,
    dimensions: PotholeDimensionData,
    actorName: string = 'Authorised Field Inspector'
  ): Incident | null {
    const idx = this.incidents.findIndex((inc) => inc.id === incidentId);
    if (idx === -1) return null;

    const inc = this.incidents[idx];
    const timestamp = new Date().toISOString();

    const updated: Incident = {
      ...inc,
      potholeDimensions: dimensions,
      history: [
        ...inc.history,
        {
          id: 'evt-' + Math.random().toString(36).substring(2, 9),
          timestamp,
          actor: actorName,
          role: 'AUTHORITY',
          action: 'Pothole Dimension Caliper Data Recorded',
          details: `Classification: ${dimensions.classification}. Depth: ${dimensions.estimatedDepthCm ?? 'N/A'}cm, Diameter: ${dimensions.estimatedDiameterCm ?? 'N/A'}cm. Method: ${dimensions.estimationMethod}. Subgrade Exposed: ${dimensions.isSubgradeExposed ? 'YES' : 'NO'}.`,
        },
      ],
    };

    this.incidents[idx] = updated;
    this.save();
    return updated;
  }

  // Authority official sign-off or reopening
  public authorityReview(
    incidentId: string,
    decision: 'approved' | 'rejected' | 'reopened',
    officerName: string,
    notes: string
  ): Incident | null {
    const idx = this.incidents.findIndex((inc) => inc.id === incidentId);
    if (idx === -1) return null;

    const inc = this.incidents[idx];
    const timestamp = new Date().toISOString();

    let newStatus: IncidentLifecycleStage = 'resolved';
    if (decision === 'rejected') newStatus = 'repair_required';
    if (decision === 'reopened') newStatus = 'reopened';

    const updated: Incident = {
      ...inc,
      status: newStatus,
      authorityReview: {
        officerName,
        reviewedAt: timestamp,
        decision,
        notes,
      },
      history: [
        ...inc.history,
        {
          id: 'evt-' + Math.random().toString(36).substring(2, 9),
          timestamp,
          actor: officerName || 'Supervising Authority Officer',
          role: 'AUTHORITY',
          action:
            decision === 'approved'
              ? 'Resolution Approved by Municipal Authority'
              : decision === 'rejected'
              ? 'Resolution Rejected - Contractor Rectification Ordered'
              : 'Incident Reopened for Verification',
          details: notes,
          fromStage: inc.status,
          toStage: newStatus,
        },
      ],
    };

    this.incidents[idx] = updated;
    this.save();
    if (decision === 'approved') {
      voiceAssistantService.speak(`Resolution approved by the demonstration authority for ${incidentId}.`);
    } else {
      voiceAssistantService.speak(`Incident ${incidentId} has been returned for further work.`);
    }
    return updated;
  }

  // Triage queue categorization
  public getTriageQueueCounts(): Record<TriageQueueType, number> {
    const counts: Record<TriageQueueType, number> = {
      new_reported: 0,
      awaiting_review: 0,
      critical: 0,
      high_priority: 0,
      suspected_duplicates: 0,
      uncertain_ai: 0,
      manual_inspection_required: 0,
      assigned_field: 0,
      inspection_submitted: 0,
      repair_awaiting_approval: 0,
      resolved: 0,
      reopened: 0,
    };

    this.incidents.forEach((inc) => {
      if (inc.status === 'new_report') counts.new_reported++;
      if (inc.status === 'under_review' || inc.status === 'initial_triage') counts.awaiting_review++;
      if (inc.priority === 'critical' && inc.status !== 'resolved') counts.critical++;
      if (inc.priority === 'high' && inc.status !== 'resolved') counts.high_priority++;
      if (inc.isDuplicateSuspected) counts.suspected_duplicates++;
      if (inc.aiDetection?.isUncertain) counts.uncertain_ai++;
      if (inc.status === 'inspection_required') counts.manual_inspection_required++;
      if (inc.status === 'assigned' || inc.status === 'inspection_in_progress') counts.assigned_field++;
      if (inc.status === 'inspection_submitted') counts.inspection_submitted++;
      if (inc.status === 'repair_evidence_submitted' || inc.status === 'awaiting_authority_verification') counts.repair_awaiting_approval++;
      if (inc.status === 'resolved') counts.resolved++;
      if (inc.status === 'reopened') counts.reopened++;
    });

    return counts;
  }

  public getIncidentsByQueue(queue: TriageQueueType): Incident[] {
    switch (queue) {
      case 'new_reported':
        return this.incidents.filter((i) => i.status === 'new_report');
      case 'awaiting_review':
        return this.incidents.filter((i) => i.status === 'under_review' || i.status === 'initial_triage');
      case 'critical':
        return this.incidents.filter((i) => i.priority === 'critical' && i.status !== 'resolved');
      case 'high_priority':
        return this.incidents.filter((i) => i.priority === 'high' && i.status !== 'resolved');
      case 'suspected_duplicates':
        return this.incidents.filter((i) => i.isDuplicateSuspected);
      case 'uncertain_ai':
        return this.incidents.filter((i) => i.aiDetection?.isUncertain);
      case 'manual_inspection_required':
        return this.incidents.filter((i) => i.status === 'inspection_required');
      case 'assigned_field':
        return this.incidents.filter((i) => i.status === 'assigned' || i.status === 'inspection_in_progress');
      case 'inspection_submitted':
        return this.incidents.filter((i) => i.status === 'inspection_submitted');
      case 'repair_awaiting_approval':
        return this.incidents.filter((i) => i.status === 'repair_evidence_submitted' || i.status === 'awaiting_authority_verification');
      case 'resolved':
        return this.incidents.filter((i) => i.status === 'resolved');
      case 'reopened':
        return this.incidents.filter((i) => i.status === 'reopened');
      default:
        return this.incidents;
    }
  }

  public resetDemoData(): void {
    try {
      const genuineRaw = localStorage.getItem(GENUINE_STORAGE_KEY);
      const genuine = genuineRaw ? JSON.parse(genuineRaw) : [];
      this.incidents = [...genuine, ...INITIAL_SEED_INCIDENTS];
      this.save();
    } catch {
      this.incidents = [...INITIAL_SEED_INCIDENTS];
      this.save();
    }
    voiceAssistantService.speak('Demonstration dataset reset to initial state.');
  }

  public loadRegionDemoDataset(region: SupportedRegion): Incident[] {
    const existingInRegion = this.incidents.filter(
      (inc) => inc.location.region.toLowerCase() === region.toLowerCase()
    );
    if (existingInRegion.length > 0) return existingInRegion;

    const regConfig = SUPPORTED_REGIONS[region];
    const [cLat, cLng] = regConfig.center;

    const syntheticNew: Incident[] = [
      {
        id: `DEMO-${region.slice(0, 3).toUpperCase()}-101`,
        title: `Deep Crater Pothole on ${region} Commercial Corridor`,
        category: 'Deep potholes',
        priority: 'critical',
        status: 'inspection_required',
        triagePriorityRationale: `Critical priority: sharp road cavity on active transit road in ${region}.`,
        description: `Synthetic demonstration incident: Severe road cavity on main transit artery in ${region}.`,
        location: {
          name: `${region} Central Boulevard`,
          region,
          lat: Number((cLat + 0.008).toFixed(4)),
          lng: Number((cLng + 0.006).toFixed(4)),
          address: `${region} City Center, ${regConfig.state}`,
        },
        timestamp: new Date().toISOString(),
        isDemo: true,
        dataSource: 'SYNTHETIC_DEMO',
        reporter: { name: 'Demo Regional Scout', isAnonymous: false },
        history: [
          {
            id: 'evt-reg-1',
            timestamp: new Date().toISOString(),
            actor: 'Demo System',
            role: 'SYSTEM',
            action: 'Regional Demo Incident Loaded',
          },
        ],
      },
    ];

    this.incidents = [...this.incidents, ...syntheticNew];
    this.save();
    return syntheticNew;
  }

  // Simulated live activity toggle
  public startSimulatedActivity(intervalMs: number = 7000) {
    if (this.isSimActive) return;
    this.isSimActive = true;

    this.simTimer = setInterval(() => {
      const demoIncidents = this.incidents.filter((i) => i.isDemo);
      if (demoIncidents.length === 0) return;

      const randomTarget = demoIncidents[Math.floor(Math.random() * demoIncidents.length)];
      const targetIdx = this.incidents.findIndex((i) => i.id === randomTarget.id);

      if (targetIdx !== -1) {
        const item = { ...this.incidents[targetIdx] };
        const now = new Date().toISOString();

        if (item.status === 'new_report') {
          item.status = 'under_review';
          item.history.push({
            id: 'evt-sim-' + Math.random().toString(36).substring(2, 7),
            timestamp: now,
            actor: 'Automated Dispatch Triage [SIM]',
            role: 'SYSTEM',
            action: 'Simulated Activity: Triaged to Under Review',
          });
        } else if (item.status === 'under_review' && !item.assignedVolunteer) {
          item.assignedVolunteer = {
            id: 'VOL-HYD-07',
            name: 'Ravi Kumar (Field Volunteer)',
            phone: '+91 91234 56789',
            assignedAt: now,
            status: 'assigned',
          };
          item.status = 'assigned';
          item.history.push({
            id: 'evt-sim-' + Math.random().toString(36).substring(2, 7),
            timestamp: now,
            actor: 'Ravi Kumar [SIM]',
            role: 'VOLUNTEER',
            action: 'Simulated Activity: Field Task Accepted',
          });
        }

        this.incidents[targetIdx] = item;
        this.save();
      }
    }, intervalMs);

    this.notify();
  }

  public stopSimulatedActivity() {
    if (this.simTimer) {
      clearInterval(this.simTimer);
      this.simTimer = null;
    }
    this.isSimActive = false;
    this.notify();
  }

  public getIsSimActive(): boolean {
    return this.isSimActive;
  }
}

export const incidentService = new IncidentService();
