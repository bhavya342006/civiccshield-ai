import { RoadCorridor } from '../types/incident';

export const ROAD_CORRIDORS: RoadCorridor[] = [
  {
    id: 'corridor-hitec-cyber',
    name: 'Corridor Alpha: Hitec City Main Road & Madhapur Arterial',
    region: 'Hyderabad',
    description: 'Cyber Towers Junction to Inorbit Mall via Madhapur Flyover. High transit volume corridor with multiple monitored surface defects.',
    startCoords: [17.4520, 78.3800],
    endCoords: [17.4335, 78.3860],
    segments: [
      {
        id: 'seg-alpha-1',
        name: 'Cyber Towers Interchange Ramp',
        coordinates: [
          [17.4520, 78.3800],
          [17.4504, 78.3809],
          [17.4485, 78.3820],
        ],
        status: 'critical',
        riskScore: 92,
        hazardIncidentIds: ['DEMO-001', 'DEMO-004'],
      },
      {
        id: 'seg-alpha-2',
        name: 'Hitec City Metro Corridor',
        coordinates: [
          [17.4485, 78.3820],
          [17.4450, 78.3835],
          [17.4410, 78.3848],
        ],
        status: 'elevated_risk',
        riskScore: 74,
        hazardIncidentIds: ['DEMO-005', 'DEMO-012'],
      },
      {
        id: 'seg-alpha-3',
        name: 'Inorbit Mall Downhill Approach',
        coordinates: [
          [17.4410, 78.3848],
          [17.4370, 78.3855],
          [17.4335, 78.3860],
        ],
        status: 'scanning',
        riskScore: 50,
        hazardIncidentIds: ['DEMO-015'],
      },
    ],
  },
  {
    id: 'corridor-gachibowli-orr',
    name: 'Corridor Beta: Gachibowli Junction to Financial District',
    region: 'Hyderabad',
    description: 'Outer Ring Road feeder transit artery connecting Gachibowli bus terminal to Wipro Circle.',
    startCoords: [17.4420, 78.3520],
    endCoords: [17.4180, 78.3410],
    segments: [
      {
        id: 'seg-beta-1',
        name: 'Gachibowli Stadium Crossing',
        coordinates: [
          [17.4420, 78.3520],
          [17.4380, 78.3490],
          [17.4330, 78.3460],
        ],
        status: 'critical',
        riskScore: 88,
        hazardIncidentIds: ['DEMO-002', 'DEMO-008'],
      },
      {
        id: 'seg-beta-2',
        name: 'ISB Road Connector',
        coordinates: [
          [17.4330, 78.3460],
          [17.4260, 78.3435],
          [17.4180, 78.3410],
        ],
        status: 'monitored',
        riskScore: 40,
        hazardIncidentIds: ['DEMO-018'],
      },
    ],
  },
  {
    id: 'corridor-jubilee-hills',
    name: 'Corridor Gamma: Jubilee Hills Road No. 36 & 45',
    region: 'Hyderabad',
    description: 'Prime commercial boulevard connecting Peddamma Temple Metro Station to Durgam Cheruvu Cable Bridge.',
    startCoords: [17.4350, 78.4120],
    endCoords: [17.4300, 78.3900],
    segments: [
      {
        id: 'seg-gamma-1',
        name: 'Peddamma Gudi Metro Reach',
        coordinates: [
          [17.4350, 78.4120],
          [17.4326, 78.4071],
          [17.4310, 78.4000],
        ],
        status: 'critical',
        riskScore: 89,
        hazardIncidentIds: ['DEMO-003', 'DEMO-009'],
      },
      {
        id: 'seg-gamma-2',
        name: 'Cable Bridge West Incline',
        coordinates: [
          [17.4310, 78.4000],
          [17.4305, 78.3950],
          [17.4300, 78.3900],
        ],
        status: 'verified_safe',
        riskScore: 18,
        hazardIncidentIds: ['DEMO-025'],
      },
    ],
  },
];
