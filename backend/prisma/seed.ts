import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { addMonths, subMonths, addDays, startOfMonth, endOfMonth } from 'date-fns';

const prisma = new PrismaClient();

// ── helpers ──────────────────────────────────────────────────────────────────
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min: number, max: number) => Math.round((Math.random() * (max - min) + min) * 10) / 10;
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const NOW = new Date('2026-03-24');
const START = new Date('2025-03-01');
const monthRange = Array.from({ length: 13 }, (_, i) => addMonths(START, i)).filter((d) => d <= NOW);

async function main() {
  console.log('🌱  Quantum Kairoz — Seeding 12 months of data (Mar 2025 – Mar 2026)...\n');

  // ── 1. Users ────────────────────────────────────────────────────────────────
  console.log('Creating users...');
  const hash = await bcrypt.hash('Admin@123', 10);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@forgequantum.com' },
      update: {},
      create: { email: 'admin@forgequantum.com', name: 'Arjun Sharma', passwordHash: hash, role: 'admin' },
    }),
    prisma.user.upsert({
      where: { email: 'qa@forgequantum.com' },
      update: {},
      create: { email: 'qa@forgequantum.com', name: 'Dr. Priya Nair', passwordHash: hash, role: 'qa_director' },
    }),
    prisma.user.upsert({
      where: { email: 'labhead@forgequantum.com' },
      update: {},
      create: { email: 'labhead@forgequantum.com', name: 'Vikram Mehta', passwordHash: hash, role: 'lab_head' },
    }),
    prisma.user.upsert({
      where: { email: 'analyst@forgequantum.com' },
      update: {},
      create: { email: 'analyst@forgequantum.com', name: 'Sneha Patel', passwordHash: hash, role: 'qc_analyst' },
    }),
    prisma.user.upsert({
      where: { email: 'partner@cipla.com' },
      update: {},
      create: { email: 'partner@cipla.com', name: 'Ramesh Kumar', passwordHash: hash, role: 'partner' },
    }),
  ]);

  const [admin, qa, labHead, analyst] = users;
  console.log(`  ✓ ${users.length} users created`);

  // ── 2. Labs ─────────────────────────────────────────────────────────────────
  console.log('Creating labs...');
  const labData = [
    // Internal labs
    { labCode: 'LAB-0001', name: 'Forge QC Central — Mumbai', type: 'internal' as const, city: 'Mumbai', state: 'Maharashtra', lat: 19.076, lng: 72.877, capacity: 500, contactName: 'Vikram Mehta', contactEmail: 'labhead@forgequantum.com', riskScore: 18.5, auditScore: 91.2, rating: 4.7 },
    { labCode: 'LAB-0002', name: 'Forge R&D Lab — Pune', type: 'internal' as const, city: 'Pune', state: 'Maharashtra', lat: 18.52, lng: 73.856, capacity: 300, contactName: 'Sneha Patel', contactEmail: 'analyst@forgequantum.com', riskScore: 12.3, auditScore: 94.8, rating: 4.9 },
    { labCode: 'LAB-0003', name: 'Forge Stability Lab — Ahmedabad', type: 'internal' as const, city: 'Ahmedabad', state: 'Gujarat', lat: 23.022, lng: 72.571, capacity: 250, contactName: 'Arjun Sharma', contactEmail: 'admin@forgequantum.com', riskScore: 22.1, auditScore: 88.4, rating: 4.5 },
    { labCode: 'LAB-0004', name: 'Forge API Lab — Hyderabad', type: 'internal' as const, city: 'Hyderabad', state: 'Telangana', lat: 17.385, lng: 78.486, capacity: 400, contactName: 'Dr. Priya Nair', contactEmail: 'qa@forgequantum.com', riskScore: 15.7, auditScore: 92.6, rating: 4.8 },
    // Partner labs
    { labCode: 'LAB-0005', name: 'Cipla Analytical Lab — Bangalore', type: 'partner' as const, city: 'Bangalore', state: 'Karnataka', lat: 12.971, lng: 77.594, capacity: 600, contactName: 'Ramesh Kumar', contactEmail: 'partner@cipla.com', riskScore: 25.4, auditScore: 87.3, rating: 4.3 },
    { labCode: 'LAB-0006', name: "Dr. Reddy's QC Centre — Hyderabad", type: 'partner' as const, city: 'Hyderabad', state: 'Telangana', lat: 17.42, lng: 78.45, capacity: 450, contactName: 'Kavitha Rao', contactEmail: 'labs@drreddys.com', riskScore: 31.2, auditScore: 84.6, rating: 4.1 },
    { labCode: 'LAB-0007', name: 'Sun Pharma Testing — Chennai', type: 'partner' as const, city: 'Chennai', state: 'Tamil Nadu', lat: 13.082, lng: 80.27, capacity: 350, contactName: 'Suresh Babu', contactEmail: 'qc@sunpharma.com', riskScore: 42.8, auditScore: 79.2, rating: 3.8 },
    { labCode: 'LAB-0008', name: 'Lupin Lab Services — Delhi', type: 'partner' as const, city: 'Delhi', state: 'Delhi', lat: 28.704, lng: 77.102, capacity: 280, contactName: 'Anita Singh', contactEmail: 'labs@lupin.com', riskScore: 35.6, auditScore: 82.1, rating: 4.0 },
  ];

  const labs: Record<string, Awaited<ReturnType<typeof prisma.lab.upsert>>> = {};
  for (const lab of labData) {
    const created = await prisma.lab.upsert({
      where: { labCode: lab.labCode },
      update: { riskScore: lab.riskScore, auditScore: lab.auditScore, rating: lab.rating },
      create: { ...lab, status: 'active' },
    });
    labs[lab.labCode] = created;
  }

  // Assign users to labs
  await prisma.user.update({ where: { id: labHead.id }, data: { labId: labs['LAB-0001'].id } });
  await prisma.user.update({ where: { id: analyst.id }, data: { labId: labs['LAB-0002'].id } });
  console.log(`  ✓ ${labData.length} labs created`);

  // ── 3. Equipment ────────────────────────────────────────────────────────────
  console.log('Creating equipment...');
  const equipmentData = [
    { labCode: 'LAB-0001', name: 'HPLC System A', type: 'HPLC', manufacturer: 'Waters', model: 'Alliance e2695', capabilities: ['Assay', 'Related Substances', 'Dissolution'] },
    { labCode: 'LAB-0001', name: 'HPLC System B', type: 'HPLC', manufacturer: 'Agilent', model: '1260 Infinity II', capabilities: ['Assay', 'Content Uniformity'] },
    { labCode: 'LAB-0001', name: 'GC System', type: 'GC', manufacturer: 'Shimadzu', model: 'GC-2010', capabilities: ['Residual Solvents', 'Headspace Analysis'] },
    { labCode: 'LAB-0002', name: 'LC-MS/MS', type: 'LC-MS', manufacturer: 'AB Sciex', model: 'QTRAP 6500', capabilities: ['Pharmacokinetics', 'Metabolite Identification', 'Bioanalysis'] },
    { labCode: 'LAB-0002', name: 'ICP-OES', type: 'ICP-OES', manufacturer: 'PerkinElmer', model: 'Optima 8000', capabilities: ['Elemental Analysis', 'Metal Impurities'] },
    { labCode: 'LAB-0003', name: 'Stability Chamber 1', type: 'Stability Chamber', manufacturer: 'Memmert', model: 'HPP110', capabilities: ['ICH Stability', 'Long-term Storage'] },
    { labCode: 'LAB-0003', name: 'Stability Chamber 2', type: 'Stability Chamber', manufacturer: 'Binder', model: 'MKF 115', capabilities: ['Accelerated Testing', 'Photostability'] },
    { labCode: 'LAB-0004', name: 'HPLC Prep System', type: 'HPLC', manufacturer: 'Waters', model: 'Prep 150', capabilities: ['Purification', 'Isolation'] },
    { labCode: 'LAB-0004', name: 'UV-Vis Spectrophotometer', type: 'UV-Vis', manufacturer: 'Shimadzu', model: 'UV-2700', capabilities: ['UV Analysis', 'Kinetics'] },
    { labCode: 'LAB-0005', name: 'UPLC System', type: 'UPLC', manufacturer: 'Waters', model: 'Acquity', capabilities: ['Rapid Analysis', 'High Resolution'] },
    { labCode: 'LAB-0005', name: 'Mass Spectrometer', type: 'MS', manufacturer: 'Thermo Fisher', model: 'Q Exactive', capabilities: ['High Resolution MS', 'Proteomics'] },
    { labCode: 'LAB-0006', name: 'GC-MS', type: 'GC-MS', manufacturer: 'Agilent', model: '5977B', capabilities: ['Volatile Impurities', 'Residual Solvents'] },
    { labCode: 'LAB-0006', name: 'FTIR Spectroscope', type: 'FTIR', manufacturer: 'Bruker', model: 'Tensor 27', capabilities: ['Identity Testing', 'Structural Analysis'] },
    { labCode: 'LAB-0007', name: 'Dissolution Tester', type: 'Dissolution', manufacturer: 'Hanson', model: 'Vision G2', capabilities: ['Dissolution Testing', 'Drug Release'] },
    { labCode: 'LAB-0008', name: 'Particle Size Analyser', type: 'Particle Size', manufacturer: 'Malvern', model: 'Mastersizer 3000', capabilities: ['Particle Size', 'Zeta Potential'] },
  ];

  const equipmentIds: string[] = [];
  for (let i = 0; i < equipmentData.length; i++) {
    const e = equipmentData[i];
    const labId = labs[e.labCode].id;
    const equipCode = `EQ-${String(i + 1).padStart(4, '0')}`;

    try {
      const eq = await prisma.equipment.upsert({
        where: { equipCode },
        update: {},
        create: {
          labId, equipCode, name: e.name, type: e.type,
          manufacturer: e.manufacturer, model: e.model, capabilities: e.capabilities,
          calibrationDue: addDays(NOW, rand(30, 365)), status: 'operational',
        },
      });
      equipmentIds.push(eq.id);
    } catch {}
  }
  console.log(`  ✓ ${equipmentData.length} equipment items created`);

  // ── 4. Equipment Utilisation (Quarterly) ───────────────────────────────────
  for (const eqId of equipmentIds.slice(0, 8)) {
    for (const [year, quarter] of [[2025, 1], [2025, 2], [2025, 3], [2025, 4], [2026, 1]]) {
      try {
        await prisma.equipmentUtilisation.upsert({
          where: { equipmentId_quarter_year: { equipmentId: eqId, quarter, year } },
          update: {},
          create: { equipmentId: eqId, quarter, year, utilisationPct: randFloat(62, 94), hoursUsed: rand(400, 900), totalCapacity: 960 },
        });
      } catch {}
    }
  }

  // ── 5. Certifications ───────────────────────────────────────────────────────
  console.log('Creating certifications...');
  const certData = [
    { labCode: 'LAB-0001', name: 'NABL Accreditation', certifyingBody: 'NABL', certType: 'Quality', issueDate: '2024-01-15', expiryDate: '2026-01-14' },
    { labCode: 'LAB-0001', name: 'GMP Compliance', certifyingBody: 'CDSCO', certType: 'GMP', issueDate: '2024-06-01', expiryDate: '2026-05-31' },
    { labCode: 'LAB-0001', name: 'ISO 17025:2017', certifyingBody: 'BIS', certType: 'ISO', issueDate: '2023-09-01', expiryDate: '2025-08-31' },
    { labCode: 'LAB-0002', name: 'NABL Accreditation', certifyingBody: 'NABL', certType: 'Quality', issueDate: '2024-03-01', expiryDate: '2026-02-28' },
    { labCode: 'LAB-0002', name: 'WHO GMP', certifyingBody: 'WHO', certType: 'GMP', issueDate: '2024-07-01', expiryDate: '2026-06-30' },
    { labCode: 'LAB-0003', name: 'NABL Accreditation', certifyingBody: 'NABL', certType: 'Quality', issueDate: '2024-02-15', expiryDate: '2025-04-15' },
    { labCode: 'LAB-0003', name: 'ICH Q1 Compliance', certifyingBody: 'CDSCO', certType: 'Regulatory', issueDate: '2024-01-01', expiryDate: '2025-12-31' },
    { labCode: 'LAB-0004', name: 'US FDA 21 CFR', certifyingBody: 'US FDA', certType: 'Regulatory', issueDate: '2023-11-01', expiryDate: '2025-10-31' },
    { labCode: 'LAB-0004', name: 'NABL Accreditation', certifyingBody: 'NABL', certType: 'Quality', issueDate: '2024-04-01', expiryDate: '2026-03-31' },
    { labCode: 'LAB-0005', name: 'ISO 9001:2015', certifyingBody: 'Bureau Veritas', certType: 'ISO', issueDate: '2024-01-01', expiryDate: '2026-12-31' },
    { labCode: 'LAB-0005', name: 'GLP Certification', certifyingBody: 'CDSCO', certType: 'GLP', issueDate: '2024-05-01', expiryDate: '2025-05-30' },
    { labCode: 'LAB-0006', name: 'NABL Accreditation', certifyingBody: 'NABL', certType: 'Quality', issueDate: '2023-08-01', expiryDate: '2025-07-31' },
    { labCode: 'LAB-0007', name: 'ISO 17025:2017', certifyingBody: 'Bureau Veritas', certType: 'ISO', issueDate: '2024-02-01', expiryDate: '2025-03-15' },
    { labCode: 'LAB-0008', name: 'GMP Compliance', certifyingBody: 'CDSCO', certType: 'GMP', issueDate: '2024-06-15', expiryDate: '2026-06-14' },
  ];

  for (let i = 0; i < certData.length; i++) {
    const c = certData[i];
    const certCode = `CERT-${String(i + 1).padStart(4, '0')}`;
    const expiryDate = new Date(c.expiryDate);
    const daysLeft = Math.ceil((expiryDate.getTime() - NOW.getTime()) / 86400000);
    const status = daysLeft < 0 ? 'expired' : daysLeft <= 30 ? 'renewal_due' : 'valid';
    try {
      await prisma.certification.upsert({
        where: { certCode },
        update: { status: status as Parameters<typeof prisma.certification.upsert>[0]['update']['status'] },
        create: {
          certCode, labId: labs[c.labCode].id, name: c.name,
          certifyingBody: c.certifyingBody, certType: c.certType,
          issueDate: new Date(c.issueDate), expiryDate,
          status: status as Parameters<typeof prisma.certification.create>[0]['data']['status'],
        },
      });
    } catch {}
  }
  console.log(`  ✓ ${certData.length} certifications created`);

  // ── 6. Partners ─────────────────────────────────────────────────────────────
  for (const labCode of ['LAB-0005', 'LAB-0006', 'LAB-0007', 'LAB-0008']) {
    try {
      await prisma.partner.create({
        data: {
          labId: labs[labCode].id,
          specialization: pick([['Analytical', 'Stability'], ['GC/HPLC', 'Microbiology'], ['Dissolution', 'Content Uniformity']]),
          onboardedAt: subMonths(NOW, rand(6, 18)),
          contractStart: subMonths(NOW, rand(6, 18)),
          contractEnd: addMonths(NOW, rand(6, 24)),
          slaTerms: '14-day turnaround, CoA delivery within 48h',
          paymentTerms: 'Net 30',
        },
      });
    } catch {}
  }

  // ── 7. Workflows ─────────────────────────────────────────────────────────────
  console.log('Creating workflow templates...');
  const workflowData = [
    {
      code: 'WF-001', name: 'CAPA Resolution Workflow', type: 'capa' as const,
      description: 'Standard workflow for CAPA investigation, action planning, and closure',
      avgDays: 21,
      steps: [
        { name: 'Initial Assessment', description: 'QA reviews CAPA and assigns severity' },
        { name: 'Root Cause Analysis', description: 'Team performs RCA using 5-Why or Fishbone' },
        { name: 'Action Plan Development', description: 'Owner develops corrective action plan' },
        { name: 'Implementation', description: 'Actions implemented and documented' },
        { name: 'Verification', description: 'QA Director verifies effectiveness' },
        { name: 'Closure', description: 'CAPA formally closed and archived' },
      ],
    },
    {
      code: 'WF-002', name: 'Batch Release Workflow', type: 'batch_release' as const,
      description: 'Quality review and release process for manufactured batches',
      avgDays: 5,
      steps: [
        { name: 'QC Testing', description: 'Analytical tests performed per specification' },
        { name: 'QC Review', description: 'QC Analyst reviews all test results' },
        { name: 'QA Approval', description: 'QA Director reviews and approves batch record' },
        { name: 'Release Decision', description: 'Batch released or put on hold' },
      ],
    },
    {
      code: 'WF-003', name: 'SOP Approval Workflow', type: 'sop_approval' as const,
      description: 'Document review, approval, and effective date setting',
      avgDays: 7,
      steps: [
        { name: 'Draft Review', description: 'Author finalizes and submits draft' },
        { name: 'Technical Review', description: 'Subject matter expert reviews content' },
        { name: 'QA Review', description: 'QA reviews for compliance' },
        { name: 'Director Approval', description: 'QA Director approves and sets effective date' },
        { name: 'Distribution', description: 'Approved SOP distributed to relevant personnel' },
      ],
    },
    {
      code: 'WF-004', name: 'Partner Lab Onboarding', type: 'partner_onboarding' as const,
      description: 'Full qualification and onboarding process for new partner labs',
      avgDays: 30,
      steps: [
        { name: 'Application Review', description: 'Documents and credentials reviewed' },
        { name: 'Site Assessment', description: 'On-site capability assessment conducted' },
        { name: 'Qualification Audit', description: 'GMP audit performed' },
        { name: 'Contract Finalization', description: 'SLA and contract signed' },
        { name: 'System Setup', description: 'Lab onboarded to Quantum Kairoz platform' },
        { name: 'Trial Run', description: 'First test request processed and evaluated' },
      ],
    },
    {
      code: 'WF-005', name: 'Test Request Approval (High Value)', type: 'test_request_approval' as const,
      description: 'Finance approval workflow for test requests exceeding ₹50,000',
      avgDays: 3,
      steps: [
        { name: 'Manager Review', description: 'Lab Head reviews business justification' },
        { name: 'Finance Approval', description: 'Finance team approves expenditure' },
        { name: 'Director Sign-off', description: 'QA Director final approval' },
      ],
    },
  ];

  for (const wf of workflowData) {
    await prisma.workflow.upsert({
      where: { code: wf.code },
      update: {},
      create: wf,
    });
  }
  console.log(`  ✓ ${workflowData.length} workflow templates created`);

  // ── 8. CAPAs — 12 months ───────────────────────────────────────────────────
  console.log('Creating 12 months of CAPA records...');
  const sources = ['Manufacturing', 'QC Testing', 'Audit Finding', 'Customer Complaint', 'OOS Result', 'Equipment Failure'];
  const products = ['Metformin 500mg Tab', 'Amlodipine 5mg Tab', 'Atorvastatin 10mg Cap', 'Paracetamol 650mg', 'Omeprazole 20mg'];
  const departments = ['QC', 'Manufacturing', 'Microbiology', 'Stability', 'Packaging'];
  const severities: Array<'critical' | 'major' | 'minor' | 'observation'> = ['critical', 'major', 'minor', 'observation'];

  let capaCount = 0;
  for (const monthDate of monthRange) {
    const openCount = rand(4, 14);
    const start = startOfMonth(monthDate);
    const end = endOfMonth(monthDate);

    for (let j = 0; j < openCount; j++) {
      capaCount++;
      const code = `CAPA-${String(capaCount).padStart(4, '0')}`;
      const createdAt = new Date(start.getTime() + rand(0, end.getTime() - start.getTime()));
      const dueDate = addDays(createdAt, rand(14, 60));
      const isClosed = Math.random() > 0.35;
      const isOverdue = !isClosed && dueDate < NOW;
      const labCodes = Object.keys(labs);

      try {
        await prisma.capa.upsert({
          where: { capaCode: code },
          update: {},
          create: {
            capaCode: code,
            labId: labs[pick(labCodes)].id,
            title: `${pick(sources)} Deviation — ${pick(products)}`,
            source: pick(sources),
            product: pick(products),
            department: pick(departments),
            severity: pick(severities),
            description: `Deviation identified during ${pick(sources).toLowerCase()} operations. Requires immediate investigation and corrective action.`,
            rootCause: isClosed ? 'Procedural deviation identified and documented through 5-Why analysis.' : undefined,
            actionPlan: isClosed ? 'Retraining conducted, procedure updated, and additional controls implemented.' : undefined,
            status: isClosed ? 'closed' : isOverdue ? 'overdue' : pick(['open', 'in_progress']),
            ownerId: pick([qa.id, labHead.id, analyst.id]),
            createdById: pick([admin.id, qa.id]),
            dueDate,
            closedAt: isClosed ? addDays(dueDate, rand(-5, 10)) : undefined,
            createdAt,
            updatedAt: isClosed ? addDays(dueDate, rand(-5, 10)) : createdAt,
          },
        });
      } catch {}
    }
  }
  console.log(`  ✓ ${capaCount} CAPA records created`);

  // ── 9. Audits — monthly per lab ────────────────────────────────────────────
  console.log('Creating audit records...');
  const auditTypes: Array<'internal' | 'external' | 'gmp' | 'nabl' | 'usfda' | 'iso'> = ['internal', 'gmp', 'nabl', 'iso'];
  let auditCount = 0;

  for (const monthDate of monthRange) {
    for (const labCode of Object.keys(labs).slice(0, 6)) {
      if (Math.random() > 0.6) continue; // Not every lab every month
      auditCount++;
      const auditCode = `AUD-${String(auditCount).padStart(4, '0')}`;
      const scheduledDate = new Date(monthDate.getTime() + rand(5, 20) * 86400000);
      const isCompleted = scheduledDate < NOW;
      const score = randFloat(74, 97);
      const labHistory = { month: monthDate.getMonth() + 1, year: monthDate.getFullYear() };

      try {
        await prisma.audit.upsert({
          where: { auditCode },
          update: {},
          create: {
            auditCode,
            labId: labs[labCode].id,
            type: pick(auditTypes),
            status: isCompleted ? 'completed' : 'scheduled',
            scheduledDate,
            completedDate: isCompleted ? addDays(scheduledDate, rand(0, 2)) : undefined,
            auditorName: pick(['Dr. Priya Nair', 'Arjun Sharma', 'External Auditor', 'NABL Inspector']),
            auditorId: isCompleted ? pick([qa.id, admin.id]) : undefined,
            score: isCompleted ? score : undefined,
            summary: isCompleted ? `Audit completed. Overall compliance satisfactory. ${rand(0, 3)} minor findings noted.` : undefined,
            findings: isCompleted ? { minor: rand(0, 3), major: rand(0, 1), critical: 0 } : undefined,
          },
        });

        // Update lab rating history
        try {
          await prisma.labRatingHistory.upsert({
            where: { labId_month_year: { labId: labs[labCode].id, ...labHistory } },
            update: { auditScore: score },
            create: {
              labId: labs[labCode].id, ...labHistory,
              auditScore: score,
              riskScore: randFloat(10, 45),
              rating: randFloat(3.5, 5.0),
              capaCount: rand(1, 5),
            },
          });
        } catch {}
      } catch {}
    }
  }
  console.log(`  ✓ ${auditCount} audit records created`);

  // ── 10. SOPs ────────────────────────────────────────────────────────────────
  console.log('Creating SOP records...');
  const sopData = [
    { title: 'HPLC System Operation', department: 'QC', category: 'Equipment', status: 'approved' as const },
    { title: 'GC Analysis Procedure', department: 'QC', category: 'Equipment', status: 'approved' as const },
    { title: 'Raw Material Sampling', department: 'QC', category: 'Sampling', status: 'approved' as const },
    { title: 'Batch Manufacturing Record Review', department: 'QA', category: 'Documentation', status: 'approved' as const },
    { title: 'CAPA Investigation Procedure', department: 'QA', category: 'Quality System', status: 'approved' as const },
    { title: 'Deviation Handling', department: 'QA', category: 'Quality System', status: 'approved' as const },
    { title: 'Environmental Monitoring', department: 'Microbiology', category: 'Testing', status: 'approved' as const },
    { title: 'Microbial Limit Testing', department: 'Microbiology', category: 'Testing', status: 'approved' as const },
    { title: 'Dissolution Testing', department: 'QC', category: 'Testing', status: 'approved' as const },
    { title: 'Stability Study Protocol', department: 'Stability', category: 'Protocol', status: 'approved' as const },
    { title: 'Equipment Qualification IQ/OQ/PQ', department: 'Engineering', category: 'Qualification', status: 'under_review' as const },
    { title: 'Water System Testing', department: 'QC', category: 'Testing', status: 'approved' as const },
    { title: 'Vendor Qualification', department: 'QA', category: 'Vendor Mgmt', status: 'approved' as const },
    { title: 'Document Control Procedure', department: 'QA', category: 'Documentation', status: 'approved' as const },
    { title: 'Change Control Management', department: 'QA', category: 'Quality System', status: 'draft' as const },
    { title: 'Out-of-Specification Investigation', department: 'QC', category: 'Investigation', status: 'approved' as const },
    { title: 'Cleaning Validation', department: 'Manufacturing', category: 'Validation', status: 'approved' as const },
    { title: 'Product Complaint Handling', department: 'QA', category: 'Quality System', status: 'under_review' as const },
  ];

  for (let i = 0; i < sopData.length; i++) {
    const s = sopData[i];
    const sopCode = `SOP-${String(i + 1).padStart(4, '0')}`;
    const effectiveDate = subMonths(NOW, rand(3, 18));
    const reviewDate = addMonths(effectiveDate, rand(12, 24));

    try {
      await prisma.sop.upsert({
        where: { sopCode },
        update: {},
        create: {
          sopCode, ...s,
          version: `${rand(1, 3)}.${rand(0, 2)}`,
          effectiveDate, reviewDate,
          ownerName: pick(['Dr. Priya Nair', 'Vikram Mehta', 'Sneha Patel', 'Arjun Sharma']),
          ownerId: pick([qa.id, labHead.id, analyst.id]),
          description: `Standard operating procedure for ${s.title.toLowerCase()} in compliance with current GMP requirements.`,
        },
      });
    } catch {}
  }
  console.log(`  ✓ ${sopData.length} SOPs created`);

  // ── 11. Batch Records — weekly over 12 months ──────────────────────────────
  console.log('Creating batch records...');
  const batchProducts = ['Metformin 500mg', 'Amlodipine 5mg', 'Atorvastatin 10mg', 'Paracetamol 650mg', 'Omeprazole 20mg', 'Lisinopril 10mg'];
  const stages = ['Granulation', 'Blending', 'Compression', 'Coating', 'Packaging', 'Final QC'];
  let batchCount = 0;

  for (const monthDate of monthRange) {
    const batchesPerMonth = rand(6, 12);
    for (let w = 0; w < batchesPerMonth; w++) {
      batchCount++;
      const batchNo = `BT-${String(batchCount).padStart(5, '0')}`;
      const createdAt = new Date(monthDate.getTime() + rand(0, 28) * 86400000);
      const yieldPct = randFloat(94.0, 98.5);
      const isOnHold = Math.random() < 0.08;
      const isReleased = !isOnHold && createdAt < subMonths(NOW, 0);

      try {
        await prisma.batchRecord.upsert({
          where: { batchNo },
          update: {},
          create: {
            batchNo,
            labId: labs[pick(['LAB-0001', 'LAB-0002', 'LAB-0004'])].id,
            product: pick(batchProducts),
            stage: pick(stages),
            quantity: rand(100, 500),
            unit: 'kg',
            yield: rand(95, 490),
            yieldPct,
            qcResult: isOnHold ? 'OOS — Under Investigation' : 'Complies',
            status: isOnHold ? 'qc_hold' : isReleased ? 'released' : 'in_progress',
            releaseDate: isReleased ? addDays(createdAt, rand(3, 8)) : undefined,
            ownerName: pick(['Vikram Mehta', 'Sneha Patel', 'Dr. Priya Nair']),
            ownerId: pick([labHead.id, analyst.id, qa.id]),
            qcValues: {
              assay: randFloat(98.5, 102.0),
              dissolution: randFloat(82, 99),
              hardness: randFloat(7, 12),
              disintegration: rand(5, 15),
            },
            createdAt,
            updatedAt: createdAt,
          },
        });
      } catch {}
    }
  }
  console.log(`  ✓ ${batchCount} batch records created`);

  // ── 12. Test Requests — monthly ────────────────────────────────────────────
  console.log('Creating test request records...');
  const testTypes = ['HPLC Assay', 'Dissolution Testing', 'Microbial Limit', 'Heavy Metals', 'Residual Solvents', 'Content Uniformity', 'Stability Testing', 'GC Analysis'];
  const priorities: Array<'low' | 'medium' | 'high' | 'urgent'> = ['low', 'medium', 'high', 'urgent'];
  const statuses: Array<'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled'> = ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'];
  let reqCount = 0;

  for (const monthDate of monthRange) {
    const reqPerMonth = rand(8, 20);
    for (let r = 0; r < reqPerMonth; r++) {
      reqCount++;
      const requestCode = `TR-${String(reqCount).padStart(5, '0')}`;
      const createdAt = new Date(monthDate.getTime() + rand(0, 28) * 86400000);
      const labCode = pick(['LAB-0005', 'LAB-0006', 'LAB-0007', 'LAB-0008']);
      const isQ1orQ3 = [0, 1, 2, 6, 7, 8].includes(monthDate.getMonth());
      const quote = rand(isQ1orQ3 ? 25000 : 10000, isQ1orQ3 ? 150000 : 80000);

      try {
        await prisma.testRequest.upsert({
          where: { requestCode },
          update: {},
          create: {
            requestCode,
            labId: labs[labCode].id,
            testType: pick(testTypes),
            product: pick(batchProducts),
            batchNo: `BT-${String(rand(1, batchCount)).padStart(5, '0')}`,
            priority: pick(priorities),
            status: createdAt < subMonths(NOW, 1) ? pick(['completed', 'completed', 'completed', 'in_progress']) : pick(statuses),
            dueDate: addDays(createdAt, rand(7, 30)),
            quote,
            currency: 'INR',
            description: `${pick(testTypes)} required for batch release per ICH guidelines.`,
            createdById: pick([admin.id, qa.id, labHead.id]),
            createdAt,
            updatedAt: createdAt,
          },
        });
      } catch {}
    }
  }
  console.log(`  ✓ ${reqCount} test requests created`);

  // ── 13. Documents ───────────────────────────────────────────────────────────
  console.log('Creating documents...');
  const docTypes = ['Protocol', 'SQA', 'Training Record', 'Validation Report', 'Analytical Method', 'Specification', 'Certificate', 'Policy'];
  const docDepts = ['QA', 'QC', 'Manufacturing', 'Regulatory', 'R&D', 'Stability'];
  for (let i = 1; i <= 25; i++) {
    const docCode = `DOC-${String(i).padStart(4, '0')}`;
    try {
      await prisma.document.upsert({
        where: { docCode },
        update: {},
        create: {
          docCode,
          title: `${pick(docTypes)} — ${pick(batchProducts).split(' ')[0]} ${rand(2024, 2026)}`,
          type: pick(docTypes),
          department: pick(docDepts),
          version: `${rand(1, 3)}.${rand(0, 2)}`,
          status: pick(['approved', 'approved', 'approved', 'under_review', 'draft']),
          tags: pick([[docTypes[0], docDepts[0]], ['GMP', 'QA'], ['ICH', 'Stability']]),
          ownerName: pick(['Dr. Priya Nair', 'Vikram Mehta', 'Sneha Patel', 'Arjun Sharma']),
          ownerId: pick([qa.id, labHead.id, analyst.id]),
          fileFormat: pick(['PDF', 'DOCX', 'XLSX']),
          fileSize: rand(50000, 5000000),
          uploadedAt: subMonths(NOW, rand(1, 12)),
        },
      });
    } catch {}
  }
  console.log(`  ✓ 25 documents created`);

  // ── 14. Integrations ────────────────────────────────────────────────────────
  console.log('Creating integration records...');
  const integrations = [
    { name: 'SAP ERP', type: 'ERP', description: 'Procurement and batch record sync with SAP S/4HANA', dataFlow: 'Bidirectional', status: 'connected' as const, connectedAt: subMonths(NOW, 8) },
    { name: 'Waters LIMS', type: 'LIMS', description: 'Instrument data push from Waters LIMS to Quantum Kairoz', dataFlow: 'Inbound', status: 'connected' as const, connectedAt: subMonths(NOW, 10) },
    { name: 'Agilent OpenLab', type: 'Instrument', description: 'Direct instrument data integration for HPLC/GC', dataFlow: 'Inbound', status: 'in_progress' as const },
    { name: 'Veeva Vault', type: 'DMS', description: 'Regulatory document sync with Veeva Vault', dataFlow: 'Outbound', status: 'planned' as const },
    { name: 'Power BI', type: 'Analytics', description: 'Executive dashboard reporting export', dataFlow: 'Outbound', status: 'planned' as const },
    { name: 'DocuSign', type: 'eSignature', description: 'Electronic signature integration for approvals', dataFlow: 'Bidirectional', status: 'in_progress' as const },
  ];

  for (const intg of integrations) {
    try {
      await prisma.integration.create({ data: intg });
    } catch {}
  }
  console.log(`  ✓ ${integrations.length} integrations created`);

  // ── 15. Analytics Snapshots — 12 months ────────────────────────────────────
  console.log('Creating analytics snapshots...');
  for (const monthDate of monthRange) {
    const month = monthDate.getMonth() + 1;
    const year = monthDate.getFullYear();
    const qualityScore = randFloat(78, 96);

    try {
      await prisma.analyticsSnapshot.upsert({
        where: { month_year: { month, year } },
        update: {},
        create: {
          month, year,
          qualityScore,
          capaResolutionDays: randFloat(12, 28),
          certComplianceRate: randFloat(82, 98),
          totalBatches: rand(8, 15),
          releasedBatches: rand(6, 12),
          holdBatches: rand(0, 3),
          testRequestCount: rand(10, 22),
          testRequestValue: rand(300000, 1500000),
        },
      });
    } catch {}
  }
  console.log(`  ✓ ${monthRange.length} analytics snapshots created`);

  // ── 16. Notifications for admin ────────────────────────────────────────────
  const notifTypes: Array<'cert_expiry_critical' | 'cert_expiry_warning' | 'capa_deadline_critical' | 'capa_overdue' | 'system'> = [
    'cert_expiry_critical', 'cert_expiry_warning', 'capa_deadline_critical', 'capa_overdue', 'system',
  ];
  for (let i = 0; i < 8; i++) {
    const type = pick(notifTypes);
    await prisma.notification.create({
      data: {
        userId: admin.id,
        type,
        title: type === 'cert_expiry_critical' ? 'NABL Cert expiring in 3 days'
          : type === 'capa_overdue' ? 'CAPA-0012 is overdue'
          : 'System notification',
        message: 'Please review and take action',
        isRead: i > 5,
      },
    });
  }

  console.log('\n✅  Seed complete!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔐  Default credentials:');
  console.log('    Admin:      admin@forgequantum.com / Admin@123');
  console.log('    QA Dir:     qa@forgequantum.com / Admin@123');
  console.log('    Lab Head:   labhead@forgequantum.com / Admin@123');
  console.log('    Analyst:    analyst@forgequantum.com / Admin@123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
