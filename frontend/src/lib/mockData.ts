// ── In-browser mock data — makes the app work without a backend ──

const MONTHS = [
  'Apr 23','May 23','Jun 23','Jul 23','Aug 23','Sep 23','Oct 23','Nov 23','Dec 23','Jan 24','Feb 24','Mar 24',
  'Apr 24','May 24','Jun 24','Jul 24','Aug 24','Sep 24','Oct 24','Nov 24','Dec 24','Jan 25','Feb 25','Mar 25',
  'Apr 25','May 25','Jun 25','Jul 25','Aug 25','Sep 25','Oct 25','Nov 25','Dec 25','Jan 26','Feb 26','Mar 26',
];

const USERS = [
  { id:'1', email:'admin@kairoz.com',       password:'Admin@123',  name:'Arjun Sharma',  role:'admin'       },
  { id:'2', email:'qa.director@kairoz.com', password:'QA@123456',  name:'Priya Nair',    role:'qa_director' },
  { id:'3', email:'lab.head@kairoz.com',    password:'Lab@12345',  name:'Rohit Verma',   role:'lab_head'    },
  { id:'4', email:'analyst@kairoz.com',     password:'QC@123456',  name:'Sneha Patel',   role:'qc_analyst'  },
  { id:'5', email:'partner@kairoz.com',     password:'Part@1234',  name:'External User', role:'partner'     },
];

const LABS = [
  { id:'1',  labCode:'LAB-001', name:'Mumbai QC Central',       type:'internal', status:'active',   city:'Mumbai',     state:'Maharashtra', country:'India', rating:4.6, riskScore:18, capacity:5000, capabilities:['HPLC','GC','Microbiology'],          certCount:5, auditScore:91, _count:{capass:38,audits:18} },
  { id:'2',  labCode:'LAB-002', name:'Pune R&D Lab',            type:'internal', status:'active',   city:'Pune',       state:'Maharashtra', country:'India', rating:4.4, riskScore:24, capacity:3500, capabilities:['Spectroscopy','Dissolution'],         certCount:4, auditScore:87, _count:{capass:27,audits:15} },
  { id:'3',  labCode:'LAB-003', name:'Hyderabad API Lab',       type:'internal', status:'active',   city:'Hyderabad',  state:'Telangana',   country:'India', rating:4.8, riskScore:12, capacity:8000, capabilities:['HPLC','Stability Testing'],          certCount:6, auditScore:94, _count:{capass:18,audits:21} },
  { id:'4',  labCode:'LAB-004', name:'Chennai Biolab',          type:'internal', status:'active',   city:'Chennai',    state:'Tamil Nadu',  country:'India', rating:4.3, riskScore:31, capacity:2800, capabilities:['Bioassay','Toxicology'],              certCount:3, auditScore:83, _count:{capass:42,audits:12} },
  { id:'5',  labCode:'LAB-005', name:'Ahmedabad Formulations',  type:'external', status:'active',   city:'Ahmedabad',  state:'Gujarat',     country:'India', rating:4.0, riskScore:42, capacity:2000, capabilities:['Dissolution','Microbiology'],         certCount:3, auditScore:79, _count:{capass:54,audits:9 } },
  { id:'6',  labCode:'LAB-006', name:'Bengaluru Biotech Lab',   type:'external', status:'active',   city:'Bengaluru',  state:'Karnataka',   country:'India', rating:4.5, riskScore:22, capacity:4500, capabilities:['GC','Spectroscopy'],                 certCount:4, auditScore:88, _count:{capass:29,audits:15} },
  { id:'7',  labCode:'LAB-007', name:'Delhi NCR Contract Lab',  type:'external', status:'active',   city:'Delhi',      state:'Delhi',       country:'India', rating:3.8, riskScore:55, capacity:1500, capabilities:['HPLC','pH Testing'],                 certCount:2, auditScore:75, _count:{capass:63,audits:9 } },
  { id:'8',  labCode:'LAB-008', name:'Kolkata Testing Hub',     type:'external', status:'inactive', city:'Kolkata',    state:'West Bengal', country:'India', rating:3.6, riskScore:68, capacity:1000, capabilities:['Microbiology'],                      certCount:1, auditScore:71, _count:{capass:78,audits:6 } },
  { id:'9',  labCode:'LAB-009', name:'Nagpur Stability Centre', type:'internal', status:'active',   city:'Nagpur',     state:'Maharashtra', country:'India', rating:4.2, riskScore:28, capacity:3000, capabilities:['Stability Testing','HPLC'],          certCount:3, auditScore:85, _count:{capass:22,audits:12} },
  { id:'10', labCode:'LAB-010', name:'Vadodara Analytical Lab', type:'external', status:'active',   city:'Vadodara',   state:'Gujarat',     country:'India', rating:4.1, riskScore:35, capacity:2500, capabilities:['GC','Balance','Dissolution'],         certCount:3, auditScore:82, _count:{capass:31,audits:9 } },
  { id:'11', labCode:'LAB-011', name:'Coimbatore QC Facility',  type:'internal', status:'active',   city:'Coimbatore', state:'Tamil Nadu',  country:'India', rating:4.4, riskScore:20, capacity:3200, capabilities:['HPLC','Microbiology','pH Testing'],  certCount:4, auditScore:89, _count:{capass:19,audits:12} },
  { id:'12', labCode:'LAB-012', name:'Chandigarh Research Lab', type:'external', status:'active',   city:'Chandigarh', state:'Punjab',      country:'India', rating:3.9, riskScore:48, capacity:1800, capabilities:['Spectroscopy','Bioassay'],            certCount:2, auditScore:77, _count:{capass:45,audits:6 } },
];

// Seeded RNG
let _seed = 42;
function rng() { _seed = (_seed * 1664525 + 1013904223) & 0xffffffff; return Math.abs(_seed) / 0x80000000; }
function ri(min: number, max: number) { return min + Math.floor(rng() * (max - min + 1)); }
function pick<T>(arr: T[]): T { return arr[Math.floor(rng() * arr.length)]; }

// ── Generate data ──
const CAPA_TITLES = [
  'pH meter calibration drift','HPLC column performance degradation','Microbial count out-of-spec',
  'Temperature excursion in storage','Label verification failure','Dissolution apparatus malfunction',
  'Balance calibration overdue','Spectrophotometer wavelength drift','OOS result in assay determination',
  'Cleaning validation failure','Raw material moisture content deviation','Batch yield below threshold',
  'Documentation error in batch record','Equipment qualification gap','Supplier quality complaint',
  'Stability sample storage breach','GC detector response deviation','Water system contamination',
  'Autoclave sterilisation failure','Environmental monitoring exceedance',
];
const ROOT_CAUSES = [
  'Equipment calibration drift observed during routine check.',
  'Operator training gap identified during investigation.',
  'Preventive maintenance schedule not followed.',
  'Raw material specification deviation from supplier.',
  'Environmental conditions exceeded defined limits.',
  'SOP not updated to reflect current procedure.',
];

function makeCAPAs() {
  const items: any[] = [];
  let idx = 1;
  const start = new Date('2023-01-01');
  for (let m = 0; m < 39; m++) {
    const count = ri(6, 14);
    for (let i = 0; i < count; i++) {
      const d = new Date(start);
      d.setMonth(d.getMonth() + m);
      d.setDate(ri(1, 28));
      const sev = pick(['critical','major','minor','observation']);
      const past = d < new Date();
      const st = past ? pick(['closed','closed','closed','overdue']) : pick(['open','in_progress']);
      const due = new Date(d); due.setDate(due.getDate() + ri(20, 45));
      items.push({
        id: String(idx), capaCode: `CAPA-${String(idx).padStart(4,'0')}`,
        title: pick(CAPA_TITLES), severity: sev, status: st,
        lab: LABS[ri(0, LABS.length - 1)],
        rootCause: pick(ROOT_CAUSES),
        createdAt: d.toISOString(), dueDate: due.toISOString(),
        assignee: pick(USERS.slice(0,4)).name,
        closedAt: st === 'closed' ? new Date(due.getTime() - 86400000 * ri(2,8)).toISOString() : null,
      });
      idx++;
    }
  }
  return items;
}
const CAPAS = makeCAPAs();

const EQ_TYPES = ['HPLC','GC','Spectrophotometer','Balance','Autoclave','Centrifuge','pH Meter','Viscometer','Dissolution Apparatus','Karl Fischer Titrator'];
const EQ_MAKERS = ['Waters','Agilent','Shimadzu','Mettler Toledo','Sartorius','Thermo Fisher','PerkinElmer','Anton Paar'];

function makeEquipment() {
  const items: any[] = []; let idx = 1;
  for (const lab of LABS) {
    const count = ri(3, 6);
    for (let i = 0; i < count; i++) {
      const t = pick(EQ_TYPES);
      const maker = pick(EQ_MAKERS);
      const cal = new Date(); cal.setDate(cal.getDate() + ri(-30, 200));
      const maint = new Date(cal.getTime() + 86400000 * ri(30,90));
      items.push({
        id: String(idx), equipmentCode: `EQ-${String(idx).padStart(3,'0')}`,
        name: `${maker} ${t}`, type: t, lab,
        status: pick(['operational','operational','operational','operational','maintenance','calibration_due']),
        calibrationDue: cal.toISOString(), maintenanceDue: maint.toISOString(),
        utilizationRate: ri(45, 94), manufacturer: maker,
        model: `${maker.substring(0,3).toUpperCase()}-${ri(1000,9999)}`,
        serialNo: `SN${ri(100000,999999)}`,
        installDate: new Date(2020 + ri(0,2), ri(0,11), ri(1,28)).toISOString(),
      });
      idx++;
    }
  }
  return items;
}
const EQUIPMENT = makeEquipment();

function makeCerts() {
  const CERT_NAMES = ['ISO 9001:2015','ISO 17025:2017','WHO-GMP','US FDA Registration','NABL Accreditation','Schedule M','EU GMP Certification','CDSCO License','ICH Q10','21 CFR Part 211'];
  const CERT_ISSUERS = ['Bureau Veritas','TÜV SÜD','SGS','NABL','WHO','US FDA','EMA','CDSCO','DNV'];
  const items: any[] = []; let idx = 1;
  for (const lab of LABS) {
    const count = ri(2, 5);
    for (let i = 0; i < count; i++) {
      const issueOffset = ri(365, 365*3);
      const validity = ri(365, 365*3);
      const issue = new Date(Date.now() - 86400000 * issueOffset);
      const exp = new Date(issue.getTime() + 86400000 * validity);
      const daysLeft = Math.floor((exp.getTime() - Date.now()) / 86400000);
      items.push({
        id: String(idx), certCode: `CERT-${String(idx).padStart(3,'0')}`,
        name: pick(CERT_NAMES), body: pick(CERT_ISSUERS),
        type: ['ISO','GMP','NABL','WHO','FDA'][ri(0,4)],
        lab, status: daysLeft < 0 ? 'expired' : daysLeft < 90 ? 'renewal_due' : 'valid',
        issueDate: issue.toISOString(), expiryDate: exp.toISOString(), daysLeft,
        nextAuditDate: new Date(exp.getTime() - 86400000 * 90).toISOString(),
        scope: 'Quality management systems for pharmaceutical manufacturing and testing.',
      });
      idx++;
    }
  }
  return items;
}
const CERTS = makeCerts();

const PARTNERS = [
  { id:'1',  partnerCode:'PTR-001', name:'BioLab Services Pvt Ltd',     type:'contract_lab',       country:'India', city:'Pune',      status:'active',       overallScore:88.5, qualityScore:90, deliveryScore:87, costScore:85, complianceScore:92, capabilities:['HPLC','GC','Microbiology','Dissolution'], lab:LABS[1] },
  { id:'2',  partnerCode:'PTR-002', name:'PharmaChem Suppliers',         type:'raw_material',       country:'India', city:'Mumbai',    status:'active',       overallScore:79.2, qualityScore:82, deliveryScore:76, costScore:80, complianceScore:79, capabilities:['API','Excipients'], lab:null },
  { id:'3',  partnerCode:'PTR-003', name:'Precision Instruments Ltd',    type:'equipment_supplier', country:'India', city:'Delhi',     status:'active',       overallScore:84.0, qualityScore:86, deliveryScore:83, costScore:81, complianceScore:86, capabilities:['HPLC','Spectroscopy'], lab:null },
  { id:'4',  partnerCode:'PTR-004', name:'MedLogix Transport Co',        type:'logistics',          country:'India', city:'Chennai',   status:'under_review', overallScore:71.5, qualityScore:74, deliveryScore:70, costScore:68, complianceScore:74, capabilities:['Cold Chain','Express'], lab:null },
  { id:'5',  partnerCode:'PTR-005', name:'Apex CRO India',               type:'contract_lab',       country:'India', city:'Bengaluru', status:'active',       overallScore:91.0, qualityScore:93, deliveryScore:90, costScore:88, complianceScore:93, capabilities:['Bioassay','Toxicology','Stability Testing'], lab:LABS[5] },
  { id:'6',  partnerCode:'PTR-006', name:'National Reference Labs',      type:'contract_lab',       country:'India', city:'Hyderabad', status:'active',       overallScore:85.3, qualityScore:87, deliveryScore:84, costScore:83, complianceScore:87, capabilities:['HPLC','GC','Karl Fischer'], lab:LABS[2] },
  { id:'7',  partnerCode:'PTR-007', name:'ColdChain Pharma Logistics',   type:'logistics',          country:'India', city:'Mumbai',    status:'active',       overallScore:77.8, qualityScore:79, deliveryScore:78, costScore:76, complianceScore:78, capabilities:['Cold Chain','GDP Compliance'], lab:null },
  { id:'8',  partnerCode:'PTR-008', name:'Labware Solutions Pvt Ltd',    type:'equipment_supplier', country:'India', city:'Ahmedabad', status:'inactive',     overallScore:65.0, qualityScore:68, deliveryScore:63, costScore:62, complianceScore:67, capabilities:['Balance','Centrifuge'], lab:null },
  { id:'9',  partnerCode:'PTR-009', name:'GreenPharm Raw Materials',     type:'raw_material',       country:'India', city:'Vadodara',  status:'active',       overallScore:82.4, qualityScore:84, deliveryScore:81, costScore:80, complianceScore:85, capabilities:['Excipients','Solvents','Reference Standards'], lab:null },
  { id:'10', partnerCode:'PTR-010', name:'SciTech Calibration Services', type:'equipment_supplier', country:'India', city:'Pune',      status:'active',       overallScore:89.0, qualityScore:91, deliveryScore:88, costScore:86, complianceScore:91, capabilities:['Calibration','Validation','Qualification'], lab:null },
];

const AUDITORS = ['Dr. A. Mehta','Ms. R. Kapoor','Mr. P. Singh','Dr. S. Rao','Ms. T. Joshi','Mr. K. Nambiar','Dr. V. Pillai'];
function makeAudits() {
  const items: any[] = []; let idx = 1;
  const start = new Date('2023-01-15');
  for (let m = 0; m < 39; m++) {
    const count = ri(1, 3);
    for (let k = 0; k < count; k++) {
      const d = new Date(start); d.setMonth(d.getMonth() + m); d.setDate(ri(1, 25));
      const past = d < new Date();
      items.push({
        id: String(idx), auditCode: `AUD-${String(idx).padStart(3,'0')}`,
        lab: LABS[idx % LABS.length], type: ['internal','external','regulatory'][idx % 3],
        status: past ? (ri(0,9) < 8 ? 'completed' : 'in_progress') : 'scheduled',
        auditDate: d.toISOString(), auditorName: pick(AUDITORS),
        score: past ? ri(72, 97) : null,
        findings: past ? ri(0, 9) : null, criticalFindings: past ? ri(0, 2) : null,
        summary: past ? 'Overall compliance satisfactory. Minor observations noted.' : 'Audit scheduled — preparation in progress.',
        nextAuditDate: new Date(d.getTime() + 86400000 * 180).toISOString(),
      });
      idx++;
    }
  }
  return items;
}
const AUDITS = makeAudits();

const SOP_TITLES = [
  'HPLC Method Validation','Microbial Limit Test','Dissolution Testing Procedure',
  'Stability Protocol Management','Equipment Qualification (IQ/OQ/PQ)',
  'Raw Material Testing & Approval','Batch Release Procedure','OOS Investigation Protocol',
  'Cleaning Validation','Temperature Monitoring & Mapping',
  'Label Reconciliation Procedure','Deviation Management System',
  'Change Control Management','Risk Assessment Methodology',
  'Supplier Qualification & Audit','Training Records Management',
  'Internal Audit Procedure','Document Control SOP',
  'GC Method Development','Karl Fischer Moisture Determination',
  'Environmental Monitoring Program','Water System Qualification',
  'Spectrophotometric Analysis','Analytical Balance Calibration',
  'Autoclave Validation & Sterilisation','Sample Management & Chain of Custody',
  'pH Meter Calibration & Use','Reference Standard Management',
];

const SOPS = SOP_TITLES.map((title, i) => {
  const rev = new Date('2023-04-01'); rev.setMonth(rev.getMonth() + Math.floor(i * 1.2));
  const ver = 1 + Math.floor(i / 9);
  return {
    id: String(i+1), sopCode: `SOP-${String(i+1).padStart(3,'0')}`, title,
    category: ['Analytical','Quality Control','Regulatory','Equipment','Administrative'][i%5],
    department: ['QC','QA','Production','Regulatory'][i%4],
    status: i < 3 ? 'draft' : i > 24 ? 'under_review' : 'active',
    version: `${ver}.${i % 3}`,
    effectiveDate: new Date('2023-01-01').toISOString(), reviewDate: rev.toISOString(),
    owner: USERS[i % 3].name, tags: ['GMP','validation','QC'].slice(0, 1 + i % 3),
    daysUntilReview: Math.floor((rev.getTime() - Date.now()) / 86400000),
    versions: Array.from({ length: ver }, (_, vi) => ({
      version: `${vi+1}.0`, effectiveDate: new Date(2023 + vi, 0, 15).toISOString(),
      author: USERS[vi % 3].name, changeNote: vi === 0 ? 'Initial release.' : `Revised v${vi+1}.`,
    })),
  };
});

const PRODUCTS = [
  { name:'Amoxicillin 500mg Capsules', code:'PRD-001' },
  { name:'Metformin 850mg Tablets',    code:'PRD-002' },
  { name:'Atorvastatin 20mg Tablets',  code:'PRD-003' },
  { name:'Paracetamol 650mg Tablets',  code:'PRD-004' },
  { name:'Azithromycin 250mg Capsules',code:'PRD-005' },
  { name:'Pantoprazole 40mg Tablets',  code:'PRD-006' },
];

const BATCHES = Array.from({ length: 156 }, (_, i) => {
  const d = new Date('2023-01-09'); d.setDate(d.getDate() + i * 7);
  const yp = 93.5 + rng() * 5;
  const bs = [100, 200, 500, 1000][i % 4];
  const prod = PRODUCTS[i % PRODUCTS.length];
  const past = d < new Date();
  return {
    id: String(i+1), batchCode: `BCH-${String(i+1).padStart(4,'0')}`,
    productName: prod.name, productCode: prod.code, lab: LABS[i % 6],
    status: !past ? 'in_progress' : (rng() > 0.08 ? 'released' : (rng() > 0.5 ? 'rejected' : 'quarantine')),
    batchSize: bs, unit: 'kg',
    yieldActual: past ? +(bs * yp / 100).toFixed(1) : null,
    yieldExpected: bs * 0.97, yieldPercent: past ? +yp.toFixed(2) : null,
    startDate: d.toISOString(),
    endDate: past ? new Date(d.getTime() + 86400000 * ri(2,4)).toISOString() : null,
    releaseDate: past ? new Date(d.getTime() + 86400000 * ri(4,7)).toISOString() : null,
    operator: USERS[2].name, reviewedBy: USERS[1].name,
    deviations: rng() > 0.88 ? 1 : 0, remarks: null,
  };
});

const DOC_TITLES = ['HPLC Validation Report','SOP for Equipment Calibration','Audit Report','Stability Study Protocol','Certificate of Analysis','Method Development Report','Risk Assessment Document','Change Control Record','Deviation Investigation Report','Qualification Protocol','Training Record','Annual Product Review','Supplier Audit Report','Environmental Monitoring Report','Cleaning Validation Protocol'];
const DOCUMENTS = Array.from({ length: 90 }, (_, i) => ({
  id: String(i+1), docCode: `DOC-${String(i+1).padStart(3,'0')}`,
  title: `${DOC_TITLES[i % DOC_TITLES.length]} ${Math.floor(i/DOC_TITLES.length)+1}`,
  type: ['Report','SOP','Protocol','Certificate','Form','Record'][i%6],
  category: ['QC','QA','Regulatory','Production'][i%4],
  status: i < 80 ? 'active' : 'archived',
  fileSize: ri(50000, 3000000), fileType: ['pdf','docx','xlsx'][i%3],
  version: `${1+Math.floor(i/30)}.${i%3}`,
  uploadedAt: new Date(Date.now() - 86400000 * (i * 12)).toISOString(),
  uploader: USERS[i%3], lab: LABS[i%LABS.length],
  tags: ['GMP','QC','regulatory'].slice(0, 1 + i%3),
}));

const REQ_TITLES = ['Stability Testing','HPLC Method Development','Microbial Limit Test','Dissolution Profile Study','Assay Determination','Bioassay Evaluation','Karl Fischer Moisture Analysis','Particle Size Distribution','Content Uniformity','Related Substances by HPLC','Heavy Metals Analysis','Sterility Testing'];
const REQ_TYPES = ['Stability','Analytical','Microbiology','Dissolution','Assay','Bioassay'];
const REQUESTS = Array.from({ length: 180 }, (_, i) => {
  const d = new Date('2023-01-10'); d.setDate(d.getDate() + i * 6);
  const due = new Date(d); due.setDate(due.getDate() + ri(10,20));
  const past = d < new Date();
  return {
    id: String(i+1), requestCode: `REQ-${String(i+1).padStart(4,'0')}`,
    title: `${REQ_TITLES[i % REQ_TITLES.length]} — ${PRODUCTS[i % PRODUCTS.length].name}`,
    type: REQ_TYPES[i%REQ_TYPES.length],
    status: past ? pick(['completed','completed','completed','cancelled']) : ['submitted','under_review','in_progress'][i%3],
    priority: ['urgent','high','normal','low'][i%4],
    lab: LABS[i%LABS.length], partner: null, requester: USERS[i%3],
    requestDate: d.toISOString(), dueDate: due.toISOString(),
    quoteAmount: [12000,18000,28000,45000,65000,95000,125000][i%7],
    parameters: ['pH','Viscosity','Assay','Dissolution','Microbial count'].slice(0, 1+i%4),
    remarks: i%9===0 ? 'Urgent: regulatory submission deadline.' : null,
  };
});

const WORKFLOWS = [
  { id:'1', code:'WF-001', name:'CAPA Approval Workflow',           type:'capa',     description:'Routes through QA review, lab head approval, and QA director sign-off.', stepCount:4, autoTrigger:true  },
  { id:'2', code:'WF-002', name:'Document Review & Approval',       type:'document', description:'Document review cycle from author through peer review to final approval.', stepCount:3, autoTrigger:false },
  { id:'3', code:'WF-003', name:'Batch Release Workflow',           type:'batch',    description:'QC review, QA approval, and final batch release authorisation.',           stepCount:3, autoTrigger:false },
  { id:'4', code:'WF-004', name:'Partner Onboarding Workflow',      type:'partner',  description:'Covers QA verification and contract setup.',                               stepCount:5, autoTrigger:true  },
  { id:'5', code:'WF-005', name:'High-Value Test Request Approval', type:'request',  description:'Auto-triggered when quote exceeds ₹50,000.',                               stepCount:3, autoTrigger:true  },
];

const WORKFLOW_RUNS = Array.from({ length: 48 }, (_, i) => ({
  id: String(i+1), runCode: `RUN-${String(i+1).padStart(4,'0')}`,
  template: WORKFLOWS[i%5],
  status: ['in_progress','in_progress','completed','rejected','completed'][i%5],
  currentStep: [2,1,3,2,3][i%5], totalSteps: WORKFLOWS[i%5].stepCount,
  triggeredBy: USERS[0],
  startedAt: new Date(Date.now() - 86400000 * (i * 23)).toISOString(),
  completedAt: i%3===0 ? new Date(Date.now() - 86400000 * (i * 20)).toISOString() : null,
  steps: Array.from({ length: WORKFLOWS[i%5].stepCount }, (_, si) => ({
    id: `${i+1}-${si+1}`, stepNumber: si+1,
    name: ['Initiator Review','QA Review','Lab Head Approval','QA Director Sign-off'][si] || `Step ${si+1}`,
    role: ['qc_analyst','qa_director','lab_head','admin'][si] || 'qa_director',
    status: si < [2,1,3,2,3][i%5] ? 'completed' : si === [2,1,3,2,3][i%5] ? 'in_progress' : 'pending',
    assignee: USERS[si%3],
    completedAt: si < [2,1,3,2,3][i%5] ? new Date(Date.now() - 86400000 * (3-si)).toISOString() : null,
    notes: si===0 ? 'Reviewed and forwarded.' : null,
  })),
}));

const INTEGRATIONS = [
  { id:'1', name:'SAP ERP Connector',   type:'erp',          provider:'SAP',          status:'active',   lastSync:new Date(Date.now()-3600000).toISOString(),  syncFrequency:'hourly',   recordsSynced:14823, errorCount:0  },
  { id:'2', name:'LIMS Bridge',         type:'lims',         provider:'LabWare',      status:'active',   lastSync:new Date(Date.now()-1800000).toISOString(),  syncFrequency:'realtime', recordsSynced:38291, errorCount:2  },
  { id:'3', name:'QMS Integration',     type:'qms',          provider:'MasterControl',status:'active',   lastSync:new Date(Date.now()-86400000).toISOString(), syncFrequency:'daily',    recordsSynced:5612,  errorCount:0  },
  { id:'4', name:'Slack Notifications', type:'notification', provider:'Slack',        status:'active',   lastSync:new Date().toISOString(),                   syncFrequency:'realtime', recordsSynced:1204,  errorCount:0  },
  { id:'5', name:'AWS S3 Storage',      type:'storage',      provider:'AWS',          status:'error',    lastSync:new Date(Date.now()-86400000*2).toISOString(),syncFrequency:'hourly',  recordsSynced:892,   errorCount:14 },
  { id:'6', name:'Power BI Analytics',  type:'analytics',    provider:'Microsoft',    status:'inactive', lastSync:null,                                       syncFrequency:'daily',    recordsSynced:0,     errorCount:0  },
];

// ── Trends ──
const TRENDS_36M = MONTHS.map((label, i) => {
  const wave = Math.sin(i * Math.PI / 6);
  const growth = i * 0.15;
  return {
    label,
    openCapas:     Math.max(2, Math.round(9 - growth * 0.2 + wave * 2 + (i < 6 ? 3 : 0))),
    closedCapas:   Math.max(3, Math.round(7 + growth * 0.3 + wave * 1.5)),
    overdueCapas:  Math.max(0, Math.round(3 - growth * 0.1 + (i % 12 > 8 ? 1 : 0))),
    batchReleased: Math.round(3 + growth * 0.1 + wave + Math.floor(i/12)),
    batchHold:     Math.max(0, Math.round(2 - growth * 0.05 + (wave < -0.5 ? 1 : 0))),
    auditScore:    Math.min(98, Math.round(79 + growth * 0.4 + wave * 3)),
    testRequests:  Math.round(4 + growth * 0.15 + wave + Math.floor(i/12)),
  };
});

const TRENDS_30D = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() - (29 - i));
  const wave = Math.sin(i * Math.PI / 7);
  return {
    label: `${d.getDate()}/${d.getMonth()+1}`,
    openCapas: Math.max(1, Math.round(4 + wave * 1.5)),
    closedCapas: Math.max(1, Math.round(5 + wave + i * 0.05)),
    overdueCapas: Math.max(0, Math.round(1 + (wave < -0.3 ? 1 : 0))),
    batchReleased: Math.max(0, Math.round(0.8 + wave * 0.5)),
    batchHold: Math.max(0, i % 10 === 3 ? 1 : 0),
    auditScore: Math.round(86 + wave * 4),
    testRequests: Math.max(1, Math.round(2 + wave)),
  };
});

// ── Paged helper ──
function paged(arr: any[], page = 1, limit = 20) {
  const p = Number(page) || 1, l = Number(limit) || 20;
  const start = (p - 1) * l;
  return { success: true, data: arr.slice(start, start + l), meta: { total: arr.length, page: p, limit: l, pages: Math.ceil(arr.length / l) } };
}

function ok(data: any) { return { success: true, data }; }

// ── Route handler ──
export function handleMockRequest(method: string, url: string, body?: any): any {
  const u = new URL(url, 'http://localhost');
  const path = u.pathname.replace(/^\/api\/v1/, '');
  const q = u.searchParams;
  const page = q.get('page') || '1';
  const limit = q.get('limit') || '20';

  // Auth
  if (path === '/auth/login' && method === 'POST') {
    const user = USERS.find(u => u.email === body?.email && u.password === body?.password);
    if (!user) return { status: 401, data: { success: false, message: 'Invalid credentials' } };
    return { data: ok({ accessToken: 'mock-token-' + user.id, refreshToken: 'mock-refresh-' + user.id, user: { id: user.id, name: user.name, email: user.email, role: user.role } }) };
  }
  if (path === '/auth/me') return { data: ok({ id: USERS[0].id, name: USERS[0].name, email: USERS[0].email, role: USERS[0].role }) };
  if (path === '/auth/refresh') return { data: ok({ accessToken: 'mock-token-refreshed' }) };
  if (path === '/auth/logout') return { data: ok({ message: 'Logged out' }) };

  // Dashboard
  if (path === '/dashboard/kpis') {
    const sp = (base: number) => Array.from({length:12}, (_,i) => base + Math.round(Math.sin(i*0.6)*2) + (i%3));
    const activeLabs = LABS.filter(l=>l.status==='active').length;
    const eqTypes = [...new Set(EQUIPMENT.map(e=>e.type))].length;
    const caps = [...new Set(LABS.flatMap(l=>l.capabilities))].length;
    const openC = CAPAS.filter(c=>c.status==='open'||c.status==='in_progress').length;
    const certA = CERTS.filter(c=>c.status==='renewal_due'||c.status==='expired').length;
    const bHold = BATCHES.filter(b=>b.status==='quarantine').length;
    const pReqs = REQUESTS.filter(r=>r.status==='submitted'||r.status==='under_review').length;
    return { data: ok({
      activeLabs:      { value: activeLabs, sparkline: sp(activeLabs-2), trend: 2, trendDir: 'up' },
      equipmentTypes:  { value: eqTypes, sparkline: sp(eqTypes-1), trend: 0, trendDir: 'flat' },
      testCapabilities:{ value: caps, sparkline: sp(caps-3), trend: 3, trendDir: 'up' },
      partnerLabs:     { value: PARTNERS.filter(p=>p.status==='active').length, sparkline: sp(8), trend: 1, trendDir: 'up' },
      openCapas:       { value: openC, sparkline: sp(openC-3), trend: 5, trendDir: 'down' },
      certAlerts:      { value: certA, sparkline: sp(certA-1), trend: 2, trendDir: 'up' },
      batchesOnHold:   { value: bHold, sparkline: sp(bHold), trend: 1, trendDir: 'down' },
      pendingRequests: { value: pReqs, sparkline: sp(pReqs-2), trend: 3, trendDir: 'up' },
    })};
  }
  if (path === '/dashboard/trends') {
    const range = q.get('range') || '12m';
    if (range === '30d') return { data: ok(TRENDS_30D) };
    const count = range === '3m' ? 3 : range === '6m' ? 6 : 12;
    return { data: ok(TRENDS_36M.slice(-count)) };
  }
  if (path === '/dashboard/upcoming') {
    const events: any[] = [];
    CERTS.filter(c=>c.daysLeft>=0&&c.daysLeft<=60).slice(0,4).forEach(c => events.push({ id:`cert-${c.id}`, type:'certification', title:`${c.name} Expiring`, subtitle:c.lab.name, date:c.expiryDate, urgency:c.daysLeft<30?'critical':'high', daysLeft:c.daysLeft }));
    CAPAS.filter(c=>c.status==='open').slice(0,3).forEach(c => events.push({ id:`capa-${c.id}`, type:'capa', title:c.title, subtitle:c.lab.name, date:c.dueDate, urgency:c.severity==='critical'?'critical':'medium', daysLeft:Math.max(0,Math.floor((new Date(c.dueDate).getTime()-Date.now())/86400000)) }));
    AUDITS.filter(a=>a.status==='scheduled').slice(0,3).forEach(a => events.push({ id:`audit-${a.id}`, type:'audit', title:`${a.type} Audit — ${a.lab.name}`, subtitle:`Auditor: ${a.auditorName}`, date:a.auditDate, urgency:'medium', daysLeft:Math.max(0,Math.floor((new Date(a.auditDate).getTime()-Date.now())/86400000)) }));
    events.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return { data: ok(events.slice(0,10)) };
  }
  if (path === '/dashboard/equipment-dist') {
    const counts: Record<string,number> = {};
    EQUIPMENT.forEach(e => { counts[e.type] = (counts[e.type]||0)+1; });
    return { data: ok(Object.entries(counts).map(([type,count])=>({type,count}))) };
  }
  if (path === '/dashboard/cert-health') return { data: ok({ valid: CERTS.filter(c=>c.status==='valid').length, renewalDue: CERTS.filter(c=>c.status==='renewal_due').length, expired: CERTS.filter(c=>c.status==='expired').length }) };
  if (path === '/dashboard/partner-map') return { data: ok([
    { id:'1', name:'Mumbai QC Central', city:'Mumbai', riskScore:18, lat:19.076, lng:72.877 },
    { id:'2', name:'Pune R&D Lab', city:'Pune', riskScore:24, lat:18.520, lng:73.856 },
    { id:'3', name:'Hyderabad API Lab', city:'Hyderabad', riskScore:12, lat:17.385, lng:78.487 },
    { id:'4', name:'Chennai Biolab', city:'Chennai', riskScore:31, lat:13.083, lng:80.270 },
    { id:'5', name:'Bengaluru Biotech Lab', city:'Bangalore', riskScore:22, lat:12.972, lng:77.595 },
    { id:'6', name:'Delhi NCR Contract Lab', city:'Delhi', riskScore:55, lat:28.704, lng:77.102 },
  ])};

  // Labs
  if (path === '/labs' && method === 'POST') return { data: ok({ id: String(Date.now()), ...body }), status: 201 };
  if (path === '/labs') return { data: paged(LABS, Number(page), Number(limit)) };
  if (path.match(/^\/labs\/[^/]+$/)) return { data: ok(LABS.find(l=>l.id===path.split('/').pop()) || LABS[0]) };

  // Equipment
  if (path === '/equipment' && method === 'POST') return { data: ok({ id: String(Date.now()), ...body }), status: 201 };
  if (path === '/equipment') return { data: paged(EQUIPMENT, Number(page), Number(limit)) };
  if (path === '/equipment/utilisation') {
    const agg: Record<string,{sum:number;count:number}> = {};
    EQUIPMENT.forEach(e => { if (!agg[e.type]) agg[e.type]={sum:0,count:0}; agg[e.type].sum+=e.utilizationRate; agg[e.type].count++; });
    return { data: ok(Object.entries(agg).map(([type,v])=>({ type, avg:Math.round(v.sum/v.count) }))) };
  }
  if (path === '/equipment/matrix') return { data: ok({ types:['HPLC','GC','Spectrophotometer','Balance','Autoclave'], rows: LABS.slice(0,6).map(l=>({ lab:l.name, counts:{ HPLC:ri(0,3), GC:ri(0,2), Spectrophotometer:ri(0,2), Balance:1+ri(0,2), Autoclave:ri(0,2) } })) }) };

  // Certifications
  if (path === '/certifications' && method === 'POST') return { data: ok({ id: String(Date.now()), ...body }), status: 201 };
  if (path === '/certifications') return { data: paged(CERTS, Number(page), Number(limit)) };
  if (path === '/certifications/health-chart') return { data: ok(LABS.slice(0,8).map(l=>({ lab:l.labCode, valid:ri(2,4), renewal_due:ri(0,2), expired:ri(0,1) }))) };
  if (path === '/certifications/expiry-timeline') return { data: ok(MONTHS.map((month,i)=>({ month, count:ri(0,4), urgent:i>=33 }))) };

  // Partners
  if (path === '/partners' && method === 'POST') return { data: ok({ id: String(Date.now()), ...body }), status: 201 };
  if (path === '/partners') return { data: paged(PARTNERS, Number(page), Number(limit)) };
  if (path === '/partners/finder') return { data: ok(LABS.map(l=>({ ...l, matchScore:60+ri(0,38), activeCerts:['ISO 9001','NABL','WHO-GMP'].slice(0,1+ri(0,2)), turnaroundDays:ri(4,14) }))) };
  if (path.match(/\/partners\/[^/]+\/scorecard$/)) return { data: ok(MONTHS.map((month,i)=>({ month, overallScore:74+Math.round(Math.sin(i*0.3)*10)+ri(0,8) }))) };
  if (path.match(/^\/partners\/[^/]+$/)) return { data: ok(PARTNERS[0]) };

  // CAPA
  if (path === '/capa' && method === 'POST') { const n = { id:String(Date.now()), capaCode:`CAPA-${String(CAPAS.length+1).padStart(4,'0')}`, status:'open', ...body }; return { data: ok(n), status: 201 }; }
  if (path === '/capa') return { data: paged(CAPAS, Number(page), Number(limit)) };
  if (path === '/capa/monthly-trend') return { data: ok(MONTHS.map((month,i)=>({ month, count:6+i%8+(i>24?2:0) }))) };
  if (path === '/capa/by-severity') {
    const counts: Record<string,number> = { critical:0, major:0, minor:0, observation:0 };
    CAPAS.forEach(c => counts[c.severity]++);
    return { data: ok([{ severity:'critical',count:counts.critical,color:'#DC2626' },{ severity:'major',count:counts.major,color:'#D97706' },{ severity:'minor',count:counts.minor,color:'#2563EB' },{ severity:'observation',count:counts.observation,color:'#16A34A' }]) };
  }

  // Audits
  if (path === '/audits' && method === 'POST') return { data: ok({ id: String(Date.now()), ...body }), status: 201 };
  if (path === '/audits') return { data: paged(AUDITS, Number(page), Number(limit)) };
  if (path === '/audits/score-trend') return { data: ok(MONTHS.map((month,i)=>({ month, ...Object.fromEntries(LABS.slice(0,4).map(l=>[l.name, 76+Math.round(Math.sin(i*0.35+LABS.indexOf(l))*8)+ri(0,6)])) }))) };
  if (path === '/audits/calendar') return { data: ok(Array.from({length:12},(_,i)=>({ month:i+1, count:1+ri(0,3), avgScore:76+ri(0,18) }))) };

  // SOPs
  if (path === '/sops' && method === 'POST') return { data: ok({ id: String(Date.now()), ...body }), status: 201 };
  if (path === '/sops') return { data: paged(SOPS, Number(page), Number(limit)) };
  if (path === '/sops/due-for-review') return { data: ok(SOPS.filter(s=>s.daysUntilReview<90)) };

  // Batches
  if (path === '/batches' && method === 'POST') return { data: ok({ id: String(Date.now()), ...body }), status: 201 };
  if (path === '/batches') return { data: paged(BATCHES, Number(page), Number(limit)) };
  if (path === '/batches/monthly-output') return { data: ok(MONTHS.map((month,i)=>({ month, count:3+i%5 }))) };
  if (path === '/batches/yield-trend') return { data: ok(MONTHS.map((month,i)=>({ month, avgYield:+(95.2+Math.sin(i*0.4)*1.8).toFixed(2) }))) };

  // Documents
  if (path === '/documents' && method === 'POST') return { data: ok({ id: String(Date.now()), ...body }), status: 201 };
  if (path === '/documents') return { data: paged(DOCUMENTS, Number(page), Number(limit)) };

  // Requests
  if (path === '/requests' && method === 'POST') return { data: ok({ id: String(Date.now()), ...body }), status: 201 };
  if (path === '/requests') return { data: paged(REQUESTS, Number(page), Number(limit)) };
  if (path === '/requests/monthly-volume') return { data: ok(MONTHS.map((month,i)=>({ month, count:4+i%6+(i>12?2:0) }))) };
  if (path === '/requests/by-lab') return { data: ok(LABS.map(l=>({ lab:l.name, count:ri(8,28) }))) };

  // Workflows
  if (path === '/workflows') return { data: ok(WORKFLOWS) };
  if (path === '/workflows/workflow-runs') return { data: paged(WORKFLOW_RUNS, Number(page), Number(limit)) };

  // Integrations
  if (path === '/integrations') return { data: ok(INTEGRATIONS) };

  // Notifications
  if (path === '/notifications') return { data: ok([
    { id:'1', type:'cert_expiry', title:'ISO 9001 Expiring Soon', message:'Certificate expires in 28 days', read:false, createdAt:new Date().toISOString() },
    { id:'2', type:'capa_deadline', title:'CAPA-0042 Overdue', message:'Root cause analysis overdue by 3 days', read:false, createdAt:new Date(Date.now()-3600000).toISOString() },
    { id:'3', type:'audit_scheduled', title:'Audit Scheduled', message:'Q2 internal audit scheduled for next week', read:true, createdAt:new Date(Date.now()-86400000).toISOString() },
    { id:'4', type:'batch_released', title:'Batch BCH-0148 Released', message:'Amoxicillin 500mg batch released successfully', read:false, createdAt:new Date(Date.now()-7200000).toISOString() },
    { id:'5', type:'oos_detected', title:'OOS Result Detected', message:'HPLC assay OOS in LAB-003', read:false, createdAt:new Date(Date.now()-14400000).toISOString() },
  ]) };
  if (path === '/notifications/unread-count') return { data: ok({ count: 4 }) };
  if (path.match(/\/notifications\/.*\/read/)) return { data: ok({ message: 'Marked read' }) };

  // Search
  if (path === '/search') {
    const sq = (q.get('q')||'').toLowerCase();
    if (!sq) return { data: ok([]) };
    const results = [
      ...LABS.filter(l=>l.name.toLowerCase().includes(sq)).slice(0,3).map(l=>({ type:'lab', id:l.id, title:l.name, subtitle:l.labCode, url:'/registry' })),
      ...CAPAS.filter(c=>c.title.toLowerCase().includes(sq)).slice(0,3).map(c=>({ type:'capa', id:c.id, title:c.title, subtitle:c.capaCode, url:'/capa' })),
    ];
    return { data: ok(results) };
  }

  // Bulk import
  if (path.startsWith('/import/') && method === 'POST') return { data: ok({ id:String(Date.now()), totalRows:15, successRows:14, errorRows:1, status:'partial', errors:[{row:3,message:'Invalid reference code'}], importedAt:new Date().toISOString(), message:'Import completed with 1 error(s)' }), status: 201 };

  // Analytics
  if (path === '/analytics/partner-performance') return { data: ok(PARTNERS) };
  if (path === '/analytics/quality-score-trend') return { data: ok(MONTHS.map((month,i)=>({ month, score:81+Math.round(Math.sin(i*0.3)*6)+(i>12?3:0) }))) };
  if (path === '/analytics/capa-resolution-time') return { data: ok(MONTHS.map((month,i)=>({ month, avgDays:22-Math.round(i*0.3)+ri(0,5) }))) };
  if (path === '/analytics/cert-compliance-rate') return { data: ok(MONTHS.map((month,i)=>({ month, rate:84+Math.round(Math.sin(i*0.25)*5)+(i>24?4:0) }))) };

  // Generic fallbacks
  if (method === 'POST') return { data: ok({ id: String(Date.now()), message: 'Created successfully', ...body }), status: 201 };
  if (method === 'PUT' || method === 'PATCH') return { data: ok({ message: 'Updated', ...body }) };
  if (method === 'DELETE') return { data: ok({ message: 'Deleted' }) };

  return { data: ok({ message: 'OK' }) };
}
